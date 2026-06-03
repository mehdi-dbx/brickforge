"""Phase 6: Data Generation tests."""
import json
from pathlib import Path

from fastapi.testclient import TestClient
from brickforge.server import app
from brickforge import PROJECT_ROOT

client = TestClient(app)


def test_gen_status_returns_flags():
    r = client.get("/api/gen/status")
    assert r.status_code == 200
    data = r.json()
    assert "modelReady" in data
    assert "useDefault" in data
    assert "useGen" in data


def test_gen_tables_discovers_csvs():
    r = client.get("/api/gen/tables")
    assert r.status_code == 200
    data = r.json()
    assert "tables" in data
    assert isinstance(data["tables"], list)


def test_gen_routines_discovers_sql():
    r = client.get("/api/gen/routines")
    assert r.status_code == 200
    data = r.json()
    assert "routines" in data
    assert isinstance(data["routines"], list)


def test_save_wizard_state():
    state = {"step": "domain", "domain": "test", "tables": []}
    r = client.put("/api/gen/wizard-state", json=state)
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_get_wizard_state():
    # Save first
    state = {"step": "schema", "domain": "test2"}
    client.put("/api/gen/wizard-state", json=state)
    r = client.get("/api/gen/wizard-state")
    assert r.status_code == 200
    data = r.json()
    assert data["domain"] == "test2"


def test_delete_wizard_state():
    client.put("/api/gen/wizard-state", json={"step": "test"})
    r = client.delete("/api/gen/wizard-state")
    assert r.status_code == 200
    # Verify deleted
    r = client.get("/api/gen/wizard-state")
    assert r.json() is None


def test_clear_gen_deletes_files():
    # Create a test file
    gen_csv = PROJECT_ROOT / "data" / "gen" / "csv"
    gen_csv.mkdir(parents=True, exist_ok=True)
    test_csv = gen_csv / "test_clear.csv"
    test_csv.write_text("a,b\n1,2\n")
    assert test_csv.exists()

    r = client.delete("/api/gen/clear")
    assert r.status_code == 200
    assert not test_csv.exists()


def test_clear_routines_deletes_files():
    gen_func = PROJECT_ROOT / "data" / "gen" / "func"
    gen_func.mkdir(parents=True, exist_ok=True)
    test_sql = gen_func / "test_clear.sql"
    test_sql.write_text("SELECT 1")
    assert test_sql.exists()

    r = client.delete("/api/gen/clear-routines")
    assert r.status_code == 200
    assert not test_sql.exists()


def test_routine_status():
    r = client.get("/api/gen/routine-status")
    assert r.status_code == 200
    data = r.json()
    assert "modelReady" in data
