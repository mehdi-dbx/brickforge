"""ConfigProvider - abstract base class + Local/Forge implementations."""
from __future__ import annotations

import io
import os
import re
import threading
import zipfile
from pathlib import Path
from typing import Any

import urllib.request
import json

SENSITIVE_PATTERN = re.compile(r"TOKEN|SECRET|PASSWORD|PAT\b|API_KEY", re.IGNORECASE)

_config_lock = threading.Lock()


class ConfigProvider:
    """Abstract base class for env-config operations."""

    def list(self) -> list[dict[str, Any]]:
        raise NotImplementedError

    def get(self, key: str) -> str | None:
        entry = next((e for e in self.list() if e["key"] == key), None)
        return entry["value"] if entry else None

    def set(self, key: str, value: str) -> None:
        self.set_many({key: value})

    def set_many(self, updates: dict[str, str]) -> None:
        raise NotImplementedError

    def disable(self, key: str) -> None:
        self.disable_many([key])

    def disable_many(self, keys: list[str]) -> None:
        raise NotImplementedError

    def toggle(self, key: str) -> bool:
        raise NotImplementedError

    def list_by_prefix(self, prefix: str) -> list[dict[str, Any]]:
        raise NotImplementedError

    def to_env_dict(self) -> dict[str, str]:
        return {e["key"]: e["value"] for e in self.list()}

    def delete_key(self, key: str) -> None:
        raise NotImplementedError


class LocalConfigProvider(ConfigProvider):
    """Reads/writes config from a .env.local file."""

    def __init__(self, env_file: str | Path):
        self._env_file = Path(env_file)

    def _read_raw(self) -> str:
        try:
            return self._env_file.read_text()
        except FileNotFoundError:
            return ""

    def list(self) -> list[dict[str, Any]]:
        raw = self._read_raw()
        entries = []
        seen: set[str] = set()
        for line in raw.split("\n"):
            trimmed = line.strip()
            if not trimmed or trimmed.startswith("#"):
                continue
            eq = trimmed.find("=")
            if eq < 0:
                continue
            key = trimmed[:eq].strip()
            value = trimmed[eq + 1:]
            if key in seen:
                continue
            seen.add(key)
            entries.append({"key": key, "value": value, "sensitive": bool(SENSITIVE_PATTERN.search(key))})
        return entries

    def set_many(self, updates: dict[str, str]) -> None:
        with _config_lock:
            raw = self._read_raw()
            lines = raw.split("\n")
            # Find last active line index for each key
            last_active: dict[str, int] = {}
            for i, line in enumerate(lines):
                trimmed = line.strip()
                if not trimmed or trimmed.startswith("#"):
                    continue
                eq = trimmed.find("=")
                if eq < 0:
                    continue
                key = trimmed[:eq].strip()
                if key in updates:
                    last_active[key] = i

            for key, new_val in updates.items():
                if key in last_active:
                    lines[last_active[key]] = f"{key}={new_val}"
                else:
                    lines.append(f"{key}={new_val}")

            content = "\n".join(lines)
            if not content.endswith("\n"):
                content += "\n"
            self._env_file.write_text(content)

    def disable_many(self, keys: list[str]) -> None:
        with _config_lock:
            raw = self._read_raw()
            key_set = set(keys)
            out = []
            for line in raw.split("\n"):
                trimmed = line.strip()
                if trimmed.startswith("#"):
                    out.append(line)
                    continue
                eq = trimmed.find("=")
                if eq < 0:
                    out.append(line)
                    continue
                key = trimmed[:eq].strip()
                out.append(f"#{line}" if key in key_set else line)
            self._env_file.write_text("\n".join(out))

    def toggle(self, key: str) -> bool:
        with _config_lock:
            raw = self._read_raw()
            lines = raw.split("\n")

            last_active_line = -1
            last_comment_line = -1
            for i, line in enumerate(lines):
                trimmed = line.strip()
                if not trimmed:
                    continue
                if trimmed.startswith("#"):
                    content = re.sub(r"^#\s*", "", trimmed)
                    eq = content.find("=")
                    if eq >= 0 and content[:eq].strip() == key:
                        last_comment_line = i
                else:
                    eq = trimmed.find("=")
                    if eq >= 0 and trimmed[:eq].strip() == key:
                        last_active_line = i

            if last_active_line >= 0:
                lines[last_active_line] = "#" + lines[last_active_line]
            elif last_comment_line >= 0:
                lines[last_comment_line] = re.sub(r"^#\s*", "", lines[last_comment_line])
            else:
                return False

            self._env_file.write_text("\n".join(lines))
            return True

    def list_by_prefix(self, prefix: str) -> list[dict[str, Any]]:
        raw = self._read_raw()
        by_key: dict[str, dict[str, Any]] = {}

        for line in raw.split("\n"):
            trimmed = line.strip()
            if not trimmed:
                continue

            enabled = True
            content = trimmed
            if content.startswith("#"):
                enabled = False
                content = re.sub(r"^#\s*", "", content)

            eq = content.find("=")
            if eq < 0:
                continue
            key = content[:eq].strip()
            value = content[eq + 1:].strip()

            if not key.startswith(prefix):
                continue

            existing = by_key.get(key)
            if not existing or enabled or (not existing["enabled"] and not enabled):
                slug = key[len(prefix):]
                by_key[key] = {"key": key, "value": value, "enabled": enabled, "label": slug.lower().replace("_", " ")}

        return list(by_key.values())

    def delete_key(self, key: str) -> None:
        with _config_lock:
            raw = self._read_raw()
            lines = []
            for line in raw.split("\n"):
                trimmed = line.strip()
                content = re.sub(r"^#\s*", "", trimmed) if trimmed.startswith("#") else trimmed
                eq = content.find("=")
                if eq >= 0 and content[:eq].strip() == key:
                    continue
                lines.append(line)
            self._env_file.write_text("\n".join(lines))


class ForgeConfigProvider(ConfigProvider):
    """In-memory zip config, flushed to UC Volume. Used in SaaS/DBX App mode."""

    def __init__(self):
        self._active: dict[str, str] = {}
        self._disabled: dict[str, str] = {}
        self._zip_buffer: bytes = b""
        self._volume_path: str | None = None
        self._host: str = os.environ.get("DATABRICKS_HOST", "")
        self._token: str = os.environ.get("DATABRICKS_TOKEN", "")
        self._dirty: bool = False

    async def init(self) -> None:
        schema = os.environ.get("PROJECT_UNITY_CATALOG_SCHEMA", "")
        if schema and "." in schema:
            self._init_volume_path(schema)
            await self._download()

    def _init_volume_path(self, schema: str) -> None:
        catalog, schema_name = schema.split(".", 1)
        self._volume_path = f"/Volumes/{catalog}/{schema_name}/brickforge/stash/current.forge.zip"

    async def _download(self) -> None:
        if not self._volume_path or not self._host:
            return
        try:
            url = f"{self._host.rstrip('/')}/api/2.0/fs/files{self._volume_path}"
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {self._token}"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                self._zip_buffer = resp.read()
            with zipfile.ZipFile(io.BytesIO(self._zip_buffer)) as zf:
                if "config.env" in zf.namelist():
                    self._parse_config_env(zf.read("config.env").decode("utf-8"))
        except Exception:
            pass  # first run, no zip yet

    def _parse_config_env(self, raw: str) -> None:
        self._active.clear()
        self._disabled.clear()
        for line in raw.split("\n"):
            trimmed = line.strip()
            if not trimmed:
                continue
            if trimmed.startswith("#"):
                content = re.sub(r"^#\s*", "", trimmed)
                eq = content.find("=")
                if eq >= 0:
                    self._disabled[content[:eq].strip()] = content[eq + 1:]
                continue
            eq = trimmed.find("=")
            if eq < 0:
                continue
            self._active[trimmed[:eq].strip()] = trimmed[eq + 1:]

    def _serialize_config_env(self) -> str:
        lines = [f"{k}={v}" for k, v in self._active.items()]
        for k, v in self._disabled.items():
            if k not in self._active:
                lines.append(f"#{k}={v}")
        return "\n".join(lines) + "\n"

    def _flush(self) -> None:
        if not self._dirty:
            return
        # Build zip in memory
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("config.env", self._serialize_config_env())
            # Copy non-config files from old zip
            if self._zip_buffer:
                try:
                    with zipfile.ZipFile(io.BytesIO(self._zip_buffer)) as old_zf:
                        for name in old_zf.namelist():
                            if name != "config.env":
                                zf.writestr(name, old_zf.read(name))
                except Exception:
                    pass
        self._zip_buffer = buf.getvalue()

        if not self._volume_path:
            schema = self._active.get("PROJECT_UNITY_CATALOG_SCHEMA", "")
            if schema and "." in schema:
                self._init_volume_path(schema)
            else:
                self._dirty = False
                return

        try:
            url = f"{self._host.rstrip('/')}/api/2.0/fs/files{self._volume_path}"
            req = urllib.request.Request(url, data=self._zip_buffer, method="PUT", headers={
                "Authorization": f"Bearer {self._token}",
                "Content-Type": "application/octet-stream",
            })
            urllib.request.urlopen(req, timeout=10)
            self._dirty = False
        except Exception as e:
            print(f"[forge] flush failed: {e}")

    def list(self) -> list[dict[str, Any]]:
        return [{"key": k, "value": v, "sensitive": bool(SENSITIVE_PATTERN.search(k))} for k, v in self._active.items()]

    def set_many(self, updates: dict[str, str]) -> None:
        with _config_lock:
            for k, v in updates.items():
                self._active[k] = v
                self._disabled.pop(k, None)
            self._dirty = True
            self._flush()

    def disable_many(self, keys: list[str]) -> None:
        with _config_lock:
            for key in keys:
                val = self._active.pop(key, None)
                if val is not None:
                    self._disabled[key] = val
            self._dirty = True
            self._flush()

    def toggle(self, key: str) -> bool:
        with _config_lock:
            if key in self._active:
                self._disabled[key] = self._active.pop(key)
            elif key in self._disabled:
                self._active[key] = self._disabled.pop(key)
            else:
                return False
            self._dirty = True
            self._flush()
            return True

    def list_by_prefix(self, prefix: str) -> list[dict[str, Any]]:
        by_key: dict[str, dict[str, Any]] = {}
        for key, value in self._active.items():
            if key.startswith(prefix):
                slug = key[len(prefix):]
                by_key[key] = {"key": key, "value": value, "enabled": True, "label": slug.lower().replace("_", " ")}
        for key, value in self._disabled.items():
            if key.startswith(prefix) and key not in by_key:
                slug = key[len(prefix):]
                by_key[key] = {"key": key, "value": value, "enabled": False, "label": slug.lower().replace("_", " ")}
        return list(by_key.values())

    def delete_key(self, key: str) -> None:
        with _config_lock:
            self._active.pop(key, None)
            self._disabled.pop(key, None)
            self._dirty = True
            self._flush()

    # File management (non-config files in zip)

    def get_file(self, path: str) -> str | None:
        if not self._zip_buffer:
            return None
        try:
            with zipfile.ZipFile(io.BytesIO(self._zip_buffer)) as zf:
                return zf.read(path).decode("utf-8") if path in zf.namelist() else None
        except Exception:
            return None

    def set_file(self, path: str, content: str) -> None:
        with _config_lock:
            self._dirty = True
            # Rebuild zip with new file
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                zf.writestr("config.env", self._serialize_config_env())
                zf.writestr(path, content)
                if self._zip_buffer:
                    try:
                        with zipfile.ZipFile(io.BytesIO(self._zip_buffer)) as old_zf:
                            for name in old_zf.namelist():
                                if name not in ("config.env", path):
                                    zf.writestr(name, old_zf.read(name))
                    except Exception:
                        pass
            self._zip_buffer = buf.getvalue()
            self._flush()

    def delete_file(self, path: str) -> None:
        if not self._zip_buffer:
            return
        with _config_lock:
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                try:
                    with zipfile.ZipFile(io.BytesIO(self._zip_buffer)) as old_zf:
                        for name in old_zf.namelist():
                            if name != path:
                                zf.writestr(name, old_zf.read(name))
                except Exception:
                    pass
            self._zip_buffer = buf.getvalue()
            self._dirty = True
            self._flush()

    def list_files(self) -> list[str]:
        if not self._zip_buffer:
            return []
        try:
            with zipfile.ZipFile(io.BytesIO(self._zip_buffer)) as zf:
                return [n for n in zf.namelist() if n != "config.env"]
        except Exception:
            return []
