"""Phase 8: Package & CLI tests."""
from pathlib import Path

from brickforge import PROJECT_ROOT, __version__


def test_project_root_resolves():
    assert PROJECT_ROOT.exists()
    assert (PROJECT_ROOT / "pyproject.toml").exists()


def test_static_files_found():
    dist = PROJECT_ROOT / "visual" / "frontend" / "dist" / "index.html"
    assert dist.exists()


def test_version_set():
    assert __version__ == "0.1.0a1"


def test_cli_importable():
    from brickforge.cli import main
    assert callable(main)


def test_server_importable():
    from brickforge.server import app
    assert app is not None
