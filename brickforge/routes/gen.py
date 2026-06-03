"""Data generation routes: schema, data, save, provision, wizard-state, routines."""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse

from brickforge import PROJECT_ROOT, PACKAGE_ROOT
from brickforge.lib.sse import stream_subprocess, sse_line, sse_done
from brickforge.lib.env_utils import build_sub_env

router = APIRouter()


def _get_config():
    from brickforge.server import config
    return config


def _sub_env():
    return build_sub_env(_get_config())


# ── Status & Discovery ───────────────────────────────────────────────────────

@router.get("/api/gen/status")
async def gen_status():
    config = _get_config()
    env = config.to_env_dict()
    model_ready = bool(env.get("AGENT_MODEL_ENDPOINT") and env.get("DATABRICKS_HOST"))
    manifest = None
    manifest_path = PACKAGE_ROOT / "data" / "gen" / "manifest.json"
    try:
        manifest = json.loads(manifest_path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        pass
    return {
        "modelReady": model_ready,
        "manifest": manifest,
        "USE_DEFAULT_DATA": env.get("USE_DEFAULT_DATA", "true"),
        "USE_GEN_DATA": env.get("USE_GEN_DATA", "false"),
    }


@router.get("/api/gen/tables")
async def gen_tables():
    env = _get_config().to_env_dict()
    use_default = env.get("USE_DEFAULT_DATA", "true").strip().lower()
    use_gen = env.get("USE_GEN_DATA", "false").strip().lower()
    tables = []
    sources = []
    if use_default in ("true", "1", "yes"):
        sources.append(("default", PACKAGE_ROOT / "data" / "default"))
    if use_gen in ("true", "1", "yes"):
        sources.append(("generated", PACKAGE_ROOT / "data" / "gen"))

    for source, base in sources:
        csv_dir = base / "csv"
        init_dir = base / "init"
        if not csv_dir.exists():
            continue
        for csv_path in sorted(csv_dir.glob("*.csv")):
            table_name = csv_path.stem.replace("-", "_")
            sql_path = init_dir / f"create_{table_name}.sql"
            columns = []
            if sql_path.exists():
                content = sql_path.read_text()
                for m in re.finditer(r"(\w+)\s+(STRING|INT|BIGINT|DOUBLE|FLOAT|BOOLEAN|DATE|TIMESTAMP|DECIMAL[^,)]*)", content, re.IGNORECASE):
                    columns.append({"name": m.group(1), "type": m.group(2)})
            tables.append({"name": table_name, "columns": columns, "source": source})

    return {"tables": tables}


@router.get("/api/gen/routines")
async def gen_routines():
    env = _get_config().to_env_dict()
    use_default = env.get("USE_DEFAULT_DATA", "true").strip().lower()
    use_gen = env.get("USE_GEN_DATA", "false").strip().lower()
    routines = []
    sources = []
    if use_default in ("true", "1", "yes"):
        sources.append(("default", PACKAGE_ROOT / "data" / "default"))
    if use_gen in ("true", "1", "yes"):
        sources.append(("generated", PACKAGE_ROOT / "data" / "gen"))

    for source, base in sources:
        for sub, kind in [("func", "function"), ("proc", "procedure")]:
            d = base / sub
            if not d.exists():
                continue
            for f in sorted(d.glob("*.sql")):
                routines.append({"name": f.stem, "kind": kind, "source": source})

    return {"routines": routines}


# ── Wizard State ──────────────────────────────────────────────────────────────

def _state_path(kind: str = "data") -> Path:
    if kind == "routine":
        return PACKAGE_ROOT / "data" / "gen" / "routine-wizard-state.json"
    return PACKAGE_ROOT / "data" / "gen" / "wizard-state.json"


@router.get("/api/gen/wizard-state")
async def get_wizard_state():
    try:
        return json.loads(_state_path().read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return None


@router.put("/api/gen/wizard-state")
async def save_wizard_state(request: Request):
    body = await request.json()
    _state_path().parent.mkdir(parents=True, exist_ok=True)
    _state_path().write_text(json.dumps(body, indent=2))
    return {"ok": True}


@router.delete("/api/gen/wizard-state")
async def delete_wizard_state():
    try:
        _state_path().unlink()
    except FileNotFoundError:
        pass
    return {"ok": True}


@router.get("/api/gen/routine-wizard-state")
async def get_routine_wizard_state():
    try:
        return json.loads(_state_path("routine").read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return None


@router.put("/api/gen/routine-wizard-state")
async def save_routine_wizard_state(request: Request):
    body = await request.json()
    _state_path("routine").parent.mkdir(parents=True, exist_ok=True)
    _state_path("routine").write_text(json.dumps(body, indent=2))
    return {"ok": True}


@router.delete("/api/gen/routine-wizard-state")
async def delete_routine_wizard_state():
    try:
        _state_path("routine").unlink()
    except FileNotFoundError:
        pass
    return {"ok": True}


# ── Clear ─────────────────────────────────────────────────────────────────────

@router.delete("/api/gen/clear")
async def clear_gen():
    gen_dir = PACKAGE_ROOT / "data" / "gen"
    deleted = 0
    for sub in ["csv", "init"]:
        d = gen_dir / sub
        if d.exists():
            for f in d.iterdir():
                if f.suffix in (".csv", ".sql"):
                    f.unlink()
                    deleted += 1
    for name in ["manifest.json", "wizard-state.json"]:
        try:
            (gen_dir / name).unlink()
            deleted += 1
        except FileNotFoundError:
            pass
    return {"ok": True, "deleted": deleted}


@router.delete("/api/gen/clear-routines")
async def clear_routines():
    gen_dir = PACKAGE_ROOT / "data" / "gen"
    deleted = 0
    for sub in ["func", "proc"]:
        d = gen_dir / sub
        if d.exists():
            for f in d.iterdir():
                if f.suffix == ".sql":
                    f.unlink()
                    deleted += 1
    for name in ["routine_manifest.json", "routine-wizard-state.json"]:
        try:
            (gen_dir / name).unlink()
            deleted += 1
        except FileNotFoundError:
            pass
    return {"ok": True, "deleted": deleted}


# ── SSE Generation Endpoints ─────────────────────────────────────────────────

def _sse_gen(cmd: list[str], stdin_data: str | None = None):
    """Create an SSE streaming response for a generation subprocess."""
    async def generate():
        env = _sub_env()
        if stdin_data:
            import asyncio
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(PACKAGE_ROOT),
                env=env,
            )
            proc.stdin.write(stdin_data.encode())
            await proc.stdin.drain()
            proc.stdin.close()

            async for line_bytes in proc.stdout:
                text = line_bytes.decode("utf-8", errors="replace")
                if "VIRTUAL_ENV" in text and "does not match" in text:
                    continue
                if text.startswith("__RESULT__:"):
                    try:
                        from brickforge.lib.sse import sse_result
                        result_data = json.loads(text[len("__RESULT__:"):])
                        yield sse_result(result_data)
                    except json.JSONDecodeError:
                        yield sse_line(text)
                else:
                    yield sse_line(text)
            async for line_bytes in proc.stderr:
                text = line_bytes.decode("utf-8", errors="replace")
                if "VIRTUAL_ENV" in text:
                    continue
                yield sse_line(text, "err")
            await proc.wait()
            yield sse_done(proc.returncode == 0, proc.returncode or 0)
        else:
            async for event in stream_subprocess(cmd, env=env, cwd=PROJECT_ROOT, detect_result=True):
                yield event

    return StreamingResponse(generate(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
    })


# ── Prompt Generation ─────────────────────────────────────────────────────────

@router.post("/api/gen/prompt-generate")
async def prompt_generate(request: Request):
    body = await request.json()
    domain = body.get("domain", "")
    table_schemas = body.get("tableSchemas")
    cmd = [sys.executable, "data/gen/generate_prompts.py", "--mode=generate", f"--domain={domain}"]
    if table_schemas:
        cmd.append(f"--tables-json={json.dumps(table_schemas)}")
    return _sse_gen(cmd)


@router.post("/api/gen/prompt-save")
async def prompt_save(request: Request):
    body = await request.json()
    stdin_data = json.dumps(body)
    cmd = [sys.executable, "data/gen/generate_prompts.py", "--mode=save"]
    return _sse_gen(cmd, stdin_data)


# ── Schema Generation ─────────────────────────────────────────────────────────

@router.post("/api/gen/schema")
async def gen_schema(request: Request):
    body = await request.json()
    domain = body.get("domain", "")
    table_schemas = body.get("tableSchemas")
    cmd = [sys.executable, "data/gen/generate_tables.py", "--mode=schema", f"--domain={domain}"]
    if table_schemas:
        cmd.append(f"--tables-json={json.dumps(table_schemas)}")
    return _sse_gen(cmd)


@router.post("/api/gen/data")
async def gen_data(request: Request):
    body = await request.json()
    stdin_data = json.dumps(body)
    cmd = [sys.executable, "data/gen/generate_tables.py", "--mode=data"]
    return _sse_gen(cmd, stdin_data)


@router.post("/api/gen/save")
async def gen_save(request: Request):
    body = await request.json()
    stdin_data = json.dumps(body)
    cmd = [sys.executable, "data/gen/generate_tables.py", "--mode=save"]
    return _sse_gen(cmd, stdin_data)


@router.post("/api/gen/provision")
async def gen_provision():
    cmd = [sys.executable, "data/gen/generate_tables.py", "--mode=provision-gen"]
    return _sse_gen(cmd)


# ── Routine Generation ────────────────────────────────────────────────────────

@router.get("/api/gen/routine-status")
async def routine_status():
    config = _get_config()
    env = config.to_env_dict()
    model_ready = bool(env.get("AGENT_MODEL_ENDPOINT") and env.get("DATABRICKS_HOST"))
    # Load table schemas for context
    table_schemas = None
    manifest_path = PACKAGE_ROOT / "data" / "gen" / "manifest.json"
    try:
        manifest = json.loads(manifest_path.read_text())
        table_schemas = manifest.get("tables")
    except (FileNotFoundError, json.JSONDecodeError):
        pass
    return {"modelReady": model_ready, "tableSchemas": table_schemas}


@router.post("/api/gen/routine-schema")
async def routine_schema(request: Request):
    body = await request.json()
    domain = body.get("domain", "")
    table_schemas = body.get("tableSchemas")
    cmd = [sys.executable, "data/gen/generate_routines.py", "--mode=schema", f"--domain={domain}"]
    if table_schemas:
        cmd.append(f"--tables-json={json.dumps(table_schemas)}")
    return _sse_gen(cmd)


@router.post("/api/gen/routine-sql")
async def routine_sql(request: Request):
    body = await request.json()
    stdin_data = json.dumps(body)
    cmd = [sys.executable, "data/gen/generate_routines.py", "--mode=sql"]
    return _sse_gen(cmd, stdin_data)


@router.post("/api/gen/routine-save")
async def routine_save(request: Request):
    body = await request.json()
    stdin_data = json.dumps(body)
    cmd = [sys.executable, "data/gen/generate_routines.py", "--mode=save"]
    return _sse_gen(cmd, stdin_data)


@router.post("/api/gen/routine-provision")
async def routine_provision():
    cmd = [sys.executable, "data/gen/generate_routines.py", "--mode=provision-gen"]
    return _sse_gen(cmd)
