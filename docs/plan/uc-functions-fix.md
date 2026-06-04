# UC Functions -- Migrate from SQL Templates to UC Functions

> Created: 2026-06-01 | Updated: 2026-06-01

## Problem

Query functions are raw SQL templates stored as local `.sql` files. The agent reads the file, substitutes parameters via string interpolation (`'{zone}'`), and sends raw SQL to the warehouse. This is:

- **SQL injection surface** -- `_escape_sql_string` only escapes single quotes
- **No governance** -- UC doesn't know these queries exist, no lineage, no permissions
- **Not portable** -- local files must be present on disk
- **Inconsistent** -- procedures use `CREATE OR REPLACE PROCEDURE` in UC, but functions don't

## How it works today (one system, two manifestations)

There is ONE tool system. The stash airops tools are just a pre-baked example of what it produces.

**Hardcoded tool files** (e.g. `stash/airops/tools/query_checkin_performance_metrics.py`):
```python
@tool
def query_checkin_performance_metrics(zone=None):
    sql = substitute_schema((_FUNC_DIR / "checkin_performance_metrics.sql").read_text())
    stmt = sql.replace("{zone_filter}", ...)
    columns, rows = execute_query(w, wh_id, stmt)
```
Each tool is a `.py` file that reads a SQL template from `data/func/`, does string interpolation, sends raw SQL.

**Dynamic tool factory** (`tool_factory.py`):
Same pattern but creates `@tool` functions at runtime from config specs. Currently NOT wired up -- `discover_forge_tools(dict(os.environ))` always returns `[]` because tool specs aren't in env vars.

**The target:** `tool_factory.py` becomes the single way to create tools. No more hand-written `.py` files per tool. Tool specs come from `.forge` config. All tools call UC functions instead of reading local SQL.

## Current Architecture

```
Stash tool .py file (stash/airops/tools/query_flights_at_risk.py)
    |-- reads: data/func/flights_at_risk.sql (raw SELECT with {param} placeholders)
    |-- substitutes: stmt.replace("{zone}", escape(value))
    |-- executes: execute_query(w, wh_id, stmt)
    v
Raw SQL sent to warehouse
```

SQL template (`flights_at_risk.sql`):
```sql
SELECT flight_number, departure_time
FROM __SCHEMA_QUALIFIED__.flights
WHERE zone = '{zone}'
AND departure_time >= TIMESTAMP('{time_start}')
AND departure_time < TIMESTAMP('{time_end}')
```

## Target Architecture

```
tool_factory.py:create_sql_read_tool() -- single dynamic system
    |-- reads spec from .forge config: {function: "flights_at_risk", params: [...]}
    |-- builds: SELECT * FROM TABLE(catalog.schema.flights_at_risk('val1', 'val2'))
    |-- executes: execute_query(w, wh_id, stmt)
    v
Parameterized call to UC function (no string interpolation, no local files)
```

UC function DDL (`flights_at_risk.sql` -- provisioned to UC):
```sql
CREATE OR REPLACE FUNCTION __SCHEMA_QUALIFIED__.flights_at_risk(
    p_zone STRING,
    p_time_start TIMESTAMP,
    p_time_end TIMESTAMP
)
RETURNS TABLE(flight_number STRING, departure_time TIMESTAMP)
LANGUAGE SQL
SQL SECURITY INVOKER
RETURN
    SELECT flight_number, departure_time
    FROM __SCHEMA_QUALIFIED__.flights
    WHERE zone = p_zone
    AND departure_time >= p_time_start
    AND departure_time < p_time_end;
```

## Step-by-Step Changes

### Step 1: Rewrite stash airops SQL as CREATE FUNCTION DDL

**Files:** `brickforge/stash/airops/data/func/*.sql` (11 files)

Each raw SELECT becomes `CREATE OR REPLACE FUNCTION ... RETURNS TABLE`.
- Parameters become typed function arguments (not `{placeholder}` strings)
- `__SCHEMA_QUALIFIED__` prefix stays (substituted at provision time by `run_sql.py`)
- Return types inferred from existing table DDLs in `stash/airops/data/init/`

### Step 2: Provision functions to UC (currently skipped)

**File:** `brickforge/data/gen/generate_routines.py:95-111` (`mode_provision_gen`)

Currently line 98: "Functions are query templates and are NOT provisioned."
Change: provision functions same as procedures -- run `.sql` via `run_sql.py`.
(`run_sql.py` already handles `__SCHEMA_QUALIFIED__` substitution.)

Also: fix stale `uv run` reference on line 117 -> `sys.executable`.

### Step 3: Rewrite tool_factory.py as the single tool creation system

**File:** `brickforge/tools/tool_factory.py`

`create_sql_read_tool()` changes from file-read + string-interpolation to UC function call:
```python
schema = get_schema_qualified()
func_name = re.sub(r'[^a-zA-Z0-9_]', '', function_name)  # sanitize
args = ", ".join(f"'{_escape_sql_string(v)}'" for v in param_values)
stmt = f"SELECT * FROM TABLE({schema}.{func_name}({args}))"
execute_query(w, wh_id, stmt)
```

Remove `_FUNC_DIR` and all local file reading.

### Step 4: Wire discover_forge_tools to .forge config

**File:** `brickforge/tools/tool_factory.py` + `brickforge/agent/agent.py`

Currently: `discover_forge_tools(dict(os.environ))` -- env vars don't have tool specs, always returns `[]`.

Change: tool specs stored in `.forge` config (YAML or JSON). Read from config file or env var `FORGE_TOOLS_JSON`. Each spec:
```json
{
    "name": "query_flights_at_risk",
    "type": "sql_read",
    "function": "flights_at_risk",
    "params": ["zone", "time_start", "time_end"],
    "description": "Flights at risk of delay in a zone within a time window"
}
```

For procedures (type `action`), spec is unchanged -- already uses UC procedure name.

### Step 5: Delete stash airops hardcoded tool .py files

**Files:** `brickforge/stash/airops/tools/*.py` (10+ files)

These are replaced by tool specs in the stash config. The `.py` files go away -- `tool_factory.py` creates all tools dynamically from specs.

### Step 6: Update stash config to include tool specs

**File:** `brickforge/stash/airops/` -- add tool specs (YAML or JSON) that define all 11 query tools + 4 action tools. These ship with the stash template and get loaded into `.forge` config.

### Step 7: Update routines wizard to generate UC function DDL + tool spec

**File:** `brickforge/data/gen/routine_sql_generator.py`

The LLM prompt must generate:
1. `CREATE OR REPLACE FUNCTION ... RETURNS TABLE` SQL (not raw SELECT)
2. A matching tool spec (name, type, function, params, description)

Both are saved: SQL to `data/gen/func/`, spec appended to `.forge` tools config.

### Step 8: Update setup panel functions block

**Files:** `visual/frontend/src/setupSteps.ts`, `brickforge/routes/setup.py`

Block flow:
1. On load, query UC: `SHOW FUNCTIONS IN catalog.schema`
2. Display: `[+] 5 functions, 3 procedures in brickforge.may26`
3. Additive choices: Generate more / Upload SQL / Skip / Done
4. Tables-first: block shows "create tables first" if tables block not done

Stash load: SQL provisioned to UC directly from Volume (no local disk). Block detects via UC query.

Upload: new endpoint for `.sql` file upload, provisions to UC via `run_sql.py`.

### Step 9: Update test script

**File:** `brickforge/routes/setup.py` (TEST_SCRIPTS["functions"])

Query UC: `SHOW FUNCTIONS IN catalog.schema`. Count functions + procedures. Not local `.sql` files.

## Files Affected

| File | Change |
|------|--------|
| `brickforge/tools/tool_factory.py` | Single tool system: UC function calls, specs from .forge config |
| `brickforge/tools/sql_executor.py` | No change |
| `brickforge/stash/airops/data/func/*.sql` | Rewrite 11 files as CREATE FUNCTION DDL |
| `brickforge/stash/airops/tools/*.py` | DELETE -- replaced by tool specs in stash config |
| `brickforge/stash/airops/` | Add tool specs config (YAML/JSON) |
| `brickforge/data/gen/generate_routines.py` | Provision functions + fix uv reference |
| `brickforge/data/gen/routine_sql_generator.py` | Generate CREATE FUNCTION DDL + tool spec |
| `brickforge/routes/setup.py` | Functions block: UC query, test, provision, upload |
| `visual/frontend/src/setupSteps.ts` | Functions block choices |
| `brickforge/agent/agent.py` | Wire discover_forge_tools to .forge config (not env vars) |

## Setup Panel Functions Block -- UI Flow

```
Block loads
    |
    v
Query UC: SHOW FUNCTIONS IN catalog.schema
    |
    +--> Functions found: "[+] 5 functions, 3 procedures in brickforge.may26"
    |        |
    |        +--> Generate more / Upload more / Done
    |
    +--> No functions: "no functions in schema"
             |
             +--> Generate routines / Upload SQL / Skip
```

## Stash + Volume Flow

```
Stash load from UC Volume
    |
    +-- SQL DDL files -> provisioned to UC directly (no local disk)
    +-- Tool specs -> loaded into .forge config -> tool_factory creates @tool functions
    |
    v
Functions block queries UC -> finds them -> done
Agent loads tool specs from .forge -> tools ready
```

## Verification

1. Provision: creates 11 functions + 4 procedures in UC
2. Test: `SHOW FUNCTIONS IN brickforge.may26` returns them
3. Agent: tool calls `SELECT * FROM TABLE(schema.flights_at_risk(...))` -- works
4. Wizard: generates CREATE FUNCTION DDL + tool spec for new domain
5. Stash load: Volume -> provision to UC + load tool specs -> done
6. Additive: existing functions + new ones stack
7. No local `.sql` file reads at agent runtime
8. No hardcoded `.py` tool files -- all dynamic from specs

## No backward compat needed

Tool was never released. Clean break -- remove old patterns entirely.
