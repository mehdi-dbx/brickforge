# Pack Node Modules

Prune, strip, and tar.gz the Setup App's `visual/backend/node_modules/` for deployment.

Run this after any `npm install` in `visual/backend/`, or before deploying to Databricks Apps.

## What it does

1. `npm install --omit=dev` - install production deps only (drops nodemon etc.)
2. Strip docs, tests, .github dirs, fsevents, source maps, TypeScript declarations
3. Create `node_modules.tar.gz` (669KB, 1 file instead of 473)

## Usage

```bash
cd visual/backend && bash pack-modules.sh
```

## When to run

- After adding/removing a dependency in `visual/backend/package.json`
- Before syncing to Databricks workspace for deployment
- After `npm install` accidentally restores devDependencies

## Output

`visual/backend/node_modules.tar.gz` - ready for workspace upload. The `app.yaml` startup command untars it at boot.
