#!/usr/bin/env python3
"""Deploy an Agent App to Databricks from a .forge project config.

Called by the Setup App backend. Generates app.yaml + databricks.yml from
the project config, bundles agent code into a zip, uploads to workspace,
and deploys via the Databricks Apps API.

Usage:
    python deploy/deploy_agent_app.py --config /path/to/config.json

The config.json is a flat key-value dict (same format as .env.local / ConfigProvider.toEnvDict()).
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import os
import sys
import tarfile
import zipfile
from pathlib import Path

from databricks.sdk import WorkspaceClient
from databricks.sdk.service.workspace import ImportFormat

ROOT = Path(__file__).resolve().parents[1]

# ── Agent App file manifest ──────────────────────────────────────────────────

AGENT_APP_DIRS = [
    "agent",
    "tools",
    "data/default",
    "data/init",
    "data/gen",
    "data/py",
    "conf",
    "eval",
]

# Dirs to pre-compress as tar.gz (faster snapshot, unzipped at startup)
AGENT_APP_TARBALL_DIRS = [
    "app/client/dist",
    "app/server/dist",
]

AGENT_APP_FILES = [
    "pyproject.toml",
]

EXCLUDE_PATTERNS = {
    "__pycache__", ".mypy_cache", ".DS_Store", "node_modules",
    ".git", ".claude", "stash", "edu", "doc", "visual",
}


def _should_exclude(rel_path: Path) -> bool:
    parts = set(rel_path.parts)
    if parts & EXCLUDE_PATTERNS:
        return True
    if rel_path.suffix == ".pyc":
        return True
    return False


# ── app.yaml generation ──────────────────────────────────────────────────────

AGENT_APP_YAML_TEMPLATE = """\
command: ["bash", "-c", "uv sync && node app/server/dist/index.mjs"]

env:
  - name: MLFLOW_TRACKING_URI
    value: "databricks"
  - name: MLFLOW_REGISTRY_URI
    value: "databricks-uc"
  - name: API_PROXY
    value: "http://localhost:8000/invocations"
  - name: CHAT_APP_PORT
    value: "3000"
  - name: TASK_EVENTS_URL
    value: "http://127.0.0.1:3000"
  - name: CHAT_PROXY_TIMEOUT_SECONDS
    value: "300"
{extra_env}"""


def generate_app_yaml(config: dict) -> str:
    """Generate Agent App app.yaml from project config dict."""
    env_lines = []
    # Dynamic env vars from config
    env_map = {
        "AGENT_MODEL_ENDPOINT": config.get("AGENT_MODEL_ENDPOINT", ""),
        "PROJECT_UNITY_CATALOG_SCHEMA": config.get("PROJECT_UNITY_CATALOG_SCHEMA", ""),
        "DATABRICKS_WAREHOUSE_ID": config.get("DATABRICKS_WAREHOUSE_ID", ""),
    }
    # Add all PROJECT_GENIE_*, PROJECT_KA_*, PROJECT_VS_*, PROJECT_MCP_*, etc.
    for key, value in sorted(config.items()):
        if key.startswith("PROJECT_") and value:
            env_map[key] = value
        if key == "LAKEBASE_INSTANCE_NAME" and value:
            env_map[key] = value
        if key == "MLFLOW_EXPERIMENT_ID" and value:
            env_map[key] = value

    for key, value in sorted(env_map.items()):
        if value:
            env_lines.append(f'  - name: {key}\n    value: "{value}"')

    extra = "\n".join(env_lines)
    return AGENT_APP_YAML_TEMPLATE.format(extra_env=extra)


# ── databricks.yml generation ────────────────────────────────────────────────

DATABRICKS_YML_TEMPLATE = """\
bundle:
  name: {app_name}

resources:
  apps:
    agent_app:
      name: "{app_name}"
      description: "BrickForge Agent Application"
      source_code_path: ./

      resources:
        - name: 'sql_warehouse'
          sql_warehouse:
            id: '{warehouse_id}'
            permission: 'CAN_USE'
{genie_resources}{endpoint_resources}
targets:
  default:
    mode: production
    default: true
"""


def generate_databricks_yml(config: dict) -> str:
    """Generate databricks.yml from project config dict."""
    app_name = config.get("DBX_APP_NAME", "brickforge-agent")
    warehouse_id = config.get("DATABRICKS_WAREHOUSE_ID", "PLACEHOLDER")

    # Genie space resources
    genie_lines = ""
    for key, value in sorted(config.items()):
        if key.startswith("PROJECT_GENIE_") and value:
            slug = key.replace("PROJECT_GENIE_", "").lower()
            genie_lines += f"""\
        - name: 'genie_space_{slug}'
          genie_space:
            space_id: '{value}'
            permission: 'CAN_RUN'
"""

    # Serving endpoint resources
    endpoint_lines = ""
    endpoint = config.get("AGENT_MODEL_ENDPOINT", "")
    if endpoint and not endpoint.startswith("http"):
        endpoint_lines += f"""\
        - name: 'serving_endpoint'
          serving_endpoint:
            name: '{endpoint}'
            permission: 'CAN_QUERY'
"""

    return DATABRICKS_YML_TEMPLATE.format(
        app_name=app_name,
        warehouse_id=warehouse_id,
        genie_resources=genie_lines,
        endpoint_resources=endpoint_lines,
    )


# ── Bundle zip ───────────────────────────────────────────────────────────────

def _make_tarball(dir_path: Path, arcname: str) -> bytes:
    """Create a tar.gz of a directory, returning the bytes."""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tf:
        tf.add(str(dir_path), arcname=arcname)
    return buf.getvalue()


def build_agent_bundle(config: dict) -> bytes:
    """Build a zip of the Agent App source + generated configs."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # Add agent app directories
        for dir_name in AGENT_APP_DIRS:
            dir_path = ROOT / dir_name
            if not dir_path.exists():
                continue
            for file_path in dir_path.rglob("*"):
                if file_path.is_dir():
                    continue
                rel = file_path.relative_to(ROOT)
                if _should_exclude(rel):
                    continue
                zf.write(file_path, str(rel))

        # Add pre-compressed dist dirs as tar.gz (faster snapshot)
        for dir_name in AGENT_APP_TARBALL_DIRS:
            parent = str(Path(dir_name).parent)  # "app/client"
            leaf = Path(dir_name).name            # "dist"
            tar_name = f"{parent}/{leaf}.tar.gz"   # "app/client/dist.tar.gz"
            pre_built = ROOT / tar_name
            if pre_built.exists():
                # Use pre-built tar.gz
                tar_bytes = pre_built.read_bytes()
            else:
                # Compress on-the-fly
                dir_path = ROOT / dir_name
                if not dir_path.exists():
                    continue
                tar_bytes = _make_tarball(dir_path, leaf)
            zf.writestr(tar_name, tar_bytes)
            print(f"  [+] {dir_name}/ -> {tar_name} ({len(tar_bytes)//1024}KB)")

        # Add individual files
        for fname in AGENT_APP_FILES:
            fpath = ROOT / fname
            if fpath.exists():
                zf.write(fpath, fname)

        # Generate and add app.yaml
        app_yaml = generate_app_yaml(config)
        zf.writestr("app.yaml", app_yaml)

        # Generate and add databricks.yml
        dbx_yml = generate_databricks_yml(config)
        zf.writestr("databricks.yml", dbx_yml)

    return buf.getvalue()


# ── Deploy ───────────────────────────────────────────────────────────────────

def deploy(config: dict) -> dict:
    """Deploy the Agent App to Databricks.

    Returns dict with deployment info (app_name, url, deployment_id).
    """
    w = WorkspaceClient()
    me = w.current_user.me()
    app_name = config.get("DBX_APP_NAME", "brickforge-agent")

    print(f"[~] Building agent bundle...")
    bundle_zip = build_agent_bundle(config)
    print(f"[+] Bundle: {len(bundle_zip) / 1024 / 1024:.1f} MB")

    # Upload zip to workspace
    workspace_dir = f"/Workspace/Users/{me.user_name}/{app_name}"
    zip_path = f"{workspace_dir}/_bundle.zip"

    print(f"[~] Uploading bundle to {zip_path}...")
    try:
        w.workspace.mkdirs(workspace_dir)
    except Exception:
        pass
    b64 = base64.b64encode(bundle_zip).decode()
    w.workspace.import_(path=zip_path, content=b64, format=ImportFormat.AUTO, overwrite=True)
    print(f"[+] Bundle uploaded")

    # Upload a startup script that unzips + starts
    startup_script = """\
#!/bin/bash
set -e
cd /app/python/source_code
if [ -f _bundle.zip ]; then
    echo "[1/4] Extracting bundle..."
    unzip -o _bundle.zip -d .
    rm _bundle.zip
    echo "[1/4] done"
fi
echo "[2/4] Unpacking dist archives..."
for tgz in app/client/dist.tar.gz app/server/dist.tar.gz; do
    if [ -f "$tgz" ]; then
        tar xzf "$tgz" -C "$(dirname "$tgz")"
        rm "$tgz"
    fi
done
echo "[2/4] done"
echo "[3/4] uv sync..."
uv sync 2>&1
echo "[3/4] done"
echo "[4/4] starting agent..."
exec python -c "from agent.start_server import main; main()"
"""
    b64_startup = base64.b64encode(startup_script.encode()).decode()
    w.workspace.import_(
        path=f"{workspace_dir}/start.sh",
        content=b64_startup,
        format=ImportFormat.AUTO,
        overwrite=True,
    )

    # Generate app.yaml that calls the startup script
    app_yaml_for_deploy = generate_app_yaml(config).replace(
        'command: ["bash", "-c", "uv sync && node app/server/dist/index.mjs"]',
        'command: ["bash", "start.sh"]',
    )
    b64_app_yaml = base64.b64encode(app_yaml_for_deploy.encode()).decode()
    w.workspace.import_(
        path=f"{workspace_dir}/app.yaml",
        content=b64_app_yaml,
        format=ImportFormat.AUTO,
        overwrite=True,
    )
    print(f"[+] app.yaml + start.sh uploaded")

    # Create or get the app
    print(f"[~] Creating/checking app '{app_name}'...")
    try:
        app_info = w.apps.get(app_name)
        print(f"[+] App exists: {app_info.url}")
    except Exception:
        app_info = w.apps.create(name=app_name, description="BrickForge Agent Application")
        print(f"[+] App created: {app_name}")
        # Wait for compute to be ready
        import time
        for _ in range(30):
            app_info = w.apps.get(app_name)
            state = app_info.compute_status.state.value if app_info.compute_status else "UNKNOWN"
            if state != "STARTING":
                break
            time.sleep(5)

    # Deploy
    print(f"[~] Deploying from {workspace_dir}...")
    deployment = w.apps.deploy(app_name, source_code_path=workspace_dir)
    dep_id = deployment.deployment_id
    print(f"[+] Deployment started: {dep_id}")

    # Wait for deployment
    import time
    for i in range(60):
        dep = w.apps.get_deployment(app_name, dep_id)
        state = dep.status.state.value if dep.status else "UNKNOWN"
        if state == "SUCCEEDED":
            print(f"[+] Deployment SUCCEEDED")
            break
        if state in ("FAILED", "CANCELLED"):
            print(f"[x] Deployment {state}: {dep.status.message}")
            break
        if i % 4 == 0:
            print(f"[~] {state}...")
        time.sleep(5)

    app_info = w.apps.get(app_name)
    url = getattr(app_info, "url", "")
    print(f"[+] Agent App: {url}")

    return {
        "app_name": app_name,
        "url": url,
        "deployment_id": dep_id,
        "workspace_dir": workspace_dir,
    }


# ── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Deploy Agent App from config")
    parser.add_argument("--config", required=True, help="Path to config JSON (key-value dict)")
    args = parser.parse_args()

    with open(args.config) as f:
        config = json.load(f)

    result = deploy(config)
    print(json.dumps(result, indent=2))
