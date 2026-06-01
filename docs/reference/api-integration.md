# External API Integration

BrickForge supports adding any external REST API as an agent tool. Two modes are available:

- **UC Connection (Option A):** API calls routed through a Databricks Unity Catalog HTTP connection. Credentials stored in Databricks, governed, auditable.
- **Direct HTTP (Option B):** API calls made directly from Python with `requests`. API key stored as env var. No Databricks dependency, works anywhere.

---

## Architecture

```
User asks question
    |
    v
Agent (LangGraph) decides to call external API tool
    |
    +-- Option A: UC Connection
    |     WorkspaceClient().serving_endpoints.http_request(conn=..., method=..., path=...)
    |     Databricks routes the call through the named HTTP connection
    |     Credentials managed by UC (bearer_token in connection config)
    |
    +-- Option B: Direct HTTP
          requests.request(method, url + path, headers={auth}, params={...})
          API key from PROJECT_API_<SLUG>_HEADER env var
```

---

## Env var convention

Each API is identified by a slug (e.g. `WEATHER`, `STOCKS`). All config lives in `PROJECT_API_<SLUG>_*` env vars:

| Env var | Required | Description |
|---------|----------|-------------|
| `PROJECT_API_<SLUG>_CONN` | Option A | UC connection name |
| `PROJECT_API_<SLUG>_URL` | Option B | Base URL (used if no `_CONN`) |
| `PROJECT_API_<SLUG>_METHOD` | No | HTTP method (default: `GET`) |
| `PROJECT_API_<SLUG>_PATH` | No | API path appended to base (default: `/`) |
| `PROJECT_API_<SLUG>_DESC` | No | Tool description shown to the LLM |
| `PROJECT_API_<SLUG>_PARAMS` | No | Comma-separated `name:type` pairs (e.g. `city:str,days:int`) |
| `PROJECT_API_<SLUG>_HEADER` | No | Auth header as `Name:Value` (Option B only) |

### Example: Option A (UC Connection)

```env
PROJECT_API_OILPRICE_CONN=rapid-oil-price
PROJECT_API_OILPRICE_METHOD=GET
PROJECT_API_OILPRICE_PATH=/web-crawling/api/oil-price-charts
PROJECT_API_OILPRICE_DESC=Get live oil and energy commodity prices
```

Requires a UC HTTP connection named `rapid-oil-price` to exist in the workspace.

### Example: Option B (Direct HTTP)

```env
PROJECT_API_WEATHER_URL=https://api.openweathermap.org
PROJECT_API_WEATHER_METHOD=GET
PROJECT_API_WEATHER_PATH=/data/2.5/weather
PROJECT_API_WEATHER_DESC=Get current weather for a city
PROJECT_API_WEATHER_PARAMS=q:str,units:str
PROJECT_API_WEATHER_HEADER=X-API-Key:your-api-key-here
```

---

## How it works

### Discovery (`tools/api_factory.py`)

At agent startup, `discover_api_tools()` scans all env vars for `PROJECT_API_<SLUG>_*` patterns:

1. Groups env vars by slug
2. For each slug, reads `_CONN` or `_URL` to determine mode
3. Creates a `@tool`-decorated function with the configured method, path, params, and description
4. Returns a list of tool functions added to the agent

### Tool execution

**Option A (UC Connection):**
```python
from databricks.sdk.service.serving import ExternalFunctionRequestHttpMethod

resp = WorkspaceClient().serving_endpoints.http_request(
    conn="rapid-oil-price",
    method=ExternalFunctionRequestHttpMethod.GET,
    path="/web-crawling/api/oil-price-charts",
    params={"city": "Paris"},
)
return json.dumps(resp.json(), indent=2)
```

**Option B (Direct HTTP):**
```python
resp = requests.get(
    "https://api.openweathermap.org/data/2.5/weather",
    headers={"X-API-Key": "your-key"},
    params={"q": "Paris", "units": "metric"},
    timeout=30,
)
return json.dumps(resp.json(), indent=2)
```

### Parameter handling

- **No params:** Tool takes no arguments, calls the API as-is
- **Single param:** Tool takes a `query: str` argument, maps it to the first param name
- **Multiple params:** Tool takes a `query: str` argument, expects comma-separated `key=value` pairs

---

## Setup App integration

### Setup block

The **API (external)** block in the Setup tab supports:

- **Add UC connection API** (`cfg-api-uc`): Enter API name, UC connection name, method, path, description, params
- **Add direct HTTP API** (`cfg-api-direct`): Enter API name, base URL, method, path, description, params, auth header
- **Multi-instance:** Each API appears as a toggleable instance row
- **Toggle:** Enable/disable individual APIs (comments/uncomments env var in `.env.local`)
- **Test:** Per-instance test button validates the API is reachable

### Test behavior

- **Option A:** Calls `serving_endpoints.http_request()` with the configured connection and path, reports status code
- **Option B:** Makes an HTTP request to URL + path, reports status code. Accepts 200, 405, 404, 400 as "reachable"

---

## Agent wiring

In `agent/agent.py`:

```python
from tools.api_factory import discover_api_tools

api_tools = discover_api_tools()
tools = list(wrapped_tools) + ka_tools + api_tools + a2a_tools + [get_current_time] + domain_tools
```

`api_factory` is in `_FRAMEWORK_MODULES` so it's not double-loaded by `_discover_domain_tools()`.

---

## Creating a UC HTTP connection

### Via SDK

```python
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.catalog import ConnectionType

w = WorkspaceClient()
w.connections.create(
    name="my-api",
    connection_type=ConnectionType.HTTP,
    options={
        "host": "https://api.example.com",
        "port": "443",
        "base_path": "/",
        "bearer_token": "your-token"
    }
)
```

### Via SQL

```sql
CREATE CONNECTION my_api
  TYPE HTTP
  OPTIONS (
    host 'https://api.example.com',
    port '443',
    base_path '/',
    bearer_token secret('my_scope', 'my_api_key')
  );
```

### Requirements

- Databricks workspace with Unity Catalog
- DBR 16.2+ for `http_request()` SQL function
- `WorkspaceClient().serving_endpoints.http_request()` works from any SDK version

---

## Files

| File | Role |
|------|------|
| `tools/api_factory.py` | Discovery + tool creation factory |
| `agent/agent.py` | Imports and registers API tools |
| `visual/frontend/src/setupSteps.ts` | API step definition (choices, help text) |
| `visual/frontend/src/components/SetupDag.tsx` | API icon (`Zap`), multi-instance, border color |
| `visual/frontend/src/components/SetupDrawer.tsx` | Configure UI for both UC and direct modes |
| `visual/frontend/src/components/SetupView.tsx` | `cfg-api-uc`/`cfg-api-direct` in NEEDS_CONFIGURE |
| `visual/backend/index.js` | `save-api` exec handler, `api` status handler, test script, toggle whitelist |
