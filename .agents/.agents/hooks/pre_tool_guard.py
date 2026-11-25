import os, sys
hook_real = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "hooks", "pre_tool_guard.py"))
if os.path.exists(hook_real):
    with open(hook_real, "r", encoding="utf-8") as f:
        exec(f.read())
else:
    import json
    print(json.dumps({"decision": "allow"}))
