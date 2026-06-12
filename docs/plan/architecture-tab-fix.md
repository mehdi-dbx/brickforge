# Plan: Fix Architecture Tab

> Status: IMPLEMENTED

## Problem

`graph_builder.py` is frozen in time. It reads config from `app.yaml` (deploy artifact, no project data), scans dead paths (`data/default/`), and has no nodes for 7 capabilities added since it was built. The Architecture tab shows a broken or empty diagram.

## Changes

### File: `brickforge/lib/graph_builder.py` (full rewrite of `build_graph()`)

#### A. Config source: `os.environ` instead of `app.yaml`

Replace:
```python
app_yaml = _read_app_yaml()
env_vars = _extract_env_vars(app_yaml)
endpoint = env_vars.get("AGENT_MODEL", "")
```

With:
```python
import os
endpoint = os.environ.get("AGENT_MODEL", "")
schema = os.environ.get("PROJECT_UNITY_CATALOG_SCHEMA", "")
genie_raw = os.environ.get("PROJECT_GENIE_SPACES", "")
```

The config system already flattens `config.json` to `os.environ` on startup. No need to read files.

Delete `_read_app_yaml()` and `_extract_env_vars()` -- dead code.

#### B. Data paths: project-scoped via `project_paths.py`

Replace:
```python
funcs = _scan_dir(PACKAGE_ROOT / "data" / "default" / "func", ".sql")
procs = _scan_dir(PACKAGE_ROOT / "data" / "default" / "proc", ".sql")
tables = _scan_dir(PACKAGE_ROOT / "data" / "default" / "csv", ".csv")
```

With:
```python
from lib.project_paths import gen_dir
gd = gen_dir()
funcs = _scan_dir(gd / "func", ".sql") + _scan_dir(PACKAGE_ROOT / "data" / "demo" / "func", ".sql")
procs = _scan_dir(gd / "proc", ".sql") + _scan_dir(PACKAGE_ROOT / "data" / "demo" / "proc", ".sql")
tables = _scan_dir(gd / "csv", ".csv") + _scan_dir(PACKAGE_ROOT / "data" / "demo" / "csv", ".csv")
```

Dedup by name (project-scoped wins over demo).

#### C. Framework tools exclusion list: sync with agent.py

Replace:
```python
FRAMEWORK_TOOLS = {"sql_executor", "ka_factory", "get_current_time", "__init__"}
```

With:
```python
FRAMEWORK_TOOLS = {"sql_executor", "ka_factory", "api_factory", "a2a_factory", "generate_chart", "get_current_time", "tool_factory", "__init__"}
```

This matches `_FRAMEWORK_MODULES` in `agent/agent.py:37`.

#### D. New node types (7 additions)

All read from `os.environ`, same keys the agent runtime uses:

1. **KA nodes** -- scan `PROJECT_KA_*` env vars
   - Type: reuse `tool` (amber)
   - Subtitle: "Knowledge Assistant"
   - Edge: Agent -> KA, label "has brick"

2. **Vector Search node** -- `PROJECT_VS_INDEX` env var
   - Type: reuse `tool` (amber)
   - Subtitle: "Vector Search index"
   - Edge: Agent -> VS, label "has tool"

3. **MCP server nodes** -- scan `PROJECT_MCP_*` env vars (exclude `_HEADER`)
   - Type: reuse `tool` (amber)
   - Subtitle: "MCP server"
   - Edge: Agent -> MCP, label "has MCP tool"

4. **A2A agent nodes** -- scan `PROJECT_A2A_*` env vars (exclude `_HEADER`)
   - Type: reuse `tool` (amber)
   - Subtitle: "A2A agent"
   - Edge: Agent -> A2A, label "delegates to"

5. **API nodes** -- scan `PROJECT_API_*_URL` or `PROJECT_API_*_CONN` env vars
   - Type: reuse `tool` (amber)
   - Subtitle: "REST API" or "UC Connection API"
   - Edge: Agent -> API, label "has API tool"

6. **Feature nodes** -- scan `PROJECT_TOOL_*` env vars where value is "true"
   - Type: reuse `tool` (amber)
   - Label: feature name (Chart, Memory, etc.)
   - Subtitle: "feature toggle"
   - Edge: Agent -> Feature, label "has feature"

7. **Memory/Lakebase node** -- if `LAKEBASE_INSTANCE_NAME` is set
   - Type: reuse `data` (teal)
   - Subtitle: "Lakebase instance"
   - Edge: Agent -> Lakebase, label "checkpoints to"

All reuse existing node types (`tool` or `data`) so no frontend changes needed.

#### E. Layout: smarter positioning

Current: everything in a vertical stack at x=380. Gets unreadable with 15+ nodes.

New layout columns:
- x=80: Agent (center anchor)
- x=380: LLM, Genie (core wiring)
- x=380: Tools (domain tools, below LLM/Genie)
- x=700: KA, VS, MCP, A2A, APIs (integrations)
- x=1020: Tables, Functions, Procedures (data layer)
- x=700 bottom: Features, Lakebase (toggles)

### Files touched

| File | Change |
|------|--------|
| `brickforge/lib/graph_builder.py` | Full rewrite of `build_graph()` |

**No other files touched.** Frontend node types (`tool`, `data`) are reused. No new components. No route changes. No config changes.

## Regression guard

- `graph_builder.py` is only called from `server.py:/api/graph`
- No other code imports from it
- The Architecture tab is view-only -- it doesn't affect config, setup, or deploy
- If it breaks, worst case: Architecture tab shows an error. Everything else works.
