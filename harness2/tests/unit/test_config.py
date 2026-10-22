from pathlib import Path
from harness2.config import HarnessConfig


def test_default_config_parameters():
    config = HarnessConfig()
    assert config.model_provider == "google_ai_studio"
    assert config.primary_model_id == "gemini-3.8-flash"
    assert config.ide_agent_model_id == "antigravity-preview-09-2026"
    assert config.default_mode == "sequential"
    assert config.default_k == 1
    assert config.default_max_tasks == 1


def test_normalized_runs_dir():
    config = HarnessConfig(runs_dir=Path("runs/test"))
    normalized = config.normalized_runs_dir
    assert isinstance(normalized, str)
    assert "\\" not in normalized
    assert normalized.endswith("runs/test")
