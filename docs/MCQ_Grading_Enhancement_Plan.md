# PLAN — UPGRADE TÍNH NĂNG CHẤM TRẮC NGHIỆM (MCQ / OMR)

> Ngày: 31/10/2026. Trạng thái: **PLAN ONLY — chưa viết code.**
> Phạm vi: toàn bộ "trang chấm trắc nghiệm": trang dashboard `/grading`, mobile scanner, luồng camera/remote session, engine OMR trong `ai-service`, API `/api/grading/**`, xuất báo cáo.
> Plan này bổ trợ cho `docs/Audit_Report_and_V2_Plan.md` (phần security S3/S4/S5 của grading đã nằm Sprint V2.1 — plan này KHÔNG lặp lại việc vá security, chỉ kế thừa).

---

## 1. MỤC TIÊU

Một câu: **"GV cầm 40 phiếu quỳ, quét bằng 1 điện thoại trong 3 phút, ra bản Item Analysis chuẩn như phần mềm chuyên nghiệp — không tốn 1 đồng AI nào."**

Ba trụ nâng:
1. **Trải nghiệm quét** (UI/UX + hiệu ứng): quét liên tục không bấm nút, feedback tức thì, sửa bài sai ngay tại chỗ.
2. **Độ chính xác** (thuật toán): pipeline OpenCV mạnh hơn theo hướng OMRChecker — học góc nghiêng, confidence score, từ chối ảnh xấu một cách thông minh.
3. **Báo cáo dữ liệu** (backend): session/điểm/lich sử chuyển từ localStorage/in-memory lên Supabase, có Item Analysis chuẩn giáo dục, xuất Excel/CSV cho nhà trường.

---

## 2. HIỆN TRẠNG (đã audit code)

### 2.1 Có gì rồi

| Thành phần | File chính | Trạng thái |
|---|---|---|
| Trang dashboard chấm | `frontend/src/app/(dashboard)/grading/page.tsx` (~2.900 dòng, 1 client component) | List session + Detail view; lưu **localStorage** `edteach_grading_sessions` |
| Tạo session | modal trong page.tsx | Chọn môn/khối, loại phiếu 20/40/50/"Form 2025"; key nhập tay ma trận A-D hoặc "chọn đề có sẵn" |
| In phiếu | modal in + `/api/grading/omr {action:"download_pdf"}` | HTML/CSS A4: SBD 6 số + Mã đề 3 số, layout GDPT-2025 |
| Quét 4 tab | modal scan: phone (QR + PIN, poll 1.5s) / camera PC / remote session | phone & camera hoạt động; remote-session có lỗ hổng S3 (đã nằm plan vá) |
| Engine OMR | `ai-service/app/omr/`: template_matcher, detector, bubble_evaluator, sheet_generator | OpenCV template-based; fallback Gemini Vision khi lỗi |
| Submissions | `frontend/src/lib/grading/student-submission-store.ts` (in-memory Map) | Có IDOR S4 (đã nằm plan vá) |
| API | `/api/grading/omr`, `/student-links`, `/remote-session/*`, `/submissions` | omr đang không auth (S5), remote-session có S3; các route chính còn lại có auth + rate limit |

### 2.2 Lỗ hổng chức năng lớn nhất (quan sát riêng của plan này)

1. **Key giả**: khi chọn "chọn đề có sẵn" làm đáp án, code điền key pseudo `choices[(i*3)%4]` — KHÔNG phải đáp án thật trong đề. Chấm sẽ sai hàng loạt nếu GV không tự nhập lại. → Phải lấy key thật từ `questions` của exam.
2. **Session chỉ nằm localStorage**: đổi máy/mất trình duyệt = mất cả kỳ kiểm tra. Submission đang in-memory (store sẽ bay khi server restart).
3. **Không có Item Analysis**: chỉ có điểm từng em; chưa thấy % từng câu, câu sai nhiều nhất, phân phối điểm, mã đề nào khó hơn mã đề nào.
4. **Chưa có sửa-bài-tay**: khi OMR đọc nhầm (tẩy xóa, tô lem 2 ô), GV không thể sửa đáp án từng câu rồi chấm lại — đành bỏ phiếu.
5. **Không có multi-key (mã đề A/B/C/D)**: một lớp thi 4 mã đề thì phải tạo 4 session riêng thủ công.
6. **Không có roster**: điểm gắn với SBD số, không có tên học sinh → không xuất được bảng điểm theo danh sách lớp.
7. **UX quét**: cần bấm nút / ngắt quãng, chưa có overlay lưới canh 4 góc + âm thanh "chụp xong" kiểu ZipGrade.

---

## 3. THAM CHIẾU TỪ CÁC REPO / NỀN TẢNG KHÁC

Đã nghiên cứu ngày 31/10/2026. Nguyên tắc pháp lý: **OMRChecker là MIT → được phép đem kiến thức pipeline vào code của mình; ZipGrade/TNMaker/Azota là product đóng → chỉ tham khảo feature list, tuyệt đối không copy asset/logo/text.**

| Nguồn | Loại | Lấy gì | Ghi chú |
|---|---|---|---|
| **Udayraj123/OMRChecker** (MIT) | OSS OpenCV | 1) Perspective transform bằng 4 mốc góc phiếu (fiducials) — chịu mọi góc nghiêng; 2) Pre-processor pipeline config (thresholding, pagination, auto-align); 3) **Confidence per bubble** + colored output để debug; 4) Tốc độ 200 phiếu/phút, min 640x480, chịu ảnh xerox; 5) Template JSON tùy biến theo layout | Reference kỹ thuật chính cho Nhóm B (thuật toán). Tự viết bằng opencv (ai-service đã có sẵn), không bundle code trực tiếp (giữ kiến trúc service sạch) |
| **ZipGrade** | Product (US) | 1) **Viewfinder 4 góc** + vibrate + sound khi chốt 1 phiếu, 2 tay lật phiếu liên tục không bấm nút; 2) *Review Papers*: xem lại ảnh thật + sửa đáp án từng ô; 3) **Item Analysis + Discriminant Factor**; 4) Custom Form Wizard (số câu/số lựa chọn tùy chỉnh); 5) Pre-filled student sheets (in sẵn tên/SBD theo danh sách lớp); 6) Chấm offline, sync sau; 7) Export CSV/PDF; 8) Key linh hoạt: scan một phiếu chuẩn làm key | Reference UX chính cho Nhóm A. Discriminant Factor là "vũ khí" GV VN ít thấy ở app khác |
| **TNMaker / Chấm thi trắc nghiệm (app VN)** | Product (VN) | Quy trình gửi ảnh → server chấm → hiện điểm + bảng xếp hạng lớp tức thì; GV VN đã quen trình tự này | Tham khảo kỳ vọng ngưỡng chấp nhận được: chậm hơn 3 giây/phiếu thì GV bỏ app |
| **Azota / SHub** | Product (VN) | Nhập đề + đáp án online, học sinh nộp online; báo cáo theo lớp; inline lời giải từng câu | Cạnh tranh trực tiếp ở mảng nộp online — khác biệt của mình là **làm với phiếu giấy + camera + không tốn AI**, đúng kịch bản lớp thiếu máy tính |
| **GradeCam / Quick Key** | Product (US) | Chấm từ camera desktop; roster import; điểm tự push vào sổ điểm | Bài học cũ: hành trình "in phiếu → quét → sửa lỗi → báo cáo" là chuẩn cần đuổi theo |

---

## 4. NHÓM A — UI/UX & HIỆU ỨNG (trang chấm + màn quét)

Thứ tự theo giá trị/nỗ lực.

- **A1. Scan mode "quét liên tục" (đỉnh của plan)** — một màn hình full-bleed, webcam/điện thoại liên tục: overlay **4 viewfinder đánh dấu 4 góc phiếu** (ZipGrade), phát hiện đủ 4 fiducials → hiện dấu check xanh quanh viền → rung + beep → chấm ngay trên thiết bị, hiện chip điểm inline (ví dụ "34/40") bay lên → GV lật phiếu tiếp. 0 nút bấm cho 1 phiếu.
- **A2. Hiệu ứng kết quả tức thì**: chip điểm animate count-up; canvas vẽ overlay các ô tô đúng (vòng xanh) / sai (X đỏ) / không rõ (vàng) ngay trên ảnh phiếu — dùng chính dữ liệu tọa độ bubble của engine để vẽ, kiểu "colored output" của OMRChecker.
- **A3. Review Papers (sửa bài tay)**: bấm vô bài → thấy ảnh gốc + lưới đáp án editor; gạt từng câu đúng/sai, câu nào OMR không chắc thì highlight vàng; bấm "Duyệt lại" để re-grade nội bộ, chỉ tính lại câu đó — không gọi AI.
- **A4. Danh sách phiên chấm mới**: mỗi session một card (thumbnail ảnh phiếu đầu, số bài đã chấm, điểm trung bình, trạng thái); skeleton loading; badge "chưa chấm / đang chấm / xong"; nút "tiếp tục chấm" đưa thẳng vào scan mode đúng chỗ dừng — không phải lướt qua các bước trung gian.
- **A5. Dark mode canh quét**: nền scan tối + khung sáng, giúp camera chống chói (giảm glare) và hiển thị đẹp trên máy chiếu.
- **A6. Hướng dẫn chớp nhoáng (coach marks)**: lần đầu mở scan, overlay 3 bước: "đặt phiếu phẳng — canh 4 góc — lật tiếp"; nhớ trạng thái đã xem.
- **A7. Micro-interaction chuẩn**: haptics trên mobile, nút bật/tắt âm thanh, hiệu ứng kết quả dùng CSS transform only (đã là pattern cũ của dự án).

---

## 5. NHÓM B — THUẬT TOÁN & XỬ LÝ DỮ LIỆU ẢNH (engine OMR)

Mục tiêu định lượng: với ảnh điện thoại 640x480 → tăng accuracy từ mức hiện tại lên tối thiểu 99% trên phiếu in tốt, 95% trên phiếu xerox; thời gian chấm tối đa 800ms/phiếu trên server 2 vCPU; **chỉ fallback Gemini khi confidence dưới ngưỡng** (gần như không tốn chi phí AI).

- **B1. Fiducial-based perspective correction** (học từ OMRChecker): thay chuẩn template hiện tại bằng: tìm 4 ô vuông đen đặc ở 4 góc phiếu (corner fiducials) → `cv2.getPerspectiveTransform` → về ảnh chuẩn. Chấp nhận phiếu chụp nghiêng không quá 25 độ, xerox mờ.
- **B2. Pre-processing có cấu hình**: grayscale → adaptive threshold (hoặc Otsu tùy ảnh) → deskew bằng minAreaRect — chọn lọc theo quality score của ảnh.
- **B3. Bubble confidence scoring**: mỗi ô có `fill_ratio` + `darkness`; xếp loại: (a) tô rõ; (b) tô mờ (mực nhạt); (c) tô lem quá 2 ô; (d) ô trống nhưng còn vết tẩy. Mỗi loại gắn cờ riêng thay vì gộp chung "rõ/mờ" như hiện tại.
- **B4. Quality gate trước khi chấm**: đo blur (variance of Laplacian), độ nghiêng, độ sáng — ảnh xấu sẽ bị từ chối kèm hướng dẫn cụ thể ("giữ gần hơn", "phòng quá tối") thay vì chấm đại cho ra kết quả sai.
- **B5. Routing thông minh**: threshold_confidence (mặc định 0.87) — ở dưới ngưỡng thì: 1) trả kết quả kèm cờ "cần kiểm tra" cho các câu có vấn đề + kết quả dự đoán (review tại A3), 2) chỉ khi GV bật "Auto AI check" mới gọi Gemini Vision cho phiếu đó (AI chỉ tốn tiền cho phiếu có vấn đề).
- **B6. Batch & performance**: chuẩn hóa ảnh về cạnh dài 520px trước khi tính toán, cache template theo từng layout, dùng numpy vectorized để đọc bubble thay cho vòng lặp từng ô.
- **B7. Test harness**: dựng `omr/fixtures/` chia ảnh mẫu: (a) scan chuẩn, (b) chụp nghiêng, (c) xerox, (d) tô lem, (e) tẩy bẩn; regression script chạy batch → in ra precision/recall mỗi fixture. Đây là điều kiện để tự tin đưa thật cho GV.
- **B8. Phiếu tùy biến (Custom Form Wizard phiên bản đơn giản)**: cho GV config số câu / 4 hoặc 5 lựa chọn / 1 hoặc 2 cột → sinh layout JSON + PDF. Học mô hình template JSON của OMRChecker.

---

## 6. NHÓM C — BACKEND & DỮ LIỆU (Supabase)

Nguyên tắc: **"session một kỳ thi là tài sản"** — phải sống sót qua restart/đổi máy.

- **C1. Migration `202611****_grading_sessions.sql`** — 4 bảng (kèm RLS owner-only, pattern dùng sẵn của dự án):
  - `grading_sessions` (id, user_id, subject, grade, sheet_layout, key_data JSONB, key_version, exam_id?, status, created_at)
  - `grading_answer_sheets` (id, session_id, student_no SBD, exam_code Mã đề, answers JSONB, score, confidence_summary JSONB, image_path, needs_review bool, graded_at) — index (session_id, student_no) UNIQUE
  - `grading_images` — Storage bucket riêng `grading-sheets` (private), policy chỉ owner đọc/ghi qua service cho GV; imageBase64 không nhồi JSON
  - `grading_item_stats` (session_id, question_no, percent_correct, percent_blank, percent_multi, avg_per_exam_code) — tính server-side khi đóng session hoặc refresh
- **C2. API refactor**: `/api/grading/sessions` (CRUD + list), `/sheets` (submit batch + update answers), `/stats` (aggregate), `/export` (CSV/XLSX). Áp zod + auth + rate limit chuẩn dự án (đây là code mới nên viết sạch từ đầu, không kế thừa lỗi S5).
- **C3. Key thật từ exam**: khi GV chọn đề có sẵn, lấy đáp án từ bảng `questions` của đề (kèm cấu hình điểm từng câu) — xóa logic pseudo-key.
- **C4. Multi-key (mã đề A/B/C/D)**: `key_data` chứa map `{exam_code: answers[]}`; phiếu quét về đọc Mã đề 3 số trước rồi mới chấm; UI tạo key cho phép copy key gốc & shuffle sinh biến thể.
- **C5. Roster (danh sách lớp)**: nhập bảng/CSV "SBD ↔ tên HS" gắn vào session; chưa ghép với module lớp của workspace (import thủ công là đủ cho beta).
- **C6. Export**: CSV (dành cho Excel tự xử lý) + PDF bảng điểm chuẩn (điểm + SBD + tên, để chỗ logo trường trống) + PDF chi tiết đáp án từng câu khi GV cần.
- **C7. Re-grade sau sửa key**: sửa key → queue re-grade toàn bộ phiếu đã quét (không cần quét lại); history giữ điểm cũ để so sánh.
- **C8. PWA offline-ready để sau beta**: queue ảnh trong IndexedDB, sync khi có mạng — cất vào backlog nhóm D.

**Chính sách chi phí**: chấm OMR local ở ai-service là tính năng **không tốn credit** cho mọi tier — dùng làm bait marketing; Gemini fallback khi confidence thấp vẫn miễn phí trong beta (đếm usage riêng).

---

## 7. NHÓM D — TÍNH NĂNG MỚI (backlog, ưu tiên thấp)

- **D1. Item Analysis panel**: % từng câu đúng/sai/trống, **Discriminant Factor** (so điểm nhóm cao 27% vs nhóm thấp 27% — tiêu chuẩn psychometrics chuẩn, GV thi cử rất thích), phân phối điểm (histogram), top-5 câu sai nhất.
- **D2. Bảng xếp hạng lớp & PH report link** (kiểu student-links đã có): HS/PH bấm token → xem điểm mình + câu sai, không thấy điểm người khác. Tận dụng pattern share-read-only đã thiết kế cho whiteboard/grading.
- **D3. Mode "Chấm trên lớp" live**: nhiều thiết bị GV cùng session (điện thoại quét + laptop xem dashboard) qua Supabase Realtime — tổng điểm cập nhật thời gian thực trên máy chiếu.
- **D4. Soạn PDF "Phiếu kết quả gửi nhà trường"**: template Word/PDF chuẩn Sở GD (điểm, phách, chữ ký GV) — 1 click.
- **D5. Roster nhận rộng hơn**: parse CSV từ các mẫu phổ biến (Excel nội bộ, sổ điểm vnEdu) để chuẩn hóa cột "SBD ↔ tên".
- **D6. Phát hiện gian lận nhẹ**: gắn cờ SBD trùng, 2 bài điền đáp án giống hệt nhau từng câu (khớp pattern) — không tự kết tội, chỉ tô vàng "cần xem soát".
- **D7. In phiếu pre-filled** theo roster: tải PDF cả lớp, mỗi trang có sẵn tên/SBD in rực — hướng dẫn HS không tô SBD sai.

---

## 8. ROADMAP 3 SPRINT

| Sprint | Trọng tâm | Chi tiết | Điều kiện done |
|---|---|---|---|
| **MG-1** — Dữ liệu vững | C1, C2, C3, A4 | Migration + API + chuyển session lên DB + key thật từ đề; UI danh sách session mới | GV tắt trình duyệt, mở máy khác vẫn thấy session + điểm |
| **MG-2** — Quét & thuật toán | A1, A2, A3, B1-B4, B7 | Scan mode quét liên tục, overlay bubble đúng/sai, review papers, fiducial + confidence + quality gate + fixtures | Với 40 phiếu: cầm điện thoại chấm trong tối đa 3 phút, tối đa 1 phiếu cần sửa tay |
| **MG-3** — Báo cáo & xuất dữ liệu | D1, C4, C5, C6, C7, B5, A6, A7 | Item Analysis + Discriminant, multi-key A/B/C/D, roster + export PDF/CSV + re-grade, Gemini-on-demand | Làm trọn 1 kỳ kiểm tra của 1 lớp: in → quét → xuất bảng điểm Excel cho nhà trường |

Sau MG-3 mới mở nhóm D (backlog) theo feedback beta. Lưu ý phân bổ thời gian với plan khác: **Sprint này nằm sau Sprint V2.1 (security)**; nếu beta đã bấm giờ, MG-1 phải được nhồi vào trước beta vì chuyển localStorage → DB về sau sẽ phải migrate dữ liệu rất đau.

---

## 9. RỦI RO & KPI

**KPI ở MG-2**: (1) accuracy ≥ 99% trên ảnh scan, ≥ 95% trên ảnh xerox chụp điện thoại; (2) ≤ 800ms/phiếu server-side; (3) GV quét 40 phiếu ≤ 3 phút không chạm màn hình.
**KPI ở MG-3**: (4) ≥ 80% phiên chấm dùng key thật từ đề (không nhập tay); (5) ≥ 1 file export/week/GV active.

**Rủi ro chính**:
1. Fiducial detection có thể chậm hơn template hiện tại → giữ fallback pipeline cũ khi corner detect fails (kết hợp với B4).
2. RLS + Storage bucket là điểm phải kiểm kỹ trong Supabase dashboard (không nằm trong migrations) — nên thêm mục này vào đợt audit security khi deploy.
3. Camera API khác nhau giữa iOS Safari và Android Chrome — phải test thật trên 2 nền tảng (đã là bài học từ mobile-scanner).
4. Đừng để "chấm miễn phí" trở thành lỗ hổng abuse: giữ rate limit cho route này (mức 200 ảnh/ngày/GV trong beta) — chấm local thì chịu được nhịp này dễ dàng.

---

## 10. KHÔNG LÀM TRONG PLAN NÀY (giữ scope)

- Thiết kế lại module tự luận (essay grading) — đã ổn định, chạm vào chỉ khi có feedback beta.
- Mở rộng sang phiếu in chuẩn của Bộ (Form 2025 có layout đặc thù) — giữ như hiện tại, chỉ custom wizard là mở rộng nhẹ (B8) trong MG-3.
- App mobile native — PWA/là đủ cho mức này.
- Đấu chấm với ví/credits của marketplace — tách bạch, chấm giấy là tính năng free bait.
