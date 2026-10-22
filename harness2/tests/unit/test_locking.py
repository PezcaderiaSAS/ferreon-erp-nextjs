import tempfile
from pathlib import Path
from harness2.locking import PlatformLock


def test_platform_lock_acquire_and_release():
    with tempfile.TemporaryDirectory() as tmp_dir:
        lock_path = Path(tmp_dir) / "test.lock"
        lock = PlatformLock(lock_path=lock_path, timeout=2.0)

        assert not lock_path.exists()
        with lock:
            assert lock_path.exists()

        assert not lock_path.exists()
