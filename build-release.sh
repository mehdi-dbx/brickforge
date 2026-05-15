#!/bin/bash
# Build a GitHub Release archive of BrickForge.
# Usage: ./build-release.sh [version]
set -e

VERSION=${1:-"dev"}
OUT="brickforge-${VERSION}"

echo "Building BrickForge release: ${OUT}"

rm -rf "$OUT" "${OUT}.tar.gz"
mkdir -p "$OUT"

# Copy files (exclude bloat)
rsync -a \
  --exclude='.git' \
  --exclude='.venv' \
  --exclude='__pycache__' \
  --exclude='.mypy_cache' \
  --exclude='.DS_Store' \
  --exclude='.claude' \
  --exclude='.env.local' \
  --exclude='.env.*.local' \
  --exclude='*.pyc' \
  --exclude='app/client/node_modules' \
  --exclude='app/server/node_modules' \
  --exclude='app/packages' \
  --exclude='app/client/src' \
  --exclude='app/server/src' \
  --exclude='visual/frontend/node_modules' \
  --exclude='visual/frontend/src' \
  --exclude='edu' \
  --exclude='doc/plan' \
  --exclude='.tmp-*' \
  --exclude='app.yaml.bak' \
  ./ "$OUT/"

# Compress
tar czf "${OUT}.tar.gz" "$OUT"
SIZE=$(du -h "${OUT}.tar.gz" | cut -f1)
FILES=$(find "$OUT" -type f | wc -l | tr -d ' ')
echo "[+] Built: ${OUT}.tar.gz (${SIZE}, ${FILES} files)"

# Cleanup
rm -rf "$OUT"
