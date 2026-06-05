# BrickForge -- Context for Claude Code

## What This Is

BrickForge is a pip-installable SaaS tool for deploying Databricks AI agents. It provides a Setup App (Flask backend + React frontend) that configures, generates data, and deploys an Agent App to Databricks.

## Architecture

```
brickforge/
├── agent/           # Agent runtime (LangGraph + MCP + MLflow)
├── routes/          # Flask API (setup.py, gen.py, projects.py, auth.py, cleanup.py)
├── tools/           # Agent tools (tool_factory.py, ka_factory.py, a2a_factory.py)
├── lib/             # Config provider, env utils, graph builder
├── conf/prompt/     # System prompt (main.prompt, knowledge.base)
├── data/            # Data generation (gen/, init/, demo/)
├── deploy/          # Deploy scripts + grant scripts
├── static/          # Built frontend (copied from visual/frontend/dist/)
├── app/             # Chat UI (Node.js monorepo -- client + server)
└── stash/           # Pre-built demo templates
visual/
├── frontend/        # Setup App React frontend (Vite + TypeScript)
└── backend/         # Setup App Node.js backend (dev only)
projects/            # User project configs (JSON files)
```

## Critical: No .env Files

**There is NO .env.local file.** All configuration lives in `config.json` (or per-project JSON files under `projects/`). The config system uses `lib/config_provider.py` which reads/writes config.json and syncs to `os.environ`.

- Never reference `.env`, `.env.local`, or `load_dotenv` in any code
- Never add `load_dotenv()` calls to scripts
- Subprocess scripts receive env vars via `lib/env_utils.py:build_sub_env()`
- The `CONFIG_FILE` env var points scripts to the active config.json

## Config System

- `lib/config_provider.py` -- `LocalConfigProvider` reads/writes `config.json`
- `config.get("workspace.host")` -- dot-path access to nested config
- `config.set("key", value)` / `config.set_many(dict)` -- write + sync env
- `flatten(config)` -- converts nested config to flat env-style dict
- `_sync_env()` -- clears ALL known config keys from os.environ, then re-sets from config data

## Project System

- Projects stored as `projects/{name}.json`
- Active project tracked in `projects/.current`
- `create_project` -- creates fresh config from DEFAULT_CONFIG
- `load_project` -- full replace (not merge), switches mirror before save
- `_set_project_mirror(name)` -- every config write also saves to project JSON

## Deploy Flow

Deploy uses **Databricks SDK** (`w.apps.create()` / `w.apps.deploy()`), NOT `databricks bundle deploy`. The `databricks.yml` file is generated and uploaded but never consumed by the SDK deploy. App resources and permissions are granted via SDK API calls in `deploy/grant/`.

Grant scripts pattern:
1. Get app SP: `w.apps.get(app_name).service_principal_client_id`
2. Grant via: `w.permissions.update(request_object_type=..., request_object_id=..., access_control_list=[...])`
3. Object types: `"warehouses"` (CAN_USE), `"genie"` (CAN_RUN), `"serving-endpoints"` (CAN_QUERY)
4. Genie spaces use object type `"genie"` -- NOT `"genie/space"` or `"genie-spaces"`

## Frontend Build

After any frontend change:
```bash
cd visual/frontend && npx vite build
rm -rf ../../brickforge/static/assets/* && cp -r dist/* ../../brickforge/static/
```

## Running Locally

```bash
pip install brickforge
brickforge  # Starts Flask on port 9000
```

## Key Env Vars (set by config system, not manually)

- `DATABRICKS_HOST` -- workspace URL
- `DATABRICKS_TOKEN` -- PAT or OAuth token
- `DATABRICKS_WAREHOUSE_ID` -- SQL warehouse
- `AGENT_MODEL` -- serving endpoint URL or name
- `PROJECT_GENIE_SPACES` -- comma-separated genie space IDs
- `PROJECT_UNITY_CATALOG_SCHEMA` -- target schema
- `DBX_APP_NAME` -- deployed app name
- `CONFIG_FILE` -- path to active config.json

## Conventions

- Python 3.11+ for agent runtime
- `sys.executable` instead of `uv run python` for subprocess calls
- No notebooks -- code-first only
- Exact pinned versions in requirements.txt -- never unpin or loosen
- Never show file paths or script names in UI text
