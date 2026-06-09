# BrickForge -- Context for Claude Code

## What This Is

BrickForge is a pip-installable SaaS tool for deploying Databricks AI agents. It provides a Setup App (FastAPI backend + React frontend) that configures, generates data, and deploys an Agent App to Databricks. Users create projects, configure workspace connections, generate synthetic data and prompts, then deploy -- all from a visual DAG-based UI.

## Architecture

```
brickforge/
├── agent/           # Agent runtime (LangGraph + MCP + MLflow)
├── routes/          # FastAPI API (setup.py, gen.py, projects.py, auth.py, cleanup.py, ka.py)
├── tools/           # Agent tools (tool_factory.py, ka_factory.py, a2a_factory.py, generate_chart.py)
├── lib/             # Config provider, env utils, token store, project paths, github client
├── conf/            # KA output format (prompts are project-scoped)
├── data/            # Data generation (gen/), provisioning (init/), demo seeds (demo/)
├── deploy/          # Deploy scripts + grant scripts (deploy/grant/)
├── static/          # Built Setup App frontend (copied from visual/frontend/dist/)
├── app/             # Chat UI (Node.js monorepo -- client + server, shipped as dist.tar.gz)
└── stash/           # Pre-built demo templates (.forge bundles)
visual/
├── frontend/        # Setup App React frontend (Vite + TypeScript)
└── backend/         # Setup App Node.js backend (dev only)
projects/            # User project configs (JSON files + artifact dirs)
docs/plan/           # Feature plans (persist across sessions)
```

## Critical: No .env Files

**There is NO .env.local file.** All configuration lives in `config.json` (or per-project JSON files under `projects/`). The config system uses `lib/config_provider.py` which reads/writes config.json and syncs to `os.environ`.

- Never reference `.env`, `.env.local`, or `load_dotenv` in any code
- Never add `load_dotenv()` calls to scripts
- Subprocess scripts receive env vars via `lib/env_utils.py:build_sub_env()`
- The `CONFIG_FILE` env var points scripts to the active config.json

## Config System

- `lib/config_provider.py` -- `LocalConfigProvider` reads/writes `config.json`
- `config.get("workspace.host")` -- dot-path access to nested config (NOT flat env keys)
- `config.set("key", value)` / `config.set_many(dict)` -- write + sync env
- `flatten(config)` -- converts nested config to flat env-style dict
- `_sync_env()` -- clears ALL known config keys from os.environ, then re-sets from config data
- `_save()` -- strips tokens from disk (deep-copies data, nulls `workspace.token` and `model.token` before writing)

**Important:** `config.get()` uses dot-paths only: `config.get("genie_room.name")`, NOT `config.get("GENIE_ROOM_NAME")`.

## Token Security

- Tokens NEVER written to disk -- `_save()` strips `workspace.token` and `model.token` before writing
- `lib/token_store.py` -- `KeyringStore` (macOS Keychain), `SecretsStore` (Databricks secrets), `NullStore` (fallback)
- `get_token_store()` factory returns appropriate store based on environment
- Tokens restored from keyring on startup and project switch
- GitHub tokens also stored in keyring under "github.com" key

## Project System

- Projects stored as `projects/{name}.json` with artifact dirs `projects/{name}/prompt/`, `projects/{name}/gen/`, `projects/{name}/conf/`
- Active project tracked in `projects/.current`
- `lib/project_paths.py` -- single source of truth for project-scoped path resolution (`prompt_dir()`, `gen_dir()`)
- NO fallback to shared dirs when `PROJECT_DIR` is set -- project dir is the only source
- `create_project` -- creates fresh config from DEFAULT_CONFIG
- `load_project` -- full replace (not merge), switches mirror before save
- Export/import as `.forge.zip` bundles with Load (same workspace) vs New (different workspace) modes

## Deploy Flow

Deploy uses **Databricks SDK** (`w.apps.create()` / `w.apps.deploy()`), NOT `databricks bundle deploy`. The `databricks.yml` file is generated and uploaded but never consumed by the SDK deploy.

1. `build_agent_bundle()` creates zip: agent code + config.json + app.yaml + databricks.yml
2. Bundle uploaded to workspace via `w.workspace.import_()`
3. `start.sh` generated inline and uploaded separately (extracts bundle, creates venv, starts server)
4. `w.apps.deploy()` triggers deployment
5. Grant scripts auto-run: tables, functions, warehouse, endpoints, genie (all via `w.permissions.update()`)

Grant scripts pattern:
1. Get app SP: `w.apps.get(app_name).service_principal_client_id`
2. Grant via: `w.permissions.update(request_object_type=..., request_object_id=..., access_control_list=[...])`
3. Object types: `"warehouses"` (CAN_USE), `"genie"` (CAN_RUN), `"serving-endpoints"` (CAN_QUERY)
4. Deploy + grants run in a single inline subprocess to avoid chained `stream_subprocess` hang

## GitHub Integration

- `lib/github_client.py` -- OAuth Device Flow auth, repo creation, git push
- Client ID: `Ov23liqaGLy9v7sWlVsM` (BrickForge GitHub OAuth App)
- Device flow: no redirects, works from localhost
- Token stored in keyring via `get_token_store().set("github.com", token)`
- Endpoints: `/api/github/status`, `/api/github/connect`, `/api/github/poll`, `/api/github/push`
- Push builds agent bundle (tokens stripped), creates private repo, pushes via git CLI

## Auth System

- `routes/auth.py` -- Bridge auth (inline OAuth PKCE for local mode, curl-based for deployed mode)
- `lib/bridge_oauth.py` -- OAuth PKCE flow: verify token, discover OAuth, setup PKCE, wait for callback, exchange token, create PAT
- Saved workspaces: `/api/workspaces` GET/POST/DELETE -- auto-saved on successful connection
- Bridge inline: `/api/auth/bridge-inline` SSE endpoint for local OAuth flow

## Setup App (Visual DAG)

17 setup blocks in order: host, warehouse, schema, tables, functions, model, prompt, genie, bricks, vs, mcp, api, a2a, features, mlflow, deploy, git

Each block flows through phases: choose -> configure -> execute -> done

Key UI components:
- `SetupView.tsx` -- DAG grid with block cards
- `SetupDrawer.tsx` -- right panel with block-specific UI (pickers, forms, terminals)
- `GenTerminal` -- SSE streaming terminal for long-running operations
- `GitHubPanel` -- device flow connect + repo push UI
- `BridgeAuthPanel` -- inline OAuth connect UI

## Data Generation

AI-powered synthetic data generation wizard:
- `data/gen/schema_generator.py` -- generate table schemas from domain description
- `data/gen/data_generator.py` -- generate CSV data from schemas
- `data/gen/prompt_generator.py` -- generate system prompt + knowledge base from domain
- `data/gen/routine_schema_generator.py` + `routine_sql_generator.py` -- generate UC functions/procedures
- All generated artifacts scoped to `projects/{name}/gen/`

## SSE Streaming

- `lib/sse.py` -- `stream_subprocess()` with concurrent stderr drain (prevents pipe deadlock)
- All subprocess calls pass `PYTHONUNBUFFERED=1` and `DATABRICKS_CONFIG_FILE=""` via `lib/env_utils.py:build_sub_env()`
- ExecLogger with per-action log files for persistence

## Frontend Build

After any frontend change:
```bash
cd visual/frontend && npx vite build
rm -rf ../../brickforge/static/assets/* && cp -r dist/* ../../brickforge/static/
```

## Running Locally

```bash
pip install brickforge
brickforge  # Starts FastAPI on port 9000
```

## Key Env Vars (set by config system, not manually)

- `DATABRICKS_HOST` -- workspace URL
- `DATABRICKS_TOKEN` -- PAT or OAuth token (never on disk)
- `DATABRICKS_WAREHOUSE_ID` -- SQL warehouse
- `AGENT_MODEL` -- serving endpoint URL or name
- `PROJECT_GENIE_SPACES` -- comma-separated genie space IDs
- `PROJECT_UNITY_CATALOG_SCHEMA` -- target schema
- `DBX_APP_NAME` -- deployed app name
- `CONFIG_FILE` -- path to active config.json
- `PROJECT_DIR` -- path to active project artifact dir

## Conventions

- Python 3.11+ for agent runtime
- FastAPI (NOT Flask) for the Setup App backend
- `sys.executable` instead of `uv run python` for subprocess calls
- No notebooks -- code-first only
- Exact pinned versions in requirements.txt -- never unpin or loosen
- Never show file paths or script names in UI text
- Tokens never on disk -- always in keyring
- No fallback to shared dirs when project dir is set
- Plans saved to `docs/plan/{slug}.md` -- persist across sessions
