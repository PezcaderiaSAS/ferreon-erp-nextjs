"""Harness² - Self-improving AI agent execution framework."""

__version__ = "0.1.0"
__all__ = ["HarnessConfig", "HarnessRunner", "PlatformLock"]

from harness2.config import HarnessConfig
from harness2.locking import PlatformLock
from harness2.runner import HarnessRunner
