"""Phase 5: SSE Exec Engine tests."""
import json
from pathlib import Path

from fastapi.testclient import TestClient
from brickforge.server import app
from brickforge.lib.sse import sse_line, sse_done

client = TestClient(app)


def _parse_sse(text: str) -> list[dict]:
    """Parse SSE text into list of {type, data} dicts."""
    events = []
    for chunk in text.split("\n\n"):
        if not chunk.strip():
            continue
        evt_type = "message"
        evt_data = ""
        for line in chunk.split("\n"):
            if line.startswith("event:"):
                evt_type = line[6:].strip()
            if line.startswith("data:"):
                evt_data = line[5:].strip()
        if evt_data:
            try:
                events.append({"type": evt_type, "data": json.loads(evt_data)})
            except json.JSONDecodeError:
                events.append({"type": evt_type, "data": evt_data})
    return events


# ── SSE format ────────────────────────────────────────────────────────────────

def test_sse_line_format():
    result = sse_line("[+] test\n")
    assert result.startswith("event:line\n")
    assert "data:" in result
    assert result.endswith("\n\n")
    data = json.loads(result.split("data:")[1].strip())
    assert data["text"] == "[+] test\n"
    assert data["stream"] == "out"


def test_sse_done_format():
    result = sse_done(True)
    assert result.startswith("event:done\n")
    data = json.loads(result.split("data:")[1].strip())
    assert data["ok"] is True


# ── Direct call actions ──────────────────────────────────────────────────────

def test_save_manual_updates_config():
    r = client.post("/api/setup/exec", json={"action": "save-manual", "params": {"key": "TEST_SAVE_MANUAL", "value": "test123"}})
    assert r.status_code == 200
    events = _parse_sse(r.text)
    assert any(e["type"] == "line" and "TEST_SAVE_MANUAL" in e["data"]["text"] for e in events)
    assert any(e["type"] == "done" and e["data"]["ok"] for e in events)


def test_save_workspace_sets_host_and_token():
    r = client.post("/api/setup/exec", json={
        "action": "save-workspace",
        "params": {"host": "https://test.cloud.databricks.com", "token": "dapi_test_ws"},
    })
    events = _parse_sse(r.text)
    assert any(e["type"] == "done" and e["data"]["ok"] for e in events)


def test_exec_same_disables_model_keys():
    # Set model keys first
    client.put("/api/env", json={"AGENT_MODEL": "https://test", "AGENT_MODEL_TOKEN": "tok"})
    r = client.post("/api/setup/exec", json={"action": "exec-same", "params": {}})
    events = _parse_sse(r.text)
    lines = [e["data"]["text"] for e in events if e["type"] == "line"]
    assert any("same-workspace" in l for l in lines)
    assert any(e["type"] == "done" and e["data"]["ok"] for e in events)


def test_forge_bridge_noop():
    r = client.post("/api/setup/exec", json={"action": "forge-bridge", "params": {}})
    events = _parse_sse(r.text)
    assert any(e["type"] == "done" and e["data"]["ok"] for e in events)


def test_save_multi_instance():
    r = client.post("/api/setup/exec", json={
        "action": "save-multi-instance",
        "params": {"prefix": "PROJECT_MCP_", "slug": "TEST_SSE", "url": "https://test.com"},
    })
    events = _parse_sse(r.text)
    assert any(e["type"] == "done" and e["data"]["ok"] for e in events)


def test_save_api_writes_keys():
    r = client.post("/api/setup/exec", json={
        "action": "save-api",
        "params": {"slug": "TESTAPI", "type": "direct", "url": "https://api.test.com", "method": "POST", "path": "/v1", "desc": "test"},
    })
    events = _parse_sse(r.text)
    assert any(e["type"] == "done" and e["data"]["ok"] for e in events)
    lines = [e["data"]["text"] for e in events if e["type"] == "line"]
    assert any("PROJECT_API_TESTAPI" in l for l in lines)


# ── Token expiry ──────────────────────────────────────────────────────────────

def test_no_auth_action_skips_check():
    """save-deploy-name should skip token expiry check."""
    r = client.post("/api/setup/exec", json={
        "action": "save-deploy-name",
        "params": {"name": "test-app"},
    })
    events = _parse_sse(r.text)
    assert any(e["type"] == "done" and e["data"]["ok"] for e in events)


# ── Logging ───────────────────────────────────────────────────────────────────

def test_exec_creates_log_file():
    r = client.post("/api/setup/exec", json={"action": "save-manual", "params": {"key": "TEST_LOG", "value": "logtest"}})
    log_dir = Path("logs/exec")
    assert any(f.name.startswith("save-manual-") for f in log_dir.iterdir())


def test_exec_log_retrieval():
    r = client.get("/api/setup/exec-log?action=save-manual")
    assert r.status_code == 200
    data = r.json()
    assert len(data["lines"]) > 0
