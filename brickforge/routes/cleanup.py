"""Cleanup routes: resource discovery + deletion."""
from __future__ import annotations

import json
import subprocess
import sys

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from brickforge import PROJECT_ROOT, PACKAGE_ROOT
from brickforge.lib.sse import stream_subprocess
from brickforge.lib.env_utils import build_sub_env

router = APIRouter()


def _get_config():
    from brickforge.server import config
    return config


@router.get("/api/cleanup/resources")
async def cleanup_resources():
    env = build_sub_env(_get_config())
    script = """
from dotenv import load_dotenv; load_dotenv(os.environ.get('ENV_FILE', '.env.local'), override=True)
from databricks.sdk import WorkspaceClient
import os, json

w = WorkspaceClient()
items = []

# Apps
app_name = os.environ.get('DBX_APP_NAME','').strip()
if app_name:
    try:
        app = w.apps.get(name=app_name)
        items.append({'id': f'app:{app_name}', 'category': 'apps', 'name': app_name})
    except: pass

# Genie spaces
for k, v in sorted(os.environ.items()):
    if k.startswith('PROJECT_GENIE_') and v.strip():
        try:
            space = w.genie.get_space(space_id=v.strip())
            items.append({'id': f'genie:{v.strip()}', 'category': 'genie', 'name': getattr(space, 'title', v)})
        except: pass

# Tables, functions, procedures
schema = os.environ.get('PROJECT_UNITY_CATALOG_SCHEMA','').strip()
if '.' in schema:
    try:
        for t in w.tables.list(catalog_name=schema.split('.')[0], schema_name=schema.split('.')[1]):
            items.append({'id': f'table:{t.full_name}', 'category': 'tables', 'name': t.name})
    except: pass
    for kind in ['FUNCTION', 'PROCEDURE']:
        try:
            for fn in w.functions.list(catalog_name=schema.split('.')[0], schema_name=schema.split('.')[1]):
                items.append({'id': f'routine:{fn.full_name}', 'category': 'routines', 'name': fn.name})
        except: pass

# Env keys
for k in ['DATABRICKS_HOST','DATABRICKS_TOKEN','DATABRICKS_WAREHOUSE_ID','PROJECT_UNITY_CATALOG_SCHEMA',
          'AGENT_MODEL_ENDPOINT','AGENT_MODEL_TOKEN','DBX_APP_NAME','LAKEBASE_INSTANCE_NAME','MLFLOW_EXPERIMENT_ID']:
    if os.environ.get(k,'').strip():
        items.append({'id': f'env:{k}', 'category': 'env', 'name': k})

print(json.dumps({'items': items}))
""".strip()

    try:
        result = subprocess.run(
            [sys.executable, "-c", script],
            capture_output=True, text=True, timeout=60,
            cwd=str(PACKAGE_ROOT), env=env,
        )
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout.strip())
        return {"items": [], "error": result.stderr or "no output"}
    except Exception as e:
        return {"items": [], "error": str(e)}


@router.post("/api/cleanup/exec")
async def cleanup_exec(request: Request):
    body = await request.json()
    ids = body.get("ids", [])

    async def generate():
        env = build_sub_env(_get_config())
        script = f"""
from dotenv import load_dotenv; load_dotenv(os.environ.get('ENV_FILE', '.env.local'), override=True)
from databricks.sdk import WorkspaceClient
from pathlib import Path
import os, re, json, sys

w = WorkspaceClient()
ids = {json.dumps(ids)}
env_file = Path('.env.local')

for item_id in ids:
    cat, name = item_id.split(':', 1)
    try:
        if cat == 'app':
            w.apps.delete(name=name)
            print(f'[+] deleted app: {{name}}')
        elif cat == 'genie':
            w.genie.delete_space(space_id=name)
            print(f'[+] deleted genie space: {{name}}')
        elif cat == 'table':
            w.tables.delete(full_name=name)
            print(f'[+] deleted table: {{name}}')
        elif cat == 'routine':
            w.functions.delete(name=name)
            print(f'[+] deleted routine: {{name}}')
        elif cat == 'env':
            # Comment out in .env.local
            if env_file.exists():
                raw = env_file.read_text()
                lines = []
                for line in raw.split('\\n'):
                    trimmed = line.strip()
                    if trimmed.startswith('#'): lines.append(line); continue
                    eq = trimmed.find('=')
                    if eq >= 0 and trimmed[:eq].strip() == name:
                        lines.append('#' + line)
                    else:
                        lines.append(line)
                env_file.write_text('\\n'.join(lines))
            print(f'[+] disabled env: {{name}}')
        else:
            print(f'[~] unknown category: {{cat}}')
    except Exception as e:
        print(f'[x] {{cat}}:{{name}}: {{str(e)[:100]}}')
    sys.stdout.flush()
print('[+] cleanup complete')
""".strip()

        async for event in stream_subprocess(
            [sys.executable, "-c", script], env=env, cwd=PROJECT_ROOT
        ):
            yield event

    return StreamingResponse(generate(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    })
