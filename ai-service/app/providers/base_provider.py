"""Base LLM Provider interface."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ChatMessage:
    """A single chat message."""
    role: str  # "system", "user", "assistant"
    content: str


@dataclass
class LLMRequest:
    """Request to an LLM provider."""
    messages: list[ChatMessage]
    model: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 4096
    top_p: float = 1.0
    response_format: Optional[dict] = None  # {"type": "json_object"}


@dataclass
class LLMResponse:
    """Response from an LLM provider."""
    content: str
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
    finish_reason: str = "stop"
    raw_response: Optional[dict] = None


class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    @abstractmethod
    async def generate(self, request: LLMRequest) -> LLMResponse:
        """Generate a response from the LLM."""
        pass

    @abstractmethod
    def calculate_cost(
        self, model: str, input_tokens: int, output_tokens: int
    ) -> float:
        """Calculate the cost of an API call."""
        pass