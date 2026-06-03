# Plan: Rewrite Setup App Backend from Node.js (Express) to Python (FastAPI)

## Context

The Setup App backend is ~2000 lines of Express (Node.js). This forces Node.js as a user dependency and prevents clean `pip install` distribution. Rewriting in Python (FastAPI) eliminates Node.js for end users and enables PyPI distribution. The React frontend is unaffected - it's pre-built static files.

## Scope of Impact

### What gets rewritten (Node.js -> Python)
- `visual/backend/index.js` (~2000 lines) -> split into modules under `brickforge/`
- `visual/backend/lib/config-provider.js` -> `brickforge/lib/config_provider.py`
- `visual/backend/lib/project-manager.js` -> `brickforge/lib/project_manager.py`
- `visual/backend/lib/graph-builder.js` -> `brickforge/lib/graph_builder.py`

### Target file structure
```
brickforge/
  __init__.py
  cli.py                    # entry point: brickforge command
  server.py                 # FastAPI app, startup, CORS, static mount
  lib/
    config_provider.py       # LocalConfigProvider, ForgeConfigProvider
    graph_builder.py         # DAG node/edge generation
    project_manager.py       # UC Volume project CRUD
    env_utils.py             # buildSubEnv, checkTokenExpiry, detectCloud
  routes/
    auth.py                  # bridge nonce, receive, status, script
    setup.py                 # status, profiles, resources, clear, toggle, exec, test
    gen.py                   # data generation endpoints
    ka.py                    # KA document management
    cleanup.py               # resource discovery + deletion
    projects.py              # project CRUD
```

### What stays exactly the same (zero changes)
- `visual/frontend/` - all React code, all styling, all components
- `agent/` - agent runtime (already Python)
- `tools/` - tool definitions (already Python)
- `data/` - all SQL, CSV, init scripts (already Python)
- `deploy/` - deploy scripts (already Python)
- `scripts/` - bridge script, setup scripts (already Python/bash)
- `conf/` - prompts, KA configs, VS configs
- `stash/` - domain templates
- `app/` - agent chat UI (React + Express, separate from Setup App)

### What gets modified
- `pyproject.toml` - add `brickforge` CLI entry point, package structure, `python-multipart` dep
- `start.sh` - change from `node visual/backend/index.js` to `python -m brickforge.server`
- `app.yaml` - change startup command: `uv sync && python -m brickforge.server`
- `visual/frontend/vite.config.ts` - add API proxy for dev mode

### Key decisions made
- **AES decryption:** use `openssl` subprocess (matches bridge script, avoids C extension dep)
- **Inline Python scripts:** become direct function calls (no subprocess for Python-to-Python)
- **SSE streaming:** `asyncio.create_subprocess_exec` for long-running scripts, direct calls for quick actions
- **Static files:** served from `visual/frontend/dist/` (no move, path reference from `brickforge/server.py`)
- **PROJECT_ROOT:** `Path(__file__).resolve().parent.parent` (brickforge/ is one level below project root)

## Endpoint Inventory (50 endpoints to rewrite)

### Core (6)
1. `GET /health`
2. `GET /api/graph`
3. `PUT /api/layout`
4. `GET /api/env`
5. `PUT /api/env`
6. `GET /api/stash/health`

### Bridge Auth (5)
7. `GET /api/setup/cloud`
8. `GET /api/auth/bridge-nonce`
9. `POST /api/auth/bridge-receive`
10. `GET /api/auth/bridge-status`
11. `GET /api/auth/bridge-script`

### Setup Status & Config (7)
12. `GET /api/setup/status`
13. `GET /api/setup/profiles`
14. `GET /api/setup/resources`
15. `POST /api/setup/clear-step`
16. `PUT /api/setup/toggle`
17. `DELETE /api/setup/instance`
18. `GET /api/setup/exec-log`

### Setup Execution - SSE (1 endpoint, ~25 action cases)
19. `POST /api/setup/exec`

### Setup Testing (2)
20. `GET /api/setup/test`
21. `GET /api/setup/mcp-tools`

### Prompts (2)
22. `GET /api/setup/prompts`
23. `PUT /api/setup/prompts`

### Data Generation (16)
24-39. `/api/gen/*` endpoints

### KA Documents (4)
40-43. `/api/ka/*`

### Cleanup (2)
44-45. `/api/cleanup/resources`, `/api/cleanup/exec`

### Projects (4)
46-49. `/api/projects`

### SPA Fallback (1)
50. `GET *`

## Key Technical Translations

| Express (Node.js) | FastAPI (Python) |
|---|---|
| `app.get('/path', handler)` | `@router.get('/path')` |
| `express.json()` | Built-in (Pydantic) |
| `express.static(dir)` | `StaticFiles(directory=dir)` |
| `res.json({...})` | `return {...}` |
| SSE via `res.write()` | `StreamingResponse(async_generator)` |
| `execFile('python', [...])` | direct function call or `asyncio.create_subprocess_exec()` |
| `multer` | `UploadFile` (FastAPI built-in) |
| `crypto.randomBytes()` | `secrets.token_hex()` |
| `crypto.createDecipheriv()` | `subprocess.run(['openssl', ...])` |
| `adm-zip` | `zipfile` + `io.BytesIO` (stdlib) |
| `js-yaml` | `yaml.safe_load()` (pyyaml, already a dep) |

---

## Transition Strategy

- **Branch:** `forge-saas-python-backend` (created from `forge-saas-databricks`)
- **Rollback:** parent branch `forge-saas-databricks` stays untouched with working Node backend
- **Clean cut, not gradual migration.** Python backend built alongside Node files. Only one runs at a time.
- **During development:** start Python server on :9000 to test. Start Node server to compare behavior if needed. Never both simultaneously.
- **Node files deleted in final commit** after all 8 phases pass and all 83 tests green.
- **No shared state:** Python backend reads the same `.env.local` and `visual/frontend/dist/` as Node. No migration of config or data.

---

## PHASE 1: Skeleton + Static Serving

### Pre-implementation check
- Confidence: 98%. No doubts. FastAPI + StaticFiles is well-documented.
- One thing to verify: SPA fallback route must be registered AFTER API routes and AFTER StaticFiles mount.

### Implementation
- Create `brickforge/__init__.py`, `brickforge/cli.py`, `brickforge/server.py`
- FastAPI app with CORS middleware
- Mount `visual/frontend/dist/` as static files
- `GET /health` returns `{"ok": true}`
- SPA fallback: catch-all returns `index.html`
- `cli.py`: starts uvicorn on port 9000

### Unit tests
```
test_phase1.py:
  test_health_returns_ok()              - GET /health -> {"ok": true}
  test_static_serves_index_html()       - GET / -> 200, contains "<html"
  test_api_route_not_swallowed()        - GET /api/env -> 404 (not yet implemented, but NOT index.html)
  test_spa_fallback_unknown_path()      - GET /some/random/path -> 200, contains "<html"
```

### Gate: MUST pass before Phase 2
- [ ] `python -m brickforge.server` starts on port 9000
- [ ] Browser loads React UI at localhost:9000
- [ ] All 4 unit tests pass

---

## PHASE 2: Config Providers

### Pre-implementation check
- Confidence: 90%.
- Doubt: `ForgeConfigProvider` uses `adm-zip` for in-memory zip. Python's `zipfile` with `BytesIO` should work but I need to verify write-then-read behavior (zip must be re-opened after modification).
- Doubt: `checkTokenExpiry()` auto-refresh uses `execFileSync` (blocking). In Python async context, blocking calls freeze the event loop. Use `asyncio.to_thread()` for the refresh subprocess.
- Action: read `config-provider.js` line by line during implementation to ensure no method is missed.

### Implementation
- `brickforge/lib/config_provider.py`: `ConfigProvider` (base), `LocalConfigProvider`, `ForgeConfigProvider`
- `brickforge/lib/env_utils.py`: `build_sub_env()`, `check_token_expiry()`, `detect_cloud()`
- `GET /api/env` and `PUT /api/env` in `brickforge/server.py`
- Mode detection: `FORGE_MODE` from env vars

### Unit tests
```
test_phase2.py:
  # LocalConfigProvider
  test_local_list_returns_entries()              - parse .env.local, returns [{key, value, sensitive}]
  test_local_set_many_writes_values()            - setMany updates .env.local file
  test_local_disable_comments_out_key()          - disableMany comments out a key
  test_local_toggle_key()                        - toggle active -> commented, commented -> active
  test_local_list_by_prefix()                    - listByPrefix('PROJECT_GENIE_') returns matching entries
  test_local_sensitive_pattern()                 - TOKEN keys marked sensitive=True

  # ForgeConfigProvider
  test_forge_list_from_zip()                     - reads config.env from in-memory zip
  test_forge_set_many_updates_zip()              - setMany updates config.env in zip
  test_forge_disable_key_in_zip()                - disable moves key from active to commented in zip
  test_forge_file_operations()                   - getFile/setFile/deleteFile/listFiles work

  # env_utils
  test_build_sub_env_overlays_config()           - config values overlay os.environ
  test_build_sub_env_clears_oauth_conflict()     - removes CLIENT_ID when TOKEN set
  test_check_token_expiry_valid()                - returns None for valid JWT
  test_check_token_expiry_expired_no_refresh()   - returns error message for expired JWT without refresh
  test_detect_cloud_aws()                        - detects AWS from hostname
  test_detect_cloud_azure()                      - detects Azure from hostname
  test_detect_cloud_localhost()                   - returns None for localhost

  # API endpoints
  test_get_env_returns_config()                  - GET /api/env -> list of entries
  test_put_env_updates_config()                  - PUT /api/env -> updates values
```

### Gate: MUST pass before Phase 3
- [ ] All 19 unit tests pass
- [ ] `GET /api/env` returns same data as Node version (compare output)
- [ ] `PUT /api/env` writes to .env.local correctly

---

## PHASE 3: Setup Status + Testing

### Pre-implementation check
- Confidence: 92%.
- Doubt: `GET /api/setup/status` has complex per-step logic (model same-workspace mode, table CSV counting, multi-instance prefix scanning). Must port each special case exactly.
- Doubt: `GET /api/setup/resources` spawns Python scripts that use `WorkspaceClient()`. These can remain as subprocesses (they import databricks-sdk which is heavy) OR become direct imports. Decision: keep as subprocess for isolation -- a bad SDK call shouldn't crash the server.
- Doubt: `GET /api/setup/test` has ~15 dynamic test scripts. Most can become direct function calls. A few (model test, MCP test) are complex enough to stay as subprocess.
- Action: snapshot the current Node backend's test output for each step to compare.

### Implementation
- `brickforge/routes/setup.py`: status, profiles, resources, clear-step, toggle, instance, exec-log
- Inline test scripts become functions in `brickforge/lib/test_steps.py`
- `GET /api/setup/mcp-tools` stays as subprocess (JSON-RPC + SSE parsing is complex)

### Unit tests
```
test_phase3.py:
  # Status
  test_status_returns_all_steps()                - GET /api/setup/status -> has host, warehouse, schema, etc.
  test_status_host_configured()                  - host step configured when both HOST + TOKEN set
  test_status_host_missing()                     - host step missing when HOST empty
  test_status_model_same_workspace()             - model shows configured if HOST set but no ENDPOINT
  test_status_multi_instance_genie()             - genie step shows instances from PROJECT_GENIE_*
  test_status_tables_csv_count()                 - tables step counts CSVs

  # Clear + Toggle
  test_clear_step_disables_keys()                - POST /api/setup/clear-step disables step keys
  test_toggle_key()                              - PUT /api/setup/toggle toggles key
  test_delete_instance()                         - DELETE /api/setup/instance removes key

  # Resources (mock subprocess)
  test_resources_returns_items()                 - GET /api/setup/resources?type=catalogs -> {items: [...]}
  test_resources_expired_token()                 - returns error when token expired

  # Test endpoints
  test_host_reachability()                       - mock: host test returns reachable
  test_schema_not_found()                        - mock: schema test returns not found

  # Profiles
  test_profiles_list()                           - GET /api/setup/profiles -> list

  # Exec log
  test_exec_log_returns_latest()                 - GET /api/setup/exec-log?action=save-manual
```

### Gate: MUST pass before Phase 4
- [ ] All 15 unit tests pass
- [ ] `GET /api/setup/status` output matches Node version (side-by-side curl comparison)
- [ ] DAG renders correctly in browser with correct step colors

---

## PHASE 4: Bridge Auth

### Pre-implementation check
- Confidence: 85%.
- Doubt: AES-256-CBC decryption with PBKDF2. The Node version uses `crypto.pbkdf2Sync(nonce, salt, 10000, 48, 'sha256')` to derive key+IV, then `crypto.createDecipheriv('aes-256-cbc', key, iv)`. The Python equivalent using `openssl` subprocess should produce identical output since the bridge script uses the same `openssl enc` command. But I need to verify the exact PBKDF2 parameters match.
- Action: before coding, test manually: encrypt a known string with `openssl enc -aes-256-cbc`, then decrypt with Python using the same nonce. Verify roundtrip.

### Pre-implementation test (run before coding)
```bash
# Encrypt
echo -n "test_token_value" | openssl enc -aes-256-cbc -a -A -pass pass:test_nonce -pbkdf2

# Then in Python, decrypt the output using subprocess openssl
python3 -c "
import subprocess
ct = '<output from above>'
result = subprocess.run(
    ['openssl', 'enc', '-aes-256-cbc', '-d', '-a', '-A', '-pass', 'pass:test_nonce', '-pbkdf2'],
    input=ct.encode(), capture_output=True
)
print(result.stdout.decode())  # should print test_token_value
"
```
If this works, skip `cryptography` package entirely. Use `openssl` subprocess for both encrypt (bridge script) and decrypt (server).

### Implementation
- `brickforge/routes/auth.py`: nonce, receive, status, script endpoints
- Nonce store: dict with TTL cleanup
- AES decryption: `subprocess.run(['openssl', 'enc', '-d', ...])`
- Cross-cloud detection via `detect_cloud()`
- Bridge script serving: read + template `scripts/connect.sh`

### Unit tests
```
test_phase4.py:
  # Nonce
  test_nonce_generates_unique()                  - two calls return different nonce_ids
  test_nonce_returns_ws_default()                - includes ws_default from config
  test_nonce_expires_after_5min()                - expired nonce rejected

  # Receive
  test_receive_decrypts_pat()                    - encrypt PAT with openssl, POST, verify stored
  test_receive_decrypts_jwt_bundle()             - encrypt JSON bundle, POST, verify both tokens stored
  test_receive_single_use_nonce()                - second POST with same nonce -> 403
  test_receive_cross_cloud_warning()             - AWS app + Azure host -> warning in response
  test_receive_same_cloud_no_warning()           - AWS app + AWS host -> no warning

  # Status
  test_status_waiting_initially()                - bridge-status returns waiting
  test_status_connected_after_receive()          - returns connected after successful receive

  # Script
  test_script_injects_variables()                - bridge-script contains APP_URL and NONCE
  test_script_sets_content_disposition()         - response has download header
```

### Gate: MUST pass before Phase 5
- [ ] All 12 unit tests pass
- [ ] Manual test: run `scripts/connect.sh` against Python backend, token arrives
- [ ] Bridge-forge flow works end-to-end in browser

---

## PHASE 5: SSE Exec Engine

### Pre-implementation check
- Confidence: 75% (highest risk phase).
- Doubt: SSE format. The frontend parses `event:type\ndata:json\n\n`. FastAPI's `StreamingResponse` just sends bytes. I must emit the exact same format string. One wrong newline and the frontend parser breaks.
- Doubt: async subprocess streaming. `asyncio.create_subprocess_exec()` + `proc.stdout.readline()` in an async generator. Must handle: partial lines, stderr interleaving, process exit, client disconnect.
- Doubt: which of the 25 actions need subprocess vs direct call? Rule: if it imports `databricks-sdk` or runs for >1s, use subprocess. Quick config saves are direct calls.
- Action: write a minimal SSE test FIRST (before any action cases). One endpoint that streams 3 lines. Verify the frontend renders them.

### Pre-implementation test
```python
# Minimal SSE endpoint - test before writing any action logic
@router.post("/api/test-sse")
async def test_sse():
    async def generate():
        yield 'event:line\ndata:{"text":"[+] line 1\\n","stream":"out"}\n\n'
        await asyncio.sleep(0.1)
        yield 'event:line\ndata:{"text":"[+] line 2\\n","stream":"out"}\n\n'
        yield 'event:done\ndata:{"ok":true,"code":0}\n\n'
    return StreamingResponse(generate(), media_type="text/event-stream")
```
Point the frontend at this endpoint temporarily. If lines render in the terminal, the SSE format is correct.

### Implementation
- `brickforge/routes/setup.py`: `POST /api/setup/exec`
- Shared SSE helpers: `sse_line()`, `sse_done()`, `sse_run_subprocess()`
- Per-execution log file: `logs/exec/{action}-{timestamp}.log`
- Token expiry check before auth-required actions
- Action classification:

| Action | Method | Why |
|--------|--------|-----|
| `save-manual`, `save-workspace`, `save-deploy-name` | Direct call | Quick config write, no SDK |
| `save-warehouse`, `save-schema`, `save-genie` | Direct call | Uses SDK but fast (<2s) |
| `exec-pat` | Direct call | Single REST API call |
| `exec-same`, `forge-bridge` | Direct call | Config toggle only |
| `save-multi-instance`, `save-api` | Direct call | Config write |
| `exec-assets` | Subprocess | Runs `create_all_assets.py` (long, multi-step) |
| `exec-tables`, `exec-functions` | Subprocess | Long-running provisioning |
| `exec-ka` | Subprocess | KA creation (may take minutes) |
| `exec-deploy`, `exec-deploy-dry` | Subprocess | Full deploy pipeline |
| `exec-deploy-agent` | Subprocess | Agent bundle + deploy |
| `exec-git-push` | Subprocess | Git operations |
| `exec-auth-login` | Subprocess | Interactive CLI |
| `save-host` | Subprocess | Calls `databricks auth profiles` |
| `save-model-profile` | Subprocess | PAT creation on remote workspace |

### Unit tests
```
test_phase5.py:
  # SSE format
  test_sse_line_format()                         - verify exact event:line\ndata:...\n\n format
  test_sse_done_format()                         - verify event:done\ndata:{"ok":true}\n\n

  # Direct call actions
  test_save_manual_updates_config()              - action=save-manual writes to config
  test_save_workspace_sets_host_and_token()       - action=save-workspace sets both
  test_save_manual_schema_creates_catalog()       - action=save-manual for schema triggers creation
  test_exec_same_disables_model_keys()           - action=exec-same comments out model keys
  test_forge_bridge_noop()                       - action=forge-bridge returns done(true)

  # Subprocess actions (mock subprocess)
  test_exec_assets_streams_output()              - action=exec-assets streams SSE lines
  test_exec_deploy_agent_creates_config()        - action=exec-deploy-agent writes temp config

  # Token expiry
  test_expired_token_blocks_action()             - expired JWT -> error line + done(false)
  test_no_auth_action_skips_check()              - save-deploy-name skips token check

  # Logging
  test_exec_creates_log_file()                   - log file created in logs/exec/
  test_exec_log_retrieval()                      - GET /api/setup/exec-log returns log content
```

### Gate: MUST pass before Phase 6
- [ ] All 12 unit tests pass
- [ ] Manual: run "save-manual" for schema via browser -> terminal shows output -> done phase shows log
- [ ] Manual: run "exec-assets" -> streams real-time output in terminal
- [ ] SSE format verified: open browser DevTools Network tab, check event stream matches `event:line\ndata:...\n\n`

---

## PHASE 6: Data Generation

### Pre-implementation check
- Confidence: 82%.
- Doubt: `sseGenRunner` detects `__RESULT__:` prefix in stdout for structured results. Must preserve this detection in the async generator.
- Doubt: stdin piping. Some gen endpoints pass JSON via stdin to the subprocess. `asyncio.create_subprocess_exec()` with `stdin=PIPE` + `proc.communicate(input=...)` changes the streaming pattern.
- Action: check if any gen endpoint needs BOTH stdin AND streaming stdout simultaneously. If yes, need `proc.stdin.write()` then `proc.stdin.close()` before reading stdout.

### Implementation
- `brickforge/routes/gen.py`: all `/api/gen/*` endpoints
- Shared `sse_gen_runner()` async generator
- File system operations for CSV/SQL/manifest/wizard-state using `pathlib`

### Unit tests
```
test_phase6.py:
  # Status + discovery
  test_gen_status_returns_flags()                - GET /api/gen/status -> useDefault, useGen
  test_gen_tables_discovers_csvs()               - GET /api/gen/tables -> list from data/demo/csv
  test_gen_routines_discovers_sql()              - GET /api/gen/routines -> list from func/proc dirs

  # Wizard state
  test_save_wizard_state()                       - PUT /api/gen/wizard-state -> saved to file
  test_get_wizard_state()                        - GET /api/gen/wizard-state -> returns saved state
  test_delete_wizard_state()                     - DELETE /api/gen/wizard-state -> file deleted

  # Clear
  test_clear_gen_deletes_files()                 - DELETE /api/gen/clear -> gen CSVs + SQL deleted
  test_clear_routines_deletes_files()            - DELETE /api/gen/clear-routines -> routine files deleted

  # SSE gen (mock subprocess)
  test_gen_schema_streams_sse()                  - POST /api/gen/schema -> SSE stream with result
  test_gen_data_passes_stdin()                   - POST /api/gen/data -> stdin JSON passed to subprocess
```

### Gate: MUST pass before Phase 7
- [ ] All 10 unit tests pass
- [ ] Manual: open data gen wizard in browser, generate a table schema, verify SSE streaming

---

## PHASE 7: KA, Cleanup, Projects

### Pre-implementation check
- Confidence: 88%.
- Doubt: file upload. FastAPI `UploadFile` is in-memory (SpooledTemporaryFile). multer writes to disk. The KA upload endpoint renames temp files then passes paths to `volume_ops.py`. Need to write `UploadFile` to a temp file first, then pass the path.
- Doubt: cleanup exec is SSE with a large inline Python script. Keep as subprocess -- it imports SDK and may take 30s+.

### Implementation
- `brickforge/routes/ka.py`: document list, upload, upload-url, delete
- `brickforge/routes/cleanup.py`: resource discovery, exec (SSE)
- `brickforge/routes/projects.py`: list, create, load, delete
- `brickforge/lib/project_manager.py`: UC Volume operations

### Unit tests
```
test_phase7.py:
  # KA
  test_ka_list_documents()                       - GET /api/ka/documents (mock subprocess)
  test_ka_upload_file()                          - POST /api/ka/upload with test file
  test_ka_delete_document()                      - DELETE /api/ka/documents/:name

  # Cleanup
  test_cleanup_resources_returns_items()          - GET /api/cleanup/resources (mock subprocess)
  test_cleanup_exec_streams_sse()                - POST /api/cleanup/exec -> SSE stream

  # Projects
  test_projects_list()                           - GET /api/projects (mock)
  test_projects_create()                         - POST /api/projects with name
  test_projects_delete()                         - DELETE /api/projects/:name

  # Graph builder
  test_graph_returns_nodes_edges()               - GET /api/graph -> {nodes, edges, meta}
  test_graph_layout_save_load()                  - PUT /api/layout -> GET /api/graph has positions
```

### Gate: MUST pass before Phase 8
- [ ] All 10 unit tests pass
- [ ] Manual: upload a PDF via KA docs in browser
- [ ] Manual: cleanup page shows resources
- [ ] Manual: graph renders with correct nodes

---

## PHASE 8: Package & CLI

### Pre-implementation check
- Confidence: 80%.
- Doubt: `pyproject.toml` package data. Non-Python files (frontend dist, SQL, prompts, stash templates) must be included via `[tool.setuptools.package-data]`. Path references must work both in dev (`pip install -e .`) and installed mode.
- Doubt: `PROJECT_ROOT` resolution. In dev: repo root. When installed via pip: `site-packages/brickforge/`. All relative paths to `data/`, `conf/`, `stash/`, `visual/frontend/dist/` must resolve correctly in both modes.
- Action: test `pip install -e .` first (editable, paths are symlinks). Then test `pip install .` (copies files). Both must work.

### Implementation
- Update `pyproject.toml`: name=brickforge, entry point, package-data globs
- `brickforge/cli.py`: argument parsing, starts uvicorn
- `brickforge/__init__.py`: `__version__`, `PROJECT_ROOT` resolution
- `MANIFEST.in` or `pyproject.toml` package-data for non-Python files

### Unit tests
```
test_phase8.py:
  test_cli_starts_server()                       - brickforge command starts without error
  test_project_root_resolves()                   - PROJECT_ROOT points to correct directory
  test_static_files_found()                      - dist/index.html exists relative to PROJECT_ROOT
  test_pip_install_editable()                     - pip install -e . succeeds
  test_pip_install_regular()                      - pip install . succeeds, brickforge command works
```

### Gate: DONE
- [ ] All 5 unit tests pass
- [ ] `pip install -e .` then `brickforge` starts server, UI loads
- [ ] `pip install .` (non-editable) then `brickforge` starts, UI loads
- [ ] Upload to test.pypi.org, `pip install -i https://test.pypi.org/simple/ brickforge` works

---

## New Dependencies

| Package | Replaces | Already in pyproject.toml? |
|---------|----------|--------------------------|
| `fastapi` | Express | Yes |
| `uvicorn` | Node.js HTTP | Yes |
| `python-multipart` | multer | No (add) |

That's it. `aiofiles` not needed (use sync IO in `asyncio.to_thread`). `cryptography` not needed (use `openssl` subprocess).

## What Gets Deleted
- `visual/backend/index.js`
- `visual/backend/lib/config-provider.js`
- `visual/backend/lib/graph-builder.js`
- `visual/backend/lib/project-manager.js`
- `visual/backend/package.json`
- `visual/backend/package-lock.json`
- `visual/backend/node_modules.tar.gz`
- `visual/backend/node_modules/` (if present)

## Blind Spots (caught on deep scan)

1. **`forgeMode` flag in status response.** Frontend reads `forgeMode` from `GET /api/setup/status` to filter UI choices (hides CLI-dependent options in deployed mode). Python status endpoint MUST return `forgeMode: bool` in the response.

2. **Three SSE event types, not two.** `event:line` (text output), `event:result` (structured JSON for data gen), `event:done` (completion). The `sseGenRunner` detects `__RESULT__:` prefix in stdout and emits as `event:result`. Frontend's GenTerminal parses this separately. Missing `event:result` breaks data generation wizard.

3. **`os.environ` mutations at runtime.** 10+ places mutate process env: token refresh, bridge receive, save-workspace, exec-same, etc. In async FastAPI, `os.environ` is shared across all coroutines. Must use a lock or avoid direct env mutation (use config provider as source of truth instead).

4. **No subprocess timeout on streaming exec.** Node's `spawn()` in setup/exec has no timeout. A hanging Python script blocks the SSE stream forever. Add timeout (e.g., 300s) with kill in the Python version.

5. **Temp file cleanup.** `.tmp-deploy-config.json` and multer upload temps not cleaned. Fix: use `tempfile.NamedTemporaryFile(delete=True)` or explicit cleanup.

6. **`POST /api/setup/exec` body is `{ action, params }`.** NOT `{ step, action, values }`. Must match exactly.

7. **`PUT /api/env` body is a flat dict.** Frontend sends `{ "KEY": "value" }` directly. Not wrapped.

8. **Graph node exact format.** `id`, `type`, `position: {x, y}`, `data: {kind, label, subtitle, sourceFile, meta, dataVariant}`. `dataVariant` = `'function'|'procedure'|'table'`. Missing or renamed fields break React Flow.

9. **File upload.** Multer: no size limit, temp dir `data/.tmp-uploads`, renames to original filename. FastAPI `UploadFile`: SpooledTemporaryFile. Must write to temp file, then pass path to `volume_ops.py`.

10. **Bridge status polling.** Frontend polls every 2000ms. Status endpoint must return instantly (no blocking).

11. **`res.writableEnded` guard on SSE writes.** 5 places check if response is still writable before writing. In FastAPI, use `await request.is_disconnected()` or try/except on generator yields.

12. **`cleanExpiredNonces()` called before every nonce operation.** Lazy cleanup of expired nonces from the dict. Must replicate in Python.

13. **No graceful shutdown in Node version.** No `SIGTERM`/`SIGINT` handlers. Python version should add them -- kill orphaned subprocesses on shutdown via `atexit` or signal handlers.

## Risks

1. **SSE format mismatch** - frontend parses `event:type\ndata:json\n\n`. One wrong byte breaks it. Mitigated by pre-implementation SSE test.
2. **`os.environ` race conditions** - async coroutines mutating shared env. Mitigated by threading Lock on env mutations + preferring config provider.
3. **AES decryption** - openssl subprocess. Mitigated by pre-implementation roundtrip test.
4. **Concurrent config writes** - multiple requests writing config. Mitigated by threading Lock on config write methods.
5. **`__RESULT__:` detection in SSE** - must detect prefix in stdout, emit as `event:result`. Wrong parsing breaks data gen wizard.
6. **Subprocess timeout** - streaming exec has no timeout. Must add kill-after-timeout.
7. **PROJECT_ROOT in pip install mode** - paths must resolve to installed package location. Mitigated by Phase 8 tests.
8. **Phase 5 action cases** - 25 cases, each with specific logic. Mitigated by action classification (direct vs subprocess) and per-action testing.

## Total unit tests: 83

| Phase | Tests | Confidence |
|-------|-------|-----------|
| 1. Skeleton | 4 | 98% |
| 2. Config | 19 | 90% |
| 3. Status/Test | 15 | 92% |
| 4. Bridge Auth | 12 | 85% |
| 5. SSE Exec | 12 | 75% |
| 6. Data Gen | 10 | 82% |
| 7. KA/Cleanup/Projects | 10 | 88% |
| 8. Package/CLI | 5 | 80% |

**Rule: never advance to the next phase until all tests in the current phase pass and manual verification is done.**

## Final Review: Implementation Traps (caught on pre-flight re-read)

1. **Phase 1: `StaticFiles` mount + SPA fallback ordering.** FastAPI doesn't coexist with static files like Express does. Pattern: include API router first, mount `StaticFiles` at `/static` (or sub-path), then add catch-all `@app.get("/{path:path}")` that returns `index.html`. If `StaticFiles` is mounted at `/`, it swallows API routes. Must test this explicitly.

2. **Phase 2: `ForgeConfigProvider` async init via `lifespan`.** `@app.on_event("startup")` is deprecated in FastAPI >=0.109. Use `lifespan` async context manager instead. Config provider stored in `app.state.config`, not module-level global.

3. **Phase 3: missing test for `forgeMode` in status response.** Add `test_status_returns_forge_mode()` to test_phase3.py.

4. **Phase 5: `save-warehouse`, `save-schema`, `save-genie` block the event loop.** Classified as "Direct call" but they call `WorkspaceClient()` which does HTTP I/O. Wrap in `asyncio.to_thread()` or reclassify as subprocess. 2 seconds blocking = all concurrent requests stall.

5. **Phase 5: missing test for `save-api` action.** Listed in classification table but no unit test.

6. **Phase 6: stdin + stdout simultaneously.** `POST /api/gen/data` and `/api/gen/save` need stdin write THEN stdout streaming. Pattern: `proc.stdin.write(data)` -> `proc.stdin.close()` -> async read `proc.stdout` line by line. Not a simple `proc.communicate()`.

7. **Phase 7: `GET /api/graph` needed earlier.** Graph endpoint is listed as Core (#2) but implemented in Phase 7. The DAG won't render until Phase 7. Move graph builder to Phase 1 or Phase 3 so the main UI works from the start.

8. **Phase 8: package layout ambiguity.** Do `agent/`, `tools/`, `data/`, `conf/`, `deploy/`, `scripts/`, `stash/` move inside `brickforge/` or stay at repo root? If they stay at root, pip won't include them automatically. If they move inside, every import path and relative path in ~50 Python files changes. Decision needed: keep at root + use `package-data`/`data-files` in pyproject.toml, OR move inside and update all paths.

## Updated test count: 85

Added: `test_status_returns_forge_mode()` (Phase 3), `test_save_api_writes_keys()` (Phase 5).
