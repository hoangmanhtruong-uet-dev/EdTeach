"""DeepSeek LLM Provider."""

import httpx
import structlog
from app.providers.base_provider import (
    BaseLLMProvider,
    LLMRequest,
    LLMResponse,
    ChatMessage,
)

logger = structlog.get_logger()

# DeepSeek pricing (per 1M tokens)
DEEPSEEK_PRICING = {
    "deepseek-chat": {"input": 0.27, "output": 1.10},
    "deepseek-reasoner": {"input": 0.55, "output": 2.19},
}


class DeepSeekProvider(BaseLLMProvider):
    """DeepSeek API provider (OpenAI-compatible)."""

    BASE_URL = "https://api.deepseek.com/v1"

    async def generate(self, request: LLMRequest) -> LLMResponse:
        model = request.model or "deepseek-chat"

        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in request.messages
        ]

        payload = {
            "model": model,
            "messages": messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "top_p": request.top_p,
        }

        if request.response_format:
            payload["response_format"] = request.response_format

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.BASE_URL}/chat/completions",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()

        choice = data["choices"][0]
        usage = data["usage"]

        input_tokens = usage.get("prompt_tokens", 0)
        output_tokens = usage.get("completion_tokens", 0)

        return LLMResponse(
            content=choice["message"]["content"],
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=self.calculate_cost(model, input_tokens, output_tokens),
            finish_reason=choice.get("finish_reason", "stop"),
            raw_response=data,
        )

    def calculate_cost(
        self, model: str, input_tokens: int, output_tokens: int
    ) -> float:
        pricing = DEEPSEEK_PRICING.get(model, DEEPSEEK_PRICING["deepseek-chat"])
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        return input_cost + output_cost