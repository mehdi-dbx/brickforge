# Projects

BrickForge supports multiple projects per workspace. Each project is a separate agent with its own config, data, prompts, and tools.

## Project structure

```
projects/
  .current              # Text file containing active project name
  my-project.json       # Project config (same format as config.json)
  my-project/           # Project-scoped artifacts
    prompt/             # System prompt + knowledge base
    gen/                # Generated data (CSVs, SQL, manifests)
    conf/               # KA configs
  another-project.json
  another-project/
    prompt/
    gen/
    conf/
```

## Operations

### Create

`POST /api/projects` with `{ "name": "my-project" }`

- Creates a fresh config from `DEFAULT_CONFIG` (not a snapshot of current state)
- Creates the artifact directory structure
- Switches to the new project immediately

### Load / switch

`POST /api/projects/{name}/load`

- **Full replace** - the entire config is swapped, not merged
- Mirror is switched **before** save to prevent overwriting the old project
- `_sync_env()` clears ALL known config keys from `os.environ` then re-sets from new project
- Frontend does `window.location.reload()` for a clean slate

!!! note
    The switch order is critical: switch mirror first, then replace config data, then save, then sync env. This prevents the old project from being overwritten with new project defaults.

### Delete

`DELETE /api/projects/{name}`

Removes the config JSON and artifact directory. Cannot delete the active project.

### Rename

`POST /api/projects/{name}/rename` with `{ "new_name": "..." }`

Renames config file and artifact directory. Updates `.current` if this is the active project.

### List

`GET /api/projects`

Returns all projects with their names and active status.

## Export (.forge bundles)

Export packages your entire project as a `.forge.zip` bundle:

- `config.json` (tokens stripped)
- `prompt/` directory (system prompt + knowledge base)
- `gen/` directory (generated data, SQL, manifests)
- `conf/` directory (KA configs)

The bundle is a portable, self-contained snapshot of your agent project.

## Import (.forge bundles)

Import supports two modes:

### Load mode (same workspace)

Replaces the current project's config and artifacts with the bundle contents. Use when loading a bundle you previously exported from the same workspace.

### New mode (different workspace)

Creates a new project from the bundle. Clears workspace-specific values (host, token, warehouse) so you can reconnect to a different workspace. Use when loading a bundle from a colleague or deploying to production.

## Project-scoped artifacts

All generated artifacts are scoped to the active project:

| Artifact | Path | Purpose |
|----------|------|---------|
| System prompt | `projects/{name}/prompt/main.prompt` | Agent behavior instructions |
| Knowledge base | `projects/{name}/prompt/knowledge.base` | Domain facts |
| Generated CSVs | `projects/{name}/gen/csv/` | Synthetic data |
| Generated DDL | `projects/{name}/gen/init/` | Table creation SQL |
| Generated functions | `projects/{name}/gen/func/` | UC function SQL |
| Table manifest | `projects/{name}/gen/manifest.json` | Tracks generated tables |
| Routine manifest | `projects/{name}/gen/routine_manifest.json` | Tracks generated routines |
| Wizard state | `projects/{name}/gen/wizard-state.json` | Data wizard progress |

!!! warning
    There is no fallback to shared directories when `PROJECT_DIR` is set. The project directory is the only source. This prevents cross-contamination between projects.

## UC Volume sync

Projects can be saved to and loaded from UC Volumes for remote backup:

- **Save**: uploads the `.forge.zip` bundle to a UC Volume path
- **Load**: downloads and imports the bundle from a UC Volume

Config: `env_store.catalog_volume_path` in `config.json`.

## First launch

On first launch with an empty project list, BrickForge auto-creates a `my-project` project and sets it as active.
