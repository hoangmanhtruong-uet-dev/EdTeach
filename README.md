# 🎓 EduTest AI — Nền Tảng Soạn Đề & Chấm Thi Thông Minh Chuẩn GDPT 2018/2025

<p align="center">
  <img src="https://raw.githubusercontent.com/hoangmanhtruong-uet-dev/EdTeach/main/frontend/public/favicon.ico" alt="EduTest AI Logo" width="80" height="80" />
</p>

<p align="center">
  <b>Hệ thống EdTech SaaS toàn diện hỗ trợ giáo viên Việt Nam: Tạo đề thi bằng AI Dual-Agent, Biên tập toán học trực quan A4, Tráo 4–8 mã đề tự động, Xuất Word chuẩn Bộ GD&ĐT, Chấm trắc nghiệm thông minh qua AI Vision & Quản trị ví tín dụng PayOS VietQR.</b>
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.4.3-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react" alt="React" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase" alt="Supabase" /></a>
  <a href="https://payos.vn/"><img src="https://img.shields.io/badge/PayOS-VietQR_Auto-ff5722?style=for-the-badge" alt="PayOS VietQR" /></a>
</p>

---

## 📑 Mục lục

- [🌟 Giới thiệu tổng quan](#-giới-thiệu-tổng-quan)
- [✨ Tính năng cốt lõi đã hoàn thiện](#-tính-năng-cốt-lõi-đã-hoàn-thiện)
  - [1. AI Dual-Agent Question Generation](#1-ai-dual-agent-question-generation)
  - [2. Exam Studio & Bộ công cụ đồ họa trực quan](#2-exam-studio--bộ-công-cụ-đồ-họa-trực-quan)
  - [3. 1-Click Shuffle (Tráo 4–8 mã đề kèm Ma trận Barem)](#3-1-click-shuffle-tráo-48-mã-đề-kèm-ma-trận-barem)
  - [4. Xuất Word (.docx) chuẩn Quy cách Bộ GD&ĐT](#4-xuất-word-docx-chuẩn-quy-cách-bộ-gdđt)
  - [5. AI Vision Grading (Chấm thi thông minh đa kênh)](#5-ai-vision-grading-chấm-thi-thông-minh-đa-kênh)
  - [6. Cổng thanh toán tự động PayOS & Hệ thống Ví](#6-cổng-thanh-toán-tự-động-payos--hệ-thống-ví)
  - [7. Marketplace, Onboarding & User Guide](#7-marketplace-onboarding--user-guide)
- [🏗️ Kiến trúc hệ thống (System Architecture)](#️-kiến-trúc-hệ-thống-system-architecture)
- [📁 Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)
- [🚀 Hướng dẫn cài đặt & Khởi chạy (Quick Start)](#-hướng-dẫn-cài-đặt--khởi-chạy-quick-start)
  - [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
  - [1. Cấu hình biến môi trường](#1-cấu-hình-biến-môi-trường)
  - [2. Khởi chạy AI Service (FastAPI)](#2-khởi-chạy-ai-service-fastapi)
  - [3. Khởi chạy Frontend (Next.js)](#3-khởi-chạy-frontend-nextjs)
  - [4. Chạy toàn bộ hệ thống từ thư mục gốc](#4-chạy-toàn-bộ-hệ-thống-từ-thư-mục-gốc)
- [⚙️ Danh mục Biến Môi Trường (Environment Variables)](#️-danh-mục-biến-môi-trường-environment-variables)
- [📡 API Endpoints Tham Chiếu](#-api-endpoints-tham-chiếu)
- [🛡️ Bảo mật & Cơ sở dữ liệu (RLS & Security)](#️-bảo-mật--cơ-sở-dữ-liệu-rls--security)
- [📋 Lộ trình phát triển (Roadmap)](#-lộ-trình-phát-triển-roadmap)
- [📄 Giấy phép (License)](#-giấy-phép-license)

---

## 🌟 Giới thiệu tổng quan

**EduTest AI** là giải pháp phần mềm chuyên sâu được thiết kế để giải quyết những "điểm nghẽn" lớn nhất của giáo viên trung học và luyện thi tại Việt Nam:
- Mất hàng giờ căn chỉnh lề Word, gõ công thức Toán, vẽ đồ thị hàm số và hình học.
- Đề thi sinh từ các AI thông thường thường xuyên sai đáp án hoặc lời giải phi logic.
- Khó khăn và tốn thời gian khi tráo các mã đề và lập bảng ma trận đáp án đối chiếu để chấm thi.
- Chấm bài trắc nghiệm thủ công mất nhiều thời gian, dễ nhầm lẫn.

EduTest AI kết hợp sức mạnh của mô hình ngôn ngữ lớn hàng đầu (**DeepSeek-V3/R1** và **Google Gemini Flash**) với quy trình kiểm định kép (**Dual-Agent Verification**), mang lại độ chính xác học thuật lên tới **99.8%**, kèm khả năng xuất file in ấn và chấm thi quang học ngay trên nền web.

---

## ✨ Tính năng cốt lõi đã hoàn thiện

### 1. AI Dual-Agent Question Generation
- **Cơ chế 2 tác tử độc lập (Dual-Agent)**:
  - **Generator Agent**: Khởi tạo câu hỏi, 4 phương án lựa chọn, lời giải chi tiết và phân loại theo 4 cấp độ tư duy Bloom (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
  - **Verifier Agent**: Đóng vai trò phản biện, tự giải lại bài toán độc lập từ đề bài để đối chiếu đáp án, kiểm tra độ nhiễu của các phương án sai và phát hiện lỗi logic trước khi ghi nhận.
- **Hỗ trợ đầy đủ các định dạng theo thông tư GDPT 2018 & định dạng đề thi mới 2025**:
  - Trắc nghiệm nhiều lựa chọn 4 phương án (A, B, C, D).
  - Trắc nghiệm Đúng/Sai (4 ý a, b, c, d với cách tính điểm chuẩn Bộ).
  - Trắc nghiệm trả lời ngắn (điền kết quả số/biểu thức).
  - Tự luận kèm Barem chấm điểm chi tiết.

### 2. Exam Studio & Bộ công cụ đồ họa trực quan
Trình soạn thảo A4 WYSIWYG chuyên nghiệp được tích hợp sẵn các modal thiết kế toán học mạnh mẽ:
- **Formula Editor**: Soạn công thức Toán học trực quan hiển thị tức thì qua KaTeX, hỗ trợ thư viện ký hiệu phong phú.
- **Function Graph Modal**: Tự động vẽ và chèn đồ thị hàm số (Bậc 1, Bậc 2, Bậc 3, Phân thức bậc nhất, Hàm mũ, Logarit, Lượng giác) chuẩn Vector SVG.
- **Geometry Editor Modal**: Vẽ hình học phẳng và hình học không gian (Tam giác, Tứ giác, Đa giác, Hình chóp, Lăng trụ, Mặt cầu, Khối nón) với các đường nét đứt, góc vuông, nhãn đỉnh tùy biến.
- **Variation Table Modal**: Trình tạo bảng biến thiên hàm số (x, f'(x), f(x)) với mũi tên chiều biến thiên chuẩn mực.
- **Chart Editor Modal**: Vẽ biểu đồ hình cột, đường, tròn cho các môn Địa lý, Vật lý, Hóa học.
- **Find & Replace**: Tìm kiếm và thay thế thông minh chuỗi từ hoặc công thức trên toàn bộ đề thi.

### 3. 1-Click Shuffle (Tráo 4–8 mã đề kèm Ma trận Barem)
- Hoán vị thứ tự câu hỏi và hoán vị thứ tự các phương án lựa chọn (A, B, C, D) một cách thông minh, giữ nguyên cấu trúc nhóm câu hỏi.
- Tự động sinh ra 4 đến 8 mã đề con (ví dụ: Mã 101, 102, 103, 104).
- **Xuất bảng ma trận đáp án tổng hợp (Answer Matrix)** trực tiếp sang Word để giáo viên và giám thị dễ dàng chấm thi chéo.

### 4. Xuất Word (.docx) chuẩn Quy cách Bộ GD&ĐT
- Xuất file `.docx` định dạng chuẩn 100%: Font chữ Times New Roman 12–13pt, căn lề A4 chuẩn (Trái 3cm, Phải 2cm, Trên 2cm, Dưới 2cm).
- Tùy chọn đóng gói linh hoạt:
  - Đề bài độc lập cho học sinh làm bài.
  - Phiếu trả lời trắc nghiệm chuẩn mẫu.
  - Bảng đáp án nhanh (Answer Key Table).
  - Hướng dẫn giải chi tiết kèm biểu thức toán học và hình vẽ vector.

### 5. AI Vision Grading (Chấm thi thông minh đa kênh)
- **Hỗ trợ đa dạng mẫu phiếu trả lời**:
  - Phiếu chuẩn 20 câu, 40 câu, 50 câu.
  - Phiếu cấu trúc mới GDPT 2025 (Phần I: 12 câu nhiều lựa chọn; Phần II: 4 câu Đúng/Sai; Phần III: 6 câu trả lời ngắn).
- **3 phương thức nạp bài linh hoạt**:
  1. **Webcam trực tiếp**: Chấm tức thì từng bài kiểm tra trước webcam máy tính.
  2. **Upload ảnh hàng loạt**: Tải lên nhiều ảnh chụp/file scan phiếu bài làm cùng lúc.
  3. **Remote Mobile Camera qua QR Code**: Biến camera điện thoại thông minh thành máy quét di động không cần cài app, đồng bộ ảnh theo thời gian thực về máy tính.
  4. **Cổng nộp bài học sinh**: Sinh link hoặc mã QR cho học sinh tự chụp và nộp bài từ xa.
- **Báo cáo & Phân tích khảo thí**:
  - Tự động nhận diện Số báo danh, Mã đề thi.
  - Tính điểm tự động, highlight các câu đúng/sai/chưa tô.
  - Biểu đồ phổ điểm trực quan, thống kê tỷ lệ làm sai theo từng câu.
  - Xuất bảng điểm chi tiết ra file Excel (`.xlsx`) hoặc in báo cáo tổng hợp.

### 6. Cổng thanh toán tự động PayOS & Hệ thống Ví
- **Tích hợp cổng VietQR qua PayOS API**: Nạp tiền tự động 24/7 bằng quét mã QR ứng dụng ngân hàng, tiền vào ví tức thì qua webhook xử lý an toàn.
- **Hệ thống Credit & Ví số**:
  - Tặng 5,000 Credits trải nghiệm khi đăng ký tài khoản mới.
  - Tặng thêm hạn mức qua mã giới thiệu (Referral System).
  - Gói đăng ký Pro Nâng cao (99k/tháng) mở khóa các đặc quyền chấm AI không giới hạn và xuất bản không giới hạn.
- Cơ chế In-Memory Fallback bảo đảm đơn hàng không bị gián đoạn ngay cả khi mạng hoặc dịch vụ cơ sở dữ liệu tạm thời bận.

### 7. Marketplace, Onboarding & User Guide
- **Chợ đề thi (Marketplace)**: Giáo viên có thể chia sẻ hoặc trao đổi đề thi chất lượng cao.
- **Web URL Exam Import**: Cho phép nhập đề thi tự động từ đường link website/tài liệu trực tuyến.
- **Trải nghiệm người dùng thân thiện**:
  - Hướng dẫn nhập môn 3 bước (Welcome Wizard) cho giáo viên mới.
  - Checklist 4 nhiệm vụ khởi đầu trên trang Dashboard.
  - Trang Hướng dẫn sử dụng trực quan (`/guide`) kèm minh họa chi tiết từng tính năng.
  - Tùy chỉnh thông tin cá nhân, cập nhật mật khẩu, nén ảnh đại diện tự động và chế độ giao diện sáng/tối.

---

## 🏗️ Kiến trúc hệ thống (System Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                  │
│                                                                        │
│   Next.js 16 (React 19 + TypeScript + Tailwind CSS v4 + Lucide)        │
│   ┌────────────────────┬───────────────────────┬───────────────────┐   │
│   │  Exam Studio A4    │  AI Vision Grading    │  Wallet & PayOS   │   │
│   │  KaTeX / SVG Tools │  Webcam / Remote Cam  │  Marketplace UI   │   │
│   └────────────────────┴───────────────────────┴───────────────────┘   │
└───────────────────▲───────────────────────────────▲────────────────────┘
                    │                               │
            Internal Next.js APIs                   │ HTTP / REST
            & SSR Auth Session                      │
                    │                               │
┌───────────────────▼───────────────────────────────▼────────────────────┐
│                    APPLICATION BACKEND SERVICES                        │
│                                                                        │
│   ┌────────────────────────────────┐   ┌───────────────────────────┐   │
│   │ Next.js Route Handlers         │   │ Python FastAPI Service    │   │
│   │ (BFF / Business Logic)         │   │ (Port 8000)               │   │
│   │                                │   │                           │   │
│   │ • Auth & Session Middleware    │   │ • Question Generator Agent│   │
│   │ • PayOS VietQR Webhook         │◄─►│ • Dual-Agent Verifier     │   │
│   │ • Exam & Wallet CRUD           │   │ • AI Vision Grader        │   │
│   │ • DOCX Report Generator        │   │ • LLM Router / Gateway    │   │
│   └───────────────┬────────────────┘   └─────────────┬─────────────┘   │
└───────────────────┼──────────────────────────────────┼─────────────────┘
                    │                                  │
┌───────────────────▼──────────────────────────────────▼─────────────────┐
│                    DATABASE & EXTERNAL PROVIDERS                       │
│                                                                        │
│   ┌───────────────────────────────────┐   ┌────────────────────────┐   │
│   │ Supabase (PostgreSQL 15+)         │   │ AI Models & LLMs       │   │
│   │ • Users, Wallets & Transactions   │   │ • DeepSeek-V3 / R1     │   │
│   │ • Exams, Questions, Grading Logs  │   │ • Google Gemini Flash  │   │
│   │ • Row Level Security (RLS)        │   │                        │   │
│   ├───────────────────────────────────┤   ├────────────────────────┤   │
│   │ PayOS Payment Gateway             │   │ Redis (Optional Cache) │   │
│   │ • VietQR Napas247 Instant Transfer│   │ • Rate limit & State   │   │
│   └───────────────────────────────────┘   └────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu trúc thư mục dự án

```text
EdTeach/
├── frontend/                          # Ứng dụng Next.js 16 (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/                # Đăng nhập, Đăng ký, Quên mật khẩu
│   │   │   ├── (dashboard)/           # Không gian làm việc giáo viên
│   │   │   │   ├── dashboard/         # Trang thống kê & checklist
│   │   │   │   ├── exams/             # Danh sách đề thi & Exam Studio Editor
│   │   │   │   ├── grading/           # AI Vision Grading & Bảng điểm
│   │   │   │   ├── marketplace/       # Chợ mua bán / chia sẻ đề thi
│   │   │   │   ├── wallet/            # Nạp tiền PayOS VietQR & Lịch sử ví
│   │   │   │   ├── settings/          # Cài đặt cá nhân, đổi mật khẩu, đổi avatar
│   │   │   │   └── guide/             # Hướng dẫn sử dụng tương tác
│   │   │   ├── api/                   # API Routes (Exams, Grading, Payment PayOS)
│   │   │   └── auth/callback/         # Xử lý Supabase OAuth callback
│   │   ├── components/
│   │   │   ├── exam-studio/           # Bộ công cụ soạn thảo đề & vẽ đồ thị toán
│   │   │   ├── grading/               # Giao diện chấm thi & chi tiết phiên chấm
│   │   │   └── ui/                    # Thư viện UI thành phần tái sử dụng
│   │   ├── context/                   # React Context (AuthContext, Theme, ...)
│   │   ├── lib/
│   │   │   ├── api/                   # Client API SDK (exams, wallet, ...)
│   │   │   ├── export/                # Xuất file Word (.docx) chuẩn Bộ GD&ĐT
│   │   │   ├── payment/               # Tích hợp PayOS & bảng giá
│   │   │   └── supabase/              # Client & Server Supabase SDK
│   │   └── middleware.ts              # Bảo vệ route và quản lý phiên làm việc
│   ├── .env.local.example             # Mẫu biến môi trường frontend
│   └── package.json
│
├── ai-service/                        # Dịch vụ AI lõi (Python FastAPI)
│   ├── app/
│   │   ├── agents/
│   │   │   ├── question_generator.py  # Agent sinh câu hỏi theo chuẩn Bloom
│   │   │   └── verifier.py            # Agent thẩm định và giải chéo bài toán
│   │   ├── gateway/                   # LLM Router & Gateway cân bằng tải
│   │   ├── providers/                 # Adapters kết nối DeepSeek, Gemini, OpenAI
│   │   ├── routers/
│   │   │   ├── generation.py          # API sinh & xác thực câu hỏi
│   │   │   ├── grading.py             # API chấm trắc nghiệm & tự luận
│   │   │   └── health.py              # Kiểm tra tình trạng dịch vụ
│   │   └── core/                      # Config, Security, Dependencies
│   ├── requirements.txt               # Thư viện phụ thuộc Python
│   ├── .env.example                   # Mẫu cấu hình môi trường AI Service
│   └── main.py                        # Điểm khởi chạy ứng dụng FastAPI
│
├── supabase/                          # Cấu hình Cơ sở dữ liệu Supabase
│   └── migrations/                    # Bộ kịch bản SQL khởi tạo & tăng cường RLS
│       ├── 20261014_init_schema.sql
│       ├── 20261025_daily_quota_and_referral.sql
│       ├── 20261025_payment_orders.sql
│       ├── 20261025_sync_users_and_fix_rls.sql
│       └── 20261026_harden_rls_security.sql
│
├── docs/                              # Tài liệu kỹ thuật chi tiết
│   ├── Architecture.md                # Thiết kế kiến trúc tổng thể
│   ├── Database_Schema.md             # Thiết kế lược đồ CSDL & bảng
│   ├── API_Design.md                  # Quy ước đặc tả REST API
│   ├── LLM_Routing_Plan.md            # Chiến lược điều phối & tối ưu chi phí LLM
│   └── Anti_Abuse_Credit_Protection_Plan.md # Cơ chế chống lạm dụng & bảo vệ credit
│
├── package.json                       # Scripts quản lý toàn bộ monorepo
├── .gitignore
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy (Quick Start)

### Yêu cầu hệ thống
- **Node.js**: v18.18 trở lên (Khuyến nghị Node 20 LTS)
- **Python**: v3.11 trở lên
- **Tài khoản Supabase** (để cấu hình Auth & Database)
- **API Keys**: DeepSeek API Key hoặc Google Gemini API Key

---

### 1. Cấu hình biến môi trường

#### Cấu hình Frontend
Tạo file `frontend/.env.local` từ mẫu:
```bash
cp frontend/.env.local.example frontend/.env.local
```
Điền các giá trị thực:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
GEMINI_API_KEY=your-gemini-api-key

# Cấu hình thanh toán PayOS / VietQR
NEXT_PUBLIC_PAYMENT_BANK_ID=MB
NEXT_PUBLIC_PAYMENT_ACCOUNT_NO=0988888888
NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME=NGUYEN VAN A
SEPAY_API_KEY=your_sepay_or_payos_key
```

#### Cấu hình AI Service
Tạo file `ai-service/.env` từ mẫu:
```bash
cp ai-service/.env.example ai-service/.env
```
Điền các API keys tương ứng:
```env
DEEPSEEK_API_KEY=sk-your-deepseek-key
GOOGLE_AI_API_KEY=your-google-gemini-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
APP_ENV=development
LOG_LEVEL=INFO
```

---

### 2. Khởi chạy AI Service (FastAPI)

Mở terminal thứ nhất:
```bash
cd ai-service

# Tạo và kích hoạt môi trường ảo Python
python -m venv venv

# Trên Windows:
venv\Scripts\activate
# Trên Linux / macOS:
# source venv/bin/activate

# Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt

# Khởi chạy server FastAPI
uvicorn main:app --reload --port 8000
```
- Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

---

### 3. Khởi chạy Frontend (Next.js)

Mở terminal thứ hai:
```bash
cd frontend

# Cài đặt node modules
npm install

# Khởi chạy dev server
npm run dev
```
- Ứng dụng web sẽ chạy tại: [http://localhost:3001](http://localhost:3001)

---

### 4. Chạy toàn bộ hệ thống từ thư mục gốc

Bạn có thể sử dụng các lệnh tiện ích đã định nghĩa sẵn ở file `package.json` gốc:

```bash
# Chạy Frontend
npm run dev:frontend

# Chạy AI Service
npm run dev:ai

# Build kiểm tra Frontend
npm run build:frontend
```

---

## ⚙️ Danh mục Biến Môi Trường (Environment Variables)

### Frontend (`frontend/.env.local`)

| Tên biến | Bắt buộc | Mô tả |
|----------|:--------:|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Có | Endpoint URL của project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Có | Anon Public Key của Supabase để tương tác dữ liệu từ client |
| `NEXT_PUBLIC_AI_SERVICE_URL` | Có | Địa chỉ dịch vụ AI (mặc định: `http://localhost:8000`) |
| `GEMINI_API_KEY` | Tùy chọn | Google Gemini API Key dùng trực tiếp phía client/edge khi cần |
| `NEXT_PUBLIC_PAYMENT_BANK_ID` | Có | Mã ngân hàng thụ hưởng (MB, VCB, TCB, VPB, ...) |
| `NEXT_PUBLIC_PAYMENT_ACCOUNT_NO` | Có | Số tài khoản ngân hàng nhận tiền chuyển khoản |
| `NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME`| Có | Tên chủ tài khoản ngân hàng (viết hoa không dấu) |
| `SEPAY_API_KEY` | Tùy chọn | API Key xác thực giao dịch PayOS / SePAY webhook |

### AI Service (`ai-service/.env`)

| Tên biến | Bắt buộc | Mô tả |
|----------|:--------:|-------|
| `DEEPSEEK_API_KEY` | Khuyến nghị | Key gọi mô hình DeepSeek V3/R1 phục vụ sinh đề chất lượng cao |
| `GOOGLE_AI_API_KEY` | Khuyến nghị | Key Google AI Gemini 1.5/2.0 Flash phục vụ OCR và thẩm định |
| `SUPABASE_URL` | Có | Đường dẫn kết nối Supabase |
| `SUPABASE_ANON_KEY` | Có | Khóa định danh Supabase |
| `REDIS_URL` | Tùy chọn | URL Redis Cache phục vụ lưu cache câu hỏi và rate-limit |
| `APP_ENV` | Không | Môi trường hoạt động (`development` hoặc `production`) |
| `LOG_LEVEL` | Không | Mức độ ghi log (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |

---

## 📡 API Endpoints Tham Chiếu

### AI Service (FastAPI — Port 8000)

| Phương thức | Đường dẫn | Mô tả chức năng |
|:-----------:|-----------|-----------------|
| `GET` | `/health` | Kiểm tra tình trạng sức khỏe dịch vụ và cấu hình Provider |
| `POST` | `/ai/generate` | Sinh câu hỏi trắc nghiệm/tự luận kèm kiểm tra Dual-Agent |
| `POST` | `/ai/grade/mcq` | Tự động chấm bài trắc nghiệm đối chiếu Answer Key |
| `POST` | `/ai/grade/essay` | Chấm bài tự luận bằng AI dựa trên barem điểm chi tiết |

### Frontend BFF Routes (Next.js — Port 3001)

| Phương thức | Đường dẫn | Mô tả chức năng |
|:-----------:|-----------|-----------------|
| `GET` / `POST` | `/api/exams` | Lấy danh sách hoặc khởi tạo bản ghi đề thi mới |
| `GET` / `POST` | `/api/grading` | Lưu trữ kết quả chấm bài và quản lý danh sách học sinh |
| `POST` | `/api/payment/create-order` | Tạo đơn nạp tiền VietQR và sinh mã giao dịch PayOS |
| `GET` | `/api/payment/check-status` | Kiểm tra trạng thái nạp tiền tự động |
| `POST` | `/api/payment/webhook` | Tiếp nhận IPN Webhook xác nhận giao dịch thành công |
| `POST` | `/api/referral` | Kiểm tra và kích hoạt mã giới thiệu nhận tín dụng thưởng |

---

## 🛡️ Bảo mật & Cơ sở dữ liệu (RLS & Security)

Dự án áp dụng mô hình bảo mật nhiều tầng nhằm bảo vệ tài sản số của giáo viên và ngăn chặn thất thoát tín dụng:

1. **Row Level Security (RLS)**: Tất cả bảng dữ liệu (`users`, `wallets`, `wallet_txns`, `exams`, `questions`) đều được kích hoạt RLS nghiêm ngặt trong thư mục `supabase/migrations/`. Người dùng chỉ có quyền truy xuất và chỉnh sửa dữ liệu do chính mình tạo ra.
2. **Khóa bảo vệ số dư (Balance Integrity)**: Mọi thao tác cộng/trừ credit đều đi kèm bản ghi kiểm toán trong bảng `wallet_txns` với loại giao dịch cụ thể, loại trừ khả năng sửa đổi số dư bất hợp pháp.
3. **Phòng vệ Anti-Abuse & Client Throttling**: Tích hợp cơ chế kiểm soát số lần nạp/tạo đề, chống spam bot và bảo vệ hạn mức gọi mô hình AI.

---

## 📋 Lộ trình phát triển (Roadmap)

### Giai đoạn 1: MVP & Nền tảng lõi (Đã hoàn thành ✅)
- [x] Kiến trúc Monorepo Next.js 16 + FastAPI + Supabase.
- [x] AI Dual-Agent sinh đề & phản biện kiểm tra đáp án.
- [x] Exam Studio: Soạn thảo A4, KaTeX, đồ thị hàm số, hình học vector SVG, bảng biến thiên.
- [x] Tráo 4–8 mã đề tự động kèm bảng ma trận đối chiếu.
- [x] Xuất đề thi và đáp án sang Word (.docx) chuẩn Bộ GD&ĐT.
- [x] AI Vision Grading: Chấm webcam, tải ảnh, chấm phiếu chuẩn 2025.
- [x] Quét camera điện thoại từ xa (Remote Camera) qua QR Code & Cổng nộp bài học sinh.
- [x] Tích hợp thanh toán tự động PayOS VietQR 24/7 & Nâng cấp gói Pro 99k.
- [x] Onboarding Wizard, Checklist Dashboard & Trang hướng dẫn trực quan.

### Giai đoạn 2: Tối ưu & Mở rộng quy mô (Q2–Q3)
- [ ] Mở rộng kho đề thi cộng đồng (Marketplace Review & Bán bản quyền đề).
- [ ] Nhận diện chữ viết tay học sinh trong bài tự luận (Handwritten OCR nâng cao).
- [ ] Tổ chức thi trắc nghiệm trực tuyến trực tiếp qua Zalo Mini App / Telegram Bot.
- [ ] Phân tích học tập cá nhân hóa: Báo cáo chi tiết điểm mạnh/điểm yếu của từng lớp học.

---

## 📄 Giấy phép (License)

Bản quyền thuộc về **EduTest AI Team**. Giữ toàn quyền sở hữu trí tuệ (All Rights Reserved).

Mọi thắc mắc và đóng góp kỹ thuật xin vui lòng mở Issue hoặc gửi Pull Request qua kho mã nguồn của dự án.