# EduTest AI - Chống Bào Credit & Bảo Vệ Hệ Thống

## Mục lục
1. [Tổng quan vấn đề](#1-tổng-quan-vấn-đề)
2. [Lớp 1: Kiểm soát đăng ký & Xác thực](#2-lớp-1-kiểm-soát-đăng-ký--xác-thực)
3. [Lớp 2: Hệ thống Credit thông minh](#3-lớp-2-hệ-thống-credit-thông-minh)
4. [Lớp 3: Rate Limiting & Throttling](#4-lớp-3-rate-limiting--throttling)
5. [Lớp 4: Phát hiện hành vi bất thường (Anomaly Detection)](#5-lớp-4-phát-hiện-hành-vi-bất-thường)
6. [Lớp 5: Device & Browser Fingerprinting](#6-lớp-5-device--browser-fingerprinting)
7. [Lớp 6: Watermark & Output Protection](#7-lớp-6-watermark--output-protection)
8. [Lớp 7: Honeypot & Trap Mechanisms](#8-lớp-7-honeypot--trap-mechanisms)
9. [Lớp 8: IP & Network Intelligence](#9-lớp-8-ip--network-intelligence)
10. [Lớp 9: API Protection & Bot Detection](#10-lớp-9-api-protection--bot-detection)
11. [Lớp 10: Hệ thống Trust Score](#11-lớp-10-hệ-thống-trust-score)
12. [Database Schema](#12-database-schema)
13. [Xử lý vi phạm & Escalation](#13-xử-lý-vi-phạm--escalation)
14. [Kế hoạch triển khai](#14-kế-hoạch-triển-khai)

---

## 1. Tổng quan vấn đề

### 1.1 Các hình thức bào credit phổ biến

```
┌────────────────────────────────────────────────────────────┐
│              CÁC HÌNH THỨC BÀO CREDIT                      │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ 🔄 Multi-Account  │  │ 🤖 Bot/Script    │                │
│  │ Tạo nhiều tài     │  │ Tự động hóa      │                │
│  │ khoản lấy bonus   │  │ request liên tục  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ 🔗 Referral Abuse │  │ 📤 Content Scraping│               │
│  │ Fake referral     │  │ Export hàng loạt  │                │
│  │ để nhận thưởng    │  │ rồi bán lại      │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ 💳 Payment Fraud  │  │ 🔓 API Exploit    │                │
│  │ Chargeback /      │  │ Bypass client     │                │
│  │ fake payment      │  │ gọi thẳng API     │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ 🎁 Promo Abuse    │  │ 👥 Account Sharing│                │
│  │ Dùng mã KM        │  │ Chia sẻ 1 tài    │                │
│  │ nhiều lần          │  │ khoản Pro cho     │                │
│  │                    │  │ nhiều người       │                │
│  └──────────────────┘  └──────────────────┘                │
└────────────────────────────────────────────────────────────┘
```

### 1.2 Kiến trúc phòng thủ nhiều lớp (Defense in Depth)

```
Request → [Lớp 1: Auth] → [Lớp 2: Credit] → [Lớp 3: Rate Limit]
            │                 │                  │
            ▼                 ▼                  ▼
        [Lớp 4: Anomaly] → [Lớp 5: Fingerprint] → [Lớp 6: Watermark]
            │                 │                       │
            ▼                 ▼                       ▼
        [Lớp 7: Honeypot] → [Lớp 8: IP Intel] → [Lớp 9: Bot Detect]
                                                      │
                                                      ▼
                                              [Lớp 10: Trust Score]
                                                      │
                                              ┌───────▼───────┐
                                              │  ALLOW / BLOCK │
                                              │  / CHALLENGE   │
                                              └────────────────┘
```

---

## 2. Lớp 1: Kiểm soát đăng ký & Xác thực

### 2.1 Google OAuth Only (Từ plan gốc)

```python
# Chỉ cho phép Google OAuth 2.0 - Loại bỏ email rác
ALLOWED_AUTH_PROVIDERS = ["google"]

# KHÔNG cho phép:
# - Email/password registration
# - Facebook OAuth (dễ tạo fake)
# - GitHub OAuth (không phù hợp target user)
```

### 2.2 Email Domain Classification (Mở rộng từ plan gốc)

```python
EMAIL_TIERS = {
    "edu_verified": {
        "domains": ["*.edu.vn", "*.edu", "*.ac.vn"],
        "signup_bonus": 20_000,  # VNĐ
        "trust_score_initial": 80,
        "daily_limit_multiplier": 1.5,
        "description": "Email giáo dục đã xác minh"
    },
    "corporate": {
        "domains": ["custom_company_domains"],  # Whitelist
        "signup_bonus": 15_000,
        "trust_score_initial": 70,
        "daily_limit_multiplier": 1.3,
        "description": "Email doanh nghiệp/tổ chức"
    },
    "gmail_standard": {
        "domains": ["gmail.com"],
        "signup_bonus": 5_000,
        "trust_score_initial": 50,
        "daily_limit_multiplier": 1.0,
        "description": "Gmail thông thường"
    },
    "gmail_suspicious": {
        "patterns": [
            r"^[a-z]+\d{6,}@gmail\.com$",        # random123456@gmail.com
            r"^[a-z]{1,3}\d+[a-z]{1,3}@gmail\.com$",  # ab123cd@gmail.com
            r"^test\w+@gmail\.com$",                # test accounts
        ],
        "signup_bonus": 2_000,
        "trust_score_initial": 20,
        "daily_limit_multiplier": 0.5,
        "requires_phone_verification": True,
        "description": "Gmail có pattern đáng ngờ"
    }
}
```

### 2.3 Xác thực bổ sung cho tài khoản đáng ngờ

```python
class EnhancedVerification:
    """Yêu cầu xác thực thêm cho tài khoản có trust score thấp"""
    
    async def check_and_challenge(self, user, action):
        if user.trust_score < 30:
            # Yêu cầu xác minh SĐT qua OTP
            if not user.phone_verified:
                raise PhoneVerificationRequired()
        
        if user.trust_score < 15:
            # CAPTCHA cho mọi action tốn credit
            challenge = await self.issue_captcha(user)
            if not challenge.passed:
                raise CaptchaRequired()
        
        if user.account_age_hours < 1:
            # Tài khoản mới: giới hạn chặt hơn
            if action.credit_cost > 1000:
                raise NewAccountRestriction(
                    "Tài khoản mới cần chờ 1 giờ trước khi sử dụng tính năng cao cấp"
                )
```

### 2.4 Chống tạo nhiều tài khoản (Multi-Account Detection)

```python
class MultiAccountDetector:
    """Phát hiện 1 người tạo nhiều tài khoản để bào bonus"""
    
    SIGNALS = {
        "same_device_fingerprint": {"weight": 0.9, "action": "block_signup"},
        "same_ip_within_24h": {"weight": 0.6, "action": "flag_review"},
        "same_browser_fingerprint": {"weight": 0.8, "action": "flag_review"},
        "similar_email_pattern": {"weight": 0.4, "action": "reduce_bonus"},
        "same_phone_number": {"weight": 1.0, "action": "block_signup"},
        "same_google_profile_photo": {"weight": 0.5, "action": "flag_review"},
    }
    
    async def check_on_signup(self, new_user_data):
        risk_score = 0
        flags = []
        
        # Check device fingerprint
        existing = await self.find_by_fingerprint(new_user_data.device_fp)
        if existing:
            risk_score += self.SIGNALS["same_device_fingerprint"]["weight"]
            flags.append(f"Same device as user {existing.id}")
        
        # Check IP address (recent signups)
        recent_signups_same_ip = await self.count_signups_from_ip(
            new_user_data.ip, hours=24
        )
        if recent_signups_same_ip >= 2:
            risk_score += self.SIGNALS["same_ip_within_24h"]["weight"]
            flags.append(f"{recent_signups_same_ip} signups from same IP in 24h")
        
        # Decision
        if risk_score >= 0.9:
            return SignupDecision.BLOCK
        elif risk_score >= 0.5:
            return SignupDecision.REDUCED_BONUS  # Chỉ cho 1,000 VNĐ thay vì 5,000
        else:
            return SignupDecision.ALLOW
```

---

## 3. Lớp 2: Hệ thống Credit thông minh

### 3.1 Credit Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                    CREDIT LIFECYCLE                           │
│                                                              │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Earn     │    │ Hold        │    │ Spend               │  │
│  │          │    │ (Pending)   │    │                     │  │
│  │ Signup   │───►│ Anti-fraud  │───►│ Generate Exam       │  │
│  │ Top-up   │    │ check       │    │ Export Word          │  │
│  │ Referral │    │ (30 min)    │    │ AI Grading           │  │
│  │ Promo    │    │             │    │ Premium features     │  │
│  └─────────┘    └─────────────┘    └─────────────────────┘  │
│                        │                     │               │
│                        ▼                     ▼               │
│                 ┌──────────────┐    ┌─────────────────┐     │
│                 │ Expire       │    │ Refund          │     │
│                 │ (30 ngày     │    │ (Lỗi hệ thống  │     │
│                 │  không dùng) │    │  → hoàn credit) │     │
│                 └──────────────┘    └─────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Phân loại Credit

```python
class CreditType:
    """Phân biệt loại credit để kiểm soát chặt hơn"""
    
    TYPES = {
        "BONUS": {
            "description": "Credit khuyến mãi (signup, promo)",
            "expiry_days": 30,        # Hết hạn sau 30 ngày
            "transferable": False,     # Không chuyển nhượng
            "refundable": False,       # Không hoàn tiền
            "max_per_account": 50_000, # Tối đa 50k VNĐ bonus/account
            "usage_restrictions": {
                "can_export_word": False,  # Không dùng để xuất Word
                "can_generate_exam": True,
                "can_ai_grade": False,     # Không dùng chấm bài AI
            }
        },
        "TOPUP": {
            "description": "Credit nạp tiền thật",
            "expiry_days": 365,       # 1 năm
            "transferable": False,
            "refundable": True,       # Hoàn tiền nếu lỗi
            "max_per_account": None,  # Không giới hạn
            "usage_restrictions": None  # Dùng mọi tính năng
        },
        "REFERRAL": {
            "description": "Credit từ giới thiệu",
            "expiry_days": 60,        # 2 tháng
            "transferable": False,
            "refundable": False,
            "max_per_account": 100_000, # Tối đa 100k từ referral
            "usage_restrictions": {
                "can_export_word": True,
                "can_generate_exam": True,
                "can_ai_grade": True,
            },
            "vesting_period_hours": 72,  # Chờ 3 ngày mới dùng được
        }
    }
```

### 3.3 Credit Spending Priority (FIFO theo hạn)

```python
class CreditSpender:
    """Trừ credit theo thứ tự ưu tiên: sắp hết hạn trước"""
    
    async def spend(self, user_id: str, amount: int, purpose: str):
        # 1. Lấy tất cả credit buckets, sắp xếp theo expiry (gần nhất trước)
        buckets = await self.get_credit_buckets(
            user_id, 
            order_by="expires_at ASC"
        )
        
        remaining = amount
        transactions = []
        
        for bucket in buckets:
            if remaining <= 0:
                break
            
            # Kiểm tra restriction
            if not self.can_use_for(bucket.type, purpose):
                continue
            
            # Kiểm tra vesting period
            if bucket.type == "REFERRAL" and not bucket.is_vested:
                continue
            
            deduct = min(remaining, bucket.balance)
            bucket.balance -= deduct
            remaining -= deduct
            
            transactions.append(CreditTransaction(
                bucket_id=bucket.id,
                amount=-deduct,
                purpose=purpose
            ))
        
        if remaining > 0:
            raise InsufficientCreditError(
                f"Cần {amount} VNĐ, chỉ có {amount - remaining} VNĐ khả dụng"
            )
        
        # Atomic transaction
        await self.commit_transactions(transactions)
```

### 3.4 Giới hạn Credit Bonus

```python
BONUS_LIMITS = {
    # Giới hạn tổng bonus mỗi tài khoản
    "max_total_bonus_per_account": 50_000,     # VNĐ
    
    # Giới hạn referral
    "max_referral_bonus_per_day": 20_000,      # VNĐ/ngày
    "max_referral_bonus_per_month": 100_000,   # VNĐ/tháng
    "referral_bonus_per_invite": 5_000,        # VNĐ/người
    "referral_requires_invitee_topup": True,   # Người được mời phải nạp tiền mới được thưởng
    "referral_min_invitee_topup": 20_000,      # Người được mời nạp ít nhất 20k
    
    # Giới hạn promo code
    "max_promo_per_account": 3,                # Tối đa 3 mã KM/account
    "promo_cooldown_hours": 24,                # Chờ 24h giữa 2 lần dùng mã
    
    # Signup bonus chỉ 1 lần
    "signup_bonus_one_time": True,
}
```

---

## 4. Lớp 3: Rate Limiting & Throttling

### 4.1 Multi-Level Rate Limiting

```python
RATE_LIMITS = {
    # Per-user limits
    "user": {
        "generate_exam": {
            "free_tier": {"requests": 5, "window": "1h"},
            "paid_tier": {"requests": 30, "window": "1h"},
            "burst": {"requests": 3, "window": "1m"},  # Anti-burst
        },
        "export_word": {
            "free_tier": {"requests": 2, "window": "1h"},
            "paid_tier": {"requests": 20, "window": "1h"},
        },
        "ai_grading": {
            "free_tier": {"requests": 0, "window": "1h"},  # Không cho free
            "paid_tier": {"requests": 50, "window": "1h"},
        },
        "ocr_upload": {
            "all_tiers": {"requests": 10, "window": "1h"},
            "max_file_size_mb": 5,
        }
    },
    
    # Per-IP limits (chống bot)
    "ip": {
        "any_api_call": {"requests": 100, "window": "1h"},
        "signup": {"requests": 3, "window": "24h"},
        "login_attempt": {"requests": 10, "window": "15m"},
    },
    
    # Global limits (bảo vệ hệ thống)
    "global": {
        "total_api_cost_usd": {"limit": 50, "window": "1h"},
        "total_llm_requests": {"limit": 10000, "window": "1h"},
    }
}
```

### 4.2 Progressive Throttling

```python
class ProgressiveThrottler:
    """
    Tăng dần delay khi user gần đạt limit.
    Thay vì block cứng → làm chậm dần → user tự bỏ cuộc.
    """
    
    async def apply_throttle(self, user_id: str, action: str):
        usage_ratio = await self.get_usage_ratio(user_id, action)
        
        if usage_ratio < 0.5:
            delay = 0          # Bình thường
        elif usage_ratio < 0.7:
            delay = 1          # 1 giây delay
        elif usage_ratio < 0.85:
            delay = 3          # 3 giây delay
        elif usage_ratio < 0.95:
            delay = 5          # 5 giây delay + cảnh báo
            await self.show_warning(user_id, "Bạn sắp đạt giới hạn sử dụng")
        else:
            delay = 10         # 10 giây delay + CAPTCHA
            await self.require_captcha(user_id)
        
        if delay > 0:
            await asyncio.sleep(delay)
```

### 4.3 Sliding Window Counter (Redis)

```python
class SlidingWindowRateLimiter:
    """Rate limiter dùng sliding window trên Redis"""
    
    async def check(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.time()
        window_start = now - window_seconds
        
        pipe = self.redis.pipeline()
        
        # Remove expired entries
        pipe.zremrangebyscore(key, 0, window_start)
        
        # Count current window
        pipe.zcard(key)
        
        # Add current request
        pipe.zadd(key, {str(now): now})
        
        # Set expiry on the key
        pipe.expire(key, window_seconds)
        
        results = await pipe.execute()
        current_count = results[1]
        
        if current_count >= limit:
            return False  # Rate limited
        
        return True
```

---

## 5. Lớp 4: Phát hiện hành vi bất thường (Anomaly Detection)

### 5.1 Behavioral Patterns to Detect

```python
ANOMALY_RULES = {
    "rapid_generation": {
        "description": "Tạo đề liên tục không nghỉ",
        "condition": "generate_exam > 10 trong 10 phút",
        "risk_level": "HIGH",
        "action": "throttle + flag_review"
    },
    
    "mass_export": {
        "description": "Xuất Word hàng loạt (có thể bán lại)",
        "condition": "export_word > 20 trong 1 giờ",
        "risk_level": "HIGH",
        "action": "block_export + notify_admin"
    },
    
    "unusual_hours": {
        "description": "Hoạt động bất thường ngoài giờ",
        "condition": "activity between 1AM-5AM AND burst > 5 requests/min",
        "risk_level": "MEDIUM",
        "action": "captcha_challenge"
    },
    
    "no_edit_pattern": {
        "description": "Tạo → Export ngay không chỉnh sửa (bot behavior)",
        "condition": "avg_time_between_generate_and_export < 30 seconds",
        "risk_level": "HIGH",
        "action": "block + flag_review"
    },
    
    "subject_hopping": {
        "description": "Chuyển môn liên tục (1 GV thường dạy 1-2 môn)",
        "condition": "unique_subjects > 5 trong 1 ngày",
        "risk_level": "MEDIUM",
        "action": "flag_review"
    },
    
    "credit_drain_fast": {
        "description": "Tiêu hết bonus trong < 1 giờ sau đăng ký",
        "condition": "bonus_depleted AND account_age < 1 hour",
        "risk_level": "HIGH",
        "action": "block_account + review"
    },
    
    "same_prompt_repeat": {
        "description": "Gửi cùng 1 prompt nhiều lần (bypass cache?)",
        "condition": "same_prompt_hash > 3 trong 10 phút",
        "risk_level": "MEDIUM",
        "action": "return_cached + flag"
    },
    
    "grade_hopping": {
        "description": "Tạo đề cho quá nhiều khối lớp (1 GV thường 1-3 khối)",
        "condition": "unique_grades > 5 trong 1 ngày",
        "risk_level": "LOW",
        "action": "flag_review"
    }
}
```

### 5.2 Anomaly Scoring Engine

```python
class AnomalyScorer:
    """
    Tính điểm bất thường cho mỗi session/user.
    Score cao → hành vi đáng ngờ → trigger action.
    """
    
    async def score_action(self, user_id: str, action: dict) -> float:
        score = 0.0
        
        # 1. Tần suất bất thường
        freq_score = await self.check_frequency_anomaly(user_id, action)
        score += freq_score * 0.3
        
        # 2. Thời gian bất thường
        time_score = self.check_time_anomaly(action.timestamp)
        score += time_score * 0.1
        
        # 3. Pattern bất thường (so với baseline của user)
        pattern_score = await self.check_pattern_anomaly(user_id, action)
        score += pattern_score * 0.3
        
        # 4. So sánh với cohort (nhóm user tương tự)
        cohort_score = await self.compare_with_cohort(user_id, action)
        score += cohort_score * 0.2
        
        # 5. Account age factor (tài khoản mới = rủi ro cao hơn)
        age_factor = self.account_age_risk(user_id)
        score += age_factor * 0.1
        
        # Normalize to 0-100
        normalized = min(score * 100, 100)
        
        # Log and take action
        await self.log_anomaly_score(user_id, action, normalized)
        
        if normalized > 80:
            await self.trigger_action("HIGH", user_id)
        elif normalized > 50:
            await self.trigger_action("MEDIUM", user_id)
        elif normalized > 30:
            await self.trigger_action("LOW", user_id)
        
        return normalized
```

---

## 6. Lớp 5: Device & Browser Fingerprinting

### 6.1 Fingerprint Collection

```typescript
// Frontend: Thu thập fingerprint (dùng FingerprintJS hoặc tự build)

interface DeviceFingerprint {
  // Browser info
  userAgent: string;
  language: string;
  platform: string;
  cookiesEnabled: boolean;
  doNotTrack: string;
  
  // Screen
  screenResolution: string;      // "1920x1080"
  colorDepth: number;
  pixelRatio: number;
  
  // Hardware
  hardwareConcurrency: number;   // CPU cores
  deviceMemory: number;          // RAM (GB)
  maxTouchPoints: number;
  
  // Canvas fingerprint
  canvasHash: string;            // Hash của canvas rendering
  
  // WebGL
  webglRenderer: string;
  webglVendor: string;
  
  // Timezone
  timezone: string;
  timezoneOffset: number;
  
  // Fonts
  installedFonts: string[];      // Detected fonts
  
  // Audio context
  audioFingerprint: string;
  
  // Computed
  compositeHash: string;         // SHA256 của tất cả trên
}
```

### 6.2 Fingerprint Matching

```python
class FingerprintMatcher:
    """So khớp fingerprint để phát hiện multi-account"""
    
    # Trọng số cho từng signal
    SIGNAL_WEIGHTS = {
        "canvas_hash": 0.25,          # Rất unique
        "webgl_renderer": 0.15,
        "audio_fingerprint": 0.15,
        "screen_resolution": 0.05,
        "installed_fonts": 0.10,
        "timezone": 0.05,
        "hardware_concurrency": 0.05,
        "device_memory": 0.05,
        "user_agent": 0.10,
        "language": 0.05,
    }
    
    def calculate_similarity(self, fp1: dict, fp2: dict) -> float:
        """Tính similarity score giữa 2 fingerprint (0.0 - 1.0)"""
        total_weight = 0
        match_score = 0
        
        for signal, weight in self.SIGNAL_WEIGHTS.items():
            total_weight += weight
            if fp1.get(signal) == fp2.get(signal):
                match_score += weight
        
        return match_score / total_weight if total_weight > 0 else 0
    
    async def find_linked_accounts(self, fingerprint: dict) -> list:
        """Tìm các tài khoản có cùng thiết bị"""
        all_fingerprints = await self.db.get_recent_fingerprints(days=90)
        
        linked = []
        for stored_fp in all_fingerprints:
            similarity = self.calculate_similarity(fingerprint, stored_fp.data)
            if similarity > 0.85:  # 85% match → likely same device
                linked.append({
                    "user_id": stored_fp.user_id,
                    "similarity": similarity,
                    "first_seen": stored_fp.created_at
                })
        
        return linked
```

### 6.3 Fingerprint Storage

```sql
CREATE TABLE device_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    composite_hash TEXT NOT NULL,
    fingerprint_data JSONB NOT NULL,
    ip_address INET,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    times_seen INTEGER DEFAULT 1,
    is_suspicious BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT unique_user_device UNIQUE(user_id, composite_hash)
);

CREATE INDEX idx_fp_hash ON device_fingerprints(composite_hash);
CREATE INDEX idx_fp_user ON device_fingerprints(user_id);

-- Bảng liên kết tài khoản đáng ngờ
CREATE TABLE linked_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 UUID REFERENCES users(id),
    user_id_2 UUID REFERENCES users(id),
    link_type TEXT NOT NULL,  -- 'same_device', 'same_ip', 'same_phone'
    similarity_score DECIMAL(3, 2),
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed BOOLEAN DEFAULT FALSE,
    action_taken TEXT  -- 'none', 'warned', 'bonus_revoked', 'banned'
);
```

---

## 7. Lớp 6: Watermark & Output Protection

### 7.1 Watermark Strategy (Mở rộng từ plan gốc)

```python
class WatermarkManager:
    """Quản lý watermark cho các loại output"""
    
    WATERMARK_RULES = {
        "free_pdf": {
            "visible_watermark": True,
            "watermark_text": "Tạo bởi EduTest AI - edutest.ai",
            "watermark_opacity": 0.15,
            "watermark_position": "diagonal",
            "invisible_watermark": True,  # Steganography
        },
        "free_preview": {
            "blur_last_30_percent": True,  # Blur 30% cuối đề thi
            "max_preview_questions": 3,     # Chỉ xem 3 câu đầu
            "no_answers_shown": True,
        },
        "paid_word": {
            "visible_watermark": False,
            "invisible_watermark": True,   # Vẫn có watermark ẩn
            "user_tracking_id": True,      # Embed user ID vào file
        }
    }
```

### 7.2 Invisible Watermark (Tracking piracy)

```python
class InvisibleWatermark:
    """
    Nhúng thông tin user vào file Word xuất ra.
    Nếu file bị leak/bán lại → trace được nguồn.
    """
    
    def embed_in_docx(self, docx_content: bytes, user_id: str) -> bytes:
        # 1. Embed user ID trong metadata
        metadata = {
            "creator": f"EduTest AI",
            "custom_properties": {
                "edutest_license": self.encrypt(user_id),
                "export_timestamp": datetime.utcnow().isoformat(),
            }
        }
        
        # 2. Zero-width characters trong nội dung
        # Encode user_id bằng zero-width chars (U+200B, U+200C, U+200D)
        encoded_id = self.encode_zero_width(user_id)
        # Chèn vào cuối mỗi paragraph
        
        # 3. Micro-variations trong formatting
        # Slight spacing variations unique to each user
        # Ví dụ: spacing trước dấu ":" = 0.5pt cho user A, 0.6pt cho user B
        
        return watermarked_content
    
    def extract_from_docx(self, docx_content: bytes) -> str:
        """Trích xuất user ID từ file đã watermark"""
        # Reverse process to identify the leaker
        pass
```

---

## 8. Lớp 7: Honeypot & Trap Mechanisms

### 8.1 Honeypot Features

```python
class HoneypotSystem:
    """
    Tạo các bẫy để phát hiện bot và user xấu.
    """
    
    # 1. Hidden API endpoints - chỉ bot mới gọi
    HONEYPOT_ENDPOINTS = [
        "/api/v1/admin/credits/add",      # Fake endpoint
        "/api/v1/internal/bypass",         # Fake bypass
        "/api/v1/promo/unlimited",         # Fake promo
    ]
    
    # 2. Hidden form fields - chỉ bot mới fill
    HONEYPOT_FIELDS = {
        "signup_form": {
            "field_name": "website",       # Hidden CSS field
            "expected_value": "",          # Phải rỗng (human không thấy)
        }
    }
    
    # 3. Fake promo codes - theo dõi abuse
    TRAP_PROMO_CODES = [
        "FREECREDIT2024",    # Rải trên các forum
        "HACKTEST100K",      # Rải trên Telegram
        "UNLIMITED_EXAM",    # Rải trên Facebook groups
    ]
    
    async def check_honeypot_access(self, request):
        if request.path in self.HONEYPOT_ENDPOINTS:
            # Immediately flag and block
            await self.flag_user(request.user_id, reason="honeypot_endpoint")
            await self.block_ip(request.ip, duration="24h")
            return Response(status=404)  # Pretend not found
    
    async def check_trap_promo(self, promo_code: str, user_id: str):
        if promo_code in self.TRAP_PROMO_CODES:
            # Log but DON'T give credit
            await self.log_abuse_attempt(
                user_id=user_id,
                type="trap_promo",
                detail=f"Used trap promo: {promo_code}"
            )
            # Return fake success nhưng không cộng credit thật
            return PromoResult(
                success=True,  # User nghĩ thành công
                credits_added=0,  # Thực tế = 0
                message="Mã khuyến mãi đã được áp dụng!"
            )
```

### 8.2 Delayed Detection (Shadow Banning)

```python
class ShadowBanSystem:
    """
    Thay vì block ngay → để user tiếp tục nhưng output bị giảm chất lượng.
    User không biết mình bị ban → không tạo account mới ngay.
    """
    
    async def apply_shadow_restrictions(self, user_id: str):
        restrictions = {
            # Chất lượng đề thi giảm (dùng model rẻ hơn)
            "downgrade_model": "gemini-1.5-flash",
            
            # Delay response thêm 5-10 giây
            "artificial_delay": random.uniform(5, 10),
            
            # Giảm số câu hỏi generate
            "max_questions_per_exam": 5,  # Thay vì 20-30
            
            # Không cho export Word (chỉ PDF watermark)
            "block_word_export": True,
            
            # Cache hit giả (trả lại đề cũ)
            "force_cached_response": True,
        }
        
        await self.set_shadow_ban(user_id, restrictions, duration_hours=48)
```

---

## 9. Lớp 8: IP & Network Intelligence

### 9.1 IP Classification

```python
class IPIntelligence:
    """Phân loại IP để đánh giá rủi ro"""
    
    IP_CATEGORIES = {
        "residential": {
            "risk_score": 0,
            "action": "allow",
            "description": "IP nhà mạng Việt Nam (VNPT, Viettel, FPT)"
        },
        "mobile": {
            "risk_score": 10,
            "action": "allow",
            "description": "IP 4G/5G (shared IP, cẩn thận multi-account)"
        },
        "datacenter": {
            "risk_score": 60,
            "action": "challenge",
            "description": "IP từ cloud/VPS (likely bot)"
        },
        "vpn_proxy": {
            "risk_score": 70,
            "action": "challenge + reduced_bonus",
            "description": "VPN/Proxy detected"
        },
        "tor": {
            "risk_score": 90,
            "action": "block_signup",
            "description": "Tor exit node"
        },
        "known_abuse": {
            "risk_score": 100,
            "action": "block",
            "description": "IP đã từng abuse"
        }
    }
    
    async def classify_ip(self, ip: str) -> dict:
        # 1. Check internal blocklist
        if await self.is_blocked(ip):
            return self.IP_CATEGORIES["known_abuse"]
        
        # 2. Check VPN/Proxy databases
        # Dùng API: ip-api.com, ipqualityscore.com, hoặc MaxMind
        geo_data = await self.geoip_lookup(ip)
        
        if geo_data.is_vpn or geo_data.is_proxy:
            return self.IP_CATEGORIES["vpn_proxy"]
        
        if geo_data.is_datacenter:
            return self.IP_CATEGORIES["datacenter"]
        
        if geo_data.is_tor:
            return self.IP_CATEGORIES["tor"]
        
        # 3. Check country (chỉ cho phép VN hoặc whitelist)
        if geo_data.country != "VN":
            return {
                "risk_score": 40,
                "action": "challenge",
                "description": f"Non-VN IP: {geo_data.country}"
            }
        
        return self.IP_CATEGORIES["residential"]
```

### 9.2 Geographic Anomaly Detection

```python
class GeoAnomalyDetector:
    """Phát hiện login từ vị trí bất thường"""
    
    async def check_login_location(self, user_id: str, current_ip: str):
        current_geo = await self.geoip_lookup(current_ip)
        last_login = await self.get_last_login(user_id)
        
        if last_login:
            last_geo = last_login.geo_data
            
            # Tính khoảng cách
            distance_km = self.haversine(
                current_geo.lat, current_geo.lon,
                last_geo.lat, last_geo.lon
            )
            
            # Tính thời gian giữa 2 lần login
            time_diff_hours = (datetime.utcnow() - last_login.timestamp).total_seconds() / 3600
            
            # "Impossible travel": di chuyển quá nhanh
            max_possible_km = time_diff_hours * 900  # Máy bay ~900km/h
            
            if distance_km > max_possible_km and distance_km > 100:
                return GeoAnomaly(
                    risk="HIGH",
                    reason=f"Impossible travel: {distance_km:.0f}km in {time_diff_hours:.1f}h",
                    action="require_reverification"
                )
```

---

## 10. Lớp 9: API Protection & Bot Detection

### 10.1 Request Signature Validation

```python
class APIProtection:
    """Bảo vệ API endpoint khỏi direct access"""
    
    async def validate_request(self, request) -> bool:
        # 1. Check request origin
        origin = request.headers.get("Origin")
        referer = request.headers.get("Referer")
        
        if origin not in ALLOWED_ORIGINS:
            raise UnauthorizedOrigin()
        
        # 2. Check CSRF token
        csrf = request.headers.get("X-CSRF-Token")
        if not self.validate_csrf(csrf, request.session):
            raise CSRFViolation()
        
        # 3. Check request timing signature
        # Frontend gửi kèm timestamp + HMAC
        timestamp = request.headers.get("X-Request-Time")
        signature = request.headers.get("X-Request-Sig")
        
        if not self.verify_signature(timestamp, signature):
            raise InvalidSignature()
        
        # 4. Check request staleness (chống replay attack)
        if abs(time.time() - int(timestamp)) > 30:  # > 30 giây
            raise StaleRequest()
        
        return True
```

### 10.2 Bot Detection Signals

```python
class BotDetector:
    """Phát hiện bot/script tự động"""
    
    BOT_SIGNALS = {
        # Timing signals
        "too_fast_typing": {
            "description": "Nhập prompt < 2 giây (bình thường 10-30s)",
            "weight": 0.3
        },
        "exact_interval_requests": {
            "description": "Requests cách đều nhau (bot dùng setInterval)",
            "weight": 0.4
        },
        "no_mouse_movement": {
            "description": "Không có mouse events trước khi submit",
            "weight": 0.2
        },
        
        # Browser signals
        "headless_browser": {
            "description": "Puppeteer/Playwright detected",
            "weight": 0.9
        },
        "webdriver_flag": {
            "description": "navigator.webdriver = true",
            "weight": 0.8
        },
        "missing_plugins": {
            "description": "Không có browser plugins (bot thường không có)",
            "weight": 0.2
        },
        
        # Behavior signals
        "no_scroll_events": {
            "description": "Không scroll page trước khi action",
            "weight": 0.15
        },
        "sequential_exam_ids": {
            "description": "Access exam IDs tuần tự (scraping)",
            "weight": 0.5
        },
        "no_idle_time": {
            "description": "Không có thời gian idle giữa các actions",
            "weight": 0.3
        }
    }
    
    async def calculate_bot_score(self, session_data: dict) -> float:
        score = 0
        
        for signal_name, signal_config in self.BOT_SIGNALS.items():
            if self.detect_signal(session_data, signal_name):
                score += signal_config["weight"]
        
        # Normalize 0-1
        return min(score / sum(s["weight"] for s in self.BOT_SIGNALS.values()), 1.0)
```

### 10.3 Frontend Telemetry Collection

```typescript
// Collect user behavior signals on frontend
class BehaviorCollector {
  private events: BehaviorEvent[] = [];
  
  init() {
    // Track mouse movements (sampled)
    document.addEventListener('mousemove', throttle((e) => {
      this.events.push({ type: 'mouse', x: e.clientX, y: e.clientY, t: Date.now() });
    }, 1000));
    
    // Track key presses (count only, not content)
    document.addEventListener('keydown', () => {
      this.events.push({ type: 'key', t: Date.now() });
    });
    
    // Track scroll
    document.addEventListener('scroll', throttle(() => {
      this.events.push({ type: 'scroll', y: window.scrollY, t: Date.now() });
    }, 500));
    
    // Track focus/blur (tab switching)
    document.addEventListener('visibilitychange', () => {
      this.events.push({ type: 'visibility', hidden: document.hidden, t: Date.now() });
    });
  }
  
  // Gửi kèm mỗi API request
  getSummary(): BehaviorSummary {
    return {
      mouseMovements: this.events.filter(e => e.type === 'mouse').length,
      keyPresses: this.events.filter(e => e.type === 'key').length,
      scrollEvents: this.events.filter(e => e.type === 'scroll').length,
      tabSwitches: this.events.filter(e => e.type === 'visibility').length,
      sessionDuration: Date.now() - this.events[0]?.t,
      avgTimeBetweenActions: this.calculateAvgInterval(),
    };
  }
}
```

---

## 11. Lớp 10: Hệ thống Trust Score

### 11.1 Trust Score Model

```python
class TrustScoreEngine:
    """
    Mỗi user có Trust Score từ 0-100.
    Score càng cao → càng ít bị hạn chế.
    Score càng thấp → càng bị kiểm tra gắt.
    """
    
    # Factors tăng trust
    POSITIVE_FACTORS = {
        "verified_edu_email": +20,
        "phone_verified": +15,
        "account_age_30_days": +10,
        "account_age_90_days": +15,
        "first_topup_completed": +20,
        "total_topup_over_100k": +10,
        "total_topup_over_500k": +15,
        "consistent_usage_pattern": +10,  # Dùng đều đặn
        "positive_feedback_given": +5,    # Đánh giá tốt
        "no_violations_30_days": +5,
        "referral_invitee_paid": +5,      # Người được mời nạp tiền
    }
    
    # Factors giảm trust
    NEGATIVE_FACTORS = {
        "suspicious_email_pattern": -20,
        "vpn_detected": -15,
        "multi_account_linked": -30,
        "honeypot_triggered": -50,
        "rate_limit_hit_3_times": -10,
        "anomaly_score_high": -20,
        "bot_score_high": -40,
        "chargeback_attempted": -80,
        "reported_by_admin": -50,
        "spam_content_detected": -25,
    }
    
    async def calculate_trust_score(self, user_id: str) -> int:
        base_score = 50  # Start at 50
        
        user = await self.get_user_data(user_id)
        
        # Apply positive factors
        for factor, bonus in self.POSITIVE_FACTORS.items():
            if await self.check_factor(user, factor):
                base_score += bonus
        
        # Apply negative factors
        for factor, penalty in self.NEGATIVE_FACTORS.items():
            if await self.check_factor(user, factor):
                base_score += penalty  # penalty is negative
        
        # Clamp to 0-100
        return max(0, min(100, base_score))
```

### 11.2 Trust Score → Feature Access Matrix

```python
TRUST_FEATURE_MATRIX = {
    # Trust Score Range → Allowed Features
    "0-10": {
        "name": "Bị hạn chế nặng",
        "can_generate": False,
        "can_export": False,
        "can_ai_grade": False,
        "daily_requests": 0,
        "action": "Account review required"
    },
    "11-25": {
        "name": "Đáng ngờ",
        "can_generate": True,
        "can_export": False,       # Chỉ xem, không xuất
        "can_ai_grade": False,
        "daily_requests": 3,
        "captcha_every_action": True,
        "model_tier": "economy_only"
    },
    "26-50": {
        "name": "Cơ bản",
        "can_generate": True,
        "can_export": True,        # PDF watermark only
        "can_ai_grade": False,
        "daily_requests": 10,
        "captcha_every_action": False,
        "model_tier": "economy_or_balanced"
    },
    "51-75": {
        "name": "Đáng tin cậy",
        "can_generate": True,
        "can_export": True,        # Word sạch (nếu có credit)
        "can_ai_grade": True,
        "daily_requests": 30,
        "model_tier": "all"
    },
    "76-100": {
        "name": "VIP / Trusted",
        "can_generate": True,
        "can_export": True,
        "can_ai_grade": True,
        "daily_requests": 100,
        "model_tier": "all",
        "priority_queue": True,    # Ưu tiên xử lý
        "extended_cache": True,    # Cache lâu hơn
    }
}
```

### 11.3 Trust Score Update Events

```
┌──────────────────────────────────────────────────────────┐
│              TRUST SCORE LIFECYCLE                        │
│                                                          │
│  Signup ──► Score = 50 (hoặc 80 nếu .edu.vn)            │
│      │                                                   │
│      ▼                                                   │
│  ┌─────────────────┐                                    │
│  │ Positive Events  │ ──► Score tăng dần                │
│  │ • Nạp tiền       │     (max +5/event, cap 100)       │
│  │ • Dùng đều đặn   │                                    │
│  │ • Xác minh SĐT   │                                    │
│  └─────────────────┘                                    │
│      │                                                   │
│      ▼                                                   │
│  ┌─────────────────┐                                    │
│  │ Negative Events  │ ──► Score giảm nhanh              │
│  │ • Rate limited   │     (có thể -50/event)            │
│  │ • Honeypot hit   │                                    │
│  │ • Bot detected   │                                    │
│  └─────────────────┘                                    │
│      │                                                   │
│      ▼                                                   │
│  Score < 10 ──► Auto-suspend + Admin review              │
│  Score < 25 ──► Shadow restrictions                      │
│  Score > 75 ──► VIP treatment                            │
└──────────────────────────────────────────────────────────┘
```

---

## 12. Database Schema

### 12.1 Core Anti-Abuse Tables

```sql
-- Bảng Trust Score
CREATE TABLE user_trust_scores (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    current_score INTEGER NOT NULL DEFAULT 50 CHECK (current_score BETWEEN 0 AND 100),
    tier TEXT NOT NULL DEFAULT 'basic',  -- 'restricted', 'suspicious', 'basic', 'trusted', 'vip'
    is_shadow_banned BOOLEAN DEFAULT FALSE,
    shadow_ban_expires_at TIMESTAMPTZ,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspended_reason TEXT,
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lịch sử thay đổi Trust Score
CREATE TABLE trust_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    old_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    change_reason TEXT NOT NULL,
    factor_type TEXT NOT NULL,  -- 'positive', 'negative'
    factor_name TEXT NOT NULL,  -- e.g., 'first_topup', 'bot_detected'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Buckets (thay thế wallet đơn giản)
CREATE TABLE credit_buckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    credit_type TEXT NOT NULL,  -- 'BONUS', 'TOPUP', 'REFERRAL'
    initial_amount INTEGER NOT NULL,
    current_balance INTEGER NOT NULL DEFAULT 0,
    is_vested BOOLEAN DEFAULT TRUE,  -- Đã hết vesting period?
    vested_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    source_detail TEXT,  -- 'signup_bonus', 'promo_SUMMER2024', 'referral_user123'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (current_balance >= 0),
    CHECK (current_balance <= initial_amount)
);

CREATE INDEX idx_credit_buckets_user ON credit_buckets(user_id, expires_at);

-- Abuse Detection Logs
CREATE TABLE abuse_detection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    detection_type TEXT NOT NULL,
    -- 'multi_account', 'rate_limit', 'honeypot', 'bot', 'anomaly',
    -- 'impossible_travel', 'vpn', 'trap_promo'
    severity TEXT NOT NULL,  -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    details JSONB NOT NULL,
    ip_address INET,
    device_fingerprint TEXT,
    action_taken TEXT,  -- 'none', 'warned', 'throttled', 'shadow_banned', 'suspended'
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_abuse_user ON abuse_detection_logs(user_id, created_at);
CREATE INDEX idx_abuse_type ON abuse_detection_logs(detection_type, severity);

-- Rate Limit Violations
CREATE TABLE rate_limit_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    ip_address INET,
    endpoint TEXT NOT NULL,
    limit_type TEXT NOT NULL,  -- 'user', 'ip', 'global'
    current_count INTEGER,
    max_allowed INTEGER,
    window_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocked IPs
CREATE TABLE blocked_ips (
    ip_address INET PRIMARY KEY,
    reason TEXT NOT NULL,
    blocked_by TEXT DEFAULT 'system',  -- 'system', 'admin', 'honeypot'
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,  -- NULL = permanent
    is_active BOOLEAN DEFAULT TRUE
);

-- Promo Code Tracking
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    credit_amount INTEGER NOT NULL,
    max_uses INTEGER DEFAULT 100,
    current_uses INTEGER DEFAULT 0,
    max_uses_per_user INTEGER DEFAULT 1,
    is_trap BOOLEAN DEFAULT FALSE,  -- Honeypot promo
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE promo_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_id UUID REFERENCES promo_codes(id),
    user_id UUID REFERENCES users(id),
    ip_address INET,
    device_fingerprint TEXT,
    credit_actually_added INTEGER,  -- 0 nếu là trap promo
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_promo UNIQUE(promo_id, user_id)
);

-- Referral System
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id),
    invitee_id UUID REFERENCES users(id),
    referral_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending',  -- 'pending', 'qualified', 'rewarded', 'fraud'
    referrer_reward INTEGER DEFAULT 0,
    invitee_reward INTEGER DEFAULT 0,
    invitee_first_topup_at TIMESTAMPTZ,
    invitee_first_topup_amount INTEGER,
    qualified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_invitee UNIQUE(invitee_id)
);
```

### 12.2 RLS Policies for Anti-Abuse Tables

```sql
-- Users chỉ thấy trust score của mình
ALTER TABLE user_trust_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY trust_score_self ON user_trust_scores
    FOR SELECT USING (user_id = auth.uid());

-- Users chỉ thấy credit buckets của mình
ALTER TABLE credit_buckets ENABLE ROW LEVEL SECURITY;
CREATE POLICY credit_buckets_self ON credit_buckets
    FOR SELECT USING (user_id = auth.uid());

-- Abuse logs chỉ admin xem
ALTER TABLE abuse_detection_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY abuse_logs_admin ON abuse_detection_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
    );
```

---

## 13. Xử lý vi phạm & Escalation

### 13.1 Escalation Matrix

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ESCALATION MATRIX                                 │
│                                                                      │
│  Severity │ Example                  │ Auto Action        │ Manual   │
│  ─────────┼──────────────────────────┼────────────────────┼─────────│
│  LOW      │ Rate limit hit 1x        │ Warn + throttle    │ No      │
│  LOW      │ Unusual hours activity   │ Log only           │ No      │
│  ─────────┼──────────────────────────┼────────────────────┼─────────│
│  MEDIUM   │ Rate limit hit 3x        │ CAPTCHA required   │ No      │
│  MEDIUM   │ VPN detected             │ Reduce bonus       │ No      │
│  MEDIUM   │ Same prompt repeat       │ Force cache        │ No      │
│  ─────────┼──────────────────────────┼────────────────────┼─────────│
│  HIGH     │ Multi-account detected   │ Shadow ban 48h     │ Review  │
│  HIGH     │ Bot score > 0.8          │ Block + review     │ Review  │
│  HIGH     │ Mass export detected     │ Block export       │ Review  │
│  ─────────┼──────────────────────────┼────────────────────┼─────────│
│  CRITICAL │ Honeypot triggered       │ Suspend account    │ Review  │
│  CRITICAL │ Chargeback/payment fraud │ Suspend + block IP │ Review  │
│  CRITICAL │ API exploit attempt      │ Block IP + suspend │ Review  │
└──────────────────────────────────────────────────────────────────────┘
```

### 13.2 Automated Response Pipeline

```python
class ViolationHandler:
    """Pipeline xử lý tự động khi phát hiện vi phạm"""
    
    async def handle(self, violation: Violation):
        user = await self.get_user(violation.user_id)
        
        # 1. Log the violation
        await self.log_violation(violation)
        
        # 2. Update trust score
        score_change = self.SEVERITY_SCORE_MAP[violation.severity]
        new_score = await self.update_trust_score(
            user.id, score_change, violation.type
        )
        
        # 3. Apply immediate action based on severity
        if violation.severity == "CRITICAL":
            await self.suspend_account(user.id, violation.reason)
            await self.revoke_unused_bonus(user.id)
            await self.notify_admin(violation)
            
        elif violation.severity == "HIGH":
            await self.shadow_ban(user.id, hours=48)
            await self.reduce_limits(user.id, factor=0.5)
            await self.notify_admin(violation)
            
        elif violation.severity == "MEDIUM":
            await self.enable_captcha(user.id, duration_hours=24)
            await self.throttle(user.id, factor=0.7)
            
        elif violation.severity == "LOW":
            await self.warn_user(user.id, violation.message)
        
        # 4. Check cumulative violations
        recent_violations = await self.count_violations(
            user.id, hours=24
        )
        if recent_violations >= 5:
            # Escalate: nhiều vi phạm nhỏ = 1 vi phạm lớn
            await self.escalate(user.id, "Accumulated violations")
        
        # 5. Update feature access based on new trust score
        await self.refresh_feature_access(user.id, new_score)
```

### 13.3 Admin Review Dashboard

```
┌────────────────────────────────────────────────────────────┐
│              ADMIN ANTI-ABUSE DASHBOARD                     │
│                                                             │
│  Today's Stats:                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Blocked: 12  │ │ Flagged: 34 │ │ Shadow: 8   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│  Pending Reviews (15):                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ #1 user_abc │ Multi-account │ HIGH │ 2h ago │ Review │  │
│  │ #2 user_def │ Bot detected  │ HIGH │ 3h ago │ Review │  │
│  │ #3 user_ghi │ Mass export   │ HIGH │ 5h ago │ Review │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Quick Actions:                                            │
│  [Confirm Ban] [Lift Shadow Ban] [Restore Credits]         │
│  [Whitelist IP] [Block IP Range] [Revoke Promo]            │
│                                                             │
│  Abuse Trends (7 days):                                    │
│  Multi-account: ████████████░░░░ 65%                       │
│  Bot attacks:   ██████░░░░░░░░░░ 20%                       │
│  Promo abuse:   ████░░░░░░░░░░░░ 10%                       │
│  Other:         ██░░░░░░░░░░░░░░ 5%                        │
└────────────────────────────────────────────────────────────┘
```

---

## 14. Kế hoạch triển khai

### 14.1 Priority Matrix

```
                    Impact
                    High ┌─────────────────────────────────┐
                         │ P0: Google OAuth Only            │
                         │ P0: Rate Limiting                │
                         │ P0: Credit Type Separation       │
                         │ P1: Device Fingerprint           │
                         │ P1: Trust Score Basic            │
                         ├─────────────────────────────────┤
                    Med  │ P1: IP Intelligence              │
                         │ P1: Anomaly Detection Basic      │
                         │ P2: Watermark System             │
                         │ P2: Bot Detection                │
                         ├─────────────────────────────────┤
                    Low  │ P2: Honeypot System              │
                         │ P3: Shadow Banning               │
                         │ P3: Geo Anomaly                  │
                         │ P3: Advanced Analytics           │
                         └─────────────────────────────────┘
                         Low          Med          High
                                   Effort
```

### 14.2 Implementation Phases

#### Phase 1: Core Protection (Tuần 1-2)
| Task | Priority | Effort | Layer |
|------|----------|--------|-------|
| Google OAuth only (no email signup) | P0 | 0.5 day | Lớp 1 |
| Email domain classification | P0 | 1 day | Lớp 1 |
| Credit bucket system (BONUS/TOPUP/REFERRAL) | P0 | 2 days | Lớp 2 |
| Credit expiry & spending priority (FIFO) | P0 | 1 day | Lớp 2 |
| Basic rate limiting (per-user, per-IP) | P0 | 2 days | Lớp 3 |
| Redis sliding window counter | P0 | 1 day | Lớp 3 |
| Database schema creation | P0 | 1 day | DB |
| Basic admin abuse view | P1 | 1 day | Admin |

#### Phase 2: Detection (Tuần 3-4)
| Task | Priority | Effort | Layer |
|------|----------|--------|-------|
| Device fingerprint collection (FingerprintJS) | P1 | 2 days | Lớp 5 |
| Multi-account detection (fingerprint matching) | P1 | 2 days | Lớp 5 |
| Trust Score engine (basic) | P1 | 2 days | Lớp 10 |
| Trust → Feature access matrix | P1 | 1 day | Lớp 10 |
| IP classification (VPN/proxy detect) | P1 | 1 day | Lớp 8 |
| Progressive throttling | P1 | 1 day | Lớp 3 |

#### Phase 3: Advanced Detection (Tuần 5-6)
| Task | Priority | Effort | Layer |
|------|----------|--------|-------|
| Anomaly detection rules engine | P1 | 3 days | Lớp 4 |
| Bot detection (behavior telemetry) | P2 | 2 days | Lớp 9 |
| Frontend telemetry collection | P2 | 2 days | Lớp 9 |
| Watermark system (visible + invisible) | P2 | 2 days | Lớp 6 |
| Honeypot endpoints & trap promos | P2 | 1 day | Lớp 7 |

#### Phase 4: Intelligence (Tuần 7-8)
| Task | Priority | Effort | Layer |
|------|----------|--------|-------|
| Shadow ban system | P3 | 1 day | Lớp 7 |
| Geo anomaly detection | P3 | 1 day | Lớp 8 |
| Admin review dashboard | P2 | 3 days | Admin |
| Automated escalation pipeline | P2 | 2 days | Xử lý |
| Trust score advanced factors | P3 | 2 days | Lớp 10 |
| Anti-abuse analytics & reporting | P3 | 2 days | Monitor |

### 14.3 Tóm tắt so sánh: Plan gốc vs Plan mở rộng

| Biện pháp | Plan gốc | Plan mở rộng |
|-----------|----------|--------------|
| Google OAuth Only | ✅ | ✅ + Email pattern detection |
| Credit tiers (edu vs gmail) | ✅ 2 tiers | ✅ 4 tiers + suspicious detection |
| Watermark PDF | ✅ Basic | ✅ + Invisible watermark + tracking |
| Rate Limiting | ❌ | ✅ Multi-level + progressive throttling |
| Device Fingerprint | ❌ | ✅ Multi-account detection |
| Trust Score | ❌ | ✅ 0-100 dynamic scoring |
| Bot Detection | ❌ | ✅ Behavior telemetry |
| IP Intelligence | ❌ | ✅ VPN/Proxy/Geo detection |
| Honeypot | ❌ | ✅ Trap endpoints + promo codes |
| Shadow Banning | ❌ | ✅ Delayed punishment |
| Credit Types | ❌ (single wallet) | ✅ BONUS/TOPUP/REFERRAL buckets |
| Anomaly Detection | ❌ | ✅ 8+ behavioral rules |
| Admin Dashboard | ❌ | ✅ Review + actions |
| Automated Escalation | ❌ | ✅ Severity-based pipeline |