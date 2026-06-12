# Configuration

All configuration lives in a single `config.json` file. There are no `.env` files anywhere in BrickForge.

## Where config.json lives

| Mode | Location |
|------|----------|
| pip install | `~/.brickforge/config.json` |
| Editable install (`pip install -e .`) | `PROJECT_ROOT/config.json` (repo root) |
| Deployed (Databricks App) | `./config.json` inside the extracted bundle |

## Config providers

BrickForge abstracts config access behind a provider interface:

| Provider | Usage |
|----------|-------|
| `LocalConfigProvider` | Local mode. Reads/writes `config.json` on disk. |
| `ForgeConfigProvider` | Deployed mode. In-memory JSON, flushed to UC Volume as `config.json` in zip. Migrates legacy `config.env` on first read. |

Source: `brickforge/lib/config_provider.py`

## Structured API

```python
# Read
config.get("workspace.host")              # dot-path access
config.get_section("tools.ka")            # get entire section

# Write
config.set("workspace.host", "https://...")
config.set_many({"workspace.host": "...", "workspace.warehouse_id": "..."})

# Toggle multi-instance tools
config.toggle("tools.mcp.weather")        # flip enabled boolean
config.delete_key("tools.api.old-api")    # remove entry
```

!!! warning
    Always use dot-paths: `config.get("workspace.host")`, NOT `config.get("DATABRICKS_HOST")`. The flat env-var names are only used in `flatten()` output.

## flatten()

Converts the structured JSON config into a flat dict of env-var-style key-value pairs:

```python
flat = config.flatten()
# Returns: {"DATABRICKS_HOST": "https://...", "DATABRICKS_WAREHOUSE_ID": "abc123", ...}
```

Used by:

- `build_sub_env()` to inject config into subprocesses
- `start_server.py` to set `os.environ` at agent boot
- Deploy to ship config as a file

Disabled entries (where `enabled: false`) are omitted from `flatten()` output.

## Token security

Tokens never touch disk.

| Mechanism | How it works |
|-----------|-------------|
| `_save()` strips tokens | Deep-copies config data, nulls `workspace.token` and `model.token` before writing to disk. |
| Keyring storage | `lib/token_store.py` provides `KeyringStore` (macOS Keychain), `SecretsStore` (Databricks secrets), `NullStore` (fallback). |
| Startup restore | Tokens restored from keyring on app startup and project switch. |
| GitHub tokens | Also stored in keyring under `github.com` key. |
| Deploy | `config.json` in the bundle has tokens stripped. On DBX Apps, auth uses the app's service principal. |

Source: `brickforge/lib/token_store.py`

## Subprocess environment

`build_sub_env()` in `brickforge/lib/env_utils.py` builds the env dict for all subprocess calls:

1. Calls `config.flatten()` to get flat env vars
2. Sets `PYTHONPATH` to `PACKAGE_ROOT`
3. Sets `CONFIG_FILE` to the absolute path of `config.json`
4. Sets `PYTHONUNBUFFERED=1`
5. Clears `DATABRICKS_CONFIG_FILE` (prevents CLI profile interference)
6. Resolves auth conflicts: removes SP OAuth vars when PAT is present

Subprocess scripts that need to write back to config use `lib/config_json.py`:

```python
from lib.config_json import read_config, write_config

cfg = read_config()                         # reads CONFIG_FILE env var
cfg["tools"]["genie_spaces"].append(new_id)
write_config(cfg)                           # writes back to CONFIG_FILE
```

## _sync_env()

Called on every config change and project switch:

1. Clears ALL known config keys from `os.environ`
2. Calls `flatten()` on current config
3. Sets all flattened values in `os.environ`

This prevents env var leaking between project switches.

## Dual-root path system

```python
PACKAGE_ROOT = Path(__file__).resolve().parent              # always brickforge/
PROJECT_ROOT = parent if pyproject.toml exists else PACKAGE_ROOT
USER_DIR     = Path.home() / ".brickforge"                  # logs, config, stash cache
LOG_FILE     = USER_DIR / "brickforge_YYYYMMDD_HHMMSS.log"
```

- **Editable install**: `PROJECT_ROOT` = repo root, config at `PROJECT_ROOT/config.json`
- **Pip install**: `PROJECT_ROOT` = `PACKAGE_ROOT` = `site-packages/brickforge/`, config at `~/.brickforge/config.json`

## Runtime directories

| Path | Purpose |
|------|---------|
| `~/.brickforge/` | Runtime dir: logs, config, stash cache |
| `~/.brickforge/config.json` | User config (pip install mode) |
| `~/.brickforge/brickforge_*.log` | Session log files |
