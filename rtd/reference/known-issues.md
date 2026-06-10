# Known Issues

Current limitations and bugs in BrickForge.

## #44: Brick toggles not enforced at runtime

**Status**: Open

Brick toggles (`bricks.KA.enabled`, `bricks.INFO_EXTRACTION.enabled`, etc.) are stored in config and respected by `flatten()` output, but are **not enforced at agent runtime**. Tools load regardless of the brick toggle state.

**Impact**: Disabling a brick in the Setup App does not prevent the corresponding tools from being loaded by the agent. The toggle only affects the `flatten()` output (env vars), but some tool factories read config directly.

**Workaround**: Disable individual tool entries (e.g. `tools.ka.{SLUG}.enabled: false`) instead of relying on the brick-level toggle.

---

## Ghost KA tools

**Status**: Open

Stale `PROJECT_KA_*` entries in config (from deleted or renamed Knowledge Assistants) produce unexpected tools at agent runtime, such as `query_default_ka`.

**Impact**: The agent may have tools pointing to non-existent KA endpoints, causing errors when the agent tries to call them.

**Workaround**: Manually remove stale KA entries from `tools.ka` in config. Use the cleanup block to discover and remove orphaned resources.

---

## UC procedures require spark.sql()

**Status**: By design

Databricks SQL stored procedures with `BEGIN...END` compound statements cannot be executed via `%sql` magic. BrickForge uses `spark.sql()` for procedure provisioning.

**Impact**: None for normal usage. Relevant only if you are running SQL files manually outside BrickForge.

---

## VPN blocks PyPI uploads

**Status**: By design

Corporate VPN SSL certificate interception blocks `twine upload` to PyPI.

**Impact**: Developers must disconnect from VPN before running `scripts/release/upload.sh`.

---

## Chat UI size optimization

**Status**: Resolved

The Chat UI was trimmed from 16MB to 1.8MB by stubbing heavy dependencies (shiki, mermaid, cytoscape, katex) via Vite resolve.alias. The stubs are in `brickforge/app/client/src/stubs/`.

If you add new heavy dependencies to the Chat UI, check the bundle size and add stubs as needed.
