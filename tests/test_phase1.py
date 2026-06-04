"""Phase 1: Skeleton + Static Serving tests."""
import pytest
from fastapi.testclient import TestClient
from brickforge.server import app


client = TestClient(app)


def test_health_returns_ok():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_static_serves_index_html():
    r = client.get("/")
    assert r.status_code == 200
    assert "<html" in r.text.lower() or "<!doctype" in r.text.lower()


def test_api_route_not_swallowed():
    """API routes should return API responses, not index.html."""
    r = client.get("/api/env")
    assert r.status_code == 200
    # Should be JSON, not HTML
    assert "<html" not in r.text.lower()


def test_spa_fallback_unknown_path():
    r = client.get("/some/random/path")
    assert r.status_code == 200
    assert "<html" in r.text.lower() or "<!doctype" in r.text.lower()
