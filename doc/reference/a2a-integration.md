# A2A (Agent-to-Agent) Integration

BrickForge supports connecting to remote agents via Google's [A2A protocol](https://github.com/google/A2A) -- enabling your agent to delegate tasks to or collaborate with external agents over HTTP.

---

## How it works

### Env var pattern

Each A2A connection is an env var in `.env.local`:

```
PROJECT_A2A_<SLUG>=<agent_url>
```

Optional auth header per agent:

```
PROJECT_A2A_<SLUG>_HEADER=<HeaderName>:<HeaderValue>
```

**Example:**
```
PROJECT_A2A_HELLO=https://hello-world-gxfr.onrender.com
PROJECT_A2A_WEATHER=https://weather-agent.example.com
PROJECT_A2A_WEATHER_HEADER=Authorization:Bearer sk-abc123
```

### Agent startup flow

1. `discover_a2a_tools()` in `tools/a2a_factory.py` scans all `PROJECT_A2A_*` env vars (skipping `_HEADER` suffixes)
2. For each, fetches the **Agent Card** from `<url>/.well-known/agent.json` to discover name, description, and skills
3. Creates a `@tool` function per remote agent
4. Tool name: `a2a_<slug>` (e.g. `a2a_hello`)
5. Tool description: auto-generated from Agent Card metadata
6. Tools are registered in `init_agent()` alongside MCP, KA, and domain tools

### Runtime invocation

When the LLM decides to call an A2A tool:

1. The tool sends a JSON-RPC 2.0 `message/send` request to the remote agent
2. Payload follows the A2A protocol spec:
   ```json
   {
     "jsonrpc": "2.0",
     "id": "<uuid>",
     "method": "message/send",
     "params": {
       "message": {
         "role": "user",
         "messageId": "msg-<id>",
         "parts": [{"kind": "text", "text": "<user message>"}]
       }
     }
   }
   ```
3. Response text parts are extracted and returned to the LLM

### Error handling

- Agent Card fetch failure: tool is still created with slug-based name/description (graceful degradation)
- HTTP errors: returned as descriptive error strings to the LLM (never raised)
- Timeout: 30s for Agent Card, 30s for message send
- Unreachable agents: logged as warning at startup, tool still registered (fails at call time with clear message)

---

## Setup App integration

### Setup block

The **A2A (agents)** block in the Setup App (visual/frontend) follows the same multi-instance pattern as Genie, KA, Vector Search, and MCP:

- **Toggle** (Power icon): enable/disable individual A2A connections (comments/uncomments env var)
- **Global toggle**: enable/disable all A2A connections at once
- **Add (+)**: add a new remote agent URL via the drawer

### Test endpoint

`GET /api/setup/test?step=a2a&key=PROJECT_A2A_HELLO`

Tests HTTP reachability of the remote agent URL. Accepts 200, 400, 404, 405 as "reachable" (A2A agents may return non-200 on GET since they expect POST).

### Status endpoint

`GET /api/setup/status` returns:

```json
{
  "a2a": {
    "status": "configured",
    "values": {},
    "instances": [
      {
        "key": "PROJECT_A2A_HELLO",
        "value": "https://hello-world-gxfr.onrender.com",
        "enabled": true,
        "label": "hello"
      }
    ]
  }
}
```

### Toggle endpoint

`PUT /api/setup/toggle` with `{"key": "PROJECT_A2A_HELLO"}` toggles the env var between active and commented-out.

---

## Files

| File | Role |
|------|------|
| `tools/a2a_factory.py` | Factory: discovery, Agent Card fetch, tool creation, JSON-RPC invocation |
| `agent/agent.py` | Imports `discover_a2a_tools()`, adds A2A tools to agent tool list |
| `visual/frontend/src/types.ts` | `'a2a'` in `StepId` union |
| `visual/frontend/src/setupSteps.ts` | A2A step definition with choices |
| `visual/frontend/src/components/SetupDag.tsx` | `Bot` icon, cyan border, multi-instance with toggle/+ |
| `visual/backend/index.js` | Status handler, toggle whitelist, test script for A2A |

---

## Testing

### Public test server

```
PROJECT_A2A_HELLO=https://hello-world-gxfr.onrender.com
```

This is a free Render-hosted A2A hello world agent. First request may take ~30s (cold start).

**Fetch Agent Card:**
```bash
curl https://hello-world-gxfr.onrender.com/.well-known/agent.json
```

**Send message:**
```bash
curl -X POST https://hello-world-gxfr.onrender.com \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "messageId": "msg-001",
        "parts": [{"kind": "text", "text": "Hello!"}]
      }
    }
  }'
```

**Expected response:**
```json
{"id":"1","jsonrpc":"2.0","result":{"kind":"message","messageId":"...","parts":[{"kind":"text","text":"Hello World"}],"role":"agent"}}
```

### Verify tool discovery

```bash
PROJECT_A2A_HELLO=https://hello-world-gxfr.onrender.com \
  uv run python -c "
from tools.a2a_factory import discover_a2a_tools
tools = discover_a2a_tools()
for t in tools:
    print(f'{t.name}: {t.__doc__}')
"
```

---

## Relationship to MCP

| | MCP | A2A |
|---|---|---|
| **Protocol** | Streamable HTTP, SSE | JSON-RPC 2.0 over HTTP |
| **Purpose** | Connect to tool servers | Connect to other agents |
| **Discovery** | Tool list via client handshake | Agent Card at `/.well-known/agent.json` |
| **Env pattern** | `PROJECT_MCP_<SLUG>` | `PROJECT_A2A_<SLUG>` |
| **Agent class** | `MCPServer` (databricks_langchain) | Custom `@tool` wrapper (a2a_factory) |
| **Auth** | `_HEADER` suffix | `_HEADER` suffix |

Both are multi-instance, toggleable, and auto-discovered at agent startup.
