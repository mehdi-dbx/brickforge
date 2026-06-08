# Plan: Build from Stash

## Context

User has a stash (pre-built template like airops) or an imported `.forge.zip` bundle. SQL files, CSVs, prompts are on disk. They need to provision everything on their workspace: catalog, schema, tables with data, functions, procedures, genie space, MLflow experiment. Today they must click 5+ setup blocks individually. Build does it in one click.

## User journey

### From Stash tab

1. User opens Stash tab. Sees airops stash with health check.
2. Sees "Build" button. If host/warehouse/schema not set, button is disabled: "Connect workspace and set schema in Setup first."
3. User has already connected workspace + set warehouse + set schema.
4. Clicks Build. Modal appears with vertical stepper + terminal.
5. Steps run sequentially: Schema, Tables, Functions, Procedures, Genie, MLflow.
6. Each step streams output. Stepper advances by text matching on SSE lines.
7. Build completes. Message: "All assets provisioned. Switch to Setup to configure model and deploy."
8. Page reloads (so config picks up genie ID + mlflow ID written by subprocesses).
9. User goes to Setup tab. Schema/tables/functions/genie/mlflow blocks all green.

### From imported bundle (New project)

1. User imported bundle with "New project". Page reloaded. Host red, everything disabled.
2. User connects workspace, picks warehouse, sets schema in Setup DAG.
3. User goes to Stash tab. The imported gen data shows as buildable.
4. Clicks Build. Same stepper flow as above.
5. OR: user walks Setup blocks individually -- they already work because import set `USE_GEN_DATA=true` and the scripts read from `data/gen/`.

Build is a convenience (one click vs five blocks). Individual blocks still work as fallback.

## Backend: exec-build action

**File:** `brickforge/routes/setup.py`

### Prerequisites guard

```python
if action == "exec-build":
    host = config.get("workspace.host") or ""
    token = config.get("workspace.token") or ""
    wh = config.get("workspace.warehouse_id") or ""
    schema_spec = config.get("workspace.unity_catalog_schema") or ""
    if not host or not token:
        yield sse_line("[x] Connect a workspace first\n", "err")
        yield sse_done(False, 1); return
    if not wh:
        yield sse_line("[x] Select a SQL warehouse first\n", "err")
        yield sse_done(False, 1); return
    if not schema_spec or "." not in schema_spec:
        yield sse_line("[x] Set a Unity Catalog schema first\n", "err")
        yield sse_done(False, 1); return
```

### Stash dir as parameter, not config

Stash dir passed in `params`, injected into subprocess env only. Never saved to config. If build is cancelled or fails, config is unchanged.

```python
    stash_dir = params.get("stash_dir", "")
    if stash_dir:
        sub_env["FORGE_STASH_DIR"] = stash_dir
```

### Steps

```python
    # 1. Schema
    yield sse_line("[~] Schema -- creating catalog and schema...\n")
    cmd = [PYTHON, "data/init/create_catalog_schema.py"]
    async for event in stream_subprocess(cmd, env=sub_env, cwd=PACKAGE_ROOT):
        yield event

    # 2. Tables (CREATE TABLE SQL)
    yield sse_line("[~] Tables -- provisioning tables...\n")
    cmd = [PYTHON, "-c", _tables_script()]
    async for event in stream_subprocess(cmd, env=sub_env, cwd=PACKAGE_ROOT):
        yield event

    # 2b. Load CSV data into tables
    yield sse_line("[~] Tables -- loading CSV data...\n")
    cmd = [PYTHON, str(PACKAGE_ROOT / "data" / "py" / "csv_to_delta.py")]
    async for event in stream_subprocess(cmd, env=sub_env, cwd=PACKAGE_ROOT):
        yield event

    # 3. Functions
    yield sse_line("[~] Functions -- creating UC functions...\n")
    cmd = [PYTHON, str(PACKAGE_ROOT / "data" / "init" / "create_all_functions.py")]
    async for event in stream_subprocess(cmd, env=sub_env, cwd=PACKAGE_ROOT):
        yield event

    # 4. Procedures
    yield sse_line("[~] Procedures -- creating UC procedures...\n")
    cmd = [PYTHON, str(PACKAGE_ROOT / "data" / "init" / "create_all_procedures.py")]
    async for event in stream_subprocess(cmd, env=sub_env, cwd=PACKAGE_ROOT):
        yield event

    # 5. Genie
    genie_ids = (config.get("PROJECT_GENIE_SPACES") or "").strip()
    if not genie_ids:
        yield sse_line("[~] Genie -- creating space...\n")
        genie_name = config.get("GENIE_ROOM_NAME") or "Project Data"
        sub_env["GENIE_ROOM_NAME"] = genie_name
        cmd = [PYTHON, "data/init/create_genie_space.py"]
        async for event in stream_subprocess(cmd, env=sub_env, cwd=PACKAGE_ROOT):
            yield event
    else:
        yield sse_line("[+] Genie -- already configured, skipping\n")

    # 6. MLflow
    mlflow_id = (config.get("app.mlflow_experiment_id") or "").strip()
    if not mlflow_id:
        yield sse_line("[~] MLflow -- creating experiment...\n")
        cmd = [PYTHON, str(PACKAGE_ROOT / "data" / "init" / "create_mlflow_experiment.py")]
        async for event in stream_subprocess(cmd, env=sub_env, cwd=PACKAGE_ROOT):
            yield event
    else:
        yield sse_line("[+] MLflow -- already configured, skipping\n")

    yield sse_line("\n[+] Build complete. Switch to Setup to configure model and deploy.\n")
    yield sse_done(True)
```

### _build_tables_script()

New inline script that combines `_tables_script` (CREATE TABLE) + CSV loading. For each SQL file, runs `run_sql.py`, then checks for a matching CSV and runs `csv_to_delta.py`:

```python
# Find SQL files from active sources (stash/demo/gen)
# For each: run CREATE TABLE, then load matching CSV if exists
for sf in sql_files:
    subprocess.run([sys.executable, 'data/py/run_sql.py', rel])
    csv_name = sf.stem.replace('create_', '') + '.csv'
    for csv_dir in csv_dirs:
        csv_path = csv_dir / csv_name
        if csv_path.exists():
            subprocess.run([sys.executable, 'data/py/csv_to_delta.py', str(csv_path)])
            break
```

CSV dirs searched: stash csv dir, `data/demo/csv/`, `data/gen/csv/` (same active sources pattern).

## Frontend

### StashHealthView: Build button

**File:** `visual/frontend/src/components/StashHealthView.tsx`

**Props from App.tsx:** `connected: boolean` (host + warehouse + schema all set).

**Build button per stash:**
- Disabled if `!connected`, tooltip: "Connect workspace and set schema in Setup first"
- Enabled: clicking opens build modal

**Build modal:**
- ProgressStepper inlined (20 lines, not exported from SetupDrawer)
- SSE fetch inlined (~30 lines, same pattern as SetupDrawer -- GenTerminal can't be reused because it doesn't expose per-line callbacks for stepper advancement)
- Stage map: `[schema, tables, functions, procedures, genie, mlflow]`
- Text matching advances stages (line contains "schema" -> stage 1, etc.)
- On SSE done=true -> `window.location.reload()` (picks up genie/mlflow IDs written by subprocesses)
- On SSE done=false -> show error, allow retry

**Build trigger:**
```typescript
fetch('/api/setup/exec', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'exec-build',
    params: { stash_dir: `stash/${stash.name}` }
  })
})
```

No save-manual call. Stash dir is a parameter, not persisted.

### App.tsx changes

Pass connection status to StashHealthView:
```tsx
<StashHealthView connected={
  effectiveStates.host?.status === 'done' &&
  effectiveStates.warehouse?.status === 'done' &&
  effectiveStates.schema?.status === 'done'
} />
```

## Files to modify

| File | Change |
|------|--------|
| `brickforge/routes/setup.py` | Add `exec-build` action (chains existing scripts, no new inline script) |
| `visual/frontend/src/components/StashHealthView.tsx` | Add Build button + modal with ProgressStepper + GenTerminal |
| `visual/frontend/src/App.tsx` | Pass `connected` prop to StashHealthView |

## What does NOT change

- Existing setup blocks (still work individually)
- ProgressStepper component in SetupDrawer (untouched, inlined copy in StashHealthView)
- GenTerminal component (untouched, not used by Build -- SSE fetch is inline)
- create_all_assets.py (not used -- we call scripts individually for step control)
- Import endpoint (already done)
- Export endpoint (already done)

## Verification

1. Connect workspace + warehouse + schema
2. Stash tab: Build button enabled on airops
3. Click Build -> 6 steps run -> all green
4. Setup tab: schema/tables/functions/genie/mlflow blocks green
5. Click Build again -> tables recreated (idempotent), genie + mlflow skipped
6. Without workspace connected -> Build disabled with hint
7. Import bundle with New -> connect -> Stash tab -> Build -> assets provisioned
