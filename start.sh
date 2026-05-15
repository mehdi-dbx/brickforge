#!/bin/bash
# BrickForge Setup App -- local launcher
set -e

echo "BrickForge Setup App"
echo "===================="

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "[x] Node.js not found. Install from https://nodejs.org/"
  exit 1
fi
echo "[+] Node.js $(node --version)"

# Check Python
PYTHON=""
for cmd in python3 python; do
  if command -v "$cmd" &>/dev/null; then
    PYTHON="$cmd"
    break
  fi
done
if [ -z "$PYTHON" ]; then
  echo "[x] Python 3.11+ not found. Install from https://python.org/"
  exit 1
fi
echo "[+] Python $($PYTHON --version 2>&1 | cut -d' ' -f2)"

# Install Python deps (first run only, or if pyproject.toml changed)
if command -v uv &>/dev/null; then
  echo "[~] Installing Python deps (uv sync)..."
  uv sync --quiet
  echo "[+] Python deps ready"
elif [ ! -f ".deps_installed" ] || [ "pyproject.toml" -nt ".deps_installed" ]; then
  echo "[~] Installing Python deps (pip)..."
  $PYTHON -m pip install -r requirements.txt --quiet
  touch .deps_installed
  echo "[+] Python deps ready"
fi

# Start
echo ""
echo "[+] Starting BrickForge at http://localhost:9000"
echo ""
node visual/backend/index.js
