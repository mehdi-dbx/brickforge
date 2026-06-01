# BrickForge -- Context for Claude Code

> Last updated: 2026-06-01

## What this project is

BrickForge is a pip-installable SaaS tool (`pip install brickforge`) that lets users build and deploy Databricks AI agents from a browser-based Setup App. No repo clone, no terminal, no notebooks. The user runs `brickforge`, opens the UI, connects a workspace, configures resources, and deploys an agent chat app to Databricks Apps.

It ships a reference flight-operations AI assistant (flight risk monitoring, check-in metrics, EU passenger rights KA) but is designed to be adapted to any domain.

## Terminology

- **Setup panel** -- the browser UI with all the setup blocks
- **Setup blocks** -- individual steps (host, warehouse, schema, model, deploy, etc.), each with choices following the flow: choose -> configure -> execute -> done
- **Stash** -- `brickforge/stash/` directory with preset project templates (e.g. `airops/`) defining tables, SQL, prompts, configs for a project flavor
- **.forge project** -- the user's saved config, persists to UC Volumes via save/load/switch

## How to run

```bash
pip install brickforge --pre
brickforge                    # starts Setup App at http://localhost:9000
brickforge --version          # prints version
```

Entry point: `brickforge/cli.py` -> `brickforge/server.py` (FastAPI)

## Architecture

```
User (browser)
    |
    v
Setup App frontend  [port 9000]  (React, pre-built in brickforge/static/)
    |
    v
Setup App backend  [port 9000]  (FastAPI, brickforge/server.py)
    |
    +-- Setup panel routes (brickforge/routes/setup.py)
    +-- Bridge auth routes (brickforge/routes/auth.py)
    +-- Data gen routes (brickforge/routes/gen.py)
    +-- KA routes (brickforge/routes/ka.py)
    +-- Cleanup routes (brickforge/routes/cleanup.py)
    +-- Project routes (brickforge/routes/projects.py)
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

Deployed agent app (separate from Setup App):
```
Databricks App  [port 8000 + 3000]
    |
    +-- MLflow AgentServer (FastAPI, uvicorn)  [port 8000]
    |       |-- LangGraph agent (LangChain tools + Claude via model serving)
    |       +-- /invocations endpoint
    |
    +-- Chat UI server (Node.js, Express)  [port 3000]
            |-- React frontend (pre-built dist)
            +-- /api/* routes (chat, history, session, config)
```

## Package structure

Everything lives inside `brickforge/` (self-contained pip package):

```
brickforge/
  __init__.py          # PACKAGE_ROOT, PROJECT_ROOT, USER_DIR, LOG_FILE, __version__
  cli.py               # Entry point: `brickforge` command
  server.py            # FastAPI app: CORS, static files, lifespan, routes
  routes/
    setup.py           # Setup panel backend (~1200 lines): status, exec, test, all block actions
    auth.py            # Bridge OAuth PKCE: nonce, token exchange, connect.sh serving
    gen.py             # Data generation: schema, data, save, provision, routines (SSE)
    ka.py              # Knowledge Assistant: list, upload, delete
    cleanup.py         # Resource discovery + deletion (SSE)
    projects.py        # UC Volume project CRUD
  lib/
    config_provider.py # ConfigProvider base + LocalConfigProvider + ForgeConfigProvider
    env_utils.py       # build_sub_env(), parse_subprocess_error(), detect_cloud(), logging
    graph_builder.py   # DAG node/edge builder for React Flow visualization
    sse.py             # sse_line(), sse_done(), ExecLogger, stream_subprocess()
  agent/
    agent.py           # LangGraph agent: tool wiring, model endpoint, memory, prompts
    start_server.py    # MLflow AgentServer wrapper + Node.js chat UI subprocess
    memory_tools.py    # Per-user memory (AsyncDatabricksStore)
    genie_capture.py   # Intercepts Genie MCP calls, logs generated SQL
  app/                 # Agent chat UI (Node.js monorepo)
    client/            # React frontend (Vite, TypeScript, Vercel AI SDK)
      src/             # Source (ships in wheel for advanced users)
      dist/            # Pre-built (ships in wheel, no node needed at deploy time)
    server/            # Express backend (TypeScript -> compiled .mjs)
      src/
      dist/            # Pre-built
    packages/          # Shared libs: auth, core, db, utils, ai-sdk-providers
    package.json       # npm workspaces monorepo
  tools/
    sql_executor.py    # Shared SQL execution (warehouse, query, format)
    tool_factory.py    # Dynamic tool loading from config
    ka_factory.py      # KA endpoint tool builder
    api_factory.py     # REST API tool builder
    a2a_factory.py     # Agent-to-agent tool builder
    generate_chart.py  # Chart generation tool
    get_current_time.py
  data/
    default/           # Shipped seed data (csv/, init/ DDL, func/ SQL functions, proc/ procedures)
    gen/               # Synthetic data generation (LLM-based wizard)
    init/              # Python orchestrators: create_all_assets.py, create_catalog_schema.py, etc.
    py/                # Shared utilities: sql_utils.py, run_sql.py, csv_to_delta.py
  conf/
    prompt/            # Agent system prompt (main.prompt) + knowledge base
    ka/                # KA YAML configs
    vs/                # Vector search configs
    .env.example       # Reference env template
  deploy/
    deploy_agent_app.py  # Bundle + upload + create DBX App via SDK
    deploy_setup_app.py  # Deploy the Setup App itself
    git_push.py          # Git push via Databricks git credentials
    grant/               # UC permission scripts (post-deploy)
  scripts/
    connect.sh         # Bridge auth: embedded Python OAuth PKCE flow
    release/           # bump.sh, build.sh, upload.sh, release.sh
  stash/
    airops/            # Preset template: app.yaml, databricks.yml for flight-ops domain
  eval/
    run_eval.py        # MLflow GenAI eval pipeline
    scorer.py          # Custom LLM judge scorer
  static/              # Pre-built Setup App frontend (index.html + assets/)
  requirements.txt     # 160 pinned deps (for deploy: pip install -r on DBX Apps)
  pyproject.toml       # Copied at build time (for deploy: pip install . on DBX Apps)
```

## Dual-root path system

```python
PACKAGE_ROOT = Path(__file__).resolve().parent              # always brickforge/
PROJECT_ROOT = parent if pyproject.toml exists else PACKAGE_ROOT
USER_DIR     = Path.home() / ".brickforge"                  # logs, config, stash cache
LOG_FILE     = USER_DIR / "brickforge_YYYYMMDD_HHMMSS.log"
```

- **Editable install** (`pip install -e .`): PROJECT_ROOT = repo root
- **Pip install**: PROJECT_ROOT = PACKAGE_ROOT = site-packages/brickforge/
- Config at `~/.brickforge/.env.local` (pip) or `PROJECT_ROOT/.env.local` (editable)

## Setup panel flow

### How blocks work

Each setup block follows: **choose -> configure -> execute -> done**

1. Frontend (`setupSteps.ts`) defines blocks with choices (actions)
2. User picks a choice -> frontend sends `POST /api/setup/exec` with `{action, params}`
3. Backend (`routes/setup.py`) handles the action:
   - **`exec-*` actions**: run a subprocess, stream output via SSE
   - **`cfg-*` actions**: configure UI (populate form fields, save values)
   - **`manual` actions**: text input from user, saved to config
4. SSE streams back to frontend, displayed in a terminal component
5. On completion, block state updates to `done`

### Status and test system

- `GET /api/setup/status` -- returns all block states (done/missing/unknown) from config
- `GET /api/setup/test` -- runs inline Python test scripts per block
- Test results cached in frontend state (avoid re-testing on every click)
- Tests are inline Python scripts in `routes/setup.py` (dict `TEST_SCRIPTS`)

### All 18 setup blocks

| Block ID | Label | What it does |
|----------|-------|-------------|
| `host` | workspace | Connect workspace via bridge-forge OAuth or manual entry |
| `warehouse` | sql warehouse | Pick a running SQL warehouse |
| `schema` | unity catalog | Create or select catalog.schema |
| `tables` | data tables | Provision Delta tables from CSV seed data |
| `functions` | UC functions | Create SQL functions + stored procedures |
| `model` | model endpoint | Configure Foundation Model API endpoint (same-workspace auto-discovery or cross-workspace) |
| `prompt` | agent prompt | Edit system prompt + knowledge base |
| `genie` | genie space | Configure Genie space for NL-to-SQL |
| `ka` | knowledge assistant | Configure vector RAG endpoint |
| `vs` | vector search | Configure vector search index |
| `mcp` | MCP (external) | Add external MCP servers |
| `api` | API (external) | Add REST API tool connections |
| `a2a` | A2A (agents) | Add agent-to-agent connections |
| `features` | features | Toggle optional agent capabilities |
| `lakebase` | lakebase | Create/configure Lakebase instance |
| `mlflow` | mlflow experiment | Create/configure MLflow experiment |
| `grants` | app grants | Run UC permission grants for deployed app SP |
| `deploy` | deploy app | Bundle agent + chat UI, upload, deploy as Databricks App |
| `git` | source control | Push project to GitHub/GitLab via Databricks git credentials |

## SSE streaming pattern

All long-running operations use Server-Sent Events:

```python
# Backend (routes/setup.py)
async def exec_generator(...):
    yield sse_line("[+] starting...\n")
    async for event in stream_subprocess(cmd, env=sub_env, cwd=PROJECT_ROOT):
        yield event
    yield sse_done(True)

# Frontend
const eventSource = new EventSource(`/api/setup/exec?action=${action}`)
eventSource.onmessage = (e) => appendLine(e.data)
```

`stream_subprocess()` in `lib/sse.py` wraps `asyncio.create_subprocess_exec` and yields stdout/stderr as SSE events.

## Config system

### ConfigProvider abstraction

- `LocalConfigProvider` -- reads/writes `.env.local` file (key=value format)
- `ForgeConfigProvider` -- reads/writes Databricks workspace secrets (for deployed Setup App)
- API: `list()`, `get(key)`, `set(key, value)`, `set_many()`, `disable()`, `disable_many()`
- Sensitive fields auto-detected and redacted in logs (TOKEN, SECRET, PASSWORD, PAT, API_KEY)

### Subprocess environment

`build_sub_env()` in `lib/env_utils.py` builds env dict for subprocesses:
- All config values injected as env vars
- `PYTHONPATH` set to PACKAGE_ROOT (so subprocess can `import tools`, `import data`, etc.)
- `ENV_FILE` set to absolute path of .env.local
- Auth conflict resolution: removes SP OAuth vars when PAT is present

## Bridge auth flow

1. Setup App generates nonce, serves `connect.sh` script
2. User runs `curl <app-url>/api/auth/bridge-script?nonce=xxx | bash`
3. Script opens browser for OAuth PKCE flow (pure Python, no Databricks CLI)
4. Token exchanged, PAT created (7-day TTL, reuse check), encrypted
5. Browser redirected to Setup App with token in URL fragment
6. Setup App decrypts and saves to `.env.local`

Key features:
- Auto-prepend https:// to workspace URLs
- PAT reuse: revokes old brickforge-* PATs, creates fresh one
- IP whitelist attempt on workspace (handles 400/409 gracefully)
- Summary box with actionable advice on failures

## Agent app deploy pipeline

Triggered by `exec-deploy-agent` action in setup panel:

1. `build_agent_bundle()` creates zip from PACKAGE_ROOT:
   - Python source: agent/, tools/, data/, conf/, eval/
   - Pre-built chat UI: app/client/dist.tar.gz, app/server/dist.tar.gz
   - pyproject.toml + requirements.txt (160 pinned deps)
   - Generated app.yaml + databricks.yml from user config

2. Upload to workspace via `w.workspace.import_(format=ImportFormat.RAW)`

3. Create/get DBX App via `w.apps.create(app=App(name=..., description=...))`

4. Deploy via `w.apps.deploy(app_name, app_deployment=AppDeployment(source_code_path=...))`

5. On DBX Apps compute (start.sh):
   ```bash
   unzip _bundle.dat
   tar xzf app/client/dist.tar.gz -C app/client/
   tar xzf app/server/dist.tar.gz -C app/server/
   python -m venv .venv --clear && . .venv/bin/activate
   pip install -r requirements.txt
   exec python -c "from agent.start_server import main; main()"
   ```

## Data layer

```
data/
  default/           # Shipped seed data (git-tracked)
    csv/             # Seed CSVs (flights.csv, etc.)
    init/            # DDL SQL (create_flights.sql, etc.)
    func/            # SQL function templates
    proc/            # Stored procedures
  gen/               # Synthetic data generation (LLM-based)
    csv/             # Generated CSVs
    init/            # Generated DDL SQL
    manifest.json    # Tracks generated tables
    wizard-state.json
    generate_tables.py  # CLI orchestrator
    schema_generator.py # Domain -> table schemas via LLM
    data_generator.py   # Schema -> synthetic rows via LLM
  init/              # Python orchestrators
    create_all_assets.py
    create_catalog_schema.py
    create_lakebase.py
    create_mlflow_experiment.py
  py/                # Shared utilities
    sql_utils.py, run_sql.py, csv_to_delta.py
```

Data source flags in `.env.local`:
- `USE_DEFAULT_DATA=true|false` -- include default tables
- `USE_GEN_DATA=true|false` -- include generated tables

## Chat UI (agent app frontend)

Located at `brickforge/app/`. Node.js monorepo with npm workspaces.

- **client/**: React + Vite + TypeScript + Vercel AI SDK
- **server/**: Express + TypeScript (auth, chat proxy, SSE)
- **packages/**: Shared libs (auth, core, db, utils, ai-sdk-providers)

Chat UI trimmed from 16MB to 1.8MB by stubbing shiki, mermaid, cytoscape, katex via Vite resolve.alias (see `client/vite.config.ts` and `client/src/stubs/`).

Ships both source (for advanced users to modify) and pre-built dist (for zero-friction deploy).

## Build system

### pip package build (`python -m build`)

Custom build hook in `setup.py`:
1. Copies `pyproject.toml` into `brickforge/` (needed by deploy on DBX Apps)
2. Runs `npm install && npm run build:client && npm run build:server` in `brickforge/app/`
3. Packages everything into wheel (~2MB)
4. Cleans up temporary pyproject.toml copy

Node.js only needed at build time. Not at install or deploy time.

### PyPI release

```bash
scripts/release/bump.sh    # Bump version in __init__.py + pyproject.toml
scripts/release/build.sh   # python -m build --no-isolation
scripts/release/upload.sh  # twine upload (VPN must be OFF for PyPI)
```

VPN blocks PyPI uploads (SSL cert interception). Disconnect before upload.

## Frontend build (Setup App)

Source: `visual/frontend/` (React, TypeScript, Vite)
Output: `brickforge/static/` (pre-built, served by FastAPI)

```bash
cd visual/frontend && npx vite build    # skip tsc (has pre-existing type errors)
cp -r dist/* ../../brickforge/static/
```

## Testing

- **Unit tests**: `tests/test_phase1.py` through `test_phase8.py` (81+ tests)
- **E2E**: Playwright (configured in `brickforge/app/`)
- **Eval**: `eval/run_eval.py` -- MLflow GenAI eval with custom LLM judge scorer

## Key files for common tasks

| Task | Files |
|------|-------|
| Add a setup block | `visual/frontend/src/setupSteps.ts` + `brickforge/routes/setup.py` |
| Add a test for a block | `brickforge/routes/setup.py` (TEST_SCRIPTS dict) |
| Add an agent tool | `brickforge/tools/` + `brickforge/agent/agent.py` (tool wiring) |
| Add seed data | `brickforge/data/default/csv/` + `data/default/init/` (DDL SQL) |
| Change deploy behavior | `brickforge/deploy/deploy_agent_app.py` |
| Change bridge auth | `brickforge/scripts/connect.sh` |
| Change chat UI | `brickforge/app/client/src/` + rebuild |
| Change Setup App UI | `visual/frontend/src/` + rebuild to `brickforge/static/` |
| Change backend API | `brickforge/routes/` + `brickforge/server.py` |
| Change agent behavior | `brickforge/agent/agent.py` + `brickforge/conf/prompt/main.prompt` |

## Runtime directories

| Path | Purpose |
|------|---------|
| `~/.brickforge/` | Runtime dir: logs, config, stash cache |
| `~/.brickforge/.env.local` | User config (pip install mode) |
| `~/.brickforge/brickforge_*.log` | Session log files |
| `brickforge/static/` | Setup App frontend (pre-built) |
| `brickforge/app/client/dist/` | Chat UI frontend (pre-built) |
| `brickforge/app/server/dist/` | Chat UI backend (pre-built) |

## EC2 dev box

See `doc/plan/ec2-devbox.md` for reconnect runbook (instance ID, region, SSH key, IP ACL management).

## Design docs

| Doc | Purpose |
|-----|---------|
| `doc/plan/saas-plan.md` | Full SaaS architecture blueprint |
| `doc/plan/brickforge-software.html` | Visual HTML blueprint (open in browser) |
| `doc/plan/deploy-logbook.md` | Build/deploy history with all walls and fixes |
| `doc/plan/next-steps-20260526.md` | Pending E2E tests |
| `doc/plan/python-backend-rewrite.md` | Express -> FastAPI rewrite plan |
| `doc/plan/forge-package-self-contained.md` | Self-contained package restructure plan |
| `doc/plan/ec2-devbox.md` | EC2 devbox reconnect runbook |
| `doc/guide/brickforge-guide.md` | User-facing guide |
