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
