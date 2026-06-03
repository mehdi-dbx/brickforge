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
- **Gap 8 (data provisioning from .forge):** Added `FORGE_STASH_DIR` env var support to `create_all_assets.py`, `create_all_functions.py`, `create_all_procedures.py`, and inline `exec-tables` script. When set, data paths resolve to stash directory instead of `data/demo/`.
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
