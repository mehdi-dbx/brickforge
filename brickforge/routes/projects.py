"""Project management routes -- local + UC Volume projects."""
from __future__ import annotations

import copy
import json
import os
import zipfile
import io
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from brickforge import PROJECT_ROOT, USER_DIR
from brickforge.lib.config_provider import DEFAULT_CONFIG

router = APIRouter()

# Local projects dir: ~/.brickforge/projects/ (pip) or PROJECT_ROOT/projects/ (editable)
if (PROJECT_ROOT / "pyproject.toml").exists():
    PROJECTS_DIR = PROJECT_ROOT / "projects"
else:
    PROJECTS_DIR = USER_DIR / "projects"


def _get_config():
    from brickforge.server import config
    return config


# ── List projects ────────────────────────────────────────────────────────────

@router.get("/api/projects")
async def list_projects():
    config = _get_config()
    projects = []

    # Local projects
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
    for f in sorted(PROJECTS_DIR.glob("*.json")):
        name = f.stem
        projects.append({"name": name, "source": "local", "size": f.stat().st_size})

    # UC Volume projects (if schema + auth configured)
    schema = config.get("workspace.unity_catalog_schema") or ""
    host = config.get("workspace.host") or ""
    token = config.get("workspace.token") or ""

    if schema and "." in schema and host and token:
        catalog, schema_name = schema.split(".", 1)
        volume_base = f"/Volumes/{catalog}/{schema_name}/brickforge/stash"
        try:
            import urllib.request
            url = f"{host.rstrip('/')}/api/2.0/fs/directories{volume_base}"
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
            with urllib.request.urlopen(req, timeout=10) as r:
                data = json.loads(r.read())
            for entry in data.get("contents", []):
                name = entry.get("name", "")
                if name.endswith(".forge.zip"):
                    projects.append({
                        "name": name.replace(".forge.zip", ""),
                        "source": "volume",
                        "path": entry.get("path", ""),
                        "size": entry.get("file_size", 0),
                    })
        except Exception:
            pass  # Volume not accessible -- show local projects only

    return {"projects": projects}


# ── Create project ───────────────────────────────────────────────────────────

@router.post("/api/projects")
async def create_project(request: Request):
    body = await request.json()
    name = body.get("name", "").strip()
    if not name:
        return JSONResponse({"error": "name required"}, status_code=400)

    # Sanitize name
    safe_name = name.replace(" ", "-").replace("/", "-").replace("\\", "-")

    # Create local project config
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
    project_file = PROJECTS_DIR / f"{safe_name}.json"
    if project_file.exists():
        return JSONResponse({"error": f"project '{safe_name}' already exists"}, status_code=409)

    # Start with default config
    project_config = copy.deepcopy(DEFAULT_CONFIG)
    project_file.write_text(json.dumps(project_config, indent=2) + "\n")

    return {"ok": True, "name": safe_name, "source": "local"}


# ── Load project ─────────────────────────────────────────────────────────────

@router.get("/api/projects/{name}")
async def load_project(name: str):
    # Try local first
    project_file = PROJECTS_DIR / f"{name}.json"
    if project_file.exists():
        project_config = json.loads(project_file.read_text())
        # Switch the active config to this project
        config = _get_config()
        from brickforge.lib.config_provider import _deep_merge
        _deep_merge(config._data, project_config)
        config._save()
        config._sync_env()
        return {"ok": True, "name": name, "source": "local"}

    # Try UC Volume
    config = _get_config()
    schema = config.get("workspace.unity_catalog_schema") or ""
    host = config.get("workspace.host") or ""
    token = config.get("workspace.token") or ""

    if not schema or "." not in schema or not host or not token:
        return JSONResponse({"error": f"project '{name}' not found"}, status_code=404)

    catalog, schema_name = schema.split(".", 1)
    volume_path = f"/Volumes/{catalog}/{schema_name}/brickforge/stash/{name}.forge.zip"

    try:
        import urllib.request
        url = f"{host.rstrip('/')}/api/2.0/fs/files{volume_path}"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
        # Extract config.json from zip
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            if "config.json" in zf.namelist():
                project_config = json.loads(zf.read("config.json").decode())
                from brickforge.lib.config_provider import _deep_merge
                _deep_merge(config._data, project_config)
                config._save()
                config._sync_env()
                return {"ok": True, "name": name, "source": "volume"}
        return JSONResponse({"error": "invalid project zip"}, status_code=400)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=404)


# ── Delete project ───────────────────────────────────────────────────────────

@router.delete("/api/projects/{name}")
async def delete_project(name: str):
    # Try local first
    project_file = PROJECTS_DIR / f"{name}.json"
    if project_file.exists():
        project_file.unlink()
        return {"ok": True, "source": "local"}

    # Try UC Volume
    config = _get_config()
    schema = config.get("workspace.unity_catalog_schema") or ""
    host = config.get("workspace.host") or ""
    token = config.get("workspace.token") or ""

    if not schema or "." not in schema or not host or not token:
        return JSONResponse({"error": f"project '{name}' not found"}, status_code=404)

    catalog, schema_name = schema.split(".", 1)
    volume_path = f"/Volumes/{catalog}/{schema_name}/brickforge/stash/{name}.forge.zip"

    try:
        import urllib.request
        url = f"{host.rstrip('/')}/api/2.0/fs/files{volume_path}"
        req = urllib.request.Request(url, method="DELETE", headers={"Authorization": f"Bearer {token}"})
        urllib.request.urlopen(req, timeout=10)
        return {"ok": True, "source": "volume"}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ── Rename project ───────────────────────────────────────────────────────────

@router.patch("/api/projects/{name}")
async def rename_project(name: str, request: Request):
    body = await request.json()
    new_name = body.get("name", "").strip().replace(" ", "-").replace("/", "-").replace("\\", "-")
    if not new_name:
        return JSONResponse({"error": "new name required"}, status_code=400)
    if new_name == name:
        return {"ok": True, "name": name}

    old_file = PROJECTS_DIR / f"{name}.json"
    new_file = PROJECTS_DIR / f"{new_name}.json"

    if not old_file.exists():
        return JSONResponse({"error": f"project '{name}' not found"}, status_code=404)
    if new_file.exists():
        return JSONResponse({"error": f"project '{new_name}' already exists"}, status_code=409)

    old_file.rename(new_file)
    return {"ok": True, "name": new_name}
