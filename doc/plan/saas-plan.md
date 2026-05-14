# BrickForge SaaS Plan

> SINGLE SOURCE OF TRUTH. Do not split. Do not overwrite. Only append.
> Merged from saas-master-plan.md + saas-transition-details.md.

---

## PART 1: Vision & Architecture

### Vision

Transform BrickForge from a locally-cloned project into a cloud-native SaaS product.
The user never clones a repo, never runs a terminal, never installs anything.
They open a browser, create an agent, deploy it. Done.

**BUT:** The user also needs access to the generated code. They must be able to CI/CD it, edit it in an IDE, and own it. The Setup App is a PROJECT GENERATOR, not just a deployer.

### The Core Shift

**BEFORE:** User clones repo -> has all code locally -> runs scripts -> deploys from local machine
**AFTER:** User opens browser -> Setup App does everything -> code never touches user's machine (unless they want it to)

### Setup App = The Product

The visual Setup App (currently `visual/`) IS the product. It:
- Creates and manages `.forge` projects (multi-project: save/load/switch)
- Walks users through domain setup via LLM-assisted wizard
- Provisions UC data (tables, functions, procedures)
- Deploys the Agent App to Databricks
- Generates a git-ready project the user can own
- Runs as a Databricks App itself (or locally for dev)

### 3 Runtime Modes

| Mode | How | Who | Auth |
|------|-----|-----|------|
| **A: Hosted** | Maintainer deploys Setup App once, users open URL | Quick start / demo | Databricks SSO to user's workspace |
| **B: User's DBX App** | User deploys Setup App to their own workspace | Production use | DBX App SP (user's permissions) |
| **C: Local** | `node visual/backend/index.js` | Dev / offline | `.env.local` / CLI profile |

### What Lives Where

| Asset | Location |
|-------|----------|
| Framework code (agent runtime, React frontend, Express API, deploy logic) | Static artifact bundled inside Setup App |
| `.forge` YAML per project | UC Volume in user's workspace |
| Provisioned data (tables, functions, procedures) | User's UC catalog/schema |
| Deployed Agent App | User's Databricks Apps |
| Generated project source (for user CI/CD) | Workspace files (downloadable) |
| User's machine | **Nothing** (unless running local mode C) |

---

## PART 2: Resolved Design Decisions

| Question | Answer |
|----------|--------|
| Hosted mode auth | Databricks SSO -- user authenticates via SSO to their workspace |
| Can DBX App deploy another DBX App? | Yes -- it's just Python code executing from App, calls Apps REST API |
| Local mode | Still supported -- `node visual/backend/index.js`, uses `.env.local` |
| dbc/ courseware | Separated to `forge-dbc` branch -- different project entirely |
| `.forge` storage | UC Volume on user's workspace |
| User writes YAML? | NEVER -- wizard generates it, user only sees UI |
| Tools need custom Python? | NO -- 3 declarative patterns, framework generates code at runtime |
| Notebooks? | STRICTLY PROHIBITED -- code-first only |
| `.env.local` in SaaS? | DOES NOT EXIST -- `.forge` is the config. ConfigProvider abstraction handles both modes. |
| User owns code? | YES -- Setup App generates a project the user can download, edit, CI/CD |

---

## PART 3: .forge YAML

### What It Is
- Internal serialization format -- machine-generated, machine-consumed
- One `.forge` file per project
- User NEVER writes YAML by hand -- the Setup App wizard generates it
- Contains BOTH domain content (tables, SQL, prompts) AND infrastructure config (schema, warehouse, genie IDs)

### What It Contains

**Domain content:**
- Domain description
- Table definitions (DDL, seed data references)
- UC function SQL (inline or sidecar files)
- Stored procedure SQL
- Tool definitions (declarative: 3 patterns)
- System prompt + knowledge base + starter prompts
- KA configurations
- Eval dataset + scorer config
- UI dashboard config

**Infrastructure config (replaces .env.local):**
```yaml
config:
  schema: "catalog.schema"
  app_name: "my-agent-app"
  warehouse_id: "44d9f9e1e0624dfc"
  model:
    endpoint: "databricks-claude-sonnet-4-6"
    token: null
  genie:
    - slug: "checkin"
      space_id: "01f142..."
      enabled: true
  ka:
    - slug: "passengers"
      endpoint: "ka-e0012089-endpoint"
      enabled: true
  vs:
    - slug: "index"
      path: "catalog.schema.index"
      enabled: true
  mcp:
    - slug: "weather"
      url: "https://..."
      header: "Bearer ..."
  api:
    - slug: "inventory"
      connection: "uc-connection-name"
  a2a:
    - slug: "billing"
      url: "https://..."
  features:
    chart: true
  lakebase:
    instance_name: "my-lakebase"
  mlflow:
    experiment_id: "12345"
  data_flags:
    use_default: true
    use_gen: false
```

### Where It's Stored
- UC Volume: `/Volumes/{catalog}/{schema}/brickforge/projects/{name}/`
- Same directory holds sidecar files (CSV, SQL, PDFs) with relative paths
- Local mode: `stash/{name}/` on filesystem

### First Example
`stash/airops/airops.forge` -- extracted from the original airops domain.

---

## PART 4: Stash System

### Structure
```
stash/airops/
  airops.forge          # manifest + config
  tools/                # domain tool Python files
  data/csv/             # seed CSVs
  data/init/            # DDL SQL
  data/func/            # UC function SQL
  data/proc/            # stored procedure SQL
  conf/prompt/          # system prompt, knowledge base, starters
  conf/ka/              # KA configs + PDFs
  eval/                 # eval dataset
  app/components/       # domain React card components
```

### How Stashes Are Created
1. **By extraction** -- airops was extracted from the original codebase (already done)
2. **By the wizard** -- Setup App's LLM-assisted wizard generates new stashes

The airops extraction defined the `.forge` schema by example.

---

## PART 5: The 7 Engineering Challenges

### Challenge 1: Where Does the Code Live?

**Current:** Everything in cloned repo on user's machine.
**Target:** Setup App carries agent bundle. On deploy, generates domain files from `.forge`, uploads to workspace files, calls Apps API.

The agent bundle = `agent/`, `app/`, framework `tools/`, `pyproject.toml`, `requirements.txt`.
Domain files = tools, SQL, prompts, KA configs -- generated from `.forge`.
Everything else (visual/, stash/, deploy/, scripts/) stays on Setup App side.

### Challenge 2: Setup App Backend Shift

**Current:** 50+ subprocess calls to `uv run python` and `bash`.
**Target for Mode B:** Keep Python. DBX Apps have Python. Install uv at startup. All subprocess calls work as-is.
**Target for Modes A/B long-term:** Migrate SDK calls to REST API (incremental).

Backend subprocess categories:
- **Category A (SDK calls):** list warehouses, test connections, etc. Can become REST API.
- **Category B (scripts):** create_all_assets, generate_tables, deploy. Must stay Python.
- **Category C (file ops):** read/write .env.local. Already Node.js.

### Challenge 3: .env.local Eradication

**`.env.local` does not exist in SaaS mode.** The `.forge` file IS the config.

**Scale:** 98 refs in Node.js backend, 272 refs across 32 Python files.

**Solution: ConfigProvider pattern.**
```
ConfigProvider
  ├── LocalConfigProvider (reads .env.local -- local mode C)
  └── ForgeConfigProvider (reads .forge -- SaaS modes A & B)
```

Both implement: `get(key)`, `set(key, value)`, `list()`, `toggle(key)`, `to_env_dict()`.

**Python side needs ZERO changes** -- subprocess env injection already works.
**Node.js side: 36 call sites** to refactor from direct file ops to ConfigProvider.

Migration: pure refactor first (LocalConfigProvider wraps existing functions), then add ForgeConfigProvider.

### Challenge 4: Tool Generation at Runtime

Tools defined as declarative specs in `.forge`. A `tool_factory.py` generates `@tool` functions at startup.
`ka_factory.py` already does this for KA tools. Same pattern for SQL read and action tools.

### Challenge 5: Data Provisioning Without Local Scripts

`create_all_assets.py` currently scans local directories.
In SaaS: reads SQL content from `.forge` sidecar files in UC Volume.
Setup App copies from UC Volume to workspace files at deploy time.
Python scripts get env vars via subprocess injection -- they work without `.env.local`.

### Challenge 6: Agent App Deployment Without DAB CLI

DAB CLI (Go binary) is not pip-installable. Must go DAB-less.

REST API approach:
1. Upload files to workspace files (individual PUT calls, parallelized)
2. Generate `app.yaml` with env vars from `.forge`
3. `POST /api/2.0/apps` to create
4. `POST /api/2.0/apps/{name}/deployments` with source path
5. Run grants via SDK

### Challenge 7: Prompts / Knowledge Base

System prompt in `.forge` (inline or sidecar file).
On deploy, written to agent's `conf/prompt/` in workspace files.
Agent reads from relative paths at startup -- doesn't care where file came from.

---

## PART 6: Setup Blocks -- Stashability Classification

| Block | ID | Classification | In .forge? |
|-------|-----|---------------|-----------|
| Databricks Host | `host` | INFRA | NO -- from DBX App auth context |
| Authentication | `auth` | INFRA | NO -- from DBX App SP |
| SQL Warehouse | `warehouse` | HYBRID | YES -- `config.warehouse_id` |
| Unity Catalog | `schema` | PROJECT | YES -- `config.schema` |
| Data Tables | `tables` | PROJECT | YES -- `data.tables[]` |
| Functions | `functions` | PROJECT | YES -- `data.functions[]` |
| Model Endpoint | `model` | HYBRID | YES -- `config.model.endpoint` |
| Agent Prompt | `prompt` | PROJECT | YES -- `prompt.system` |
| Genie Space | `genie` | PROJECT | YES -- `config.genie[]` |
| Knowledge Assistant | `ka` | PROJECT | YES -- `config.ka[]` |
| Vector Search | `vs` | PROJECT | YES -- `config.vs[]` |
| External MCP | `mcp` | PROJECT | YES -- `config.mcp[]` |
| External API | `api` | PROJECT | YES -- `config.api[]` |
| A2A Agents | `a2a` | PROJECT | YES -- `config.a2a[]` |
| Features | `features` | PROJECT | YES -- `config.features` |
| Lakebase | `lakebase` | HYBRID | YES -- `config.lakebase` |
| MLflow | `mlflow` | PROJECT | YES -- `config.mlflow` |
| Grants | `grants` | PROJECT | N/A -- action, not config |
| Deploy | `deploy` | PROJECT | YES -- `config.app_name` |

---

## PART 7: Inch-by-Inch Execution

### Approach
Start from where we are. Take one step. Hit the wall. Solve the wall. Next step.

### Inch 1: Setup App as DBX App (Mode B)

**What:** Create `app.yaml` for Setup App, startup command installs Python deps + starts Node.
**Key insight:** Upload entire repo as source. Relative paths preserved. Subprocess calls work.
**Walls:**
- `uv` not in DBX App runtime -> `pip install uv && uv sync` in startup command
- Port: need `PORT` env var support (single line fix)
- node_modules + frontend dist already committed (no npm needed)

### Inch 2: Port + Auth

**Port:** `const PORT = process.env.PORT || process.env.VISUAL_PORT || 9000`
**Auth:** Mode B = app's SP inherits user permissions. Same grant pattern as Agent App.

### Inch 3: First Deploy Test

Deploy, open URL, walk through Setup steps. Fix what breaks (uv, Node version, CORS, etc.).

### Inch 4: Config Persistence

`.env.local` ephemeral in DBX App mode. Wizard creates it via Setup steps.
**Short-term:** `.env.local` written at runtime, lost on restart. User must reconfigure.
**Long-term:** ConfigProvider reads/writes `.forge` on UC Volume. Persists across restarts.

### Inch 5: DAB-less Agent Deploy

Replace `deploy.sh` (DAB CLI) with `deploy_via_api.py` (REST API).
Upload source to workspace files -> generate `app.yaml` -> call Apps API -> grants.

### Inch 6: Agent App File Manifest

Define exactly which files are Agent App vs Setup App. Agent App gets: `agent/`, `app/`, `tools/`, `data/`, `conf/`, `eval/`, `pyproject.toml`, `requirements.txt`, generated `app.yaml`.

### Inch 7: .forge Config Injection

Setup App generates `app.yaml` for Agent App with all env vars from `.forge`.
Domain files (prompts, SQL, tools) written to workspace files before deploy.

### Inch 8: Multi-Project (later)

Save/load/switch `.forge` projects on UC Volume. Per-project schema isolation.

---

## PART 8: Open Questions -- All Answered

### A. Setup App Deployment

| # | Question | Answer | Status |
|---|----------|--------|--------|
| A1 | Where does Setup App's `app.yaml` live? | Root. Current `app.yaml` (Agent App) gets renamed to `agent-app.yaml`. Setup App `app.yaml` goes at root. | DECIDED |
| A2 | Upload entire repo or subset? | Entire repo. Relative paths preserved, subprocess calls work. Exclude `.git/`, `stash/` via `.databricksignore`. | DECIDED |
| A3 | Is `uv` available in DBX App runtime? | Assume no. Startup command: `pip install uv && uv sync && node visual/backend/index.js` | NEEDS TESTING |
| A4 | Node.js version in DBX App runtime? | NEEDS TESTING on first deploy. | NEEDS TESTING |
| A5 | Is `npm` available for Agent App `npm run build:client`? | NEEDS TESTING on first deploy. | NEEDS TESTING |
| A6 | Exact `PORT` env var behavior? | NEEDS TESTING. Fix is trivial: `process.env.PORT \|\| 9000`. | NEEDS TESTING |

### B. Config Persistence

| # | Question | Answer | Status |
|---|----------|--------|--------|
| B1 | Config persistence strategy? | `.forge` on UC Volume IS the persistence. No `.env.local` in SaaS. ConfigProvider reads `.forge`, hydrates env vars. | DECIDED |
| B2 | Can DBX App set its own env vars at runtime? | Irrelevant -- `.forge` on UC Volume is the persistence, not app env vars. | N/A |
| B3 | How to restore on restart? | Startup reads `.forge` from UC Volume, hydrates process.env via ForgeConfigProvider. | DECIDED |
| B4 | Mode A (hosted): user workspace credentials? | Databricks SSO. | DECIDED |

### C. Agent App Deployment

| # | Question | Answer | Status |
|---|----------|--------|--------|
| C1 | Exact REST API for workspace file upload? | Workspace Files API or `PUT /api/2.0/workspace/import`. Verify exact endpoint on implementation. | NEEDS VERIFICATION |
| C2 | Does Apps API accept workspace file path? | Verify on implementation. | NEEDS VERIFICATION |
| C3 | Parallel file upload rate limits? | Test on implementation. 50-100 small files should be fine. | NEEDS TESTING |
| C4 | DAB CLI Go binary pip-installable? | No. Confirmed: must use REST API (DAB-less deploy). | CONFIRMED |
| C5 | Can Setup App SP grant to Agent App SP? | SP can grant UC permissions via SDK. Same pattern as existing grant scripts. Verify on implementation. | NEEDS VERIFICATION |

### D. Stash Format & Loading

| # | Question | Answer | Status |
|---|----------|--------|--------|
| D1 | Inline vs sidecar? | Sidecar files, same structure as local stash. | DECIDED |
| D2 | UC Volume path convention? | `/Volumes/{catalog}/{schema}/brickforge/{project_name}/` | DECIDED |
| D3 | What catalog/schema for stash Volume? | The project's own catalog.schema. User picks it in Schema setup step. | DECIDED |
| D4 | How does wizard write to UC Volume? | Python subprocess via `volume_ops.py` (already exists for KA doc upload). Same pattern for all Volume writes. | DECIDED |
| D5 | Copy to workspace files or agent reads Volume directly? | Copy to workspace files at deploy time. Agent reads local relative paths at runtime -- same as today. | DECIDED |
| D6 | Developer mode: `.forge` abandoned? | Yes. `.forge` is the seed. Once exported, code is source of truth. User deploys via own CI/CD. Setup App optional from that point. | DECIDED |

### E. Tool Generation

| # | Question | Answer | Status |
|---|----------|--------|--------|
| E1 | `tool_factory.py` exists? | No. Only `ka_factory.py`. Need to build `tool_factory.py` for SQL read + action patterns. | TO BUILD |
| E2 | Can ALL tools be declarative? | 95% yes (3 patterns). Custom logic tools: user writes Python, puts in `tools/`. Both coexist via `_discover_domain_tools()`. | DECIDED |
| E3 | `.forge`-aware tool discovery? | Both paths coexist. File-based (`_discover_domain_tools()` scans `tools/`) + `.forge`-based (`_discover_forge_tools()` reads specs). Agent uses both. | DECIDED |

### F. Frontend

| # | Question | Answer | Status |
|---|----------|--------|--------|
| F1 | Frontend rebuild after domain card load? | Not needed. Generic renderers driven by config. No domain TSX imports. Registry populated at startup from config. | DECIDED |
| F2 | Pre-build all card types as generic renderers? | Yes. `GenericTableCard`, `GenericMetricCard`, `GenericStatusCard` driven by `.forge` `ui:` config. Airops-specific cards in stash become legacy. | DECIDED |
| F3 | Dashboard config end-to-end tested? | Not yet. Test when implementing. | NOT TESTED |

### G. User Code Access & CI/CD

| # | Question | Answer | Status |
|---|----------|--------|--------|
| G1 | How does user download generated project? | Workspace files accessible via `databricks workspace export-dir`. Or Setup App provides "Download project" button (zip + serve). | DECIDED |
| G2 | Does Setup App know when user edits externally? | No, and doesn't need to. Once exported, user owns it. Setup App manages `.forge`; exported code is independent. | DECIDED |
| G3 | GitHub repo creation from Setup App? | Stretch goal. Requires GitHub token/OAuth. Not now. | STRETCH |
| G4 | CI/CD story? | User's own pipeline. Generated project is a standard DBX App -- deploy with any CI/CD tool. BrickForge doesn't provide CI/CD. | DECIDED |

### H. Multi-Project

| # | Question | Answer | Status |
|---|----------|--------|--------|
| H1 | Multi-project coexistence? | Separate UC schema per project, separate Agent App instance, shared Setup App. `.forge` files in separate directories on UC Volume. | DECIDED |
| H2 | Project list? | Scan UC Volume `/Volumes/{catalog}/{schema}/brickforge/` for subdirectories containing `.forge` files. | DECIDED |
| H3 | Project deletion? | Delete Agent App (Apps API), drop UC tables (or schema), delete `.forge` directory from UC Volume, remove MLflow experiment. Existing cleanup tab handles most of this. | DECIDED |

**Total: 31 questions. 25 DECIDED. 4 NEEDS TESTING (first deploy). 2 NEEDS VERIFICATION (API details). 1 TO BUILD.**

---

## PART 9: Current State

- [x] Domain extraction complete (stash/airops/)
- [x] `.forge` manifest exists (airops.forge)
- [x] Agent dynamic tool discovery (`_discover_domain_tools()`)
- [x] Agent lazy WorkspaceClient init (no SDK call at import time)
- [x] KA tool factory (`ka_factory.py`)
- [x] Dynamic Genie/KA env var discovery
- [x] Frontend domain plugin registry
- [x] Graph builder auto-discovers from filesystem
- [x] Deploy pipeline dynamic (no hardcoded keys)
- [x] Setup App pre-built frontend (no npm needed)
- [x] Setup App single-server mode (port 9000)
- [x] Nuclear scan: zero domain references in framework
- [x] Git checkpoint: tag `pre-saas-transition` on branch `forge-saas-databricks`
- [x] dbc/ courseware isolated to `forge-dbc` branch
