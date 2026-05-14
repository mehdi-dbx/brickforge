# BrickForge SaaS Master Plan

> CRITICAL: This file is the source of truth. Never overwrite. Only append.
> Created after context compression lost the original conversation.

---

## Vision

Transform BrickForge from a locally-cloned project into a cloud-native SaaS product.
The user never clones a repo, never runs a terminal, never installs anything.
They open a browser, create an agent, deploy it. Done.

---

## Core Architecture

### Setup App = The Product

The visual Setup App (currently `visual/`) IS the product. It:
- Creates and manages `.forge` projects (multi-project: save/load/switch)
- Walks users through domain setup via LLM-assisted wizard
- Provisions UC data (tables, functions, procedures)
- Deploys the Agent App to Databricks
- Runs as a Databricks App itself (or locally for dev)

### 3 Runtime Modes

| Mode | How | Who |
|------|-----|-----|
| **A: Hosted** | Maintainer deploys Setup App once, users just open the URL | Quick start / demo |
| **B: User's DBX App** | User deploys Setup App to their own workspace | Production use |
| **C: Local** | `node visual/backend/index.js` | Dev / offline |

All three modes connect to user's Databricks workspace via SDK.
The user's auth flows through -- Setup App uses their credentials, not a service principal acting alone.

### What Lives Where

| Asset | Location |
|-------|----------|
| Framework code (agent runtime, React frontend, Express API, deploy logic) | Static artifact bundled inside Setup App |
| `.forge` YAML per project | UC Volume or workspace files in user's workspace |
| Provisioned data (tables, functions, procedures) | User's UC catalog/schema |
| Deployed Agent App | User's Databricks Apps |
| User's machine | **Nothing** (unless running local mode C) |

---

## `.forge` YAML

### What It Is
- Internal serialization format -- machine-generated, machine-consumed
- One `.forge` file per project
- User NEVER writes YAML by hand -- the Setup App wizard generates it

### What It Contains
- Domain description
- Table definitions (DDL, seed data references)
- UC function SQL
- Stored procedure SQL
- Tool definitions (declarative: 3 patterns)
- System prompt + knowledge base + starter prompts
- KA configurations
- Genie space config
- Eval dataset + scorer config
- UI dashboard config (which tables to show, colors)

### Where It's Stored
- UC Volume in user's workspace (modes A & B)
- Local filesystem (mode C)
- The Setup App reads/writes `.forge` files directly via SDK

### First Example
`stash/airops/airops.forge` -- extracted from the original airops domain.
This file defines the `.forge` schema by example.

---

## Stash System

### What Is a Stash
A self-contained folder with a `.forge` manifest + sidecar files:
```
stash/airops/
  airops.forge          # manifest
  tools/                # domain tool Python files
  data/csv/             # seed CSVs
  data/init/            # DDL SQL
  data/func/            # UC function SQL
  data/proc/            # stored procedure SQL
  conf/prompt/          # system prompt, knowledge base, starters
  conf/ka/              # KA configs
  eval/                 # eval dataset
  app/components/       # domain React card components
```

### How Stashes Are Created
1. **By extraction** -- airops was extracted from the original codebase (already done)
2. **By the wizard** -- Setup App's LLM-assisted wizard generates new stashes from a domain description (tables, prompts, tools, KAs -- all generated)

The airops extraction defined the `.forge` schema. Every future stash follows the same format.

---

## Deploy Flow (No Local Clone)

1. User opens Setup App in browser
2. Picks existing project (load) or creates new one
3. Wizard walks through domain setup (LLM-assisted):
   - Describe domain in natural language
   - LLM generates table schemas, user reviews/edits
   - LLM generates prompts, tools, KA configs
   - All tools declarative (3 patterns: SQL read, action, KA query)
4. `.forge` YAML generated internally (user never sees it)
5. `.forge` saved to UC Volume
6. User clicks "deploy"
7. Setup App provisions UC data (tables, functions, procedures via SDK calls)
8. Setup App deploys Agent App:
   - Agent source code is bundled inside the Setup App as embedded files
   - Setup App extracts agent code, injects `.forge` config
   - Uploads to workspace files via SDK
   - Calls Databricks Apps API to create + deploy the Agent App
   - User's auth flows through -- their permissions govern what gets created
9. Agent App is live -- user gets a URL

### Agent Code Bundling
- The agent code (Python runtime, React frontend, Express API) is a **static artifact inside the Setup App**
- It's the same for every user -- the only variable is the `.forge` config
- On deploy: extract, inject config, upload, call Apps API
- Size is not a concern (we're not talking GBs)

### Why This Works
- Databricks Apps support Node.js -- Setup App is already Node.js
- Apps API exists for creating/deploying apps programmatically
- User's auth context flows through the Setup App
- No service principal magic needed -- the user IS authenticated

---

## Multi-Project Support

Users will have MULTIPLE `.forge` projects. The Setup App is a project manager:

- **Save** -- persist `.forge` to UC Volume
- **Load** -- list existing `.forge` files, load one
- **Switch** -- jump between projects without losing state
- **Redeploy** -- update and redeploy after changes

Each project = separate UC schema + separate Agent App instance.

---

## Tools Are Declarative

3 patterns cover all use cases -- no custom Python needed:

| Pattern | What | Source |
|---------|------|--------|
| **SQL read** | UC function name + params | Generated SQL in `.forge` |
| **Action** | Stored procedure name + params | Generated SQL in `.forge` |
| **KA query** | Knowledge Assistant endpoint | Auto-discovered from `PROJECT_KA_*` |

The framework generates Python tool code at runtime from the `.forge` spec.
The `ka_factory.py` already does this for KA tools.
The same pattern extends to SQL read and action tools.

---

## UI Dashboard (Cards)

- Card components (status-table, metric-card, etc.) stay in the framework as generic styled templates
- The `.forge` config has a `ui:` section that drives what data fills them
- The Setup App wizard generates the `ui:` section based on table schemas
- User can tweak in a visual card configurator (pick card type, table, columns, colors)
- No CSS, no React knowledge needed -- just a config UI

**This is cosmetic / low priority. The core SaaS flow comes first.**

---

## Constraints

- **No notebooks** -- code-first only, no exceptions
- **No lazy shortcuts** -- production engineering, go to the last mile
- **No hardcoded domain content** -- framework is domain-agnostic (verified by nuclear scan)
- **Multi-project aware** -- every design decision accounts for N projects

---

## Implementation Priority

### Phase 1: Setup App as DBX App (immediate)
Make the visual Setup App deployable as a Databricks App.
It's already a Node.js server with pre-built frontend. Needs:
- `app.yaml` for the Setup App itself
- Auth handling (use Databricks App auth context)
- Test deploy to a workspace

### Phase 2: Remote Agent Deploy
Setup App deploys Agent App via Databricks Apps API.
- Bundle agent code inside Setup App
- Upload to workspace files on deploy
- Call Apps API to create/start Agent App
- Inject `.forge` config

### Phase 3: Project Management
Save/load/switch `.forge` projects.
- UC Volume storage for `.forge` files
- Project selector UI in Setup App
- Per-project schema isolation

### Phase 4: Wizard Enhancement
LLM-assisted domain setup generates complete `.forge`.
- Extend data gen wizard to also generate prompts, tools, KA config
- The wizard output IS the `.forge` file

### Phase 5: Polish
- Card configurator
- Stash gallery (pre-made domain packs)
- Hosted mode multi-tenancy considerations

---

## Current State (post domain extraction)

- Framework is domain-agnostic (verified: zero domain references)
- `stash/airops/` has the extracted airops domain with `airops.forge` manifest
- Agent uses dynamic tool discovery (`_discover_domain_tools()`)
- Agent uses lazy WorkspaceClient init (no SDK call at import time)
- KA tools auto-discovered via `ka_factory.py`
- Genie spaces auto-discovered via `PROJECT_GENIE_*` env vars
- Frontend has domain plugin registry (`domainCardRenderers`, `domainToolMessages`, `domainDashboardConfig`)
- Response blocks parser is generic (framework blocks + domain pass-through)
- Deploy pipeline is dynamic (no hardcoded env keys)
- Git checkpoint: tag `pre-saas-transition` on branch `forge-saas-databricks`
