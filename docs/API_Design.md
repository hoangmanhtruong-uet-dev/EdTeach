# EduTest AI - API Design

## Base URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend | `https://edutest.ai` | 3000 (dev) |
| Spring Boot API | `https://api.edutest.ai` | 8080 |
| FastAPI AI Service | `https://ai.edutest.ai` | 8000 |

## Spring Boot API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth callback |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update profile |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet` | Get wallet balance |
| GET | `/api/wallet/transactions` | Get transaction history |
| POST | `/api/wallet/topup/generate-qr` | Generate VietQR for top-up |
| POST | `/api/wallet/webhook/sepay` | SePAY payment webhook |

### Exams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exams` | List user's exams |
| POST | `/api/exams` | Create new exam |
| GET | `/api/exams/{id}` | Get exam detail |
| PUT | `/api/exams/{id}` | Update exam |
| DELETE | `/api/exams/{id}` | Delete exam |
| POST | `/api/exams/{id}/shuffle` | Shuffle exam codes |
| POST | `/api/exams/{id}/export/word` | Export to Word (.docx) |
| POST | `/api/exams/{id}/export/pdf` | Export to PDF |

### Questions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exams/{examId}/questions` | List questions |
| POST | `/api/exams/{examId}/questions` | Add question |
| PUT | `/api/questions/{id}` | Update question |
| DELETE | `/api/questions/{id}` | Delete question |

### Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace` | Browse marketplace |
| POST | `/api/marketplace` | Publish exam |
| POST | `/api/marketplace/{id}/buy` | Purchase exam |

## FastAPI AI Service Endpoints

### Exam Generation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/generate` | Generate exam questions |
| POST | `/ai/verify` | Verify generated questions (Agent 2) |
| POST | `/ai/regenerate` | Regenerate specific question |

### OCR
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/ocr/extract` | Extract text from image |
| POST | `/ai/ocr/exam` | Extract full exam from image |

### AI Grading
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/grade` | Grade student answers |
| POST | `/ai/grade/batch` | Batch grade multiple papers |

### Math Graphics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/graphics/geometry` | Generate geometry SVG |
| POST | `/ai/graphics/graph` | Generate function graph |

### Health & Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ai/usage` | API usage stats |