# Architecture

BrickForge has two main components: the Setup App (local) and the Agent App (deployed).

## Setup App

Runs locally on port 9000. Provides the visual DAG-based UI for configuring and deploying agents.

```
User (browser)
    |
    v
React frontend [port 9000]   (pre-built in brickforge/static/)
    |
    v
FastAPI backend [port 9000]   (brickforge/server.py)
    |
    +-- Setup routes       (brickforge/routes/setup.py)
    +-- Auth routes         (brickforge/routes/auth.py)
    +-- Data gen routes     (brickforge/routes/gen.py)
    +-- KA routes           (brickforge/routes/ka.py)
    +-- Project routes      (brickforge/routes/projects.py)
    +-- Cleanup routes      (brickforge/routes/cleanup.py)
    |
    v
Databricks workspace (via SDK + REST API)
    |
    +-- Unity Catalog (tables, functions, procedures)
    +-- SQL Warehouse
    +-- Serving endpoints (Foundation Model API)
    +-- Genie spaces
    +-- Knowledge Assistants
    +-- Databricks Apps (deployed agent)
```

### Entry point

```
brickforge (CLI) -> brickforge/cli.py -> brickforge/server.py (FastAPI + uvicorn)
```

### Frontend

- Source: `visual/frontend/` (React, TypeScript, Vite)
- Built output: `brickforge/static/` (served by FastAPI as static files)
- Key components:
    - `SetupView.tsx` - DAG grid with block cards
    - `SetupDrawer.tsx` - right panel with block-specific UI
    - `GenTerminal` - SSE streaming terminal for long-running operations
    - `BridgeAuthPanel` - inline OAuth connection UI
    - `GitHubPanel` - device flow connect + repo push

### Backend

- FastAPI with CORS, static file serving, lifespan management
- Routes organized by domain: `setup.py` (~1200 lines), `gen.py`, `auth.py`, `projects.py`, `ka.py`, `cleanup.py`
- All long-running operations use SSE (Server-Sent Events) via `lib/sse.py`

## Agent App (deployed)

Runs on Databricks Apps compute. Two services in one app:

```
Databricks App
    |
    +-- MLflow AgentServer [port 8000]  (FastAPI, uvicorn)
    |       |
    |       +-- LangGraph agent
    |       |     +-- LangChain tools (auto-discovered from config)
    |       |     +-- Foundation Model endpoint (Claude, Llama, etc.)
    |       |
    |       +-- /invocations endpoint
    |
    +-- Chat UI [port 3000]  (Node.js, Express)
            |
            +-- React frontend (pre-built dist)
            +-- /api/* routes (chat, history, session, config)
```

### Agent runtime

- `brickforge/agent/agent.py` - LangGraph agent: tool wiring, model endpoint, memory, prompt assembly
- `brickforge/agent/start_server.py` - boots MLflow AgentServer + Chat UI subprocess
- `brickforge/agent/memory_tools.py` - per-user memory (AsyncDatabricksStore)
- `brickforge/agent/genie_capture.py` - intercepts Genie MCP calls, logs generated SQL

### Chat UI

- Node.js monorepo: `brickforge/app/`
- `client/` - React + Vite + TypeScript + Vercel AI SDK (streaming)
- `server/` - Express + TypeScript (auth, chat proxy, SSE)
- `packages/` - shared libs (auth, core, db, utils, ai-sdk-providers)
- Ships both source (for customization) and pre-built dist (for zero-friction deploy)
- Trimmed from 16MB to 1.8MB by stubbing shiki, mermaid, cytoscape, katex via Vite resolve.alias

## Config flow

```
config.json (on disk, tokens stripped)
    |
    + tokens restored from keyring at startup
    |
    v
config (in-memory, full with tokens)
    |
    +-- flatten() -> flat env dict -> subprocess env (build_sub_env)
    |
    +-- flatten() -> os.environ.update() at agent boot (start_server.py)
    |
    +-- config.json shipped in deploy bundle (tokens stripped)
         |
         +-- On DBX Apps: auth via app service principal (no user tokens needed)
```

## SSE streaming pattern

All long-running operations (deploy, data gen, provisioning) use Server-Sent Events:

```python
# Backend
async def exec_generator(...):
    yield sse_line("[+] starting...\n")
    async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
        yield event
    yield sse_done(True)
```

`stream_subprocess()` in `brickforge/lib/sse.py` wraps `asyncio.create_subprocess_exec` and yields stdout/stderr as SSE events. Includes concurrent stderr drain to prevent pipe deadlock.

## Package structure

```
brickforge/
  __init__.py          # PACKAGE_ROOT, PROJECT_ROOT, USER_DIR, __version__
  cli.py               # Entry point: brickforge command
  server.py            # FastAPI app
  routes/              # API routes
  lib/                 # Config, env, tokens, project paths, SSE, GitHub client
  agent/               # LangGraph agent + MLflow server
  tools/               # Tool factories (UC functions, KA, API, A2A, MCP, charts)
  data/                # Data gen, provisioning, demo seeds
  deploy/              # Deploy scripts + grant scripts
  conf/                # KA output format configs
  app/                 # Chat UI (Node.js monorepo)
  stash/               # Pre-built demo templates
  eval/                # MLflow eval pipeline
  static/              # Pre-built Setup App frontend
  scripts/             # Bridge auth, release scripts
  requirements.txt     # 160 pinned dependencies
```

## Build system

### pip package (`python -m build`)

Custom build hook in `setup.py`:

1. Copies `pyproject.toml` into `brickforge/` (needed for deploy)
2. Runs `npm install && npm run build:client && npm run build:server` in `brickforge/app/`
3. Packages everything into wheel (~2MB)

Node.js is only needed at build time. Not at install or deploy time.

### PyPI release

```bash
scripts/release/bump.sh    # bump version
scripts/release/build.sh   # python -m build --no-isolation
scripts/release/upload.sh  # twine upload
```
