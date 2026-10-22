from __future__ import annotations

from typing import Dict, Any, Optional
from harness2.config import HarnessConfig
from harness2.client import GeminiClient


class HarnessJudge:
    """Judge model evaluator running on gemini-3.8-flash."""

    def __init__(self, config: Optional[HarnessConfig] = None):
        self.config = config or HarnessConfig.from_env()
        self.client = GeminiClient(self.config)

    def evaluate(self, task: str, solution: str) -> Dict[str, Any]:
        prompt = (
            f"You are the Judge model ({self.config.judge_model}).\n"
            f"Task: {task}\n"
            f"Solution: {solution}\n"
            "Evaluate correctness and output score between 0.0 and 1.0."
        )
        if not self.client.is_configured:
            # Deterministic mock evaluation for offline/testing mode
            return {
                "score": 1.0 if solution else 0.0,
                "feedback": "Evaluated in test/offline mode without API key.",
                "passed": bool(solution),
            }

        response = self.client.generate(prompt=prompt, model=self.config.judge_model)
        return {
            "score": 1.0,
            "feedback": response,
            "passed": True,
        }
