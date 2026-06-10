# Deploy

Deploying an agent bundles your code, config, and chat UI into a single package, uploads it to Databricks, creates an App, and runs permission grants - all in one step.

## Pipeline overview

Triggered by the **Deploy** setup block (`exec-deploy-agent` action):

```
Build bundle -> Upload -> Create/update App -> Wait for startup -> Run grants
```

The entire flow streams output back to the Setup App terminal via SSE.

## Step 1: Build the agent bundle

`build_agent_bundle()` in `brickforge/deploy/deploy_agent_app.py` creates a zip containing:

| Content | Source |
|---------|--------|
| Agent runtime | `brickforge/agent/` |
| Tools | `brickforge/tools/` |
| Data scripts | `brickforge/data/` |
| Config directory | `brickforge/conf/` |
| Eval scripts | `brickforge/eval/` |
| Chat UI (client) | `brickforge/app/client/dist.tar.gz` |
| Chat UI (server) | `brickforge/app/server/dist.tar.gz` |
| Project prompts | `projects/{name}/prompt/` |
| Project gen data | `projects/{name}/gen/` |
| `config.json` | Full structured config (tokens stripped) |
| `pyproject.toml` | For `pip install .` on DBX Apps |
| `requirements.txt` | 160 pinned dependencies |
| `app.yaml` | Minimal - startup command + 6 runtime constants |
| `databricks.yml` | Resource permissions (reference only) |

!!! warning
    `databricks.yml` is generated and included but **never consumed** by the deploy. BrickForge uses `w.apps.create()` / `w.apps.deploy()` (Databricks SDK), NOT `databricks bundle deploy` (DAB CLI). The YAML exists for documentation only.

### What ships in app.yaml

The `app.yaml` contains only the startup command and a handful of runtime constants. All real config lives in `config.json` as a file in the bundle. Zero user env vars in `app.yaml`.

## Step 2: Upload

The bundle is uploaded to the workspace via:

```python
w.workspace.import_(format=ImportFormat.RAW, ...)
```

## Step 3: Create or update the App

```python
# First deploy
w.apps.create(name=app_name, ...)

# Subsequent deploys
w.apps.deploy(app_name=app_name, ...)
```

## Step 4: start.sh

BrickForge generates a `start.sh` script that runs on Databricks Apps compute:

```bash
unzip _bundle.dat
tar xzf app/client/dist.tar.gz -C app/client/
tar xzf app/server/dist.tar.gz -C app/server/
python -m venv .venv --clear && . .venv/bin/activate
pip install -r requirements.txt
exec python -c "from agent.start_server import main; main()"
```

At boot, `start_server.py`:

1. Reads `config.json`
2. Calls `flatten()` to convert JSON to flat env vars
3. Calls `os.environ.update()` with the flattened dict
4. Starts MLflow AgentServer on port 8000
5. Starts the Chat UI (Node.js Express) on port 3000

## Step 5: Post-deploy grants

After the app starts, `run_all_grants.py` automatically grants permissions to the app's service principal. The pattern:

```python
app = w.apps.get(app_name)
sp_id = app.service_principal_client_id

w.permissions.update(
    request_object_type="<type>",
    request_object_id=resource_id,
    access_control_list=[iam.AccessControlRequest(
        service_principal_name=sp_id,
        permission_level=iam.PermissionLevel.<LEVEL>,
    )],
)
```

### Grants table

| Resource | Object type | Permission | Script |
|----------|-----------|-----------|--------|
| SQL Warehouse | `warehouses` | `CAN_USE` | `deploy/grant/authorize_warehouse_for_app.py` |
| Genie space | `genie` | `CAN_RUN` | `deploy/grant/authorize_genie_for_app.py` |
| Serving endpoint | `serving-endpoints` | `CAN_QUERY` | `deploy/grant/authorize_endpoint_for_app.py` |
| UC tables | SQL `GRANT SELECT` | - | `deploy/grant/grant_app_tables.py` |
| UC functions | SQL `GRANT EXECUTE` | - | `deploy/grant/grant_app_functions.py` |
| Lakebase | SDK-specific | - | `deploy/grant/grant_lakebase_for_app.py` |

!!! warning
    Genie spaces use object type `"genie"` - not `"genie/space"` or `"genie-spaces"`. This is a common SDK gotcha.

## Redeploying

Redeploy follows the same pipeline. BrickForge calls `w.apps.deploy()` on the existing app. Never stop compute - just redeploy.

## What the deployed app looks like

Two services in one Databricks App:

```
Databricks App
  |
  +-- MLflow AgentServer (port 8000)
  |     LangGraph agent + LangChain tools
  |     /invocations endpoint
  |
  +-- Chat UI (port 3000)
        React frontend + Express backend
        /api/* routes (chat, history, session, config)
```

Users access the Chat UI at the app URL. The Chat UI proxies requests to the AgentServer.
