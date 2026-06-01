"""Setup routes: status, profiles, resources, clear, toggle, instance, exec-log, exec, test."""
from __future__ import annotations

import asyncio
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse

from brickforge import PROJECT_ROOT, PACKAGE_ROOT
from brickforge.lib.sse import sse_line, sse_done, ExecLogger, stream_subprocess

# Python executable -- use the same interpreter running the server
PYTHON = sys.executable

router = APIRouter()

STEP_ENV_KEYS: dict[str, list[str]] = {
    "host":      ["DATABRICKS_HOST", "DATABRICKS_TOKEN"],
    "warehouse": ["DATABRICKS_WAREHOUSE_ID"],
    "schema":    ["PROJECT_UNITY_CATALOG_SCHEMA"],
    "tables":    [],
    "functions": [],
    "model":     ["AGENT_MODEL_ENDPOINT"],
    "prompt":    [],
    "genie":     [],
    "ka":        [],
    "vs":        ["PROJECT_VS_INDEX"],
    "mcp":       [],
    "api":       [],
    "a2a":       [],
    "features":  [],
    "lakebase":  ["LAKEBASE_INSTANCE_NAME"],
    "mlflow":    ["MLFLOW_EXPERIMENT_ID"],
    "grants":    [],
    "deploy":    ["DBX_APP_NAME"],
    "git":       [],
}

MULTI_INSTANCE_PREFIXES = {
    "genie": "PROJECT_GENIE_",
    "ka": "PROJECT_KA_",
    "vs": "PROJECT_VS_",
    "mcp": "PROJECT_MCP_",
    "a2a": "PROJECT_A2A_",
    "api": "PROJECT_API_",
    "features": "PROJECT_TOOL_",
}


def _get_config():
    """Get the config provider from the server module."""
    from brickforge.server import config
    return config


def _get_forge_mode():
    from brickforge.server import FORGE_MODE
    return FORGE_MODE


# ── Status ────────────────────────────────────────────────────────────────────

@router.get("/api/setup/status")
async def setup_status():
    config = _get_config()
    try:
        entries = config.list()
        env = {e["key"]: e["value"] for e in entries}
        steps: dict = {}

        for step, keys in STEP_ENV_KEYS.items():
            all_set = len(keys) > 0 and all(env.get(k, "").strip() for k in keys)
            status = "unknown" if len(keys) == 0 else ("configured" if all_set else "missing")
            values = {k: env.get(k, "") for k in keys}

            # Model: same-workspace mode
            if step == "model" and not all_set and env.get("DATABRICKS_HOST", "").strip():
                status = "configured"
                values["AGENT_MODEL_ENDPOINT"] = env["DATABRICKS_HOST"].rstrip("/") + " (same workspace)"

            # Tables: count CSVs from all sources (default, gen, uploaded)
            if step == "tables":
                csv_count = 0
                for d in [PACKAGE_ROOT / "data" / "default" / "csv", PACKAGE_ROOT / "data" / "gen" / "csv", PROJECT_ROOT / "data" / "upload" / "csv"]:
                    try:
                        csv_count += len([f for f in d.iterdir() if f.suffix == ".csv"])
                    except FileNotFoundError:
                        pass
                status = "configured" if csv_count > 0 else "missing"
                values = {"TABLE_COUNT": str(csv_count)}

            # Functions: count SQL files
            if step == "functions":
                routine_count = 0
                for sub in ["func", "proc"]:
                    for base in ["data/default", "data/gen"]:
                        d = PROJECT_ROOT / base / sub
                        try:
                            routine_count += len([f for f in d.iterdir() if f.suffix == ".sql"])
                        except FileNotFoundError:
                            pass
                status = "configured" if routine_count > 0 else "missing"
                values = {"ROUTINE_COUNT": str(routine_count)}

            # Prompt: file-based
            if step == "prompt":
                prompt_dir = PACKAGE_ROOT / "conf" / "prompt"
                main_exists = (prompt_dir / "main.prompt").exists()
                status = "configured" if main_exists else "missing"
                try:
                    files = [f.name for f in prompt_dir.iterdir() if not f.name.startswith(".")]
                except FileNotFoundError:
                    files = []
                values = {"PROMPT_FILES": ", ".join(files)}

            # Multi-instance steps
            if step in MULTI_INSTANCE_PREFIXES:
                prefix = MULTI_INSTANCE_PREFIXES[step]
                instances = config.list_by_prefix(prefix)

                if step == "vs":
                    instances = [i for i in instances if "INDEX" in i["key"]]
                elif step == "mcp" or step == "a2a":
                    instances = [i for i in instances if not i["key"].endswith("_HEADER")]
                    values = {}
                elif step == "api":
                    api_instances = [i for i in instances if i["key"].endswith("_CONN") or i["key"].endswith("_URL")]
                    for i in api_instances:
                        slug = i["key"].replace("PROJECT_API_", "").replace("_CONN", "").replace("_URL", "").lower()
                        suffix = " (uc)" if i["key"].endswith("_CONN") else " (http)"
                        i["label"] = slug + suffix
                    instances = api_instances
                    values = {}

                has_enabled = any(i["enabled"] for i in instances)
                status = "configured" if has_enabled else "missing"
                steps[step] = {"status": status, "values": values, "instances": instances}
                continue

            steps[step] = {"status": status, "values": values}

        return {"steps": steps, "env": env, "forgeMode": _get_forge_mode()}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ── Clear Step ────────────────────────────────────────────────────────────────

@router.post("/api/setup/clear-step")
async def clear_step(request: Request):
    config = _get_config()
    body = await request.json()
    step = body.get("step")
    if not step or step not in STEP_ENV_KEYS:
        return JSONResponse({"error": "invalid step"}, status_code=400)

    keys = STEP_ENV_KEYS[step]
    if keys:
        config.disable_many(keys)
        for k in keys:
            os.environ.pop(k, None)

    prefix = MULTI_INSTANCE_PREFIXES.get(step)
    if prefix:
        instances = config.list_by_prefix(prefix)
        instance_keys = [i["key"] for i in instances]
        if instance_keys:
            config.disable_many(instance_keys)
            for k in instance_keys:
                os.environ.pop(k, None)

    return {"ok": True}


# ── Toggle ────────────────────────────────────────────────────────────────────

@router.put("/api/setup/toggle")
async def toggle_key(request: Request):
    config = _get_config()
    body = await request.json()
    key = body.get("key", "")
    allowed_prefixes = ("PROJECT_GENIE_", "PROJECT_KA_", "PROJECT_VS_", "PROJECT_MCP_", "PROJECT_API_", "PROJECT_A2A_", "PROJECT_TOOL_")
    if not any(key.startswith(p) for p in allowed_prefixes):
        return JSONResponse({"error": "not a toggleable key"}, status_code=400)
    result = config.toggle(key)
    return {"ok": result}


# ── Delete Instance ───────────────────────────────────────────────────────────

@router.delete("/api/setup/instance")
async def delete_instance(request: Request):
    config = _get_config()
    body = await request.json()
    key = body.get("key", "")
    if not key:
        return JSONResponse({"error": "key required"}, status_code=400)
    config.delete_key(key)
    # Also delete suffix keys (e.g., _HEADER, _METHOD, _PATH, _DESC)
    for suffix in ["_HEADER", "_METHOD", "_PATH", "_DESC", "_PARAMS"]:
        config.delete_key(key + suffix)
    return {"ok": True}


# ── Exec Log ──────────────────────────────────────────────────────────────────

@router.get("/api/setup/exec-log")
async def exec_log(action: str = ""):
    if not action:
        return JSONResponse({"error": "action param required"}, status_code=400)
    log_dir = PROJECT_ROOT / "logs" / "exec"
    latest = log_dir / f"{action}-latest.log"
    try:
        content = latest.read_text()
        return {"action": action, "log": content, "lines": [l for l in content.split("\n") if l]}
    except FileNotFoundError:
        return {"action": action, "log": "", "lines": []}


# ── Profiles ──────────────────────────────────────────────────────────────────

@router.get("/api/setup/profiles")
async def list_profiles():
    try:
        result = subprocess.run(
            ["databricks", "auth", "profiles"],
            capture_output=True, text=True, timeout=10,
            cwd=str(PACKAGE_ROOT),
        )
        items = []
        for line in result.stdout.strip().split("\n"):
            parts = line.split()
            if len(parts) >= 3:
                name = parts[0]
                host = parts[1]
                valid = parts[2].upper() == "YES"
                if host.startswith("http"):
                    items.append({"name": name, "host": host, "valid": valid})
        return {"items": items}
    except Exception as e:
        return {"items": [], "error": str(e)}


# ── Resources ─────────────────────────────────────────────────────────────────

@router.get("/api/setup/resources")
async def list_resources(type: str = ""):
    from brickforge.lib.env_utils import check_token_expiry, build_sub_env
    config = _get_config()

    expiry_err = check_token_expiry(config)
    if expiry_err:
        return {"items": [], "error": expiry_err}

    scripts = {
        "warehouses": """
from databricks.sdk import WorkspaceClient; import json
w = WorkspaceClient()
out = [{'id': wh.id, 'name': wh.name, 'state': str(wh.state).split('.')[-1]} for wh in w.warehouses.list()]
print(json.dumps(out))
""",
        "catalogs": """
from databricks.sdk import WorkspaceClient; import json
w = WorkspaceClient()
out = [c.name for c in w.catalogs.list() if c.name]
print(json.dumps(out))
""",
        "genie": """
from databricks.sdk import WorkspaceClient; import json
w = WorkspaceClient()
try:
  r = w.genie.list_spaces()
  spaces = getattr(r, 'spaces', []) or []
except: spaces = []
out = [{'id': getattr(s,'space_id',''), 'name': getattr(s,'title','')} for s in spaces]
print(json.dumps(out))
""",
        "lakebase": """
from databricks.sdk import WorkspaceClient; import json
try:
  w = WorkspaceClient()
  instances = list(w.database.list_database_instances())
  out = [{'id': getattr(i,'name',''), 'name': getattr(i,'name',''), 'state': str(getattr(i,'state','UNKNOWN'))} for i in instances]
  print(json.dumps(out))
except Exception: print('[]')
""",
    }

    script = scripts.get(type)
    if not script:
        return JSONResponse({"error": f"unknown type: {type}"}, status_code=400)

    try:
        env = build_sub_env(config)
        result = subprocess.run(
            [PYTHON,"-c", script.strip()],
            capture_output=True, text=True, timeout=20,
            cwd=str(PACKAGE_ROOT), env=env,
        )
        if result.returncode != 0:
            from brickforge.lib.env_utils import parse_subprocess_error; return {"items": [], "error": parse_subprocess_error(result.stderr, result.stdout)}
        items = json.loads(result.stdout.strip())
        return {"items": items}
    except Exception as e:
        return {"items": [], "error": str(e)}


# ── My IP ─────────────────────────────────────────────────────────────────────

@router.get("/api/setup/my-ip")
async def my_ip():
    """Return the server's public IP (for IP ACL whitelisting)."""
    try:
        import urllib.request
        ip = urllib.request.urlopen("https://api.ipify.org", timeout=5).read().decode().strip()
        return {"ip": ip}
    except Exception as e:
        return {"ip": None, "error": str(e)}


# ── Test ──────────────────────────────────────────────────────────────────────

TEST_SCRIPTS: dict[str, str] = {
    "host": """
import os, urllib.request, json, ssl
host = os.environ.get('DATABRICKS_HOST','').strip().rstrip('/')
token = os.environ.get('DATABRICKS_TOKEN','').strip()
if not host: print('[x] DATABRICKS_HOST not set'); exit(1)
ctx = ssl.create_default_context()
try:
    req = urllib.request.Request(host + '/oidc/.well-known/oauth-authorization-server')
    with urllib.request.urlopen(req, timeout=8, context=ctx) as r: json.loads(r.read())
except urllib.error.HTTPError as e:
    if e.code >= 500: print('[x] host unreachable: HTTP ' + str(e.code)); exit(1)
except Exception as e:
    print('[x] host unreachable: ' + str(e)[:100]); exit(1)
if not token:
    print('[+] reachable — ' + host.replace('https://','') + ' (no token set)'); exit(0)
try:
    req = urllib.request.Request(host + '/api/2.0/preview/scim/v2/Me', headers={'Authorization': 'Bearer ' + token})
    with urllib.request.urlopen(req, timeout=8, context=ctx) as r:
        d = json.loads(r.read()); print('[+] reachable — ' + d.get('userName', '?'))
except urllib.error.HTTPError as e:
    if e.code == 401: print('[x] token invalid (401 Unauthorized)'); exit(1)
    elif e.code == 403: print('[+] reachable — token valid (SCIM restricted)')
    else: print('[x] host reachable but auth failed: HTTP ' + str(e.code)); exit(1)
except Exception as e:
    print('[x] host reachable but auth failed: ' + str(e)[:100]); exit(1)
""".strip(),
    "warehouse": """
from databricks.sdk import WorkspaceClient; import os
wh_id = os.environ.get('DATABRICKS_WAREHOUSE_ID','').strip()
if not wh_id: print('[x] DATABRICKS_WAREHOUSE_ID not set'); exit(1)
w = WorkspaceClient()
try:
    wh = w.warehouses.get(wh_id); state = str(wh.state).split('.')[-1]
    print('[+] reachable — ' + wh.name + ' (' + state + ')')
except Exception as e:
    msg = str(e)[:150]
    if 'does not exist' in msg or '404' in msg or 'not found' in msg.lower():
        print('[x] warehouse not found in this workspace')
    else: print('[x] ' + msg)
    exit(1)
""".strip(),
    "schema": """
from databricks.sdk import WorkspaceClient; import os
spec = os.environ.get('PROJECT_UNITY_CATALOG_SCHEMA','').strip()
if not spec: print('[x] PROJECT_UNITY_CATALOG_SCHEMA not set'); exit(1)
w = WorkspaceClient()
try:
    s = w.schemas.get(full_name=spec); print('[+] found — ' + (s.full_name or spec))
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
""".strip(),
    "model": """
import os, urllib.request, json, ssl, time
endpoint = os.environ.get('AGENT_MODEL_ENDPOINT','').strip()
host = os.environ.get('DATABRICKS_HOST','').strip().rstrip('/')
if not endpoint: endpoint = host + '/serving-endpoints/databricks-claude-sonnet-4-6/invocations'
token = (os.environ.get('AGENT_MODEL_TOKEN','') or os.environ.get('DATABRICKS_TOKEN','')).strip()
if not token: print('[x] no token'); exit(1)
payload = json.dumps({'messages': [{'role': 'user', 'content': 'Reply with exactly: pong'}], 'max_tokens': 10}).encode()
ctx = ssl.create_default_context()
try:
    t0 = time.time()
    req = urllib.request.Request(endpoint, data=payload, headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=25, context=ctx) as r:
        d = json.loads(r.read()); ms = int((time.time() - t0) * 1000)
        model = d.get('model','?'); reply = (d.get('choices',[{}])[0].get('message',{}).get('content','') or '').strip()[:40]
        print('[+] ' + model + ' — ' + str(ms) + 'ms — "' + reply + '"')
except urllib.error.HTTPError as e:
    print('[x] HTTP ' + str(e.code) + ' — ' + e.read().decode()[:120]); exit(1)
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
""".strip(),
    "mlflow": """
from databricks.sdk import WorkspaceClient; import os
eid = os.environ.get('MLFLOW_EXPERIMENT_ID','').strip()
if not eid: print('[x] MLFLOW_EXPERIMENT_ID not set'); exit(1)
w = WorkspaceClient()
try:
    exp = w.experiments.get_experiment(experiment_id=eid); print('[+] found — ' + getattr(exp, 'name', eid))
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
""".strip(),
    "lakebase": """
from databricks.sdk import WorkspaceClient; import os
name = os.environ.get('LAKEBASE_INSTANCE_NAME','').strip()
if not name: print('[x] LAKEBASE_INSTANCE_NAME not set'); exit(1)
w = WorkspaceClient()
try:
    inst = w.database.get_database_instance(name=name)
    state = str(getattr(inst, 'state', 'UNKNOWN')).upper()
    if 'AVAILABLE' in state or 'ACTIVE' in state: print('[+] available — ' + name)
    else: print('[x] ' + name + ' — ' + state); exit(1)
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
""".strip(),
    "deploy": """
from databricks.sdk import WorkspaceClient; import os
app_name = os.environ.get('DBX_APP_NAME', '').strip()
if not app_name: print('[x] DBX_APP_NAME not set'); exit(1)
w = WorkspaceClient()
try:
    app = w.apps.get(app_name)
    status = str(getattr(getattr(app, 'app_status', None), 'state', 'UNKNOWN'))
    url = getattr(app, 'url', '') or ''
    if 'RUNNING' in status: print('[+] running — ' + (url or app_name))
    elif 'STARTING' in status or 'PENDING' in status: print('[+] deploying — ' + status.lower())
    else: print('[x] ' + app_name + ' — ' + status); exit(1)
except Exception as e:
    err = str(e)[:100]
    if 'not found' in err.lower() or '404' in err: print('[x] app not found — deploy first')
    else: print('[x] ' + err)
    exit(1)
""".strip(),
    "tables": """
from databricks.sdk import WorkspaceClient; import os
from pathlib import Path
spec = os.environ.get('PROJECT_UNITY_CATALOG_SCHEMA','').strip()
if not spec: print('[x] schema not set'); exit(1)
root = Path('.')
csvs = []
for d in [root / 'data' / 'default' / 'csv', root / 'data' / 'gen' / 'csv', root / 'data' / 'upload' / 'csv']:
    if d.exists(): csvs.extend(d.glob('*.csv'))
if not csvs:
    # No CSVs but schema may still have tables (connect-existing mode)
    w = WorkspaceClient()
    try:
        tbls = list(w.tables.list(catalog_name=spec.split('.')[0], schema_name=spec.split('.')[1]))
        if tbls: print(f'[+] {len(tbls)} table(s) exist in {spec}'); exit(0)
    except Exception as e:
        print(f'[~] could not list tables: {e}')
    print('[x] no CSVs found and no tables in schema'); exit(1)
w = WorkspaceClient()
found = 0
for csv in csvs:
    tn = csv.stem.replace('-','_')
    try: w.tables.get(f'{spec}.{tn}'); found += 1
    except: pass
print(f'[+] {found}/{len(csvs)} table(s) exist in {spec}')
""".strip(),
    "functions": """
import os, re
from pathlib import Path
spec = os.environ.get('PROJECT_UNITY_CATALOG_SCHEMA','').strip()
if not spec: print('[x] schema not set'); exit(1)
root = Path('.')
func_count = proc_count = 0
for base in ['data/default', 'data/gen']:
    fd = root / base / 'func'; pd = root / base / 'proc'
    if fd.exists(): func_count += len([f for f in fd.glob('*.sql') if re.search(r'CREATE', f.read_text(), re.I)])
    if pd.exists(): proc_count += len(list(pd.glob('*.sql')))
total = func_count + proc_count
if total == 0: print('[x] no function/procedure SQL files found'); exit(1)
print(f'[+] {func_count} function(s) + {proc_count} procedure(s) ready in {spec}')
""".strip(),
}


@router.get("/api/setup/test")
async def setup_test(step: str = "", key: str = ""):
    from brickforge.lib.env_utils import check_token_expiry, build_sub_env
    config = _get_config()

    # Token expiry check (host test handles partial)
    if step != "host":
        expiry_err = check_token_expiry(config)
        if expiry_err:
            return {"ok": False, "message": expiry_err}

    # Dynamic test scripts for genie/ka per-instance
    script = TEST_SCRIPTS.get(step)

    if step == "genie":
        instances = config.list_by_prefix("PROJECT_GENIE_")
        first_active = next((i for i in instances if i["enabled"]), None)
        env_key = key or (first_active["key"] if first_active else "PROJECT_GENIE_DEFAULT")
        script = f"""
from databricks.sdk import WorkspaceClient; import os
sid = os.environ.get('{env_key}','').strip()
if not sid: print('[x] {env_key} not set'); exit(1)
w = WorkspaceClient()
try:
    sp = w.genie.get_space(space_id=sid); print('[+] found — ' + getattr(sp, 'title', sid))
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
""".strip()

    elif step == "ka":
        instances = config.list_by_prefix("PROJECT_KA_")
        first_active = next((i for i in instances if i["enabled"]), None)
        env_key = key or (first_active["key"] if first_active else "PROJECT_KA_DEFAULT")
        script = f"""
from databricks.sdk import WorkspaceClient; import os
ka_name = os.environ.get('{env_key}','').strip()
if not ka_name: print('[x] {env_key} not set'); exit(1)
w = WorkspaceClient()
try:
    ep = w.serving_endpoints.get(name=ka_name)
    state = str(ep.state.ready).split('.')[-1] if ep.state else '?'
    print('[+] ' + ka_name + ' — ' + state)
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
""".strip()

    if not script:
        return {"ok": False, "message": f"no test for step: {step}"}

    env = build_sub_env(config)
    try:
        result = subprocess.run(
            [PYTHON, "-c", script],
            capture_output=True, text=True, timeout=25,
            cwd=str(PACKAGE_ROOT), env=env,
        )
        raw = (result.stdout or "").strip() or (result.stderr or "").strip()
        ok = result.returncode == 0 and raw.startswith("[+]")
        if ok:
            return {"ok": True, "message": raw.lstrip("[+] ") if raw else "ok"}
        # Parse error for clean user message
        from brickforge.lib.env_utils import parse_subprocess_error
        return {"ok": False, "message": parse_subprocess_error(result.stderr, result.stdout) if "Traceback" in raw or "blocked" in raw else (raw.lstrip("[x] ") if raw else "no response")}
    except Exception as e:
        from brickforge.lib.env_utils import log_error
        log_error("/api/setup/test", str(e))
        return {"ok": False, "message": str(e)}


# ── Upload CSV ────────────────────────────────────────────────────────────────

MAX_CSV_SIZE = 100 * 1024 * 1024  # 100 MB

_COL_NAME_RE = re.compile(r"[^a-zA-Z0-9_]")


@router.post("/api/setup/upload-csv")
async def upload_csv(files: list[UploadFile] = File(...)):
    """Accept user-uploaded CSV files and save them to data/upload/csv/."""
    upload_dir = PROJECT_ROOT / "data" / "upload" / "csv"
    upload_dir.mkdir(parents=True, exist_ok=True)
    init_dir = PROJECT_ROOT / "data" / "upload" / "init"
    init_dir.mkdir(parents=True, exist_ok=True)

    uploaded = []
    for f in files:
        if not f.filename or not f.filename.lower().endswith(".csv"):
            uploaded.append({"name": f.filename or "?", "ok": False, "error": "not a .csv file"})
            continue
        # Sanitize filename to prevent path traversal
        safe_name = Path(f.filename).name
        if ".." in safe_name or "/" in safe_name or "\\" in safe_name:
            uploaded.append({"name": f.filename, "ok": False, "error": "invalid filename"})
            continue
        try:
            content = await f.read()
            if len(content) > MAX_CSV_SIZE:
                uploaded.append({"name": safe_name, "ok": False, "error": f"file exceeds {MAX_CSV_SIZE // (1024*1024)}MB limit"})
                continue
            dest = upload_dir / safe_name
            dest.write_bytes(content)
            # Generate a minimal CREATE TABLE SQL from the CSV header
            header_line = content.split(b"\n", 1)[0].decode("utf-8", errors="replace").strip()
            cols = [c.strip().strip('"').strip("'") for c in header_line.split(",") if c.strip()]
            # Sanitize column names to alphanumeric + underscores only
            cols = [_COL_NAME_RE.sub("_", c).strip("_") or f"col_{i}" for i, c in enumerate(cols)]
            table_name = Path(safe_name).stem.replace("-", "_").replace(" ", "_").lower()
            col_defs = ", ".join(f"`{c}` STRING" for c in cols)
            sql = f"CREATE TABLE IF NOT EXISTS ${{catalog}}.${{schema}}.{table_name} ({col_defs});\n"
            (init_dir / f"create_{table_name}.sql").write_text(sql)
            uploaded.append({"name": safe_name, "ok": True})
        except Exception as e:
            uploaded.append({"name": safe_name, "ok": False, "error": str(e)[:200]})

    return {"ok": all(u["ok"] for u in uploaded), "uploaded": uploaded}


# ── Exec (SSE) ────────────────────────────────────────────────────────────────

NO_AUTH_ACTIONS = {"save-deploy-name", "forge-bridge"}


@router.post("/api/setup/exec")
async def setup_exec(request: Request):
    from brickforge.lib.env_utils import check_token_expiry, build_sub_env
    config = _get_config()

    body = await request.json()
    action = body.get("action", "")
    params = body.get("params", {})

    async def generate():
        logger = ExecLogger(action)

        # Token expiry check
        if action not in NO_AUTH_ACTIONS:
            expiry_err = check_token_expiry(config)
            if expiry_err:
                yield sse_line(f"[x] {expiry_err}\n", "err")
                logger.log(f"[x] {expiry_err}")
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return

        sub_env = build_sub_env(config)

        # ── Direct call actions ────────────────────────────────────────

        if action == "exec-same":
            # Auto-discover FM endpoint on this workspace
            script = """\
import os, json
from databricks.sdk import WorkspaceClient
from dotenv import load_dotenv
load_dotenv(os.environ.get('ENV_FILE', '.env.local'), override=True)
w = WorkspaceClient()
endpoints = list(w.serving_endpoints.list())
# Prefer external model endpoints (e.g. Claude via Anthropic)
fm = [e for e in endpoints if e.config and any(
    sc.external_model for sc in (e.config.served_entities or [])
)]
if not fm:
    fm = [e for e in endpoints if e.config and any(
        sc.foundation_model for sc in (e.config.served_entities or [])
    )]
if not fm:
    # Fallback: any endpoint with a known FM name pattern
    fm = [e for e in endpoints if any(k in (e.name or '') for k in ['claude','llama','mixtral','gpt','anthropic'])]
if not fm:
    print('[x] no Foundation Model endpoint found on this workspace')
    exit(1)
name = fm[0].name
env_file = os.environ.get('ENV_FILE', '.env.local')
# Write AGENT_MODEL_ENDPOINT to .env.local
import re as _re
try:
    with open(env_file) as f: content = f.read()
except FileNotFoundError:
    content = ''
pat = _re.compile(r'^#?\\s*AGENT_MODEL_ENDPOINT=.*$', _re.MULTILINE)
if pat.search(content):
    content = pat.sub(f'AGENT_MODEL_ENDPOINT={name}', content)
else:
    content = content.rstrip() + f'\\nAGENT_MODEL_ENDPOINT={name}\\n'
# Comment out cross-workspace token
content = _re.sub(r'^(AGENT_MODEL_TOKEN=)', r'# \\1', content, flags=_re.MULTILINE)
with open(env_file, 'w') as f: f.write(content)
print('[+] same-workspace mode')
print('[+] AGENT_MODEL_ENDPOINT = ' + name)
"""
            cmd = [PYTHON, "-c", script]
            async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
                yield event
            logger.finish(True)
            return

        if action == "forge-bridge":
            logger.finish(True)
            yield sse_done(True)
            return

        if action == "save-workspace":
            ws_host = params.get("host", "")
            ws_token = params.get("token", "")
            if not ws_host or not ws_token:
                yield sse_line("[x] host and token required\n", "err")
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            if not ws_host.startswith("http"):
                ws_host = "https://" + ws_host
            ws_host = ws_host.rstrip("/")
            config.set_many({"DATABRICKS_HOST": ws_host, "DATABRICKS_TOKEN": ws_token})
            os.environ["DATABRICKS_HOST"] = ws_host
            os.environ["DATABRICKS_TOKEN"] = ws_token
            for k in ["DATABRICKS_CONFIG_PROFILE", "DATABRICKS_CLIENT_ID", "DATABRICKS_CLIENT_SECRET",
                       "DATABRICKS_REFRESH_TOKEN", "DATABRICKS_TOKEN_ENDPOINT"]:
                config.disable(k)
                os.environ.pop(k, None)
            for line in [f"[+] DATABRICKS_HOST = {ws_host}", f"[+] DATABRICKS_TOKEN = {ws_token[:8]}..."]:
                yield sse_line(line + "\n")
                logger.log(line)
            logger.finish(True)
            yield sse_done(True)
            return

        if action == "save-manual":
            key = params.get("key", "")
            value = params.get("value", "")
            if not key or not value:
                yield sse_line("[x] key and value required\n", "err")
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            if key == "DATABRICKS_HOST" and not value.startswith("http"):
                value = "https://" + value
            if key == "DATABRICKS_HOST":
                value = value.rstrip("/")
            if key == "PROJECT_UNITY_CATALOG_SCHEMA" and "." in value:
                config.set_many({key: value})
                os.environ[key] = value
                catalog, schema = value.split(".", 1)
                cmd = [PYTHON,"-c", _save_schema_script(catalog, schema)]
                async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
                    yield event
                logger.finish(True)
                return
            config.set_many({key: value})
            os.environ[key] = value
            display = f"{value[:8]}..." if "TOKEN" in key else value
            line = f"[+] {key} = {display}"
            yield sse_line(line + "\n")
            logger.log(line)
            logger.finish(True)
            yield sse_done(True)
            return

        if action == "save-multi-instance":
            prefix = params.get("prefix", "")
            slug = params.get("slug", "")
            url = params.get("url", "")
            header = params.get("header", "")
            if not prefix or not slug or not url:
                yield sse_line("[x] prefix, slug, and url required\n", "err")
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            mkey = f"{prefix}{slug}"
            updates = {mkey: url}
            if header:
                updates[f"{mkey}_HEADER"] = header
            config.set_many(updates)
            yield sse_line(f"[+] {mkey} = {url}\n")
            logger.log(f"[+] {mkey} = {url}")
            if header:
                yield sse_line(f"[+] {mkey}_HEADER = {header.split(':')[0]}:***\n")
            logger.finish(True)
            yield sse_done(True)
            return

        if action == "save-deploy-name":
            app_name = params.get("name", "")
            if not app_name:
                yield sse_line("[x] no app name provided\n", "err")
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            config.set_many({"DBX_APP_NAME": app_name})
            yield sse_line(f"[+] DBX_APP_NAME = {app_name}\n")
            logger.log(f"[+] DBX_APP_NAME = {app_name}")
            logger.finish(True)
            yield sse_done(True)
            return

        if action == "save-warehouse":
            wh_id = params.get("id", "")
            if not wh_id:
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            config.set_many({"DATABRICKS_WAREHOUSE_ID": wh_id})
            yield sse_line(f"[+] DATABRICKS_WAREHOUSE_ID = {wh_id}\n")
            logger.finish(True)
            yield sse_done(True)
            return

        if action == "save-schema":
            catalog = params.get("catalog", "")
            schema = params.get("schema", "")
            if not catalog or not schema:
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            config.set_many({"PROJECT_UNITY_CATALOG_SCHEMA": f"{catalog}.{schema}"})
            cmd = [PYTHON,"-c", _save_schema_script(catalog, schema)]
            async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
                yield event
            logger.finish(True)
            return

        if action == "save-genie":
            genie_id = params.get("id", "")
            genie_name = params.get("name", "")
            if not genie_id:
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            slug = re.sub(r"[^A-Z0-9]", "_", genie_name.upper()) if genie_name else "DEFAULT"
            config.set_many({f"PROJECT_GENIE_{slug}": genie_id})
            yield sse_line(f"[+] PROJECT_GENIE_{slug} = {genie_id}\n")
            logger.finish(True)
            yield sse_done(True)
            return

        if action == "save-lakebase":
            lb_name = params.get("name", "")
            if not lb_name:
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            config.set_many({"LAKEBASE_INSTANCE_NAME": lb_name})
            yield sse_line(f"[+] LAKEBASE_INSTANCE_NAME = {lb_name}\n")
            logger.finish(True)
            yield sse_done(True)
            return

        if action == "save-api":
            slug = params.get("slug", "")
            if not slug:
                yield sse_line("[x] no API name provided\n", "err")
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            prefix = f"PROJECT_API_{slug}"
            updates: dict[str, str] = {}
            api_type = params.get("type", "")
            if api_type == "uc" and params.get("conn"):
                updates[f"{prefix}_CONN"] = params["conn"]
            if api_type == "direct" and params.get("url"):
                updates[f"{prefix}_URL"] = params["url"]
            if params.get("method", "GET") != "GET":
                updates[f"{prefix}_METHOD"] = params["method"]
            if params.get("path", "/") != "/":
                updates[f"{prefix}_PATH"] = params["path"]
            if params.get("desc"):
                updates[f"{prefix}_DESC"] = params["desc"]
            if params.get("apiParams"):
                updates[f"{prefix}_PARAMS"] = params["apiParams"]
            if params.get("header") and api_type == "direct":
                updates[f"{prefix}_HEADER"] = params["header"]
            if not updates:
                yield sse_line("[x] no connection or URL provided\n", "err")
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            config.set_many(updates)
            for k, v in updates.items():
                yield sse_line(f"[+] {k} = {v}\n")
                logger.log(f"[+] {k} = {v}")
            logger.finish(True)
            yield sse_done(True)
            return

        if action == "save-host":
            profile = params.get("profile", "")
            if not profile:
                yield sse_line("[x] no profile selected\n", "err")
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            cmd = [PYTHON,"-c", f"""
import subprocess, re
out = subprocess.check_output(['databricks', 'auth', 'profiles'], text=True)
host = None
for line in out.strip().split('\\n')[1:]:
    parts = re.split(r'\\s{{2,}}', line.strip())
    if len(parts) >= 2 and parts[0].strip() == '{profile}':
        host = parts[1].strip()
        break
if not host: print('[x] profile not found: {profile}'); exit(1)
if not host.startswith('http'): host = 'https://' + host
print('[+] DATABRICKS_HOST = ' + host)
print('[+] DATABRICKS_CONFIG_PROFILE = {profile}')
""".strip()]
            async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
                yield event
            logger.finish(True)
            return

        # ── Subprocess actions ─────────────────────────────────────────

        if action == "exec-pat":
            cmd = [PYTHON,"-c", _pat_script()]
            async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
                yield event
            logger.finish(True)
            return

        if action == "exec-genie":
            genie_name = params.get("name", "Project Data")
            sub_env["GENIE_ROOM_NAME"] = genie_name
            cmd = [PYTHON,"data/init/create_genie_space.py"]
            async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
                yield event
            logger.finish(True)
            return

        if action == "exec-assets":
            schema_spec = params.get("schema", "")
            if schema_spec:
                config.set_many({"PROJECT_UNITY_CATALOG_SCHEMA": schema_spec})
                sub_env["PROJECT_UNITY_CATALOG_SCHEMA"] = schema_spec
            cmd = [PYTHON,"data/init/create_all_assets.py"]
            async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
                yield event
            logger.finish(True)
            return

        if action == "exec-deploy-agent":
            config_dict = config.to_env_dict()
            with tempfile.NamedTemporaryFile(mode="w", suffix=".json", dir=str(PROJECT_ROOT), prefix=".tmp-deploy-", delete=False) as f:
                json.dump(config_dict, f, indent=2)
                tmp_path = f.name
            cmd = [PYTHON,"deploy/deploy_agent_app.py", "--config", tmp_path]
            async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
                yield event
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
            logger.finish(True)
            return

        if action == "exec-git-push":
            repo_url = params.get("repo_url", "")
            if not repo_url:
                yield sse_line("[x] repo_url required\n", "err")
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            config_dict = config.to_env_dict()
            with tempfile.NamedTemporaryFile(mode="w", suffix=".json", dir=str(PROJECT_ROOT), prefix=".tmp-deploy-", delete=False) as f:
                json.dump(config_dict, f, indent=2)
                tmp_path = f.name
            cmd = [PYTHON,"deploy/git_push.py", "--repo-url", repo_url, "--config", tmp_path]
            async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
                yield event
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
            logger.finish(True)
            return

        if action == "exec-auth-login":
            host_val = params.get("host", "")
            if not host_val:
                yield sse_line("[x] no host provided\n", "err")
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            cmd = [PYTHON,"-c", _auth_login_script(host_val, params.get("profile", ""))]
            async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
                yield event
            logger.finish(True)
            return

        if action == "save-model-profile":
            profile = params.get("profile", "")
            if not profile:
                yield sse_line("[x] no profile selected\n", "err")
                logger.finish(False, 1)
                yield sse_done(False, 1)
                return
            cmd = [PYTHON,"-c", _model_profile_script(profile)]
            async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
                yield event
            logger.finish(True)
            return

        # Mapped commands
        cmd_map = {
            "exec-tables": [PYTHON,"-c", _tables_script()],
            "exec-tables-uploaded": [PYTHON,"-c", _tables_uploaded_script()],
            "exec-functions": [PYTHON,"-c", _functions_script()],
            "exec-lakebase": [PYTHON,"data/init/create_lakebase.py"],
            "exec-mlflow": [PYTHON,"data/init/create_mlflow_experiment.py"],
            "exec-grants": [PYTHON,"deploy/grant/run_all_grants.py"],
            "exec-ka": [PYTHON,"-c", _ka_script()],
        }

        if action in cmd_map:
            cmd = cmd_map[action]
            async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
                yield event
            logger.finish(True)
            return

        # Unknown
        yield sse_line(f"[x] unknown action: {action}\n", "err")
        logger.finish(False, 1)
        yield sse_done(False, 1)

    return StreamingResponse(generate(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
    })


# ── Prompts ───────────────────────────────────────────────────────────────────

@router.get("/api/setup/prompts")
async def list_prompts():
    prompt_dir = PACKAGE_ROOT / "conf" / "prompt"
    try:
        files = []
        for f in sorted(prompt_dir.iterdir()):
            if f.name.startswith("."):
                continue
            files.append({"name": f.name, "content": f.read_text()})
        return {"files": files}
    except FileNotFoundError:
        return {"files": []}


@router.put("/api/setup/prompts")
async def save_prompt(request: Request):
    body = await request.json()
    name = body.get("name", "")
    content = body.get("content", "")
    if not name or "/" in name or ".." in name:
        return JSONResponse({"error": "invalid filename"}, status_code=400)
    prompt_dir = PACKAGE_ROOT / "conf" / "prompt"
    prompt_dir.mkdir(parents=True, exist_ok=True)
    (prompt_dir / name).write_text(content)
    return {"ok": True}


# ── Inline script templates ──────────────────────────────────────────────────

def _save_schema_script(catalog: str, schema: str) -> str:
    return f"""
import os; from dotenv import load_dotenv; load_dotenv(os.environ.get('ENV_FILE', '.env.local'), override=True)
from databricks.sdk import WorkspaceClient
import re; from pathlib import Path
w = WorkspaceClient()
spec = '{catalog}.{schema}'
try:
    w.schemas.get(full_name=spec)
    print('[+] schema exists:', spec)
except:
    cat_exists = False
    try:
        w.catalogs.get(name='{catalog}')
        cat_exists = True
    except: pass
    if cat_exists:
        try:
            w.schemas.create(name='{schema}', catalog_name='{catalog}')
            print('[+] schema created:', spec)
        except Exception as e2:
            print('[x] cannot create schema:', str(e2)[:200]); exit(1)
    else:
        try:
            w.catalogs.create(name='{catalog}')
            w.schemas.create(name='{schema}', catalog_name='{catalog}')
            print('[+] catalog + schema created:', spec)
        except Exception as e3:
            print('[x]', str(e3)[:200]); exit(1)
f = Path('.env.local')
lines = f.read_text().splitlines() if f.exists() else []
new = []; found = False
for line in lines:
    m = re.match(r'^([A-Za-z_][A-Za-z0-9_]*)=', line)
    if m and m.group(1) == 'PROJECT_UNITY_CATALOG_SCHEMA': new.append('PROJECT_UNITY_CATALOG_SCHEMA=' + spec); found = True
    else: new.append(line)
if not found: new.append('PROJECT_UNITY_CATALOG_SCHEMA=' + spec)
f.write_text('\\n'.join(new) + '\\n')
print('[+] PROJECT_UNITY_CATALOG_SCHEMA = ' + spec)
""".strip()


def _pat_script() -> str:
    return """
import os; from dotenv import load_dotenv; load_dotenv(os.environ.get('ENV_FILE', '.env.local'), override=True)
import os, urllib.request, json, ssl, datetime
host = os.environ.get('DATABRICKS_HOST','').strip().rstrip('/')
token = os.environ.get('DATABRICKS_TOKEN','').strip()
if not host: print('[x] DATABRICKS_HOST not set'); exit(1)
if not token: print('[x] DATABRICKS_TOKEN not set'); exit(1)
today = datetime.date.today().strftime('%Y%m%d')
comment = f'brickforge-7days-{today}'
print(f'[~] Creating PAT "{comment}" on {host}...')
ctx = ssl.create_default_context()
try:
    data = json.dumps({{'lifetime_seconds': 604800, 'comment': comment}}).encode()
    req = urllib.request.Request(f'{{host}}/api/2.0/token/create', data=data, method='POST')
    req.add_header('Authorization', f'Bearer {{token}}')
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
        resp = json.loads(r.read())
    pat = resp.get('token_value','')
    if not pat: print('[x] Empty PAT response'); exit(1)
    from pathlib import Path
    import re
    f = Path('.env.local')
    lines = f.read_text().splitlines() if f.exists() else []
    new = []; found = False
    for line in lines:
        m = re.match(r'^([A-Za-z_][A-Za-z0-9_]*)=', line)
        if m and m.group(1) == 'DATABRICKS_TOKEN': new.append('DATABRICKS_TOKEN=' + pat); found = True
        else: new.append(line)
    if not found: new.append('DATABRICKS_TOKEN=' + pat)
    f.write_text('\\n'.join(new) + '\\n')
    print(f'[+] PAT created: {{pat[:12]}}... (7 days)')
except Exception as e:
    print(f'[x] {{str(e)[:150]}}'); exit(1)
""".strip()


def _tables_script() -> str:
    return """
import subprocess, sys, os
from pathlib import Path
ROOT = Path('.')
print('[~] Creating catalog and schema...')
sys.stdout.flush()
r = subprocess.run([sys.executable, 'data/init/create_catalog_schema.py'], cwd=ROOT)
if r.returncode != 0: print('[x] create_catalog_schema failed'); sys.exit(1)
print('[+] Catalog and schema ready')
sql_files = []
stash_dir = os.environ.get('FORGE_STASH_DIR', '').strip()
use_default = os.environ.get('USE_DEFAULT_DATA', 'true').strip().lower()
if stash_dir:
    d = ROOT / stash_dir / 'data' / 'init'
    if d.exists(): sql_files.extend(sorted(d.glob('create_*.sql')))
if not stash_dir and use_default in ('true', '1', 'yes'):
    d = ROOT / 'data' / 'default' / 'init'
    if d.exists(): sql_files.extend(sorted(d.glob('create_*.sql')))
if os.environ.get('USE_GEN_DATA', 'false').strip().lower() in ('true', '1', 'yes'):
    d = ROOT / 'data' / 'gen' / 'init'
    if d.exists(): sql_files.extend(sorted(d.glob('create_*.sql')))
if not sql_files: print('[~] No table SQL files found'); sys.exit(0)
print(f'[~] Provisioning {len(sql_files)} table(s)...')
for i, sf in enumerate(sql_files, 1):
    rel = str(sf.relative_to(ROOT))
    name = sf.stem.replace('create_', '')
    print(f'[~] ({i}/{len(sql_files)}) {name}...')
    sys.stdout.flush()
    r = subprocess.run([sys.executable, 'data/py/run_sql.py', rel], cwd=ROOT)
    if r.returncode != 0: print(f'[x] Failed: {rel}'); sys.exit(1)
    print(f'[+] {name}')
print(f'[+] All {len(sql_files)} table(s) provisioned')
""".strip()


def _tables_uploaded_script() -> str:
    return """
import subprocess, sys, os
from pathlib import Path
ROOT = Path('.')
print('[~] Creating catalog and schema...')
sys.stdout.flush()
r = subprocess.run([sys.executable, 'data/init/create_catalog_schema.py'], cwd=ROOT)
if r.returncode != 0: print('[x] create_catalog_schema failed'); sys.exit(1)
print('[+] Catalog and schema ready')
upload_init = ROOT / 'data' / 'upload' / 'init'
sql_files = sorted(upload_init.glob('create_*.sql')) if upload_init.exists() else []
if not sql_files: print('[x] No uploaded table SQL files found'); sys.exit(1)
# Also load the CSVs into the tables
upload_csv_dir = ROOT / 'data' / 'upload' / 'csv'
print(f'[~] Provisioning {len(sql_files)} uploaded table(s)...')
for i, sf in enumerate(sql_files, 1):
    rel = str(sf.relative_to(ROOT))
    name = sf.stem.replace('create_', '')
    print(f'[~] ({i}/{len(sql_files)}) {name}...')
    sys.stdout.flush()
    r = subprocess.run([sys.executable, 'data/py/run_sql.py', rel], cwd=ROOT)
    if r.returncode != 0: print(f'[x] Failed: {rel}'); sys.exit(1)
    # Load CSV data into the table
    csv_path = upload_csv_dir / f'{name}.csv'
    if not csv_path.exists():
        # Try original filename patterns
        candidates = list(upload_csv_dir.glob(f'{name}*.csv'))
        csv_path = candidates[0] if candidates else csv_path
    if csv_path.exists():
        print(f'[~] Loading data from {csv_path.name}...')
        sys.stdout.flush()
        r2 = subprocess.run([sys.executable, 'data/py/csv_to_delta.py', str(csv_path)], cwd=ROOT)
        if r2.returncode != 0: print(f'[~] CSV load warning: {csv_path.name}')
    print(f'[+] {name}')
print(f'[+] All {len(sql_files)} uploaded table(s) provisioned')
""".strip()


def _functions_script() -> str:
    return """
import subprocess, sys
print('[~] Creating UC functions...')
sys.stdout.flush()
r = subprocess.run([sys.executable, 'data/init/create_all_functions.py'])
if r.returncode != 0: print('[x] create_all_functions failed'); sys.exit(1)
print('[~] Creating UC procedures...')
sys.stdout.flush()
r = subprocess.run([sys.executable, 'data/init/create_all_procedures.py'])
if r.returncode != 0: print('[x] create_all_procedures failed'); sys.exit(1)
print('[+] All functions and procedures created')
""".strip()


def _ka_script() -> str:
    return """
import os; from dotenv import load_dotenv; load_dotenv(os.environ.get('ENV_FILE', '.env.local'), override=True)
import subprocess, sys
print('[~] creating Knowledge Assistant from YAML...')
sys.stdout.flush()
subprocess.check_call([sys.executable, 'scripts/py/ka/create_kas_from_yml.py', '--skip-existing'], stdout=sys.stdout, stderr=sys.stderr)
print('[+] Knowledge Assistant provisioned')
""".strip()


def _auth_login_script(host: str, profile: str) -> str:
    host_url = host if host.startswith("http") else f"https://{host}"
    host_url = host_url.rstrip("/")
    safe_profile = profile.replace("'", "\\'") if profile else ""
    return f"""
import os; from dotenv import load_dotenv; load_dotenv(os.environ.get('ENV_FILE', '.env.local'), override=True)
from pathlib import Path
import os, configparser, subprocess, sys

host = '{host_url}'
profile = '{safe_profile}' or host.split('//')[1].split('.')[0]

from scripts.py.setup_dbx_env import write_env_entry, ENV_FILE
write_env_entry(ENV_FILE, 'DATABRICKS_HOST', host)
write_env_entry(ENV_FILE, 'DATABRICKS_CONFIG_PROFILE', profile)
print('[+] DATABRICKS_HOST = ' + host)
print('[+] DATABRICKS_CONFIG_PROFILE = ' + profile)

cfg_path = Path.home() / '.databrickscfg'
cfg = configparser.ConfigParser()
if cfg_path.exists(): cfg.read(str(cfg_path))
if not cfg.has_section(profile): cfg.add_section(profile)
cfg.set(profile, 'host', host)
cfg.set(profile, 'auth_type', 'databricks-cli')
with open(str(cfg_path), 'w') as f: cfg.write(f)
print('[+] profile "' + profile + '" added to ~/.databrickscfg')

print('[~] running databricks auth login...')
sys.stdout.flush()
try:
    result = subprocess.run(['databricks', 'auth', 'login', '--host', host, '--profile', profile], timeout=60, capture_output=True, text=True)
    if result.returncode == 0: print('[+] authenticated via OAuth')
    else: print('[~] auth login returned: ' + (result.stderr or result.stdout or '').strip()[:120])
except subprocess.TimeoutExpired:
    print('[~] auth login timed out')
except Exception as e:
    print('[~] auth login failed: ' + str(e)[:80])
print('[+] done')
""".strip()


def _model_profile_script(profile: str) -> str:
    return f"""
import os; from dotenv import load_dotenv; load_dotenv(os.environ.get('ENV_FILE', '.env.local'), override=True)
from scripts.py.setup_dbx_env import _profile_for_host, _isolated_client, _redact, write_env_entry, ENV_FILE
import subprocess, re
out = subprocess.check_output(['databricks', 'auth', 'profiles'], text=True)
host = None
for line in out.strip().split('\\n')[1:]:
    parts = re.split(r'\\s{{2,}}', line.strip())
    if len(parts) >= 2 and parts[0].strip() == '{profile}':
        host = parts[1].strip()
        break
if not host: print('[x] profile not found: {profile}'); exit(1)
if not host.startswith('http'): host = 'https://' + host
endpoint = host.rstrip('/') + '/serving-endpoints/databricks-claude-sonnet-4-6/invocations'
w = _isolated_client('{profile}')
t = w.tokens.create(comment='agent-forge-fm', lifetime_seconds=604800)
write_env_entry(ENV_FILE, 'AGENT_MODEL_ENDPOINT', endpoint)
write_env_entry(ENV_FILE, 'AGENT_MODEL_TOKEN', t.token_value)
print('[+] AGENT_MODEL_ENDPOINT = ' + endpoint)
print('[+] AGENT_MODEL_TOKEN = ' + _redact(t.token_value))
""".strip()
