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
| Tools need custom Python? | NO -- 7 declarative patterns, framework generates code at runtime via factories |
| Notebooks? | STRICTLY PROHIBITED -- code-first only |
| `.env.local` in SaaS? | DOES NOT EXIST -- `.forge` is the config. ConfigProvider abstraction handles both modes. |
| User owns code? | YES -- Setup App generates a project the user can download, edit, CI/CD |
| DAB / Asset Bundles | PRESERVED -- `databricks.yml` + `app.yaml` are Databricks standards, part of every project stash |
| Resource creation vs deployment | Resources (tables, functions, genie, KA) via SDK. Deployment via DAB. Two separate steps. |

---

## PART 2b: Databricks Platform Alignment

This project needs to be validated by Databricks internal authorities. It must align with corporate guidelines and be as close to a Databricks product as possible.

### Standards Followed

| Databricks Standard | How BrickForge Uses It |
|---------------------|----------------------|
| **Databricks Asset Bundles (DAB)** | `databricks.yml` defines bundle config, resources, targets. Generated per project from `.forge`. Used for deployment. |
| **app.yaml** | Databricks Apps runtime manifest. Defines startup command, env vars. Generated per project from `.forge`. |
| **Unity Catalog** | All data assets (tables, functions, procedures, volumes) in UC. Schema per project. |
| **Databricks Apps** | Both Setup App and Agent App deploy as Databricks Apps. Standard SP auth model. |
| **Genie Spaces** | Agent uses Genie via MCP. Space IDs in `.forge` config, bound as DAB resources. |
| **Knowledge Assistants** | KA endpoints provisioned via SDK. Endpoint names in `.forge` config. |
| **Model Serving** | Foundation Model API endpoints. Bound as DAB serving_endpoint resources. |
| **MLflow** | Experiment tracking for eval pipeline. Bound as DAB experiment resource. |
| **Databricks SDK (Python)** | All API calls use official `databricks-sdk`. No raw REST calls where SDK exists. |
| **UC Volumes** | Stash storage, KA document storage, CSV seed data. |
| **Secrets** | Cross-workspace tokens stored in Databricks Secrets scope. |

### What We Do NOT Do

- No custom auth mechanisms -- use Databricks SSO / SP / CLI profiles
- No custom deployment pipelines -- use DAB
- No custom resource management -- use UC + SDK
- No notebooks -- code-first, but all code follows Databricks SDK patterns

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
- Tool definitions (declarative: 7 patterns)
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

**Single zip archive per project.** Not scattered files.

| Mode | Path | Format |
|------|------|--------|
| SaaS (A/B) | `/Volumes/{catalog}/{schema}/brickforge/stash/airops.forge.zip` | Zip archive |
| Local (C) | `stash/airops/` on filesystem (unzipped for dev convenience) | Directory |

**What's IN the archive:** `.forge` YAML, SQL files, prompts, tool specs, KA configs, `app.yaml`, `databricks.yml` -- all small text files. Typically under 1MB compressed.

**What's NOT in the archive:** PDFs (stay in UC Volume, referenced by path in the manifest), large datasets (already in UC tables as Delta).

**How it works:**
1. Download one zip from UC Volume (single API call: `w.files.download()`)
2. Open in memory (`zipfile.ZipFile(io.BytesIO(bytes))` in Python, `AdmZip(buffer)` in Node)
3. Read any file on demand -- no disk extraction
4. When saving: update entries in memory, upload zip back (single API call: `w.files.upload()`)

**Why zip over scattered files:**
- One file = one project. Dead simple to copy, share, backup, version
- Atomic: it's there or it's not (no partial uploads)
- Single API call to load, single call to save
- Under 1MB -- trivially fast
- In-memory access: zero disk I/O, zero temp files

**Implementation:** Python `zipfile` (stdlib, zero deps, 20+ years battle-tested). Node.js `adm-zip` (50KB, zero transitive deps). Rock solid, dead simple.

### First Example
`stash/airops/airops.forge` -- extracted from the original airops domain. Currently a directory; will be archived to `airops.forge.zip` for UC Volume storage.

---

## PART 4: Stash System

### Structure
```
stash/airops/
  airops.forge          # manifest + config
  app.yaml              # Agent App runtime manifest (template, populated from .forge config)
  databricks.yml        # DAB bundle config (template, populated from .forge config)
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

`app.yaml` and `databricks.yml` are part of the stash because they are Databricks platform deployment artifacts. The Setup App generates project-specific versions by injecting `.forge` config values into these templates at deploy time.

### How Stashes Are Created
1. **By extraction** -- airops was extracted from the original codebase (already done)
2. **By the wizard** -- Setup App's LLM-assisted wizard generates new stashes

The airops extraction defined the `.forge` schema by example.

### Loading a Stash -- Verification & Integrity Check

When a `.forge` bundle is loaded (from UC Volume, local stash, or wizard output), the system MUST verify every piece before proceeding.

**Core rule: if the manifest declares it, the file must exist. If the manifest doesn't declare it, it doesn't need to exist.** The verification checks what the manifest REFERENCES, not a fixed checklist.

**Step 1: Parse `.forge` manifest**
- Validate YAML syntax
- Check `forge:` version field exists
- Check all required sections present (data, tools, prompt, config)

**Step 2: Verify sidecar files exist**
For each reference in the manifest, check the file is actually there:

| Manifest Section | Expected Files | Check |
|-----------------|----------------|-------|
| `data.tables[].ddl` | `data/init/create_*.sql` | File exists, contains `CREATE` |
| `data.tables[].seed` | `data/csv/*.csv` | If declared in manifest: must exist. Not all tables need seed CSV (DDL-only or existing UC tables OK). |
| `data.functions[]` | `data/func/*.sql` | File exists |
| `data.procedures[]` | `data/proc/*.sql` | File exists |
| `tools[].file` | `tools/*.py` | File exists, contains `@tool` |
| `prompt.system` | `conf/prompt/main.prompt` | File exists |
| `prompt.knowledge_base` | `conf/prompt/knowledge.base` | File exists (can be empty) |
| `prompt.starters` | `conf/prompt/user.prompt` | File exists (can be empty) |
| `knowledge_assistants[].config` | `conf/ka/*.yml` | If declared in manifest: must exist. If no KA section in manifest, not needed. |
| `eval.dataset` | `eval/data/*.jsonl` | File exists (optional section) |

**Step 3: Report status**
Output a clear report:
```
[+] airops.forge -- valid YAML, version 1.0
[+] data/csv/flights.csv -- found (5 rows)
[+] data/init/create_flights.sql -- found (CREATE TABLE)
[x] data/func/missing_function.sql -- NOT FOUND
[+] conf/prompt/main.prompt -- found (211 lines)
[!] eval/data/dataset.jsonl -- not found (optional, eval won't work)
```

**Step 4: Suggest fixes for missing assets**
- Missing CSV (declared in manifest): "Generate seed data via Data Gen wizard, or remove the `seed:` reference from the manifest if table already exists in UC."
- Missing SQL: "Generate from table schema using the Routines wizard"
- Missing prompt: "Generate from domain description using the Prompt wizard"
- Missing KA config (declared in manifest): "Provide the KA YAML, or pick an existing KA endpoint from the workspace and update the manifest's `knowledge_assistants[].config` accordingly."
- Missing tool file: "Tool will be auto-generated from declarative spec at runtime (if pattern is sql_read/action/ka/api/a2a/mcp/chart)"

**Step 5: Provision check (live workspace verification)**
After loading files, optionally verify against the live Databricks workspace:
- Do the UC tables exist? If not -> offer to provision
- Do the UC functions exist? If not -> offer to create
- Is the Genie space accessible? If not -> offer to create
- Is the KA endpoint ACTIVE? If not -> offer to provision
- Is the schema accessible? If not -> offer to create

This turns the load process into a guided setup: load -> verify -> fix gaps -> ready.

### UI: Visual Stash Health Report

The Setup App displays the verification results as a visual checklist in the UI -- same pattern as the Setup DAG with [+]/[x]/[!] orbs.

**Stash Health panel (new tab or section in Setup):**

```
Stash: airops                                    [Reload] [Fix All]
─────────────────────────────────────────────────────────────────
[+] airops.forge              valid YAML, v1.0
[+] app.yaml                  found
[+] databricks.yml            found

DATA
[+] data/csv/flights.csv      5 rows
[+] data/init/create_flights.sql    CREATE TABLE
[x] data/init/create_metrics.sql    NOT FOUND         [Generate]
[+] data/func/flights_at_risk.sql   found
[!] data/proc/update_risk.sql       NOT FOUND (optional)

PROMPTS
[+] conf/prompt/main.prompt   211 lines
[+] conf/prompt/knowledge.base 42 lines
[!] conf/prompt/user.prompt   empty (no starters)    [Generate]

TOOLS
[+] tools/query_flights.py    @tool found
[+] tools/update_risk.py      @tool found

INTEGRATIONS
[+] KA: passengers            ka-e0012089-endpoint
[!] KA config YAML            not in stash (using existing endpoint)
[+] Genie: checkin            01f142...
[!] Vector Search             not configured

WORKSPACE (live)
[+] Schema: catalog.schema    exists
[x] Table: flights            NOT PROVISIONED        [Provision]
[+] Table: checkin_agents     exists
[x] Function: flights_at_risk NOT CREATED            [Create]
[+] Genie space               accessible
[!] KA endpoint               PENDING (not yet ACTIVE)
```

**UI implementation:**
- Backend: new endpoint `GET /api/stash/health?name=airops` -- runs the 5-step verification, returns structured JSON
- Frontend: new component `StashHealthView` -- renders the checklist with orbs, action buttons
- Each [x] item has a contextual action button (Generate, Provision, Create) that triggers the relevant wizard step
- [Fix All] button runs all missing provisions in sequence
- Reusable for any stash -- not airops-specific

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

Tools defined as declarative specs in `.forge`. Factory modules generate `@tool` functions at agent startup.

**7 tool patterns (3 existing factories + 4 to build/extend):**

| # | Pattern | Factory | Status | What it does |
|---|---------|---------|--------|-------------|
| 1 | **SQL read** | `tool_factory.py` | TO BUILD | Calls a UC function with params, returns query results |
| 2 | **Action** | `tool_factory.py` | TO BUILD | Calls a stored procedure with params |
| 3 | **KA query** | `ka_factory.py` | EXISTS | Calls a Knowledge Assistant endpoint, extracts answer |
| 4 | **External API** | `api_factory.py` | EXISTS | Calls REST APIs via UC Connection or direct HTTP |
| 5 | **A2A** | `a2a_factory.py` | EXISTS | Calls remote agents via Google A2A protocol (JSON-RPC) |
| 6 | **External MCP** | (wired in agent.py) | EXISTS | Connects to external MCP servers, imports their tools |
| 7 | **Chart** | `generate_chart.py` | EXISTS | Generates inline chart visualizations (framework tool) |

**Plus MCP-based integrations (not tool factories, wired as MCP servers in `agent.py`):**
- **Genie** -- NL-to-SQL via Databricks Genie MCP (`PROJECT_GENIE_*`)
- **Vector Search** -- semantic doc retrieval via VS MCP (`PROJECT_VS_*`)

### Challenge 5: Data Provisioning Without Local Scripts

`create_all_assets.py` currently scans local directories.
In SaaS: reads SQL content from `.forge` sidecar files in UC Volume.
Setup App copies from UC Volume to workspace files at deploy time.
Python scripts get env vars via subprocess injection -- they work without `.env.local`.

### Challenge 6: Agent App Deployment -- DAB Preserved

**DAB (Databricks Asset Bundles) and `app.yaml` are Databricks platform standards. They MUST be preserved.**

This project needs to be validated by Databricks internal authorities and must align with corporate guidelines. Going "DAB-less" would be going against the platform -- wrong move.

**What changes:** The Setup App generates `databricks.yml` + `app.yaml` per project from `.forge` config, then deploys via the Databricks Python SDK (which has bundle/apps API support -- no Go binary needed).

**What stays:**
- `app.yaml` -- runtime manifest (startup command, env vars). Generated per project from `.forge`.
- `databricks.yml` -- bundle config (resources: experiments, warehouses, genie spaces, endpoints, apps). Generated per project from `.forge`.
- DAB resource binding -- experiments, warehouses, genie spaces, serving endpoints bound to the app SP.

**Two layers:**
1. **Resource creation** (tables, functions, genie spaces, KA endpoints, experiments) -- done via REST API / SDK calls during the setup wizard. This is the provisioning step.
2. **Deployment** (packaging the agent code + config and deploying it as a Databricks App) -- done via DAB (Databricks Asset Bundles). `databricks.yml` defines the bundle, `app.yaml` defines the runtime. DAB handles resource binding, SP grants, and code upload.

**Deploy flow:**
1. Setup App provisions resources via SDK (tables, functions, genie, KA, experiment) -- already done during wizard steps
2. Setup App generates `databricks.yml` from `.forge` config (resources, targets, app name, bindings)
3. Setup App generates `app.yaml` from `.forge` config (startup command, env vars)
4. DAB deploys the bundle: `databricks bundle deploy` (or SDK equivalent)
5. DAB handles: code upload, app creation, resource binding, SP setup
6. Post-deploy grants via SDK

**Why DAB for deployment:**
- Databricks platform standard -- required for internal validation
- Resource binding (experiment, warehouse, genie, endpoint) is declarative in `databricks.yml`
- SP permissions auto-applied via resource bindings
- Workspace state tracking (`.databricks/bundle/` state)
- Reproducible: same `databricks.yml` = same deployment

**Why SDK for resource creation:**
- Interactive wizard flow -- user creates resources step by step
- Resources exist BEFORE deployment (tables must exist for genie space to query them)
- SDK provides immediate feedback (success/failure per resource)

**The `.forge` stash includes:**
- `app.yaml` template -- populated from `.forge` config at deploy time
- `databricks.yml` template -- populated from `.forge` config at deploy time
- Both are project artifacts, part of the stash, versioned with the project

**DAB CLI Go binary vs Python SDK:**
- For local mode (C): user can use `databricks bundle deploy` CLI directly
- For DBX App modes (A/B): Setup App uses Python SDK `databricks.sdk.service.apps` API or shells out to `databricks` CLI if available in runtime
- Both paths produce the same result -- DAB bundle deployed

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

**Port:** `const PORT = process.env.DATABRICKS_APP_PORT || process.env.VISUAL_PORT || 9000`
**Auth:** Mode B = app's SP inherits user permissions. Same grant pattern as Agent App.

### Inch 3: First Deploy Test

Deploy, open URL, walk through Setup steps. Fix what breaks (uv, Node version, CORS, etc.).

### Inch 4: Config Persistence -- Stateful Backend

**In SaaS mode, the Node.js backend is stateful.** It holds the project zip in process memory.

**Lifecycle:**
1. User opens project -> zip downloaded from UC Volume into Node.js memory
2. User fiddles with wizard -> changes accumulate in the in-memory zip
3. Each meaningful write (config save, file generation, resource creation) -> update in-memory zip entry + flush to UC Volume
4. Page refresh -> backend still alive, serves current state from memory. No data lost.
5. App restart -> zip re-downloaded from UC Volume. Last flushed state restored.

**Flush strategy: event-driven, not periodic.**
- User saves config value -> flush
- Wizard generates tables/prompts/routines -> flush
- User creates/deletes a resource (KA, Genie) -> flush
- User sits idle -> zero flushes
- Flush = one `w.files.upload()` call, under 1MB, ~200ms

**What survives page refresh:** Everything. Backend holds the zip in memory.
**What survives app restart:** Everything that was flushed. Risk window = only during mid-request crash (same as today).

**What is NOT persisted (same as today):**
- UI position (active step, wizard phase) -- resets on refresh
- Test cache results -- re-fetched on step activation
- Terminal output lines -- ephemeral

**Design shift from today:** Current backend is stateless (reads `.env.local` from disk on every request). SaaS backend is stateful (holds zip in memory, flushes on write). The ConfigProvider abstraction handles both: `LocalConfigProvider` reads disk, `ForgeConfigProvider` reads/writes the in-memory zip.

**Local mode (C):** No change. Files on disk. Stateless reads/writes. Same as today.

### Inch 5: Agent Deploy via Python SDK (DAB-compatible)

Setup App generates `databricks.yml` + `app.yaml` from `.forge` config, uploads source files, deploys via Databricks Python SDK (`w.apps.create()`, `w.apps.deploy()`). DAB resource bindings preserved. No Go binary needed -- SDK handles it.

### Inch 6: Agent App File Manifest

Define exactly which files are Agent App vs Setup App. Agent App gets: `agent/`, `app/`, `tools/`, `data/`, `conf/`, `eval/`, `pyproject.toml`, `requirements.txt`, generated `app.yaml`.

### Inch 7: .forge Config Injection

Setup App generates `app.yaml` for Agent App with all env vars from `.forge`.
Domain files (prompts, SQL, tools) written to workspace files before deploy.

### Inch 8: Automated Git Push + Databricks Git Folder

**New setup step: `git` (source control)**

Position: after deploy. User configures, deploys, tests, THEN pushes to git.

**Key insight: NO PAT entry needed.** Databricks already has Git Credentials configured per user (Settings > Developer > Git integration). The Setup App uses those stored credentials. User only provides the repo URL.

**UI -- Setup step choices:**
```
source control
  [1] push to GitHub
  [2] push to GitLab
  [3] skip
```

**Configure phase -- user provides ONE field:**
1. Repo URL: `https://github.com/user/my-agent.git`

That's it. No PAT. No token. No OAuth. Databricks handles git auth via stored credentials.

**Pre-check:** Setup App calls `w.git_credentials.list()`:
- Credentials exist -> proceed (zero friction)
- No credentials -> show: "Connect GitHub in Databricks Settings > Developer > Git integration" OR offer one-time PAT entry via `w.git_credentials.create(git_provider, git_username, personal_access_token)` -- stored by Databricks forever, never asked again.

**Execute phase -- fully automated, SSE stream:**
1. Create Databricks Git Folder linked to repo: `w.repos.create(url, provider="github")` -- uses stored git credentials
2. Write ALL generated project files into the Git Folder: `w.workspace.import_(path="/Repos/user/repo/file.py", content, format)` per file
3. Submit one-shot Databricks job to commit + push:
   ```python
   import subprocess
   repo_path = "/Workspace/Repos/user/repo"
   subprocess.run(["git", "add", "."], cwd=repo_path)
   subprocess.run(["git", "commit", "-m", "BrickForge: initial project"], cwd=repo_path)
   subprocess.run(["git", "push"], cwd=repo_path)
   ```
   Job runs on serverless compute, uses workspace git credentials. No tokens needed.
4. Store repo URL in `.forge` config

**Result:** Code is on GitHub AND browsable in Databricks. Zero manual git operations. No PAT paste. No OAuth flow.

**Why this works:**
- `w.repos.create()` uses Databricks-stored git credentials (not app credentials)
- `w.workspace.import_()` writes to `/Repos/` paths (Git Folders are workspace objects)
- One-shot job runs `git commit && git push` using workspace-level git auth
- User already has GitHub connected to Databricks (standard setup)

**Subsequent pushes:** Repo URL in `.forge`. Files updated in Git Folder. Job re-submitted. New commit pushed. One click.

**.forge config section:**
```yaml
config:
  git:
    provider: github
    repo_url: "https://github.com/user/my-agent.git"
    branch: main
    # No PAT here. Databricks handles git auth via stored credentials.
```

**Implementation:**
- New `StepId: 'git'` in `types.ts`
- New step in `setupSteps.ts` with choices cfg-github / cfg-gitlab / done
- Backend pre-check: `w.git_credentials.list()`
- Backend actions: `exec-git-push` (create repo, write files, submit commit job)
- `SetupDag` icon: `GitBranch` from lucide
- `SetupDrawer` configure: 1 input field (repo URL)

**GitLab:** Same pattern, same flow. Databricks Git Credentials support GitLab too.

### Inch 9: Multi-Project (later)

Save/load/switch `.forge` projects on UC Volume. Per-project schema isolation.

---

## PART 8: Open Questions -- All Answered

### A. Setup App Deployment

| # | Question | Answer | Status |
|---|----------|--------|--------|
| A1 | Where does Setup App's `app.yaml` live? | Root. Current `app.yaml` (Agent App) gets renamed to `agent-app.yaml`. Setup App `app.yaml` goes at root. | DECIDED |
| A2 | Upload entire repo or subset? | Entire repo. Relative paths preserved, subprocess calls work. Exclude `.git/`, `stash/` via `.databricksignore`. | DECIDED |
| A3 | Is `uv` available in DBX App runtime? | YES. Docs confirm: "Python dependencies using `pip` or `uv`". No install needed. | CONFIRMED |
| A4 | Node.js version in DBX App runtime? | YES, available. Docs: "If your app includes Node.js, the default command is `npm run start`". Exact version TBD. | CONFIRMED |
| A5 | Is `npm` available? | YES. Docs: "Node.js dependencies using `npm`". | CONFIRMED |
| A6 | Port env var? | `DATABRICKS_APP_PORT` (not `PORT`). Auto-substituted into command at runtime. | CONFIRMED |

### B. Config Persistence

| # | Question | Answer | Status |
|---|----------|--------|--------|
| B1 | Config persistence strategy? | Zip archive in UC Volume. Backend holds zip in memory, flushes on every meaningful write (~200ms). Event-driven, not periodic. No `.env.local` in SaaS. | DECIDED |
| B2 | Can DBX App set its own env vars at runtime? | Irrelevant -- `.forge` on UC Volume is the persistence, not app env vars. | N/A |
| B3 | How to restore on restart? | Re-download zip from UC Volume into memory. Last flushed state restored. UI position resets (same as today). | DECIDED |
| B4 | Mode A (hosted): user workspace credentials? | Databricks SSO. | DECIDED |

### C. Agent App Deployment

| # | Question | Answer | Status |
|---|----------|--------|--------|
| C1 | Exact REST API for workspace file upload? | Workspace Files API or `PUT /api/2.0/workspace/import`. Verify exact endpoint on implementation. | NEEDS VERIFICATION |
| C2 | Does Apps API accept workspace file path? | Verify on implementation. | NEEDS VERIFICATION |
| C3 | Parallel file upload rate limits? | Test on implementation. 50-100 small files should be fine. | NEEDS TESTING |
| C4 | DAB CLI Go binary pip-installable? | No. But Databricks Python SDK has apps API (`w.apps.create/deploy`). DAB format preserved, Go binary not needed. | DECIDED |
| C5 | Can Setup App SP grant to Agent App SP? | SP can grant UC permissions via SDK. Same pattern as existing grant scripts. Verify on implementation. | NEEDS VERIFICATION |

### D. Stash Format & Loading

| # | Question | Answer | Status |
|---|----------|--------|--------|
| D1 | Storage format? | Single zip archive per project. Text files inside (SQL, prompts, YAML). PDFs stay in UC Volume (referenced by path). Under 1MB per project. | DECIDED |
| D2 | UC Volume path convention? | `/Volumes/{catalog}/{schema}/brickforge/{project_name}/` | DECIDED |
| D3 | What catalog/schema for stash Volume? | The project's own catalog.schema. User picks it in Schema setup step. | DECIDED |
| D4 | How does wizard write to UC Volume? | Python subprocess via `volume_ops.py` (already exists for KA doc upload). Same pattern for all Volume writes. | DECIDED |
| D5 | How does stash content reach the Agent App? | Download zip from Volume, extract files in memory, write to workspace files at deploy time. Agent reads local relative paths at runtime. | DECIDED |
| D6 | Developer mode: `.forge` abandoned? | Yes. `.forge` is the seed. Once exported, code is source of truth. User deploys via own CI/CD. Setup App optional from that point. | DECIDED |

### E. Tool Generation

| # | Question | Answer | Status |
|---|----------|--------|--------|
| E1 | `tool_factory.py` for SQL read + action? | No. `ka_factory.py`, `api_factory.py`, `a2a_factory.py` exist. Need `tool_factory.py` for SQL read + action patterns. | TO BUILD |
| E2 | Can ALL tools be declarative? | 95% yes (7 patterns). Custom logic tools: user writes Python, puts in `tools/`. Both coexist via `_discover_domain_tools()`. | DECIDED |
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
| G1 | How does user access generated project? | Automated push to GitHub/GitLab via Git Data API + auto-created Databricks Git Folder. Also: export via CLI or download button. | DECIDED |
| G2 | Does Setup App know when user edits externally? | No, and doesn't need to. Once pushed, user owns it. | DECIDED |
| G3 | Git integration? | AUTOMATED. No PAT entry. Uses Databricks-stored git credentials. Setup App creates Git Folder, writes files, submits job to commit+push. User provides repo URL only. | DECIDED |
| G4 | CI/CD story? | User's own pipeline. Code is in git, push triggers CI/CD. Standard DAB bundle. | DECIDED |

### H. Multi-Project

| # | Question | Answer | Status |
|---|----------|--------|--------|
| H1 | Multi-project coexistence? | Separate UC schema per project, separate Agent App instance, shared Setup App. `.forge` files in separate directories on UC Volume. | DECIDED |
| H2 | Project list? | Scan UC Volume `/Volumes/{catalog}/{schema}/brickforge/` for subdirectories containing `.forge` files. | DECIDED |
| H3 | Project deletion? | Delete Agent App (Apps API), drop UC tables (or schema), delete `.forge` directory from UC Volume, remove MLflow experiment. Existing cleanup tab handles most of this. | DECIDED |

**Total: 31 questions. 30 DECIDED/CONFIRMED. 1 NEEDS TESTING (upload rate limits). 2 NEEDS VERIFICATION (API details). 1 TO BUILD.**

---

## PART 8b: Local Runtime Dependencies -- The Hidden Inch

### The Problem

Before: user had npm, uv, Python 3.11+, Databricks CLI all installed locally.
After: none of that exists on the user's machine. It ALL must be available inside the DBX App runtime.

This is not trivial. Let me trace every dependency.

### What the Setup App Backend Spawns

**41 calls to `uv run python`** in `visual/backend/index.js`. Every single one needs:
1. `uv` binary available
2. Python 3.11+ available
3. All packages from `pyproject.toml` installed in a venv
4. `databricks-sdk`, `mlflow`, `langchain`, `pyyaml`, `python-dotenv`, etc.

**5 calls to `databricks` CLI** (the Go binary, NOT the Python package):
- `databricks auth profiles` -- list CLI profiles
- `databricks auth login` -- interactive OAuth login
- `databricks database list-database-instances` -- list Lakebase instances
- `databricks database get-database-instance` -- get Lakebase instance
- `databricks apps get` -- check app status

**2 calls to `bash`:**
- `bash deploy/run_all_grants.sh` -- runs grant scripts
- `bash deploy/deploy.sh` -- full deploy pipeline (which itself calls `databricks bundle deploy`)

**Agent App startup (app.yaml) calls:**
- `uv run python -c "from agent.start_server import main; main()"` -- needs uv + Python
- Startup hook runs `npm install && npm run build:client` -- needs npm + Node.js
- Then spawns `node app/server/dist/index.mjs` -- needs Node.js

### What's Available in a Databricks App Runtime?

DBX Apps run in a container. What's in it?

| Tool | Available? | Notes |
|------|-----------|-------|
| Python 3.x | YES | Standard in DBX runtime |
| pip | YES | Standard |
| uv | YES | Docs confirm: available alongside pip |
| Node.js | MAYBE | DBX Apps support Node.js apps, so Node must be available. But which version? |
| npm | MAYBE | If Node.js is available, npm usually is too |
| bash | YES | Standard Linux container |
| databricks CLI (Go) | MAYBE | May be pre-installed in the workspace runtime. If not, must download binary. |
| git | MAYBE | May be available but not guaranteed |

### Millimeter-by-Millimeter: What Breaks

**mm R.1: uv IS available (confirmed by docs)**
- 41 subprocess calls use `uv run python`
- Fix options:
  - A: Install uv at startup: `pip install uv && uv sync` in app.yaml command
  - B: Replace ALL `uv run python` with just `python` (after pip-installing deps)
  - C: Create a wrapper script that tries `uv run python`, falls back to `python`
- Option A is cleanest. `uv` is pip-installable. `uv sync` creates the venv from `pyproject.toml`.
- **BUT:** `uv sync` needs network access to download packages. DBX Apps have internet access? Usually yes.
- **BUT:** `uv sync` takes time (30-60s). This happens on EVERY app restart. Not just first deploy.
- Alternative: run `uv sync` once at deploy time, commit the `.venv/` to workspace files. Then `uv run` just uses the existing venv -- fast.

**mm R.2: Python packages not installed**
- Even if `uv` is installed, the venv needs to be created and populated
- `pyproject.toml` has 20+ dependencies including large ones (mlflow, langchain, pandas, pyarrow)
- Full install takes 2-3 minutes
- If this happens on every restart, startup is painfully slow
- **Solution:** Install once at deploy time, persist venv in workspace files. Or: use `pip install -r requirements.txt` in the app.yaml command with a requirements.txt that has exact versions (fast pip resolve).

**mm R.3: Databricks CLI (Go binary) not available**
- 5 direct calls to `databricks` CLI
- `databricks auth profiles` -- used for listing CLI profiles in the Setup wizard
- `databricks auth login` -- used for interactive OAuth
- `databricks database *` -- Lakebase management
- `databricks apps get` -- deploy status check
- The Go binary is NOT pip-installable. It's a standalone binary.
- **In DBX App mode, do we even need the CLI?**
  - `auth profiles` -- NO. In DBX App mode, auth comes from the SP. No CLI profiles.
  - `auth login` -- NO. In DBX App mode, no interactive login needed.
  - `database *` -- YES. But can be replaced with REST API calls.
  - `apps get` -- YES. But can be replaced with REST API calls.
- **Decision:** Replace all `databricks` CLI calls with REST API equivalents. This removes the Go binary dependency entirely.
- Impact: 5 call sites in the backend. Each is a simple SDK/REST call.

**mm R.4: Node.js / npm for Agent App build**
- Agent App startup: `npm install && npm run build:client && npm run start`
- This requires Node.js + npm in the Agent App's DBX App runtime
- The Agent App is a SEPARATE DBX App from the Setup App
- DBX Apps can be configured for Node.js OR Python. The Agent App needs BOTH.
- Current `app.yaml` starts with `uv run python` which then spawns Node as a subprocess
- **This already works today** -- the Agent App is already deployed as a DBX App this way
- So Node.js IS available in the DBX App runtime (at least for the Agent App)
- **Question:** Is it available for the Setup App too?
- The Setup App is Node.js native. Its `app.yaml` would say `node visual/backend/index.js`. So the runtime must have Node.js. YES.

**mm R.5: npm for Setup App**
- Setup App backend is Node.js with pre-built frontend and committed node_modules
- No `npm install` needed at runtime for the Setup App itself
- **No npm needed in Setup App runtime.** Just Node.js to run the server.

**mm R.6: Eliminate npm from Agent App runtime (PRE-BUILD)**

Currently the Agent App builds the chat frontend at startup:
```python
# agent/start_server.py line 27-30
if not _CLIENT_DIST.exists() and _NODE_SERVER.exists():
    subprocess.run(["npm", "install"], ...)    # needs npm
    subprocess.run(["npm", "run", "build:client"], ...)  # needs npm
```

This means npm must be available at runtime. But the startup hook ALREADY SKIPS the build if `dist/` exists (line 27: `if not _CLIENT_DIST.exists()`).

**Solution: pre-build and include `dist/` in the deployment bundle.**

Both dist directories already exist locally:
- `app/client/dist/index.html` -- React chat frontend (pre-built)
- `app/server/dist/index.mjs` -- Express server (pre-built)

**What must change:**
1. Include `app/client/dist/` and `app/server/dist/` in the deployment bundle
2. Remove `app/client/dist/` from `.databricksignore` (currently excluded because it was designed to build remotely)
3. The startup hook sees `dist/` exists, skips `npm install` + `npm run build:client`
4. Agent App startup becomes: `pip install -r requirements.txt && python -c "from agent.start_server import main; main()"`
5. **npm is no longer needed at Agent App runtime**

**Result: both Setup App and Agent App need only Node.js + Python + pip. Zero build tools at runtime.**

### Pre-built vs Built at Runtime -- Complete Picture

| Piece | Pre-built? | Included in bundle? | Needs at runtime |
|-------|-----------|-------------------|-----------------|
| **Setup App frontend** (React) | YES -- `visual/frontend/dist/` | YES (committed) | Nothing |
| **Setup App backend** (Node.js) | YES -- `node_modules/` committed | YES | Node.js only |
| **Setup App Python scripts** | Source, no build | YES | Python + packages |
| **Agent App frontend** (React chat) | YES -- `app/client/dist/` | **MUST INCLUDE** (change `.databricksignore`) | Nothing |
| **Agent App server** (Express) | YES -- `app/server/dist/` | **MUST INCLUDE** | Node.js only |
| **Agent App agent** (Python) | Source, no build | YES | Python + packages |

### Lightest Runtime Footprint

| Dependency | Setup App | Agent App | Action |
|------------|-----------|-----------|--------|
| Node.js | YES (runs server) | YES (runs Express) | Available in DBX runtime |
| npm | **NO** | **NO** (dist pre-built) | Not needed -- eliminate from runtime |
| Python 3.x | YES (subprocess) | YES (main) | Available in DBX runtime |
| uv | YES (41 calls) | YES (startup) | Available in DBX App runtime (confirmed by docs) |
| Python packages | YES (via uv sync) | YES (via uv sync) | Install once at deploy/startup |
| Node.js | YES (main process) | YES (subprocess) | Available in DBX runtime |
| npm | NO (pre-built) | YES (build:client) | Available with Node.js |
| databricks CLI (Go) | YES (5 calls) | NO | **REPLACE with REST API** -- removes dependency |
| bash | YES (2 calls) | NO | Available in Linux container |
| git | NO | NO | Not needed |

### The 5 Databricks CLI Calls to Replace

| Current Call | Where | REST API Replacement |
|-------------|-------|---------------------|
| `databricks auth profiles` | Backend: list profiles for host/model setup | **REMOVE** -- not needed in DBX App mode (no CLI profiles) |
| `databricks auth login` | Backend: interactive OAuth | **REMOVE** -- not needed in DBX App mode (SP auth) |
| `databricks database list-database-instances` | Backend: list Lakebase instances | `GET /api/2.0/database/instances` via SDK |
| `databricks database get-database-instance` | Backend: test Lakebase | `GET /api/2.0/database/instances/{name}` via SDK |
| `databricks apps get` | Backend: test deploy status | `GET /api/2.0/apps/{name}` via SDK |

These 5 calls become Python SDK calls (WorkspaceClient). The backend already spawns Python for everything else -- same pattern.

**For local mode (C):** The CLI calls still work if the user has the CLI installed. The backend can try the REST API first, fall back to CLI. Or: just always use REST API in the backend, since it works in all modes.

### Startup Command for Setup App

**Critical: DBX App commands are NOT run in a shell.** No `&&` chaining. Must use `bash -c` or a startup script.

```yaml
# Setup App app.yaml
command: ["bash", "-c", "uv sync && node visual/backend/index.js"]
```

This:
1. `uv sync` -- creates venv and installs Python deps (uv is pre-installed in DBX runtime). Slow first time (~2-3 min), fast on restart if `.venv` persisted.
2. `node visual/backend/index.js` -- starts the Setup App server

**Port:** Use `DATABRICKS_APP_PORT` (not `PORT`). Backend must respect: `const PORT = process.env.DATABRICKS_APP_PORT || process.env.VISUAL_PORT || 9000`

### Startup Optimization

`uv sync` is slow on first run. Options to speed up:
- **Option A:** Run `uv sync` at deploy time (before starting the app), persist `.venv/` in workspace files
- **Option B:** Use `pip install -r requirements.txt` instead (no uv needed at all for Setup App -- only Python scripts need packages, not the Node server)


Option B is simplest: `pip install -r requirements.txt && node visual/backend/index.js`
This eliminates the uv dependency for the Setup App entirely. The Python scripts get packages from the system Python.

But then the backend still calls `uv run python` for subprocess spawning...

**Wait.** `uv run python` is just a way to run Python with the venv activated. If packages are installed system-wide via `pip install`, then just `python` works. The backend needs to call `python` instead of `uv run python`.

**This is a decision point:**
- **Keep uv:** Install it, use it. Consistent with local mode. Venv isolation.
- **Drop uv for DBX App mode:** Use system `pip install` + bare `python`. Simpler startup but different behavior between local and DBX App modes.
- **Abstract it:** Backend calls a helper function `pythonCmd()` that returns `['uv', 'run', 'python']` locally or `['python']` in DBX App mode.

The abstraction is the right answer. Same pattern as ConfigProvider -- detect mode, use appropriate command.

---

## PART 8c: Packaging & Distribution -- Millimeter Detail

### Current State: What We're Shipping

**Deploy footprint (Setup App + Agent bundle): ~13MB (~150 files)**
With visual backend node_modules (8MB, required): included in the 13MB.
First deploy lesson: 787 files / ~175MB uploaded. After excluding `app/*/node_modules/` + `app/packages/`: 150 files / ~13MB. 10x reduction.

Bloat to exclude from any distribution:

| Excluded | Size | Why safe to exclude | How reconstructed on target |
|----------|------|--------------------|-----------------------------|
| `.mypy_cache/` | 1.1GB | Type checker cache. Not needed at runtime. | Never. Only created if someone runs `mypy`. |
| `.venv/` | 662MB | Python virtual environment. | Rebuilt at startup: `pip install -r requirements.txt` or `uv sync` (1-2 min first time). |
| `app/client/node_modules/` | 100MB | Only needed to BUILD the React frontend. | Never. Pre-built `app/client/dist/` included in bundle instead. |
| `app/server/node_modules/` | 18MB | Only needed to BUILD the Express server. | Never. Pre-built `app/server/dist/` included in bundle instead. |
| `visual/frontend/node_modules/` | -- | Already gitignored. Only needed to dev the Setup App frontend. | Never. Pre-built `visual/frontend/dist/` included in bundle. |
| `__pycache__/` | ~1MB | Python bytecode cache. | Auto-created by Python on first import. Zero action needed. |
| `.git/` | varies | Version control history. | Not needed at runtime. User can init git if they want CI/CD. |
| `.DS_Store` | tiny | macOS filesystem metadata. | Never. Platform artifact. |

**Key: `visual/backend/node_modules/` (8MB) is NOT excluded.** It IS included in the bundle -- the Setup App backend needs it to run.

### The Two-Runtime Problem

BrickForge needs BOTH Node.js (Setup App server) and Python (Databricks SDK, agent, data gen).
No single package manager handles both. Don't try to force it.

### Distribution Path 1: GitHub Release (FIRST PRIORITY)

**mm D1.1: What goes in the archive?**

Two layers: what the SETUP APP runs, and what it CARRIES for Agent App deployment.

```
brickforge-v1.0.0/

  SETUP APP (runs this):
    visual/
      backend/
        index.js
        lib/
        node_modules/     <-- 8MB, committed, REQUIRED (express, dotenv, etc.)
        package.json
      frontend/
        dist/             <-- 580KB, pre-built UI

  AGENT APP BUNDLE (carried, deployed to workspace on user's "Deploy"):
    agent/                <-- 5 Python files, ~40KB
    app/
      client/dist/        <-- pre-built React chat UI (~16MB)
      server/dist/        <-- pre-built Express server (~2MB)
      app.yaml            <-- Agent App manifest (template)
    tools/                <-- framework tools only, ~48KB
    data/
      init/               <-- provisioning scripts
      gen/                <-- data generation scripts
      py/                 <-- shared Python utilities
      default/            <-- empty (domain content from .forge)
    conf/
      prompt/             <-- skeleton prompts
      ka/                 <-- output_format.yml only
      .env.example
    eval/                 <-- framework eval scripts

  SHARED:
    pyproject.toml        <-- Python deps
    requirements.txt
    scripts/              <-- setup, KA management
    deploy/               <-- deploy pipeline

  LOCAL-ONLY (GitHub Release archive):
    start.sh              <-- root launcher (Mac/Linux)
    start.bat             <-- Windows launcher
    setup-app.yaml        <-- Setup App DBX App manifest
    README.md
    stash/                <-- airops example (optional)
```

**mm D1.2: What is EXCLUDED (learned from first deploy)**

| Excluded | Size | Why |
|----------|------|-----|
| `app/client/node_modules/` | 100MB | Pre-built `dist/` included. Build deps not needed at runtime. |
| `app/server/node_modules/` | 18MB | Pre-built `dist/` included. Build deps not needed at runtime. |
| `app/packages/` | 38MB | npm workspace shared packages. Only for source editing/rebuilding. Not needed for deploy. |
| `app/client/src/` | 528KB | React source. Not needed at runtime. Agent App runs from `dist/`. Developer mode: download separately. |
| `app/server/src/` | 60KB | Express source. Not needed at runtime. Same. |
| All other `node_modules/` | varies | Only `visual/backend/node_modules/` is needed (8MB). |

**Actual footprint: ~13MB (~150 files) instead of ~175MB (~787 files).**

First deploy uploaded 787 files / ~175MB. After fixing exclusions: ~150 files / ~13MB. 10x smaller, 10x faster.

**mm D1.3: Building the release archive**

A `build-release.sh` script:
```bash
#!/bin/bash
VERSION=${1:-"dev"}
OUT="brickforge-${VERSION}"

# Create clean directory
rm -rf "$OUT" "$OUT.tar.gz"
mkdir -p "$OUT"

# Copy files (exclude bloat)
rsync -a --exclude='.git' --exclude='.venv' --exclude='node_modules' \
         --exclude='__pycache__' --exclude='.mypy_cache' \
         --exclude='.DS_Store' --exclude='.claude' \
         --exclude='.env.local' --exclude='.env.*.local' \
         ./ "$OUT/"

# Include ONLY the visual backend node_modules (required, pre-committed)
cp -r visual/backend/node_modules "$OUT/visual/backend/"

# Include pre-built frontend dist
cp -r visual/frontend/dist "$OUT/visual/frontend/"

# Compress
tar czf "$OUT.tar.gz" "$OUT"
echo "Built: $OUT.tar.gz ($(du -h "$OUT.tar.gz" | cut -f1))"
```

**mm D1.4: The start.sh launcher**

```bash
#!/bin/bash
set -e

echo "BrickForge Setup App"
echo "===================="

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not found. Install from https://nodejs.org/"
  exit 1
fi

# Check Python
PYTHON=""
for cmd in python3 python; do
  if command -v "$cmd" &>/dev/null; then
    PYTHON="$cmd"
    break
  fi
done
if [ -z "$PYTHON" ]; then
  echo "ERROR: Python 3.11+ not found. Install from https://python.org/"
  exit 1
fi

# Install Python deps (first run only)
if [ ! -f ".deps_installed" ]; then
  echo "Installing Python dependencies (first run)..."
  $PYTHON -m pip install -r requirements.txt --quiet
  touch .deps_installed
fi

# Start
echo "Starting BrickForge at http://localhost:9000"
node visual/backend/index.js
```

**mm D1.5: The start.bat launcher (Windows)**

```batch
@echo off
echo BrickForge Setup App
echo ====================

where node >nul 2>&1 || (echo ERROR: Node.js not found. Install from https://nodejs.org/ & exit /b 1)
where python >nul 2>&1 || (echo ERROR: Python not found. Install from https://python.org/ & exit /b 1)

if not exist ".deps_installed" (
  echo Installing Python dependencies...
  python -m pip install -r requirements.txt --quiet
  echo. > .deps_installed
)

echo Starting BrickForge at http://localhost:9000
node visual\backend\index.js
```

**mm D1.6: BUT WAIT -- the backend calls `uv run python`, not `python`**

The `start.sh` installs deps with `pip`. But 41 subprocess calls in the backend use `uv run python`.
If uv isn't installed, those fail.

Options:
- A: `start.sh` also installs uv: `pip install uv && uv sync`
- B: Change backend to use `python` directly (abstraction layer from Part 8b)
- C: `start.sh` installs deps with pip, AND creates a `uv` wrapper that just calls `python`

**Best:** Option B. The `pythonCmd()` abstraction. In local mode without uv, it uses `python`. With uv, it uses `uv run python`. The release archive runs without uv.

This means the release archive doesn't need uv at all. Just Python + pip + Node.js.

**mm D1.7: GitHub Release workflow**

1. Tag a release: `git tag v1.0.0`
2. Run `build-release.sh v1.0.0`
3. Upload `brickforge-v1.0.0.tar.gz` to GitHub Releases
4. GitHub Actions can automate this (on tag push)

User flow:
```bash
curl -L https://github.com/mehdi-dbx/brickforge/releases/latest/download/brickforge.tar.gz | tar xz
cd brickforge-*
./start.sh
# Open http://localhost:9000
```

### Distribution Path 2: pip install brickforge + deploy-setup

**Two capabilities in one package:**
- `brickforge` -- run Setup App locally (needs Node.js)
- `brickforge deploy-setup` -- deploy Setup App to user's DBX workspace

**mm D2.1: What would the pip package look like?**

```toml
[project]
name = "brickforge"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = [
    "databricks-sdk>=0.102.0",
    # ... all Python deps
]

[project.scripts]
brickforge = "brickforge.cli:main"
brickforge-deploy-setup = "brickforge.deploy_setup:main"

[tool.setuptools.package-data]
brickforge = [
    "visual/backend/**/*",
    "visual/frontend/dist/**/*",
    # ... all non-Python files
]
```

**mm D2.2: Node.js prereq**

pip can't install Node.js. The user needs it installed separately for `brickforge` (local mode).
For `brickforge deploy-setup` (deploys to DBX), Node.js is NOT needed on the user's machine -- it's in the DBX App runtime.

So: `pip install brickforge && brickforge deploy-setup` works with ONLY Python. No Node.js needed for SaaS deploy.
`pip install brickforge && brickforge` (local mode) needs Node.js. `start.sh` checks and errors clearly.

8MB of Node.js files as package data is fine (tensorflow is 500MB+).

**mm D2.3: Publishing to PyPI**

1. Check name availability: `pip index versions brickforge` or visit https://pypi.org/project/brickforge/ (404 = available)
2. Create account at pypi.org, get API token
3. Build: `python -m build` (creates `dist/brickforge-1.0.0.tar.gz`)
4. Upload: `twine upload dist/*`
5. No approval process -- upload and it's live immediately
6. Then anyone can: `pip install brickforge`

**mm D2.4: deploy-setup without pip install**

Also works standalone -- no pip needed:
```bash
python -c "$(curl -s https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/scripts/deploy-setup.py)"
```

**mm D2.5: What deploy-setup does**

1. Authenticate via Databricks SDK (PAT, CLI profile, or interactive `databricks auth login`)
2. Create the DBX App: `POST /api/2.0/apps` with name `brickforge-setup`
3. Upload source files to workspace (same files as release archive)
4. Create deployment: `POST /api/2.0/apps/{name}/deployments`
5. Wait for app to start
6. Print URL

**Decision:** pip install is a STRETCH GOAL. GitHub Release first. If demand exists, add pip later. deploy-setup works standalone regardless.

### Windows Compatibility

**mm W.1: Two bash scripts to replace**

| Script | What it does | Python replacement |
|--------|-------------|-------------------|
| `deploy/deploy.sh` | Full DAB deploy pipeline | Being replaced with REST API (`deploy_via_api.py`) -- Part 8b |
| `deploy/run_all_grants.sh` | Calls 5 Python grant scripts | Trivial: `run_all_grants.py` that calls them in sequence |

After these two replacements, ZERO bash dependency. Works on Windows natively.

**mm W.2: Path separators**

All Python code uses `pathlib.Path` or `os.path` -- cross-platform by default.
The Node.js backend uses `path.resolve()` -- cross-platform.
No hardcoded `/` path separators in critical code.

**mm W.3: The uv question on Windows**

`uv` works on Windows (pip-installable). But with the `pythonCmd()` abstraction, uv becomes optional on all platforms. Users who have it get venv isolation; users who don't just use system Python.

### What NOT to Do

- Don't publish to npm (Python bundling nightmare)
- Don't build Electron/Tauri (desktop wrapper for a web server -- wrong paradigm)
- Don't build platform installers (MSI, DMG, deb -- maintenance hell)
- Don't build Homebrew formula (Mac-only, another package to maintain)
- Don't build snap/flatpak (Linux-only, containerization overhead)
- Don't build a custom update mechanism (just release new versions on GitHub)

### Summary: Delivery Priority

| Priority | Method | Prereqs | Effort | When |
|----------|--------|---------|--------|------|
| 1 | **GitHub Release** (tar.gz/zip) | Node.js + Python | `build-release.sh` script | FIRST |
| 2 | **pip install brickforge** (local + deploy-setup) | Python (+ Node.js for local mode) | pyproject.toml + cli.py + deploy_setup.py | SECOND |

### Files to Create

| File | Purpose |
|------|---------|
| `build-release.sh` | Builds the GitHub Release archive |
| `start.sh` (root) | Local launcher (Mac/Linux) |
| `start.bat` (root) | Local launcher (Windows) |
| `setup-app.yaml` | Setup App DBX App manifest |
| `scripts/deploy-setup.py` | One-command DBX App deploy |
| `.releaseignore` | Files to exclude from release archive |
| `deploy/run_all_grants.py` | Python replacement for bash grants script |

---

## PART 10: Execution Plan -- Parallelization

### Dependency Graph

```
TRACK A (Setup App Deploy)     TRACK B (Backend Refactor)     TRACK C (Independent)
─────────────────────────      ────────────────────────       ─────────────────────

Inch 1: app.yaml + startup     Inch 4: ConfigProvider         Inch 6: File Manifest
    |                              |                           (design, no code deps)
    v                              |
Inch 2: Port + Auth               |                           tool_factory.py
    |                              |                           (SQL read + action)
    v                              |
Inch 3: First Deploy Test          |
    |                              |
    +--------- MERGE POINT --------+
               |
               v
         Inch 5: Agent Deploy via SDK
               |
               v
         Inch 7: .forge Config Injection
               |
               v
         Inch 8: Git Push + Git Folder
               |
               v
         Inch 9: Multi-Project
```

### What Can Run in Parallel

| Track | Work | Dependencies | Can Start |
|-------|------|-------------|-----------|
| **A** | Inch 1-3: Setup App as DBX App | None | IMMEDIATELY |
| **B** | Inch 4: ConfigProvider refactor | None | IMMEDIATELY |
| **C** | Inch 6: File Manifest + tool_factory.py | None | IMMEDIATELY |

**Tracks A, B, C are fully independent.** They touch different files, different concerns:
- Track A: `visual/app.yaml` (new), port fix in `index.js`, deploy + test
- Track B: `visual/backend/lib/config-provider.js` (new), 36 call sites in `index.js`
- Track C: manifest definition (doc), `tools/tool_factory.py` (new)

### Merge Point

After A+B+C converge:
- Inch 5 needs: Setup App working (A) + ConfigProvider (B) + file manifest (C)
- Inch 7 needs: ConfigProvider (B) + file manifest (C)
- Both can proceed sequentially from the merge point

### Recommended Execution

**Wave 1 -- sequenced to avoid merge conflicts in `index.js`:**

**Step 1 (2 min, do first):**
- [ ] Track A: Inch 1+2 -- Setup App `app.yaml` (new file), port fix (1 line in `index.js`)
- Commit. Tiny change, no conflict risk.

**Step 2 (parallel, via `isolation: "worktree"`):**
- [ ] Track B: Inch 4 -- ConfigProvider + 36 call sites in `index.js` (starts from Track A's commit, no overlap -- A changed PORT line, B changes function calls)
- [ ] Track C: Inch 6 + `tool_factory.py` -- file manifest doc + new Python file (touches zero of B's files)

**Why this order:** A and B both touch `index.js`. A is 1 line (PORT). B is 36 call site replacements. Do A first (trivial), commit. Then B and C in parallel via worktrees -- B edits `index.js` call sites, C writes new Python files. Zero overlap.

**Wave 1 checkpoint:** Deploy Setup App (Inch 3). Test everything works.

**Wave 2 (sequential, depends on Wave 1):**
- [ ] Inch 4b: ForgeConfigProvider (reads/writes in-memory zip)
- [ ] Inch 5: Agent Deploy via SDK (generate databricks.yml + app.yaml, upload, deploy)
- [ ] Inch 7: .forge config injection (generate domain files from .forge, write to workspace)

**Wave 2 checkpoint:** End-to-end test: Setup App -> configure -> deploy Agent App -> live.

**Wave 3 (sequential, depends on Wave 2):**
- [ ] Inch 8: Git push + Databricks Git Folder
- [ ] Inch 9: Multi-project save/load/switch

### Estimated Effort per Track

| Track | Inches | Scope | Key Files | Effort |
|-------|--------|-------|-----------|--------|
| A | 1-3 | Setup App app.yaml, port, first deploy | `visual/app.yaml` (new), `index.js` (1 line), `.databricksignore` | Small -- mostly config |
| B | 4 | ConfigProvider + 36 call site refactor | `config-provider.js` (new), `index.js` (36 edits) | Medium -- refactor |
| C | 6 + tool_factory | Manifest + SQL/action tool generation | `tool_factory.py` (new), doc | Medium -- new code |
| Merge | 5+7 | Agent deploy + config injection | `deploy_via_sdk.py` (new), template generation | Large -- core SaaS logic |
| Post | 8+9 | Git + multi-project | Git API integration, project manager UI | Medium each |

### Session Planning

Each wave can be a separate Claude Code session:
- **Session 1:** Wave 1 (parallel tracks A+B+C) + Inch 3 test
- **Session 2:** Wave 2 (agent deploy + config injection) + end-to-end test
- **Session 3:** Wave 3 (git + multi-project)

Parallelization within a session uses Claude Code's Agent tool with `isolation: "worktree"`:
- Track A first (2 min, commit)
- Then B + C in parallel worktrees (no file overlap)
- Merge worktree branches, test, proceed to Wave 2

---

## PART 11: Current State

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
- [x] ConfigProvider pattern (LocalConfigProvider + ForgeConfigProvider)
- [x] ForgeConfigProvider: in-memory zip, event-driven flush to UC Volume
- [x] All index.js call sites migrated to config.xxx()
- [x] PY.cmd/PY.pre abstraction for subprocess calls (uv vs python)
- [x] tool_factory.py: create_sql_read_tool() + create_action_tool()
- [x] discover_forge_tools() integrated in agent.py
- [x] deploy/deploy_agent_app.py: generate_app_yaml, generate_databricks_yml, build_agent_bundle, deploy
- [x] deploy/deploy_setup_app.py: one-command Setup App deployment
- [x] deploy/git_push.py: check_git_credentials, create_git_folder, upload_files, commit_and_push
- [x] deploy/grant/run_all_grants.py: Python replacement for bash grants
- [x] project-manager.js: list/load/save/delete projects on UC Volume
- [x] Frontend project selector in title bar
- [x] Git setup step (StepId, setupSteps, SetupDag icon)
- [x] GET /api/stash/health endpoint
- [x] FORGE_STASH_DIR support in data provisioning scripts
- [x] app.yaml + databricks.yml templates in stash/airops/
- [x] Setup App deployed and running on Databricks
- [x] 5 Databricks CLI calls replaced with SDK (lakebase, deploy)
- [x] start.sh + build-release.sh packaging scripts

---

## IMPLEMENTATION LOGBOOK (append-only, never rewrite)

### 2026-05-15 16:20 -- Wave 1 Track A
- Created `setup-app.yaml`: `command: ["bash", "-c", "uv sync && node visual/backend/index.js"]`
- Fixed port in `visual/backend/index.js`: `DATABRICKS_APP_PORT || VISUAL_PORT || 9000`
- Committed: `c867dfc`

### 2026-05-15 16:22 -- Wave 1 Tracks B+C launched in parallel worktrees
- Track B (worktree `agent-ab9e1e22`): ConfigProvider + 20 call site refactor in `index.js`
- Track C (worktree `agent-ade58701`): `tools/tool_factory.py` + `doc/plan/agent-app-manifest.md`

### 2026-05-15 16:25 -- Track C completed
- `tools/tool_factory.py` created: `create_sql_read_tool()`, `create_action_tool()`, `discover_forge_tools()`
- `doc/plan/agent-app-manifest.md` created: Agent App vs Setup App file split
- Committed on worktree: `0f032a8`

### 2026-05-15 16:28 -- Track B completed
- `visual/backend/lib/config-provider.js` created: ConfigProvider interface + LocalConfigProvider
- 20 call sites in `index.js` refactored to use `config.xxx()`
- Committed on worktree: `b60c9b3`

### 2026-05-15 16:30 -- Worktree merge
- Cherry-picked `b60c9b3` (Track B) onto `forge-saas-databricks`: `e65cb27`
- Cherry-picked `0f032a8` (Track C) onto `forge-saas-databricks`: `c739e4e`
- Auto-merged `index.js` (Track A port fix + Track B ConfigProvider) -- no conflicts
- Cleaned up worktrees and branches

### 2026-05-15 16:32 -- Inch 3: First deploy attempt
- Generated fresh PAT from CLI profile `fevm-agent-forge`: `dapie983a64c73c...`
- Updated `.env.local` with new token
- Created app: `POST /api/2.0/apps` -> `brickforge-setup` created
- URL assigned: `https://brickforge-setup-7474654358736177.aws.databricksapps.com`

### 2026-05-15 16:34 -- Upload source to workspace
- Created upload script `/tmp/upload_setup_app_v2.py`
- Created 79 directories via `w.workspace.mkdirs()`
- Uploaded 787 files via `w.workspace.import_()`, 0 errors
- Destination: `/Workspace/Users/mehdi.lamrani@databricks.com/brickforge-setup`

### 2026-05-15 16:36 -- Deploy triggered
- `POST /api/2.0/apps/brickforge-setup/deployments` -> `01f1506adbd314baa4b8fb45c22736fd`
- Status: IN_PROGRESS -> Installing packages -> Starting app

### 2026-05-15 16:39 -- Deploy SUCCEEDED then CRASHED
- Deployment status: SUCCEEDED at 14:39:07
- App status: CRASHED at 14:39:09 (2 seconds later)
- Startup command executed: `bash -c uv sync && node visual/backend/index.js`
- `uv sync` succeeded (packages installed)
- Node.js started then crashed immediately

### 2026-05-15 16:40 -- Crash diagnosis
- Checked logs via `databricks apps logs brickforge-setup`
- **Root cause: `Error: Cannot find module 'dotenv'`**
- The upload script excluded ALL `node_modules/` directories
- `visual/backend/node_modules/` (8MB, committed, required by the Setup App) was excluded
- Node.js v22.16.0 confirmed available in DBX App runtime

### 2026-05-15 16:41 -- Root cause identified
- **Bug location:** Upload script `/tmp/upload_setup_app_v2.py` line: `EXCLUDE = {"node_modules", ...}`
- **Fix needed:** Exclude `node_modules` EXCEPT `visual/backend/node_modules/` which must be uploaded
- **Principle:** Fix the automated process, not the instance. Re-run after fix.

### 2026-05-15 16:50 -- Size analysis before fix
- Uploaded 787 files, ~175MB. Actual need: ~150 files, ~13MB.
- **156MB trash:** `app/client/node_modules/` (100MB), `app/server/node_modules/` (18MB), `app/packages/` (38MB)
- None of these are needed: pre-built `dist/` is included for both client and server.

### 2026-05-15 17:00 -- Upload script v3 (fixed exclusions)
- Fixed to include `visual/backend/node_modules/` (8MB required)
- Result: 1687 files uploaded. WORSE than before (787). node_modules alone = 1088 files.
- The "10x reduction" was wrong. Removed 156MB of trash but added 1088 node_modules files.

### 2026-05-15 17:10 -- Rethink: why upload file by file at all?
- The upload script calls `w.workspace.import_()` per file. 594 files = 594 API calls. Slow.
- `visual/backend/node_modules/` = 1088 files for 4 actual deps (dotenv, express, multer, js-yaml).
- **Better: `npm ci` at startup** instead of uploading node_modules. 2 files (package.json + lock) instead of 1088.
- **Even better: zip the whole app** (594 files -> 5.3MB zip, 1 upload, unzip at startup).

### 2026-05-15 17:15 -- Reality check: USE THE CLI
- `databricks apps deploy brickforge-setup --source-code-path .` does everything in one command.
- CLI handles file upload, deployment creation, waiting. No custom upload script needed.
- **I reinvented the wheel** with a 100-line upload script doing 594 individual API calls.
- **Fix: use the CLI for Setup App deployment. It's installed, the profile works.**

### Decision split:
- **Setup App deploy (from terminal):** `databricks apps deploy` CLI. One command.
- **Agent App deploy (from Setup App, Inch 5):** SDK + zip upload. One API call + unzip at startup. No CLI available inside DBX App.
- **Startup command:** `npm ci` for backend deps instead of uploading node_modules.

### 2026-05-15 17:50 -- Second deploy via CLI
- CLI deploy succeeded. App status: RUNNING. Logs show `uv sync` + `node` started.
- BUT: "App Not Available" in browser.
- **Root cause:** `setup-app.yaml` hardcoded `DATABRICKS_APP_PORT=9000`, overriding platform-injected port.
- **Fix:** removed hardcoded env var. Let platform inject `DATABRICKS_APP_PORT`. Backend reads it.
- Redeploying with fix.

### 2026-05-15 18:00 -- Strategy correction
- Deploying early was wrong. Build and test locally first, deploy when ready.
- Everything except 3 trivial DBX-runtime checks works locally.
- Proceeding with local development: ForgeConfigProvider, agent deploy, .forge injection.
- Will deploy once when all code is ready.

### 2026-05-15 18:10 -- Inch 4b: ForgeConfigProvider implemented
- Added `adm-zip` dep to `visual/backend/` (zero transitive deps)
- Wrote `ForgeConfigProvider` class (~200 lines):
  - In-memory zip with `config.env` (same key=value format as .env.local)
  - Event-driven flush to UC Volume via Files API (`PUT /api/2.0/fs/files/...`)
  - Bootstrap phase (before schema set): config in memory only
  - Persisted phase (after schema set): derives Volume path, flushes on every write
  - File management: `getFile()`, `setFile()`, `deleteFile()`, `listFiles()` for non-config zip entries
  - Auto-creates UC Volume if needed (`CREATE VOLUME IF NOT EXISTS`)
- All in-memory tests passing: list, get, set, toggle, disable, listByPrefix, deleteKey, file ops
- Flush errors expected in local test (no real DATABRICKS_HOST) -- will work in DBX App runtime
- Committed: `dd6e713`

### 2026-05-15 18:15 -- Setup App verified locally with ConfigProvider refactor
- `node visual/backend/index.js` starts, health OK, all 19 setup steps reporting correctly
- LocalConfigProvider wraps existing functions identically -- zero behavior change confirmed

### 2026-05-15 18:30 -- Inch 5+7: Agent deploy script
- Created `deploy/deploy_agent_app.py`:
  - `generate_app_yaml(config)` -- injects all PROJECT_* env vars from config dict
  - `generate_databricks_yml(config)` -- warehouse, genie resources, endpoint resources
  - `build_agent_bundle(config)` -- 4.7MB zip, 547 files (agent, app/dist, tools, data, conf + generated configs)
  - `deploy(config)` -- upload zip to workspace, unzip at startup via start.sh, create/deploy app via SDK
- Backend wired: `exec-deploy-agent` action in index.js writes config JSON, calls deploy script
- Local test: bundle generates correctly, app.yaml has all env vars, databricks.yml has resources
- Committed: `587e3da`

### 2026-05-15 18:45 -- Inch 8: Git push script
- Created `deploy/git_push.py`:
  - `check_git_credentials()` -- verify Databricks has GitHub connected
  - `create_git_folder()` -- create Git Folder linked to user's repo via `w.repos.create()`
  - `upload_files_to_git_folder()` -- extract bundle zip, write files into Git Folder via workspace API
  - `commit_and_push()` -- submit one-shot Databricks job for `git add . && git commit && git push`
  - Uses Databricks-stored git credentials, zero PAT from user
- Backend wired: `exec-git-push` action with `repo_url` param
- Committed: `8db1e27`

### 2026-05-15 19:00 -- Packaging scripts
- Created `build-release.sh`: include-only rsync, 7.1MB / 1767 files. First attempt was 160MB (copied everything).
- Created `start.sh`: checks Node.js + Python, installs deps (uv or pip), starts server.
- Committed: `0bf61c9`, fixed: `b453e86`

### 2026-05-15 19:20 -- Inch 9: Multi-project
- Created `visual/backend/lib/project-manager.js`:
  - `listProjects(schema)` -- scan UC Volume for `.forge.zip` files via Files API
  - `loadProject(schema, name)` -- download zip from Volume
  - `saveProject(schema, name, zipBuffer)` -- upload zip to Volume
  - `deleteProject(schema, name)` -- remove zip from Volume
  - `_ensureVolume(schema)` -- create stash directory if needed
- Backend endpoints wired: `GET/POST/DELETE /api/projects`
- Local test: endpoints respond correctly
- Committed: `9e317ca`

### 2026-05-15 19:35 -- Project selector frontend UI
- Added project selector dropdown in title bar (next to BrickForge logo)
- FolderOpen icon + current project name as button
- Dropdown shows: project list from UC Volume, size, delete button (hover)
- Create new project: inline input + Create button
- Local mode fallback shown at bottom
- Click-outside-to-close behavior
- Frontend rebuilt
- Committed: `b9e1178`

### 2026-05-15 20:00 -- Plan review + gap closure
- Reviewed full plan vs implementation. Found 12 gaps.
- Fixed 5 gaps in one commit (`4acd595`):
  - Gap 1 (HIGH): ForgeConfigProvider wired at startup with mode detection (FORGE_MODE or DATABRICKS_APP_PORT)
  - Gap 2 (MEDIUM): tool_factory.py integrated into agent.py (discover_forge_tools() in init_agent)
  - Gap 4 (LOW): Git setup step added to frontend (StepId, setupSteps, icon, subLabel, STEP_ENV_KEYS)
  - Gap 5 (MEDIUM): 3 Databricks CLI calls replaced with Python SDK (lakebase list/test, deploy test)
- Remaining gaps: pythonCmd() abstraction (LOW), stash verification UI (MEDIUM), start.bat (LOW), deploy-setup.py (MEDIUM), 16 remaining direct call sites (LOW), app.yaml/databricks.yml templates in stash (LOW)

### 2026-05-15 -- Gap closure wave 2 (all except #9 start.bat)
- **Gap 11 (16 direct call sites):** Replaced all 9 remaining `parseEnvFile()`, `writeEnvValues()`, `parseMultiInstanceKeys()` calls in `index.js` with `config.list()`, `config.setMany()`, `config.listByPrefix()`, `config.toEnvDict()`. Zero direct calls remain outside function definitions and LocalConfigProvider constructor.
- **Gap 6 (pythonCmd abstraction):** Added `const PY = { cmd, pre }` helper after FORGE_MODE detection. Replaced all 40+ JS-level `'uv', ['run', 'python', ...]` calls with `PY.cmd, [...PY.pre, ...]` across `runCommand()`, `execFile()`, `spawn()`, `sseGenRunner()`. Python-internal subprocess calls unchanged (uv available in both modes).
- **Gap 12 (bundle templates in stash):** Created `stash/airops/app.yaml` and `stash/airops/databricks.yml` reference templates with placeholder vars.
- **Gap 3 (stash health endpoint):** Added `GET /api/stash/health` -- scans `stash/` directory, parses each `.forge` manifest, verifies all referenced files (DDL, seed CSV, tools, prompts, configs) exist, checks expected dirs (tools/, data/, conf/) and optional bundle templates.
- **Gap 10 (deploy-setup.py):** Created `deploy/deploy_setup_app.py` -- one-command Setup App deployment via Databricks CLI. Pre-flight checks (CLI auth, frontend built, app.yaml present), create-or-update app, deploy source, retrieve URL.
- **Gap 8 (data provisioning from .forge):** Added `FORGE_STASH_DIR` env var support to `create_all_assets.py`, `create_all_functions.py`, `create_all_procedures.py`, and inline `exec-tables` script. When set, data paths resolve to stash directory instead of `data/default/`.
- All changes syntax-verified: `node -c visual/backend/index.js` passes clean.

### 2026-05-15 -- Full plan audit + last gap
- Scanned all 11 parts of saas-plan.md against codebase. All items verified: tool_factory, agent.py integration, deploy scripts, project-manager, frontend project selector, ConfigProvider, setup-app.yaml, start scripts, git step, stash completeness, ForgeConfigProvider methods.
- **One gap found:** `deploy/grant/run_all_grants.py` (Python replacement for bash script) was missing.
- Created `deploy/grant/run_all_grants.py`: runs all 7 grant steps (tables, functions, warehouse, endpoints, genie, lakebase, secrets) via subprocess. Step 7 uses SDK (`w.secrets.put_acl`) instead of CLI (`databricks secrets put-acl`).
- Updated `index.js` exec-grants action: `bash deploy/run_all_grants.sh` -> `PY.cmd [...PY.pre, 'deploy/grant/run_all_grants.py']`. One fewer bash dependency.
- Remaining bash calls in backend: `deploy/deploy.sh` (exec-deploy, exec-deploy-dry) -- kept as local-mode fallback, SDK deploy (`exec-deploy-agent`) exists alongside.

### 2026-05-15 -- The npm/pip Deploy Saga (chronological)

**Context:** App was working. Redeploying with new code (gap closures, stash health UI, PY abstraction).

**Deploy 1 -- `01f1508205551f7e` (17:17)**
- Uploaded 188 files to workspace via SDK. Upload script had `node_modules` in EXCLUDE_PATTERNS.
- SDK reported SUCCEEDED + ACTIVE. But browser showed "App Not Available".
- **Cause:** `npm ci` ran without local `node_modules` (excluded from upload), tried to download from `npm-proxy.dev.databricks.com`. Timed out after 8 minutes (ETIMEDOUT on `util-deprecate-1.0.2.tgz`). Node never started. The `&&` chain stopped silently.
- **Misleading signal:** SDK said SUCCEEDED because deployment = "source code copied". The app command crash happened AFTER the deployment was marked successful.

**Deploy 2 -- `.npmrc` with cloud proxy (18:22)**
- Created `visual/backend/.npmrc` with `registry=https://npm-proxy.cloud.databricks.com/`.
- SDK reported SUCCEEDED. But `npm ci` returned corrupted tarballs: `npm warn tarball data for supports-color ... seems to be corrupted. Trying again.` Retried for minutes, never recovered.
- **Lesson:** Both Databricks npm proxies are unreliable:
  - `npm-proxy.dev.databricks.com` -- times out (ETIMEDOUT)
  - `npm-proxy.cloud.databricks.com` -- returns corrupted tarballs

**Deploy 3 -- `.npmrc` with public registry (19:09)**
- Changed `.npmrc` to `registry=https://registry.npmjs.org/`.
- **But:** `.npmrc` dotfile was NOT included in the workspace snapshot. npm still hit `npm-proxy.dev.databricks.com`. Same ETIMEDOUT.
- **Lesson:** Databricks workspace snapshots skip dotfiles.

**Deploy 4 -- `--registry` CLI flag (19:38)**
- Changed `app.yaml` command to `npm ci --registry https://registry.npmjs.org/`.
- **But:** npm IGNORED the `--registry` flag. Still hit `npm-proxy.dev.databricks.com`. Same ETIMEDOUT.
- **Lesson:** Databricks App runtime has a system-level npm proxy config (likely `~/.npmrc` or env var) that overrides both `.npmrc` project files and `--registry` CLI flags. Cannot be bypassed.

**pip ERROR discovered in parallel**
- Platform BUILD phase auto-ran `pip install -r requirements.txt` (because file existed in source).
- 12 dependency conflicts with pre-installed runtime packages (databricks-sql-connector, dash, streamlit, gradio need older versions of pandas, pyarrow, flask, pillow, protobuf, etc.).
- pip printed `ERROR:` -- initially dismissed as "just a warning". Wrong. It broke the environment.
- Then `uv sync` ran and **uninstalled 86 packages** trying to reconcile.
- **Fix:** Deleted `requirements.txt` from workspace AND from git. `uv sync` from `pyproject.toml` handles all Python deps in an isolated `.venv/`. No conflict with pre-installed packages.
- **Lesson:** When the log says ERROR, it's an error. Don't dismiss.

**Deploy 5 -- instrumented command, no npm ci (20:02)**
- Added step markers `[1/2] uv sync...`, `[2/2] starting node...` to `app.yaml` for visibility.
- Removed `npm ci` entirely (deps are all pure JS, no native binaries needed).
- Node crashed: `Error: Cannot find module 'adm-zip'`.
- **Cause:** `adm-zip` was added to `package.json` for ForgeConfigProvider but never committed to git. Previous deploys installed it via `npm ci`. Without `npm ci`, it's missing.

**Deploy 6 -- adm-zip uploaded manually (20:24)**
- Uploaded 19 `adm-zip` files to workspace via SDK.
- Deployed with `app.yaml`: `uv sync && node visual/backend/index.js` (no npm ci).
- **Result: App started successfully. 502 gone. Working.**

**What finally worked:**
1. Delete `requirements.txt` (stops platform BUILD phase pip conflicts)
2. `uv sync` for Python deps (isolated `.venv/`, no conflicts with pre-installed packages)
3. No `npm ci` (Databricks npm proxy cannot be bypassed, all deps are pure JS anyway)
4. `node_modules/` uploaded as source (including `adm-zip` which was missing from git)
5. Final `app.yaml`: `command: ["bash", "-c", "uv sync && node visual/backend/index.js"]`

**Key learnings for DBX App deployments:**
- Deployment SUCCEEDED != app is running. The status only covers source code copy, not app startup.
- Databricks npm proxy (`npm-proxy.dev.databricks.com`) is baked into the runtime. Cannot be overridden by `.npmrc`, `--registry`, or any config. It times out and returns corrupted data.
- Dotfiles (`.npmrc`) are excluded from workspace snapshots.
- `pip install -r requirements.txt` runs automatically in BUILD phase if the file exists. Conflicts with pre-installed packages. Use `uv sync` instead (isolated venv).
- Always pull actual logs with `databricks apps logs <name> -p <profile>`. SDK status is misleading.
- Never stop app compute (`w.apps.stop()`). Just create new deployments.

### 2026-05-15 -- Deploy footprint optimization

Every DBX App deployment snapshots the entire workspace source path file-by-file. 1000+ files = 6 min deploy. Fewer files = faster deploys.

**Setup App -- node_modules tar.gz:**
- Pruned devDependencies (nodemon): 1107 -> 785 files
- Stripped docs, tests, .github, fsevents, source maps: 785 -> 473 files
- Tar.gz'd: 3.4MB / 473 files -> 669KB / 1 file
- Startup unzips in ~2s: `tar xzf node_modules.tar.gz`
- Purged all other node_modules locally (935MB freed): app/, app/client/, app/server/, visual/frontend/ -- none needed at runtime (pre-built dist/ dirs)

**Agent App -- dist tar.gz:**
- `app/client/dist/` (React chat UI): 16MB / 471 files -> 4.1MB tar.gz
- `app/server/dist/` (Express server): 2.2MB / ~30 files -> 526KB tar.gz
- `deploy_agent_app.py` updated: uses pre-built tar.gz if present, falls back to on-the-fly compression
- Startup script unpacks both before starting: `tar xzf dist.tar.gz` per dir (~2s)
- `requirements.txt` removed from agent bundle (uv sync handles it)

**Total footprint reduction:**

| Component | Before | After |
|-----------|--------|-------|
| Setup App node_modules | 7.7MB / 1107 files | 669KB / 1 file |
| Agent App dist dirs | 18.2MB / ~500 files | 4.6MB / 2 files |
| Combined | 25.9MB / ~1600 files | 5.3MB / 3 files |

Expected deploy time improvement: ~6 min -> ~1-2 min (snapshot of 3 files vs 1600).

### Setup App UI -- Invocation Map (SDK / REST / CLI)

Every backend action invoked by the Setup App UI, classified by what it calls under the hood and whether it works in deployed (DBX App) mode.

**Legend:** SDK = Python `WorkspaceClient()`, REST = raw `urllib.request`, CLI = `databricks` Go binary, PY = Python script via subprocess

#### Host step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| keep current | read config | Config | YES |
| use existing CLI profile | `databricks auth profiles` | CLI | NO -- CLI not installed |
| set up new workspace | `databricks auth login --host` (opens browser) | CLI | NO -- CLI not installed, no browser |
| enter manually | save to config | Config | YES |

#### Auth step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| keep current | read config | Config | YES |
| generate 7-day PAT | Python script creates PAT via SDK | SDK | YES (if host configured) |
| enter token manually | save to config | Config | YES |

#### Warehouse step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| keep current | read config | Config | YES |
| pick from workspace | `w.warehouses.list()` | SDK | YES |
| enter id manually | save to config | Config | YES |

#### Schema step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| pick existing catalog | `w.catalogs.list()` | SDK | YES |
| keep current | read config | Config | YES |
| enter manually | save to config | Config | YES |

#### Tables step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| provision tables | `create_catalog_schema.py` + `run_sql.py` per table | PY+SDK | YES |
| keep current | noop | Config | YES |

#### Functions step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| create all | `create_all_functions.py` + `create_all_procedures.py` | PY+SDK | YES |
| keep current | noop | Config | YES |

#### Model endpoint step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| same workspace | comment out FM-specific keys | Config | YES |
| use existing profile | `databricks auth profiles` + auto-PAT | CLI+SDK | NO -- CLI part fails |
| set up new workspace | `databricks auth login` | CLI | NO |
| keep current | read config | Config | YES |
| enter manually | save to config | Config | YES |

#### Prompt step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| generate from domain | `generate_prompts.py --mode=generate` | PY (LLM call) | YES |
| view / edit prompts | read/write `conf/prompt/` files | Filesystem | YES |
| keep current | noop | Config | YES |

#### Genie step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| pick existing space | `w.genie.list_spaces()` | SDK | YES |
| create new room | `create_genie_space.py` | PY+SDK | YES |
| keep current | read config | Config | YES |
| enter id manually | save to config | Config | YES |

#### KA step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| provision from pdfs | volume upload + `create_kas_from_yml.py` | PY+SDK | YES |
| keep current | read config | Config | YES |
| enter id manually | save to config | Config | YES |

#### Vector Search step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| keep current | read config | Config | YES |
| enter index path | save to config | Config | YES |

#### MCP / API / A2A steps

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| add server/connection/agent | save to config | Config | YES |
| keep current | read config | Config | YES |

#### Features step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| keep current | toggle config keys | Config | YES |

#### Lakebase step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| pick existing | `w.database.list_database_instances()` | SDK | YES |
| create instance | `create_lakebase.py` | PY+SDK | YES |
| keep current | read config | Config | YES |
| enter name manually | save to config | Config | YES |

#### MLflow step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| create new experiment | `create_mlflow_experiment.py` | PY+SDK | YES |
| keep current | read config | Config | YES |
| enter id manually | save to config | Config | YES |

#### Grants step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| run grant script | `run_all_grants.py` (7 steps) | PY+SDK | YES |
| view issues | read config | Config | YES |

#### Deploy step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| deploy now | `deploy.sh` (DAB bundle) | Bash+CLI | NO -- needs `databricks` CLI |
| dry run | `deploy.sh --dry-run` | Bash+CLI | NO |
| deploy agent (SDK) | `deploy_agent_app.py` | PY+SDK | YES |
| set app name | save to config | Config | YES |

#### Git step

| UI Action | Backend | Method | Works deployed? |
|-----------|---------|--------|-----------------|
| push to GitHub/GitLab | `git_push.py` (Git Folders API) | PY+SDK | YES |
| skip | noop | - | YES |

#### Test endpoints (per step)

| Step | Method | Works deployed? |
|------|--------|-----------------|
| host | REST (`/api/2.0/preview/scim/v2/Me`) | YES |
| auth | REST (SCIM with token) | YES |
| warehouse | SDK (`w.warehouses.get()`) | YES |
| schema | SDK (`w.schemas.get()`) | YES |
| model | REST (POST to endpoint) | YES |
| genie | SDK (`w.genie.get_space()`) | YES |
| ka | SDK (`w.serving_endpoints.get()`) | YES |
| mlflow | SDK (`w.experiments.get_experiment()`) | YES |
| lakebase | SDK (`w.database.get_database_instance()`) | YES |
| deploy | SDK (`w.apps.get()`) | YES |

#### Summary -- what breaks on deployed

| Step | Broken action | Method | Fix |
|------|--------------|--------|-----|
| host | "use existing CLI profile" | CLI (`databricks auth profiles`) | Hide in FORGE_MODE, or replace with SDK workspace discovery |
| host | "set up new workspace" | CLI (`databricks auth login`) | Hide in FORGE_MODE, use manual entry |
| model | "use existing profile" | CLI | Same -- hide or replace |
| model | "set up new workspace" | CLI | Same |
| deploy | "deploy now" / "dry run" | Bash + CLI (`deploy.sh`) | Hide in FORGE_MODE, use SDK deploy (`deploy_agent_app.py`) |

**5 broken actions out of ~50 total. All caused by CLI dependency. All fixable by hiding in FORGE_MODE or replacing with SDK equivalents.**
