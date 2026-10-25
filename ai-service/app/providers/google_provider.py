"""Google Gemini LLM Provider."""

import structlog
import google.generativeai as genai
from app.providers.base_provider import (
    BaseLLMProvider,
    LLMRequest,
    LLMResponse,
)

logger = structlog.get_logger()

# Gemini pricing (per 1M tokens)
GEMINI_PRICING = {
    "gemini-3.8-flash": {"input": 0.075, "output": 0.30},
    "gemini-flash-latest": {"input": 0.075, "output": 0.30},
    "gemini-3.5-flash": {"input": 0.075, "output": 0.30},
    "gemini-2.5-flash": {"input": 0.075, "output": 0.30},
    "gemini-1.5-flash": {"input": 0.075, "output": 0.30},
}


class GoogleProvider(BaseLLMProvider):
    """Google Gemini API provider."""

    def __init__(self, api_key: str):
        super().__init__(api_key)
        genai.configure(api_key=api_key)

    async def generate(self, request: LLMRequest) -> LLMResponse:
        model_name = request.model or "gemini-3.8-flash"

        # Convert messages to Gemini format
        system_prompt = None
        contents = []

        for msg in request.messages:
            if msg.role == "system":
                system_prompt = msg.content
            elif msg.role == "user":
                contents.append({"role": "user", "parts": [msg.content]})
            elif msg.role == "assistant":
                contents.append({"role": "model", "parts": [msg.content]})

        generation_config = genai.GenerationConfig(
            temperature=request.temperature,
            max_output_tokens=request.max_tokens,
            top_p=request.top_p,
        )

        if request.response_format and request.response_format.get("type") == "json_object":
            generation_config.response_mime_type = "application/json"

        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt,
            generation_config=generation_config,
        )

        response = await model.generate_content_async(contents)

        # Extract token counts
        input_tokens = 0
        output_tokens = 0
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            input_tokens = getattr(response.usage_metadata, "prompt_token_count", 0)
            output_tokens = getattr(response.usage_metadata, "candidates_token_count", 0)

        # Calculate cost
        cost = self.estimate_cost(
            model=model_name,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

        return LLMResponse(
            content=response.text,
            model=model_name,
            provider="google",
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=cost,
            finish_reason="stop",
        )

    def estimate_cost(
        self, model: str, input_tokens: int, output_tokens: int
    ) -> float:
        pricing = GEMINI_PRICING.get(model, GEMINI_PRICING["gemini-3.8-flash"])
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        return input_cost + output_cost
