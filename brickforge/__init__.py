"""BrickForge - Build and deploy Databricks AI agents from a visual Setup App."""
from pathlib import Path

__version__ = "0.1.0a1"

# PROJECT_ROOT: repo root if running from source, package dir if pip-installed
_candidate = Path(__file__).resolve().parent.parent
if (_candidate / "pyproject.toml").exists():
    PROJECT_ROOT = _candidate  # running from repo (editable install or direct)
else:
    PROJECT_ROOT = Path(__file__).resolve().parent  # pip-installed: brickforge/ is the root
