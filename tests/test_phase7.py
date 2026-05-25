"""Phase 7: KA, Cleanup, Projects, Graph tests."""
from fastapi.testclient import TestClient
from brickforge.server import app

client = TestClient(app)


def test_graph_returns_nodes_edges():
    r = client.get("/api/graph")
    assert r.status_code == 200
    data = r.json()
    assert "nodes" in data
    assert "edges" in data
    assert "meta" in data
    assert isinstance(data["nodes"], list)
    assert len(data["nodes"]) >= 2  # at least agent + llm


def test_graph_layout_save_load():
    positions = {"agent": {"x": 100, "y": 200}}
    r = client.put("/api/layout", json=positions)
    assert r.status_code == 200
    # Verify positions applied
    r = client.get("/api/graph")
    agent_node = next(n for n in r.json()["nodes"] if n["id"] == "agent")
    assert agent_node["position"]["x"] == 100


def test_stash_health():
    r = client.get("/api/stash/health")
    assert r.status_code == 200
    data = r.json()
    assert "stashes" in data


def test_ka_list_documents():
    """KA list -- may fail if no workspace configured, just verify structure."""
    r = client.get("/api/ka/documents")
    assert r.status_code == 200
    data = r.json()
    assert "files" in data or "error" in data


def test_cleanup_resources_returns_items():
    r = client.get("/api/cleanup/resources")
    assert r.status_code == 200
    data = r.json()
    assert "items" in data or "error" in data


def test_projects_list():
    r = client.get("/api/projects")
    assert r.status_code == 200
    data = r.json()
    assert "projects" in data


def test_prompts_list():
    r = client.get("/api/setup/prompts")
    assert r.status_code == 200
    data = r.json()
    assert "files" in data


def test_prompts_save():
    r = client.put("/api/setup/prompts", json={"name": "test.prompt", "content": "test content"})
    assert r.status_code == 200
    assert r.json()["ok"] is True
    # Verify saved
    r = client.get("/api/setup/prompts")
    names = [f["name"] for f in r.json()["files"]]
    assert "test.prompt" in names
