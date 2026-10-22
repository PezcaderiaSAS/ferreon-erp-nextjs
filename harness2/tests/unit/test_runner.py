import json
import tempfile
from pathlib import Path
from harness2.config import HarnessConfig
from harness2.runner import HarnessRunner


def test_runner_executes_task_and_writes_log():
    with tempfile.TemporaryDirectory() as tmp_dir:
        config = HarnessConfig(runs_dir=Path(tmp_dir) / "runs")
        runner = HarnessRunner(config=config)

        result = runner.run_task(task_id="task_test_01", prompt="Evaluate UI performance")
        assert result["task_id"] == "task_test_01"
        assert result["evaluation"]["passed"] is True

        log_file = config.runs_dir / "task_test_01" / "run_result.json"
        assert log_file.exists()

        with open(log_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            assert data["task_id"] == "task_test_01"


def test_runner_batch_sequential():
    with tempfile.TemporaryDirectory() as tmp_dir:
        config = HarnessConfig(runs_dir=Path(tmp_dir) / "runs")
        runner = HarnessRunner(config=config)

        batch = [
            {"id": "task_a", "prompt": "Task A"},
            {"id": "task_b", "prompt": "Task B"},
        ]
        results = runner.run_batch(batch)
        assert len(results) == 2
        assert results[0]["task_id"] == "task_a"
        assert results[1]["task_id"] == "task_b"
