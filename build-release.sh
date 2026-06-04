#!/bin/bash
# Build a GitHub Release archive of BrickForge.
# Usage: ./build-release.sh [version]
set -e

VERSION=${1:-"dev"}
OUT="brickforge-${VERSION}"

echo "Building BrickForge release: ${OUT}"

rm -rf "$OUT" "${OUT}.tar.gz"
mkdir -p "$OUT"

# INCLUDE-ONLY approach -- only copy what we need
DIRS=(
  visual/backend
  visual/frontend/dist
  agent
  brickforge/app/client/dist
  brickforge/app/server/dist
  tools
  data/default
  data/init
  data/gen
  data/py
  conf
  eval
  scripts
  deploy
  stash
)

for d in "${DIRS[@]}"; do
  if [ -d "$d" ]; then
    mkdir -p "$OUT/$d"
    rsync -a \
      --exclude='__pycache__' --exclude='.mypy_cache' \
      --exclude='.DS_Store' --exclude='*.pyc' \
      "$d/" "$OUT/$d/"
  fi
done

# Individual files
for f in pyproject.toml requirements.txt setup-app.yaml databricks.yml README.md start.sh .gitignore .databricksignore uv.lock; do
  [ -f "$f" ] && cp "$f" "$OUT/"
done

# Compress
tar czf "${OUT}.tar.gz" "$OUT"
SIZE=$(du -h "${OUT}.tar.gz" | cut -f1)
FILES=$(find "$OUT" -type f | wc -l | tr -d ' ')
echo "[+] Built: ${OUT}.tar.gz (${SIZE}, ${FILES} files)"

# Cleanup
rm -rf "$OUT"
