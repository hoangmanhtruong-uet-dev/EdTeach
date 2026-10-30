# PLAN — HOÀN THIỆN CHỢ ĐỀ THI (MARKETPLACE)

> Ngày: 31/10/2026. Trạng thái: **PLAN ONLY — chưa viết code.**
> Phạm vi: toàn bộ tính năng Chợ đề thi — trang `/marketplace`, API `/api/marketplace/**`, schema Supabase, luồng mua/bán/rút tiền, đánh giá, quản trị.
> Plan này bắt buộc đọc kèm `docs/Audit_Report_and_V2_Plan.md`: các finding S2 (exam_data lộ cho anon), S7 (wallet update bị RLS nuốt), S10/S11 (tier) nằm trong Sprint V2.1 — MP plan hiện thực hóa và mở rộng phần marketplace của các finding đó.

---

## 1. MỤC TIÊU

Một câu: **"Chợ đề thi là nơi GV bán được tiền thật từ chính đề mình soạn — mua 1 chạm, bán 1 chạm, không rào cản."**

Ba trụ nâng:
1. **Nền tảng dữ liệu đúng**: mọi biến động ví/purchase/payout phải bền vững qua restart, kiêm không một lỗ hổng nào cho phép mua trắng hoặc mất tiền lặng lẽ.
2. **Niềm tin**: review/rating thật, xem trước trung thực, đạng có moderator — chợ không có niềm tin thì không ai bán.
3. **Sức hút bán**: checklist đăng bán (dùng được ngay), suggested price, dashboard bán hàng, khuyến khích seed bài đầu tiên.

---

## 2. HIỆN TRẠNG (audit code 31/10/2026)

Trang duy nhất `frontend/src/app/(dashboard)/marketplace/page.tsx` (1.779 dòng, 7 modal: list/preview/buy/sell/payout/import-URL/success). Khung UI đã có — vấn đề không nằm ở trang, nằm ở **lớp lưu trữ + server logic**.

### 2.1 Những chỗ đang "dang dở" nghiêm trọng (sắp xếp theo mức chặn quý trình)

| # | Vấn đề | Bằng chứng | Hệ quả |
|---|---|---|---|
| U1 | **Persist Supabase toàn bộ SAI**: code tự sinh ID chuỗi `mk-…`/`pur-…`/`payout-…` nhưng PK trong DB là `UUID` → mọi INSERT đều fail, nằm lặng trong `catch {}` | `items/route.ts:192→231`, `buy/route.ts:141→155`, `payout/route.ts:162→178` | Marketplace thực chất chỉ chạy trên **RAM của server**; restart = mất listing/mua/kỹ lưỡng |
| U2 | **Purchases & payout chỉ nằm RAM** (global Map/array) | `marketplace-store.ts:17-19` | "Đã sở hữu" bay theo restart; nhau qua nhiều instance khác nhau có thể không thấy cùng lượt mua |
| U3 | **Split-brain DB vs RAM**: list đọc DB nhưng detail/buy/clone chỉ đọc RAM → item từ DB **404 khi mua** | `items/route.ts:35-48` vs `items/[id]/route.ts:14`, `buy/route.ts:28`, `clone-to-studio/route.ts:27` | Chợ hiện ra danh sách đề nhưng nhấp vô là chết |
| U4 | **Payout dead-end**: tạo payout `status:"pending"`, không có gì đặt `completed` bao giờ; wallet bị trừ trước khi có bền vững hồ sơ | `payout/route.ts:141-181` | GV có thể **mất ví tiền vĩnh viễn** sau restart; không ai đ/c orphan |
| U5 | **Mua trực tiếp ghi sổ `wallets.update` + `wallet_txns.insert` bằng anon key → bị RLS từ chối, trả về `success:true`** | `buy/route.ts:89-137` | Mua không trừ tiền, seller không nhận — vi phạm nghiêm trọng nhất cho tiền (audit S7) |
| U6 | **exam_data (đáp án + lời giải) đọc được bởi anon ngay bên trong DB** (RLS cột published) — API có lọc nhưng gọi Supabase REST thẳng nữa là thấy (audit S2) | `20261030_marketplace.sql:56-57,19` | Lễ đáp án toàn bộ listing |
| U7 | **MAX tier commission phiên bản giả**: UI hứa "sàn thu 5% MAX" nhưng type chỉ có `free/pro`, route chỉ tính 10/20% | `types/marketplace.ts:38` vs `page.tsx:1409-1414`, `buy/route.ts:84-86` | Hứa ruột — người dùng MAX tin là lãi 95% nhưng thực tế chỉ nhận 80% |
| U8 | **Không flows quản trị/moderation**: auto-publish, không admin, không duyệt payout, không report listing | `items/route.ts:206` | Hạ chất lượng chợ + chậm đãi vi phạm |
| U9 | **Không review/rating thật**: `rating` hardcode 5.0, `review_count` = 0, không table | `items/route.ts:204-205` | Social-proof bịa — chậm niềm tin |
| U10 | **Clone-to-studio trả ID giả** `exam-cloned-<ts>` khi DB fail, UI redirect tới trang không tồn tại | `clone-to-studio/route.ts:65,95-99` | Mua xong không có gì để dùng |
| U11 | Các vòng nhỏ: preview/matrix stats fabricate; free item ghi is_purchased không có purchase; downloads_count chỉ RAM; không unpublish; không sort/pagination; mua chỉ tăng downloads (không là download thật) | vài vị trí | Chỉ số rác → đło quyết marketing dựa trên nó là sai |
| U12 | Ghi chú bổ sung: migration đã có đủ 3 bảng `marketplace_items/purchases/payout_requests` (20261030) nhưng **purchases không có INSERT policy** và payout_requests không UPDATE policy → kể cả sửa xong format ID (UUID) cũng không write được | `20261030_marketplace.sql:27-49,59-69` |

### 2.2 Nhận xét chiến lược

UI đã dày (7 modal). Việc vá nên **giữ nguyên UI, thay lõi dữ liệu + server**, không phải dựng lại. Mua bán credit trong chợ đúng "mồi" cho hệ kinh tế credit của dự án: người bán là nguồn content chợ, người mua trả bằng credits kiếm được từ AI/daily/referral — vòng lặp nội bộ đẹp, chưa cần VND thật.

---

## 3. THAM CHIẾU TPT (Teachers Pay Teachers)

Đã nghiên cứu ngày 31/10/2026. TPT là chuẩn vàng của market GV (7M+ educator, $2B trả cho sellers).

| TPT có | Bài học cho EdTeach |
|---|---|
| **Store URL riêng cho mỗi seller** (profile, logo, banner, featured 4 sản phẩm) | Nhóm B: seller profile page v2 |
| **2 bậc memship với payout rate khác nhau** (Basic 55% / Exclusive 77.5-80%) + phí giao dịch nhỏ | Đã có tier free/pro (+max) — nhưng phải **làm thật**, không fake; snapshot fee tại thời điểm mua |
| **Review/rating bắt buộc mua mới review được** + **buyer được TPT credits khi để review** → tăng chất lượng | Nhóm C: incentive +100 cr cho review ≥ 60 từ |
| **Wishlist, "Add to cart", store sales (bán thêm)** | Nhóm D: wishlist v0; cart/bundle để sau |
| **Content guidelines + DMCA process** | Nhóm C: flow báo cáo vi phạm (đề chép/stolen) |
| **Advanced analytics + marketing tool** cho Exclusive | Nhóm D: seller analytics v0 đủ dùng |

Mức học: đừng học "paywall thành viên seller" ngay (TPT Basic $29) — **người dùng VN sẽ bay**; giữ 0 phí join, bù lại ở commission.

---

## 4. NHÓM A — SỞ TẤT (Sửa nền tảng dữ liệu) — chặn beta

> MP-1 này thực chất là implement S7/S17 + loại U1-U5, U10, U12. Làm trước mọi tính năng mới; không nhảy cóc qua B/C khi A chưa xong.

- **A1. Single source of truth = Supabase.** Xóa global Map `__marketplaceItems/Purchases/PayoutRequests` (hoặc để lại chỉ làm fallback khi DB unreachable, rõ ràng traceback — không nuốt). Toàn bộ 4 route đọc DB. List cũng DB.
- **A2. UUID thật**: đổi pattern tạo ID: server dùng `crypto.randomUUID()`; giữ slug hiển thị (`marketplace_items.slug` TEXT UNIQUE, ví dụ `on-tap-dao-ham-11`) cho URL đẹp. Migrations: thêm cột slug, match hiện trạng.
- **A3. Sửa RLS purchases/payouts**: INSERT cho buyer (purchases) / seller (payouts của chính mình); UPDATE payouts chỉ cho admin (qua function). (U12).
- **A4. `marketplace_purchase(item_id)` — 1 Postgres function SECURITY DEFINER làm toàn bộ giao dịch trong 1 transaction:**
  1. lock item FOR UPDATE, kiểm `status='published'`, người mua ≠ người bán, chưa từng mua (purchases có UNIQUE (item_id, buyer_id));
  2. debit ví người mua qua phương thức dườm đơn (có check balance >= price);
  3. credit seller `price * (1 - fee_rate)` + ghi `platform_fee`;
  4. INSERT purchases + 2 wallet_txns + UPDATE downloads_count — atomic, idempotent (nếu hàm re-run với buyer đã mua: return existed purchase, không trừ lần hai);
  5. trả về item + purchase. Route chỉ gọi 1 hàm này, fail rõ ràng.
- **A5. Payout flow state machine**: payout INSERT (pending, hold amount ở `pending_payout_credits`) KHÔNG trừ ví trước; admin approve → RPC `complete_payout` (chỉ admin, bằng JWT claim) mới trừ ví + ghi txn; reject → hoàn (nếu có hold). Không có "mất ví lặng lẽ" nữa (khắc phu U4).
- **A6. Sửa S2**: tách nội dung trả phí / đáp án sang bảng `marketplace_item_data` (chỉ seller/buyer-verified đọc được qua function `marketplace_item_read`); `marketplace_items` chỉ giữ preview 2-3 câu (trong `preview_data`, đúng shape {question, options, hint}, không đáp án).
- **A7. Chuẩn response**: trả `success:false` + mã lỗi cụ thể (`INSUFFICIENT_BALANCE`, `ALREADY_OWNED`, `DB_WRITE_FAILED`) — không còn bắt lỗi trong catch rồi trả 200 "thành công" như cũ.
- **A8. Dọn rác cũ**: delete `INITIAL_MARKETPLACE_ITEMS` dead export + code dọn mock có đánh dấu vét cũ; những fixtures nếu cần seed thì đưa vào route seed riêng có guard admin.
- **A9. Clone-to-studio fail ngay khi DB fail** (500 + message ở UI), không trả ID giả; clone ghi `purchases.first_clone_at` để đếm tỷ lệ "mua rồi dùng".

---

## 5. NHÓM B — UI/UX & TRẢI NGHIỆM (giữ 7 modal, bổ sung trang riêng)

- **B1. Trang item detail riêng `/marketplace/[slug]`** (Next.js Server Component): full đề preview, thống kê (lượt mua, rating breakdown), nút "Mua / Tải Word / Clone vào Studio", seller card, danh sách review. Public indexable → SEO cho Google.
- **B2. Trang seller profile `/marketplace/seller/[id]`**: avatar, bio, badge tier, "4 bài hay nhất" (featured), toàn bộ listing active — pattern TPT store 1:1 dùng credits.
- **B3. Danh sách nâng cấp**: sort (mới nhất / giá ↑↓ / rating / lượt mua), pagination hoặc infinite scroll, filter theo loại đề (miễn phí/trả phí, số câu, khôi 10-12 đầy đủ), ô nhập "khối 11 Toán Hàm đạo hàm" (search nâng cao), badge "Đã mua" fix đúng (không đánh dấu free là purchased).
- **B4. Preview trung thực**: hiển thị đúng thuật toán số câu theo từng loại (nếu là ĐE THI 40 câu + ô trống đáp án), nút "Xem trước PDF/Word" cấp 2-3 câu + nhóm câu, không có đóng gói "matrix 2025" tự bịa — chỉ hiện khi đề thật có matrix data.
- **B5. Listing "chờ chất lượng" checklist trước khi publish**: (a) tiêu đề chuẩn (môn + khối + chủ đề), (b) có đáp án cho từng câu, (c) tối thiểu 3 câu preview, (d) chọn khối/môn đúng; nếu thiếu thì hiện trạng "chưa đủ điều đăng" + hướng dẫan 1-nhấp autofix (AI suggest title?). Giảm listing rác, tăng trưởng buyer.
- **B6. Mua flow 1 chạm**: giữ modal mua nhưng hiển thị gồm: giá, số dư ví hiện tại, thiếu bao nhiêu (kèm CTA "Nạp thêm"), confirm nút là 1 action duy nhất. Sau mua: success modal với 3 CTA rõ ràng (Clone vào Studio / Tải Word / Xem listing).
- **B7. Duyệt nội dung mới**: lấy hàng đầu về `{AVG rating, số lượt mua, số câu}` hiển thị trên card — chỉ hiển thị số thật.

---

## 6. NHÓM C — LOGIC / TÍNH NĂNG MỚI

- **C1. Review & rating thật**: bảng `marketplace_reviews` (item_id, buyer_id UNIQUE, rating 1-5, body, created_at); chỉ người ĐÃ MUA mới review (check qua RPC read purchase); item chỉ để hàm đọc tham số `avg_rating, review_count` denormalize; UI review với rating sao. **Incentive theo TPT**: review ≥ 60 từ +100 cr (capped 1/item, chỉ với listing trả phí) — không đừng trầm trọng fake-review bằng cap + chỉ review sau dùng.
- **C2. License model rõ ràng**: thêm `license_type` (`full_clone` mặc định | `view_only`); view_only = buyer xem từ studio chế độ read-only + export Word có footer "Bản quyền: Tên Seller · Mua trên Chợ đề thi EduTest" — không thể clone chỉnh sửa. Full clone giữ nguyên như hiện (footer credit + note "from Seller" thêm vào phần header khi bản Word). Lencias ghi vào purchases.
- **C3. Commission đúng thật**: `fee_rate` snapshot tại thời điểm bán theo tier thực của seller (free 20% / pro 10% / max 5% khi S10 fix tier xong); cột `platform_fee_rate` trong purchases; UI và route dùng chung 1 nguồn.
- **C4. Draft → Published → Archived**: item POST tạo `status:"draft"`; route `PATCH /items/[id]` (chấp nhận hành động publish/unpublish/archive), delete mềm; UI "Của tôi" hiển thị cả draft. Chợ không ép seller publish ngay.
- **C5. Giá thông minh (suggested price)**: hàm client đề xuất `max(100, question_count * 10 + (tự có đáp án ? 50 : 0))` credits tại sell modal; giữ quyền tự chỉnh. Số 1 cr = 100 ₫ giữ nguyên để hiện tỷ lệ "50.000 đ = 500 cr".
- **C6. Seller Dashboard v0**: nâng cấp payout modal thành dashboard: doanh thu 7 ngày/tháng, hiệu năng từng listing (lượt xem/mua/clone), bảng payouts (pending/completed/rejected), điểm trung bình review. Sau khi U11 được xử lý thì data thật nữa.
- **C7. Báo cáo vi phạm (report listing)**: route `POST /items/[id]/report` + bảng `marketplace_reports`; tự auto-hide khi vượt 3 report (chờ admin duyệt lại); hiển thị nút báo cáo ton trang detail + modal chọn lý do (sai đáp án / chép giáo trình / nội dung không phù hợp).
- **C8. Refund v0 (chính sách 1 điều luật)**: khi buyer clone thất bại vì lý do kỹ thuật hoặc đề sai đáp án được report xác nhận → admin khoản refund (RPC từ purchases → ví + mark refund). Không tự refund — quá phức tạp cho v1.

---

## 7. NHÓM D — TĂNG TRƯỞNG (sau beta)

- **D1. Admin moderation v0** (khi Admin v0 trong Sprint V2.2 có mặt): queue pending payouts, queue reported items, feature/boost listing, thống kê chợ (GMV, conversion).
- **D2. Wishlist**: nút tim + tab "Quan tâm"; lưu DB `marketplace_wishlist` (1 bảng nhỏ).
- **D3. Seeding chương trình seller đầu tiên**: mời trong beta 10-15 GV up lớn listing miễn phí (mỗi GV tặng 500 cr × listing đạt checklist) — tránh nghịch lý "chợ chờ bài đầu tiên" (empty state hiện tại nói đúng thực tế).
- **D4. Ranking chợ**: score = rating × log(số lượt mua) × freshness; filter "bán chạy tuần này"; viết lại endpoint `/items` chỉ dùng denormalized stats.
- **D5. Bundle & promo**: đề thi thử trọn bộ (nhiều đề + matrix) bán gói; promo code fallback nhập tại checkout (credits). — đến khi số listing > 100.
- **D6. Tặng credit cho seller mới**: hoàn commission năm đầu cho listing đầu tiên của một GV (TPT style "no fee until first sales") — kích hoạt chuyển from casual to seller.

---

## 8. ROADMAP 3 SPRINT

| Sprint | Nhưng | Chi tiết | Điều kiện done |
|---|---|---|---|
| **MP-1** — Sở tất dữ liệu (bắt buộc trước beta) | A1-A9 | DB-first + UUID + RLS + RPC purchase/payout + S2 split + kết trả lỗi + clone fail thật | Restart server: listing/mua/payout không mất gì; test 3 luồng mua (thành công / thiếu tiền / đã mua) đều đúng |
| **MP-2** — Chợ phải mua được + tin được | B1-B7, C1-C4, C7 | Trang detail + seller profile + sort/filter + preview trung thực + checklist + review thật + license + draft flow | GV đăng bán 1 đề → mua bằng tài khoản khác → clone + review, tất cả bền vững |
| **MP-3** — Sức bán & tăng trưởng | C5-C6, C8, D1-D6 | Suggested price + seller dashboard + admin queue + wishlist + seeding + refund | 10 seller đầu, 3 giao dịch paid thành công, rating hiển thị trung bình thật |

Sequence với các plan khác: **MP-1 hợp nhất vào Sprint V2.1-K2.2 của `Audit_Report_and_V2_Plan.md`** (cùng tác assin việc trên wallets RPC + admin basis) — tuyệt đối đừng nhồi tất cả MP vào trăm một sprint lịch beta.

---

## 9. KPI & RỦI RO

**KPI ở MP-3 (đo sau beta):** (1) ≥ 30 listing active (15 miễn phí + 15 trả phí); (2) ≥ 10 giao dịch trả phí / tháng; (3) ≥ 3 seller có doanh thu > 500 cr; (4) avg rating ≥ 4.2; (5) tỷ lệ "mua → clone vào studio" ≥ 70%.

**Rủi ro chính:**
1. **Chicken-egg**: không seller không buyer, không buyer không seller → giải pha bằng D3 seeding + đề miễn phí từ admin/GV seed đang có sẵn.
2. **Bản quyền/luân chuyển nội dung**: đề bán có thể chép từ sách/website → C7 report + terms-of-service cập nhật mục "chủ sở hữu nội dung chịu trách nhiệm"; giữ press-small là hợp lý cho beta.
3. **Tính liêm khiết rating**: incentive review phải cap chặt để tránh "review vì credit" dồn hàng loạt — test trước khi mở tổng thể.
4. **Kỹ thuật**: hàm purchase/payout là tiền tệ — viết test trong Supabase SQL editor (tạo 2 user thật, chạy 5 case: thành công/thiếu tiền/mua lại/sell tự mua/timeout).
5. **Đồng bộ legal**: payout bằng VND thật (rút về chuyển khoản ngân hàng) chỉ mở khi có điều khoản sử dụng + quy trình rõ ràng; trong beta giữ quy đổi hiển thị credits ↔ VND (1 cr = 100đ) nhưng chưa thực payout VND.

---

## 10. KHÔNG LÀM TRONG PLAN NÀY (giữ scope)

- Không xây cart/bundle/checkout multi-item (D5 để sau khi listing > 100).
- Không mở thanh toán VND thật cho chợ (chỉ credits) trong các sprint MP.
- Không đụng trang pages khác (grading/labs/whiteboard) — mỗi plan một phạm vi.
- Không xây app mobile riêng cho seller — web responsive đã đủ.
- Không paywall membership cho seller (TPT Basic $29 khôn lấy học vì người dùng VN sẽ bỏ đi).
