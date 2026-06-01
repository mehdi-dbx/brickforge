# External MCP Server Integration

BrickForge supports connecting external MCP (Model Context Protocol) servers to extend the agent with third-party tools -- weather APIs, code search, Slack, custom services, etc.

---

## How it works

### Env var pattern

Each external MCP server is an env var in `.env.local`:

```
PROJECT_MCP_<SLUG>=<server_url>
PROJECT_MCP_<SLUG>_HEADER=<HeaderName>:<HeaderValue>   # optional auth
```

Examples:

```
PROJECT_MCP_DEEPWIKI=https://mcp.deepwiki.com/mcp
PROJECT_MCP_WEATHER=https://mcp.weather.io/v1
PROJECT_MCP_WEATHER_HEADER=Authorization:Bearer sk-abc123
```

### Agent discovery

At startup, `agent/agent.py` loops over all `PROJECT_MCP_*` env vars (skipping `_HEADER` suffixes) and creates an `MCPServer` instance for each:

```python
# agent/agent.py -- _build_mcp_servers()
from databricks_langchain.multi_server_mcp_client import MCPServer

for key in sorted(os.environ):
    if key.startswith("PROJECT_MCP_") and not key.endswith("_HEADER") and os.environ[key].strip():
        url = os.environ[key].strip()
        slug = key.replace("PROJECT_MCP_", "").lower()
        headers = None
        header_val = os.environ.get(f"{key}_HEADER", "").strip()
        if header_val and ":" in header_val:
            hname, hval = header_val.split(":", 1)
            headers = {hname.strip(): hval.strip()}
        servers.append(MCPServer(name=f"mcp-{slug}", url=url, headers=headers))
```

`MCPServer` is the base class (not `DatabricksMCPServer`). It connects to any streamable HTTP MCP server -- no Databricks auth required.

The return type of `_build_mcp_servers()` is `list[MCPServer]`. `DatabricksMCPServer` (used for Genie/VS) extends `MCPServer`, so both work in the same list.

### Tool registration

`_get_mcp_tools_safe()` connects to each server individually, calls `get_tools()`, and skips unavailable servers:

```python
for server in servers:
    try:
        client = DatabricksMultiServerMCPClient([server])
        tools = await client.get_tools()
        all_tools.extend(tools)
    except Exception as e:
        _log.warning("MCP server '%s' unavailable — skipping: %s", server.name, e)
```

All discovered tools are then wrapped with `wrap_for_genie_capture()` and added to the agent's tool list.

---

## Setup App integration

### Setup step

The `mcp` step in the visual Setup App (Setup tab) supports:

- **Multi-instance** -- multiple MCP servers, each with its own toggle
- **Enable/disable** -- Power button comments/uncomments the env var in `.env.local`
- **Add (+)** -- three-field form: name (slug), server URL, optional auth header
- **Delete (trash)** -- removes env var (and `_HEADER` companion) from `.env.local`
- **Click instance** -- opens detail panel in drawer with test + tool discovery

### Files involved

| File | What |
|------|------|
| `visual/frontend/src/types.ts` | `'mcp'` in `StepId` union |
| `visual/frontend/src/setupSteps.ts` | Step definition: label "MCP (external)", choices |
| `visual/frontend/src/components/SetupDag.tsx` | `Plug` icon, emerald border, in `MULTI_INSTANCE_STEPS` |
| `visual/frontend/src/components/SetupDrawer.tsx` | Custom 3-field configure UI (slug, URL, header), instance detail + tools display |
| `visual/frontend/src/components/SetupView.tsx` | Toggle, delete, click handlers |
| `visual/backend/index.js` | Status, toggle, delete, test, tools endpoints |
| `agent/agent.py` | `MCPServer` import, dynamic `PROJECT_MCP_*` loop |

### Backend endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/setup/status` | GET | Returns `instances[]` for MCP step (filters out `_HEADER` keys) |
| `PUT /api/setup/toggle` | PUT | Comments/uncomments `PROJECT_MCP_*` keys |
| `DELETE /api/setup/instance` | DELETE | Removes env key + `_HEADER` from `.env.local` |
| `POST /api/setup/exec` | POST | `save-multi-instance` action writes `PROJECT_MCP_<SLUG>=<url>` + optional header |
| `GET /api/setup/test?step=mcp&key=<envKey>` | GET | Sends MCP `initialize` POST to verify server responds |
| `GET /api/setup/mcp-tools?key=<envKey>` | GET | Full MCP handshake (`initialize` + `notifications/initialized` + `tools/list`), returns tool names + descriptions |

### Test script

The MCP test sends a proper JSON-RPC `initialize` request (POST, not GET):

```python
body = json.dumps({
    "jsonrpc": "2.0",
    "method": "initialize",
    "id": 1,
    "params": {
        "protocolVersion": "2025-03-26",
        "capabilities": {},
        "clientInfo": {"name": "brickforge-test", "version": "0.1"}
    }
}).encode()
```

- 200 = "connected"
- 406/415 = "reachable" (server responded but may need different content negotiation)
- Other errors = fail

### Tool discovery

`GET /api/setup/mcp-tools?key=PROJECT_MCP_DEEPWIKI` performs the full MCP handshake:

1. `initialize` (JSON-RPC POST, id=1)
2. `notifications/initialized` (fire-and-forget POST)
3. `tools/list` (JSON-RPC POST, id=2)

Returns:

```json
{
  "tools": [
    {"name": "read_wiki_structure", "description": "Get a list of documentation topics..."},
    {"name": "read_wiki_contents", "description": "View documentation about a GitHub repo..."},
    {"name": "ask_question", "description": "Ask any question about a GitHub repo..."}
  ]
}
```

The drawer displays these in a scrollable list below the test result when an MCP instance is clicked.

---

## Add/configure flow (UI)

1. Click MCP block or "+" button
2. Select "add MCP server"
3. **Configure phase**: enter name, URL, optional auth header
4. Preview shows: `PROJECT_MCP_<NAME>` key that will be written
5. **Execute phase**: writes env var(s) to `.env.local` via `save-multi-instance` action
6. Instance appears in DAG with toggle + trash buttons
7. Click instance -> drawer shows details + auto-runs test + discovers tools

---

## Tested with

- **DeepWiki** (`https://mcp.deepwiki.com/mcp`) -- public, no auth, 3 tools (wiki structure, wiki contents, ask question)
- Any MCP server supporting streamable HTTP transport works

---

## Known limitations

- Only streamable HTTP transport supported (not stdio, not SSE-only)
- Auth limited to a single custom header per server (covers Bearer tokens, API keys)
- No OAuth flow for MCP servers that require it
- Tool discovery requires the server to implement `tools/list` method
