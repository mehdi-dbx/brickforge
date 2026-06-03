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
- Node.js 18+ (for the chat app; optional for visual app since it's pre-built)
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

### Option A: Visual Setup App (recommended)

```bash
node visual/backend/index.js
```

Opens at **http://localhost:9000**. No npm install needed -- the frontend is pre-built and the backend node_modules are committed. Walk through each setup step interactively with live validation and one-click provisioning.

### Option B: CLI setup

```bash
./run setup
```

Interactive script that walks through every required env var. To check current status:

```bash
./run setup --check
```

Both options write `.env.local` with all required vars: Databricks host, token, warehouse, Unity Catalog schema, model endpoint, Genie spaces, KA endpoints, MLflow experiment.

---

## Step 3 -- Provision data

```bash
uv run python data/init/create_all_assets.py
```

This creates everything the agent needs:

- Unity Catalog schema
- Delta tables (from `data/demo/csv/` and optionally `data/gen/csv/`)
- UC functions (from `data/demo/func/`)
- Stored procedures (from `data/demo/proc/`)
- Genie space
- MLflow experiment

The script auto-discovers CSV files and matches them to DDL scripts -- no manual edits needed to add a table.

Or provision directly from the **Visual Setup App** (Setup tab > "create all assets" step).

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

## Visual Setup App

The visual app (`http://localhost:9000`) provides a full graphical interface for managing BrickForge. No npm install required -- just run `node visual/backend/index.js`.

### Tabs

| Tab | What it does |
|-----|-------------|
| **Setup** | Step-by-step DAG of all config steps with live validation, test buttons, and one-click provisioning |
| **Data** | View existing tables with source badges (default/generated), or launch the LLM-powered data gen wizard |
| **Docs** | Manage Knowledge Assistant documents -- upload PDFs to UC Volumes |
| **Architecture** | React Flow canvas showing the live agent architecture (lazy-loaded, with refresh button) |
| **Cleanup** | Select and delete workspace resources (validated against live state) |

### Multi-instance support

Genie spaces, Knowledge Assistants, and Vector Search indexes support multiple instances:

- **Toggle** -- enable/disable individual instances (comments/uncomments env var in `.env.local`)
- **Global toggle** -- enable/disable all instances of a type at once
- **Add (+)** -- add a new instance via the setup drawer

### Data generation wizard

The Data tab has a "generate" mode with a multi-step wizard:

1. **Domain** -- describe your use case in natural language
2. **Schema** -- LLM generates table schemas, user reviews/edits
3. **Data** -- per-table row generation with preview, approve/reject/regenerate
4. **Provision** -- create tables in Databricks

Generated files are isolated in `data/gen/` and gitignored.

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
| `data/demo/csv/` | Seed data (auto-discovered) |
| `data/demo/init/` | DDL SQL for tables |
| `data/demo/func/` | UC function definitions (used by tools) |
| `data/demo/proc/` | Stored procedure definitions |
| `data/gen/` | Synthetic data generation (LLM-powered wizard) |
| `data/init/` | Orchestrators: `create_all_assets.py`, `create_catalog_schema.py` |
| `data/py/` | Low-level SQL runners and CSV-to-Delta loader |
| `tools/` | Tool files + `ka_factory.py` (dynamic KA tool discovery) |
| `agent/` | `agent.py` (wires tools + model + multi-Genie MCP), `start_server.py` |
| `conf/prompt/` | System prompt, knowledge base, user starter prompts |
| `conf/ka/` | Knowledge Assistant YAML configs |
| `app/client/` | React + Vite frontend |
| `app/server/` | Express.js backend (auth proxy) |
| `deploy/` | `deploy.sh`, config sync, grant scripts |
| `visual/` | Setup + data gen + cleanup + architecture UI (port 9000) |
| `eval/` | MLflow eval pipeline with custom LLM judge |
| `edu/` | Static HTML slide deck (open `edu/index.html` in browser) |
| `doc/` | Guide, reference docs, assets |

---

## Agent architecture

The agent dynamically discovers all configured resources at startup:

- **Genie MCP** -- loops over all `PROJECT_GENIE_*` env vars, registers an MCP server per space
- **Knowledge Assistants** -- `tools/ka_factory.py` discovers all `PROJECT_KA_*` env vars, auto-creates `@tool` functions
- **Vector Search** -- reads `PROJECT_VS_INDEX` for semantic document retrieval via MCP
- **SQL tools** -- UC functions called via SQL warehouse
- **Action tools** -- stored procedures called via SQL warehouse

Tool patterns are declarative:

| Pattern | When to use | Source |
|---------|------------|--------|
| **SQL read** | Query warehouse via a UC function | `data/demo/func/` |
| **Action** | Call a stored procedure | `data/demo/proc/` |
| **KA** | Query a Knowledge Assistant endpoint | auto-discovered from `PROJECT_KA_*` |

---

## Make it yours

### Add your own data

1. Drop a CSV in `data/demo/csv/<table_name>.csv`
2. Write DDL at `data/demo/init/create_<table_name>.sql` (use `__SCHEMA_QUALIFIED__` placeholder)
3. Run `uv run python data/py/run_sql.py data/demo/init/create_<table_name>.sql`

`create_all_assets.py` auto-discovers both files -- no script modification needed.

Or use the **Data Gen wizard** in the visual app (Data tab) to generate synthetic tables with an LLM.

### Add your own tools

Tools are auto-discovered for KA endpoints. For SQL tools, each is one `@tool`-decorated function in `tools/<tool_name>.py`. Register it in `agent/agent.py` with one import and one list entry.

### Add a Knowledge Assistant

1. Write `conf/ka/ka_<slug>.yml` -- display name, instructions, knowledge sources
2. Dry-run: `uv run python scripts/py/ka/create_kas_from_yml.py conf/ka/ka_<slug>.yml --dry-run`
3. Deploy: `uv run python scripts/py/ka/create_kas_from_yml.py conf/ka/ka_<slug>.yml`
4. The endpoint is written to `.env.local` automatically as `PROJECT_KA_<SLUG>`
5. The KA factory auto-discovers it at agent startup -- no manual wiring needed

### Add a Genie space

Create a new Genie space via the visual app (Setup tab > genie step > "create new room") or manually:

```bash
GENIE_ROOM_NAME="My Space" uv run python data/init/create_genie_space.py
```

The env var `PROJECT_GENIE_<SLUG>` is written automatically. The agent discovers all `PROJECT_GENIE_*` vars at startup.

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

## Stash system

BrickForge separates **framework** (the engine) from **domain** (the content). All domain-specific assets live in a **stash** -- a self-contained folder with a `.forge` YAML manifest.

### What's in a stash

```
stash/airops/
  airops.forge          # manifest: tables, prompts, tools, KAs, eval
  csv/                  # seed data
  func/                 # UC function SQL
  proc/                 # stored procedure SQL
  ka/                   # KA configs + PDFs
  eval/                 # eval dataset + scorer config
```

The `.forge` YAML is the source of truth. Sidecar files (CSVs, PDFs, large SQL) sit alongside it.

### How stashes are created

1. **By extraction** -- the airops domain was extracted from the original codebase to define the `.forge` schema
2. **By the wizard** -- the Setup App's LLM-assisted wizard generates new stashes from a domain description (tables, prompts, tools, KAs, eval -- all generated)

The `.forge` schema is defined by what airops needed. Every future stash follows the same format.

### UI templates in `.forge`

The chat app's dashboard cards, status badges, and starter prompts are **generic styled components** driven by the `.forge` config -- not hardcoded to any domain.

The `.forge` YAML includes a `ui:` section:

```yaml
ui:
  dashboard:
    - type: status-table
      title: "Fleet Status"
      source: flights
      columns: [flight_number, status, zone, gate]
      status_field: risk_status
      status_colors:
        AT_RISK: red
        NORMAL: green
    - type: metric-card
      title: "Check-in Rate"
      source: checkin_metrics
      value_field: rate
      format: percentage
  starters:
    - "Which flights are at risk?"
    - "Show check-in performance for BA312"
```

The framework provides reusable card types (`status-table`, `metric-card`, `kpi-badge`, etc.) with consistent styling. The `.forge` config fills them with domain-specific content. The wizard LLM generates the `ui:` section based on the domain description and table schemas.

### Card configurator

The Setup App includes a visual card configurator -- no code, no CSS, no React:

1. **Wizard proposes cards** -- during project creation, the LLM sees table schemas and suggests a dashboard layout ("you have a flights table with a status column -- here's a status-table card")
2. **User previews and tweaks** -- see a live preview, adjust labels, reorder columns, pick status colors from a palette, add/remove/reorder cards
3. **Stored in `.forge`** -- the `ui:` section is just YAML config, revisitable anytime in the Setup App
4. **Rendered at runtime** -- the Agent App reads the `ui:` config on startup, maps card types to framework components, and renders with the configured data

Available card types: `status-table`, `metric-card`, `kpi-badge`, and more. Each has built-in styling. The user only controls what data fills them.

This means:
- **Framework stays beautiful** -- card components, styling, animations are in the engine
- **Domain is config** -- what data to show, what columns, what colors are in the stash
- **New projects get cards automatically** -- wizard generates the UI schema, user previews and tweaks in the card configurator

### Loading a stash

The Setup App loads a stash, provisions its data to Unity Catalog, configures the agent, and deploys. Users can save, load, and switch between multiple stash projects.

---

## Testing features from the UI

### Chat with the agent
1. Start the local dev stack: `bash scripts/sh/start_local.sh`
2. Open `http://localhost:3000`
3. Type a question and hit enter -- the agent streams a response in real time
4. Ask a data question ("show me flights at risk") -- the agent calls SQL tools and returns structured results

### Chart visualization
1. Ensure `PROJECT_TOOL_CHART=true` in `.env.local`
2. In the chat, ask: "Show me a bar chart of flights by terminal"
3. The agent calls `generate_chart` and an interactive Recharts chart renders inline
4. Click the area/line/bar/pie buttons to switch chart type
5. Hover for tooltips

### Voice input (speech-to-text)
1. Set `PROJECT_TOOL_VOICE=true` and `OPENAI_API_KEY=sk-...` in `.env.local`
2. Restart the chat app
3. A microphone icon appears next to the send button
4. Click mic -- animated bars appear, browser requests microphone permission
5. Speak your question, click mic again to stop
6. Audio is transcribed via OpenAI Whisper and auto-submitted as a text message
7. If `PROJECT_TOOL_VOICE` is toggled off or `OPENAI_API_KEY` is missing, the mic button is hidden

### Chat history (persistent conversations)
1. Configure Lakebase in the visual app (Setup > lakebase step > create instance)
2. Restart the chat app -- sidebar shows "Your conversations will appear here"
3. Start chatting -- conversations are saved to Lakebase
4. Refresh the page or return later -- previous conversations appear in the sidebar grouped by date
5. Click a past conversation to resume it
6. Right-click or hover for rename/delete
7. Without Lakebase, sidebar shows "Chat history is disabled" and conversations are ephemeral

### Genie space (natural language SQL)
1. Configure at least one Genie space in the visual app (Setup > genie step)
2. In the chat, ask a free-form data question: "What are total check-ins by airline?"
3. The agent routes to Genie MCP, which translates to SQL and returns results
4. Generated SQL is captured in `data/genie-capture-sql/` for audit

### Knowledge Assistant (document Q&A)
1. Upload PDFs in the visual app (Setup > KA step > provision from PDFs)
2. Wait for the KA endpoint to become ACTIVE
3. In the chat, ask a question about the uploaded documents
4. The agent calls the KA tool and returns an answer with source citations

### Feature toggles (visual app)
1. Start the visual app: `node visual/backend/index.js`
2. Open `http://localhost:9000`, go to the Setup tab
3. Scroll to the **features** block -- shows chart, voice, and any future toggles
4. Click the Power icon on an instance to toggle it on/off (writes to `.env.local`)
5. Click the instance row to see details + test button
6. For voice: paste an OpenAI API key, click "Save & Test" -- validates against OpenAI API

### Multi-instance resources
1. Genie, KA, Vector Search, MCP, API, and A2A blocks all support multiple instances
2. Click "+" on any block to add a new instance
3. Each instance has its own Power toggle (enable/disable individually)
4. The main block has a global Power toggle (enable/disable all at once)
5. Changes are written to `.env.local` as `PROJECT_<TYPE>_<SLUG>=<value>`

### Evaluation pipeline
1. Ensure MLflow experiment is configured (Setup > mlflow step)
2. Run: `uv run python eval/run_eval.py`
3. Two runs execute: baseline vs with-guideline
4. Open MLflow UI to compare results side by side

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
| `node visual/backend/index.js` | Start visual app (9000, no npm needed) |
| `uv run python data/init/create_all_assets.py` | Provision all data layer resources |

---

## Claude Code skills

If you use Claude Code, these skills automate common workflows:

| Skill | What it does |
|-------|-------------|
| `/forge-setup` | Full guided setup, step by step |
| `/forge-deploy` | Deploy to Databricks Apps |
| `/forge-ui` | Start the visual setup app |
| `/forge-add-tool` | Create and register a new agent tool |
| `/forge-add-data` | Add a synthetic dataset + Delta table |
| `/forge-add-ka` | Create and deploy a Knowledge Assistant |
| `/dbx-eval` | Run the MLflow evaluation pipeline |
| `/forge-manual` | Load docs and recap what BrickForge can do |

---

## Further reading

| File | Contents |
|------|----------|
| `doc/reference/agent-forge_overview.md` | Full component-by-component reference |
| `doc/reference/known-issues.md` | Known issues and gotchas |
| `doc/reference/genie-permissions-api.md` | Genie permissions API reference |
| `conf/.env.example` | All environment variable definitions |
| `conf/ka/ka_passengers.yml` | Example KA configuration |
| `app/CLAUDE.md` | Frontend conventions and commands |
| `edu/index.html` | Educational slide deck (open in browser) |
