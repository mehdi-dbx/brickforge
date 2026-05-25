# Next Steps - May 26, 2026

## What's Done

- Python backend rewrite (Node.js eliminated)
- pip package on PyPI (brickforge 0.1.0a3)
- Self-contained: all project files inside brickforge/
- 44 scripts fixed to use ENV_FILE env var
- 10/10 endpoint tests pass from standalone pip install
- UI loads, bridge-forge generates nonces, graph renders, stash detected

## What's NOT Tested Yet

These are the actions that actually DO things on a Databricks workspace. They were broken before the ENV_FILE fix. The fix is in place but unverified end-to-end.

### 1. Bridge-forge connect (pip install, not editable)
- Install brickforge on EC2 via `pip install brickforge --pre`
- Run `brickforge`, open in browser via tunnel
- Copy curl command, run bridge-forge script
- Verify: workspace connected, PAT created, token stored
- **Tests:** IP whitelisting (new EC2 IP), token delivery via fragment URL

### 2. Create catalog/schema
- From the pip-installed app, enter catalog.schema manually
- Verify: subprocess finds `create_catalog_schema.py` via PACKAGE_ROOT
- Verify: `load_dotenv(ENV_FILE)` works (no `.env.local` at relative path)
- Verify: SDK calls succeed (token passed via env)

### 3. Provision tables
- From the pip-installed app, run "provision tables"
- Verify: `create_all_assets.py` finds SQL files at `PACKAGE_ROOT/data/init/`
- Verify: CSV files found at `PACKAGE_ROOT/data/default/csv/`

### 4. Generate data
- From the pip-installed app, open data gen wizard
- Verify: `generate_tables.py` starts, SSE streams output
- Verify: generated files written to `PACKAGE_ROOT/data/gen/`

### 5. Deploy agent
- From the pip-installed app, click deploy
- Verify: `deploy_agent_app.py` bundles agent/, tools/, data/ from PACKAGE_ROOT
- Verify: app/ (chat UI) at PROJECT_ROOT -- will fail from pure pip install (known limitation)
- Document: agent deploy requires editable install or repo clone

## Test Environment

- **EC2** (`aws-field-eng`): fresh pip install, direct internet, IP whitelisting tested
- **Local (editable)**: dev workflow, everything works
- **Target workspace**: e2-demo-field-eng.cloud.databricks.com (IP must be whitelisted)

## Priority

1 > 2 > 3 > 4 > 5. If 1 and 2 work, the core flow is validated. 3-4 are important but secondary. 5 has a known limitation.
