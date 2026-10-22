from __future__ import annotations

from typing import Any, Dict, Optional
from harness2.config import HarnessConfig


class GeminiClient:
    """Client for Google GenAI / Gemini 3.8 Flash and Antigravity harness."""

    def __init__(self, config: Optional[HarnessConfig] = None):
        self.config = config or HarnessConfig.from_env()
        self._client = None
        self._init_client()

    def _init_client(self) -> None:
        api_key = self.config.gemini_api_key or self.config.google_api_key
        if api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=api_key)
            except Exception:
                self._client = None
        else:
            self._client = None

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    def generate(self, prompt: str, model: Optional[str] = None) -> str:
        target_model = model or self.config.primary_model_id
        if not self.is_configured:
            return f"[Offline / Unconfigured Mode] Response for prompt with model {target_model}"

        response = self._client.models.generate_content(
            model=target_model,
            contents=prompt,
        )
        return response.text or ""
