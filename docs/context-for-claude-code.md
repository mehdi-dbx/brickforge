# BrickForge -- Context for Claude Code

> Last updated: 2026-06-03 (config.json migration complete)

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
    config_provider.py # ConfigProvider base + LocalConfigProvider + ForgeConfigProvider + flatten()
    config_json.py     # Subprocess helpers: read_config(), write_config() via CONFIG_FILE env var
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
    tool_factory.py    # Dynamic tool loading from config + discover_uc_function_tools()
    ka_factory.py      # KA endpoint tool builder (reads PROJECT_KA_*, does NOT check brick toggles yet -- see #44)
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

### config.json (single source of truth)

All configuration lives in `config.json` -- one file, one format, one read path. Replaced flat `.env.local` (key=value) entirely.

- **Local mode**: `~/.brickforge/config.json` (pip) or `PROJECT_ROOT/config.json` (editable install)
- **Deployed mode**: `config.json` inside UC Volume zip (`current.forge.zip`) via ForgeConfigProvider
- **Deploy transport**: `config.json` shipped as file in the deploy bundle. app.yaml has zero user env vars.
- **Agent boot**: `start_server.py` reads `config.json`, calls `flatten()` -> `os.environ.update()` before agent init

### JSON structure (top-level sections)

```
config.json
├── version: 1
├── workspace: {host, token, config_profile, refresh_token, token_endpoint, client_id, client_secret, warehouse_id, unity_catalog_schema}
├── model: {endpoint, token}
├── app: {name, mlflow_experiment_id}
├── tools
│   ├── genie_spaces: [array of IDs]
│   ├── functions: [array of names]
│   ├── vector_search: {index, endpoint}
│   ├── ka: {SLUG: {endpoint, enabled}}
│   ├── mcp: {SLUG: {url, header, enabled}}
│   ├── api: {SLUG: {conn, url, method, path, desc, params, header, enabled}}
│   └── a2a: {SLUG: {url, header, enabled}}
├── features: {MEMORY/CHART/VOICE/VISION/PERSONAS: {enabled}}
├── bricks: {KA/INFO_EXTRACTION/DOC_PARSING/TEXT_CLASSIFICATION: {enabled}}
├── data: {use_demo_data, use_gen_data, stash_dir}
├── lakebase: {instance_name, agent_memory_schema}
├── env_store: {host, token, catalog_volume_path}
├── genie_room: {name, description}
└── branding: {logo_url, brandfetch_api_key}
```

### ConfigProvider abstraction

- `LocalConfigProvider(config_file)` -- reads/writes `config.json` on disk
- `ForgeConfigProvider` -- in-memory JSON, flushed to UC Volume as `config.json` in zip. Migrates legacy `config.env` on first read.
- **Structured API**: `get("workspace.host")`, `set("workspace.host", val)`, `get_section("tools.ka")`
- **Legacy API** (still works, routes use it): `set_many({"DATABRICKS_HOST": val})`, `list_by_prefix("PROJECT_KA_")`, `toggle(key)`, `delete_key(key)` -- internally maps flat env vars to JSON paths
- `flatten()` -- converts structured JSON to flat env var dict (for subprocess injection and deploy)
- Enable/disable: multi-instance tools have `"enabled": boolean` in JSON. Disabled entries preserved but omitted from `flatten()` output.
- KA double-gate: `PROJECT_KA_<SLUG>` only emitted if both `bricks.KA.enabled` AND `tools.ka.<SLUG>.enabled`

### Subprocess environment

`build_sub_env()` in `lib/env_utils.py` builds env dict for subprocesses:
- Calls `config.flatten()` to convert JSON -> flat env vars
- `PYTHONPATH` set to PACKAGE_ROOT
- `CONFIG_FILE` set to absolute path of `config.json` (for scripts that write back)
- Auth conflict resolution: removes SP OAuth vars when PAT is present

### Init script writeback

Scripts that create resources and update config (run as subprocesses):
- Read `CONFIG_FILE` env var -> `lib/config_json.py` helpers (`read_config()`, `write_config()`)
- `create_genie_space.py`: appends to `tools.genie_spaces[]`
- `generate_routines.py`: appends to `tools.functions[]`
- `create_lakebase.py`: sets `lakebase.instance_name`
- `create_mlflow_experiment.py`: sets `app.mlflow_experiment_id`

### Migration from .env.local

`env_local_to_config_json(env_file)` in `config_provider.py` -- one-time migration function. Parses flat .env.local, groups by prefix, builds structured JSON. Handles commented lines -> `enabled: false`.

## Bridge auth flow

1. Setup App generates nonce, serves `connect.sh` script
2. User runs `curl <app-url>/api/auth/bridge-script?nonce=xxx | bash`
3. Script opens browser for OAuth PKCE flow (pure Python, no Databricks CLI)
4. Token exchanged, PAT created (7-day TTL, reuse check), encrypted
5. Browser redirected to Setup App with token in URL fragment
6. Setup App decrypts and saves to `config.json` (workspace section)

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
   - `config.json` -- full structured config (shipped as file, NOT as app.yaml env vars)
   - `app.yaml` -- minimal: startup command + 6 runtime constants only
   - `databricks.yml` -- resource permissions (genie spaces, warehouse, serving endpoint)

2. Upload to workspace via `w.workspace.import_(format=ImportFormat.RAW)`

3. `start.sh` on DBX Apps compute: unzip bundle, install deps, `export CONFIG_FILE=./config.json`, start agent

4. `start_server.py` at boot: reads `config.json`, calls `flatten()` -> `os.environ.update()`, then starts MLflow AgentServer

`sync_databricks_yml_from_env.py` (560 lines) is deprecated -- no longer needed since config travels as a file.

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
    func/            # Generated UC function SQL files
    manifest.json    # Tracks generated tables
    routine_manifest.json  # Tracks generated routines (functions/procedures)
    wizard-state.json
    generate_tables.py  # CLI orchestrator for table generation
    generate_routines.py  # CLI orchestrator for routine generation (with self-healing loop)
    schema_generator.py # Domain -> table schemas via LLM
    data_generator.py   # Schema -> synthetic rows via LLM
    routine_schema_generator.py  # Table context -> routine specs via LLM
    routine_sql_generator.py     # Routine specs -> Databricks SQL (hardened prompts + sanitizer)
    routine_writer.py   # Write SQL files from generated routines
    llm_client.py    # LLM client via WorkspaceClient().serving_endpoints.query()
    databricks_sql_reference.md  # Compact Databricks SQL spec (auto-growing via learning loop)
  init/              # Python orchestrators
    create_all_assets.py      # Master orchestrator: schema -> tables -> genie -> functions -> procedures -> lakebase -> verify
    create_catalog_schema.py
    create_genie_space.py     # Creates Genie space, appends to PROJECT_GENIE_SPACES in config
    create_all_functions.py   # Provisions all SQL functions from data/default/func/ + data/gen/func/
    create_all_procedures.py  # Provisions all stored procedures
    create_lakebase.py
    create_mlflow_experiment.py
  py/                # Shared utilities
    sql_utils.py, run_sql.py, csv_to_delta.py
```

Data source flags in `.env.local`:
- `USE_DEMO_DATA=true|false` -- include demo tables (backward compat: USE_DEFAULT_DATA also accepted)
- `USE_GEN_DATA=true|false` -- include generated tables

## Robust SQL generation (5-layer defense)

The routines wizard generates UC functions and stored procedures via LLM. Databricks SQL has strict syntax rules the LLM doesn't know natively. A 5-layer defense system prevents and auto-corrects SQL errors:

| Layer | Name | Where | What |
|-------|------|-------|------|
| 0 | Hardened prompt | `routine_sql_generator.py` | "You write Databricks SQL only. Be minimalist." + explicit ban list |
| 1 | Knowledge | `databricks_sql_reference.md` | Compact spec loaded into every LLM call. Auto-grows via Layer 4 |
| 2 | Sanitizer | `_sanitize_sql()` in `routine_sql_generator.py` | Auto-fixes: strips SQL SECURITY INVOKER, fixes LIMIT params, reorders DEFAULT params |
| 3 | Self-healing | `_self_heal()` in `generate_routines.py` | On provision failure: capture error -> LLM corrects -> sanitize -> retry (max 2) |
| 4 | Learning | `_learn_constraint()` in `generate_routines.py` | On successful self-heal: append new constraint to reference doc |

Design doc: `docs/plan/robust-sql-generation.md`

## UC function tool discovery

`discover_uc_function_tools()` in `tools/tool_factory.py` reads `PROJECT_FUNCTIONS` env var (comma-separated function names), fetches UC metadata via `w.functions.get()`, and creates `sql_read` tools the agent can call. SQL pattern: `SELECT * FROM catalog.schema.func(params)`.

After provisioning routines, `generate_routines.py` auto-appends function names to `PROJECT_FUNCTIONS`. The deploy pipeline syncs all `PROJECT_*` env vars to the deployed app via `deploy_agent_app.py`.

## Known issues

- **#44**: Brick toggles (`PROJECT_BRICK_*`) not enforced at agent runtime -- tools load regardless of toggle state
- **Ghost KA tools**: stale `PROJECT_KA_*` entries in config produce unexpected tools like `query_default_ka`

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
- **E2E / UI testing**: Playwright MCP (`/play` skill) -- browser automation via `browser_evaluate`, `browser_click`, `browser_fill_form`, `browser_wait_for`. Screenshots are last resort (context-heavy). Prefer `browser_evaluate` with targeted JS selectors.
- **Eval**: `eval/run_eval.py` -- MLflow GenAI eval with custom LLM judge scorer

## Key files for common tasks

| Task | Files |
|------|-------|
| Add a setup block | `visual/frontend/src/setupSteps.ts` + `brickforge/routes/setup.py` |
| Add a test for a block | `brickforge/routes/setup.py` (TEST_SCRIPTS dict) |
| Add an agent tool | `brickforge/tools/` + `brickforge/agent/agent.py` (tool wiring) |
| Add seed data | `brickforge/data/demo/csv/` + `data/demo/init/` (DDL SQL) |
| Add UC functions | `brickforge/data/demo/func/` (SQL) or generate via routines wizard |
| Change SQL generation | `brickforge/data/gen/routine_sql_generator.py` (prompts + sanitizer) |
| Fix SQL syntax issues | `brickforge/data/gen/databricks_sql_reference.md` (add constraints) |
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
| `~/.brickforge/config.json` | User config (pip install mode) |
| `~/.brickforge/brickforge_*.log` | Session log files |
| `brickforge/static/` | Setup App frontend (pre-built) |
| `brickforge/app/client/dist/` | Chat UI frontend (pre-built) |
| `brickforge/app/server/dist/` | Chat UI backend (pre-built) |

## EC2 dev box

See `docs/plan/ec2-devbox.md` for reconnect runbook (instance ID, region, SSH key, IP ACL management).

## Design docs

| Doc | Purpose |
|-----|---------|
| `docs/plan/saas-plan.md` | Full SaaS architecture blueprint |
| `docs/plan/brickforge-software.html` | Visual HTML blueprint (open in browser) |
| `docs/plan/deploy-logbook.md` | Build/deploy history with all walls and fixes |
| `docs/plan/next-steps-20260526.md` | Pending E2E tests |
| `docs/plan/python-backend-rewrite.md` | Express -> FastAPI rewrite plan |
| `docs/plan/forge-package-self-contained.md` | Self-contained package restructure plan |
| `docs/plan/ec2-devbox.md` | EC2 devbox reconnect runbook |
| `docs/plan/robust-sql-generation.md` | 5-layer SQL generation defense system |
| `docs/guide/brickforge-guide.md` | User-facing guide |
