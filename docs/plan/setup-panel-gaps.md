# Setup Panel Gaps -- Complete User Flow Analysis

> Created: 2026-06-01

## Context

Walking the full user journey through the setup panel from pip install to deployed agent. Each step mapped with dependencies, backend triggers, and identified gaps.

## Complete User Flow

### Step 1: Install + Launch
```
pip install brickforge --pre
brickforge
```
- CLI: `brickforge/cli.py` -> `brickforge/server.py` (FastAPI on port 9000)
- Config: `~/.brickforge/.env.local` (pip) or `PROJECT_ROOT/.env.local` (editable)

### Step 2: Connect Workspace (host block)
- Bridge-forge OAuth PKCE flow (`brickforge/scripts/connect.sh`)
- PAT creation, IP whitelist attempt
- Saves `DATABRICKS_HOST` + `DATABRICKS_TOKEN`
- **Depends on:** nothing
- **Test:** SDK ping

### Step 3: Select Warehouse (warehouse block)
- Lists running warehouses via SDK
- Saves `DATABRICKS_WAREHOUSE_ID`
- **Depends on:** step 2
- **Test:** `w.warehouses.get(id)`

### Step 4: Create/Select Schema (schema block)
- Creates catalog + schema via `create_catalog_schema.py`
- Saves `PROJECT_UNITY_CATALOG_SCHEMA`
- **Depends on:** step 2
- **Test:** SDK verifies catalog.schema exists
- **Gap #1:** No "verifying..." feedback (PR #4 fixes)

### Step 5: Data Tables (tables block)
- Provision Delta tables from CSV / upload / generate / connect existing / skip
- **Depends on:** step 4
- **Gap #2:** CSV-only in pip install (PR #5 fixes)
- **Test should check:** UC tables exist (not local CSV files)

### Step 6: UC Functions (functions block)
- Create SQL functions + stored procedures in UC
- **Depends on:** step 5 (routines are written against table schemas)
- **Gap #3:** SQL-only "create all" fails on pip install
- **Gap #4:** No dependency enforcement on tables block
- **Gap #5:** Routines wizard doesn't auto-feed table schemas from step 5
- **Gap #6:** `provision-gen` uses stale `uv run` reference
- **Gap #7:** Functions (query templates) never provisioned to UC -- only procedures
- **Gap #8:** Test checks local .sql files, not UC state
- **Gap #9:** Stash SQL files not resolved from PACKAGE_ROOT in pip

### Step 7: Model Endpoint (model block)
- Auto-discover FM endpoints or cross-workspace auth
- Saves `AGENT_MODEL_ENDPOINT`
- **Depends on:** step 2
- **Test:** HTTP POST test message

### Step 8: Agent Prompt (prompt block)
- Edit system prompt + knowledge base, or generate via LLM
- **Depends on:** nothing

### Step 9-13: Optional blocks
- Genie (depends on step 4+5), KA, Vector Search, MCP, API, A2A, Features
- All optional, all depend on step 2 at minimum

### Step 14: Lakebase (lakebase block)
- Agent memory + chat history
- **Depends on:** step 2
- Optional (stateless without it)

### Step 15: MLflow (mlflow block)
- Eval tracking
- **Depends on:** step 2
- Optional

### Step 16: Grants (grants block)
- UC permissions for deployed app SP
- **Depends on:** steps 4-6 (resources must exist)
- Typically post-deploy

### Step 17: Deploy (deploy block)
- Bundle + upload + create DBX App
- **Minimum depends on:** steps 2, 3, 4, 7
- Steps 5, 6 optional (agent works without data/functions)

### Step 18: Git Push (git block)
- Push to GitHub/GitLab
- Optional

## Dependency Chain

```
Connect Workspace (2)
    |
    +-> Warehouse (3)
    +-> Schema (4)
    |       |
    |       +-> Tables (5)
    |       |       |
    |       |       +-> Functions (6) -- MUST have table schemas
    |       |
    |       +-> Genie (9) -- needs tables to query
    |
    +-> Model Endpoint (7)
    |
    +-> Deploy (17) -- needs 2, 3, 4, 7 minimum
```

## All Gaps

| # | Gap | Block | Severity | Status |
|---|-----|-------|----------|--------|
| 1 | No "verifying..." on schema test | schema | Low | PR #4 |
| 2 | Tables block CSV-only, fails on pip | tables | High | PR #5 |
| 3 | Functions block SQL-only, fails on pip | functions | High | Needs issue |
| 4 | Functions doesn't enforce tables-first | functions | High | Needs issue |
| 5 | Routines wizard doesn't auto-feed table schemas | functions | High | Needs issue |
| 6 | provision-gen uses stale `uv run` | functions | Medium | Needs fix |
| 7 | Functions (query templates) never provisioned | functions | Needs clarification | |
| 8 | Tests check local files, not UC state | tables, functions | Medium | Needs issue |
| 9 | Stash SQL not resolved from PACKAGE_ROOT | functions | Medium | Needs fix |
| 10 | No dependency ordering enforcement | all | Medium | Design decision |
| 11 | Generated SQL must flow into .forge stash | functions | Medium | Needs verification |
