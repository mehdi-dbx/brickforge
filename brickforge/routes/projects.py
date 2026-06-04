"""Project management routes -- local + UC Volume projects."""
from __future__ import annotations

import json
import zipfile
import io
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from brickforge import PROJECT_ROOT, USER_DIR

router = APIRouter()

# Local projects dir: ~/.brickforge/projects/ (pip) or PROJECT_ROOT/projects/ (editable)
if (PROJECT_ROOT / "pyproject.toml").exists():
    PROJECTS_DIR = PROJECT_ROOT / "projects"
else:
    PROJECTS_DIR = USER_DIR / "projects"

CURRENT_FILE = PROJECTS_DIR / ".current"


def _get_config():
    from brickforge.server import config
    return config


def _read_current() -> str | None:
    """Read the currently active project name."""
    if CURRENT_FILE.exists():
        name = CURRENT_FILE.read_text().strip()
        if name and (PROJECTS_DIR / f"{name}.json").exists():
            return name
    return None


def _write_current(name: str | None) -> None:
    """Write the currently active project name."""
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
    if name:
        CURRENT_FILE.write_text(name)
    elif CURRENT_FILE.exists():
        CURRENT_FILE.unlink()


def _set_project_mirror(name: str | None) -> None:
    """Point config auto-save at the named project file (or clear it)."""
    config = _get_config()
    if hasattr(config, "_project_file"):
        if name:
            config._project_file = PROJECTS_DIR / f"{name}.json"
        else:
            config._project_file = None


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

    current = _read_current()
    return {"projects": projects, "current": current}


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

    # Snapshot current config.json (not DEFAULT_CONFIG)
    config = _get_config()
    project_file.write_text(json.dumps(config._data, indent=2) + "\n")

    # Set as current + enable auto-save mirror
    _write_current(safe_name)
    _set_project_mirror(safe_name)

    return {"ok": True, "name": safe_name, "source": "local"}


# ── Load project ─────────────────────────────────────────────────────────────

@router.get("/api/projects/{name}")
async def load_project(name: str):
    # Try local first
    project_file = PROJECTS_DIR / f"{name}.json"
    if project_file.exists():
        project_config = json.loads(project_file.read_text())
        config = _get_config()
        from brickforge.lib.config_provider import _deep_merge
        _deep_merge(config._data, project_config)
        config._save()
        config._sync_env()
        _write_current(name)
        _set_project_mirror(name)
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
                _write_current(name)
                _set_project_mirror(name)
                return {"ok": True, "name": name, "source": "volume"}
        return JSONResponse({"error": "invalid project zip"}, status_code=400)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=404)


# ── Delete project ───────────────────────────────────────────────────────────

@router.delete("/api/projects/{name}")
async def delete_project(name: str):
    # If deleting the current project, clear current
    if _read_current() == name:
        _write_current(None)
        _set_project_mirror(None)

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

    # Update current if renamed the active project
    if _read_current() == name:
        _write_current(new_name)
        _set_project_mirror(new_name)

    return {"ok": True, "name": new_name}
