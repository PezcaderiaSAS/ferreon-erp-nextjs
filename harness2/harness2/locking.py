from __future__ import annotations

import os
import sys
import time
from pathlib import Path
from typing import Optional


class PlatformLock:
    """Safe cross-platform file locking compatible with Windows and Linux without fcntl."""

    def __init__(self, lock_path: Path | str, timeout: float = 10.0, retry_interval: float = 0.05):
        self.lock_path = Path(lock_path)
        self.timeout = timeout
        self.retry_interval = retry_interval
        self._acquired = False

    @property
    def posix_path(self) -> str:
        return self.lock_path.resolve().as_posix()

    def acquire(self) -> bool:
        start_time = time.monotonic()
        self.lock_path.parent.mkdir(parents=True, exist_ok=True)

        while True:
            try:
                # O_CREAT | O_EXCL is atomic across Windows (Win32) and POSIX
                fd = os.open(str(self.lock_path), os.O_CREAT | os.O_EXCL | os.O_RDWR)
                with os.fdopen(fd, "w") as f:
                    f.write(f"pid={os.getpid()}\ntime={time.time()}\n")
                self._acquired = True
                return True
            except FileExistsError:
                if time.monotonic() - start_time >= self.timeout:
                    raise TimeoutError(f"Could not acquire lock on {self.posix_path} within {self.timeout}s")
                time.sleep(self.retry_interval)

    def release(self) -> None:
        if self._acquired and self.lock_path.exists():
            try:
                os.remove(str(self.lock_path))
            except OSError:
                pass
            finally:
                self._acquired = False

    def __enter__(self) -> PlatformLock:
        self.acquire()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.release()
