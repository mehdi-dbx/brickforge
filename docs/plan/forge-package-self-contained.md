# Plan: Self-Contained pip Package - Move All Project Files Into brickforge/

## Context

`pip install brickforge` currently installs only the web server (FastAPI backend + React frontend). The actual project files (tools, data, agent, deploy, scripts, conf, stash) remain at the repo root and are NOT included in the wheel. Every setup action (create catalog, provision tables, deploy agent, generate data) fails from a pip install because the Python scripts aren't bundled.

## Decision

Move files in git. Not copy-at-build-time. One source of truth inside `brickforge/`. Clean, permanent, no workarounds.

## What Moves

| From (repo root) | To (inside package) |
|---|---|
| `tools/` | `brickforge/tools/` |
| `data/` | `brickforge/data/` |
| `agent/` | `brickforge/agent/` |
| `deploy/` | `brickforge/deploy/` |
| `scripts/` | `brickforge/scripts/` |
| `conf/` | `brickforge/conf/` |
| `stash/` | `brickforge/stash/` |
| `eval/` | `brickforge/eval/` |

## What Stays at Repo Root

| Directory | Why |
|---|---|
| `visual/frontend/` | React source code (dev only). Built version already at `brickforge/static/` |
| `app/` | Agent chat UI (18MB pre-built). Only needed for agent deploy, not Setup App |
| `doc/` | Documentation. Not part of the package |
| `tests/` | Test suite. Not part of the package |

## Why Zero Import Rewrites

Every script uses `sys.path.insert(0, ROOT)` then imports `from tools.xxx`, `from data.py.xxx`, etc. These imports are relative to wherever `sys.path` points.

Solution: add `PYTHONPATH=str(PACKAGE_ROOT)` to every subprocess environment via `build_sub_env()`. `PACKAGE_ROOT = Path(__file__).resolve().parent` (always points to `brickforge/` directory). All existing imports resolve correctly without changes.

- Editable install: `PACKAGE_ROOT = /repo/brickforge/` -> `from tools.xxx` finds `/repo/brickforge/tools/xxx`
- pip install: `PACKAGE_ROOT = site-packages/brickforge/` -> `from tools.xxx` finds `site-packages/brickforge/tools/xxx`
- Deployed agent: bundle has `tools/` at root, `PYTHONPATH` set in `app.yaml` -> works as before

## Import Count (verified)

| Pattern | Count | Action |
|---|---|---|
| `from tools.` | 29 | No change (PYTHONPATH handles it) |
| `from data.` | 33 | No change |
| `from agent.` | 6 | No change |
| `from deploy.` | 1 | No change |
| `from scripts.` | 0 | N/A |
| `sys.path.insert` | 31 | Become redundant but harmless |

## Implementation Steps

1. Add `PACKAGE_ROOT = Path(__file__).resolve().parent` to `brickforge/__init__.py`
2. `git mv tools/ brickforge/tools/`
3. `git mv data/ brickforge/data/`
4. `git mv agent/ brickforge/agent/`
5. `git mv deploy/ brickforge/deploy/`
6. `git mv scripts/ brickforge/scripts/`
7. `git mv conf/ brickforge/conf/`
8. `git mv stash/ brickforge/stash/`
9. `git mv eval/ brickforge/eval/`
10. Add `__init__.py` to any moved dir that doesn't have one
11. Update `build_sub_env()` in `brickforge/lib/env_utils.py`: add `PYTHONPATH=str(PACKAGE_ROOT)`
12. Update `pyproject.toml`: include all `brickforge/*` subdirs, add package-data for non-Python files (*.sql, *.csv, *.yaml, *.yml, *.prompt, *.base, *.txt, *.sh, *.forge, *.jsonl)
13. Update `stream_subprocess()` in `brickforge/lib/sse.py`: use `PACKAGE_ROOT` as cwd instead of `PROJECT_ROOT`
14. Update subprocess cwd in all route files: `cwd=str(PACKAGE_ROOT)` where scripts are called
15. Update `build.sh` release script: adjust source paths
16. Update `connect.sh` path in `brickforge/routes/auth.py`: now at `brickforge/scripts/connect.sh`

## Deploy Script Impact

`deploy_agent_app.py` uses `ROOT = Path(__file__).resolve().parents[1]`. After move, `parents[1]` from `brickforge/deploy/` points to `brickforge/`. The `AGENT_APP_DIRS` (`"agent"`, `"tools"`, `"data/demo"`) resolve relative to ROOT = `brickforge/`. The zip writes them at the bundle root (strips `brickforge/` prefix). Deployed agent sees `agent/`, `tools/`, `data/` at its root. Works correctly.

## Stash Tool Imports

Stash tools (e.g., `stash/airops/tools/update_border_officer.py`) import `from data.py.sql_utils import ...`. After move, the file is at `brickforge/stash/airops/tools/`. The `PYTHONPATH=brickforge/` makes `from data.py.sql_utils` resolve to `brickforge/data/py/sql_utils.py`. No change needed in stash tools.

## Verification

1. `pip install -e .` -> `brickforge` starts, UI loads
2. Bridge-forge flow works
3. Create catalog/schema via UI -> succeeds (scripts found)
4. Data gen wizard -> runs (gen scripts found)
5. Test button on all steps -> passes
6. `python -m build --no-isolation` -> wheel contains all files
7. `pip install dist/brickforge-*.whl` -> standalone install works
8. All 81 unit tests pass
9. Deploy agent from Setup App -> bundle correct

## Pass 3: What the Original Plan Missed (96+ breaking references found)

### 1. Path depth changes are NOT just about imports (30+ files)

The plan said "PYTHONPATH handles imports, sys.path hacks become harmless." TRUE for imports. FALSE for file I/O.

Every script that does `ROOT = Path(__file__).resolve().parents[2]` then `ROOT / "data" / "default" / "csv"` to READ FILES will break. The depth increases by 1 after the move. PYTHONPATH doesn't fix file reads.

**Affected: 30+ files** across data/init/, data/gen/, data/py/, deploy/, deploy/grant/, scripts/py/, scripts/py/ka/, scripts/py/vs/.

**Fix: update every `parents[N]` to `parents[N+1]`.** OR: standardize all scripts to use `PACKAGE_ROOT` from env var instead of computing ROOT from `__file__`. The env var approach means ONE change (in `build_sub_env()`) instead of 30. Add `BRICKFORGE_ROOT=str(PACKAGE_ROOT)` to subprocess env. Each script reads `os.environ.get('BRICKFORGE_ROOT', str(Path(__file__).resolve().parents[N]))` as fallback.

Actually simplest: just fix the depth. It's a mechanical `parents[N]` -> `parents[N+1]` change in 30 files. Grep, review, done.

### 2. `.env.local` location is ambiguous

50+ scripts do `load_dotenv(ROOT / ".env.local")`. After the move:
- In editable mode: ROOT resolves to `brickforge/`. But `.env.local` is at the REPO root, not inside `brickforge/`.
- In pip mode: ROOT resolves to `site-packages/brickforge/`. No `.env.local` there at all.

**Decision needed:** `.env.local` stays at repo root. Scripts that need it must use `PROJECT_ROOT / ".env.local"` (repo root), not `PACKAGE_ROOT / ".env.local"` (package dir). OR: the server passes the `.env.local` path via env var.

**Fix:** Add `ENV_FILE=str(PROJECT_ROOT / ".env.local")` to `build_sub_env()`. Scripts read `os.environ.get('ENV_FILE', ROOT / '.env.local')`. The server controls where the config file is.

### 3. `app/` directory stays at root but deploy script moves inside

`deploy_agent_app.py` bundles `app/client/dist/` and `app/server/dist/`. After the move, the deploy script is at `brickforge/deploy/deploy_agent_app.py`. Its `ROOT = parents[1]` points to `brickforge/`. But `app/` is at the REPO root, not inside `brickforge/`.

**Fix:** The deploy script needs TWO roots: `PACKAGE_ROOT` (for agent/, tools/, data/) and `PROJECT_ROOT` (for app/). Add `AGENT_APP_DIR=str(PROJECT_ROOT / "app")` to subprocess env. Or move `app/` inside `brickforge/` too (adds 18MB to the pip package but makes it truly self-contained).

**Decision:** Leave `app/` at root for now. Deploy from pip install won't bundle the chat UI. Deploy from repo (editable install) works because both roots are accessible. Document this limitation.

### 4. Shell scripts reference `$ROOT/.env.local`

`deploy/deploy.sh` and `deploy/grant/run_all_grants.sh` compute ROOT from `$BASH_SOURCE` and reference `$ROOT/.env.local`. After the move, depth changes.

**Fix:** Update ROOT calculation in each shell script. Or convert to Python (already planned -- deploy.sh is being replaced by deploy_agent_app.py).

### 5. pyproject.toml entry point

`start-app = "agent.start_server:main"` must become `start-app = "brickforge.agent.start_server:main"`.

### 6. Two explicit import breaks in brickforge/routes/setup.py

Lines 1107 and 1139: `from scripts.py.setup_dbx_env import ...`

These are inside INLINE PYTHON SCRIPT STRINGS passed to subprocess. They're NOT Python imports in the server code. They run in subprocesses where PYTHONPATH will handle them. So they're actually fine -- no change needed.

BUT: these inline scripts also do `from dotenv import load_dotenv; load_dotenv('.env.local')` with a RELATIVE path. After the move, cwd changes. The relative `.env.local` won't be found.

**Fix:** Inline scripts must use absolute path: `load_dotenv(os.environ.get('ENV_FILE', '.env.local'))`.

## Pass 4: Fresh Eyes Review

Walking through the first action a user would take after the move:

1. User runs `brickforge` (pip installed, standalone)
2. Server starts, UI loads
3. User connects workspace via bridge-forge -> works (server code, no file deps)
4. User clicks "create catalog/schema"
5. Server runs `subprocess([sys.executable, "data/init/create_catalog_schema.py"])` with `cwd=PACKAGE_ROOT`
6. Script starts, does `ROOT = Path(__file__).resolve().parents[3]` -- WRONG, was parents[2]
7. Script does `load_dotenv(ROOT / '.env.local')` -- `.env.local` doesn't exist inside package
8. Script fails silently or crashes

**This is the critical path.** Every provisioning action hits walls 1 and 2 above.

The fix is clear:
- `build_sub_env()` sets `PYTHONPATH`, `BRICKFORGE_ROOT`, and `ENV_FILE` in subprocess env
- Scripts read these env vars with fallback to `Path(__file__)` computation
- OR: just fix the depth (+1) in all 30 files and accept that `.env.local` must be at a known location

**Simplest approach: fix depth + pass ENV_FILE via env var.** Two mechanical changes, no architecture redesign.

## Pass 5: Pre-Implementation Tests

Before any file moves, verify the PYTHONPATH approach works:

```bash
# Simulate: set PYTHONPATH to brickforge/, import from tools/
PYTHONPATH=brickforge/ python -c "from tools.sql_executor import execute_query; print('OK')"
```

If this prints OK, the import approach is validated.

```bash
# Simulate: subprocess with PYTHONPATH
PYTHONPATH=brickforge/ python -c "
import subprocess, os
env = dict(os.environ)
env['PYTHONPATH'] = 'brickforge/'
result = subprocess.run(['python', '-c', 'from tools.sql_executor import execute_query; print(\"OK\")'], env=env, capture_output=True, text=True)
print(result.stdout, result.stderr)
"
```

If this prints OK, subprocess imports work too.

## Pass 6: Implementation Phases + Gates

### Phase 1: Infrastructure (PACKAGE_ROOT + build_sub_env)
- Add `PACKAGE_ROOT` to `brickforge/__init__.py`
- Update `build_sub_env()` in `brickforge/lib/env_utils.py`: add PYTHONPATH, BRICKFORGE_ROOT, ENV_FILE
- Run pre-implementation tests (PYTHONPATH simulation)

```
test_move_phase1.py:
  test_package_root_resolves()                    - PACKAGE_ROOT points to brickforge/ dir
  test_package_root_has_server()                  - PACKAGE_ROOT / "server.py" exists
  test_build_sub_env_has_pythonpath()             - PYTHONPATH in subprocess env
  test_build_sub_env_has_env_file()               - ENV_FILE in subprocess env
```

Gate: 4 tests pass + PYTHONPATH simulation prints OK

### Phase 2: Move files (git mv)
- `git mv tools/ brickforge/tools/` (repeat for all 8 dirs)
- Add `__init__.py` where missing (data/, data/init/, data/gen/, data/py/, conf/, stash/, eval/, scripts/, scripts/py/, scripts/py/ka/, scripts/py/vs/)

```
test_move_phase2.py:
  test_tools_dir_exists()                         - brickforge/tools/ exists
  test_data_dir_exists()                          - brickforge/data/ exists
  test_agent_dir_exists()                         - brickforge/agent/ exists
  test_deploy_dir_exists()                        - brickforge/deploy/ exists
  test_scripts_dir_exists()                       - brickforge/scripts/ exists
  test_conf_dir_exists()                          - brickforge/conf/ exists
  test_stash_dir_exists()                         - brickforge/stash/ exists
  test_old_dirs_gone()                            - tools/, data/, agent/ at root do NOT exist
  test_pythonpath_import_tools()                  - PYTHONPATH=brickforge/ -> from tools.sql_executor works
  test_pythonpath_import_agent()                  - PYTHONPATH=brickforge/ -> from agent.agent works
```

Gate: 10 tests pass + `git status` shows only renames

### Phase 3: Fix path depths (30+ files)
- Update every `Path(__file__).resolve().parents[N]` to `parents[N+1]`
- Update every `Path(__file__).parent.parent` to `Path(__file__).parent.parent.parent` etc.
- Verify each file's ROOT resolves to `brickforge/` (not repo root)

```
test_move_phase3.py:
  test_create_all_assets_root()                   - ROOT in create_all_assets.py resolves correctly
  test_run_sql_root()                             - ROOT in run_sql.py resolves correctly
  test_deploy_agent_root()                        - ROOT in deploy_agent_app.py resolves correctly
  test_grant_scripts_root()                       - ROOT in grant scripts resolves correctly
  test_ka_scripts_root()                          - ROOT in KA scripts resolves correctly
  test_gen_scripts_root()                         - ROOT in gen scripts resolves correctly
```

Gate: 6 tests pass + `grep -rn "parents\[" brickforge/` reviewed manually

### Phase 4: Fix subprocess paths + inline scripts
- Update all `cwd=` in route files to use `PACKAGE_ROOT`
- Update inline Python script strings: `load_dotenv(os.environ.get('ENV_FILE', '.env.local'))`
- Update `stream_subprocess()` default cwd

```
test_move_phase4.py:
  test_health_endpoint()                          - GET /health -> ok
  test_env_endpoint()                             - GET /api/env -> list
  test_status_endpoint()                          - GET /api/setup/status -> steps
  test_save_manual_action()                       - POST exec save-manual -> SSE done(ok)
  test_stash_health()                             - GET /api/stash/health -> stashes
  test_graph_endpoint()                           - GET /api/graph -> nodes+edges
  test_gen_status()                               - GET /api/gen/status -> flags
  test_prompts_list()                             - GET /api/setup/prompts -> files
```

Gate: 8 tests pass + all 81 original tests pass

### Phase 5: Fix pyproject.toml + build
- Update `packages.find.include` to catch all brickforge subdirs
- Add package-data globs: `*.sql, *.csv, *.yaml, *.yml, *.prompt, *.base, *.txt, *.sh, *.forge, *.jsonl, *.json`
- Update entry point: `start-app = "brickforge.agent.start_server:main"`

```
test_move_phase5.py:
  test_wheel_contains_tools()                     - wheel has brickforge/tools/*.py
  test_wheel_contains_data_sql()                  - wheel has brickforge/data/**/*.sql
  test_wheel_contains_data_csv()                  - wheel has brickforge/data/**/*.csv
  test_wheel_contains_conf_prompts()              - wheel has brickforge/conf/prompt/*
  test_wheel_contains_stash()                     - wheel has brickforge/stash/**
  test_wheel_contains_scripts()                   - wheel has brickforge/scripts/connect.sh
  test_wheel_contains_agent()                     - wheel has brickforge/agent/*.py
```

Gate: 7 tests pass + `python -m build --no-isolation` succeeds

### Phase 6: End-to-end test
- `pip install -e .` -> brickforge starts
- Bridge-forge -> connects
- Create schema -> succeeds
- Data gen -> runs
- All original 81 tests pass

Gate: full manual test pass + all tests green

## Pass 7: Transition Strategy

- **Rollback:** parent branch `forge-saas-python-backend` has the pre-move state
- **During development:** only one version runs at a time (moved files)
- **If catastrophic failure:** `git checkout forge-saas-python-backend` restores everything
- **No gradual migration:** all files move in one commit, fixes in subsequent commits
- **Tests run after each phase gate** before advancing

## Risks (updated)

1. **30+ path depth changes** - Mechanical but error-prone. One missed file = silent failure at runtime. Mitigated by exhaustive grep + test.
2. **`.env.local` location** - Must be passed via env var. Scripts can't assume relative path. Mitigated by ENV_FILE env var in build_sub_env().
3. **`app/` stays at root** - Agent deploy from pip install can't bundle chat UI. Acceptable limitation for now.
4. **Shell scripts** - 3 bash scripts need ROOT update. Low risk, small files.
5. **Inline script strings** - Template Python scripts in setup.py routes reference `.env.local` relatively. Must use ENV_FILE env var.
6. **Package-data globs** - Must catch SQL, CSV, YAML, prompts, shell scripts, forge manifests, jsonl. Missing a glob = missing files in wheel.
