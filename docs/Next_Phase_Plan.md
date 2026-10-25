# EduTest AI - Kế hoạch phát triển tiếp theo

## 📊 Đánh giá hiện trạng (Đã hoàn thành)

### ✅ Đã xong:
| Phần | Chi tiết |
|------|----------|
| **Documentation** | Architecture, DB Schema, API Design, LLM Routing, Anti-Abuse Plan |
| **Frontend Scaffold** | Next.js App Router, Layout, Landing page, Auth pages (UI only) |
| **Frontend Pages** | Dashboard, Exams list, Create exam form, Wallet, Settings (tất cả là **static/mock data**) |
| **Frontend Infra** | Supabase client/server setup, Tailwind + globals.css, Component layout (navbar, footer) |
| **AI Service Scaffold** | FastAPI app, LLM Gateway/Router, Providers (DeepSeek, Google), Agents (question_generator, verifier), Health endpoint |

### ❌ Chưa xong (tất cả pages đều dùng mock data, chưa kết nối thực):
- Auth chưa hoạt động (Google OAuth commented out, chưa có middleware protect route)
- Database chưa tạo tables trên Supabase
- Chưa có Spring Boot backend (Main API)
- Frontend chưa gọi API thật, tất cả hardcode data
- AI Service chưa test thực với LLM providers

---

## 🎯 Bước tiếp theo: Phase "Database + Auth + API thật" 

> **Mục tiêu**: Biến app từ "demo UI tĩnh" → "app hoạt động thật" với auth, database, và luồng tạo đề cơ bản.

---

### 📋 PHASE TIẾP THEO: 5 bước chính

### **Bước 1: Setup Database trên Supabase** ⭐ ƯU TIÊN CAO NHẤT
> Nền tảng cho mọi thứ - không có DB thì không làm được gì

- [ ] Tạo tables trên Supabase: `users`, `wallets`, `wallet_txns`, `exams`, `questions`, `marketplace`
- [ ] Enable RLS (Row Level Security) cho tất cả tables
- [ ] Tạo RLS policies theo Database_Schema.md
- [ ] Tạo trigger: auto-create wallet khi user mới đăng ký (signup bonus 5000 credits)
- [ ] Tạo database types cho TypeScript (`generate_typescript_types`)

### **Bước 2: Auth hoạt động thật** ⭐ ƯU TIÊN CAO
> User cần đăng nhập được trước khi dùng bất kỳ tính năng nào

- [ ] Enable Google OAuth trên Supabase Dashboard (Google Cloud Console → OAuth 2.0 Client)
- [ ] Kết nối login page với Supabase Auth (bỏ comment, gọi `supabase.auth.signInWithOAuth`)
- [ ] Hoàn thiện `/auth/callback/route.ts` xử lý OAuth redirect
- [ ] Tạo middleware.ts protect dashboard routes (redirect về /login nếu chưa auth)
- [ ] Tạo AuthContext/hooks: `useUser()`, `useSession()`
- [ ] Update Navbar hiển thị user info thật (avatar, tên)
- [ ] Xử lý logout

### **Bước 3: Dashboard & Exams kết nối Database** 
> Hiện tại tất cả dữ liệu là hardcode, cần đọc/ghi từ Supabase

- [ ] Tạo API layer (`lib/api/`) với các hàm gọi Supabase
- [ ] Dashboard: Load stats thật (đếm exams, questions, wallet balance)
- [ ] Exams list: Load danh sách đề thi từ DB, hiện trạng thái thật
- [ ] Wallet page: Hiển thị balance thật, lịch sử giao dịch từ `wallet_txns`
- [ ] Settings page: Load/update profile từ `users` table

### **Bước 4: Luồng tạo đề thi End-to-End** 🚀 CORE FEATURE
> Đây là tính năng cốt lõi - teacher tạo đề → AI sinh câu hỏi → lưu DB → hiển thị

- [ ] Frontend: Create Exam form gửi request tới AI Service (FastAPI)
- [ ] AI Service: Hoàn thiện `question_generator` agent gọi LLM thật (DeepSeek/Gemini)
- [ ] AI Service: Hoàn thiện `verifier` agent kiểm tra chất lượng câu hỏi
- [ ] Lưu exam + questions vào Supabase sau khi AI sinh xong
- [ ] Trừ credits từ wallet khi tạo đề thành công
- [ ] Tạo trang xem chi tiết đề thi (`/exams/[id]`) 
- [ ] UI review câu hỏi: cho phép giáo viên sửa/xóa/thêm câu trước khi finalize

### **Bước 5: Export Word (.docx)** 
> Tính năng "đóng gói" - xuất file Word chuẩn A4 để in

- [ ] Chọn thư viện export (docx.js hoặc server-side với python-docx)
- [ ] Template Word chuẩn Times New Roman, lề A4
- [ ] Export đề thi + đáp án riêng
- [ ] Trừ credits khi export

---

## 🏗️ Quyết định kiến trúc cần làm rõ

### ❓ Bỏ Spring Boot hay giữ?
Theo Architecture.md, luồng là: `Next.js → Spring Boot → FastAPI`. Nhưng với Phase MVP:

**Option A: Giữ 3 services** (như thiết kế)
- Pro: Đúng kiến trúc, tách biệt business logic
- Con: Phức tạp, mất thêm 1-2 tuần setup Spring Boot

**Option B: Next.js API Routes + FastAPI** (bỏ Spring Boot ở MVP)
- Pro: Nhanh hơn nhiều, Next.js API Routes xử lý CRUD + auth middleware, FastAPI chỉ lo AI
- Con: Sau này cần refactor nếu scale lên Spring Boot

**➡️ Đề xuất: Option B** cho MVP - dùng Next.js API Routes (`app/api/`) thay Spring Boot. Sau khi có revenue mới tách ra Spring Boot.

---

## 📅 Timeline ước tính

| Bước | Thời gian | Ghi chú |
|------|-----------|---------|
| 1. Database Setup | 1 ngày | Migration scripts + RLS |
| 2. Auth | 1-2 ngày | Google OAuth + middleware |
| 3. Dashboard kết nối DB | 1-2 ngày | CRUD operations |
| 4. Luồng tạo đề E2E | 3-5 ngày | Core feature, cần test kỹ |
| 5. Export Word | 2-3 ngày | Template + formatting |
| **Tổng** | **~8-13 ngày** | |

---

## 🎯 Khuyến nghị: Bắt đầu từ Bước 1 → Bước 2

**Lý do**: Database và Auth là nền tảng. Mọi tính năng khác đều phụ thuộc vào 2 thứ này. Sau khi auth hoạt động + DB có data, các bước còn lại sẽ nhanh hơn nhiều vì đã có "xương sống".