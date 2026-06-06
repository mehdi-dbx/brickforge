# Plan: Build Assets

> Status: PARTIALLY IMPLEMENTED (2026-06-06)
> Backend exec-build done. Frontend Assets tab done. Renamed from "Stash" to "Assets".
> Pending: end-to-end test with real workspace provisioning.

## Context

User has SQL files, CSVs, prompts on disk (from import or data gen). They need to provision everything on their workspace in one click instead of walking 5+ setup blocks.

## What it does

Assets tab shows current project's files. Build button provisions all assets sequentially:

```
1. Schema     -> create catalog + schema
2. Tables     -> CREATE OR REPLACE from SQL + load CSVs
3. Functions  -> CREATE OR REPLACE from SQL files
4. Procedures -> CREATE OR REPLACE from SQL files
5. Genie      -> create space (skip if configured)
6. MLflow     -> create experiment (skip if configured)
```

Vertical stepper + terminal output in a modal.

## Prerequisites

Build button disabled unless host + warehouse + schema all configured.

## Backend

`exec-build` action in `brickforge/routes/setup.py`:
- Prereq guard (host, token, warehouse, schema)
- Stash dir as parameter (not saved to config)
- Chains existing scripts: create_catalog_schema.py, _tables_script(), csv_to_delta.py, create_all_functions.py, create_all_procedures.py, create_genie_space.py, create_mlflow_experiment.py
- SSE streaming with text markers for stepper advancement

## Frontend

`visual/frontend/src/components/StashHealthView.tsx` (renamed from stash to assets):
- Fetches `/api/assets` -- lists prompts, table SQL, CSVs, functions, procedures, demo data, manifests
- Build button + modal with ProgressStepper + SSE terminal
- Fetches `/api/setup/status` for connection check

Tab renamed from "Stash" to "Assets" in App.tsx.

## Unravel gaps found

1. FORGE_STASH_DIR pollution -- pass as param, not config (done)
2. CSV loading missing in _tables_script -- use csv_to_delta.py as separate step (done)
3. Post-build config stale -- page reload after build (done)
4. Post-build navigation -- message "Switch to Setup" (done)
5. Schema prerequisite -- button disabled with hint (done)
6. create_all_functions.py was reading dead data/default/func -- fixed to read demo + gen (done)
7. create_all_procedures.py same fix (done)

## Files modified

- `brickforge/routes/setup.py` -- exec-build action
- `brickforge/server.py` -- /api/assets endpoint (replaced /api/stash/health)
- `visual/frontend/src/components/StashHealthView.tsx` -- full rewrite as Assets view
- `visual/frontend/src/App.tsx` -- tab renamed to "Assets"
