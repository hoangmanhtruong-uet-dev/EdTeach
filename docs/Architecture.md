# EduTest AI - System Architecture

## Tổng quan kiến trúc

Hệ thống EduTest AI sử dụng kiến trúc **Microservices + Event-Driven**, gồm 3 service chính:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Next.js 14+ (App Router)                      │  │
│  │  • WYSIWYG A4 Editor    • Dashboard                        │  │
│  │  • Exam Creator/Editor  • Wallet & Payment                 │  │
│  │  • AI Grading UI        • Marketplace                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / WebSocket
┌──────────────────────────────▼──────────────────────────────────┐
│                      BACKEND SERVICES                            │
│                                                                  │
│  ┌─────────────────────┐      ┌─────────────────────────────┐   │
│  │  Java Spring Boot    │      │  Python FastAPI              │   │
│  │  (Main API)          │◄────►│  (AI Service)                │   │
│  │                      │      │                              │   │
│  │  • Auth (Google OAuth)│     │  • Dual-Agent Verification   │   │
│  │  • User Management   │      │  • LLM Router/Gateway       │   │
│  │  • Wallet/Credit     │      │  • Question Generation      │   │
│  │  • Exam CRUD         │      │  • OCR (Gemini Flash)       │   │
│  │  • Export Word/PDF   │      │  • Math Graphics (SymPy)    │   │
│  │  • SePAY Webhook     │      │  • AI Grading               │   │
│  │  • Marketplace       │      │                              │   │
│  └──────────┬──────────┘      └──────────────┬──────────────┘   │
│             │                                │                   │
└─────────────┼────────────────────────────────┼──────────────────┘
              │                                │
┌─────────────▼────────────────────────────────▼──────────────────┐
│                      DATA LAYER                                  │
│                                                                  │
│  ┌─────────────────────┐      ┌─────────────────────────────┐   │
│  │  Supabase            │      │  Redis                      │   │
│  │  (PostgreSQL)        │      │  (Cache + Rate Limiting)    │   │
│  │                      │      │                              │   │
│  │  • Users & Wallets   │      │  • Session cache            │   │
│  │  • Exams & Questions │      │  • LLM response cache       │   │
│  │  • Transactions      │      │  • Rate limit counters      │   │
│  │  • Marketplace       │      │  • Real-time pub/sub        │   │
│  │  • RLS Policies      │      │                              │   │
│  └─────────────────────┘      └─────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  LLM Providers                                              │ │
│  │  • DeepSeek-V3/R1 (Sinh đề, Thẩm định)                     │ │
│  │  • Gemini 1.5 Flash (OCR, tasks đơn giản)                   │ │
│  │  • Gemini 2.0 Flash (Backup)                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | Next.js | 14+ | SSR, App Router, React Server Components |
| Frontend | TypeScript | 5.x | Type safety |
| Frontend | Tailwind CSS | 3.x | Styling |
| Frontend | Shadcn/UI | latest | UI Components |
| Backend (Main) | Java Spring Boot | 3.x | REST API, Business Logic |
| Backend (AI) | Python FastAPI | 0.100+ | AI/ML Service |
| Backend (AI) | LangGraph | latest | Multi-Agent orchestration |
| Database | Supabase (PostgreSQL) | 15+ | Primary database |
| Cache | Redis | 7+ | Caching, rate limiting |
| Auth | Supabase Auth | - | Google OAuth 2.0 |
| Payment | SePAY | - | VietQR webhook |
| LLM | DeepSeek API | V3/R1 | Core AI generation |
| LLM | Google Gemini | 1.5 Flash | OCR, lightweight tasks |
| Deployment | Vercel | - | Frontend hosting |
| Deployment | Render / Railway | - | Backend hosting |

## Giao tiếp giữa các Service

```
Next.js Frontend
    │
    ├── REST API ──────► Spring Boot (Port 8080)
    │                        │
    │                        ├── Internal REST ──► FastAPI (Port 8000)
    │                        │
    │                        └── Supabase Client ──► PostgreSQL
    │
    └── Supabase Realtime ──► WebSocket (notifications)
```

## Cấu trúc Monorepo

```
EdTeach/
├── frontend/              # Next.js application
├── backend/               # Spring Boot application
├── ai-service/            # Python FastAPI service
├── docs/                  # Documentation
├── docker-compose.yml     # Local development
└── README.md