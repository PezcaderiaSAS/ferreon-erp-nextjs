from __future__ import annotations

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field


class HarnessConfig(BaseModel):
    """Configuration settings for the Harness² framework."""

    model_provider: str = Field(default="google_ai_studio")
    primary_model_id: str = Field(default="gemini-3.8-flash")
    ide_agent_model_id: str = Field(default="antigravity-preview-09-2026")

    gemini_api_key: Optional[str] = Field(default=None)
    google_api_key: Optional[str] = Field(default=None)

    solver_model: str = Field(default="google/gemini-3.8-flash")
    improver_model: str = Field(default="google/gemini-3.8-flash")
    judge_model: str = Field(default="gemini-3.8-flash")
    ide_model: str = Field(default="antigravity-preview-09-2026")

    runs_dir: Path = Field(default_factory=lambda: Path("runs"))
    default_mode: str = Field(default="sequential")
    default_k: int = Field(default=1)
    default_max_tasks: int = Field(default=1)

    @property
    def normalized_runs_dir(self) -> str:
        """Returns the runs directory as a normalized POSIX path string."""
        return self.runs_dir.resolve().as_posix()

    @classmethod
    def from_env(cls, env_path: Optional[Path | str] = None) -> HarnessConfig:
        """Load configuration from environment or .env file."""
        if env_path:
            load_dotenv(dotenv_path=env_path, override=True)
        else:
            load_dotenv(override=False)

        runs_dir_raw = os.getenv("HARNESS2_RUNS_DIR", "runs/")
        runs_dir_path = Path(runs_dir_raw)

        return cls(
            model_provider=os.getenv("MODEL_PROVIDER", "google_ai_studio"),
            primary_model_id=os.getenv("PRIMARY_MODEL_ID", "gemini-3.8-flash"),
            ide_agent_model_id=os.getenv("IDE_AGENT_MODEL_ID", "antigravity-preview-09-2026"),
            gemini_api_key=os.getenv("GEMINI_API_KEY") or None,
            google_api_key=os.getenv("GOOGLE_API_KEY") or None,
            solver_model=os.getenv("HARNESS2_SOLVER_MODEL", "google/gemini-3.8-flash"),
            improver_model=os.getenv("HARNESS2_IMPROVER_MODEL", "google/gemini-3.8-flash"),
            judge_model=os.getenv("HARNESS2_JUDGE_MODEL", "gemini-3.8-flash"),
            ide_model=os.getenv("HARNESS2_IDE_MODEL", "antigravity-preview-09-2026"),
            runs_dir=runs_dir_path,
            default_mode=os.getenv("HARNESS2_DEFAULT_MODE", "sequential"),
            default_k=int(os.getenv("HARNESS2_DEFAULT_K", "1")),
            default_max_tasks=int(os.getenv("HARNESS2_DEFAULT_MAX_TASKS", "1")),
        )
