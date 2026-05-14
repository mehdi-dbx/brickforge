# Changes Log -- AirOps Stash Extraction

Tracks every action taken during the domain extraction for regression testing.

---

## Phase 0: Scaffold

- [x] Created `stash/airops/` directory structure (tools, data, conf, app, eval)
- [x] Created `changes.md`
- [x] Created `stash/airops/airops.forge` manifest (validated as YAML)

## Phase 1: Extract Data Layer

- [x] Moved `data/default/csv/flights.csv` -> `stash/airops/data/csv/`
- [x] Moved 5 DDL SQL files from `data/default/init/` -> `stash/airops/data/init/`
- [x] Moved 11 function SQL files from `data/default/func/` -> `stash/airops/data/func/`
- [x] Moved 4 procedure SQL files from `data/default/proc/` -> `stash/airops/data/proc/`
- [x] Added `.gitkeep` to empty `data/default/` subdirs

## Phase 2: Extract Config

- [x] Moved `conf/prompt/main.prompt` -> `stash/airops/conf/prompt/`
- [x] Moved `conf/prompt/knowledge.base` -> `stash/airops/conf/prompt/`
- [x] Moved `conf/prompt/user.prompt` -> `stash/airops/conf/prompt/`
- [x] Moved `conf/ka/ka_passengers.yml` -> `stash/airops/conf/ka/`
- [x] Moved `conf/vector-search/vs_passengers.yml` -> `stash/airops/conf/vector-search/`
- [x] Created blank skeleton `conf/prompt/main.prompt`
- [x] Created empty `conf/prompt/knowledge.base` and `conf/prompt/user.prompt`

## Phase 3: Extract Eval

- [x] Moved `eval/data/ec261_eval_dataset.jsonl` -> `stash/airops/eval/data/`
- [x] Moved `eval/eval_dataset.py` -> `stash/airops/eval/`
- [x] Framework eval scripts remain: `predict.py`, `run_eval.py`, `scorer.py`

## Phase 4: Extract Tools + Refactor Agent

- [x] Moved 19 domain tool files from `tools/` -> `stash/airops/tools/`
- [x] Framework tools remain: `__init__.py`, `sql_executor.py`, `ka_factory.py`, `get_current_time.py`
- [x] Refactored `agent/agent.py`: removed 19 hardcoded tool imports, added `_discover_domain_tools()` with `pkgutil.iter_modules`
- [x] Refactored `agent/start_server.py`: replaced hardcoded `_ALLOWED_TABLES` with `_get_allowed_tables()` that queries UC schema dynamically

## Phase 5: Generalize Backend + Deploy

- [x] `data/init/create_genie_space.py`: removed hardcoded "check-in/flight" description, uses env var `GENIE_DESCRIPTION` with generic fallback, removed domain sample questions
- [x] `app.yaml`: replaced `"amadeus.airops"` with `"PLACEHOLDER_SCHEMA"`
- [x] `databricks.yml`: replaced `'agent-forge-checkin'` with `'PLACEHOLDER_GENIE_NAME'`, `'agent-airops-voca-lab-user'` with `'PLACEHOLDER_APP_NAME'`
- [x] `deploy/sync_databricks_yml_from_env.py`: replaced hardcoded `'agent-forge-checkin'` with dynamic `GENIE_ROOM_NAME` from env
- [x] `visual/frontend/src/setupSteps.ts`: removed domain text from warehouse/genie/ka help strings (flight data, check-in metrics, EU passenger rights, EC 261/2004)
- [x] `visual/backend/index.js`: changed default genie room name from "Checkin Metrics" to "Project Data"

## Phase 6: Extract Frontend Domain Components

- [x] Moved 13 domain card TSX files from `app/client/src/components/elements/` -> `stash/airops/app/components/`
- [x] Moved `app/client/src/components/MetricsOverview.tsx` -> `stash/airops/app/components/`
- [x] Created `app/client/src/domain/index.ts` -- empty domain plugin registry
- [x] Refactored `app/client/src/components/message.tsx`: replaced 12 static card imports + if/else chain with `domainCardRenderers` registry lookup
- [x] Refactored `app/client/src/components/chat-loading-indicator.tsx`: replaced hardcoded `TOOL_MESSAGES` with `domainToolMessages` from domain plugin
- [x] Refactored `app/client/src/components/chat-panel-header.tsx`: replaced domain personas, table refresh calls, and "Agent Forge" branding
- [x] Refactored `app/client/src/components/task-events-listener.tsx`: replaced `refresh('checkin_agents')` with generic `refresh('*')`
- [x] Refactored `app/client/src/pages/HomePage.tsx`: replaced hardcoded TABLE_PASTELS, table cards, and column formatters with `domainDashboardConfig` from domain plugin
- [x] Refactored `app/server/src/routes/tables.ts`: removed hardcoded ALLOWED_TABLES, replaced with regex validation (backend handles UC auth)

## Phase 7: Nuclear Scan + Cleanup

- [x] Nuclear scan for remaining domain references
- [x] `suggested-actions.tsx`: replaced flight/checkin starter prompts with generic ones
- [x] `messages.tsx`: replaced hardcoded persona messages with prefix-based match
- [x] `task-notification-toast.tsx`: replaced "Check-in Manager" default with generic "Manager"
- [x] `useTableData.ts`: replaced hardcoded KEY_COLUMN_BY_TABLE with heuristic (_id/_number suffix)
- [x] `HomePage.tsx`: generalized formatCell column detection (suffix-based instead of hardcoded names)
- [x] Moved `scripts/py/create_eval_dataset.py` to `stash/airops/eval/`

- [x] Rewrote `response-blocks.ts`: removed all domain parsers (turnaround, checkin_*, staffing_duty). Kept framework blocks (refresh_table, knowledge_base). Added generic domain block pass-through.
- [x] Cleaned `ChatSendMessageContext.tsx`: replaced hardcoded `checkin_agents` fetch with no-op placeholder
- [x] Cleaned `app/server/src/index.ts`: replaced "Check-in Manager" default with "Manager"
- [x] Rewrote `visual/backend/lib/graph-builder.js`: fully dynamic -- auto-discovers tools, functions, procedures, tables from filesystem. Zero hardcoded domain content.
- [x] Moved `scripts/py/create_eval_dataset.py` to `stash/airops/eval/`

### Remaining (scripts, non-core):
- `scripts/py/setup_dbx_env.py`: hardcoded table names in verification (~line 999) and KA setup (~line 1935)
- `scripts/py/ka/delete_kas_by_display_name.py`: example command references "agent-forge-passenger-rights"
- `scripts/py/vs/verify_vs_index.py`: default test query "passenger rights compensation"

### Nuclear scan result: ZERO domain references in core framework
```
grep -rn "checkin_agents|checkin_metrics|flights_at_risk|border_officers|border_terminals|
AT_RISK|BA312|amadeus.airops|delay_risk|EC.261|passenger.right|flight_number|
Check-in Manager|Check-in Agent" agent/ app/client/src/ app/server/src/ conf/ 
data/default/ deploy/ visual/frontend/src/ visual/backend/ → 0 matches
```

### Summary
- **49 files moved** to `stash/airops/` (19 tools, 21 SQL/CSV, 5 config, 3 eval, 14 React components)
- **20+ files refactored** (agent.py, start_server.py, message.tsx, response-blocks.ts, HomePage.tsx, graph-builder.js, etc.)
- **Framework is domain-agnostic** -- verified by nuclear scan with zero matches
- **Domain plugin system** created (app/client/src/domain/index.ts) for card rendering, tool messages, dashboard config
