from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from harness2.config import HarnessConfig
from harness2.locking import PlatformLock
from harness2.judge import HarnessJudge


class HarnessRunner:
    """Runner for Harness² executing agent benchmarks and tasks sequentially."""

    def __init__(self, config: Optional[HarnessConfig] = None):
        self.config = config or HarnessConfig.from_env()
        self.judge = HarnessJudge(self.config)
        self.runs_dir = Path(self.config.normalized_runs_dir)
        self.runs_dir.mkdir(parents=True, exist_ok=True)
        self.lock = PlatformLock(self.runs_dir / "runner.lock")

    def run_task(self, task_id: str, prompt: str) -> Dict[str, Any]:
        """Execute a single task with sequential locking to prevent 429 Too Many Requests."""
        with self.lock:
            start_time = time.time()
            task_run_dir = self.runs_dir / task_id
            task_run_dir.mkdir(parents=True, exist_ok=True)

            # Simulated solution or agent execution step
            solution = f"Executed task {task_id} with prompt: {prompt}"
            eval_result = self.judge.evaluate(task=prompt, solution=solution)

            elapsed = time.time() - start_time
            record = {
                "task_id": task_id,
                "prompt": prompt,
                "solver_model": self.config.solver_model,
                "judge_model": self.config.judge_model,
                "solution": solution,
                "evaluation": eval_result,
                "elapsed_seconds": elapsed,
                "timestamp": time.time(),
            }

            log_file = task_run_dir / "run_result.json"
            with open(log_file, "w", encoding="utf-8") as f:
                json.dump(record, f, indent=2)

            return record

    def run_batch(self, tasks: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Run tasks sequentially according to mode=sequential, k=1, max_tasks=1."""
        results = []
        for task in tasks:
            task_id = task.get("id", f"task_{int(time.time()*1000)}")
            prompt = task.get("prompt", "")
            res = self.run_task(task_id, prompt)
            results.append(res)
        return results
