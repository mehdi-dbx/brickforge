## DEPLOY LOGBOOK (append-only, never rewrite)

### 2026-05-25 -- BrickForge 0.1.0 (test.pypi.org)

- First upload to test.pypi.org
- Package: Python-only (no frontend static files)
- `pip install -i https://test.pypi.org/simple/ brickforge` -- installed but UI returned `{"error":"frontend not built"}`
- Root cause: `brickforge/static/` not included in wheel (package-data missing)

### 2026-05-25 -- BrickForge 0.1.1 (test.pypi.org)

- Fixed: copied `visual/frontend/dist/` -> `brickforge/static/`, added `[tool.setuptools.package-data]`
- `DIST_DIR` changed from `PROJECT_ROOT / "visual" / "frontend" / "dist"` to `Path(__file__).parent / "static"`
- Wheel: 240KB with 3 static files (index.html, JS, CSS)
- Build: `python -m build --no-isolation` (Databricks pypi-proxy was down, bypassed with `PIP_INDEX_URL`)
- Upload: `twine upload --repository testpypi dist/*`
- URL: https://test.pypi.org/project/brickforge/0.1.1/
- Issue found: global pip install breaks `PROJECT_ROOT` (resolves to `site-packages/` not repo)
- Fix: `__init__.py` checks for `pyproject.toml` to detect repo vs installed mode
- Bridge script (`scripts/connect.sh`) not bundled in pip package -- only works with editable install
- Created release scripts: `scripts/release/{bump,build,upload,release}.sh`

### 2026-05-26 -- BrickForge 0.1.0a8 (pypi.org)

- Self-contained restructure: moved tools/, data/, agent/, deploy/, scripts/, conf/, stash/, eval/ inside brickforge/
- Fixed PROJECT_ROOT -> PACKAGE_ROOT for all moved dirs
- Fixed load_dotenv: ENV_FILE env var across 44 inline scripts
- Fixed ROOT path depths per-directory (reverted incorrect sed +1 bump)
- Fixed IP whitelist: always attempt, removed "is local" check
- Added ~/.brickforge/ runtime dir (logs, config)
- Server logging: parse_subprocess_error(), log_error(), session log file
- Single log file per session: brickforge_YYYYMMDD_HHMMSS.log
- Log path hint appended to all user-facing error messages
- Moved .env.local to ~/.brickforge/ for pip installs
- PAT reuse check before creating new ones
- Auto-prepend https:// to workspace URLs
- Summary box in bridge script with actionable advice
- Wheel: 748KB
- Tested on EC2: bridge-forge connect [+], catalog/schema creation [+]

### 2026-05-26 -- BrickForge 0.1.0a9 (pypi.org)

- Summary box alignment fix (dynamic _pad() function)
- Version bump only -- no functional changes from a8

### 2026-05-26 -- BrickForge 0.1.0a10 (pypi.org)

- Moved app/ (agent chat UI) into brickforge/app/ for fully self-contained pip package
- Chat UI build trimmed: 16MB -> 1.8MB dist (97% reduction)
  - Replaced react-syntax-highlighter with plain <pre><code> monospace
  - Disabled Shiki code highlighting (code={false} on Streamdown)
  - Disabled mermaid diagrams (mermaid={false} on Streamdown)
  - Externalized shiki, mermaid, cytoscape, katex from Vite bundle via rollupOptions.external
  - Removed react-syntax-highlighter dependency from package.json
- Wheel: 1.0MB (was 748K without app/, now includes 162 app source files)

#### Problems encountered and fixes:

1. **Wrong bloat source**: Assumed react-syntax-highlighter caused 16MB dist. Actually streamdown -> shiki bundled 350+ language grammars and themes via `require('shiki')` which pulls full bundle.

2. **PrismLight didn't help**: Switching to PrismLight import and registering only 8 languages had zero effect -- shiki (not Prism) was the real source. Three wasted rebuild cycles.

3. **Runtime flags don't prevent bundling**: `code={false}` and `mermaid={false}` are runtime props on Streamdown. Vite still bundles shiki/mermaid code because `import { Streamdown } from 'streamdown'` pulls the entire module regardless. Fix: Vite `rollupOptions.external` to exclude at build time.

#### Agent App deploy: 3-path build strategy (TODO)

The pip package ships app/ source but not built dist. Deploy must detect and pick the best build path automatically:

1. **Pre-built dist exists** (editable install / local dev) -- bundle tarballs as-is, fastest
2. **Node available locally** (pip install + node on machine) -- build locally then bundle
3. **No node locally** (pip install only) -- ship source, build on Databricks Apps at startup

Detection: check for `app/client/dist/` -> check for `node` in PATH -> fallback to source.
Databricks Apps compute has node.js. npm pulls from `npm-proxy.cloud.databricks.com`.
Only external dependency: node.js (for local build). Python deps handled by pip.

Not yet wired into `deploy_agent_app.py` or startup script.

4. **node_modules leaked into pip wheel (a10)**: `package-data` globs like `app/**/*.ts` matched files inside `node_modules/` (e.g., katex has .py metric scripts). `exclude-package-data` in pyproject.toml was ignored by setuptools. Fix: used `packages.find.exclude` to prevent setuptools from discovering node_modules as Python packages. Also narrowed package-data globs to specific subdirs (app/client/src, app/server/src, app/packages/*/src) instead of broad app/**/* wildcards.

### 2026-05-27 -- BrickForge 0.1.0a11 through 0.1.0a26 (pypi.org) -- Agent App Deploy E2E

Goal: deploy the agent chat app from a pip-installed brickforge on EC2 to Databricks Apps.

#### a11: Deploy pipeline wiring
- setup.py build hook: copies pyproject.toml into brickforge/ (needed for pip install on DBX Apps)
- setup.py: runs npm build:client + build:server (not `npm run build` which triggers db:migrate)
- Ship pre-built client/server dist in wheel (no node needed at deploy time)
- Ship app/ source alongside for advanced users
- Wheel: 2.0MB (source + pre-built dist + pyproject.toml)

#### a12: Frontend deploy action fix
- UI "deploy now" button pointed to old `exec-deploy` (bash deploy.sh with uv dependency)
- Rewired to `exec-deploy-agent` (Python deploy_agent_app.py)
- Removed dead `exec-deploy` / `exec-deploy-dry` actions from frontend + backend
- Rebuilt setup app frontend static files

#### a13-a14: Workspace upload fixes
- a13: `w.workspace.import_()` with `ImportFormat.AUTO` auto-extracted .zip files, broke directory structure
- Tried `w.files.upload()` -- failed: "unsupported first path component: Workspace" (Files API uses Volumes paths, not Workspace paths)
- a14: `w.workspace.import_()` with `ImportFormat.RAW` + renamed to `.dat` extension -- clean upload

#### a14: SDK API signature fix
- `w.apps.create(name=...)` TypeError -- SDK changed to take `App()` object
- `w.apps.deploy(app_name, source_code_path=...)` TypeError -- takes `AppDeployment()` object
- Fixed: `w.apps.create(app=App(name=..., description=...))` and `w.apps.deploy(app_name, app_deployment=AppDeployment(source_code_path=...))`

#### a14-a18: Start script fixes
- `start_server.py` used `os.environ` before `import os` -- NameError
- Startup script used `uv sync` -- replaced with `pip install .` (no uv dependency)
- Updated app.yaml template and stash/airops/app.yaml to match
- Pinned mlflow>=3.12.0 (AgentServer introduced in 3.12.0)

#### a19-a20: Dependency resolution hell
- `pip install .` with loose version pins caused pip to crawl every version of aiohttp backwards (3.13 -> 3.8). Timed out on DBX Apps compute.
- Fix: generated pinned `requirements.txt` from clean venv (160 exact-pinned deps). Bundled in wheel.
- Startup script: `pip install -r requirements.txt` instead of `pip install .`
- Instant install, no resolution needed.

#### a21-a24: Dependency compatibility chain
- a21: `databricks-langchain==0.8.2` missing `AsyncCheckpointSaver`. Bumped to 0.19.0.
- a22: `langchain-community==0.4.1` requires `requests>=2.32.5`, pinned `requests==2.32.3`. Version conflict.
- a23: Regenerated full requirements.txt from clean venv with compatible versions. But `langgraph-prebuilt==1.0.13` needed `ExecutionInfo` from `langgraph.runtime` which didn't exist in `langgraph==1.0.10`.
- a24: Created clean venv in start.sh to avoid conflicts with DBX Apps pre-installed packages. Same error -- incompatibility is in the packages themselves, not the environment.
- a25: Regenerated requirements.txt with `langgraph>=1.2.0` which has `ExecutionInfo`. All imports verified in clean venv before freezing.

#### a25-a26: White screen fix (Vite externals crash)
- a25: Agent app deployed successfully, both servers running (uvicorn:8000 + node:3000). But white screen in browser.
- Root cause: `rollupOptions.external` for shiki/mermaid/cytoscape/katex produces `import("mermaid")` in the browser JS. Browser has no module loader for bare specifiers -- silent crash, white screen.
- Tried custom Vite plugin with `resolveId`/`load` stubs -- rolldown-vite (Rust bundler) doesn't invoke custom plugins.
- Tried `resolve.alias` to stub file -- rolldown does prefix substitution (`shiki` -> `stub.ts`, so `shiki/engine/javascript` -> `stub.ts/engine/javascript`). Build error.
- Fix: created stub modules (`src/stubs/shiki.ts`, `shiki-lang.ts`, `empty.css`) and aliased EVERY specific subpath (main entry + engine + 15 lang files + katex CSS). All imports resolve to local stubs at build time.
- a26: 1.8MB dist, 6 files, fully self-contained. No externals, no runtime module loading. Chat UI renders.

#### Summary of walls hit and fixed (execution order)

| # | Wall | Version | Fix |
|---|------|---------|-----|
| 1 | UI wired to old deploy.sh | a12 | Rewired to exec-deploy-agent |
| 2 | zip auto-extraction on upload | a13-a14 | ImportFormat.RAW + .dat extension |
| 3 | SDK API changed (App/AppDeployment objects) | a14 | Updated to new SDK signatures |
| 4 | import os after os.environ usage | a14 | Moved import to top |
| 5 | uv dependency in startup script | a14 | Replaced with pip install |
| 6 | mlflow AgentServer not in 3.4.0 | a14 | Pinned mlflow>=3.12.0 |
| 7 | pip resolution timeout (loose pins) | a19-a20 | Pinned requirements.txt from clean venv |
| 8 | databricks-langchain missing AsyncCheckpointSaver | a21 | Bumped to 0.19.0 |
| 9 | Dependency version conflicts (requests, langgraph) | a22-a25 | Full venv freeze with compatible versions |
| 10 | White screen (Vite externals crash in browser) | a25-a26 | Stub modules via resolve.alias |
| 11 | `user_id` referenced before assignment in agent.py | a27 | Moved extraction before `init_agent()` call |
| 12 | ENDPOINT_NOT_FOUND (no model endpoint saved) | a29-a31 | `exec-same` auto-discovers FM endpoints via SDK |
| 13 | Wrong SDK model (ServedEntitySpec.served_entity) | a30 | Flat access: `sc.external_model` directly |
| 14 | Phantom import (write_env_entry) | a31 | Inlined env file write with regex |

#### a27: agent.py user_id fix
- `user_id` used on line 288 before assignment on line 291
- Fix: moved `_get_user_id()` and `_get_thread_id()` before `init_agent()` call

#### a29-a31: Model endpoint auto-discovery
- "Same workspace" mode commented out `AGENT_MODEL_ENDPOINT` without saving an alternative
- Agent fell back to hardcoded `databricks-claude-sonnet-4-6` which doesn't exist -- 404
- a29: added auto-discovery via `w.serving_endpoints.list()`, filter for external/foundation models, save first match
- a30: `ServedEntitySpec` has flat `.external_model`, not nested `.served_entity.external_model` -- AttributeError
- a31: `write_env_entry` doesn't exist in `config_provider` (it's local to `setup_dbx_env.py`) -- ImportError. Inlined env file write with regex.

#### Final state (a31)
- Wheel: 2.0MB (setup app + agent app source + pre-built dist + 160 pinned deps)
- Deploy from pip install: pip install brickforge -> brickforge -> bridge-forge -> configure -> deploy
- DBX Apps startup: unzip -> unpack dist -> pip install -r requirements.txt (fast) -> agent + chat UI start
- Chat UI: 1.8MB dist (shiki/mermaid/cytoscape/katex stubbed out)
- No node dependency at deploy time (pre-built dist ships in wheel)
- No uv dependency anywhere (pure pip)
