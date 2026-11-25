#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
C://GHOST v3.0 Universal Hook: Stop (cghost-stop-gate)
Control anti-bucle (continuationActive) + verificación de STATUS.md <= 100
líneas y limpieza de archivos sensibles en git staging.
"""
import json
import os
import re
import subprocess
import sys

def is_sensitive_path(path: str) -> bool:
    base = os.path.basename(path.strip().rstrip("/\\"))
    if base.endswith(".example") or base.endswith(".sample") or base.endswith(".template"):
        return False
    if ".secrets/" in path or path.startswith(".secrets/"):
        return True
    if base == ".env" or base.startswith(".env.") or base in (".dev.vars", "id_rsa", "id_ed25519"):
        return True
    if re.search(r"(credentials|service[-_]account).*\.json$", base, re.IGNORECASE):
        return True
    if re.search(r"\.(pem|key|p12|pfx)$", base, re.IGNORECASE):
        return True
    return False

def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    raw = ""
    try:
        if not sys.stdin.isatty():
            raw = sys.stdin.read()
    except Exception:
        pass

    try:
        data = json.loads(raw) if raw else {}
    except Exception:
        data = {}

    if data.get("continuationActive") is True or data.get("terminationReason", "NO_TOOL_CALL") != "NO_TOOL_CALL":
        print(json.dumps({"decision": "allow"}))
        return

    status_path = os.path.join(repo_root, "STATUS.md")
    if os.path.isfile(status_path):
        try:
            with open(status_path, "r", encoding="utf-8", errors="ignore") as f:
                line_count = sum(1 for _ in f)
            if line_count > 100:
                print(json.dumps({
                    "decision": "continue",
                    "reason": f"C://GHOST Protocolo 0/4: STATUS.md tiene {line_count} líneas (máximo permitido: 100). Compacta STATUS.md archivando tareas antiguas en CHANGELOG.md antes de cerrar."
                }))
                return
        except Exception:
            pass

    if os.path.isdir(os.path.join(repo_root, ".git")):
        try:
            staged = subprocess.check_output(
                ["git", "-C", repo_root, "diff", "--cached", "--name-only"],
                stderr=subprocess.DEVNULL,
                text=True
            )
            for line in staged.splitlines():
                if is_sensitive_path(line):
                    print(json.dumps({
                        "decision": "continue",
                        "reason": f"C://GHOST Zero-Trust (Protocolo 2): Retira del git staging el archivo sensible ({line}) antes de finalizar."
                    }))
                    return
        except Exception:
            pass

    print(json.dumps({"decision": "allow"}))

if __name__ == "__main__":
    main()
