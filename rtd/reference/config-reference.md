# Config Reference

Complete `config.json` schema. All fields documented.

## Top-level structure

```json
{
  "version": 1,
  "workspace": { ... },
  "model": { ... },
  "app": { ... },
  "tools": { ... },
  "features": { ... },
  "bricks": { ... },
  "data": { ... },
  "lakebase": { ... },
  "env_store": { ... },
  "genie_room": { ... },
  "branding": { ... }
}
```

## workspace

Databricks workspace connection details.

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `host` | string | `DATABRICKS_HOST` | Workspace URL (e.g. `https://my-workspace.cloud.databricks.com`) |
| `token` | string | `DATABRICKS_TOKEN` | PAT or OAuth token. **Never written to disk** - stored in keyring. |
| `config_profile` | string | `DATABRICKS_CONFIG_PROFILE` | CLI config profile name (alternative to host+token) |
| `refresh_token` | string | - | OAuth refresh token (bridge auth) |
| `token_endpoint` | string | - | OAuth token endpoint URL |
| `client_id` | string | - | OAuth client ID |
| `client_secret` | string | - | OAuth client secret |
| `warehouse_id` | string | `DATABRICKS_WAREHOUSE_ID` | SQL warehouse ID |
| `unity_catalog_schema` | string | `PROJECT_UNITY_CATALOG_SCHEMA` | Target `catalog.schema` |

## model

Foundation Model endpoint configuration.

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `endpoint` | string | `AGENT_MODEL` | Serving endpoint URL or name |
| `token` | string | `AGENT_MODEL_TOKEN` | Token for cross-workspace endpoints. **Never written to disk.** |

## app

Deployed app settings.

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `name` | string | `DBX_APP_NAME` | Databricks App name |
| `mlflow_experiment_id` | string | `MLFLOW_EXPERIMENT_ID` | MLflow experiment ID for eval |

## tools

All agent tools configuration.

### tools.functions

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `functions` | string[] | `PROJECT_FUNCTIONS` | Comma-separated UC function names (fully qualified) |

### tools.genie_spaces

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `genie_spaces` | string[] | `PROJECT_GENIE_SPACES` | Comma-separated Genie space IDs |

### tools.vector_search

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `index` | string | `VS_INDEX` | Vector search index name |
| `endpoint` | string | `VS_ENDPOINT` | Vector search endpoint name |

### tools.ka.{SLUG}

Per-Knowledge-Assistant entry.

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `endpoint` | string | `PROJECT_KA_{SLUG}` | KA serving endpoint URL |
| `enabled` | boolean | - | Enable/disable this KA. Also gated by `bricks.KA.enabled`. |

### tools.mcp.{SLUG}

Per-MCP-server entry.

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `url` | string | `PROJECT_MCP_{SLUG}` | MCP server URL |
| `header` | string | `PROJECT_MCP_{SLUG}_HEADER` | Auth header |
| `enabled` | boolean | - | Enable/disable |

### tools.api.{SLUG}

Per-API entry.

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `conn` | string | - | UC Connection name (for managed credentials) |
| `url` | string | `PROJECT_API_{SLUG}_URL` | API base URL |
| `method` | string | `PROJECT_API_{SLUG}_METHOD` | HTTP method |
| `path` | string | `PROJECT_API_{SLUG}_PATH` | URL path |
| `desc` | string | `PROJECT_API_{SLUG}_DESC` | Tool description for the agent |
| `params` | string | `PROJECT_API_{SLUG}_PARAMS` | Parameter spec |
| `header` | string | `PROJECT_API_{SLUG}_HEADER` | Auth header |
| `enabled` | boolean | - | Enable/disable |

### tools.a2a.{SLUG}

Per-A2A-agent entry.

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `url` | string | `PROJECT_A2A_{SLUG}` | A2A agent URL |
| `header` | string | `PROJECT_A2A_{SLUG}_HEADER` | Auth header |
| `enabled` | boolean | - | Enable/disable |

## features

Optional agent capabilities. Each is a toggle.

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `MEMORY.enabled` | boolean | `PROJECT_FEATURE_MEMORY` | Per-user long-term memory (Lakebase) |
| `CHART.enabled` | boolean | `PROJECT_FEATURE_CHART` | Inline chart generation |
| `VOICE.enabled` | boolean | `PROJECT_FEATURE_VOICE` | Voice input |
| `VISION.enabled` | boolean | `PROJECT_FEATURE_VISION` | Image/vision input |
| `PERSONAS.enabled` | boolean | `PROJECT_FEATURE_PERSONAS` | Multiple agent personas |

## bricks

Toggleable AI building blocks.

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `KA.enabled` | boolean | `PROJECT_BRICK_KA` | Knowledge Assistant brick |
| `INFO_EXTRACTION.enabled` | boolean | `PROJECT_BRICK_INFO_EXTRACTION` | Information extraction brick |
| `DOC_PARSING.enabled` | boolean | `PROJECT_BRICK_DOC_PARSING` | Document parsing brick |
| `TEXT_CLASSIFICATION.enabled` | boolean | `PROJECT_BRICK_TEXT_CLASSIFICATION` | Text classification brick |

## data

Data source configuration.

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `use_demo_data` | boolean | `USE_DEMO_DATA` | Include demo seed data |
| `use_gen_data` | boolean | `USE_GEN_DATA` | Include AI-generated data |
| `stash_dir` | string | `STASH_DIR` | Path to stash template directory |

## lakebase

Lakebase instance configuration.

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `instance_name` | string | `LAKEBASE_INSTANCE` | Lakebase instance name |
| `agent_memory_schema` | string | `LAKEBASE_MEMORY_SCHEMA` | Schema for agent memory tables |

## env_store

UC Volume backup configuration.

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `host` | string | `ENV_STORE_HOST` | Workspace URL for volume access |
| `token` | string | `ENV_STORE_TOKEN` | Token for volume access |
| `catalog_volume_path` | string | `ENV_STORE_VOLUME` | UC Volume path for project backup |

## genie_room

Genie room configuration (for auto-created rooms).

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `name` | string | `GENIE_ROOM_NAME` | Genie room display name |
| `description` | string | `GENIE_ROOM_DESC` | Genie room description |

## branding

UI branding for the deployed chat app.

| Field | Type | Env var | Description |
|-------|------|---------|-------------|
| `logo_url` | string | `BRANDING_LOGO_URL` | Logo URL for chat UI |
| `brandfetch_api_key` | string | `BRANDFETCH_API_KEY` | Brandfetch API key for logo lookup |
