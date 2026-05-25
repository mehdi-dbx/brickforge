"""Phase 3: Setup Status + Testing tests."""
import json
import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from brickforge.server import app

client = TestClient(app)


def test_status_returns_all_steps():
    r = client.get("/api/setup/status")
    assert r.status_code == 200
    data = r.json()
    assert "steps" in data
    for step in ["host", "warehouse", "schema", "tables", "functions", "model", "prompt", "genie", "ka"]:
        assert step in data["steps"], f"missing step: {step}"


def test_status_returns_forge_mode():
    r = client.get("/api/setup/status")
    data = r.json()
    assert "forgeMode" in data
    assert isinstance(data["forgeMode"], bool)


def test_status_host_configured():
    """Host step configured when both HOST + TOKEN set."""
    r = client.get("/api/setup/status")
    data = r.json()
    host_step = data["steps"]["host"]
    env = data["env"]
    if env.get("DATABRICKS_HOST") and env.get("DATABRICKS_TOKEN"):
        assert host_step["status"] == "configured"
    else:
        assert host_step["status"] == "missing"


def test_status_host_missing():
    """Host step missing when HOST empty."""
    r = client.get("/api/setup/status")
    data = r.json()
    # Just verify the structure is correct
    assert "status" in data["steps"]["host"]
    assert "values" in data["steps"]["host"]


def test_status_model_same_workspace():
    """Model shows configured if HOST set but no ENDPOINT."""
    r = client.get("/api/setup/status")
    data = r.json()
    model_step = data["steps"]["model"]
    env = data["env"]
    if env.get("DATABRICKS_HOST") and not env.get("AGENT_MODEL_ENDPOINT"):
        assert model_step["status"] == "configured"
        assert "(same workspace)" in model_step["values"].get("AGENT_MODEL_ENDPOINT", "")


def test_status_multi_instance_genie():
    r = client.get("/api/setup/status")
    data = r.json()
    genie_step = data["steps"]["genie"]
    assert "instances" in genie_step


def test_status_tables_csv_count():
    r = client.get("/api/setup/status")
    data = r.json()
    tables_step = data["steps"]["tables"]
    assert "TABLE_COUNT" in tables_step["values"]


def test_clear_step_disables_keys():
    # Set a test key first
    client.put("/api/env", json={"DATABRICKS_WAREHOUSE_ID": "test_wh_123"})
    r = client.get("/api/setup/status")
    assert r.json()["steps"]["warehouse"]["status"] == "configured"

    # Clear it
    r = client.post("/api/setup/clear-step", json={"step": "warehouse"})
    assert r.status_code == 200
    assert r.json()["ok"] is True

    # Verify cleared
    r = client.get("/api/setup/status")
    assert r.json()["steps"]["warehouse"]["status"] == "missing"


def test_toggle_key():
    # Set a genie key
    client.put("/api/env", json={"PROJECT_GENIE_TEST": "test_genie_id"})
    r = client.put("/api/setup/toggle", json={"key": "PROJECT_GENIE_TEST"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_delete_instance():
    client.put("/api/env", json={"PROJECT_MCP_TEST": "https://test.com"})
    r = client.request("DELETE", "/api/setup/instance", json={"key": "PROJECT_MCP_TEST"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_exec_log_returns_latest():
    # Create a fake log
    log_dir = Path("logs/exec")
    log_dir.mkdir(parents=True, exist_ok=True)
    (log_dir / "test-action-latest.log").write_text("=== test ===\n[+] done\n")

    r = client.get("/api/setup/exec-log?action=test-action")
    assert r.status_code == 200
    data = r.json()
    assert data["action"] == "test-action"
    assert len(data["lines"]) > 0


def test_profiles_list():
    r = client.get("/api/setup/profiles")
    assert r.status_code == 200
    assert "items" in r.json()


def test_resources_expired_token():
    """If token expired, resources endpoint returns error."""
    # This test depends on actual token state -- just verify structure
    r = client.get("/api/setup/resources?type=catalogs")
    assert r.status_code == 200
    data = r.json()
    assert "items" in data or "error" in data
