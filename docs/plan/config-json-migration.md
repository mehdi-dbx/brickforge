# Plan: Replace .env.local with config.json

> Branch: `forge-config-json`
> Created: 2026-06-03

## Context

BrickForge stores all configuration in flat `.env.local` files (key=value). This format is wrong for structured data -- multi-value lists are comma-separated strings, multi-instance tools use prefix patterns (`PROJECT_KA_*`), and there's no way to represent nested config. Ghost entries (stale `PROJECT_KA_DEFAULT`) cause phantom tools. The config system is the nervous system of the entire project -- it's read/written by 50+ files across setup routes, deploy pipeline, agent runtime, init scripts, and frontend.

Decision: replace `.env.local` entirely with `config.json`. One file, one format, one read path. No backward compat (alpha).

---

## Part 1: Local config migration (Steps 1-6)

Make `config.json` the source of truth for local dev. Deploy still flattens to env vars in app.yaml.

### JSON Schema

```json
{
  "version": 1,
  "workspace": {
    "host": "https://adb-123.cloud.databricks.com",
    "token": "dapi...",
    "config_profile": null,
    "refresh_token": null,
    "token_endpoint": null,
    "client_id": null,
    "client_secret": null,
    "warehouse_id": "44d9f9e1e0624dfc",
    "unity_catalog_schema": "my_catalog.my_schema"
  },
  "model": {
    "endpoint": "databricks-claude-sonnet-4-6",
    "token": null
  },
  "app": {
    "name": "my-agent-app",
    "mlflow_experiment_id": "12345678"
  },
  "tools": {
    "genie_spaces": ["01efab1234567890", "01efab0987654321"],
    "functions": ["get_flight_status", "search_passengers"],
    "vector_search": {
      "index": "catalog.schema.docs_vs_index",
      "endpoint": "my-vs-endpoint"
    },
    "ka": {
      "PASSENGERS": { "endpoint": "ka-e0012089-endpoint", "enabled": true },
      "FLIGHTS":    { "endpoint": "ka-flights-endpoint",  "enabled": false }
    },
    "mcp": {
      "WEATHER": { "url": "https://weather-mcp.example.com/sse", "header": null, "enabled": true }
    },
    "api": {
      "WEATHER_API": {
        "conn": null, "url": "https://api.weatherapi.com/v1",
        "method": "GET", "path": "/forecast.json",
        "desc": "Get weather forecast", "params": "city:str,days:int",
        "header": "X-Api-Key: abc123", "enabled": true
      }
    },
    "a2a": {
      "PLANNER": { "url": "https://planner-agent.example.com", "header": null, "enabled": true }
    }
  },
  "features": {
    "MEMORY":   { "enabled": false },
    "CHART":    { "enabled": true },
    "VOICE":    { "enabled": false },
    "VISION":   { "enabled": false },
    "PERSONAS": { "enabled": false }
  },
  "bricks": {
    "KA":                  { "enabled": true },
    "INFO_EXTRACTION":     { "enabled": false },
    "DOC_PARSING":         { "enabled": false },
    "TEXT_CLASSIFICATION":  { "enabled": false }
  },
  "data": {
    "use_demo_data": true,
    "use_gen_data": false,
    "stash_dir": null
  },
  "lakebase": {
    "instance_name": null,
    "agent_memory_schema": null
  },
  "env_store": {
    "host": null,
    "token": null,
    "catalog_volume_path": null
  },
  "genie_room": {
    "name": "My Genie Room",
    "description": "Natural language exploration of project data"
  },
  "branding": {
    "logo_url": null,
    "brandfetch_api_key": null
  }
}
```

### Flatten rules (JSON -> flat env vars)

The flatten function converts structured JSON to flat KEY=VALUE for deploy (app.yaml) and subprocess injection (build_sub_env). Only enabled entries are emitted. Null values are omitted.

| JSON path | Env var | Notes |
|-----------|---------|-------|
| `workspace.host` | `DATABRICKS_HOST` | |
| `workspace.token` | `DATABRICKS_TOKEN` | |
| `workspace.config_profile` | `DATABRICKS_CONFIG_PROFILE` | |
| `workspace.refresh_token` | `DATABRICKS_REFRESH_TOKEN` | OAuth refresh |
| `workspace.token_endpoint` | `DATABRICKS_TOKEN_ENDPOINT` | OAuth endpoint |
| `workspace.client_id` | `DATABRICKS_CLIENT_ID` | SP auth |
| `workspace.client_secret` | `DATABRICKS_CLIENT_SECRET` | SP auth |
| `workspace.warehouse_id` | `DATABRICKS_WAREHOUSE_ID` | |
| `workspace.unity_catalog_schema` | `PROJECT_UNITY_CATALOG_SCHEMA` | |
| `model.endpoint` | `AGENT_MODEL` | Drops legacy `AGENT_MODEL_ENDPOINT` |
| `model.token` | `AGENT_MODEL_TOKEN` | |
| `app.name` | `DBX_APP_NAME` | |
| `app.mlflow_experiment_id` | `MLFLOW_EXPERIMENT_ID` | |
| `tools.genie_spaces` | `PROJECT_GENIE_SPACES` | join with `,` |
| `tools.functions` | `PROJECT_FUNCTIONS` | join with `,` |
| `tools.vector_search.index` | `PROJECT_VS_INDEX` | |
| `tools.vector_search.endpoint` | `PROJECT_VS_ENDPOINT` | |
| `tools.ka.<SLUG>.endpoint` | `PROJECT_KA_<SLUG>` | only if enabled AND `bricks.KA.enabled` |
| `tools.mcp.<SLUG>.url` | `PROJECT_MCP_<SLUG>` | only if enabled |
| `tools.mcp.<SLUG>.header` | `PROJECT_MCP_<SLUG>_HEADER` | |
| `tools.api.<SLUG>.*` | `PROJECT_API_<SLUG>_CONN/URL/METHOD/PATH/DESC/PARAMS/HEADER` | only if enabled |
| `tools.a2a.<SLUG>.url` | `PROJECT_A2A_<SLUG>` | only if enabled |
| `tools.a2a.<SLUG>.header` | `PROJECT_A2A_<SLUG>_HEADER` | |
| `features.<KEY>.enabled` | `PROJECT_TOOL_<KEY>` | always emit "true"/"false" |
| `bricks.<KEY>.enabled` | `PROJECT_BRICK_<KEY>` | always emit "true"/"false" |
| `data.use_demo_data` | `USE_DEMO_DATA` | |
| `data.use_gen_data` | `USE_GEN_DATA` | |
| `data.stash_dir` | `FORGE_STASH_DIR` | |
| `lakebase.instance_name` | `LAKEBASE_INSTANCE_NAME` | |
| `lakebase.agent_memory_schema` | `LAKEBASE_AGENT_MEMORY_SCHEMA` | |
| `env_store.*` | `ENV_STORE_HOST/TOKEN/CATALOG_VOLUME_PATH` | |
| `genie_room.name` | `GENIE_ROOM_NAME` | |
| `genie_room.description` | `GENIE_DESCRIPTION` | |
| `branding.logo_url` | `PROJECT_LOGO_URL` | |
| `branding.brandfetch_api_key` | `BRANDFETCH_API_KEY` | |

### Enable/disable mechanism

- **Multi-instance tools** (ka, mcp, api, a2a): each entry has `"enabled": boolean`. Disabled entries stay in config.json (data preserved) but are omitted from flat output. Replaces commenting lines in .env.local.
- **Features/bricks**: `"enabled": boolean` maps directly to `"true"/"false"` string value. Always emitted.
- **KA double-gate**: `PROJECT_KA_<SLUG>` only emitted if BOTH `bricks.KA.enabled` AND `tools.ka.<SLUG>.enabled` are true.

### Design tensions resolved

1. **Bricks vs tools ownership**: `bricks.KA.enabled` is the master toggle, `tools.ka.<SLUG>.enabled` is per-endpoint. Flatten checks both.
2. **AGENT_MODEL_ENDPOINT dropped**: only `AGENT_MODEL` survives. All code reading the old key must be updated.
3. **Empty arrays**: `genie_spaces: []` does NOT emit `PROJECT_GENIE_SPACES=` (omitted entirely).
4. **Version field**: enables future schema migrations.
5. **Migration**: one-time `env_local_to_config_json()` function parses .env.local, groups by prefix, builds JSON.

### Legacy cleanup during migration
- `AGENT_MODEL_ENDPOINT`: still read in `gen.py:35,317`. Replace with `AGENT_MODEL` reads.
- `USE_DEFAULT_DATA`: backward-compat alias for `USE_DEMO_DATA`. Drop -- only `use_demo_data` in JSON.
- Auth conflict resolution in `build_sub_env()`: currently removes SP vars when PAT is present. With JSON, `workspace` section holds one auth method -- flatten emits only what's set.

### Runtime-only vars (NOT in config.json)
These are set dynamically, never persisted:
- `DATABRICKS_APP_PORT`, `VISUAL_PORT`, `FORGE_MODE` -- runtime port/mode detection
- `PYTHONPATH`, `BRICKFORGE_ROOT`, `ENV_FILE` -- injected by `build_sub_env()`
- `UPLOAD_URL`, `UPLOAD_FILENAME` -- request-scoped KA upload params
- `TASK_EVENTS_URL` -- webhook URL for task status (stash-specific)
- `VIRTUAL_ENV` -- Python venv path (filtered out)

### Blocks

#### Block 1: ConfigProvider layer (the foundation)
**Files:** `brickforge/lib/config_provider.py`

What changes:
- `LocalConfigProvider`: reads/writes `config.json` instead of `.env.local`
- `ForgeConfigProvider`: stores `config.json` in zip instead of `config.env`
- API stays the same (`list`, `get`, `set_many`, `disable_many`, `toggle`, `delete_key`)
- New: structured accessors (`get_section("genie_spaces")`, `set_section(path, value)`)
- `to_env_dict()` / `flatten()` converts JSON back to flat dict for subprocess injection

Ramifications:
- Every caller of ConfigProvider API is affected
- `build_sub_env()` in `env_utils.py` must call `flatten()` instead of iterating `config.list()`
- Init scripts using `load_dotenv()` need a new mechanism

#### Block 3: Setup routes (API layer)
**Files:** `brickforge/routes/setup.py` (~1600 lines, 30+ config write sites), `auth.py`, `gen.py`, `cleanup.py`, `projects.py`

What changes:
- All `config.set_many({"KEY": "value"})` calls change to structured writes
- `/api/setup/status` synthesizes from JSON sections instead of flat env scanning
- Prefix-scan logic (`list_by_prefix("PROJECT_KA_")`) replaced by section reads
- Comma-separated parsing (`PROJECT_GENIE_SPACES.split(",")`) replaced by array reads

Ramifications:
- Frontend expects specific JSON shapes from status endpoint -- must stay compatible or update together
- 10+ `os.environ[key] = value` inline assignments for immediate process use

#### Block 4: Deploy pipeline
**Files:** `brickforge/deploy/deploy_agent_app.py`, `sync_databricks_yml_from_env.py`, `grant/`

What changes:
- `generate_app_yaml(config)` reads structured JSON, calls `flatten()` to generate env var lines
- `generate_databricks_yml()`: reads `tools.genie_spaces`, `model.endpoint` directly from JSON
- `sync_databricks_yml_from_env.py`: reads JSON sections instead of env var scanning

#### Block 5: Agent runtime
**Files:** `brickforge/agent/agent.py`, `tools/ka_factory.py`, `tools/tool_factory.py`, `tools/api_factory.py`, `tools/a2a_factory.py`

**No changes needed.** Agent reads env vars. The flatten step in `build_sub_env()` (local) and `app.yaml` (deployed) handles the translation.

#### Block 6: Init scripts (subprocesses)
**Files:** `create_genie_space.py`, `generate_routines.py`, `create_lakebase.py`, `create_mlflow_experiment.py`

What changes:
- Pass `CONFIG_FILE` env var via `build_sub_env()`
- Each script reads config.json, updates its section, writes back
- `create_genie_space.py`: appends to `tools.genie_spaces[]` array
- `generate_routines.py`: appends to `tools.functions[]` array
- Remove all `load_dotenv()` calls
- Add shared helper: `brickforge/lib/config_json.py` with `read_config()`, `write_config()`, `update_section()`

#### Block 7: Frontend -- only if API shape changes
**Files:** `SetupView.tsx`, `SetupDrawer.tsx`, `SetupDag.tsx`, `types.ts`

If `/api/setup/status` response shape stays the same, NO frontend changes needed. Backend translates JSON -> StepState format the frontend already consumes.

#### Block 8: Node.js backend -- OUT OF SCOPE
Dev-only, not in pip package.

#### Block 9: Legacy CLI scripts -- OUT OF SCOPE
Parked for later. Only dependency: `setup.py` imports `write_env_entry` from `setup_dbx_env.py` -- replace with JSON equivalent during Block 3.

### Implementation Order

**Step 1: ConfigProvider rewrite (Block 1)**
- Add `flatten()` method with full mapping table
- Rewrite `LocalConfigProvider` to read/write `config.json`
- Update `ForgeConfigProvider` to store `config.json` in zip
- Add `get_section(path)` / `set_section(path, value)`
- Add `env_local_to_config_json()` migration function
- Update `build_sub_env()` in `env_utils.py`

**Step 2: Routes migration (Block 3)**
- Replace all `config.set_many({"KEY": "value"})` with structured writes
- Rewrite `/api/setup/status` to derive StepState from JSON sections
- Remove prefix-scan and comma-split logic
- Update bridge auth to write structured workspace section
- Clean up `AGENT_MODEL_ENDPOINT` reads
- Replace `write_env_entry` import

**Step 3: Init scripts writeback (Block 6)**
- Pass `CONFIG_FILE` env var via `build_sub_env()`
- Scripts read/update/write config.json directly
- Remove all `load_dotenv()` calls
- Add `brickforge/lib/config_json.py` shared helper

**Step 4: Deploy pipeline (Block 4)**
- `generate_app_yaml()` calls `flatten()` to generate env var lines
- `generate_databricks_yml()` reads JSON sections directly
- Drop `AGENT_MODEL_ENDPOINT` from deploy code

**Step 5: Frontend (Block 7)**
- Only if API shape changes

**Step 6: Cleanup**
- Delete `.env.local` support code
- Remove `USE_DEFAULT_DATA` backward compat
- Remove `AGENT_MODEL_ENDPOINT` everywhere
- Update docs, `.env.example` -> `config.example.json`

### Verification (after each step)

1. **Step 1**: Unit test `flatten()` round-trip. Test migration on current `.env.local`.
2. **Step 2**: Start local, verify all 18 blocks show correct status. Save config via UI, verify `config.json`.
3. **Step 3**: Run create_genie_space, create_all_functions via UI. Verify `config.json` updated.
4. **Step 4**: Deploy. Verify generated `app.yaml` matches expected flattened env vars.
5. **Step 5**: Frontend displays all blocks correctly.
6. **Step 6**: `pytest tests/` passes. Grep for `.env.local` -- zero hits in runtime code.

---

## Part 2: Deploy simplification (Step 7)

After Part 1 is stable: stop flattening config into app.yaml env vars. Ship `config.json` as a file in the deploy bundle instead.

### What changes

**app.yaml shrinks to:**
```yaml
command: ["bash", "start.sh"]
```

No env block. Just the startup command. All user config lives in `config.json` on disk.

**start.sh loads config at boot:**
```bash
# Load config.json -> export as env vars
python -c "
import json, os
config = json.load(open('config.json'))
from lib.config_json import flatten
for k, v in flatten(config).items():
    os.environ[k] = v
"
# Then start the agent
exec python -c "from agent.start_server import main; main()"
```

Or: the agent's `start_server.py` reads `config.json` and calls `flatten()` -> `os.environ.update()` before initializing.

### What gets simpler

- **No more flatten-at-deploy.** Flatten happens once at boot.
- **`sync_databricks_yml_from_env.py` (560 lines) becomes mostly dead code.** It existed to keep app.yaml env vars in sync with .env.local. With config.json shipped as a file, there's nothing to sync.
- **Deploy is just: bundle code + write config.json. Done.**
- **Config changes on deployed app: write config.json to disk, restart. No redeploy needed.**

### What stays

- `databricks.yml` still needs `resources` blocks for genie spaces, warehouses, serving endpoints (Databricks resource permissions, not env vars). Those stay.
- `generate_databricks_yml()` still reads config to generate resource blocks.

### Files affected

- `brickforge/deploy/deploy_agent_app.py` -- `build_agent_bundle()` writes `config.json` into zip instead of generating env var lines in app.yaml
- `brickforge/deploy/sync_databricks_yml_from_env.py` -- most of it deprecated, only resource block generation survives
- `brickforge/agent/start_server.py` -- reads `config.json` at boot, flattens to env vars
- `start.sh` -- simplified, no longer needs pip install + node startup (just loads config and starts Python)

### Risk

Low. The flatten function is the same -- just called at a different time (boot vs deploy). If it works locally, it works deployed.

---

## Loopholes & Mitigations

### 1. Concurrent config.json writes from subprocesses
If two init scripts run in parallel and both read-modify-write config.json, one clobbers the other. Mitigation: `create_all_assets.py` already runs steps sequentially. Don't parallelize init scripts. No code change needed, just a constraint to respect.

### 2. os.environ must stay in sync with config.json
Routes do `os.environ[key] = value` after config writes so immediately-spawned subprocesses see the change. With config.json, `set_section()` writes to disk but `os.environ` is stale. Fix: after any `set_section()`, call `os.environ.update(config.flatten())` to keep the process env current. Make this part of `set_section()` itself.

### 4. ConfigProvider API: structured, not translated
The old flat API (`set_many({"DATABRICKS_HOST": val})`) could be kept with an internal env-var-to-JSON-path mapping. But that means maintaining the mapping in BOTH directions (flatten AND unflatten). Instead: new structured API (`config.set("workspace.host", val)`), update all 27 callers in Step 2. Clean, no reverse mapping needed. The `flatten()` function is the only mapping, used for subprocess injection and deploy only.

### 5. Config read patterns in setup.py
- `config.list()` (6 call sites) -> replace with `config.flatten()` where flat dict is needed, or `config.data` for direct JSON access
- `config.list_by_prefix("PROJECT_KA_")` (3 call sites) -> replace with `config.get("tools.ka")`
- `config.get("KEY")` (5 call sites) -> replace with `config.get("json.path")`

### 3. Part 2 start.sh env export
The pseudocode `python -c "os.environ[k]=v"` doesn't propagate to the shell. The correct approach: `start_server.py` loads config.json and calls `os.environ.update(flatten(config))` before `main()`. All in one Python process. Don't use shell export tricks.

### Verification

1. Deploy with config.json as file. Verify agent starts, all tools load.
2. Compare flattened env vars at boot vs what app.yaml previously had.
3. Test all 3 scenarios: UC function lookup, Genie query, KA query.

---

## Config Write Site Catalog (setup.py + auth.py)

Every config write in the routes, with its JSON path mapping:

| Line | Current code | JSON path |
|------|-------------|-----------|
| setup:270 | `config.disable_many(keys)` | generic -- disable by path |
| setup:279 | `config.disable_many(instance_keys)` | generic -- disable multi-instance entries |
| setup:296 | `config.toggle(key)` | generic -- toggle enabled field |
| setup:304 | `config.set_many({key: new_val})` | generic -- inline edit |
| setup:319 | `config.delete_key(key)` | generic -- delete entry |
| setup:1040 | `set_many(HOST, TOKEN)` | `workspace.host`, `workspace.token` |
| setup:1045 | `config.disable(PROFILE/CLIENT_ID/SECRET)` | `workspace.config_profile/client_id/client_secret = null` |
| setup:1067-68 | `set_many({key: value})` + `os.environ` | manual save -- variable path, needs key-to-path mapper |
| setup:1075-76 | `set_many({key: value})` + `os.environ` | schema save + dotenv reload |
| setup:1094-95 | `set_many({env_key: enabled})` | `features.<KEY>.enabled` |
| setup:1113-14 | `set_many({env_key: enabled})` | `bricks.<KEY>.enabled` |
| setup:1137 | `set_many(updates)` | multi-instance save: `tools.<section>.<SLUG>` |
| setup:1153 | `set_many(DBX_APP_NAME)` | `app.name` |
| setup:1166 | `set_many(WAREHOUSE_ID)` | `workspace.warehouse_id` |
| setup:1178 | `set_many(AGENT_MODEL)` | `model.endpoint` |
| setup:1203 | `set_many(UNITY_CATALOG_SCHEMA)` | `workspace.unity_catalog_schema` |
| setup:1221 | `set_many(GENIE_SPACES)` | `tools.genie_spaces` (array) |
| setup:1233 | `set_many(LAKEBASE_INSTANCE_NAME)` | `lakebase.instance_name` |
| setup:1245 | `set_many(MLFLOW_EXPERIMENT_ID)` | `app.mlflow_experiment_id` |
| setup:1280 | `set_many(updates)` | API tool save: `tools.api.<SLUG>.*` |
| setup:1335 | `set_many(UNITY_CATALOG_SCHEMA)` | `workspace.unity_catalog_schema` (dup) |
| auth:143 | `disable_many(REFRESH_TOKEN, TOKEN_ENDPOINT)` | `workspace.refresh_token/token_endpoint = null` |
| auth:153 | `set_many(HOST, TOKEN, REFRESH_TOKEN, TOKEN_ENDPOINT)` | `workspace.*` |
| auth:156 | `config.disable(PROFILE/CLIENT_ID/SECRET)` | `workspace.config_profile/client_id/client_secret = null` |

Total: 27 write sites. All mapped.

The "generic" entries (toggle, disable, delete at lines 270-322) are the instance management endpoints -- they handle any step's instances dynamically. The frontend sends flat keys like `PROJECT_KA_PASSENGERS`. Backend needs a small prefix-to-section reverse mapper:

```python
INSTANCE_PREFIX_MAP = {
    "PROJECT_KA_":  "tools.ka",
    "PROJECT_MCP_": "tools.mcp",
    "PROJECT_API_": "tools.api",
    "PROJECT_A2A_": "tools.a2a",
}
# PROJECT_KA_PASSENGERS -> tools.ka.PASSENGERS
```

This is NOT a full bidirectional mapping -- just a 4-entry prefix lookup for the CRUD endpoints. The flatten function remains the only comprehensive mapping.

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Config format | Single `config.json` | One file, one format, one read path |
| Backward compat | None | Alpha, ditch .env.local |
| Agent config source | Env vars (via flatten) | Agent doesn't change, flatten handles translation |
| Subprocess writeback | Direct file write | Pass `CONFIG_FILE` path, script reads/updates/writes JSON |
| Node.js backend | Out of scope | Dev-only, not in pip |
| Legacy CLI | Out of scope | Parked for later |
| AGENT_MODEL_ENDPOINT | Dropped | Only AGENT_MODEL survives |
| Deploy config transport (Part 2) | Ship config.json as file | Eliminates env var generation in app.yaml, kills sync script |
