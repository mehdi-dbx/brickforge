"""BrickForge - Build and deploy Databricks AI agents from a visual Setup App."""
from pathlib import Path

__version__ = "0.1.0a3"

# PACKAGE_ROOT: always the brickforge/ directory itself (where tools/, data/, agent/ live)
PACKAGE_ROOT = Path(__file__).resolve().parent

# PROJECT_ROOT: repo root if running from source, same as PACKAGE_ROOT if pip-installed
_candidate = PACKAGE_ROOT.parent
if (_candidate / "pyproject.toml").exists():
    PROJECT_ROOT = _candidate  # running from repo (editable install or direct)
else:
    PROJECT_ROOT = PACKAGE_ROOT  # pip-installed: brickforge/ is the root
