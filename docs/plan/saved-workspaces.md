# Plan: Saved Workspaces

## What

"Pick from saved workspaces" choice in host drawer. Tokens in OS keychain, never on disk.

## Storage

- `~/.brickforge/.workspaces` -- JSON array of `{host, label, last_used}`. No tokens. Metadata only.
- Tokens stored via `TokenStore` abstraction -- two backends:

```python
class TokenStore:
    def get(host) -> str | None
    def set(host, token)
    def delete(host)

class KeyringStore(TokenStore):    # local mode -- OS keychain via keyring lib
class SecretsStore(TokenStore):    # Databricks Apps mode -- workspace secrets scope
```

- Backend selected at startup: `DATABRICKS_APP_PORT` set -> SecretsStore, else -> KeyringStore
- KeyringStore unavailable (headless Linux): workspace shows in list, user must re-auth
- SecretsStore uses app SP credentials to read/write `brickforge` secret scope in host workspace

## Critical design: token in memory, not on disk

Token stays in `_data` (in-memory config) for `_sync_env()` and `flatten()` to work. But `_save()` strips it before writing to disk:

```python
def _save(self):
    data_copy = copy.deepcopy(self._data)
    # Strip secrets before writing to disk
    if "workspace" in data_copy:
        data_copy["workspace"].pop("token", None)
    payload = json.dumps(data_copy, indent=2) + "\n"
    self._config_file.write_text(payload)
```

This means:
- `_sync_env()` still pushes token to os.environ (reads from `_data`)
- `flatten()` still emits DATABRICKS_TOKEN (reads from `_data`)
- `build_sub_env()` still passes token to subprocesses
- config.json on disk never has the token
- Export bundles never have the token (free security fix)
- Old config.json files with tokens still load fine (graceful migration)

## Critical gap: project switch token restore

When switching projects, `_sync_env()` clears all keys and re-sets from config data. If new project points to a different workspace, need to restore that workspace's token from keyring:

```python
# In load_project, after _sync_env():
host = config.get("workspace.host")
if host:
    token = token_store.get(host)
    if token:
        os.environ["DATABRICKS_TOKEN"] = token
        config._data.setdefault("workspace", {})["token"] = token
```

## Implementation order

### 1. Create TokenStore abstraction + two backends
`brickforge/lib/token_store.py`:
- `TokenStore` base class with `get/set/delete`
- `KeyringStore` -- wraps `keyring` lib (local mode)
- `SecretsStore` -- wraps `w.secrets.put_secret/get_secret` in `brickforge` scope (Databricks Apps mode)
- Factory: `get_token_store()` returns the right backend based on environment
- Install `keyring` dependency, test locally

### 2. GET /api/workspaces
Read `.workspaces` file, return list. Empty array if file doesn't exist.

### 3. Modify `_save()` to strip token from disk
Deep-copy `_data`, delete `workspace.token`, write the clean copy. Token stays in memory.

### 4. On successful connection: token_store + .workspaces
Two hook points:
- `routes/auth.py` `bridge_receive` -- token arrives after OAuth
- `routes/setup.py` `save-workspace` -- manual host + token entry

Change to:
- `config.set_many({"DATABRICKS_HOST": host, "DATABRICKS_TOKEN": token})` -- token goes to `_data` + `os.environ` via `_sync_env()`, but `_save()` strips it from disk
- `token_store.set(host, token)` -- persists in keyring/secrets
- Append `{host, label, last_used}` to `.workspaces`

### 5. On startup: restore token from token_store
In `server.py` lifespan, BEFORE any `_sync_env()`:
- `token_store = get_token_store()`
- Read `workspace.host` from config
- `token = token_store.get(host)`
- If token: inject into `config._data["workspace"]["token"]` + `os.environ`
- If None: user must re-auth

### 6. On project switch: restore token for new workspace
In `load_project`, after `_sync_env()`:
- Read new host from config
- `token = token_store.get(host)`
- If token: inject into `_data` + `os.environ`

### 7. Frontend: "Pick from saved workspaces" choice
- `setupSteps.ts`: add choice to host block
- `SetupDrawer.tsx`: fetch `GET /api/workspaces`, show list
- User clicks a workspace -> token_store.get(host) on backend, inject to memory, return success
- Save icon next to workspace URL -> `POST /api/workspaces`

### 8. POST /api/workspaces/save
Explicit save from UI. Writes current host + token to token_store + `.workspaces`.

### 9. SecretsStore grant
`deploy/grant/run_all_grants.py`: add WRITE permission on `brickforge` secret scope for app SP (currently only READ).

## Files

- `pyproject.toml` -- add `keyring` dependency
- `brickforge/lib/token_store.py` -- NEW: TokenStore base + KeyringStore + SecretsStore + factory
- `brickforge/lib/config_provider.py` -- `_save()` strips workspace.token before writing
- `brickforge/server.py` -- startup token restore via token_store
- `brickforge/routes/auth.py` -- bridge_receive also writes to token_store
- `brickforge/routes/setup.py` -- save-workspace also writes to token_store, 2 new endpoints
- `brickforge/routes/projects.py` -- load_project restores token from token_store
- `brickforge/deploy/grant/run_all_grants.py` -- add WRITE to secret scope grant
- `visual/frontend/src/setupSteps.ts` -- add "Pick from saved workspaces" choice
- `visual/frontend/src/components/SetupDrawer.tsx` -- workspace picker UI + save icon

## Rollback

Remove token_store.py, revert `_save()`, revert auth.py/setup.py/projects.py. Token goes back to config.json. No data migration. Old config files with tokens still load fine.
