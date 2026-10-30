# Kế hoạch Cải thiện Tính năng Bảng Trắng (Whiteboard)

> Ngày lập: 2026-10-31 · **Plan only — không sửa code**
> Phạm vi: trang danh sách `/whiteboard` + trình editor `/whiteboard/[id]` + điểm chạm với Teach mode và Phòng TN 3D.

---

## 1. Hiện trạng (quét code 31/10 — đã có nền tốt)

| Thành phần | File | Trạng thái hiện tại |
|---|---|---|
| Trang danh sách | `frontend/src/app/(dashboard)/whiteboard/page.tsx` | Hero gradient, tạo bảng, banner Pro/Free (giới hạn 3 bảng), tìm kiếm theo tên, lọc yêu thích, thẻ bảng (badge số nét vẽ + ngày), duplicate, delete `confirm()` |
| Editor | `frontend/src/app/whiteboard/[id]/page.tsx` + `components/whiteboard/whiteboard-editor.tsx` | Excalidraw 0.18.1 full-screen (không sidebar — đúng cho biểu diễn), đổi tên inline, star, autosave kép: localStorage tức thì + Supabase debounce 2.5s, pill trạng thái lưu |
| Canvas | `components/whiteboard/whiteboard-canvas.tsx` | Excalidraw mặc định, `saveFileToDisk/loadScene/toggleTheme` bật |
| Thư viện STEM | `lib/whiteboard/stem-libraries.ts` | **6 shape code tay**: hệ trục Oxy, vectơ lực, lực căng lò xo, điện trở, pin, thấu kính hội tụ — Pro-gated |
| DB | `supabase/migrations/20261030_whiteboards.sql` | Bảng `whiteboards` (elements JSONB, app_state, is_favorite, thumbnail_url), RLS owner-only, trigger `updated_at` |
| Teach mode | `app/teach/[examId]/page.tsx` (tab "Bảng trắng Excalidraw") | Nhúng WhiteboardCanvas chia màn hình theo câu hỏi — **vẽ lưu tạm trong RAM, chưa persist** |
| Lớp phủ 3D | `components/labs/transparent-whiteboard-overlay.tsx` | Kính vẽ trong suốt trên lab 3D (canvas 2D riêng: bút, highlighter, tẩy, neon, chụp màn hình) — **rời mạch khỏi Excalidraw** |
| Chia sẻ/cộng tác | — | **Chưa có** sharable link, present mode, realtime; RLS đóng tuyệt đối |

**Lợi thế sẵn có nên khắc sâu:** vòng "đề thi → bảng trắng giảng bài (teach mode) → lab 3D" đã có*B khung columns*; chỉ cần siết dây nối.

---

## 2. Định hướng cải thiện (5 nhóm)

| # | Nhóm | Mục đích | Ưu tiên |
|---|---|---|---|
| A | UI/UX + hiệu ứng trang danh sách | "40 giây đầu" cảm thấy tính năng chuyên nghiệp → dễ chia sẻ lên FB | P0 |

| B | Công cụ dạy học trong editor (chất GV) | Sản phẩm đáng dùng thật trên lớp học | P0/P1 |
| C | Chia sẻ & trình chiếu | "Bằng chứng năng lực" + lan tỏa | P1 |
| D | Tổ chức lưu trữ + vòng khép kín đề/lab | gidió chấm + giữ người dùng | P1 |
| E | AI trên bảng trắng | khác biệt (không đối thủ Excalidraw nào có tiếng Việt nhắm GV) | P2 |

---

## 3. Nhóm A — UI/UX & hiệu ứng (trang danh sách)

### A1. Thẻ bảng (board card)
- **Thumbnail thật thay placeholder**: mỗi lần autosave, dùng `exportToBlob` ( completamente Excalidraw API) chụp canvas → lưu lên **Supabase Storage** `whiteboard-thumbnails`, ghi `thumbnail_url` (cột đã có trong DB). Không được cóbservice "nét vẽ" là bó của card.
- Hover state: thẻ nổi nhẹ (translate-y -1, shadow), nút tendencia Dupe/Delete chuyển mờ→đậm; click thẻ mở editor (vùng riêng cho nút hành vi — tránh double trigger).
- Skeleton loading lần đầu (3-6 thẻ shimmer) thay khán trống.
- Badge yêu thích (star fill) hiện luôn trên thẻ, không chỉ khi hover.

### A2. Hero & banner
- Hero: đổi text 1 dòng kiểu "cho ai, giải quyết gì" → thêm **quick-stat** (Số bảng · Tổng nét vẽ · Lần dùng gần nhất) — nền sẵn data.
- Reorder plan banner Free: tính mạch lạc — hiện "MẢNHorate 'Đã dùng x/3'" và nút nâng cấp; khi còn 1 slot thì đổi thành cảnh báo vàng khẩn (thường quét khách khi nghĩ sửubi).
- Nút "Tạo bảng vẽ mới": thêm **motion nhẹ** (scale 1.02 → 1 khi hover), giữ primary; click chóp " keyPressed + Shift" → tạo bảng theo template (A3).

### A3. Hiệu ứng chuyển động (tối giản, không thêm dep)
- Vào trang: danh sách thẻ **stagger fade-in** (mỗi thẻ trễ ~40ms) — CSS keyframes, không cần framer-motion.
- Tìm kiếm/lọc: chuyển ẩn-hiện mượt qua opacity+height (không nói c่ Relevant" jump).
- Toast duplicate: thêm hành động "Mở bảng vừa sao chép" — giảm thao tác.
- Trạng thái rỗng (chưa có bảng nào k lọc): 1 SVG minh họa tay vẽ + 2 nút: "Tạo bảng trống" / "Dùng template mẫu của GV".
- ⚠️ Rào nhẹ: **tối thiểu hoá anim** (`prefers-reduced-motion`) — nhiều máy trình chiếu màn hình quét là loại cũ.

### A4. Dự định lời mời "mỏm" cho tính năng con UI
- **Templates gần GV** (tạo ngay trong trang danh sách): chọn từ 4 template chuẩn ho (khác STEM shape): "Hai cột: bài tập / lời giải", "Sơ đồ tư duy", "Ô 5mm (mua tính toán)", "Giấy A4 theo tỷ lệ". Thêm row "Bắt đầu nhanh từ:" trên danh sách.
- Phím tắt: `N` tạo bảng mới, `/` nhảy ô search (khớp Ctrl+K palette đang có).

---

## 4. Nhóm B — Công cụ dạy học trong editor (chất lượng chính giảng hơn)

### B1. Thư viện STEM mở rộng (P0, chi phí thấp)
- Từ 6 shape → **20–25 khuôn có sẵn**, theo 5 folder môn (Lý / Hóa / Sinh / Địa / Sơ đồ):
  - Lý: mạch điện đủ tập (Ammeter, Voltmeter, đèn, ôm), ném ngang, ray chùm sáng, lặp lưỡng cực
  - Hóa: bình phản ứng, ống nghiệm, bảng chu kỳ phần tử, hình phân tử có sẵn (H2O, CO2, NH3, CH4)
  - Sinh: tế bào, màng sinh học (bilipid), tim/cpu đơn giản
  - Địa: la bàn, vòng tuần hoàn nước, biểu đồ khí hậu
- Lưu cùng 1 format library item, nhóm nhỏ trong dropdown theo môn — không đổ mọi thứ 1 list.

### B2. Chèn công thức & văn bản GV (P1)
- **Chèn KaTeX → SVG**: cửa sổ nhỏ gõ công thức (đã có KaTeX trong dự án) → xuất thành Excalidraw element (SVG import), đúng nét khi zoom. Đây là điểm mạnh "đấu tự uy tín" so với Excalidraw quốc tế.
- Preset văn bản GV: "Bài giải", "Chốt kiến thức", "Quan trọng ★" — style màu/tổ chức được định sẵn để vẽ nhanh.

### B3. Chế độ trình chiếu trong editor (P1)
- Nút **"Trình chiếu (F)"**: ẩn toàn bộ thanh công cụ Excalidraw + scroll-to-fit (zoom về content) + **con trỏ ngón tay (laser pointer)** để GV phóng to vật đang nói trên máy chiếu.
- Khởi chạy khóa zoom + Ctrl+scroll (chống học sinh "vặn" trình chiếu lộn xộn — các phòng máy hay gặp).
- Phím `Esc` về chế độ edit.

### B4. Đồng bộ trải nghiệm với Phòng TN 3D (P1)
- Hiện có 2 lớp "kính vẽ" riêng: Excalidraw trong editor và `transparent-whiteboard-overlay` trên lab 3D (màu neon, tàn bạo khác nhau từ điểm chạm UX).
- Chuẩn hoá 1 **bộ bàn điều hue/option chung** (bút 3 màu GV: xanh/đỏ/tím vàng nổi; bút chiều annotation chỉ số câu hỏi) — cài đặt dùng chung config. Không cần merge bộ code, chỉ cần đồng bộ thông số & icon.

### B5. Teach mode không mất vẽ (P0 nếu sửa nhỏ)
- Trong `app/teach/[examId]`, bản vẽ theo câu hỏi đang cache ROM (`drawingsMapRef`) — mất vẽ nếu reload. **Đề xuất lưu**: 1 bản ghi `whiteboard` riêng *per exam* với `elements` [...nguyên các nhóm theo câu hỏi + element `metadata` như `{ examId, questionId }]` — dùng bảng hiện có, không cần migration mới (chỉ thêm key tùy JavaScript) — khi GV chuyển câu hỏi, render theo khóa và `updateScene`.

---

## 5. Nhóm C — Chia sẻ & trình chiếu (P1)

### C1. Link chia sẻ chỉ đọc (không realtime v1)
- Cấu trúc key dùng trước (pattern mạnh) lấy hình `grading student-links`: bảng `whiteboard_shares` (id, board_id, token unique, revoked_at, views) + RLS "token không login đọc được vùng public viewer".
- Trang công khai rút gọn `/whiteboard/view/[token]`: canvas **chỉ đọc + present** (Ẩn sidebars, chế độ fullscreen lớn). GV: share bài giảng cho phụ huynh/HS tự xem lại sau tiết học.
- Chỉ cần **đọc** elements + binhTo scanner thumbnail, không cần dạng thời gian thực → chi phí gần bằng 0.

### C2. Realtime đồng trình (P2 — cân nhắc kỹ)
- Excalidraw có sẵn `Collab` đang chạy server riêng (yjs). Với quy mô hiện tại — chưa cần; nếu làm, chọn 1: Supabase Realtime broadcast giữa các phiên GV↔HS (đủ cho **1 GV trình tỷ học nhemás HS xem**) hay không thêm websocket server tự quản.
- ⛔️ Đẩy về P2 vì chi phí server + cần bảo trì dài hạn của dự án.

---

## 6. Nhóm D — Tổ chức lưu trữ & vòng khép kín (P1)

### D1. Gắn bảng trắng với đề thi (pencil trong DB hiện tại thừa sức làm)
- Thêm `metadata JSONB` trên bảng `whiteboards`: `{ examId?, labSlug? }` — 1 migration nhỏ.
- Trang đề thi `[id]`: nút "Tạo bảng trắng giảng bài" → tạo bảng gắn sẵn examId (`app_state` có tên đề) — DS vòng khép kín "đề→giảng".
- Trang danh sách: badge "Thuộc đề" → bấm là nhảy đến đề.

### D2. Gắn bảng trắng với bài 3D (theo sai)
- Ở trang `/labs/[slug]` và overlay 3D: nút "Vẽ chú thích thành bảng lưu" → tạo bảng trắng có `metadata.labSlug`, chèn screenshot lab vào canvas (element ảnh). GV dùng làm "bài giảng ghi chú trên thí nghiệm".

### D3. Sáp xếp thư mục & xuất file (P2)
-gom "Bộ sưu tập"/tag đơn giản (môn + lớp) — không cần cây thư mục phức tạp.
- Export: PNG (đã có àly qua excalidraw action), bổ sung auto PDF (đã có docx/PDF lib ở mảng đề thi).

---

## 7. Nhóm E — AI trên bảng trắng (P2, nghiên cứu sau Sprint AI rõ ổn)

| Ý tưởng | Kết nối sẵn có | Ghi chú |
|---|---|---|
| **AI gợi ý cảm biến "{vẽ sketch sơ đồ tư duy} → sinh đề**" | `/api/exams/generate` | Vẽ conceptual khung → bấm "Tạo đề từ bảng" → AI đọc elements text + labels → sinh đề về chính loạt từ khoá GV vẽ |
| **AI giải bài toán vẽ tay** | ai-service `gateway` | Ảnh canvas → vision model → giải từng phản (dữ ready nvém medios đang đọc SV bài viết tay) |
| **Gợi ý cho GV** | stem-libraries | AI đề xuất shape phù hợp nội dung đang có trên canvas |

---

## 8. Rào cản số lượng & gói (Free tier kế đúng)

- Free: **3 bảng** (đang có). Cân nhắc tăng lên **5** vì GV cần nhiều bản nháp — việc tăng này gần như chi phí lưu trữ không đáng kể, đổi lại trải nghiệm để chốt Pro.
- Pro: without giới hạn + skill thức phần thư viện STEM mở rộng + template + liệu PDF + share-link (25 view/tháng để drive giá trị, không giới hạn tuyệt đối để adversarial).
- ⚠️ Tránh kiểu "bóc tiếp bánh": tính năng giảng bài cốt lõi (trình chiếu F, laser pointer) nên làm cho Free luôn — vì mỗi lần chót trước rồi mới yêu cầu Pro là trải nghiệm "bóc thêm" làm GV khó chịu.

---

## 9. Roadmap đưa 3 sprint (ước lượng, mỗi sprint = 1 tuần dev + 1 tuần polish)

### Sprint W-1 — "Nhìn thấy được" (P0)
1. Thumbnail thật cho bảng (Storage + blob) + skeleton + shimmer
2. Stagger fade-in, hover tinh chỉnh, empty state 2 CTA
3. Quick templates (4 mẫu) + nâng quota Free từ 3 lên 5 bảng
4. Teach mode: persist bản vẽ per exam (B5)
5. KPI: tỷ lệ lượt mở bảng từ thumbnail ≥ 60% tổng lượt mở bảng

### Sprint W-2 — "Dùng được trên lớp" (P1)
1. Thư viện STEM 20–25 khuôn theo môn + dropdown gộp nhóm
2. Chèn KaTeX (SVG) + preset văn bản GV
3. Trình chiếu F + laser pointer + khóa zoom
4. Đồng bộ palette overlay 3D với editor
5. KPI: % lượt tổng dùng STEM/kaTeX mỗi phiên ≥ 25% từ các GV hoạt động

### Sprint W-3 — "Đi ra ngoài" (P1)
1. Share link read-only (`whiteboard_shares` + trang viewer public)
2. Gắn bảng ↔ đề thi (metadata + nút "Tạo bảng trắng giảng bài")
3. Gắn bảng ↔ lab 3D (screenshot chèn canvas + metadata.labSlug)
4. KPI: ≥ 15% bài share từng được mở bởi ngoài 1 "máy thật" (tính theo token view)

### Sau đó — Sprint W-4+ (P2)
- Realtime đồng trình (Supabase Realtime) HOẶC chuyên AI đề xuất (chọn 1), thư mục/tag, tổng xuất.PDF deck, xuất slide từ canvas (มี 1 mỗi trang một phân vùng).

---

## 10. Rủi ro & lưu ý kỹ thuật

| Rủi ro | Xử lý |
|---|---|
| Thumbnail chụp blob mỗi autosave gây nặng | Export **jpeg 0.5 scale** + debounce dài hơn thumbnail (10s) + chỉ upload nếu hash elements khác lần trước (so sánh nhanh `elements.length + updated_at`) |
| Cột JSONB `elements` to dần | Không đổi schema (Excalidraw tự nén tốt); xử lý sau nếu vượt ~2000 elements (split/page) |
| Public viewer leak bản vẽ riêng tư | Mặc định board vẫn private, share tạo token riêng per token revoke; viewer only read `elements` snapshot |
| Hiệu ứng làm nặng máy trình chiếu cũ | Tất cả anim ≤ 200ms, dùng transform/opacity, khím tunning `prefers-reduced-motion` |
| Phân đôi migration `.whiteboards` đang mới (31/10) | Migration mới `20261031_whiteboards_metadata.sql` (metadata JSONB + shares) — code giờ chỉ plan |

---

## 11. Tóm tắt thứ tự thực hiện (checklist gắn người)

- [ ] W-1.1 Thumbnail thật + skeleton + hover tinh chỉnh
- [ ] W-1.2 Stagger animation + empty state + templates hàng đầu
- [ ] W-1.3 Teach mode persist per exam
- [ ] W-2.1 Thư viện STEM 20–25 khuôn theo môn
- [ ] W-2.2 KaTeX insert + preset văn bản
- [ ] W-2.3 Trình chiếu F + laser + khóa zoom
- [ ] W-2.4 Đồng bộ palette với overlay 3D
- [ ] W-3.1 Share link read-only + trang viewer
- [ ] W-3.2 Gắn bảng ↔ đề thi / lab 3D (metadata JSONB)
- [ ] P2: realtime hoặc AI — quyết định sau W-3 kèm data GV
