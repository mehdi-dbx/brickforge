#!/bin/bash
# Prune, strip, and tar.gz node_modules for deployment.
# Run from visual/backend/ after any npm install.
set -e
cd "$(dirname "$0")"

echo "[1/4] npm install (production only)..."
npm install --omit=dev --quiet

echo "[2/4] stripping docs, tests, .github, fsevents, source maps..."
find node_modules -type f \( -name '*.md' -o -name '*.ts' -o -name '.npmignore' \
  -o -name '.eslintrc*' -o -name '.travis.yml' -o -name 'Makefile' -o -name '*.map' \) -delete
find node_modules -type d \( -name test -o -name tests -o -name .github \) -exec rm -rf {} + 2>/dev/null
rm -rf node_modules/fsevents 2>/dev/null

echo "[3/4] tar.gz..."
rm -f node_modules.tar.gz
tar czf node_modules.tar.gz node_modules/

SIZE=$(du -sh node_modules/ | cut -f1)
FILES=$(find node_modules -type f | wc -l | tr -d ' ')
TGZSIZE=$(ls -lh node_modules.tar.gz | awk '{print $5}')
echo "[4/4] done: ${SIZE} / ${FILES} files -> ${TGZSIZE} tar.gz"
