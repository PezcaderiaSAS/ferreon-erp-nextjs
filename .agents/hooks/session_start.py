#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
C://GHOST v3.0 Universal Hook: SessionStart (cghost-cockpit-boot)
Reporta rama Git y estado de STATUS.md al iniciar sesión.
"""
import json
import os
import subprocess
import sys

def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    
    branch = "sin-git"
    try:
        git_res = subprocess.check_output(
            ["git", "-C", repo_root, "branch", "--show-current"],
            stderr=subprocess.DEVNULL,
            text=True
        ).strip()
        if git_res:
            branch = git_res
    except Exception:
        pass

    status_path = os.path.join(repo_root, "STATUS.md")
    status_lines = 0
    if os.path.isfile(status_path):
        try:
            with open(status_path, "r", encoding="utf-8", errors="ignore") as f:
                status_lines = sum(1 for _ in f)
        except Exception:
            pass

    proj_name = os.path.basename(repo_root)
    msg = f"[C://GHOST v3.0 Boot] Proyecto={proj_name} | Branch={branch} | STATUS.md={status_lines}/100 líneas. Protocolo 0: lee STATUS.md antes de actuar."

    output = {
        "injectSteps": [
            {"systemMessage": {"systemMessage": msg}}
        ]
    }
    print(json.dumps(output))

if __name__ == "__main__":
    main()
