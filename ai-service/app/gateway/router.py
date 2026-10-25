"""
LLM Router - Routes requests to appropriate models based on task and cost.
Prioritizes quality for high-stakes tasks, cost for high-volume tasks.
"""

from dataclasses import dataclass
from typing import Optional
import structlog

logger = structlog.get_logger()


@dataclass
class ModelConfig:
    """Configuration for an LLM model."""
    model: str
    tier: str  # "premium", "balanced", "economy"
    provider: str  # "deepseek", "google", "openai"
    input_cost_per_1m: float  # USD
    output_cost_per_1m: float  # USD
    max_tokens: int = 4096
    supports_vision: bool = False
    supports_structured: bool = True


# Model registry
MODELS: dict[str, ModelConfig] = {
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
    "gemini-3.8-flash": ModelConfig(
        model="gemini-3.8-flash",
        tier="economy",
        provider="google",
        input_cost_per_1m=0.075,
        output_cost_per_1m=0.30,
    ),
    "gemini-flash-latest": ModelConfig(
        model="gemini-flash-latest",
        tier="economy",
        provider="google",
        input_cost_per_1m=0.075,
        output_cost_per_1m=0.30,
    ),
}

# Agent → Task → Model mapping
AGENT_MODEL_MAPPING: dict[str, dict[str, str]] = {
    "question_generator": {
        "essay": "gemini-3.8-flash",
        "mcq": "gemini-3.8-flash",
        "true_false": "gemini-3.8-flash",
        "fill_blank": "gemini-3.8-flash",
        "matching": "gemini-3.8-flash",
        "short_answer": "gemini-3.8-flash",
        "default": "gemini-3.8-flash",
    },
    "verifier": {
        "math_verify": "gemini-3.8-flash",
        "logic_verify": "gemini-3.8-flash",
        "default": "gemini-3.8-flash",
    },
    "content_analyzer": {
        "bloom_classify": "gemini-3.8-flash",
        "topic_extract": "gemini-3.8-flash",
        "keyword_extract": "gemini-3.8-flash",
        "default": "gemini-3.8-flash",
    },
    "ocr": {
        "default": "gemini-3.8-flash",
    },
    "grading": {
        "essay_grade": "gemini-3.8-flash",
        "mcq_grade": "gemini-3.8-flash",
        "default": "gemini-3.8-flash",
    },
    "general": {
        "default": "gemini-3.8-flash",
    },
}

# Fallback chain
FALLBACK_CHAIN: dict[str, str] = {
    "deepseek-reasoner": "deepseek-chat",
    "deepseek-chat": "gemini-3.8-flash",
    "gemini-3.8-flash": "gemini-flash-latest",
    "gemini-flash-latest": "gemini-3.8-flash",
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
            ModelConfig for the chosen model
        """
        agent_mapping = AGENT_MODEL_MAPPING.get(agent_type, {})
        model_name = agent_mapping.get(task_type, agent_mapping.get("default", "gemini-3.8-flash"))

        return MODELS.get(model_name, MODELS["gemini-3.8-flash"])

    def get_fallback(self, current_model: str) -> Optional[str]:
        """Get the fallback model if the current one fails."""
        return FALLBACK_CHAIN.get(current_model)
