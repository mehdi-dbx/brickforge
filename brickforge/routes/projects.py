"""Project management routes."""
from __future__ import annotations

import json
import os
import zipfile
import io

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from brickforge import PROJECT_ROOT

router = APIRouter()


def _get_config():
    from brickforge.server import config
    return config


@router.get("/api/projects")
async def list_projects():
    config = _get_config()
    schema = config.get("PROJECT_UNITY_CATALOG_SCHEMA") or ""
    if not schema or "." not in schema:
        return {"projects": [], "current": None}

    catalog, schema_name = schema.split(".", 1)
    volume_base = f"/Volumes/{catalog}/{schema_name}/brickforge/stash"
    host = config.get("DATABRICKS_HOST") or os.environ.get("DATABRICKS_HOST", "")
    token = config.get("DATABRICKS_TOKEN") or os.environ.get("DATABRICKS_TOKEN", "")

    if not host or not token:
        return {"projects": [], "current": None, "error": "host/token not set"}

    try:
        import urllib.request
        url = f"{host.rstrip('/')}/api/2.0/fs/directories{volume_base}"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        projects = []
        for entry in data.get("contents", []):
            name = entry.get("name", "")
            if name.endswith(".forge.zip"):
                projects.append({"name": name.replace(".forge.zip", ""), "path": entry.get("path", ""), "size": entry.get("file_size", 0)})
        return {"projects": projects, "current": None}
    except Exception as e:
        return {"projects": [], "current": None, "error": str(e)}


@router.post("/api/projects")
async def create_project(request: Request):
    body = await request.json()
    name = body.get("name", "")
    if not name:
        return JSONResponse({"error": "name required"}, status_code=400)

    config = _get_config()
    schema = config.get("PROJECT_UNITY_CATALOG_SCHEMA") or ""
    if not schema or "." not in schema:
        return JSONResponse({"error": "schema not configured"}, status_code=400)

    catalog, schema_name = schema.split(".", 1)
    volume_path = f"/Volumes/{catalog}/{schema_name}/brickforge/stash/{name}.forge.zip"
    host = config.get("DATABRICKS_HOST") or ""
    token = config.get("DATABRICKS_TOKEN") or ""

    # Create empty zip with config.env
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("config.env", "")
    zip_bytes = buf.getvalue()

    try:
        import urllib.request
        url = f"{host.rstrip('/')}/api/2.0/fs/files{volume_path}"
        req = urllib.request.Request(url, data=zip_bytes, method="PUT", headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/octet-stream",
        })
        urllib.request.urlopen(req, timeout=10)
        return {"ok": True, "name": name}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@router.get("/api/projects/{name}")
async def load_project(name: str):
    config = _get_config()
    schema = config.get("PROJECT_UNITY_CATALOG_SCHEMA") or ""
    if not schema or "." not in schema:
        return JSONResponse({"error": "schema not configured"}, status_code=400)

    catalog, schema_name = schema.split(".", 1)
    volume_path = f"/Volumes/{catalog}/{schema_name}/brickforge/stash/{name}.forge.zip"
    host = config.get("DATABRICKS_HOST") or ""
    token = config.get("DATABRICKS_TOKEN") or ""

    try:
        import urllib.request
        url = f"{host.rstrip('/')}/api/2.0/fs/files{volume_path}"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
        return {"ok": True, "name": name, "size": len(data)}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=404)


@router.delete("/api/projects/{name}")
async def delete_project(name: str):
    config = _get_config()
    schema = config.get("PROJECT_UNITY_CATALOG_SCHEMA") or ""
    if not schema or "." not in schema:
        return JSONResponse({"error": "schema not configured"}, status_code=400)

    catalog, schema_name = schema.split(".", 1)
    volume_path = f"/Volumes/{catalog}/{schema_name}/brickforge/stash/{name}.forge.zip"
    host = config.get("DATABRICKS_HOST") or ""
    token = config.get("DATABRICKS_TOKEN") or ""

    try:
        import urllib.request
        url = f"{host.rstrip('/')}/api/2.0/fs/files{volume_path}"
        req = urllib.request.Request(url, method="DELETE", headers={"Authorization": f"Bearer {token}"})
        urllib.request.urlopen(req, timeout=10)
        return {"ok": True}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
