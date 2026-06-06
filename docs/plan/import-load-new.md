# Plan: Import .forge.zip -- Load vs New

> Status: IMPLEMENTED (2026-06-05)

## Context

When a user imports a `.forge.zip` bundle, the assets it references may or may not exist on their workspace. Two modes:
- **Load**: assets already exist, just restore the config
- **New**: assets don't exist yet, create them from the bundle contents

## UX: Import Dialog

After the user picks a `.forge.zip` file, a modal appears:

```
┌─────────────────────────────────────────────┐
│  Import project                             │
│                                             │
│  space-hotel.forge.zip                      │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Load project                    (i)│    │
│  │  Import from bundle                 │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  New project                     (i)│    │
│  │  Create from bundle                 │    │
│  └─────────────────────────────────────┘    │
│                                             │
│                                Cancel       │
└─────────────────────────────────────────────┘
```

**(i) tooltips:**
- **Load project**: "Imports the bundle config as-is. Use this when the catalog, tables, functions and other assets referenced in this bundle already exist on your workspace."
- **New project**: "Imports data, prompts and SQL from the bundle but clears workspace connections. You'll walk through setup to connect or create assets on your workspace."

## Backend

`POST /api/projects/import?mode=load|new`

### mode=load
- Config as-is, prompts + gen artifacts extracted
- **Overwrites** existing project with same name

### mode=new
- Sanitizes workspace-specific values (host, token, warehouse, genie IDs, mlflow ID, model token, lakebase)
- Keeps portable content (schema name, app name, functions list, features, prompts, SQL)
- Sets `data.use_gen_data=true` if bundle has csv/init files
- Appends `-2` on name collision

## Files modified

- `brickforge/routes/projects.py` -- CLEAR_ON_NEW_IMPORT dict, mode param
- `visual/frontend/src/App.tsx` -- import modal with Load/New + Info icons
