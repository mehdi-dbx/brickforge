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
