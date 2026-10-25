# EduTest AI - LLM Routing & API Cost Optimization Plan

## Mục lục
1. [Tổng quan kiến trúc Multi-Agent](#1-tổng-quan-kiến-trúc-multi-agent)
2. [Chiến lược định tuyến LLM (LLM Router)](#2-chiến-lược-định-tuyến-llm-llm-router)
3. [Phân loại Task và Model Mapping](#3-phân-loại-task-và-model-mapping)
4. [Kiến trúc LLM Gateway](#4-kiến-trúc-llm-gateway)
5. [Chiến lược tối ưu chi phí API](#5-chiến-lược-tối-ưu-chi-phí-api)
6. [Caching Layer](#6-caching-layer)
7. [Token Budget Management](#7-token-budget-management)
8. [Monitoring & Analytics](#8-monitoring--analytics)
9. [Fallback & Circuit Breaker](#9-fallback--circuit-breaker)
10. [Kế hoạch triển khai](#10-kế-hoạch-triển-khai)

---

## 1. Tổng quan kiến trúc Multi-Agent

### 1.1 Các Agent trong hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR AGENT                     │
│              (Điều phối trung tâm - LangGraph)           │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Task        │  │  Priority    │  │  State         │  │
│  │  Classifier  │  │  Manager     │  │  Manager       │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└──────────────┬───────────────────────────┬───────────────┘
               │                           │
    ┌──────────▼──────────┐     ┌──────────▼──────────┐
    │                     │     │                     │
    │   LLM ROUTER        │◄───►│   LLM GATEWAY       │
    │   (Định tuyến)      │     │   (Proxy tập trung)  │
    │                     │     │                     │
    └──────────┬──────────┘     └──────────┬──────────┘
               │                           │
    ┌──────────▼───────────────────────────▼──────────┐
    │              AGENT POOL                          │
    │                                                  │
    │  ┌──────────────┐  ┌──────────────────────────┐  │
    │  │ Question      │  │ Quality Assurance        │  │
    │  │ Generator     │  │ Agent                    │  │
    │  │ Agent         │  │                          │  │
    │  └──────────────┘  └──────────────────────────┘  │
    │                                                  │
    │  ┌──────────────┐  ┌──────────────────────────┐  │
    │  │ Difficulty    │  │ Content Analyzer         │  │
    │  │ Calibrator    │  │ Agent                    │  │
    │  │ Agent         │  │                          │  │
    │  └──────────────┘  └──────────────────────────┘  │
    │                                                  │
    │  ┌──────────────┐  ┌──────────────────────────┐  │
    │  │ Exam Builder  │  │ Answer Evaluator         │  │
    │  │ Agent         │  │ Agent                    │  │
    │  └──────────────┘  └──────────────────────────┘  │
    └──────────────────────────────────────────────────┘
```

### 1.2 Luồng xử lý Multi-Agent

```
User Request
    │
    ▼
Orchestrator Agent
    │
    ├── 1. Phân tích yêu cầu (Task Classification)
    │
    ├── 2. Xác định Agent(s) cần thiết
    │
    ├── 3. LLM Router quyết định model cho mỗi agent
    │
    ├── 4. Dispatch tasks song song/tuần tự
    │
    ├── 5. Thu thập kết quả từ agents
    │
    ├── 6. Quality check & merge results
    │
    └── 7. Trả kết quả cho user
```

---

## 2. Chiến lược định tuyến LLM (LLM Router)

### 2.1 Nguyên tắc định tuyến

LLM Router hoạt động dựa trên **4 yếu tố chính**:

| Yếu tố | Mô tả | Trọng số |
|---------|--------|----------|
| **Task Complexity** | Độ phức tạp của tác vụ | 40% |
| **Quality Requirement** | Yêu cầu chất lượng đầu ra | 25% |
| **Latency Requirement** | Yêu cầu về tốc độ phản hồi | 20% |
| **Budget Constraint** | Giới hạn ngân sách | 15% |

### 2.2 Routing Decision Tree

```
                    Task Input
                       │
                       ▼
              ┌─────────────────┐
              │ Task Complexity  │
              │ Assessment       │
              └────────┬────────┘
                       │
           ┌───────────┼───────────┐
           │           │           │
           ▼           ▼           ▼
        Simple      Medium      Complex
           │           │           │
           ▼           ▼           ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Tier 3   │ │ Tier 2   │ │ Tier 1   │
    │ (Cheap)  │ │ (Balance)│ │ (Premium)│
    │          │ │          │ │          │
    │ GPT-4o-  │ │ GPT-4o-  │ │ GPT-4o   │
    │ mini     │ │ mini /   │ │ Claude   │
    │ Gemini   │ │ Gemini   │ │ 3.5      │
    │ Flash    │ │ Pro      │ │ Sonnet   │
    └──────────┘ └──────────┘ └──────────┘
```

### 2.3 Router Logic (Pseudocode)

```python
class LLMRouter:
    def route(self, task: AgentTask) -> ModelConfig:
        # Step 1: Classify task complexity
        complexity = self.classify_complexity(task)
        
        # Step 2: Check cache first
        cached = self.cache_manager.get(task.cache_key)
        if cached:
            return CachedResponse(cached)
        
        # Step 3: Check budget remaining
        budget = self.budget_manager.get_remaining(task.user_id)
        
        # Step 4: Select model tier
        tier = self.select_tier(complexity, budget, task.quality_req)
        
        # Step 5: Select specific model within tier
        model = self.select_model(tier, task.agent_type)
        
        # Step 6: Apply rate limiting
        self.rate_limiter.check(model)
        
        return ModelConfig(model=model, tier=tier)
```

---

## 3. Phân loại Task và Model Mapping

### 3.1 Task Complexity Classification

#### Tier 1 - Complex Tasks (Model Premium: GPT-4o, Claude 3.5 Sonnet)
| Task | Agent | Lý do cần Premium |
|------|-------|--------------------|
| Tạo câu hỏi Essay phức tạp | Question Generator | Cần sáng tạo, ngữ cảnh sâu |
| Đánh giá câu trả lời tự luận | Answer Evaluator | Cần phân tích ngữ nghĩa phức tạp |
| Phân tích Bloom's Taxonomy cao (Analyze, Evaluate, Create) | Content Analyzer | Cần hiểu biết sâu về phân loại |
| Tạo rubric đánh giá chi tiết | Quality Assurance | Cần logic đánh giá phức tạp |
| Xử lý nội dung đa ngôn ngữ phức tạp | Content Analyzer | Cần xử lý tiếng Việt + chuyên ngành |

**Ước tính chi phí**: ~$0.005-0.015 / request

#### Tier 2 - Medium Tasks (Model Balanced: GPT-4o-mini, Gemini 1.5 Pro)
| Task | Agent | Lý do |
|------|-------|-------|
| Tạo câu hỏi MCQ tiêu chuẩn | Question Generator | Template-based + sáng tạo vừa |
| Tạo câu hỏi True/False | Question Generator | Logic đơn giản hơn |
| Đánh giá đáp án MCQ với giải thích | Answer Evaluator | Pattern matching + giải thích |
| Calibrate độ khó | Difficulty Calibrator | Phân tích thống kê + điều chỉnh |
| Tạo đề thi từ bank câu hỏi | Exam Builder | Lọc + sắp xếp + cân bằng |

**Ước tính chi phí**: ~$0.0005-0.002 / request

#### Tier 3 - Simple Tasks (Model Economy: GPT-4o-mini, Gemini 1.5 Flash)
| Task | Agent | Lý do |
|------|-------|-------|
| Phân loại chủ đề nội dung | Content Analyzer | Classification đơn giản |
| Extract keywords từ tài liệu | Content Analyzer | NLP cơ bản |
| Format/validate câu hỏi | Quality Assurance | Rule-based + validation |
| Tạo câu hỏi Fill-in-blank đơn giản | Question Generator | Template-based |
| Phân loại Bloom's cấp thấp (Remember, Understand) | Content Analyzer | Classification đơn giản |
| Tạo matching pairs đơn giản | Question Generator | Pattern matching |

**Ước tính chi phí**: ~$0.0001-0.0005 / request

### 3.2 Model Pricing Reference (Tham khảo - cập nhật Q3/2024)

| Model | Input ($/1M tokens) | Output ($/1M tokens) | Best For |
|-------|---------------------|----------------------|----------|
| GPT-4o | $2.50 | $10.00 | Complex reasoning, Vietnamese |
| GPT-4o-mini | $0.15 | $0.60 | General tasks, cost-effective |
| Claude 3.5 Sonnet | $3.00 | $15.00 | Long context, nuanced analysis |
| Claude 3.5 Haiku | $0.25 | $1.25 | Fast, affordable tasks |
| Gemini 1.5 Pro | $1.25 | $5.00 | Long documents, multimodal |
| Gemini 1.5 Flash | $0.075 | $0.30 | Ultra-fast, cheapest option |
| Gemini 2.0 Flash | $0.10 | $0.40 | Fast, newer capabilities |

### 3.3 Agent-to-Model Default Mapping

```python
AGENT_MODEL_MAPPING = {
    "orchestrator": {
        "default": "gpt-4o-mini",      # Điều phối không cần model lớn
        "fallback": "gemini-1.5-flash"
    },
    "question_generator": {
        "essay": "gpt-4o",              # Essay cần sáng tạo cao
        "mcq": "gpt-4o-mini",           # MCQ template-based
        "true_false": "gpt-4o-mini",    # Đơn giản
        "fill_blank": "gemini-1.5-flash", # Đơn giản nhất
        "matching": "gpt-4o-mini",      # Vừa phải
        "fallback": "gemini-1.5-pro"
    },
    "quality_assurance": {
        "rubric_creation": "gpt-4o",    # Cần phân tích sâu
        "validation": "gpt-4o-mini",    # Rule-based
        "review": "gpt-4o-mini",        # Pattern matching
        "fallback": "gemini-1.5-flash"
    },
    "difficulty_calibrator": {
        "default": "gpt-4o-mini",       # Phân tích thống kê
        "fallback": "gemini-1.5-flash"
    },
    "content_analyzer": {
        "bloom_high": "gpt-4o",         # Bloom cấp cao
        "bloom_low": "gpt-4o-mini",     # Bloom cấp thấp
        "topic_classify": "gemini-1.5-flash", # Phân loại nhanh
        "keyword_extract": "gemini-1.5-flash", # NLP cơ bản
        "fallback": "gpt-4o-mini"
    },
    "answer_evaluator": {
        "essay": "gpt-4o",              # Đánh giá tự luận phức tạp
        "mcq": "gpt-4o-mini",           # So khớp đáp án
        "fallback": "gemini-1.5-pro"
    },
    "exam_builder": {
        "default": "gpt-4o-mini",       # Logic sắp xếp
        "fallback": "gemini-1.5-flash"
    }
}
```

---

## 4. Kiến trúc LLM Gateway

### 4.1 Gateway Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      LLM GATEWAY                             │
│                                                              │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Rate       │  │ Token       │  │ Request              │  │
│  │ Limiter    │  │ Counter     │  │ Queue                │  │
│  └─────┬──────┘  └──────┬──────┘  └───────────┬──────────┘  │
│        │                │                     │              │
│  ┌─────▼────────────────▼─────────────────────▼──────────┐  │
│  │                  ROUTER ENGINE                         │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌──────────┐  ┌─────────────────┐   │  │
│  │  │ Complexity  │  │ Budget   │  │ Model           │   │  │
│  │  │ Classifier  │  │ Checker  │  │ Selector        │   │  │
│  │  └─────────────┘  └──────────┘  └─────────────────┘   │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────▼───────────────────────────────┐  │
│  │                  PROVIDER ADAPTERS                      │  │
│  │                                                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│  │  │ OpenAI   │  │ Anthropic│  │ Google   │             │  │
│  │  │ Adapter  │  │ Adapter  │  │ Adapter  │             │  │
│  │  └──────────┘  └──────────┘  └──────────┘             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ Cache        │  │ Retry        │  │ Circuit         │    │
│  │ Manager      │  │ Handler      │  │ Breaker         │    │
│  └──────────────┘  └──────────────┘  └─────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Gateway Components

```python
# Cấu trúc thư mục đề xuất
ai_services/
├── gateway/
│   ├── __init__.py
│   ├── llm_gateway.py          # Entry point - Gateway chính
│   ├── router.py               # LLM Router logic
│   ├── model_registry.py       # Đăng ký & quản lý models
│   └── config.py               # Cấu hình gateway
│
├── providers/
│   ├── __init__.py
│   ├── base_provider.py        # Abstract base class
│   ├── openai_provider.py      # OpenAI adapter
│   ├── anthropic_provider.py   # Anthropic adapter
│   └── google_provider.py      # Google AI adapter
│
├── agents/
│   ├── __init__.py
│   ├── base_agent.py           # Abstract base agent
│   ├── orchestrator.py         # Orchestrator agent
│   ├── question_generator.py   # Question generation agent
│   ├── quality_assurance.py    # QA agent
│   ├── difficulty_calibrator.py
│   ├── content_analyzer.py
│   ├── answer_evaluator.py
│   └── exam_builder.py
│
├── optimization/
│   ├── __init__.py
│   ├── cache_manager.py        # Semantic caching
│   ├── token_counter.py        # Token counting & budgeting
│   ├── rate_limiter.py         # Rate limiting
│   ├── batch_processor.py      # Batch request processing
│   └── budget_manager.py       # Cost tracking & budget
│
├── monitoring/
│   ├── __init__.py
│   ├── cost_tracker.py         # Chi phí tracking
│   ├── usage_analytics.py      # Phân tích sử dụng
│   ├── performance_monitor.py  # Latency, error tracking
│   └── alerting.py             # Cảnh báo ngân sách
│
└── utils/
    ├── __init__.py
    ├── prompt_optimizer.py     # Tối ưu prompt
    ├── response_parser.py      # Parse response
    └── error_handler.py        # Xử lý lỗi
```

---

## 5. Chiến lược tối ưu chi phí API

### 5.1 Tổng quan các chiến lược

```
┌──────────────────────────────────────────────────────────┐
│            CHIẾN LƯỢC TỐI ƯU CHI PHÍ API                │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ 1. Smart        │  │ 2. Semantic     │               │
│  │    Routing      │  │    Caching      │               │
│  │    (-40% cost)  │  │    (-30% cost)  │               │
│  └─────────────────┘  └─────────────────┘               │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ 3. Prompt       │  │ 4. Batch        │               │
│  │    Optimization │  │    Processing   │               │
│  │    (-20% tokens)│  │    (-15% cost)  │               │
│  └─────────────────┘  └─────────────────┘               │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ 5. Token        │  │ 6. Response     │               │
│  │    Budget       │  │    Streaming    │               │
│  │    Management   │  │    + Early Stop │               │
│  └─────────────────┘  └─────────────────┘               │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Chi tiết từng chiến lược

#### Strategy 1: Smart Routing (Giảm ~40% chi phí)

**Nguyên tắc**: Dùng model rẻ nhất đáp ứng được yêu cầu chất lượng.

```python
class SmartRouter:
    """
    Routes requests to the most cost-effective model
    that meets quality requirements.
    """
    
    COMPLEXITY_THRESHOLDS = {
        "simple": {
            "max_input_tokens": 500,
            "bloom_levels": ["remember", "understand"],
            "question_types": ["fill_blank", "true_false", "mcq_simple"],
            "model": "gemini-1.5-flash"  # Cheapest
        },
        "medium": {
            "max_input_tokens": 2000,
            "bloom_levels": ["apply", "analyze"],
            "question_types": ["mcq_complex", "matching", "short_answer"],
            "model": "gpt-4o-mini"  # Balanced
        },
        "complex": {
            "max_input_tokens": 8000,
            "bloom_levels": ["evaluate", "create"],
            "question_types": ["essay", "case_study", "rubric"],
            "model": "gpt-4o"  # Premium
        }
    }
    
    def classify_and_route(self, task):
        # Phân tích features của task
        features = self.extract_features(task)
        
        # Bắt đầu từ tier rẻ nhất, upgrade nếu cần
        for tier in ["simple", "medium", "complex"]:
            if self.meets_requirements(features, tier):
                return self.COMPLEXITY_THRESHOLDS[tier]["model"]
        
        return "gpt-4o"  # Default to premium if uncertain
```

#### Strategy 2: Semantic Caching (Giảm ~30% chi phí)

```python
class SemanticCache:
    """
    Cache responses based on semantic similarity of prompts.
    Avoid redundant API calls for similar questions.
    """
    
    def __init__(self):
        self.embedding_model = "text-embedding-3-small"  # $0.02/1M tokens
        self.similarity_threshold = 0.92
        self.cache_store = Redis()  # Or Supabase with pgvector
        self.ttl = 86400 * 7  # 7 days cache
    
    async def get_or_generate(self, prompt, generate_fn):
        # 1. Generate embedding for the prompt
        embedding = await self.get_embedding(prompt)
        
        # 2. Search for similar cached prompts
        cached = await self.cache_store.similarity_search(
            embedding, 
            threshold=self.similarity_threshold
        )
        
        if cached:
            self.metrics.cache_hit()
            return cached.response
        
        # 3. No cache hit - generate new response
        response = await generate_fn(prompt)
        
        # 4. Store in cache
        await self.cache_store.store(
            embedding=embedding,
            prompt=prompt,
            response=response,
            ttl=self.ttl
        )
        
        self.metrics.cache_miss()
        return response
```

**Các loại cache:**

| Cache Type | Mô tả | TTL | Use Case |
|------------|--------|-----|----------|
| **Exact Match** | Hash prompt → response | 30 days | Cùng câu hỏi, cùng params |
| **Semantic Cache** | Embedding similarity | 7 days | Câu hỏi tương tự nhau |
| **Template Cache** | Cached prompt templates | ∞ | System prompts, instructions |
| **Result Cache** | Cache kết quả agent | 1 day | Kết quả phân tích nội dung |

#### Strategy 3: Prompt Optimization (Giảm ~20% tokens)

```python
class PromptOptimizer:
    """
    Optimize prompts to reduce token usage without losing quality.
    """
    
    def optimize(self, prompt: str, task_type: str) -> str:
        optimized = prompt
        
        # 1. Remove redundant instructions
        optimized = self.remove_redundancy(optimized)
        
        # 2. Use compressed system prompts
        optimized = self.compress_system_prompt(optimized, task_type)
        
        # 3. Apply few-shot → zero-shot when possible
        if self.can_use_zero_shot(task_type):
            optimized = self.remove_examples(optimized)
        
        # 4. Truncate context to relevant parts
        optimized = self.truncate_context(optimized, max_tokens=2000)
        
        # 5. Use structured output format (JSON) to reduce output tokens
        optimized = self.add_structured_output(optimized)
        
        return optimized
    
    COMPRESSED_SYSTEM_PROMPTS = {
        "mcq_generator": """Bạn là chuyên gia tạo câu hỏi trắc nghiệm giáo dục VN.
Tạo câu hỏi theo format JSON: {question, options[4], correct_answer, explanation, bloom_level, difficulty}
Ngôn ngữ: Tiếng Việt. Đảm bảo distractors hợp lý.""",
        
        # Thay vì prompt dài 500 tokens → chỉ 80 tokens
    }
```

#### Strategy 4: Batch Processing (Giảm ~15% chi phí)

```python
class BatchProcessor:
    """
    Group similar requests and process them in batches
    to reduce API overhead and leverage batch pricing.
    """
    
    def __init__(self):
        self.batch_queue = {}
        self.batch_size = 5          # Gom 5 requests/batch
        self.batch_timeout = 2.0     # Max wait 2 seconds
    
    async def add_to_batch(self, task):
        batch_key = f"{task.agent_type}:{task.model}:{task.task_subtype}"
        
        if batch_key not in self.batch_queue:
            self.batch_queue[batch_key] = BatchGroup(
                timeout=self.batch_timeout
            )
        
        future = self.batch_queue[batch_key].add(task)
        
        # Check if batch is full or timeout
        if self.batch_queue[batch_key].is_ready():
            await self.process_batch(batch_key)
        
        return await future
    
    async def process_batch(self, batch_key):
        """Gộp nhiều câu hỏi vào 1 API call"""
        batch = self.batch_queue.pop(batch_key)
        
        combined_prompt = self.merge_prompts(batch.tasks)
        response = await self.llm_call(combined_prompt)
        results = self.split_response(response, len(batch.tasks))
        
        for task, result in zip(batch.tasks, results):
            task.future.set_result(result)
```

#### Strategy 5: Token Budget Management

```python
class BudgetManager:
    """
    Track and enforce token/cost budgets per user, org, and system.
    """
    
    # Budget tiers
    BUDGET_TIERS = {
        "free": {
            "daily_tokens": 50_000,
            "daily_cost_usd": 0.10,
            "allowed_models": ["gemini-1.5-flash", "gpt-4o-mini"],
            "max_requests_per_hour": 20
        },
        "basic": {
            "daily_tokens": 500_000,
            "daily_cost_usd": 1.00,
            "allowed_models": ["gemini-1.5-flash", "gpt-4o-mini", "gemini-1.5-pro"],
            "max_requests_per_hour": 100
        },
        "premium": {
            "daily_tokens": 5_000_000,
            "daily_cost_usd": 10.00,
            "allowed_models": ["all"],
            "max_requests_per_hour": 500
        },
        "enterprise": {
            "daily_tokens": "unlimited",
            "daily_cost_usd": 100.00,
            "allowed_models": ["all"],
            "max_requests_per_hour": 2000
        }
    }
    
    async def check_budget(self, user_id: str, estimated_cost: float) -> bool:
        usage = await self.get_daily_usage(user_id)
        tier = await self.get_user_tier(user_id)
        budget = self.BUDGET_TIERS[tier]
        
        if usage.total_cost + estimated_cost > budget["daily_cost_usd"]:
            raise BudgetExceededException(
                f"Daily budget exceeded. Used: ${usage.total_cost:.4f}, "
                f"Limit: ${budget['daily_cost_usd']}"
            )
        
        return True
    
    def downgrade_model_if_needed(self, model: str, user_id: str) -> str:
        """Auto-downgrade model khi gần hết budget"""
        usage_ratio = self.get_usage_ratio(user_id)
        
        if usage_ratio > 0.8:  # > 80% budget used
            return self.get_cheaper_alternative(model)
        
        return model
```

#### Strategy 6: Response Streaming + Early Stopping

```python
class StreamingOptimizer:
    """
    Use streaming to detect early completion and save tokens.
    """
    
    async def stream_with_early_stop(self, prompt, model, stop_conditions):
        buffer = ""
        
        async for chunk in self.stream(prompt, model):
            buffer += chunk
            
            # Check if we have enough information
            if self.is_complete(buffer, stop_conditions):
                # Cancel the remaining stream
                break
            
            # Check for quality issues early
            if self.detect_hallucination(buffer):
                # Restart with different prompt/model
                return await self.retry_with_correction(prompt, model)
        
        return buffer
```

---

## 6. Caching Layer

### 6.1 Multi-Level Cache Architecture

```
┌─────────────────────────────────────────────────┐
│                 REQUEST                          │
│                    │                             │
│           ┌───────▼────────┐                    │
│           │  L1: In-Memory │  TTL: 5 min        │
│           │  (LRU Cache)   │  Hit Rate: ~15%    │
│           └───────┬────────┘                    │
│                   │ Miss                         │
│           ┌───────▼────────┐                    │
│           │  L2: Redis     │  TTL: 1 hour       │
│           │  (Exact Match) │  Hit Rate: ~25%    │
│           └───────┬────────┘                    │
│                   │ Miss                         │
│           ┌───────▼────────┐                    │
│           │  L3: Supabase  │  TTL: 7 days       │
│           │  (Semantic/    │  Hit Rate: ~20%    │
│           │   pgvector)    │                    │
│           └───────┬────────┘                    │
│                   │ Miss                         │
│           ┌───────▼────────┐                    │
│           │  LLM API Call  │                    │
│           │  (Store result │                    │
│           │   in all caches)│                    │
│           └────────────────┘                    │
│                                                  │
│  Combined Hit Rate Target: ~60%                  │
│  Cost Savings: ~30% of API costs                 │
└─────────────────────────────────────────────────┘
```

### 6.2 Cache Key Strategy

```python
class CacheKeyGenerator:
    def generate_exact_key(self, request):
        """L1/L2: Exact match cache key"""
        return hashlib.sha256(
            json.dumps({
                "agent": request.agent_type,
                "task_type": request.task_type,
                "prompt_hash": hashlib.md5(request.prompt.encode()).hexdigest(),
                "model": request.model,
                "temperature": request.temperature,
                "params": request.sorted_params()
            }, sort_keys=True).encode()
        ).hexdigest()
    
    def generate_semantic_key(self, request):
        """L3: Semantic similarity key (embedding vector)"""
        # Chỉ dùng phần content, bỏ system prompt
        content = self.extract_user_content(request.prompt)
        embedding = self.embedding_model.encode(content)
        return embedding
```

### 6.3 Cache Invalidation Rules

| Trigger | Action | Scope |
|---------|--------|-------|
| Prompt template thay đổi | Clear L1, L2 cho template đó | Per template |
| Model version update | Clear all caches cho model đó | Per model |
| User feedback "bad quality" | Remove specific cache entry | Per entry |
| Curriculum/content update | Clear semantic cache cho chủ đề | Per topic |
| TTL expired | Auto-remove | Per entry |
| Manual admin action | Selective or full clear | Configurable |

---

## 7. Token Budget Management

### 7.1 Token Estimation Before API Call

```python
class TokenEstimator:
    """Estimate tokens before making API call to predict cost"""
    
    CHARS_PER_TOKEN_VI = 2.5  # Tiếng Việt: ~2.5 chars/token
    CHARS_PER_TOKEN_EN = 4.0  # English: ~4 chars/token
    
    OUTPUT_MULTIPLIERS = {
        "mcq_generation": 2.5,      # Output ~2.5x input
        "essay_generation": 4.0,     # Output ~4x input
        "true_false_generation": 1.5,
        "answer_evaluation": 1.5,
        "content_analysis": 1.0,
        "difficulty_calibration": 0.5,
        "topic_classification": 0.3,
    }
    
    def estimate(self, prompt: str, task_type: str, language: str = "vi") -> TokenEstimate:
        chars_per_token = (
            self.CHARS_PER_TOKEN_VI if language == "vi" 
            else self.CHARS_PER_TOKEN_EN
        )
        
        input_tokens = len(prompt) / chars_per_token
        output_multiplier = self.OUTPUT_MULTIPLIERS.get(task_type, 2.0)
        estimated_output_tokens = input_tokens * output_multiplier
        
        return TokenEstimate(
            input_tokens=int(input_tokens),
            estimated_output_tokens=int(estimated_output_tokens),
            total_estimated=int(input_tokens + estimated_output_tokens)
        )
```

### 7.2 Cost Tracking Schema (Supabase)

```sql
-- Bảng tracking chi phí API
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    agent_type TEXT NOT NULL,
    task_type TEXT NOT NULL,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    
    -- Token metrics
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
    
    -- Cost metrics
    input_cost_usd DECIMAL(10, 8) NOT NULL,
    output_cost_usd DECIMAL(10, 8) NOT NULL,
    total_cost_usd DECIMAL(10, 8) GENERATED ALWAYS AS (input_cost_usd + output_cost_usd) STORED,
    
    -- Performance metrics
    latency_ms INTEGER,
    was_cached BOOLEAN DEFAULT FALSE,
    cache_level TEXT,  -- 'L1', 'L2', 'L3', NULL
    
    -- Routing info
    original_model TEXT,     -- Model ban đầu được chọn
    routed_model TEXT,       -- Model thực tế sau routing/downgrade
    routing_reason TEXT,     -- Lý do routing
    
    -- Quality metrics
    quality_score DECIMAL(3, 2),  -- 0.00 - 1.00
    user_feedback TEXT,           -- 'good', 'bad', 'neutral'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho analytics
CREATE INDEX idx_usage_user_date ON api_usage_logs(user_id, created_at);
CREATE INDEX idx_usage_model ON api_usage_logs(model, created_at);
CREATE INDEX idx_usage_agent ON api_usage_logs(agent_type, created_at);

-- View tổng hợp chi phí theo ngày
CREATE VIEW daily_cost_summary AS
SELECT 
    DATE(created_at) as date,
    user_id,
    model,
    agent_type,
    COUNT(*) as request_count,
    SUM(total_tokens) as total_tokens,
    SUM(total_cost_usd) as total_cost,
    AVG(latency_ms) as avg_latency,
    SUM(CASE WHEN was_cached THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as cache_hit_rate
FROM api_usage_logs
GROUP BY DATE(created_at), user_id, model, agent_type;
```

---

## 8. Monitoring & Analytics

### 8.1 Dashboard Metrics

```
┌─────────────────────────────────────────────────────────┐
│                 COST MONITORING DASHBOARD                │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ Today's Cost     │  │ Monthly Cost    │               │
│  │ $2.45 / $10.00   │  │ $45.20 / $300   │               │
│  │ ████████░░ 24.5% │  │ ██████░░░ 15.1% │               │
│  └─────────────────┘  └─────────────────┘               │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ Cache Hit Rate   │  │ Avg Latency     │               │
│  │ 58.3%            │  │ 1.2s            │               │
│  │ ████████████░░   │  │ Target: < 2s ✅ │               │
│  └─────────────────┘  └─────────────────┘               │
│                                                          │
│  Cost by Model:           Cost by Agent:                 │
│  GPT-4o:     $1.20 (49%)  Question Gen: $1.50 (61%)     │
│  GPT-4o-mini: $0.80 (33%) Answer Eval:  $0.45 (18%)     │
│  Gemini:      $0.45 (18%) Content Ana:  $0.30 (12%)     │
│                           Other:        $0.20 (9%)      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Alerts:                                          │    │
│  │ ⚠️ GPT-4o usage 80% of daily budget              │    │
│  │ ✅ Cache hit rate above target (58% > 50%)        │    │
│  │ ℹ️ Gemini Flash available for 3 more task types   │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Alert Rules

```python
ALERT_RULES = {
    "budget_warning": {
        "condition": "daily_cost > daily_budget * 0.8",
        "severity": "warning",
        "action": "notify_admin + downgrade_models"
    },
    "budget_critical": {
        "condition": "daily_cost > daily_budget * 0.95",
        "severity": "critical",
        "action": "notify_admin + block_premium_models + enable_strict_caching"
    },
    "low_cache_hit": {
        "condition": "cache_hit_rate < 0.3 for 1 hour",
        "severity": "info",
        "action": "review_cache_config"
    },
    "high_error_rate": {
        "condition": "error_rate > 0.05 for model",
        "severity": "warning",
        "action": "activate_fallback + notify_admin"
    },
    "latency_spike": {
        "condition": "p95_latency > 5000ms",
        "severity": "warning",
        "action": "consider_model_switch"
    }
}
```

---

## 9. Fallback & Circuit Breaker

### 9.1 Fallback Chain

```
Primary Model (e.g., GPT-4o)
    │
    ├── Timeout (10s) / Error / Rate Limited
    │
    ▼
Fallback 1 (e.g., Claude 3.5 Sonnet)
    │
    ├── Timeout / Error / Rate Limited
    │
    ▼
Fallback 2 (e.g., Gemini 1.5 Pro)
    │
    ├── Timeout / Error / Rate Limited
    │
    ▼
Emergency Fallback (e.g., GPT-4o-mini with enhanced prompt)
    │
    ├── All failed
    │
    ▼
Graceful Degradation (Return cached/template response + notify user)
```

### 9.2 Circuit Breaker Pattern

```python
class CircuitBreaker:
    """
    Prevent cascading failures when a provider is down.
    States: CLOSED (normal) → OPEN (blocked) → HALF_OPEN (testing)
    """
    
    THRESHOLDS = {
        "failure_count": 5,        # Open after 5 failures
        "failure_window": 60,      # Within 60 seconds
        "recovery_timeout": 30,    # Try again after 30s
        "success_threshold": 3,    # Close after 3 successes in half-open
    }
    
    states = {}  # Per-model circuit state
    
    async def call(self, model, request):
        state = self.get_state(model)
        
        if state == "OPEN":
            if self.recovery_timeout_elapsed(model):
                self.set_state(model, "HALF_OPEN")
            else:
                raise CircuitOpenException(f"{model} circuit is OPEN")
        
        try:
            response = await self.execute(model, request)
            self.record_success(model)
            
            if state == "HALF_OPEN" and self.success_count(model) >= 3:
                self.set_state(model, "CLOSED")
            
            return response
            
        except Exception as e:
            self.record_failure(model)
            
            if self.failure_count(model) >= 5:
                self.set_state(model, "OPEN")
            
            raise
```

---

## 10. Kế hoạch triển khai

### 10.1 Phase 1: Foundation (Tuần 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| Setup LLM Gateway cơ bản (single provider: OpenAI) | P0 | 3 days |
| Implement basic Router (static mapping) | P0 | 2 days |
| Token counting & cost tracking (DB schema) | P0 | 2 days |
| Provider adapter pattern (OpenAI) | P0 | 1 day |
| Basic error handling & retry | P1 | 1 day |
| Unit tests cho Gateway & Router | P1 | 1 day |

### 10.2 Phase 2: Multi-Provider (Tuần 3-4)

| Task | Priority | Effort |
|------|----------|--------|
| Anthropic provider adapter | P0 | 1 day |
| Google AI provider adapter | P0 | 1 day |
| Dynamic routing logic (complexity classifier) | P0 | 3 days |
| L1 In-memory cache | P1 | 1 day |
| L2 Redis exact-match cache | P1 | 2 days |
| Circuit breaker implementation | P1 | 2 days |
| Fallback chain | P1 | 1 day |

### 10.3 Phase 3: Optimization (Tuần 5-6)

| Task | Priority | Effort |
|------|----------|--------|
| L3 Semantic cache (pgvector) | P0 | 3 days |
| Prompt optimization engine | P1 | 2 days |
| Batch processing | P1 | 2 days |
| Budget management system | P0 | 2 days |
| Auto-downgrade khi gần hết budget | P1 | 1 day |
| Monitoring dashboard | P2 | 2 days |

### 10.4 Phase 4: Advanced (Tuần 7-8)

| Task | Priority | Effort |
|------|----------|--------|
| A/B testing framework cho models | P2 | 3 days |
| Quality feedback loop (user feedback → routing) | P1 | 2 days |
| Advanced analytics & reporting | P2 | 2 days |
| Alert system | P1 | 1 day |
| Load testing & performance optimization | P1 | 2 days |
| Documentation & runbook | P2 | 1 day |

### 10.5 Ước tính chi phí vận hành

#### Scenario: 1,000 users, 50 requests/user/day = 50,000 requests/day

| Không tối ưu | Có tối ưu | Tiết kiệm |
|--------------|-----------|------------|
| Tất cả dùng GPT-4o | Smart routing + caching | |
| ~$75/day | ~$18/day | **76% savings** |
| ~$2,250/month | ~$540/month | **$1,710/month** |

**Breakdown sau tối ưu:**
- 60% requests hit cache → $0 cost
- 25% requests dùng Tier 3 (Gemini Flash) → ~$1.5/day
- 10% requests dùng Tier 2 (GPT-4o-mini) → ~$4/day
- 5% requests dùng Tier 1 (GPT-4o) → ~$12.5/day

---

## Appendix A: Cấu hình mẫu

```yaml
# config/llm_routing.yaml

gateway:
  default_timeout: 10000  # ms
  max_retries: 3
  retry_delay: 1000  # ms

providers:
  openai:
    api_key: ${OPENAI_API_KEY}
    models:
      - gpt-4o
      - gpt-4o-mini
    rate_limit: 500  # requests/min
    
  anthropic:
    api_key: ${ANTHROPIC_API_KEY}
    models:
      - claude-3-5-sonnet-20241022
      - claude-3-5-haiku-20241022
    rate_limit: 300
    
  google:
    api_key: ${GOOGLE_AI_API_KEY}
    models:
      - gemini-1.5-pro
      - gemini-1.5-flash
      - gemini-2.0-flash
    rate_limit: 1000

routing:
  default_tier: "medium"
  enable_auto_downgrade: true
  budget_threshold_downgrade: 0.8  # 80% budget → downgrade

cache:
  l1:
    type: "memory"
    max_size: 1000
    ttl: 300  # 5 min
  l2:
    type: "redis"
    url: ${REDIS_URL}
    ttl: 3600  # 1 hour
  l3:
    type: "pgvector"
    connection: ${SUPABASE_DB_URL}
    similarity_threshold: 0.92
    ttl: 604800  # 7 days

monitoring:
  enable_cost_tracking: true
  alert_channels: ["email", "slack"]
  dashboard_refresh: 60  # seconds
```

## Appendix B: Sequence Diagram - Complete Request Flow

```
User                Orchestrator    LLM Router    Cache    LLM Gateway    Provider
 │                      │              │           │           │            │
 │  Generate MCQ        │              │           │           │            │
 │─────────────────────►│              │           │           │            │
 │                      │  Route(task) │           │           │            │
 │                      │─────────────►│           │           │            │
 │                      │              │ Check L1  │           │            │
 │                      │              │──────────►│           │            │
 │                      │              │  Miss     │           │            │
 │                      │              │◄──────────│           │            │
 │                      │              │ Check L2  │           │            │
 │                      │              │──────────►│           │            │
 │                      │              │  Miss     │           │            │
 │                      │              │◄──────────│           │            │
 │                      │              │                       │            │
 │                      │  Model: mini │                       │            │
 │                      │◄─────────────│                       │            │
 │                      │              │                       │            │
 │                      │  Call(prompt, model)                 │            │
 │                      │─────────────────────────────────────►│            │
 │                      │              │                       │ API Call   │
 │                      │              │                       │───────────►│
 │                      │              │                       │  Response  │
 │                      │              │                       │◄───────────│
 │                      │              │  Store cache          │            │
 │                      │              │◄──────────────────────│            │
 │                      │  Response    │                       │            │
 │                      │◄─────────────────────────────────────│            │
 │                      │  Log cost    │                       │            │
 │                      │──────────────────────────────────────►            │
 │  MCQ Result          │              │           │           │            │
 │◄─────────────────────│              │           │           │            │