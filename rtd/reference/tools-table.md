# Tools Reference

Complete reference of all agent tool types in BrickForge.

## Tool types

| Tool type | Discovery method | Config location | Feature gate | Source file | Example |
|-----------|-----------------|-----------------|-------------|-------------|---------|
| UC Functions | `discover_uc_function_tools()` reads `tools.functions[]`, fetches UC metadata | `tools.functions` | None | `tools/tool_factory.py` | `catalog.schema.get_top_customers` |
| Genie (MCP) | Genie space IDs from config | `tools.genie_spaces` | None | `agent/agent.py` | Genie space `01ef...` |
| Knowledge Assistant | `ka_factory.py` reads `tools.ka.{SLUG}` | `tools.ka.{SLUG}` | `bricks.KA.enabled` AND `tools.ka.{SLUG}.enabled` | `tools/ka_factory.py` | `tools.ka.eu_rights.endpoint` |
| Vector Search | Index + endpoint from config | `tools.vector_search` | None | `tools/tool_factory.py` | `my_index` on `vs_endpoint` |
| External API | `api_factory.py` reads `tools.api.{SLUG}` | `tools.api.{SLUG}` | `tools.api.{SLUG}.enabled` | `tools/api_factory.py` | REST call to weather API |
| MCP Server | MCP URL from config | `tools.mcp.{SLUG}` | `tools.mcp.{SLUG}.enabled` | `agent/agent.py` | `https://mcp.example.com` |
| A2A Agent | `a2a_factory.py` reads `tools.a2a.{SLUG}` | `tools.a2a.{SLUG}` | `tools.a2a.{SLUG}.enabled` | `tools/a2a_factory.py` | Remote agent at `https://a2a.example.com` |
| Chart | Built-in tool | `features.CHART` | `features.CHART.enabled` | `tools/generate_chart.py` | Inline bar chart in chat |
| Memory | Built-in tool | `features.MEMORY` | `features.MEMORY.enabled` | `agent/memory_tools.py` | Per-user memory store/recall |
| Current Time | Built-in tool | None | None (always loaded) | `tools/get_current_time.py` | Returns current timestamp |

## Config examples

### UC Functions

```json
{
  "tools": {
    "functions": [
      "demo_catalog.demo_schema.get_flight_delays",
      "demo_catalog.demo_schema.checkin_performance"
    ]
  }
}
```

### Genie spaces

```json
{
  "tools": {
    "genie_spaces": ["01ef1234-5678-9abc-def0-123456789abc"]
  }
}
```

### Knowledge Assistant

```json
{
  "tools": {
    "ka": {
      "eu_rights": {
        "endpoint": "https://workspace.cloud.databricks.com/serving-endpoints/eu-rights-ka/invocations",
        "enabled": true
      }
    }
  },
  "bricks": {
    "KA": { "enabled": true }
  }
}
```

### External API

```json
{
  "tools": {
    "api": {
      "weather": {
        "conn": "weather_api_conn",
        "url": "https://api.weather.com",
        "method": "GET",
        "path": "/v1/forecast",
        "desc": "Get weather forecast for a location",
        "params": "location:string",
        "header": "",
        "enabled": true
      }
    }
  }
}
```

### MCP Server

```json
{
  "tools": {
    "mcp": {
      "slack": {
        "url": "https://mcp-slack.example.com",
        "header": "Bearer xxx",
        "enabled": true
      }
    }
  }
}
```

### A2A Agent

```json
{
  "tools": {
    "a2a": {
      "billing_agent": {
        "url": "https://billing-agent.example.com",
        "header": "",
        "enabled": true
      }
    }
  }
}
```

## Tool loading order

1. UC Functions (`tools.functions[]`)
2. Genie MCP (`tools.genie_spaces[]`)
3. Knowledge Assistants (`tools.ka.*` - double-gated)
4. Vector Search (`tools.vector_search`)
5. External APIs (`tools.api.*`)
6. MCP Servers (`tools.mcp.*`)
7. A2A Agents (`tools.a2a.*`)
8. Feature-gated tools (Chart, Memory)
9. Built-in tools (Current Time)

## Grants required per tool type

| Tool type | Grant needed | Object type | Permission |
|-----------|-------------|-------------|-----------|
| UC Functions | `GRANT EXECUTE` on functions | SQL grant | - |
| Genie | `w.permissions.update()` | `genie` | `CAN_RUN` |
| Knowledge Assistant | `w.permissions.update()` | `serving-endpoints` | `CAN_QUERY` |
| External API (UC Conn) | UC Connection access | SQL grant | - |
| MCP Server | None (external) | - | - |
| A2A Agent | None (external) | - | - |
