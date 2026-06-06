# Plan: Project-Scoped Artifacts

> Status: APPROVED (2026-06-04), NOT IMPLEMENTED
> Reconstructed from session recap -- original plan was overwritten

## Context

Every project-specific artifact (prompts, generated SQL, CSVs, manifests) is stored in shared package-level directories. Creating a new project resets config.json but leaves all files on disk from the previous project. Result: a "fresh" space hotel project responds as "Schneider Electric catalog assistant" because `conf/prompt/main.prompt` was never cleaned.

This is the recurring root cause behind: stale prompts, wrong tables, leaked functions, ghost data across project switches.

## Root Cause

7 artifact types are package-level but should be project-scoped:

| Artifact | Current path | Writers |
|----------|-------------|---------|
| Prompts | `conf/prompt/` | gen.py prompt-save, generate_prompts.py |
| Generated CSVs | `data/gen/csv/` | generate_tables.py writer |
| Generated table SQL | `data/gen/init/` | generate_tables.py writer |
| Generated func SQL | `data/gen/func/` | generate_routines.py routine_writer |
| Generated proc SQL | `data/gen/proc/` | generate_routines.py routine_writer |
| Table manifest | `data/gen/manifest.json` | writer.py |
| Routine manifest | `data/gen/routine_manifest.json` | routine_writer.py |

The stash system (`FORGE_STASH_DIR`) already solves this for pre-built templates. But generated artifacts don't use it.

## Solution

Each project gets its own workspace directory. Generated artifacts write there, not to shared package paths. Project switch = point to a different workspace dir.

### Directory structure

```
projects/
  fevm.json              # config
  fevm/                   # artifacts
    prompt/
      main.prompt
      knowledge.base
      user.prompt
    gen/
      csv/*.csv
      init/create_*.sql
      func/*.sql
      proc/*.sql
      manifest.json
      routine_manifest.json
  aws.json
  aws/
    prompt/
    gen/
```

### Implementation

1. **Add `project_dir` to config provider** -- `PROJECTS_DIR / name /` as artifact root
2. **Add API endpoint** -- `GET /api/project-dir` returns the project artifact directory path
3. **Update writers (4 files)** -- writer.py, routine_writer.py, generate_prompts.py use project dir
4. **Update readers (3 files)** -- gen.py, setup.py read from project dir
5. **Update `build_sub_env`** -- inject `PROJECT_DIR` into subprocess env
6. **Update `create_project`** -- create `projects/{name}/` directory
7. **Update `load_project`** -- point `PROJECT_DIR` env var at new dir
8. **Update prompt reader in agent** -- `_load_system_prompt()` reads from `PROJECT_DIR / "prompt"` if set

### Files to modify

- `brickforge/lib/config_provider.py` -- project_dir property
- `brickforge/lib/env_utils.py` -- inject PROJECT_DIR in build_sub_env
- `brickforge/routes/projects.py` -- create/delete/rename artifact dirs
- `brickforge/routes/gen.py` -- read from project dir
- `brickforge/routes/setup.py` -- prompt status from project dir
- `brickforge/data/gen/writer.py` -- write to project dir
- `brickforge/data/gen/routine_writer.py` -- write to project dir
- `brickforge/data/gen/generate_prompts.py` -- write to project dir
- `brickforge/agent/agent.py` -- read prompt from project dir

### What does NOT change

- Stash system (already project-scoped via FORGE_STASH_DIR)
- Demo data (`data/demo/`) -- package-level template, read-only
- Config.json / project JSON files -- already project-scoped

### Verification

1. Create project A, generate tables + prompts for "airline"
2. Create project B, generate tables + prompts for "space hotel"
3. Switch to A: prompt says airline, tables are airline tables
4. Switch to B: prompt says space hotel, tables are space hotel tables
5. Create project C (fresh): no prompts, no tables, no functions -- completely clean
