"""
LLM Router - Routes requests to the most cost-effective model.
"""

from dataclasses import dataclass
from typing import Optional
import structlog

logger = structlog.get_logger()


@dataclass
class ModelConfig:
    """Configuration for a selected model."""
    model: str
    tier: str  # "premium", "balanced", "economy"
    provider: str
    input_cost_per_1m: float  # $/1M tokens
    output_cost_per_1m: float


# Model registry with pricing
MODEL_REGISTRY: dict[str, ModelConfig] = {
    # Premium tier
    "deepseek-reasoner": ModelConfig(
        model="deepseek-reasoner",
        tier="premium",
        provider="deepseek",
        input_cost_per_1m=0.55,
        output_cost_per_1m=2.19,
    ),
    # Balanced tier
    "deepseek-chat": ModelConfig(
        model="deepseek-chat",
        tier="balanced",
        provider="deepseek",
        input_cost_per_1m=0.27,
        output_cost_per_1m=1.10,
    ),
    # Economy tier
    "gemini-1.5-flash": ModelConfig(
        model="gemini-1.5-flash",
        tier="economy",
        provider="google",
        input_cost_per_1m=0.075,
        output_cost_per_1m=0.30,
    ),
    "gemini-2.0-flash": ModelConfig(
        model="gemini-2.0-flash",
        tier="economy",
        provider="google",
        input_cost_per_1m=0.10,
        output_cost_per_1m=0.40,
    ),
}

# Agent → Task → Model mapping
AGENT_MODEL_MAPPING: dict[str, dict[str, str]] = {
    "question_generator": {
        "essay": "gemini-1.5-flash",
        "mcq": "gemini-1.5-flash",
        "true_false": "gemini-1.5-flash",
        "fill_blank": "gemini-1.5-flash",
        "matching": "gemini-1.5-flash",
        "short_answer": "gemini-1.5-flash",
        "default": "gemini-1.5-flash",
    },
    "verifier": {
        "math_verify": "gemini-1.5-flash",
        "logic_verify": "gemini-1.5-flash",
        "default": "gemini-1.5-flash",
    },
    "content_analyzer": {
        "bloom_classify": "gemini-1.5-flash",
        "topic_extract": "gemini-1.5-flash",
        "keyword_extract": "gemini-1.5-flash",
        "default": "gemini-1.5-flash",
    },
    "ocr": {
        "default": "gemini-1.5-flash",
    },
    "grading": {
        "essay_grade": "deepseek-reasoner",
        "mcq_grade": "gemini-1.5-flash",
        "default": "deepseek-chat",
    },
    "general": {
        "default": "deepseek-chat",
    },
}

# Fallback chain
FALLBACK_CHAIN: dict[str, str] = {
    "deepseek-reasoner": "deepseek-chat",
    "deepseek-chat": "gemini-1.5-flash",
    "gemini-1.5-flash": "gemini-2.0-flash",
    "gemini-2.0-flash": "deepseek-chat",
}


class LLMRouter:
    """Routes LLM requests to the most cost-effective model."""

    def route(self, agent_type: str, task_type: str) -> ModelConfig:
        """
        Route a request to the appropriate model.

        Args:
            agent_type: The type of agent (e.g., "question_generator")
            task_type: The specific task (e.g., "mcq", "essay")

        Returns:
            ModelConfig with the selected model details
        """
        # Look up in agent mapping
        agent_mapping = AGENT_MODEL_MAPPING.get(agent_type, {})
        model_name = agent_mapping.get(task_type) or agent_mapping.get("default")

        if not model_name:
            model_name = "deepseek-chat"  # Global default
            logger.warning(
                "No mapping found, using default",
                agent=agent_type,
                task=task_type,
                model=model_name,
            )

        config = MODEL_REGISTRY.get(model_name)
        if not config:
            raise ValueError(f"Model '{model_name}' not found in registry")

        return config

    def get_fallback(self, model: str) -> Optional[str]:
        """Get fallback model for a given model."""
        return FALLBACK_CHAIN.get(model)

    def estimate_cost(
        self, model: str, input_tokens: int, output_tokens: int
    ) -> float:
        """Estimate cost for a request."""
        config = MODEL_REGISTRY.get(model)
        if not config:
            return 0.0

        input_cost = (input_tokens / 1_000_000) * config.input_cost_per_1m
        output_cost = (output_tokens / 1_000_000) * config.output_cost_per_1m
        return input_cost + output_cost