# 🎓 EduTest AI

> Nền tảng SaaS EdTech tối ưu hóa toàn bộ luồng công việc soạn đề, tráo mã đề, và thẩm định chất lượng bài kiểm tra cho giáo viên Việt Nam.

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)](https://nextjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-green?logo=spring)](https://spring.io/projects/spring-boot)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-dark?logo=supabase)](https://supabase.com/)

## ✨ Tính năng nổi bật

| Tính năng | Mô tả |
|-----------|--------|
| 🤖 **Dual-Agent AI** | Agent Tester giải lại bài độc lập để đối chiếu, đạt 99.8% chính xác |
| 📐 **Vector Math Graphics** | Tự động sinh hình học/đồ thị dạng Vector chỉnh sửa được trong Word |
| 📋 **Chuẩn GDPT 2018** | Trắc nghiệm Đúng/Sai, Trả lời ngắn, Ma trận & Barem tự động |
| 🔀 **1-Click Shuffle** | Tráo 4-8 mã đề tự động kèm Ma trận Barem tổng hợp |
| 📄 **A4 WYSIWYG Editor** | Xuất file Word (.docx) chuẩn Times New Roman, lề A4 100% |
| 📸 **AI Vision Grading** | Chụp ảnh bài làm (kể cả viết tay), AI chấm điểm & nhận xét |
| 🏪 **Marketplace** | Chợ mua bán bộ đề chất lượng cao giữa giáo viên |

## 🏗️ Kiến trúc hệ thống

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js    │────►│  Spring Boot     │────►│  FastAPI         │
│   Frontend   │     │  (Main API)      │     │  (AI Service)    │
└──────────────┘     └────────┬─────────┘     └────────┬────────┘
                              │                        │
                     ┌────────▼────────┐      ┌────────▼────────┐
                     │   Supabase      │      │  LLM Providers  │
                     │   (PostgreSQL)  │      │  DeepSeek/Gemini│
                     └─────────────────┘      └─────────────────┘
```

## 📁 Cấu trúc dự án

```
EdTeach/
├── frontend/                # Next.js 14+ App
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities & configs
│   │   └── styles/         # Global styles
│   └── package.json
│
├── ai-service/              # Python FastAPI
│   ├── app/
│   │   ├── agents/         # LangGraph multi-agent
│   │   ├── gateway/        # LLM Router & Gateway
│   │   ├── providers/      # LLM provider adapters
│   │   ├── routers/        # API endpoints
│   │   └── core/           # Config, dependencies
│   ├── requirements.txt
│   └── main.py
│
├── docs/                    # Documentation
│   ├── Architecture.md
│   ├── Database_Schema.md
│   ├── API_Design.md
│   ├── LLM_Routing_Plan.md
│   └── Anti_Abuse_Credit_Protection_Plan.md
│
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Java 17+ (for Spring Boot - later phase)
- Docker (optional)

### 1. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3001
```

### 2. AI Service (FastAPI)

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your API keys

uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs
```

### 3. Environment Variables

```env
# AI Service
DEEPSEEK_API_KEY=your_key_here
GOOGLE_AI_API_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
REDIS_URL=redis://localhost:6379

# Frontend
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 📋 Roadmap

### Phase 1: MVP Launch (Month 1-2)
- [x] Project planning & documentation
- [ ] Core AI Engine (Dual-Agent)
- [ ] Basic exam generation (MCQ, True/False)
- [ ] Word export (A4 standard)
- [ ] Google OAuth + Wallet system

### Phase 2: Commercialize (Month 3-4)
- [ ] VietQR/SePAY payment integration
- [ ] Exam code shuffling
- [ ] Personal branding for tutors
- [ ] AI Vision Grading

### Phase 3: Scale (Month 5-6)
- [ ] Marketplace
- [ ] Online exam via Zalo/Telegram
- [ ] Advanced analytics

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/Architecture.md) | System architecture overview |
| [Database Schema](docs/Database_Schema.md) | PostgreSQL schema design |
| [API Design](docs/API_Design.md) | REST API endpoints |
| [LLM Routing](docs/LLM_Routing_Plan.md) | LLM router & cost optimization |
| [Anti-Abuse](docs/Anti_Abuse_Credit_Protection_Plan.md) | Credit protection system |

## 💰 Unit Economics

| Metric | Value |
|--------|-------|
| Chi phí API / đề thi | 120-250 VNĐ |
| Giá bán xuất Word | 3,000 VNĐ / file |
| Biên lợi nhuận gộp | > 90% |
| Target MAU (Month 6) | 15,000 |

## 📄 License

Private - All rights reserved.