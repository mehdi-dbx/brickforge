# BrickForge -- Getting Started Guide

A complete guide for new users: what BrickForge is, how to set it up from scratch, how to deploy, and how to make it your own.

---

## What you get

BrickForge ships a **production-ready agentic Databricks application** you can interact with from day one.

You open a browser, authenticate, and talk to an AI agent in natural language. The agent understands your domain, uses live data, and takes actions -- not just answering questions.

What the agent can do out of the box (flight operations reference app):

- **Query live data** -- "Which flights are at risk in terminal 2 in the next 90 minutes?" -- the agent pulls from Unity Catalog via SQL warehouse.
- **Explore data in natural language** -- Genie MCP turns free-form questions into SQL. Ask anything about your tables.
- **Take operational actions** -- "Mark BA312 as AT_RISK." -- the agent calls a stored procedure and confirms the change.
- **Answer from documents** -- the Knowledge Assistant responds grounded in your PDFs, citing sources verbatim.

The chat UI includes a live data panel that refreshes as the agent acts. Flight risk status updates in real time -- no page reload. The agent and the dashboard are in sync.

---

## Prerequisites

- Python 3.11+ with [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Node.js 18+ (for the chat app and visual app)
- A Databricks workspace with Unity Catalog enabled
- Databricks CLI configured (`databricks auth login`)

---

## Step 1 -- Clone and install

```bash
git clone https://github.com/mehdi-dbx/brickforge.git
cd brickforge
uv sync
./run install   # one-time: add repo root to PATH
```

---

## Step 2 -- Configure environment

```bash
./run setup
```

This interactive script walks you through everything:

- Detects or prompts for your Databricks host, warehouse, model endpoint, Unity Catalog schema
- Validates that each resource actually exists and is reachable
- Warns if your FM workspace flavor (Azure vs AWS) does not match, which would cause IP ACL blocks
- Writes `.env.local` with all required vars
- Optionally configures cross-workspace model endpoints, Genie spaces, KA endpoints, MLflow experiment IDs

To check current status without making changes:

```bash
./run setup --check
```

---

## Step 3 -- Provision data

```bash
uv run python data/init/create_all_assets.py
```

This creates everything the agent needs:

- Unity Catalog schema
- Delta tables (from `data/default/csv/` and optionally `data/gen/csv/`)
- UC functions (from `data/default/func/`)
- Stored procedures (from `data/default/proc/`)
- Genie space
- MLflow experiment

The script auto-discovers CSV files and matches them to DDL scripts -- no manual edits needed to add a table.

---

## Step 4 -- Run locally

```bash
bash scripts/sh/start_local.sh
```

This boots three services:

| Service | Port | What it does |
|---------|------|-------------|
| MLflow AgentServer | 8000 | LangGraph agent + tool execution |
| Express API | 3001 | Auth proxy, session management |
| React frontend | 3000 | Streaming chat UI |

---

## Step 5 -- Deploy

```bash
./run deploy
```

The full pipeline runs without manual steps:

1. Loads and validates `.env.local`
2. Syncs env vars into `databricks.yml` (no manual YAML editing)
3. Checks for PLACEHOLDER values -- aborts if any remain
4. Validates Python imports and bundle config
5. Detects workspace changes -- clears stale DAB state automatically if you switched workspaces
6. Binds or creates the Databricks App
7. Deploys the bundle
8. Grants UC table access, SQL warehouse access, and secret scope access to the app service principal

The React frontend is built remotely at app startup -- you never pre-build or commit compiled assets. First startup takes ~1-2 min; subsequent restarts are fast.

---

## How the stack fits together

```
scripts/          Setup, local dev, KA management
    |
    v
data/             Seed CSVs, DDL, UC functions, stored procedures
    |
    v
tools/            @tool functions the agent can call (SQL read, action, KA)
    |
    v
agent/            LangGraph agent + MLflow AgentServer + system prompt
    |
    v
app/              React frontend + Express API (built remotely on deploy)
    |
    v
deploy/           DAB pipeline: validate -> sync -> deploy -> grants
```

### Key directories

| Directory | Contents |
|-----------|----------|
| `data/default/csv/` | Seed data (auto-discovered) |
| `data/default/init/` | DDL SQL for tables |
| `data/default/func/` | UC function definitions (used by tools) |
| `data/default/proc/` | Stored procedure definitions |
| `data/gen/` | Synthetic data generation (LLM-powered wizard) |
| `data/init/` | Orchestrators: `create_all_assets.py`, `create_catalog_schema.py` |
| `data/py/` | Low-level SQL runners and CSV-to-Delta loader |
| `tools/` | One file per tool, three patterns (SQL read, action, KA) |
| `agent/` | `agent.py` (wires tools + model + Genie MCP), `start_server.py` |
| `conf/prompt/` | System prompt, knowledge base, user starter prompts |
| `conf/ka/` | Knowledge Assistant YAML configs |
| `app/client/` | React + Vite frontend |
| `app/server/` | Express.js backend (auth proxy) |
| `deploy/` | `deploy.sh`, config sync, grant scripts |
| `visual/` | Architecture viz + setup + data gen + cleanup UI (port 9000) |
| `eval/` | MLflow eval pipeline with custom LLM judge |

---

## Make it yours

### Add your own data

1. Drop a CSV in `data/default/csv/<table_name>.csv`
2. Write DDL at `data/default/init/create_<table_name>.sql` (use `__SCHEMA_QUALIFIED__` placeholder)
3. Run `uv run python data/py/run_sql.py data/default/init/create_<table_name>.sql`

`create_all_assets.py` auto-discovers both files -- no script modification needed.

Or use the **Data Gen wizard** in the visual app (port 9000, Data tab) to generate synthetic tables with an LLM.

### Add your own tools

Three patterns are supported:

| Pattern | When to use | Source |
|---------|------------|--------|
| **SQL read** | Query warehouse via a UC function | `data/default/func/` |
| **Action** | Call a stored procedure | `data/default/proc/` |
| **KA** | HTTP POST to a Knowledge Assistant endpoint | `conf/ka/` |

Each tool is one `@tool`-decorated function in `tools/<tool_name>.py`. Register it in `agent/agent.py` with one import and one list entry.

### Add a Knowledge Assistant

1. Write `conf/ka/ka_<slug>.yml` -- display name, instructions, knowledge sources
2. Dry-run: `uv run python scripts/py/ka/create_kas_from_yml.py conf/ka/ka_<slug>.yml --dry-run`
3. Deploy: `uv run python scripts/py/ka/create_kas_from_yml.py conf/ka/ka_<slug>.yml`
4. The endpoint is written to `.env.local` automatically as `PROJECT_KA_<SLUG>`
5. Wire it as an agent tool using the KA pattern

### Evaluate and improve

The MLflow eval pipeline (`eval/run_eval.py`) measures answer quality:

- A curated test dataset scored by a custom LLM judge (`cites_regulation_precisely`)
- Two-run workflow: baseline -> change KA guideline -> second run -> compare in MLflow UI

### Reset and iterate

```bash
./run reset-workspace
```

Drops tables, procedures, functions, Genie space, and MLflow experiment -- without touching Unity Catalog or Knowledge Assistants. Use this to start fresh in the same workspace.

---

## Command reference

| Command | What it does |
|---------|-------------|
| `./run install` | Add repo root to PATH (once after cloning) |
| `./run setup` | Interactive Databricks env setup |
| `./run setup --check` | Check current config status |
| `./run deploy` | Full deploy pipeline |
| `./run deploy --dry-run` | Dry-run deploy (validate only) |
| `./run reset-workspace` | Delete workspace resources, keep catalog + KA |
| `bash scripts/sh/start_local.sh` | Start local dev stack (8000 / 3001 / 3000) |
| `cd visual && bash start.sh` | Start visual app (9000) |
| `uv run python data/init/create_all_assets.py` | Provision all data layer resources |

---

## Claude Code skills

If you use Claude Code, these skills automate common workflows:

| Skill | What it does |
|-------|-------------|
| `/forge-setup` | Full guided setup, step by step |
| `/forge-deploy` | Deploy to Databricks Apps |
| `/forge-add-tool` | Create and register a new agent tool |
| `/forge-add-data` | Add a synthetic dataset + Delta table |
| `/forge-add-ka` | Create and deploy a Knowledge Assistant |
| `/dbx-eval` | Run the MLflow evaluation pipeline |
| `/forge-manual` | Load docs and recap what BrickForge can do |

---

## Further reading

| File | Contents |
|------|----------|
| `docs/agent-forge_overview.md` | Full component-by-component reference |
| `conf/.env.example` | All environment variable definitions |
| `conf/ka/ka_passengers.yml` | Example KA configuration |
| `app/CLAUDE.md` | Frontend conventions and commands |
