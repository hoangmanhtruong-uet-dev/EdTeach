# Prompts phân việc cho 2 Agent

---

## 🅰️ PROMPT CHO AGENT 1: Track A — Frontend + Database + Auth

Copy toàn bộ nội dung dưới đây và paste vào Cline task mới:

---

```
Bạn đang làm việc trên dự án EduTest AI - nền tảng giúp giáo viên tạo đề thi bằng AI.

## Hiện trạng dự án
- Frontend Next.js đã có scaffold hoàn chỉnh với các trang: Landing, Login, Register, Dashboard, Exams, Create Exam, Wallet, Settings
- TẤT CẢ trang frontend đều đang dùng **mock/hardcode data**, chưa kết nối database hay auth thật
- Supabase client đã setup tại `frontend/src/lib/supabase/client.ts` và `server.ts`
- Auth pages có UI nhưng chưa gọi Supabase Auth (code commented out)
- Chưa có middleware bảo vệ routes
- Chưa tạo database tables trên Supabase

## Nhiệm vụ của bạn
Thực hiện tuần tự 4 phần sau. Mỗi phần phải hoàn thành và test trước khi chuyển sang phần tiếp theo.

### Phần 1: Setup Database trên Supabase
Đọc file `docs/Database_Schema.md` để hiểu cấu trúc database đã thiết kế.

Tạo các tables trên Supabase thông qua migration:

1. Bảng `users`:
   - id (uuid, PK, references auth.users)
   - email (text, unique, not null)
   - name (text)
   - role (text, default 'teacher')
   - school (text)
   - avatar_url (text)
   - created_at (timestamptz, default now())

2. Bảng `wallets`:
   - id (uuid, PK, default gen_random_uuid())
   - user_id (uuid, FK → users.id, unique, not null)
   - balance (integer, default 0, not null)
   - created_at (timestamptz, default now())
   - updated_at (timestamptz, default now())

3. Bảng `wallet_txns`:
   - id (uuid, PK, default gen_random_uuid())
   - wallet_id (uuid, FK → wallets.id, not null)
   - amount (integer, not null) -- positive = credit, negative = debit
   - type (text, not null) -- 'signup_bonus', 'generate_exam', 'export', 'purchase', 'refund'
   - description (text)
   - ref_id (uuid) -- reference to exam_id or other entity
   - created_at (timestamptz, default now())

4. Bảng `exams`:
   - id (uuid, PK, default gen_random_uuid())
   - user_id (uuid, FK → users.id, not null)
   - name (text, not null)
   - subject (text, not null)
   - grade (text, not null)
   - chapter (text)
   - config (jsonb) -- stores question_type, difficulty, additional_notes
   - status (text, default 'draft') -- 'draft', 'generating', 'completed', 'failed'
   - credit_cost (integer, default 0)
   - question_count (integer, default 0)
   - created_at (timestamptz, default now())
   - updated_at (timestamptz, default now())

5. Bảng `questions`:
   - id (uuid, PK, default gen_random_uuid())
   - exam_id (uuid, FK → exams.id ON DELETE CASCADE, not null)
   - type (text, not null) -- 'multiple_choice', 'true_false', 'essay', 'fill_blank'
   - content (text, not null)
   - options (jsonb) -- {"A": "...", "B": "...", "C": "...", "D": "..."}
   - correct_answer (text)
   - explanation (text)
   - difficulty (text)
   - order_index (integer)
   - created_at (timestamptz, default now())

Sau khi tạo tables:
- Enable RLS cho TẤT CẢ tables
- Tạo RLS policies: user chỉ CRUD được data có user_id = auth.uid()
- Với `questions`: policy dựa trên exam.user_id (join qua exams table)
- Tạo trigger function: khi có record mới trong auth.users → auto insert vào `users` table + tạo `wallets` record với balance = 5000 (signup bonus) + tạo `wallet_txns` ghi nhận bonus
- Tạo index: exams(user_id), questions(exam_id), wallet_txns(wallet_id), wallets(user_id)

### Phần 2: Auth hoạt động thật
1. Update `frontend/src/app/(auth)/login/page.tsx`:
   - Bỏ comment code Google OAuth, gọi thật `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '${origin}/auth/callback' } })`
   - Form email/password gọi `supabase.auth.signInWithPassword()`
   - Hiển thị error message khi login thất bại
   - Redirect về /dashboard khi login thành công

2. Update `frontend/src/app/(auth)/register/page.tsx`:
   - Gọi `supabase.auth.signUp()` cho email/password
   - Google OAuth signup (cùng flow với login)
   - Hiển thị thông báo xác nhận email

3. Hoàn thiện `frontend/src/app/auth/callback/route.ts`:
   - Exchange auth code for session
   - Redirect về /dashboard

4. Tạo `frontend/src/middleware.ts`:
   - Import createServerClient từ @supabase/ssr
   - Protect routes: /dashboard/*, /exams/*, /wallet/*, /settings/*
   - Nếu chưa auth → redirect /login
   - Nếu đã auth mà vào /login hoặc /register → redirect /dashboard
   - Refresh session token

5. Tạo `frontend/src/hooks/useAuth.ts`:
   - Custom hook useAuth() trả về { user, session, loading, signOut }
   - Listen onAuthStateChange

6. Tạo `frontend/src/components/providers/auth-provider.tsx`:
   - Context provider wrap app
   - Quản lý auth state globally

7. Update `frontend/src/components/layout/navbar.tsx`:
   - Hiện avatar + tên user thật (từ auth state)
   - Dropdown menu: Profile, Settings, Logout
   - Nút logout gọi signOut()

### Phần 3: Kết nối tất cả trang với Database
1. Tạo `frontend/src/lib/api/exams.ts`:
   ```typescript
   export async function getExams(userId: string) // SELECT * FROM exams WHERE user_id = ?
   export async function getExam(id: string) // SELECT * FROM exams WHERE id = ? + JOIN questions  
   export async function createExam(data: CreateExamInput) // INSERT INTO exams
   export async function updateExam(id: string, data: Partial<Exam>) // UPDATE exams
   export async function deleteExam(id: string) // DELETE FROM exams
   ```

2. Tạo `frontend/src/lib/api/wallet.ts`:
   ```typescript
   export async function getWallet(userId: string) // SELECT * FROM wallets WHERE user_id = ?
   export async function getTransactions(walletId: string) // SELECT * FROM wallet_txns ORDER BY created_at DESC
   export async function deductCredits(walletId: string, amount: number, type: string, description: string, refId?: string)
   ```

3. Tạo `frontend/src/lib/api/user.ts`:
   ```typescript
   export async function getProfile(userId: string)
   export async function updateProfile(userId: string, data: Partial<User>)
   ```

4. Update từng trang thay mock data bằng data thật:
   - `/dashboard/page.tsx`: Server component, load stats (tổng đề thi, tổng câu hỏi, wallet balance, đề gần đây)
   - `/exams/page.tsx`: Load danh sách đề thi từ DB, hiện trạng thái thật, phân trang
   - `/wallet/page.tsx`: Hiện balance thật, lịch sử giao dịch
   - `/settings/page.tsx`: Load profile, cho phép update name, school

5. Thêm loading states (skeleton) và error states cho tất cả trang

### Phần 4: Next.js API Routes
Tạo API routes để xử lý business logic phức tạp (chuẩn bị cho việc integrate với AI Service sau):

1. `frontend/src/app/api/exams/route.ts` - GET list, POST create
2. `frontend/src/app/api/exams/[id]/route.ts` - GET detail, PUT update, DELETE
3. `frontend/src/app/api/exams/[id]/generate/route.ts` - POST: placeholder cho AI generation (tạm return mock data, agent Track B sẽ hoàn thiện AI service)
4. `frontend/src/app/api/wallet/route.ts` - GET wallet info
5. `frontend/src/app/api/wallet/deduct/route.ts` - POST trừ credits

Mỗi API route phải:
- Validate auth session (trả 401 nếu chưa login)
- Validate request body
- Return structured JSON response
- Handle errors gracefully

## Quy tắc quan trọng
- Dùng Supabase JS client (KHÔNG dùng REST API trực tiếp)
- Server components dùng `createClient()` từ `lib/supabase/server.ts`
- Client components dùng `createClient()` từ `lib/supabase/client.ts`
- Tất cả database operations phải qua RLS (không dùng service_role key ở frontend)
- Follow existing code style: Tailwind CSS, lucide-react icons
- TypeScript strict mode
- Giữ nguyên UI design hiện tại, chỉ thay data source từ mock → real

## Files cần đọc trước khi bắt đầu
- docs/Database_Schema.md
- docs/Architecture.md
- docs/Parallel_Task_Plan.md (Track A)
- frontend/src/lib/supabase/client.ts
- frontend/src/lib/supabase/server.ts
- frontend/src/app/(auth)/login/page.tsx
- frontend/src/app/(dashboard)/layout.tsx
- frontend/src/app/(dashboard)/dashboard/page.tsx
```

---

## 🅱️ PROMPT CHO AGENT 2: Track B — AI Service hoàn thiện

Copy toàn bộ nội dung dưới đây và paste vào Cline task mới:

---

```
Bạn đang làm việc trên dự án EduTest AI - nền tảng giúp giáo viên Việt Nam tạo đề thi bằng AI.

## Hiện trạng AI Service
- FastAPI app đã có scaffold tại `ai-service/`
- Đã có: LLM Gateway (`app/gateway/`), Providers (DeepSeek, Google), Agents (question_generator, verifier), Health endpoint, Generation router
- TẤT CẢ đều là **scaffold/skeleton** — logic bên trong chưa hoàn thiện, chưa test với LLM thật
- File `ai-service/requirements.txt` đã có dependencies
- File `ai-service/.env.example` đã có config template

## Nhiệm vụ của bạn
Hoàn thiện AI Service để có thể nhận request tạo đề thi → gọi LLM → trả về danh sách câu hỏi chất lượng. Thực hiện tuần tự 5 phần.

### Phần 1: Prompt Engineering — Question Generator Agent
File: `ai-service/app/agents/question_generator.py`

Hoàn thiện agent này với các khả năng:

1. **System prompt** chi tiết cho LLM:
   - Vai trò: Bạn là chuyên gia giáo dục Việt Nam, soạn đề thi theo chuẩn Bộ GD&ĐT
   - Output: PHẢI trả về JSON array theo schema chuẩn (defined below)
   - Ngôn ngữ: Tiếng Việt, có dấu đầy đủ
   - Chất lượng: Câu hỏi không mơ hồ, đáp án sai phải hợp lý (không hiển nhiên sai)

2. **Prompt templates** cho từng dạng câu hỏi:
   - `multiple_choice`: Sinh câu hỏi + 4 đáp án A/B/C/D + 1 đáp án đúng + giải thích
   - `true_false`: Sinh mệnh đề + đúng/sai + giải thích
   - `essay`: Sinh câu hỏi mở + gợi ý đáp án + rubric chấm
   - `fill_blank`: Sinh câu có chỗ trống + đáp án + giải thích

3. **Prompt templates** cho từng mức độ khó:
   - `easy` (Nhận biết): Câu hỏi recall kiến thức cơ bản
   - `medium` (Thông hiểu): Cần hiểu khái niệm để trả lời
   - `hard` (Vận dụng): Áp dụng kiến thức giải bài toán
   - `very_hard` (Vận dụng cao): Bài toán phức tạp, tổng hợp nhiều kiến thức

4. **Xử lý đặc thù từng môn**:
   - Toán: Công thức LaTeX trong nội dung câu hỏi (dùng $...$ cho inline, $$...$$ cho block)
   - Vật lý/Hóa học: Đơn vị đo, ký hiệu hóa học
   - Ngữ văn: Trích dẫn tác phẩm, phân tích
   - Tiếng Anh: Grammar, vocabulary, reading comprehension
   - Lịch sử/Địa lý: Sự kiện, mốc thời gian, số liệu chính xác

5. **Output schema** (JSON) — BẮT BUỘC LLM phải trả đúng format này:
   ```json
   {
     "questions": [
       {
         "type": "multiple_choice",
         "content": "Tìm đạo hàm của hàm số $y = x^3 - 3x^2 + 2$",
         "options": {
           "A": "$3x^2 - 6x$",
           "B": "$3x^2 - 6x + 2$",
           "C": "$x^2 - 6x$",
           "D": "$3x^2 - 3x$"
         },
         "correct_answer": "A",
         "explanation": "Áp dụng công thức đạo hàm: $(x^n)' = nx^{n-1}$. Ta có $y' = 3x^2 - 6x$",
         "difficulty": "medium",
         "topic": "Đạo hàm"
       }
     ]
   }
   ```

6. **Implement hàm generate**:
   ```python
   async def generate_questions(
       subject: str,
       grade: str,
       chapter: str,
       question_type: str,
       num_questions: int,
       difficulty: str,
       additional_notes: str = ""
   ) -> dict:
   ```
   - Build prompt từ templates
   - Gọi LLM qua gateway
   - Parse JSON response (handle malformed JSON bằng retry hoặc regex extract)
   - Validate mỗi câu hỏi có đủ fields
   - Return structured result

### Phần 2: Verifier Agent
File: `ai-service/app/agents/verifier.py`

Hoàn thiện agent xác minh chất lượng câu hỏi:

1. **Verification checks**:
   - Mỗi câu hỏi có đủ required fields
   - Multiple choice: có đúng 4 đáp án, correct_answer là A/B/C/D
   - Không có 2 câu hỏi trùng nội dung (similarity check đơn giản)
   - Đáp án đúng phải có giải thích
   - Content không rỗng, không quá ngắn

2. **Optional LLM verification** (gọi LLM lần 2 để kiểm tra):
   - Câu hỏi có đúng chủ đề không?
   - Đáp án đúng có chính xác không?
   - Mức độ khó có phù hợp không?
   - Có lỗi kiến thức không?

3. **Output**: Quality report
   ```json
   {
     "total": 40,
     "passed": 38,
     "failed": 2,
     "issues": [
       {"question_index": 5, "issue": "Đáp án C và D giống nhau", "severity": "high"},
       {"question_index": 12, "issue": "Câu hỏi quá dễ cho mức 'hard'", "severity": "medium"}
     ],
     "overall_score": 95
   }
   ```

### Phần 3: LLM Gateway & Router
Files: `ai-service/app/gateway/llm_gateway.py`, `ai-service/app/gateway/router.py`

Hoàn thiện:
1. **DeepSeek Provider** (`app/providers/deepseek_provider.py`):
   - Gọi DeepSeek API (OpenAI-compatible, base_url = "https://api.deepseek.com")
   - Model: deepseek-chat
   - Handle response parsing
   - Error handling (rate limit, timeout, API errors)

2. **Google Provider** (`app/providers/google_provider.py`):
   - Gọi Gemini API (google-generativeai SDK hoặc REST)
   - Model: gemini-2.0-flash (hoặc gemini-pro)
   - Handle response parsing

3. **Router logic**:
   - Default: dùng DeepSeek (rẻ hơn)
   - Fallback: nếu DeepSeek fail → tự động chuyển Gemini
   - Config chọn provider qua request parameter hoặc env var

4. **Gateway**:
   - Unified interface gọi bất kỳ provider
   - Retry logic (max 3 retries với exponential backoff)
   - Timeout handling (max 120s cho generation)
   - Logging: log mỗi call (provider, model, tokens, latency)

### Phần 4: API Endpoints
File: `ai-service/app/routers/generation.py`

Hoàn thiện endpoints:

1. **POST /api/v1/generate**:
   ```
   Request Body:
   {
     "subject": "Toán",
     "grade": "12",
     "chapter": "Đạo hàm",
     "question_type": "multiple_choice",
     "num_questions": 40,
     "difficulty": "medium",
     "additional_notes": "Tập trung bài toán thực tế"
   }
   
   Response:
   {
     "success": true,
     "data": {
       "questions": [...],
       "metadata": {
         "total_questions": 40,
         "provider": "deepseek",
         "model": "deepseek-chat",
         "total_tokens": 15000,
         "estimated_credits": 8,
         "generation_time_seconds": 45.2
       }
     }
   }
   ```

2. **POST /api/v1/verify**:
   ```
   Request: { "questions": [...] }
   Response: { "success": true, "data": { quality_report } }
   ```

3. **GET /api/v1/health**:
   ```
   Response: {
     "status": "healthy",
     "providers": {
       "deepseek": { "status": "available", "latency_ms": 150 },
       "google": { "status": "available", "latency_ms": 200 }
     }
   }
   ```

4. **Pydantic models** cho request/response validation (tạo trong `app/models/`)

5. **Error handling middleware**: trả JSON error thống nhất
   ```json
   { "success": false, "error": { "code": "LLM_TIMEOUT", "message": "..." } }
   ```

### Phần 5: Testing
1. Tạo `ai-service/tests/` folder
2. Test prompt templates: verify output JSON format đúng schema
3. Test với DeepSeek API thật: sinh 5 câu Toán lớp 12 → verify format
4. Test với Gemini API thật: sinh 5 câu Vật lý lớp 11 → verify format
5. Test fallback: mock DeepSeek fail → verify chuyển sang Gemini
6. Test edge cases:
   - Số câu hỏi lớn (50 câu)
   - Chủ đề rất hẹp ("Phương trình mũ logarit dạng đặc biệt")
   - Tiếng Việt có dấu trong đáp án
   - Công thức Toán phức tạp
7. Đo latency trung bình mỗi request
8. Tính chi phí API thật cho 1 đề thi 40 câu

## Quy tắc quan trọng
- Python 3.11+, async/await throughout
- Type hints cho tất cả functions
- Dùng httpx cho HTTP calls (async)
- Logging chuẩn Python logging module
- Environment variables qua pydantic-settings (đã setup ở `app/core/config.py`)
- KHÔNG kết nối database trực tiếp — AI Service chỉ nhận request và trả response, việc lưu DB do Frontend (Track A) lo
- Đọc kỹ các file đã có trước khi sửa, giữ cấu trúc folder hiện tại
- Nếu cần thêm dependency → thêm vào requirements.txt

## Files cần đọc trước khi bắt đầu
- docs/Architecture.md (phần AI Service)
- docs/LLM_Routing_Plan.md
- docs/API_Design.md
- docs/Parallel_Task_Plan.md (Track B)
- ai-service/main.py
- ai-service/app/core/config.py
- ai-service/app/core/dependencies.py
- ai-service/app/gateway/llm_gateway.py
- ai-service/app/gateway/router.py
- ai-service/app/providers/base_provider.py
- ai-service/app/providers/deepseek_provider.py
- ai-service/app/providers/google_provider.py
- ai-service/app/agents/question_generator.py
- ai-service/app/agents/verifier.py
- ai-service/app/routers/generation.py
- ai-service/requirements.txt
- ai-service/.env.example
```

---

## ⚠️ Lưu ý khi chạy song song

1. **Không đụng chạm file của nhau**:
   - Agent 1 chỉ sửa files trong `frontend/` + Supabase DB
   - Agent 2 chỉ sửa files trong `ai-service/`
   - Không ai sửa files trong `docs/` (chỉ đọc)

2. **Điểm hội tụ**: Sau khi cả 2 agent xong, cần 1 task cuối cùng để integrate:
   - Frontend gọi AI Service endpoint thật (thay mock)
   - Lưu kết quả AI vào DB
   - Test E2E flow

3. **Nếu Agent cần Supabase Access Token**: Cung cấp token thật cho Agent 1 (Track A) để tạo tables/migrations.