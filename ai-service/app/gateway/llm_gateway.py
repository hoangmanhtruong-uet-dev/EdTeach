"""
LLM Gateway - Central proxy for all LLM API calls.
Handles routing, caching, rate limiting, cost tracking.
"""

import time
import hashlib
import json
import structlog
from typing import Optional
from dataclasses import dataclass, field

from app.core.config import settings
from app.gateway.router import LLMRouter, ModelConfig
from app.providers.base_provider import BaseLLMProvider, LLMRequest, LLMResponse
from app.providers.deepseek_provider import DeepSeekProvider
from app.providers.google_provider import GoogleProvider

logger = structlog.get_logger()


@dataclass
class GatewayMetrics:
    """Track gateway performance metrics."""
    total_requests: int = 0
    cache_hits: int = 0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cost_usd: float = 0.0
    errors: int = 0


class LLMGateway:
    """
    Central gateway for all LLM interactions.
    Routes requests to appropriate models based on task complexity.
    """

    def __init__(self):
        self.router = LLMRouter()
        self.providers: dict[str, BaseLLMProvider] = {}
        self.metrics = GatewayMetrics()
        self._cache: dict[str, LLMResponse] = {}  # Simple in-memory cache (L1)
        self._init_providers()

    def _init_providers(self):
        """Initialize available LLM providers."""
        if settings.DEEPSEEK_API_KEY:
            self.providers["deepseek"] = DeepSeekProvider(
                api_key=settings.DEEPSEEK_API_KEY
            )
            logger.info("DeepSeek provider initialized")

        if settings.GOOGLE_AI_API_KEY:
            self.providers["google"] = GoogleProvider(
                api_key=settings.GOOGLE_AI_API_KEY
            )
            logger.info("Google AI provider initialized")

        if not self.providers:
            logger.warning("No LLM providers configured! Set API keys in .env")

    def _get_provider(self, model: str) -> BaseLLMProvider:
        """Get the provider for a given model."""
        if model.startswith("deepseek"):
            provider = self.providers.get("deepseek")
        elif model.startswith("gemini"):
            provider = self.providers.get("google")
        elif model.startswith("gpt"):
            provider = self.providers.get("openai")
        else:
            provider = None

        if provider is None:
            available = list(self.providers.keys())
            raise ValueError(
                f"No provider available for model '{model}'. "
                f"Available providers: {available}"
            )
        return provider

    def _generate_cache_key(self, request: LLMRequest) -> str:
        """Generate a cache key for the request."""
        content = json.dumps({
            "model": request.model,
            "messages": [m.dict() for m in request.messages] if hasattr(request.messages[0], 'dict') else request.messages,
            "temperature": request.temperature,
        }, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()

    async def generate(
        self,
        request: LLMRequest,
        agent_type: str = "general",
        task_type: str = "default",
        use_cache: bool = True,
    ) -> LLMResponse:
        """
        Main entry point for LLM generation.
        Routes to appropriate model, checks cache, tracks costs.
        """
        start_time = time.time()
        self.metrics.total_requests += 1

        # Step 1: Route to appropriate model if not specified
        if not request.model:
            config = self.router.route(agent_type, task_type)
            request.model = config.model
            logger.info(
                "Routed request",
                agent=agent_type,
                task=task_type,
                model=config.model,
                tier=config.tier,
            )

        # Step 2: Check cache
        if use_cache and request.temperature == 0:
            cache_key = self._generate_cache_key(request)
            cached = self._cache.get(cache_key)
            if cached:
                self.metrics.cache_hits += 1
                logger.info("Cache hit", model=request.model, agent=agent_type)
                return cached

        # Step 3: Get provider and call API
        provider = self._get_provider(request.model)

        try:
            response = await provider.generate(request)
        except Exception as e:
            self.metrics.errors += 1
            logger.error(
                "LLM call failed, trying fallback",
                model=request.model,
                error=str(e),
            )
            # Try fallback model
            fallback_model = self.router.get_fallback(request.model)
            if fallback_model:
                request.model = fallback_model
                provider = self._get_provider(fallback_model)
                response = await provider.generate(request)
            else:
                raise

        # Step 4: Update metrics
        elapsed_ms = int((time.time() - start_time) * 1000)
        self.metrics.total_input_tokens += response.input_tokens
        self.metrics.total_output_tokens += response.output_tokens
        self.metrics.total_cost_usd += response.cost_usd

        logger.info(
            "LLM call completed",
            model=request.model,
            input_tokens=response.input_tokens,
            output_tokens=response.output_tokens,
            cost_usd=f"${response.cost_usd:.6f}",
            latency_ms=elapsed_ms,
        )

        # Step 5: Store in cache
        if use_cache and request.temperature == 0:
            self._cache[cache_key] = response

        return response

    def get_metrics(self) -> dict:
        """Return current gateway metrics."""
        cache_hit_rate = (
            self.metrics.cache_hits / self.metrics.total_requests
            if self.metrics.total_requests > 0
            else 0
        )
        return {
            "total_requests": self.metrics.total_requests,
            "cache_hits": self.metrics.cache_hits,
            "cache_hit_rate": f"{cache_hit_rate:.2%}",
            "total_input_tokens": self.metrics.total_input_tokens,
            "total_output_tokens": self.metrics.total_output_tokens,
            "total_cost_usd": f"${self.metrics.total_cost_usd:.4f}",
            "errors": self.metrics.errors,
            "active_providers": list(self.providers.keys()),
        }


# Singleton instance
gateway = LLMGateway()