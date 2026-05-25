"""Environment utilities: buildSubEnv, checkTokenExpiry, detectCloud."""
from __future__ import annotations

import base64
import json
import os
import subprocess
import time

from brickforge.lib.config_provider import ConfigProvider


def detect_cloud(host: str) -> str | None:
    if not host:
        return None
    if ".azuredatabricks.net" in host:
        return "azure"
    if ".gcp.databricks.com" in host:
        return "gcp"
    if ".cloud.databricks.com" in host:
        return "aws"
    return None


def build_sub_env(config: ConfigProvider, extra_env: dict[str, str] | None = None) -> dict[str, str]:
    """Build a clean subprocess environment: config values + os.environ, minus auth conflicts."""
    env = dict(os.environ)
    for entry in config.list():
        env[entry["key"]] = entry["value"]
    if extra_env:
        env.update(extra_env)
    # If PAT token is set, remove SP OAuth vars to avoid SDK auth conflict
    if env.get("DATABRICKS_TOKEN") and env.get("DATABRICKS_CLIENT_ID"):
        env.pop("DATABRICKS_CLIENT_ID", None)
        env.pop("DATABRICKS_CLIENT_SECRET", None)
    # Remove CLI profile in FORGE mode
    forge_mode = os.environ.get("FORGE_MODE") == "true" or os.environ.get("DATABRICKS_APP_PORT") is not None
    if forge_mode:
        env.pop("DATABRICKS_CONFIG_PROFILE", None)
    # Remove stale venv
    env.pop("VIRTUAL_ENV", None)
    return env


def check_token_expiry(config: ConfigProvider) -> str | None:
    """Check if OAuth JWT token is expired. Auto-refresh if possible. Returns error message or None."""
    token = config.get("DATABRICKS_TOKEN") or os.environ.get("DATABRICKS_TOKEN", "")
    if not token or not token.startswith("eyJ"):
        return None  # PATs (dapi...) don't expire via JWT

    try:
        payload_b64 = token.split(".")[1]
        # Add padding
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        exp = payload.get("exp")
        if not exp or time.time() <= exp:
            return None  # not expired

        # Token is expired -- try to refresh silently
        refresh_token = config.get("DATABRICKS_REFRESH_TOKEN") or ""
        token_endpoint = config.get("DATABRICKS_TOKEN_ENDPOINT") or ""
        if refresh_token and token_endpoint:
            try:
                import urllib.request
                import urllib.parse
                data = urllib.parse.urlencode({
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": "databricks-cli",
                }).encode()
                req = urllib.request.Request(token_endpoint, data=data, method="POST")
                req.add_header("Content-Type", "application/x-www-form-urlencoded")
                with urllib.request.urlopen(req, timeout=10) as r:
                    resp = json.loads(r.read())
                if resp.get("access_token"):
                    config.set_many({"DATABRICKS_TOKEN": resp["access_token"]})
                    os.environ["DATABRICKS_TOKEN"] = resp["access_token"]
                    if resp.get("refresh_token"):
                        config.set_many({"DATABRICKS_REFRESH_TOKEN": resp["refresh_token"]})
                    print("[auth] Token auto-refreshed silently")
                    return None
            except Exception as e:
                print(f"[auth] Token refresh failed: {e}")

        ago = round((time.time() - exp) / 60)
        return f"Token expired {ago} minute{'s' if ago != 1 else ''} ago. Re-authenticate via \"connect via terminal\" or enter a new token."
    except Exception:
        return None  # not a valid JWT, skip
