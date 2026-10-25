# EduTest AI - Database Schema

## Supabase PostgreSQL

### ERD Overview

```
users ──────┬──── wallets ──── wallet_txns
            │
            ├──── exams ──── questions
            │
            ├──── credit_buckets
            │
            ├──── user_trust_scores ──── trust_score_history
            │
            ├──── device_fingerprints
            │
            └──── marketplace
```

### Core Tables

#### 1. users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'TEACHER_PRO', 'ADMIN')),
    email_domain_tier TEXT DEFAULT 'gmail_standard',
    phone TEXT,
    phone_verified BOOLEAN DEFAULT FALSE,
    google_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. wallets
```sql
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 5000.00,
    total_topup DECIMAL(12, 2) DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. wallet_txns
```sql
CREATE TABLE wallet_txns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'SIGNUP_BONUS', 'TOPUP_SEPAY', 'EXPORT_WORD', 
        'GENERATE_EXAM', 'AI_GRADE', 'REFERRAL_BONUS',
        'PROMO_BONUS', 'MARKETPLACE_BUY', 'MARKETPLACE_SELL',
        'REFUND'
    )),
    description TEXT,
    reference_id TEXT,
    balance_after DECIMAL(12, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. exams
```sql
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade INTEGER CHECK (grade BETWEEN 1 AND 12),
    matrix_cfg JSONB,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'published')),
    total_questions INTEGER DEFAULT 0,
    exam_duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. questions
```sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'MCQ', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER', 'ESSAY', 'MATCHING'
    )),
    latex_content TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT,
    solution TEXT,
    image_url TEXT,
    bloom_level TEXT CHECK (bloom_level IN (
        'REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'
    )),
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. marketplace
```sql
CREATE TABLE marketplace (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id),
    seller_id UUID REFERENCES users(id),
    price DECIMAL(10, 2) NOT NULL,
    downloads INTEGER DEFAULT 0,
    rating DECIMAL(2, 1),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies

```sql
-- Users can only see their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY wallets_self ON wallets FOR ALL USING (user_id = auth.uid());
CREATE POLICY exams_own ON exams FOR ALL USING (user_id = auth.uid());
CREATE POLICY questions_own ON questions FOR ALL USING (
    exam_id IN (SELECT id FROM exams WHERE user_id = auth.uid())
);

-- Marketplace: published exams visible to all
CREATE POLICY marketplace_public ON marketplace FOR SELECT USING (is_active = TRUE);
CREATE POLICY marketplace_own ON marketplace FOR ALL USING (seller_id = auth.uid());