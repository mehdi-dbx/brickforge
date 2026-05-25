"""Phase 2: Config Providers tests."""
import json
import os
import tempfile
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from brickforge.lib.config_provider import LocalConfigProvider, ForgeConfigProvider, SENSITIVE_PATTERN
from brickforge.lib.env_utils import build_sub_env, check_token_expiry, detect_cloud


# ── LocalConfigProvider ───────────────────────────────────────────────────────

@pytest.fixture
def env_file(tmp_path):
    f = tmp_path / ".env.local"
    f.write_text("DATABRICKS_HOST=https://test.cloud.databricks.com\nDATABRICKS_TOKEN=dapi1234\n#DISABLED_KEY=old_value\nPROJECT_GENIE_DEFAULT=abc123\nPROJECT_GENIE_SALES=def456\n")
    return f


@pytest.fixture
def local_config(env_file):
    return LocalConfigProvider(env_file)


def test_local_list_returns_entries(local_config):
    entries = local_config.list()
    keys = [e["key"] for e in entries]
    assert "DATABRICKS_HOST" in keys
    assert "DATABRICKS_TOKEN" in keys
    assert "DISABLED_KEY" not in keys  # commented out


def test_local_set_many_writes_values(local_config, env_file):
    local_config.set_many({"NEW_KEY": "new_value", "DATABRICKS_HOST": "https://updated.com"})
    entries = local_config.list()
    assert any(e["key"] == "NEW_KEY" and e["value"] == "new_value" for e in entries)
    assert any(e["key"] == "DATABRICKS_HOST" and e["value"] == "https://updated.com" for e in entries)


def test_local_disable_comments_out_key(local_config, env_file):
    local_config.disable_many(["DATABRICKS_TOKEN"])
    entries = local_config.list()
    assert not any(e["key"] == "DATABRICKS_TOKEN" for e in entries)
    raw = env_file.read_text()
    assert "#DATABRICKS_TOKEN=" in raw


def test_local_toggle_key(local_config, env_file):
    # Toggle active -> commented
    result = local_config.toggle("DATABRICKS_HOST")
    assert result is True
    assert not any(e["key"] == "DATABRICKS_HOST" for e in local_config.list())
    # Toggle commented -> active
    result = local_config.toggle("DATABRICKS_HOST")
    assert result is True
    assert any(e["key"] == "DATABRICKS_HOST" for e in local_config.list())


def test_local_list_by_prefix(local_config):
    instances = local_config.list_by_prefix("PROJECT_GENIE_")
    assert len(instances) == 2
    keys = {i["key"] for i in instances}
    assert "PROJECT_GENIE_DEFAULT" in keys
    assert "PROJECT_GENIE_SALES" in keys


def test_local_sensitive_pattern(local_config):
    entries = local_config.list()
    token_entry = next(e for e in entries if e["key"] == "DATABRICKS_TOKEN")
    host_entry = next(e for e in entries if e["key"] == "DATABRICKS_HOST")
    assert token_entry["sensitive"] is True
    assert host_entry["sensitive"] is False


# ── ForgeConfigProvider ───────────────────────────────────────────────────────

def test_forge_list_from_zip():
    provider = ForgeConfigProvider()
    provider._active = {"KEY1": "val1", "KEY2": "val2"}
    entries = provider.list()
    assert len(entries) == 2
    assert any(e["key"] == "KEY1" and e["value"] == "val1" for e in entries)


def test_forge_set_many_updates_zip():
    provider = ForgeConfigProvider()
    provider.set_many({"A": "1", "B": "2"})
    assert provider.get("A") == "1"
    assert provider.get("B") == "2"


def test_forge_disable_key_in_zip():
    provider = ForgeConfigProvider()
    provider.set_many({"KEEP": "yes", "REMOVE": "no"})
    provider.disable_many(["REMOVE"])
    entries = provider.list()
    assert any(e["key"] == "KEEP" for e in entries)
    assert not any(e["key"] == "REMOVE" for e in entries)
    # Still in disabled
    assert "REMOVE" in provider._disabled


def test_forge_file_operations():
    provider = ForgeConfigProvider()
    provider.set_many({"X": "1"})  # init zip buffer
    provider.set_file("test.sql", "SELECT 1")
    assert provider.get_file("test.sql") == "SELECT 1"
    assert "test.sql" in provider.list_files()
    provider.delete_file("test.sql")
    assert provider.get_file("test.sql") is None


# ── env_utils ─────────────────────────────────────────────────────────────────

def test_build_sub_env_overlays_config(local_config):
    env = build_sub_env(local_config)
    assert env["DATABRICKS_HOST"] == "https://test.cloud.databricks.com"


def test_build_sub_env_clears_oauth_conflict(env_file):
    env_file.write_text("DATABRICKS_TOKEN=dapi123\nDATABRICKS_CLIENT_ID=abc\nDATABRICKS_CLIENT_SECRET=xyz\n")
    config = LocalConfigProvider(env_file)
    env = build_sub_env(config)
    assert "DATABRICKS_CLIENT_ID" not in env
    assert "DATABRICKS_CLIENT_SECRET" not in env


def test_check_token_expiry_valid(env_file):
    # PAT token -- should skip
    env_file.write_text("DATABRICKS_TOKEN=dapi_fake_test_token_not_real_xxxxx\n")
    config = LocalConfigProvider(env_file)
    assert check_token_expiry(config) is None


def test_check_token_expiry_expired_no_refresh(env_file):
    import base64
    # Build a fake expired JWT
    header = base64.urlsafe_b64encode(json.dumps({"alg": "RS256"}).encode()).rstrip(b"=").decode()
    payload = base64.urlsafe_b64encode(json.dumps({"exp": int(time.time()) - 3600}).encode()).rstrip(b"=").decode()
    fake_jwt = f"{header}.{payload}.fake_sig"
    env_file.write_text(f"DATABRICKS_TOKEN={fake_jwt}\n")
    config = LocalConfigProvider(env_file)
    result = check_token_expiry(config)
    assert result is not None
    assert "expired" in result.lower()


def test_detect_cloud_aws():
    assert detect_cloud("https://e2-demo.cloud.databricks.com") == "aws"


def test_detect_cloud_azure():
    assert detect_cloud("https://adb-123.11.azuredatabricks.net") == "azure"


def test_detect_cloud_localhost():
    assert detect_cloud("http://localhost:9000") is None
    assert detect_cloud("") is None


# ── API endpoints ─────────────────────────────────────────────────────────────

def test_get_env_returns_config():
    from brickforge.server import app
    client = TestClient(app)
    r = client.get("/api/env")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)


def test_put_env_updates_config():
    from brickforge.server import app
    client = TestClient(app)
    r = client.put("/api/env", json={"TEST_KEY_PHASE2": "test_value"})
    assert r.status_code == 200
    # Verify it was saved
    r2 = client.get("/api/env")
    entries = r2.json()
    assert any(e["key"] == "TEST_KEY_PHASE2" and e["value"] == "test_value" for e in entries)
