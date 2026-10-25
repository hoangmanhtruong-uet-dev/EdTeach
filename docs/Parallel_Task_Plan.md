# EduTest AI - Kế hoạch chạy song song 2 Task

> **Chiến lược**: Tách project thành 2 track độc lập, chạy song song, hội tụ khi cả hai sẵn sàng.

---

## 🔀 Tổng quan 2 Track

```
Track A (Frontend + DB + Auth)          Track B (AI Service hoàn thiện)
================================        ================================
1. Setup Database Supabase              1. Hoàn thiện Question Generator
2. Auth hoạt động thật                  2. Hoàn thiện Verifier Agent  
3. Dashboard kết nối DB                 3. Prompt Engineering & Templates
4. Next.js API Routes (CRUD)            4. Test thật với DeepSeek/Gemini
                                        5. Streaming response + error handling
        ↓                                           ↓
        └──────────── HỘI TỤ ──────────────────────┘
                         ↓
              Luồng tạo đề End-to-End
              Export Word (.docx)
```

---

## 📋 TRACK A: Frontend + Database + Auth

> **Phụ trách**: Frontend dev / Fullstack
> **Công nghệ**: Next.js, Supabase, TypeScript
> **Không phụ thuộc**: AI Service (có thể mock AI response)

### A1. Setup Database trên Supabase (~1 ngày)
- [ ] Tạo migration cho bảng `users` (id, email, name, role, school, avatar_url, created_at)
- [ ] Tạo migration cho bảng `wallets` (id, user_id, balance, created_at, updated_at)
- [ ] Tạo migration cho bảng `wallet_txns` (id, wallet_id, amount, type, description, ref_id, created_at)
- [ ] Tạo migration cho bảng `exams` (id, user_id, name, subject, grade, chapter, config, status, credit_cost, created_at)
- [ ] Tạo migration cho bảng `questions` (id, exam_id, type, content, options, correct_answer, explanation, difficulty, order_index)
- [ ] Enable RLS cho tất cả tables
- [ ] RLS policies: user chỉ thấy data của mình (SELECT/INSERT/UPDATE where user_id = auth.uid())
- [ ] Trigger: khi user mới signup → auto insert vào `users` + tạo `wallet` với balance = 5000
- [ ] Seed data test (optional)

### A2. Auth hoạt động thật (~1-2 ngày)
- [ ] Cấu hình Google OAuth Provider trên Supabase Dashboard
- [ ] Update `/login/page.tsx`: gọi `supabase.auth.signInWithOAuth({ provider: 'google' })`
- [ ] Update `/register/page.tsx`: gọi `supabase.auth.signUp()` cho email/password
- [ ] Hoàn thiện `/auth/callback/route.ts`: exchange code → session
- [ ] Tạo `middleware.ts` ở root frontend:
  ```typescript
  // Protect /dashboard/*, /exams/*, /wallet/*, /settings/*
  // Redirect to /login nếu chưa auth
  // Redirect to /dashboard nếu đã auth mà vào /login
  ```
- [ ] Tạo `hooks/useAuth.ts`: useUser(), useSession(), signOut()
- [ ] Tạo `components/providers/auth-provider.tsx`: wrap app với session listener
- [ ] Update `navbar.tsx`: hiện avatar + tên thật, dropdown menu với logout
- [ ] Test flow: Login → Dashboard → Logout → Redirect

### A3. Dashboard & Pages kết nối DB (~1-2 ngày)
- [ ] Tạo `lib/api/exams.ts`: getExams(), getExam(id), createExam(), updateExam()
- [ ] Tạo `lib/api/wallet.ts`: getBalance(), getTransactions()
- [ ] Tạo `lib/api/user.ts`: getProfile(), updateProfile()
- [ ] Update `/dashboard/page.tsx`: load stats thật (count exams, sum questions, wallet balance)
- [ ] Update `/exams/page.tsx`: load danh sách từ DB, search/filter
- [ ] Update `/wallet/page.tsx`: balance + transaction history thật
- [ ] Update `/settings/page.tsx`: load/save profile thật
- [ ] Loading states + error handling cho tất cả pages

### A4. Next.js API Routes cho Business Logic (~1 ngày)
- [ ] `app/api/exams/route.ts`: GET (list), POST (create exam record)
- [ ] `app/api/exams/[id]/route.ts`: GET (detail), PUT (update), DELETE
- [ ] `app/api/exams/[id]/generate/route.ts`: POST → gọi AI Service, lưu kết quả
- [ ] `app/api/wallet/route.ts`: GET balance
- [ ] `app/api/wallet/deduct/route.ts`: POST trừ credits (with transaction log)
- [ ] Auth validation ở mỗi API route (kiểm tra session)

---

## 📋 TRACK B: AI Service hoàn thiện

> **Phụ trách**: AI/Backend dev
> **Công nghệ**: Python, FastAPI, LLM APIs
> **Không phụ thuộc**: Frontend/Database (test bằng Swagger/curl)

### B1. Hoàn thiện Question Generator Agent (~2-3 ngày)
- [ ] Thiết kế prompt template chi tiết cho từng dạng câu hỏi:
  - Multiple choice (4 đáp án A-D, 1 đúng, 3 sai hợp lý)
  - True/False
  - Essay (câu hỏi mở + rubric chấm điểm)
  - Fill-in-the-blank
- [ ] Prompt template cho từng môn học (Toán, Lý, Hóa, Sinh, Văn, Anh, Sử, Địa, GDCD, Tin)
- [ ] Prompt template cho từng mức độ khó (Nhận biết → Vận dụng cao)
- [ ] Structured output: bắt buộc LLM trả JSON theo schema chuẩn
- [ ] Parse & validate LLM response (handle malformed JSON, retry logic)
- [ ] Batch generation: sinh nhiều câu hỏi trong 1 lần gọi vs chia nhỏ
- [ ] Token counting & cost estimation trước khi gọi LLM

### B2. Hoàn thiện Verifier Agent (~1-2 ngày)  
- [ ] Verify nội dung câu hỏi: không trùng lặp, đúng cấp độ, đúng chủ đề
- [ ] Verify đáp án: chỉ có 1 đáp án đúng (multiple choice), giải thích logic
- [ ] Verify chất lượng: câu hỏi rõ ràng, không ambiguous, không có lỗi kiến thức
- [ ] Auto-fix: nếu phát hiện lỗi nhẹ → sửa tự động, lỗi nặng → flag để review
- [ ] Scoring system: mỗi câu hỏi có quality score (0-100)

### B3. LLM Gateway & Router hoàn thiện (~1 ngày)
- [ ] Test thật với DeepSeek API (verify API key, rate limits)
- [ ] Test thật với Google Gemini API
- [ ] Implement routing logic: chọn provider dựa trên cost/quality/availability
- [ ] Fallback mechanism: nếu provider A fail → tự động chuyển sang provider B
- [ ] Rate limiting: không vượt quá quota của từng provider
- [ ] Caching: cache kết quả tương tự để tiết kiệm API calls
- [ ] Logging: log mỗi LLM call (latency, tokens, cost, provider)

### B4. API Endpoints hoàn thiện (~1 ngày)
- [ ] `POST /api/v1/generate`: nhận exam config → trả câu hỏi (JSON)
  ```json
  // Request
  {
    "subject": "Toán",
    "grade": "12", 
    "chapter": "Hàm số lũy thừa",
    "question_type": "multiple_choice",
    "num_questions": 40,
    "difficulty": "medium",
    "additional_notes": "..."
  }
  // Response
  {
    "exam_id": "...",
    "questions": [...],
    "metadata": { "total_tokens": ..., "cost_credits": ..., "provider": "deepseek" }
  }
  ```
- [ ] `POST /api/v1/verify`: nhận danh sách câu hỏi → trả quality report
- [ ] `GET /api/v1/health`: health check + provider status
- [ ] Streaming endpoint (SSE): `/api/v1/generate/stream` → stream từng câu hỏi realtime
- [ ] Request validation với Pydantic models
- [ ] Error handling: structured error responses
- [ ] Auth middleware: validate Supabase JWT token từ request header

### B5. Testing & Optimization (~1 ngày)
- [ ] Unit tests cho prompt templates (verify output format)
- [ ] Integration test: full flow generate → verify → response
- [ ] Test với nhiều môn học khác nhau (đặc biệt Toán có công thức)
- [ ] Test edge cases: số câu hỏi lớn (50), chủ đề rất hẹp, tiếng Việt dấu
- [ ] Performance: đo latency, optimize batch size
- [ ] Cost analysis: chi phí thật mỗi đề thi theo từng provider

---

## 🔗 Điểm hội tụ (sau khi cả 2 track xong)

### Merge: Luồng tạo đề End-to-End (~1-2 ngày)
- [ ] Frontend form → Next.js API Route → FastAPI AI Service → Response
- [ ] Lưu kết quả vào Supabase (exams + questions tables)
- [ ] Trừ credits từ wallet
- [ ] UI hiển thị kết quả: trang xem đề `/exams/[id]`
- [ ] UI review: giáo viên sửa/xóa câu hỏi
- [ ] Loading state: streaming hoặc progress bar trong lúc AI đang sinh

### Merge: Export Word (.docx) (~2 ngày)
- [ ] Tích hợp thư viện docx generation
- [ ] Template chuẩn A4, Times New Roman
- [ ] Export đề + đáp án riêng
- [ ] Download file từ frontend

---

## ⚡ Giao tiếp giữa 2 Track

| Cần thống nhất | Chi tiết |
|----------------|----------|
| **API Contract** | Request/Response JSON schema cho `/api/v1/generate` |
| **Auth Token** | AI Service cần validate Supabase JWT → cùng dùng SUPABASE_JWT_SECRET |
| **Question Schema** | Cấu trúc JSON của 1 câu hỏi phải match giữa AI output và DB schema |
| **Error Codes** | Thống nhất error code format giữa frontend ↔ AI service |

### Question JSON Schema (cả 2 track phải follow):
```json
{
  "type": "multiple_choice",
  "content": "Câu hỏi ở đây...",
  "options": {
    "A": "Đáp án A",
    "B": "Đáp án B", 
    "C": "Đáp án C",
    "D": "Đáp án D"
  },
  "correct_answer": "B",
  "explanation": "Giải thích tại sao B đúng...",
  "difficulty": "medium",
  "topic": "Hàm số lũy thừa"
}
```

---

## 📅 Timeline song song

```
Ngày 1-2:   Track A: Database + Auth setup     |  Track B: Prompt templates + Generator
Ngày 3-4:   Track A: Auth hoàn thiện           |  Track B: Verifier + LLM Gateway test  
Ngày 5-6:   Track A: Dashboard kết nối DB      |  Track B: API endpoints + testing
Ngày 7-8:   ──────── HỘI TỤ: E2E Integration ────────
Ngày 9-10:  ──────── Export Word + Polish ─────────────
```

**Tổng: ~10 ngày** (thay vì ~13 ngày nếu chạy tuần tự)