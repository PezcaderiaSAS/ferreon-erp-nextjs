#!/usr/bin/env bash
# ==============================================================================
# C://GHOST v3.0 Universal Hook: PreToolUse (zero-trust-and-commit-gate)
# Bloquea git add / git commit de archivos sensibles en cualquier proyecto.
# ==============================================================================
set -u

if [ -t 0 ]; then
  PAYLOAD="{}"
else
  PAYLOAD="$(cat 2>/dev/null || echo '{}')"
fi

PYTHON_BIN="python3"
if ! command -v python3 >/dev/null 2>&1; then
  if command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  fi
fi

"$PYTHON_BIN" -c '
import json, os, re, shlex, subprocess, sys

raw = sys.argv[1] if len(sys.argv) > 1 else "{}"
try:
    data = json.loads(raw)
except Exception:
    print(json.dumps({"decision": "allow"}))
    sys.exit(0)

tool_call = data.get("toolCall") or {}
if tool_call.get("name") != "run_command":
    print(json.dumps({"decision": "allow"}))
    sys.exit(0)

cmd = (tool_call.get("args") or {}).get("CommandLine", "") or ""
cwd = data.get("cwd") or "."

def is_sensitive_path(path: str) -> bool:
    p = path.strip().strip("\x27\"")
    if not p or p.startswith("-"):
        return False
    base = os.path.basename(p.rstrip("/"))
    if base.endswith(".example") or base.endswith(".sample") or base.endswith(".template"):
        return False
    if ".secrets/" in p or p.startswith(".secrets/") or base == ".secrets":
        return True
    if base == ".env" or base.startswith(".env."):
        return True
    if base in (".dev.vars", "id_rsa", "id_ed25519"):
        return True
    if re.search(r"(credentials|service[-_]account).*\.json$", base, re.IGNORECASE):
        return True
    if re.search(r"\.(pem|key|p12|pfx)$", base, re.IGNORECASE):
        return True
    return False

if re.search(r"\bgit\s+add\b", cmd):
    try:
        tokens = shlex.split(cmd)
    except Exception:
        tokens = cmd.split()
    for tok in tokens:
        if is_sensitive_path(tok):
            print(json.dumps({
                "decision": "deny",
                "reason": f"C://GHOST Zero-Trust (Protocolo 2): Prohibido agregar archivo sensible ({tok}) a Git."
            }))
            sys.exit(0)

if re.search(r"\bgit\s+commit\b", cmd):
    try:
        staged = subprocess.check_output(
            ["git", "-C", cwd, "diff", "--cached", "--name-only"],
            stderr=subprocess.DEVNULL,
            text=True
        )
        for line in staged.splitlines():
            if is_sensitive_path(line):
                print(json.dumps({
                    "decision": "deny",
                    "reason": f"C://GHOST Zero-Trust (Protocolos 2 y 7): Archivo sensible detectado en git staging ({line}). Retíralo con git reset antes de confirmar."
                }))
                sys.exit(0)
    except Exception:
        pass

print(json.dumps({"decision": "allow"}))
' "${PAYLOAD}"
