"""Phase 4: Bridge Auth tests."""
import json
import subprocess

from fastapi.testclient import TestClient
from brickforge.server import app

client = TestClient(app)


def _encrypt(plaintext: str, nonce: str) -> str:
    """Encrypt using openssl (same as bridge script)."""
    result = subprocess.run(
        ["openssl", "enc", "-aes-256-cbc", "-a", "-A", "-pass", f"pass:{nonce}", "-pbkdf2"],
        input=plaintext.encode(), capture_output=True, timeout=5,
    )
    return result.stdout.decode().strip()


# ── Nonce ─────────────────────────────────────────────────────────────────────

def test_nonce_generates_unique():
    r1 = client.get("/api/auth/bridge-nonce")
    r2 = client.get("/api/auth/bridge-nonce")
    assert r1.json()["nonce_id"] != r2.json()["nonce_id"]
    assert r1.json()["nonce"] != r2.json()["nonce"]


def test_nonce_returns_ws_default():
    r = client.get("/api/auth/bridge-nonce")
    data = r.json()
    assert "ws_default" in data


def test_nonce_expires():
    """Manually expire a nonce and verify rejection."""
    from brickforge.routes.auth import _bridge_nonces
    r = client.get("/api/auth/bridge-nonce")
    nonce_id = r.json()["nonce_id"]
    # Force expire
    _bridge_nonces[nonce_id]["expires"] = 0
    # Try to receive with expired nonce
    r = client.post("/api/auth/bridge-receive", json={
        "ciphertext": "fake", "nonce_id": nonce_id, "host": "", "user": "",
    })
    assert r.status_code == 403


# ── Receive ───────────────────────────────────────────────────────────────────

def test_receive_decrypts_pat():
    # Get nonce
    r = client.get("/api/auth/bridge-nonce")
    nonce_id = r.json()["nonce_id"]
    nonce_val = r.json()["nonce"]

    # Encrypt a PAT bundle
    bundle = json.dumps({"pat": "dapi_test_pat_1234567890"})
    ct = _encrypt(bundle, nonce_val)

    # Receive
    r = client.post("/api/auth/bridge-receive", json={
        "ciphertext": ct, "nonce_id": nonce_id,
        "host": "https://test.cloud.databricks.com", "user": "test@test.com",
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_receive_decrypts_jwt_bundle():
    r = client.get("/api/auth/bridge-nonce")
    nonce_id = r.json()["nonce_id"]
    nonce_val = r.json()["nonce"]

    bundle = json.dumps({
        "access_token": "eyJfake_jwt_token",
        "refresh_token": "doau_fake_refresh",
        "token_endpoint": "https://test.cloud.databricks.com/oidc/v1/token",
    })
    ct = _encrypt(bundle, nonce_val)

    r = client.post("/api/auth/bridge-receive", json={
        "ciphertext": ct, "nonce_id": nonce_id,
        "host": "https://test.cloud.databricks.com", "user": "test@test.com",
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_receive_single_use_nonce():
    r = client.get("/api/auth/bridge-nonce")
    nonce_id = r.json()["nonce_id"]
    nonce_val = r.json()["nonce"]

    ct = _encrypt(json.dumps({"pat": "dapi_test"}), nonce_val)

    # First use
    r = client.post("/api/auth/bridge-receive", json={
        "ciphertext": ct, "nonce_id": nonce_id, "host": "", "user": "",
    })
    assert r.status_code == 200

    # Second use -- should fail
    r = client.post("/api/auth/bridge-receive", json={
        "ciphertext": ct, "nonce_id": nonce_id, "host": "", "user": "",
    })
    assert r.status_code == 403


def test_receive_cross_cloud_warning():
    """AWS app + Azure host -> warning."""
    import os
    old = os.environ.get("DATABRICKS_HOST", "")
    os.environ["DATABRICKS_HOST"] = "https://fevm.cloud.databricks.com"  # AWS

    r = client.get("/api/auth/bridge-nonce")
    nonce_id = r.json()["nonce_id"]
    nonce_val = r.json()["nonce"]
    ct = _encrypt(json.dumps({"pat": "dapi_test"}), nonce_val)

    r = client.post("/api/auth/bridge-receive", json={
        "ciphertext": ct, "nonce_id": nonce_id,
        "host": "https://adb-123.azuredatabricks.net", "user": "test",
    })
    assert r.status_code == 200
    assert r.json().get("warning") and "different cloud" in r.json()["warning"].lower()

    os.environ["DATABRICKS_HOST"] = old or ""


def test_receive_same_cloud_no_warning():
    import os
    old = os.environ.get("DATABRICKS_HOST", "")
    os.environ["DATABRICKS_HOST"] = "https://fevm.cloud.databricks.com"

    r = client.get("/api/auth/bridge-nonce")
    nonce_id = r.json()["nonce_id"]
    nonce_val = r.json()["nonce"]
    ct = _encrypt(json.dumps({"pat": "dapi_test"}), nonce_val)

    r = client.post("/api/auth/bridge-receive", json={
        "ciphertext": ct, "nonce_id": nonce_id,
        "host": "https://e2-demo.cloud.databricks.com", "user": "test",
    })
    assert r.status_code == 200
    assert not r.json().get("warning")

    os.environ["DATABRICKS_HOST"] = old or ""


# ── Status ────────────────────────────────────────────────────────────────────

def test_status_waiting_initially():
    from brickforge.routes.auth import _bridge_state
    # Reset state
    _bridge_state.clear()
    _bridge_state["status"] = "waiting"
    r = client.get("/api/auth/bridge-status")
    assert r.json()["status"] == "waiting"


def test_status_connected_after_receive():
    r = client.get("/api/auth/bridge-nonce")
    nonce_id = r.json()["nonce_id"]
    nonce_val = r.json()["nonce"]
    ct = _encrypt(json.dumps({"pat": "dapi_connected_test"}), nonce_val)

    client.post("/api/auth/bridge-receive", json={
        "ciphertext": ct, "nonce_id": nonce_id,
        "host": "https://test.cloud.databricks.com", "user": "user@test.com",
    })
    r = client.get("/api/auth/bridge-status")
    assert r.json()["status"] == "connected"
    assert r.json()["host"] == "https://test.cloud.databricks.com"


# ── Script ────────────────────────────────────────────────────────────────────

def test_script_injects_variables():
    r = client.get("/api/auth/bridge-nonce")
    nonce_id = r.json()["nonce_id"]
    r = client.get(f"/api/auth/bridge-script?nonce={nonce_id}")
    assert r.status_code == 200
    assert "APP_URL=" in r.text
    assert "NONCE=" in r.text


def test_script_sets_content_disposition():
    r = client.get("/api/auth/bridge-nonce")
    nonce_id = r.json()["nonce_id"]
    r = client.get(f"/api/auth/bridge-script?nonce={nonce_id}")
    assert "brickforge-connect.command" in r.headers.get("content-disposition", "")
