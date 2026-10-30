# AUDIT TOÀN DỰ ÁN + PLAN V2 + KẾ HOẠCH BETA 1 TUẦN + CHIẾN LƯỢC TRAFFIC

> Ngày: 31/10/2026. Phạm vi: toàn repo (frontend Next.js 16, Supabase migrations, ai-service FastAPI, PayOS/SePAY, marketplace, whiteboard, labs).
> Phương pháp: audit tĩnh read-only theo trust boundary (auth/RLS, payment/credits, API/input, ai-service/deploy). Không probe production, không sửa code.

**Kết luận đặt lên đầu:** sản phẩm đã đi xa hơn dự kiến nhưng có nhiều lỗ hổng bảo mật phải vá trước khi mời người dùng ngoài vào beta. Chi phí vá thấp, nhưng bắt buộc làm trước D-0.

---

## 1. BẢN ĐỒ HIỆN TRẠNG

| Mảng | Trạng thái | Điểm mạnh | Điểm yếu chính |
|---|---|---|---|
| Soạn đề AI | hoàn thiện nhất: 3 đường LLM + RPC atomic + auth | có balance check trước khi gọi LLM; có fallback provider | rate limit theo header x-forwarded-for (spoof được); TOCTOU giữa check và deduct; AI trả lỗi vẫn tính tiền |
| Chấm bài | MCQ + essay + OMR + camera remote | route chính có auth + rate limit | `/api/grading/omr` không auth; poll khớp PIN 4 số và tiêu thụ destructive; IDOR submissions |
| Payment | PayOS verify HMAC chuẩn (điểm sáng) | giá lấy từ catalog server-side | webhook double-credit; tier gán theo description/rawAmount; không có ngày hết hạn gói |
| Ví & credits | CHECK balance >= 0, RPC atomic | txn ledger bất biến qua RLS | RPC deduct thiếu auth.uid() check (Critical); marketplace buy/payout nuốt lỗi RLS |
| Marketplace | migration 30/10 xong | flow đầy đủ | anon SELECT thấy toàn bộ exam_data; thiếu bảng purchases/payouts trong migrations |
| Bảng trắng / Labs / Teach mode | chạy tốt, có plan riêng trong `docs/Whiteboard_Enhancement_Plan.md` | Teach mode + overlay 3D | `IS_BETA_ALL_FEATURES_UNLOCKED = true` hardcode; tier gate phía server mỏng |
| ai-service FastAPI | dual-agent verifier + gateway | key đọc từ env | INTERNAL_API_KEY fail-open và chưa set; `/debug-gemini` đốt quota; prompt injection không có fencing; không timeout/cap tokens |
| Vận hành | .env không vào git (tốt, đã kiểm git history) | vậy | secret thật nằm trong .env máy dev (service-role, Gemini, PayOS, Google OAuth) - cần rotate; không có Dockerfile/deploy docs; rate limiter in-memory |
| Quản trị | users.role có 'admin' | vậy | chưa có bất kỳ path admin nào; payout_requests không ai duyệt được |

Cần xác minh với môi trường thật (needs_validation):
1. Migration `20261026_harden_rls_security.sql` đã chạy trên Supabase prod chưa (mọi nhận định về state ví phụ thuộc nó).
2. `INTERNAL_API_KEY` đã set chưa (FastAPI hiện fail-open).
3. `SEPAY_API_KEY`, `PAYOS_*` đã set chưa.
4. `NODE_ENV=production` và `ENABLE_MOCK_PAY` trên môi Deploy.
5. Supabase có bật email confirmation khi signup không (ảnh hưởng rủi ro referral farm).
6. Storage bucket policies cho avatars và ảnh bài nộp (nằm trong dashboard, không trong migrations).

---

## 2. FINDINGS BẢO MẬT. SẮP XẾP THEO MỨC ĐỘ

Mỗi finding có file:line trong báo cáo chi tiết của nhánh audit; dưới đây là bản rút gọn dùng cho hành động.

### TODO 1 - CRITICAL, vá trước beta

S1. RPC `deduct_user_credits` - mọi user đăng nhập có thể RÚT CON CẠN VÍ bất kỳ user khác.
Vị trí: `supabase/migrations/20261026_harden_rls_security.sql` (hàm SECURITY DEFINER nhận p_user_id tùy ý, GRANT cho authenticated).
Fix nhỏ: đầu hàm thêm check `IF p_user_id IS DISTINCT FROM auth.uid() AND current_user <> 'service_role' THEN RAISE EXCEPTION 'forbidden';`

S2. `marketplace_items` RLS cho anon SELECT toàn bộ `exam_data` (đáp án + giải chi tiết).
Vị trí: `supabase/migrations/20261030_marketplace.sql` policy published. API có lọc nhưng DB không - chỉ cần gọi thẳng Supabase REST là thấy hết.
Fix: tách `exam_data` sang `marketplace_item_data` chỉ đọc được cho seller và buyer verified; hoặc dùng view security-barrier.

S3. Remote camera grading - poll khớp "token HOẶC PIN 4 chữ số", không rate limit, chưa auth, và `consumePendingSubmissions` xóa bài sau khi đọc. Kết quả: đoán PIN (10.000 giá trị) sẽ đọc + phá các phiên của giáo viên khác, từ đó thấy ảnh bài nộp (PII) và forge điểm.
Vị trí: `lib/grading/remote-cam-store.ts` (falling back to PIN), `api/grading/remote-session/poll/route.ts` (no limiter), `create/route.ts` (userId "guest_teacher").
Fix: poll / submit-photo / report-result chỉ chấp nhận token full; PIN chỉ dùng ở /connect; create yêu cầu login; limiter cho poll; bỏ guest_teacher.

### TODO 2 - HIGH, vá trước beta

S4. IDOR: đọc toàn bộ submissions của GV khác theo sessionId (store không filter owner).
Vị trí: `lib/grading/student-submission-store.ts` hàm getStudentSubmissionsBySession.
Fix 1 dòng: thêm tham số userId và lọc theo link owner.

S5. `/api/grading/omr`: không auth, không rate limit, không size cap, và có đường fallback gọi Gemini Vision (tốn tiền thật).
Vị trí: `api/grading/omr/route.ts`.
Fix: thêm getUser() 401 + reuse checkGradingRateLimit + cap base64 ~4MB + whitelist action.

S6. FastAPI `INTERNAL_API_KEY` fail-open và chưa cấu hình - mọi router LLM/OMR chỉ có gate này.
Vị trí: `ai-service/app/core/dependencies.py`, `config.py`.
Fix: fail-closed (403 khi key không set); set key trong cả 2 env.

S7. Marketplace buy/payout ghi sổ qua client-session `wallets.update` - hiện bị RLS từ chối âm thầm, route vẫn trả success. Kết quả thực tế trên DB-backed deploy: mua đề không trừ tiền, seller không nhận tiền.

Vị trí: `api/marketplace/buy/route.ts`, `payout/route.ts` các đoạn catch và nuốt error.
Fix: biến động ví đi qua RPC SECURITY DEFINER (`grant_user_credits`), kiểm tra kết quả, fail loudly; bỏ các silent catch.

S8. Webhook PayOS/SePAY cộng credit non-atomic (read-modify-write) - 2 webhook tới gần nhau sẽ cộng 2 lần. Lỗi nuốt khi insert làm mất vết sổ giao dịch.
Vị trí: `payment/webhook/payos/route.ts` và `sepay/route.ts` đoạn cập nhật ví.
Fix: claim trước khi cộng: update có điều kiện (equals status pending, and return the number of updated rows), cộng credit trong một Postgres function `fulfill_order(order_code, txn_id)` với unique constraint cho `sepay_txn_id`.

S9. Tier gán "max"/"pro" theo rawAmount hoặc description của giao dịch chuyển khoản (nội dung chứa chữ "MAX"/"PRO" trong transfer text). Không có expires_at cho gói - một lần trả là lifetime Pro.
Vị trí: `payment/webhook/payos/route.ts` các nhánh tier.
Fix: chỉ grant theo `order` + pricing catalog; thêm `expires_at` và scheduled downgrade.

S10. `isRealPayingUser()` tin vào `preferences.subscription_tier` / `user_metadata` (một user tự sửa được) và có whitelist email/UUID hardcode - quyết định server-side paid-key routing.
Vị trí: `lib/payment/plans.ts`.
Fix: chỉ đọc `profile.tier` (được bảo vệ bằng trigger từ migration 26/10); xóa mọi check metadata/preferences/email/UUID.

### TODO 3 - MEDIUM, xử lý trong V2 (không chặn beta nhưng không chậm)

S11. `IS_BETA_ALL_FEATURES_UNLOCKED = true` hardcode - chuyển thành env flag + server gate cho các tính năng " Max-only".
S12. Generate-then-deduct + TOCTOU: N request đồng thời chạy trước khi deduct; fallback ghi đè `balance` bằng service-role có thể phá state ví. Fix: deduct (reserve) trước AI, refund khi fail, xóa fallback write.
S13. SSRF còn khe: decimal/hex/octal IPv4, IPv6 unique-local/link-local, DNS rebinding. Fix: resolve DNS trước, valida toàn bộ resolved IP, chỉ cho fetch tới public IP.
S14. `new Function("x", return + expr)` chạy JS từ dữ liệu AI lưu trong config - fix bằng expr-eval / whitelist schema.
S15. Prompt injection: nội dung user/URL đưa vào prompt không có delimiter "dữ liệu không phải chỉ thị" + `additional_context` không giới hạn độ dài. Fix: wrap cẩn thận + cap 2000 chars.
S16. SePay auth dùng `.includes()` và không dedup `sepay_txn_id`. Fix: exact-match + unique index.
S17. `marketplace_purchases` và `payout_requests` không tồn tại trong bất kỳ migrations nào - hiện chỉ nằm RAM. Ngoài ra payment fallback store chỉ RAM → webhook trên server khác không tìm thấy order. Fix: migration đầy đủ + refuse payments khi DB insert lỗi (trả 503, thay vì fallback).
S18. Cost control: thiếu `AbortSignal.timeout` ở hầu hết fetch BFF-FastAPI/Google; một nhánh Gemini thiếu `maxOutputTokens`; không có daily spend ceiling. Fix bổ sung từng nơi.
S19. Daily quota có trong schema nhưng chưa được enforce; IP limiter dùng header client-spoofable. Fix: enforce trong RPC + dùng header IP platform thật.
S20. Error messages được leak ra client ở nhiều route; FastAPI public `/docs`, `/redoc`, `/debug-gemini` trả prefix API key; QR server bên thứ 3 nhận token URL. Fix: strip error internals + set keys server-only, disable `/debug-gemini` trong production; sinh QR local.
S21. Secret nhận dạng production nằm trong `.env` máy dev (Supabase service-role, Gemini, PayOS keys, Google OAuth client secret). Đã kiểm: không commit vào git. Fix: rotate chúng, đặc biệt Service-Role và OAuth secret sau khi beta; check file `GG_Console_Client secret` trái tên trong `ai-service/.env` không thể load có pydantic.

---

## 3. PLAN V2 - 4 SPRINT

Sprint V2.1 = tuần chuẩn bị Beta (S1-S10 + rotate + smoke test). Sau đó 3 sprint theo thứ tự.

### Sprint V2.1 - Bảo mật (trước beta)
1. Fix S1 + regression test (tạo 2 user, gợi tổng kết: caller khác giác p_user_id, phải fail).
2. Fix S2 (migration tách bảng + đổi_buy/clone flow).
3. Fix S3 / S4 / S5 / S6 (token-only + auth + rate limit + size cap; FastAPI fail-closed).
4. Fix S7 + S8 (vi sổ qua RPC; webhook atomic claim; bảng orders/payout có migration).
5. Fix S9 + S10 (tier từ catalog order + expires_at; clean tier routing).
6. rotate S21 secrets; smoke test 5 luồng chính: signup - soạn đề - chấm - ví/buy đề marketplace - whiteboard.

### Sprint V2.2 - Bền tệ kỹ thuật (tuần 2)
1. DB-backed stores: remote_sessions, student_links chuyển vào Postgres (heavily RLS) thay vì in-memory Maps.
2. Rate limiter trung tâm: dùng IP platform thật, lưu trên DB/Redis; áp mọi AI/payment/grading route.
3. Bảng admin v0: policy `is_admin()` dựa trên JWT claim; UI duyệt payout_requests, moderation marketplace.
4. Payment hoàn chỉnh: thêm expires_at + cron downgrade + webhook idempotent + escrow payout.
5. Fix S13 SSRF, S14 expr parser, S15 prompt fencing.
6. Sentry + "báo lỗi đề"/"báo lỗi chấm" (in-app feedback).

### Sprint V2.3 - Chất lượng giáo viên (tuần 3)
1. Onboarding tour + 1 đề template "dùng ngay" sau signup.
2. Kho ma trận GDPT 2018 theo môn lớp (download miễn phí làm mồi SEO).
3. Xuất Word: đối chiếu 1-1 với GV thật (đúng chuẩn 40 câu + ma trận), chỉnh từng bước cho khớp.
4. Preview xác minh trước khi tính credit: cho thấy lỗi render công thức/hình trước khi trừ tiền.
5. Whiteboard W-1/W-2 (thumbnail, STEM 20-25 khuôn, trình chiếu + laser, KaTeX insert).

### Sprint V2.4 - Marketplace & AI (tuần 4)
1. Marketplace repair full: purchases/payouts bảng thật, escrow 10% commission, rating cơ bản.
2. AI suggest từ "bảng trắng" → sinh đề lạnh của bảng trắng này (Owner plan).
3. Dashboard analytics cho GV: số đề đã tạo, số bài chấm, thời gian tiết kiệm - dùng làm "bằng chứng năng lực" trong profile GV.
4. Mobile: mobile-scanner ổn định trên Android/iOS thật.

---

## 4. KẾ HOẠCH BETA - 1 TUẦN, FULL FEATURES, GIỚI HẠN API KEY

### 4.1 Nguyên tắc của beta
Mở toàn bộ tính năng 1 tuần nhưng không đốt cháy key AI. Cách an toàn nhất: Beta là một "tier beta" có server-enforced quota, budget cap provider-side và kill-switch. Không mở đăng ký công khai: dùng invite code.

### 4.2 Thiết lập cần có
1. `BETA_MODE=true` + `BETA_END_DATE` - hết hạn tự chuyển về Free tự động.
2. Tạo riêng **`GEMINI_API_KEY_BETA`** (key khác key prod). Đặt hard quota ở Google AI Studio dashboard: requests/min, requests/day, monthly budget cap. Đây là lớp phòng hộ cùng nhất.
3. Provider fallback: nếu Gemini 429/quota → chuyển về DeepSeek key (gateway đã có router sẵn), để trải nghiệm không đứt.
4. Daily spend ceiling server-side: đọc từ `/ai/usage`, check trong `gateway.generate`; vượt mức đặt trước thì 503 cho panel sinh đề/chấm, hiện banner "đã đạt hạn mức beta hôm nay".
5. Per-user quota server-enforced: dùng cột daily_quota hiện có, enforce trong RPC deduct: beta đặt cụ thể: 20 đề/ng/user, 10 bài chấm/ng/user, 30 phút remote session/ng.
6. Reject guests: đóng S3/S5/S16 trước beta (auth cho create omr/remote session; user token chấm bài đặc thù).
7. Kill-switch env: `AI_MAINTENANCE=true` - 503 cho toàn panel AI, banner thông báo rõ.
8. Log chi phí + cập bảng hôm nay / tổng (qua `/ai/usage`).

### 4.3 Lịch beta (7 ngày)
| Ngày | Công việc |
|---|---|
| D-2 → D-1 | Hoàn thành Sprint V2.1 (S1-S10), rotate secrets, smoke test prod-like |
| D0 | Mời 20-30 GV "seed" (từ nhóm FB GV), mở banner BETA + form feedback trong app |
| D1-D5 | GV dùng đủ luồng: soạn đề, chấm, bảng trắng, lab 3D; theo dõi 3-5 GV mỗi ngày qua chat |
| D3 | Fix bug urgent trong 24h; kiểm quota/spend hàng ngày |
| D6 | Phỏng vấn exit JTBD (top-3 pain, 10 phút mỗi GV) |
| D7 | Tổng kết: retention, time saved, số đề/chấm, spend AI, bug list; chốt mở public hay kéo dài beta |

### 4.4 Quyền lợi beta
- Đăng ký qua **invite code** (beta list), chưa mở public signup - giảm rủi ro đốt key.
- Tặng sẵn **50.000 - 100.000 credits beta miễn phí** → GV dùng thoải mái mà không cần PayOS, vẫn trải nghiệm credit economics thực.
- Nhận Pro miễn phí khi hết beta: điều kiện là chia sẻ 1 bài trên nhóm FB + tham gia phỏng vấn 10 phút.
- Lỗi được fix ưu tiên + cộng credits bổ sung.

### 4.5 Chỉ số beta cần đạt
- 30+ GV active, 40% quay lại trong 3 ngày.
- 20+ lần dùng bảng trắng / 10+ lần mở lab 3D trên lớp.
- Spend AI trong quota cap; 0 finding bảo mật mới nghiêm trọng xuất hiện.
- 3 pain chính được ghi rõ từ phỏng vấn GV.

---

## 5. CHIẾN LƯỢC THU HÚT TRAFFIC

### 5.1 Định vị câu nói
"EduTest AI - ra đề, chấm bài, giảng bài trên cùng một nền tảng dành cho giáo viên Việt Nam. Đề chuẩn Bộ GD&ĐT (dùng được ngay khi in), chấm cả bài viết tay, miễn phí tính năng giảng (bảng trắng + phòng lab 3D)."

Tính năng free làm bait: lab 3D, bảng trắng (giảng), preview xuất Word mẫu. Không đặt sau paywall các feature chính giảng bài.

### 5.2 Kênh (4 kênh chính)

K1 - Facebook giáo viên (kênh số 1 cho GV VN):
1. Video demo 60-90s "ra đề 40 câu Toán đủ hình công thức + chấm 40 bài viết tay trong 5 phút" - đây là thứ GV tự chia sẻ cho nhau trên FB (nay là điểm khác biệt duy nhất không ai có).
2. Post vào các nhóm lớn: Cộng đồng Giáo viên THPT, Chia sẻ tài liệu GV, nhóm "chợ giáo viên"; nội dung: "dùng thử beta miễn phí + cùng đóng góp feedback".
3. Group kín riêng "GV Beta EduTest AI" để hỗ trợ + thu feedback trực tiếp - invite code là "vé vào".
4. Ads FB tiềm ẩn: chỉ chạy khi video demo organically chứng minh conversion tốt (ngân sách thử 500k-1000k VND).

K2 - SEO / nội dung (đóng dài hạn):
- Landing pages theo từ khóa GV hay tìm: "ma trận đề kiểm tra Toán 7", "tạo đề kiểm tra 45 phút", "chấm bài trắc nghiệm tự động", "xuất Word đề thi chuẩn cấu trúc 2026-2027". Mỗi trang có demo tạo đề trực tiếp.
- Google Search Console + sitemap bật ngay sau beta, trước "mùa đề" (tháng 11-12 và tháng 4-5).

K3 - Tính năng free làm mồi inbound:
- Phòng TN 3D + Bảng trắng public với trang chia sẻ link (whiteboard W-3): mỗi bảng GV tạo ra có URL riêng, phần ghi nguồn/Twig gắn thương hiệu "EduTest AI".
- Mini tool không cần đăng nhập: "tạo 1 đề trắc nghiệm 10 câu + xuất Word" - capture traffic SEO + giảm friction.

K4 - Partner & referral:
- Referral GV mời GV (DB có sẵn code nhưng cần hoàn tất fix S7) - tặng "credits đề" thay vì VND, tránh cảm giác "dú lọc".
- Làm việc với 2-3 KOL giáo viên có follow lớn trong nhóm FB dạy học: chỉ 1 demo + dùng thật, không mua reviews.

### 5.3 KPI theo thời gian

| Metric | Beta (1 tuần) | Tháng 1 sau beta | Tháng 3 |
|---|---|---|---|
| GV đăng ký (email xác thực) | 30-50 | 150 | 500 |
| GV WAU (itative ít nhất 1 hành động/tuần) | 20 | 60 | 200 |
| Đề tạo / tuần | 60 | 300 | 1200 |
| Bài chấm AI / tuần | 100 | 600 | 2500 |
| Conversion Free-Pro | - | 5 GV | 20 GV |
| Visitor organic | - | 500 | 2000 |

### 5.4 Những điều cần tránh
- Không spam link vào nhiều nhóm GV - bị remove, mất uy tín. Chỉ post 2-3 nhóm có tương tác thật.
- Không mua user/review ảo - tài khoản rác đốt quota AI, rủi ro referral farm.
- Không phóng đại "AI 100% chính xác" - chất lượng đề GV dùng thật là chuẩn duy nhất; đặt kỳ vọng "đề tốt hơn 90%, chỉnh sửa cuối vẫn thuộc về GV".
- Beta không đặt mục tiêu doanh thu: mục tiêu là tạo chứng nhận giảng bài và thu data. Doanh thu là chuyện sau beta.

---

## 6. CHECKLIST HÀNH ĐỘNG NGAY (theo thứ tự)

1. Vá S1-S3 ngay hôm nay (SQL + policy + token-only flow).
2. Vá S4-S10 trong 2 ngày tiếp (webhook atomic, các sổ ví server-side, clean tier routing).
3. Rotate S21 secrets trước khi deploy beta (Xác reach v Supabase, Gemini, PayOS).
4. Bật BETA_MODE + key pool riêng + quota server-enforced.
5. Chuẩn bị video demo 60-90s (K1) + form feedback trong app.
6. Test 5 luồng chính trên deploy thật trước khi gửi invite đầu tiên.
