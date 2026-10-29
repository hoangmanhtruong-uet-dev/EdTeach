# Phase 2 — Kế hoạch Nghiên cứu Thị trường & Định vị Sản phẩm

> Ngày lập: 2026-10-29
> Mục tiêu: trả lời 3 câu hỏi trước khi viết thêm 1 dòng code nào ở Phase 2:
> 1. Thị trường rộng thế nào, ai đã ngồi trong đó?
> 2. Thầy cô / gia sư thực sự quan tâm điều gì **đầu tiên** (trong 30 giây đầu mở web)?
> 3. EdTeach phải có gì để **khác biệt**, chứ không phải là web thứ 1001?

---

## 1. Bối cảnh thị trường (số liệu cần xác minh lại với nguồn gốc khi pitch)

| Chỉ số | Giá trị | Nguồn |
|---|---|---|
| Quy mô EdTech VN 2025 | ≈ USD 1,1 tỷ | IMARC Group; Sách trắng Công nghệ Giáo dục VN 2026 (cùng ~1,1B USD) |
| Dự báo 2026–2034 | CAGR ≈ 12,3% → USD 3,2 tỷ (2034) | IMARC Group |
| Online tutoring & nền tảng kỹ năng | ~USD 1,2 tỷ (2025) → 2,5 tỷ (2031), CAGR ~17,7% | Ken Research |
| Báo cáo thường niên tham chiếu | Vietnam EdTech & eLearning Report 2025 (ấn phẩm lần thứ 15) | nguyentrihien.com |

⚠️ Các nghiên cứu thương mại thường "thổi phồng" TAM. Số cần dùng khi pitch là **SAM/SOM của mình**: số giáo viên của từng cấp học, số lượt ra đề/tuần, mức phí gia sư nhận lớp thực tế.

---

## 2. Bản đồ cạnh tranh (scan ngày 29/10/2026)

### 2.1. Nhóm "AI tạo đề cho giáo viên" — đối thủ trực tiếp, ĐÃ CỰC KỲ ĐÔNG ĐÚC

| Đối thủ | Bán cái gì | Điểm mạnh | Điểm yếu khai thác được |
|---|---|---|---|
| **Quizify** (quizify.vn) | Tạo đề AI cho GV THPT, ngân hàng câu hỏi từ SGK PDF, xuất Word/PDF | Free trial 14 ngày, vào được ngay | Đề AI không có tầng kiểm định → dễ sai công thức/hình vẽ |
| **i-quiz.vn** | Tạo đề từ Word/PDF/ảnh, hệ points, OCR | Hỗ trợ Toán/Hóa công thức, học sinh làm online | Không thấy cơ chế verify đề; points giới hạn |
| **VieQuizz** | Tạo đề + trộn mã đề + giao bài + tự chấm, "theo GDPT 2018" | Close-loop gần giống EdTeach, có tool free | Chất lượng đề tự khai, không có AI Vision chấm viết tay |
| **soande.vn (AppSoanDe)** | Soạn đề + giáo án + slide + nhận xét + chấm | "1 trợ lý cho cả hồ sơ GV" | Ôm đồm, mỗi mảnh đều hời hợt |
| **TeacherVN** | Soạn trọn bộ hồ sơ bài dạy (giáo án, ma trận, đề) từ 1 câu mô tả | Xuất Word/PPT/Excel/PDF chuẩn định dạng | Không close-loop với học sinh |
| **Dethi.io** | Cộng đồng giáo viên chia sẻ/soạn/thi thử | **Mạng lưới + thư viện đề chia sẻ** (network effect) | Cộng đồng có sẵn nhưng không AI |
| **EduBank / SmartTest và ~10 tool khác** | Tạo đề / clone đề theo cấu trúc | Rẻ hoặc free | Rải đều, không ai chiếm trọn "First Choice" |

**Nhận định quan trọng:** Tính năng *AI ra đề* không còn là lợi thế — nó là **điều kiện gia nhập (table stakes)**. Quizify, i-quiz, VieQuizz, soande, TeacherVN đang bán đúng feature này, và nhiều cái miễn phí hơn mình.

### 2.2. Nhóm "kết nối gia sư" — sân chơi khác, nhưng chứa đúng target "gia sư"

ketnoigiasu.vn, HTcon, MPEDU (30.000+ gia sư), Gia Sư Tinh Hoa, WeTeach, Uni Education, VietTutor (AI matching), The Tutor Network…

Đặc trưng chung: **matching + giao lớp + chiết khấu phí**. Gần như **không ai bán công cụ dạy học cho gia sư** (ra đề, giao bài tự chấm, báo cáo phụ huynh). Đây là khoảng trống thị trường.

---

## 3. Câu trả lời cho câu hỏi lớn nhất:
### "Sản phẩm phải có gì thì thầy cô / gia sư MỚI quan tâm?"

Từ bản đồ cạnh tranh: **điểm khác biệt duy nhất EdTeach có mà không ai đang bán trọn vẹn là:**

> **Vòng khép kín "Ra đề → Giao bài → Nộp → Chấm AI (kể cả bài viết tay) → Báo cáo cho phụ huynh" — với đề đã được kiểm định thật khi in ra giấy.**

- Quizify / i-quiz dừng ở "ra đề + xuất Word".
- VieQuizz có giao bài + tự chấm nhưng chỉ cho trắc nghiệm online.
- **Chưa ai** làm được: chấm bài *viết tay trên giấy* bằng AI Vision (mình đã có sẵn `mobile-scanner`, `submit/[token]`, `remote-session`) — kết quả chấm chính là **bằng chứng chất lượng** giúp gia sư lấy niềm tin của phụ huynh và nhận thêm lớp mới.

### "Must-care checklist" — thứ giáo viên/gia sư đụng tới trong 30 giây đầu

P0 — nếu không có = mất người dùng ngay khi ra mắt (chủ yếu là content/trang public, ít code mới):
1. **Trang chủ public nói rõ "cho ai, giải quyết gì"** trong 1 màn hình + video demo 60s + **đề mẫu tải luôn không cần đăng ký**.
2. **Đề mẫu Toán/Lý/Hóa tốt tuyệt đối**: công thức render chuẩn, hình vẽ nét, đáp án/mã đề đúng khung. GV khối tự nhiên sẽ kéo đề về xem tay trước khi tính đến web khác.
3. **Xuất Word chuẩn Bộ GD&ĐT** (đã có docx.js) — phải dùng được để in thật, không phải chỉ "xuất được file".
4. **Giá minh bạch**: bảng giá + số tín dụng rõ ràng (free tier cho bao nhiêu đề/tháng), đặt cạnh Quizify/i-quiz cho người dùng tự so.

P1 — thứ làm GV **quay lại lần 2, lần 3**:
5. **Giao bài qua link/Zalo không cần học sinh đăng nhập** + thông báo điểm qua Zalo (Zalo Mini App để sau).
6. **AI Vision chấm viết tay** — đây là điểm khác biệt lớn nhất: video "quét 40 bài viết tay trong 5 phút" là thứ GV tự chia sẻ cho nhau trên Facebook.
7. **Thư viện đề dùng chung** — GV luôn cần đề dự phòng, thi thử.
8. **Trang profile gia sư** = "hồ sơ bằng chứng": số đề đã ra, điểm kiểm tra của học sinh trước/sau, đánh giá… (xây trên khung Marketplace đã có trong code).

P2 — khi đạt ~500–1000 GV hoạt động:
9. Dòng tiền gia sư (chứa/escrow quỹ 1–2 buổi đầu), xếp hạng, AI matching.
10. Channel "Trường học" (tier `school` đã có sẵn trong schema) — bán cho tổ trưởng chuyên môn.
11. **Phòng thí nghiệm trực quan 3D** — xem §7 (nội dung mở có sẵn, chi phí dev thấp, tăng tính "wow" khi GV chia sẻ).

---

## 4. Kế hoạch nghiên cứu thị trường (2 tuần, chạy song song với phát triển)

### 4.1. Phỏng vấn sâu 12–15 người (mỗi cuộc 20–30 phút)

Chia đều: 7–8 GV đang dạy (ưu tiên THPT Toán/Lý/Hóa/Tiếng Anh), 4–5 gia sư tự do, 2 phụ huynh có con học gia sư.

**Bộ câu hỏi JTBD:**

*Hiện trạng:*
1. Tuần trước Anh/chị soạn/biên tập bao nhiêu đề? Có dùng công cụ nào không? (Không dẫn dắt — để tự kể.)
2. Giờ Anh/chị làm đề bằng cách nào? Mất bao lâu cho 1 đề 40 câu có ma trận?
3. Việc nào trong đó **tốn thời gian vô lý nhất / khổ nhất**? (câu hỏi cốt lõi JTBD)
4. Bao giờ Anh/chị phải làm "1 bộ nhiều mã đề / đề khác nhau cho nhiều lớp" — điều gì khiến nó rắc rối?

*Về chấm bài:*
5. Mỗi lần thi xong, Anh/chị chấm bao nhiêu bài viết tay/tháng? Đau nhất ở bước nào? (xác minh giả thuyết AI Vision)
6. Anh/chị đã thử công cụ chấm/học online nào? Bỏ vì sao?

*Về gia sư:*
7. (Gia sư) Phụ huynh quyết định thuê Anh/chị nhờ yếu tố nào? Anh/chị chứng minh năng lực bằng cách gì?
8. (Gia sư) Nếu có công cụ giúp ra đề + theo dõi tiến bộ từng em + gửi báo cáo phụ huynh hàng tuần — Anh/chị sẵn sàng trả bao nhiêu/tháng? "Gửi báo cáo cho phụ huynh" có phải món quà không?
9. (Phụ huynh) Anh/chị tin gia sư tốt nhờ bằng chứng gì? Có từng bối rối "con mình tiến bộ cụ thể phần nào"?

*Lần đầu dùng công cụ online:*
10. Lần gần nhất Anh/chị dùng/tải một công cụ online cho công việc dạy học — tên gì? Biết từ đâu? Tại sao quyết định dùng khi đó?
11. Nếu tôi cho xem demo: 45 giây ra đề hình học + 40 bài viết tay được quét và chấm — Anh/chị quan tâm gì nhất / nghi ngờ gì nhất?

**Độ đo của đợt phỏng vấn:**
- Câu 3 & 5 cho ra **top-3 pain thực** (so với giả thuyết của dự án)
- ≥ 6/12 người có sẵn quy trình chấm viết tay → xác nhận AI Vision là điểm khác biệt
- ≥ 8/12 người nói được tên công cụ online họ đang dùng → biết địch thật

### 4.2. Kênh nghiên cứu

| Kênh | Hành động cụ thể |
|---|---|
| Nhóm FB giáo viên (mùa "chợ giáo viên", nhóm chia sẻ học tập) | Đăng khảo sát + mời phỏng vấn 15 phút, đổi "tín dụng đề free 1 tháng" |
| Quizify / i-quiz / VieQuizz | Tự đăng ký trải nghiệm, lưu pricing + luồng UX + khiếm khuyết đề vào `docs/competitor_notes/` |
| Dethi.io + nhóm chia sẻ đề | Xem đề nào được tải nhiều → hiểu "đề đáng dùng lại" trông thế nào |
| Dữ liệu có sẵn trong app | Xem bảng `exams`, `grading`, `referral`: ai tạo, môn gì, xuất Word mấy lần — số thật đầu tiên của mình |

### 4.3. Deliverable (deadline +15 ngày)

- [ ] 12–15 bản tóm tắt phỏng vấn (1 trang/cuộc)
- [ ] Top-3 pain xếp hạng + trích nguyên văn ≥ 5 cuộc
- [ ] Bảng so sánh tự trải nghiệm ≥ 3 đối thủ
- [ ] **Quyết định go/no-go đã chốt**: Phase 2 nhắm GV (giữ nguyên) hay mở rộng sang Gia sư (90% khả năng vẫn GV, nhưng ngôn từ marketing sẽ là "gia sư có bằng chứng năng lực")

---

## 5. Roadmap triển khai Phase 2 (sau khi nghiên cứu khép lại)

> Nguyên tắc: **không build tính năng nào nếu chưa có ≥ 3 người trong phỏng vấn trả lời "tôi sẽ dùng mỗi tuần / trả tiền"**.

### Sprint 5 (tuần 1–2): Trực quan hóa giá trị cho người ngoài

1. Trang chủ public + trang đề mẫu (P0.1, P0.4)
2. Bảng giá rõ ràng, đặt cạnh đối thủ
3. 3 GV thật chấm điểm "dùng được khi in" cho đề mẫu Toán/Hóa (thang 1–5)
4. AI Dual-Agent pipeline chạy **thật** với provider thử (kiểm tra độ chính xác đề tối, đặc biệt hình vẽ/quan hệ dữ kiện; nếu sai → thêm tầng verification)

### Sprint 6 (tuần 3–4): Close-loop — tính năng không ai có

5. E2E: GV tạo đề → sinh link nộp → HS nộp ảnh bài làm → AI Vision chấm → bảng điểm cho GV (dùng luồng `submit/[token]` + `remote-session` đã có)
6. Báo cáo học sinh share qua Zalo/link (ảnh PNG + text trước, sâu sau)
7. **Video demo 60–90 giây** — tài sản quan trọng nhất của giai đoạn: vấn đề → 1 prompt ra đề → 40 HS nộp → chấm → báo cáo → xuất Word chuẩn

### Sprint 7 (tuần 5–6): Thương mại hoá thử

8. Chốt giá Free/Pro + PayOS checkout thật (đã có webhook/API sẵn)
9. Referral đẩy mạnh: "GV mời GV tặng tín dụng đề" (cơ chế đã nằm trong DB)
10. Cho 20–30 GV dùng Pro free 1 tháng, đổi lấy feedback + 1 bài chia sẻ nếu thấy giá trị

### Sprint 8 (tuần 7–8): Marketplace sơ khai + thu thập bằng chứng

11. Profile gia sư v1 + "bằng chứng năng lực" (điểm lớp ôn, số đề, feedback)
12. Review metrics → quyết định tăng/em-disable phần nào, đổi luồng phần nào

### North-star metric & KPI

| Giai đoạn | Metric chính | Mốc |
|---|---|---|
| Nghiên cứu | 12–15 phỏng vấn hoàn thành + top-3 pain cụ thể thành 1 câu | +2 tuần |
| Sprint 5 | % đề mẫu được GV thật chấm "in dùng được ngay" | ≥ 4/5 |
| Sprint 6 | # vòng E2E GV tự chạy/tuần | ≥ 30 vòng |
| Sprint 7 | Conversion Free → Pro (trả tiền thật) | ≥ 5–8 GV |
| Sprint 8 | Retention tuần-4 (GV quay lại ≥ 1 lần/tuần) | ≥ 30% |

### Rủi ro & cách xử lý

| Rủi ro | Xử lý |
|---|---|
| Đối thủ free hóa toàn bộ thị trường (Quizify/i-quiz...) | Không cạnh tranh ở "ra đề" — cạnh tranh ở "chấm viết tay + bằng chứng chất lượng cho gia sư" |
| Đề AI sai hình vẽ/công thức khi in → GV bỏ đi ngay vòng đầu | Chạy thử Dual-agent verifier thật + kiểm thử chéo đề mẫu trước khi marketing |
| Phỏng vấn khó xong đúng hạn | Dùng dữ liệu thật trong DB (`exams`, `grading`), khảo sát đặt trong app, nhóm FB |
| Zalo Mini App cần tài khoản OA/định danh giai đoạn đầu | Giai đoạn này chỉ dùng link share + ảnh PNG — không phụ thuộc Zalo API chính thức |

---

## 6. Việc phải làm NGAY

1. **Ngày 1–3:** Chốt bộ câu hỏi phỏng vấn (§4.1) + chọn 4–5 nhóm FB mục tiêu.
2. **Ngày 1–5:** Đăng ký dùng thử Quizify, i-quiz, VieQuizz — ghi chú vào `docs/competitor_notes/`.
3. **Tuần 1:** Xây trang chủ public + trang đề mẫu + bảng giá (P0) — task front-end đầu tiên của Phase 2.
4. **Tuần 1–2:** Chạy 12–15 cuộc phỏng vấn.
5. **Cuối tuần 2:** Họp go/no-go, chốt positioning statement 1 dòng, rồi mới mở Sprint 5–6.

---

## 7. Tính năng đề xuất bổ sung: Phòng thí nghiệm trực quan 3D (tongjiang-lab)

### 7.1. Repo được đề xuất

| Thuộc tính | Giá trị |
|---|---|
| Repo | `smithjohn78390/tongjiang-lab` (854★, 233 forks, commit mới nhất hôm qua — rất active) |
| Demo online | https://lab.tongjiang.app |
| Nội dung | **54 bài học tương tác 3D**: Vật lý (10), Hóa (25), Sinh (5), Địa lý (14) |
| Cấu trúc | Mỗi bài = **1 file HTML tự chứa (~1MB)**, chạy offline, mở được trên máy chiếu/bảng tương tác; three.js/WebGL (MIT) |
| Thiết kế sư phạm | Mỗi bài = 1 thế giới 3D + console điều khiển trực tiếp + **câu hỏi dẫn dắt** + **lộ trình 6–9 bước** GV có thể đi từ đầu đến cuối + bước "kiểm tra" cuối bài |
| `catalog.json` | Danh sách đủ dữ liệu để map: `slug, subject, title, question, textbook, steps[], online URL, cover` |
| License | **CC BY-NC 4.0** cho bài học/covers/catalog; three.js (MIT) cho phần code |

### 7.2. ⚠️ Ràng buộc pháp lý — bắt buộc tuân thủ trước khi code

1. **CC BY-NC 4.0 = phi thương mại.** EdTeach có biểu phí (Pro/PayOS) → **KHÔNG** bundle/tải lại file `.html` vào sản phẩm, **KHÔNG** đưa nội dung vào gói trả phí hoặc chặn sau paywall.
2. **Cách dùng được ngay, rủi ro thấp:** nhúng qua **iframe chính thức mà tác giả công khai** (`<iframe src="https://lab.tongjiang.app/<slug>" style="aspect-ratio:16/9" allow="fullscreen">`), **ghi nguồn "Tongjiang Lab (https://lab.tongjiang.app)"**, tính năng **free cho mọi tier** (không nằm sau paywall).
3. **Càng chắc hơn:** nhắn trực tiếp tác giả (X: `@CopperForgeAI`, repo đang mở Issues) xin phép dùng trong nền tảng giáo dục — ghi lại xác nhận vào `docs/competitor_notes/tongjiang_permission.md`.
4. **Định hướng dài hạn:** học cách thiết kế bài học của họ, rồi **tự dựng lab tiếng Việt bằng three.js (MIT)** — khi đó không còn vướng NC và đây có thể thành tính năng đóng góp thật cho "bằng chứng năng lực" (p.4 §3).

### 7.3. Rào cản thực tế (không che giấu)

- **Giao diện tiếng Trung** (README ghi "other languages are planned"). GV Vật lý/Hóa đọc hiểu nội dung thật và có thể dùng làm minh họa **cho cả lớp trên máy chiếu** (GV tự giải thích bằng tiếng Việt), nhưng khó giao cho học sinh tự học.
- Theo SGK Trung Quốc (PEP 2019) — cần **map thủ công sang GDPT 2018** trước khi đưa vào thư viện.

### 7.4. Vị trí trong chiến lược

**Không** chèn vào luồng cốt lõi Phase 2 (close-loop AI Vision vẫn là khác biệt chính, xem §3). Hạng mục này là:
- **P2, chạy sau Sprint 6–7** — chi phí dev rất thấp (chỉ là trang thư viện + bảng map + iframe), nhưng hiệu ứng chia sẻ trên Facebook cao (GV sẽ share "lớp Sư Lý học quang điện 3D").
- Tạo **điểm khác biệt so với các site kết nối gia sư** (MPEDU, WeTeach... chỉ matching, không có công cụ dạy học; các site tạo đề cũng không có lab).

### 7.5. Cách tích hợp đề xuất (Sprint 8, ~2-3 ngày dev)

1. **Bảng `lab_lessons`** (Supabase): `slug, subject, title_vi, question_vi, gdpt_map, steps_count, online_url, cover_url, approved` — seed từ `catalog.json` (đã tải, giữ bản gốc tiêu đề Trung + cột tiếng Việt thêm vào).
2. **Trang "Thư viện mô phỏng 3D"** trong dashboard + 1 trang public dùng để PR: lọc theo môn/lớp GDPT, bấm xem → iframe + hiển thị câu hỏi dẫn dắt + ghi nguồn.
3. **Gắn lab vào đề/bài giảng:** khi AI ra đề về quang điện → panel gợi ý "Bài thí nghiệm 3D liên quan: *Photoelectric Effect*" — GV nhúng link vào giáo án. (Khớp với định hướng "hỗ trợ soạn hồ sơ bài dạy" nếu làm sau này.)
4. **Cập nhật README + trang giá:** mô tả tính năng luôn kèm "nội dung mở từ Tongjiang Lab, CC BY-NC".

### 7.6. Danh sách bài học gợi ý nhúng đầu tiên (khớp mong đợi GDPT 2018)

| Bài (slug) | Môn | Khớp chương trình VN |
|---|---|---|
| `photoelectric-step` | Lý | Lý 12 — quang điện/quang phổ |
| `emf-step` | Lý | Lý 11 — suất điện động, nội trở |
| `projectile-step` | Lý | Lý 10 — chuyển động ném ngang |
| `energy-step` | Lý | Lý 10 — định lý bảo toàn cơ năng |
| `capacitor-step` | Lý | Lý 11 — tụ điện |
| `ball-stick-step` | Hóa | Hóa 11 — cấu trúc phân tử hữu cơ |
| `galvanic-step`, `electrolysis-step` | Hóa | Hóa 11/12 — pin điện, điện phân |
| `titration-step` | Hóa | Hóa 11 — chuẩn độ |
| `sodium-step`, `chlorine-step` | Hóa | Hóa 10 — kim loại kiềm, halogen |
| `mitosis-step`, `plasmolysis-step`, `enzyme-step` | Sinh | Sinh 10 — nguyên phân, trao đổi chất qua màng, enzym |
| `karst-step`, `thermal-step`, `water-cycle-step`, `enso-step`, `earth-motion-step` | Địa | Địa 10/11 — karst, khí quyển, thủy văn, El Niño, chuyển động Trái Đất |

### 7.7. Tiêu chí quyết định (kiểm tra trước khi phát hành)

- [ ] Tác giả xác nhận cho dùng (hoặc dùng đúng khung iframe công khai có ghi nguồn)
- [ ] ≥ 5 GV trong phỏng vấn nói giờ dạy của họ dùng được một bài lab 3D trên máy chiếu (kể cả tiếng Trung)
- [ ] Không tiêu tốn > 3 ngày dev
- [ ] Feature luôn free cho mọi tier, không liên quan hệ thống tín dụng/ví
- [ ] KPI: số lượt mở lab/tuần ≥ 100 đầu tiên trong 2 tuần sau khi tung ra

> Nếu rào cản tiếng Trung chặn quá nhiều GV, thay thế: **tự dựng 1–2 bài lab tiếng Việt thuần** (three.js MIT) theo nguyên mẫu của họ — đẩy sang Phase 3 thực sự.
