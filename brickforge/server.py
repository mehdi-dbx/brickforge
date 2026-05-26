"""BrickForge Setup App - FastAPI backend."""
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from brickforge import PROJECT_ROOT, PACKAGE_ROOT, USER_DIR
from brickforge.lib.config_provider import LocalConfigProvider, ForgeConfigProvider, ConfigProvider
from brickforge.routes.setup import router as setup_router
from brickforge.routes.auth import router as auth_router
from brickforge.routes.gen import router as gen_router
from brickforge.routes.ka import router as ka_router
from brickforge.routes.cleanup import router as cleanup_router
from brickforge.routes.projects import router as projects_router
from brickforge.lib.graph_builder import build_graph

DIST_DIR = Path(__file__).resolve().parent / "static"
# Config file: ~/.brickforge/.env.local (pip install) or repo/.env.local (editable)
if (PROJECT_ROOT / "pyproject.toml").exists():
    ENV_FILE = PROJECT_ROOT / ".env.local"  # editable install: repo root
else:
    ENV_FILE = USER_DIR / ".env.local"  # pip install: ~/.brickforge/
PORT = int(os.environ.get("DATABRICKS_APP_PORT") or os.environ.get("VISUAL_PORT") or 9000)
FORGE_MODE = os.environ.get("FORGE_MODE") == "true" or os.environ.get("DATABRICKS_APP_PORT") is not None

# Config provider -- default to local, overridden in lifespan for FORGE mode
config: ConfigProvider = LocalConfigProvider(ENV_FILE)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global config
    # Startup
    if FORGE_MODE:
        config = ForgeConfigProvider()
        await config.init()
        schema = config.get("PROJECT_UNITY_CATALOG_SCHEMA")
        print(f"[forge] ForgeConfigProvider initialized" + (f" (schema: {schema})" if schema else " (bootstrap phase)"))
    else:
        config = LocalConfigProvider(ENV_FILE)

    mode = "FORGE (SaaS)" if FORGE_MODE else "LOCAL (.env.local)"
    print(f"[config] mode: {mode}")
    print(f"[visual] http://localhost:{PORT}")
    yield
    # Shutdown
    print("[visual] shutting down")


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "PUT", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"ok": True}


# ── Environment Config ────────────────────────────────────────────────────────

LAYOUT_FILE = PROJECT_ROOT / "visual" / "graph-layout.json"


@app.get("/api/graph")
async def get_graph():
    try:
        graph = build_graph()
        # Merge saved positions
        try:
            import json
            positions = json.loads(LAYOUT_FILE.read_text())
            for node in graph["nodes"]:
                if node["id"] in positions:
                    node["position"] = positions[node["id"]]
        except (FileNotFoundError, json.JSONDecodeError):
            pass
        return graph
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.put("/api/layout")
async def save_layout(request: Request):
    try:
        import json
        positions = await request.json()
        LAYOUT_FILE.write_text(json.dumps(positions, indent=2))
        return {"ok": True}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/stash/health")
async def stash_health():
    import re as _re
    stash_dir = PACKAGE_ROOT / "stash"
    if not stash_dir.exists():
        return {"stashes": []}
    stashes = []
    for d in sorted(stash_dir.iterdir()):
        if not d.is_dir():
            continue
        forge_file = next((f.name for f in d.iterdir() if f.suffix == ".forge"), None)
        if not forge_file:
            stashes.append({"name": d.name, "status": "error", "message": "no .forge manifest", "checks": []})
            continue
        raw = (d / forge_file).read_text()
        checks = []
        ok_count = miss_count = 0
        lines = raw.split("\n")
        file_refs = []
        for line in lines:
            m = _re.match(r"\s+(?:file|ddl|seed|system|knowledge_base|starters|config|dataset|runner):\s*(.+)", line)
            if m:
                ref = m.group(1).strip()
                if ref and not ref.startswith("{") and not ref.startswith("["):
                    file_refs.append(ref)
            lm = _re.match(r"\s+-\s+([\w/._-]+\.(?:sql|py|yml|yaml|csv|jsonl|prompt|base|txt))$", line)
            if lm:
                idx = lines.index(line)
                ctx = ""
                for j in range(idx - 1, -1, -1):
                    if _re.match(r"\s+functions:", lines[j]):
                        ctx = "data/func/"; break
                    if _re.match(r"\s+procedures:", lines[j]):
                        ctx = "data/proc/"; break
                if ctx:
                    file_refs.append(ctx + lm.group(1))
        for ref in file_refs:
            if (d / ref).exists():
                checks.append({"item": ref, "status": "ok"})
                ok_count += 1
            else:
                checks.append({"item": ref, "status": "missing"})
                miss_count += 1
        for dd in ["tools", "data", "conf"]:
            if (d / dd).exists():
                checks.append({"item": dd + "/", "status": "ok"})
                ok_count += 1
            else:
                checks.append({"item": dd + "/", "status": "missing"})
                miss_count += 1
        status = "ok" if miss_count == 0 else "warning"
        stashes.append({"name": d.name, "forgeFile": forge_file, "status": status, "ok": ok_count, "missing": miss_count, "checks": checks})
    return {"stashes": stashes}


@app.get("/api/env")
async def get_env():
    return config.list()


@app.put("/api/env")
async def put_env(request: Request):
    try:
        updates = await request.json()
        config.set_many(updates)
        return {"ok": True}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ── Setup routes ──────────────────────────────────────────────────────────────
app.include_router(setup_router)
app.include_router(auth_router)
app.include_router(gen_router)
app.include_router(ka_router)
app.include_router(cleanup_router)
app.include_router(projects_router)


# ── Static files + SPA fallback ──────────────────────────────────────────────

# Mount static assets (JS, CSS, images) at /assets/
assets_dir = DIST_DIR / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

# SPA fallback: serve index.html for all non-API, non-asset routes
index_html = DIST_DIR / "index.html"


@app.get("/{path:path}")
async def spa_fallback(request: Request, path: str):
    # Don't catch /api/* routes (they'll 404 naturally if not implemented)
    if path.startswith("api/"):
        return JSONResponse({"error": "not found"}, status_code=404)
    if index_html.exists():
        return FileResponse(str(index_html))
    return JSONResponse({"error": "frontend not built"}, status_code=404)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    import socket
    import uvicorn

    port = PORT
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(("0.0.0.0", port))
        sock.close()
    except OSError:
        sock.close()
        print(f"\n  Port {port} is already in use.")
        try:
            choice = input(f"  [K]ill it and reuse {port}, or [N]ext available port? (k/n): ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            choice = "n"
        if choice == "k":
            import subprocess
            pids = subprocess.run(["lsof", "-ti", f":{port}"], capture_output=True, text=True).stdout.strip()
            if pids:
                for pid in pids.split("\n"):
                    try:
                        import os
                        os.kill(int(pid), 9)
                    except (ValueError, ProcessLookupError):
                        pass
                print(f"  [+] Killed process on port {port}")
                import time
                time.sleep(1)
        else:
            for _ in range(10):
                port += 1
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                try:
                    s.bind(("0.0.0.0", port))
                    s.close()
                    break
                except OSError:
                    s.close()
            else:
                print(f"  [x] No available port found ({PORT}-{PORT + 10})")
                return

    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")


if __name__ == "__main__":
    main()
