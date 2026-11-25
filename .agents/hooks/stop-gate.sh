#!/usr/bin/env bash
# ==============================================================================
# C://GHOST v3.0 Universal Hook: Stop (cghost-stop-gate)
# Control anti-bucle (continuationActive) + verificación de STATUS.md <= 100
# líneas y limpieza de archivos sensibles en git staging.
# ==============================================================================
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

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
import json, os, re, subprocess, sys

raw = sys.argv[1] if len(sys.argv) > 1 else "{}"
repo_root = sys.argv[2]

try:
    data = json.loads(raw)
except Exception:
    print(json.dumps({"decision": "allow"}))
    sys.exit(0)

if data.get("continuationActive") is True or data.get("terminationReason", "NO_TOOL_CALL") != "NO_TOOL_CALL":
    print(json.dumps({"decision": "allow"}))
    sys.exit(0)

status_path = os.path.join(repo_root, "STATUS.md")
if os.path.isfile(status_path):
    with open(status_path, "r", encoding="utf-8", errors="ignore") as f:
        line_count = sum(1 for _ in f)
    if line_count > 100:
        print(json.dumps({
            "decision": "continue",
            "reason": f"C://GHOST Protocolo 0/4: STATUS.md tiene {line_count} líneas (máximo permitido: 100). Compacta STATUS.md archivando tareas antiguas en CHANGELOG.md antes de cerrar."
        }))
        sys.exit(0)

def is_sensitive_path(path: str) -> bool:
    base = os.path.basename(path.strip())
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
                sys.exit(0)
    except Exception:
        pass

print(json.dumps({"decision": "allow"}))
' "${PAYLOAD}" "${REPO_ROOT}"
