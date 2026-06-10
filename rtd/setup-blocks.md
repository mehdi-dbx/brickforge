# Setup Blocks

The Setup App presents 18 blocks in a directed graph. Each block follows the same lifecycle:

**choose** -> **configure** -> **execute** -> **done**

Green means configured. Gray means pending. Work through them top to bottom or jump to any block.

## Block reference

### host - Workspace

Connect to your Databricks workspace.

| Choice | What happens |
|--------|-------------|
| Bridge-Forge | OAuth PKCE flow via shell script. Creates PAT (7-day TTL), saves host + token to config. Handles IP whitelist. |
| Manual | Paste workspace URL + PAT. Saved directly to config. |

Saved workspaces are remembered. Switch between them from a dropdown.

---

### warehouse - SQL Warehouse

Pick a running SQL warehouse for all SQL operations.

| Choice | What happens |
|--------|-------------|
| Select existing | Lists running warehouses via SDK. Click to select. Warehouse ID saved to config. |

!!! note
    Only warehouses in RUNNING state appear. BrickForge does not start or create warehouses.

---

### schema - Unity Catalog

Set the target `catalog.schema` for all tables, functions, and procedures.

| Choice | What happens |
|--------|-------------|
| Select existing | Browse available catalogs and schemas. |
| Create new | Enter `catalog.schema`. BrickForge creates both if they don't exist via `CREATE CATALOG IF NOT EXISTS` / `CREATE SCHEMA IF NOT EXISTS`. |

---

### tables - Data Tables

Provision Delta tables in Unity Catalog.

| Choice | What happens |
|--------|-------------|
| Generate Synthetic Data | Opens the [data generation wizard](data-generation.md). AI creates table schemas, generates CSV data, provisions to UC. |
| Use Demo Data | Provisions pre-built seed data from `brickforge/data/demo/csv/`. |
| Upload CSVs | Upload your own CSV files. BrickForge creates Delta tables from them. |
| Connect Existing | Point to tables already in Unity Catalog. |

---

### functions - UC Functions

Create SQL functions and stored procedures in Unity Catalog.

| Choice | What happens |
|--------|-------------|
| Generate with AI | Opens the routines wizard. AI generates UC functions and stored procedures from your table context. Includes [5-layer self-healing](data-generation.md#the-5-layer-sql-defense-system). |
| Use Demo Functions | Provisions pre-built SQL functions from `brickforge/data/demo/func/` and procedures from `brickforge/data/demo/proc/`. |

Function names are auto-registered in config under `tools.functions[]`. The agent discovers them at runtime.

---

### model - Model Endpoint

Configure the Foundation Model API endpoint the agent uses for reasoning.

| Choice | What happens |
|--------|-------------|
| Same workspace | Auto-detect scans your workspace for available serving endpoints (Claude, Llama, Mixtral, etc.). Click to select. |
| Cross-workspace | Enter a serving endpoint URL + token from a different workspace. |

---

### prompt - Agent Prompt

Edit the system prompt and knowledge base that define agent behavior.

| Choice | What happens |
|--------|-------------|
| Generate from domain | AI generates a system prompt and knowledge base tailored to your tables and domain. |
| Edit manually | Open the prompt editor. Edit `main.prompt` and `knowledge.base` directly. |

Prompts are project-scoped - stored in `projects/{name}/prompt/`.

---

### genie - Genie Space

Configure a Genie space for natural-language SQL. The agent asks Genie questions, Genie writes SQL, queries your tables, returns results.

| Choice | What happens |
|--------|-------------|
| Select existing | Lists Genie spaces in your workspace. Click to select. |
| Create new | BrickForge creates a Genie space with your tables, writes the Genie room config. |

Multiple Genie spaces supported. IDs stored in `tools.genie_spaces[]`.

---

### bricks - Agent Bricks

Toggleable AI building blocks that extend the agent.

| Brick | What it does |
|-------|-------------|
| KA (Knowledge Assistant) | RAG over documents via a Databricks Knowledge Assistant endpoint. |
| Info Extraction | Structured data extraction from unstructured text. |
| Doc Parsing | Document parsing and analysis. |
| Text Classification | Text categorization and labeling. |

Each brick is a toggle. Enable/disable in config under `bricks.{BRICK}.enabled`.

---

### vs - Vector Search

Configure a Databricks Vector Search index for semantic retrieval.

| Choice | What happens |
|--------|-------------|
| Configure | Set vector search index name and endpoint. Saved to `tools.vector_search`. |

---

### mcp - MCP (External)

Add external MCP (Model Context Protocol) servers as agent tools.

| Choice | What happens |
|--------|-------------|
| Add server | Enter MCP server URL + optional auth header. Each server becomes a callable tool. |

Multiple servers supported. Stored in `tools.mcp.{SLUG}` with `enabled` toggle.

---

### api - API (External)

Add REST API connections as agent tools.

| Choice | What happens |
|--------|-------------|
| Add API | Configure: UC connection name, URL, method, path, description, parameters, auth header. |

Supports UC Connections (managed credentials) or direct HTTP. Stored in `tools.api.{SLUG}`.

---

### a2a - A2A (Agents)

Add agent-to-agent connections via Google's A2A protocol.

| Choice | What happens |
|--------|-------------|
| Add agent | Enter A2A agent URL + optional auth header. The remote agent becomes a callable tool. |

Stored in `tools.a2a.{SLUG}`.

---

### features - Features

Toggle optional agent capabilities.

| Feature | What it does |
|---------|-------------|
| MEMORY | Per-user long-term memory via Lakebase (AsyncDatabricksStore). |
| CHART | Inline chart generation in chat responses. |
| VOICE | Voice input support. |
| VISION | Image/vision input support. |
| PERSONAS | Multiple agent personas. |

Each feature stored in `features.{NAME}.enabled`.

---

### lakebase - Lakebase

Create or configure a Lakebase (Postgres-compatible) instance.

| Choice | What happens |
|--------|-------------|
| Create new | BrickForge creates a Lakebase instance via SDK. Instance name saved to config. |
| Use existing | Enter an existing instance name. |

Used by the MEMORY feature for per-user agent memory.

---

### mlflow - MLflow Experiment

Create or configure an MLflow experiment for agent evaluation.

| Choice | What happens |
|--------|-------------|
| Create new | BrickForge creates an MLflow experiment. ID saved to `app.mlflow_experiment_id`. |
| Use existing | Enter an existing experiment ID. |

---

### deploy - Deploy App

Bundle and deploy the agent as a Databricks App.

| Choice | What happens |
|--------|-------------|
| Deploy Now | Builds bundle (agent code + config + chat UI), uploads to workspace, creates/updates Databricks App, waits for startup, runs all grants automatically. |

See [Deploy](deploy.md) for the full pipeline.

---

### git - Source Control

Push your agent project to GitHub.

| Choice | What happens |
|--------|-------------|
| Connect GitHub | OAuth Device Flow - enter code in browser, BrickForge stores token in keyring. |
| Push | Creates a private repo (if needed), pushes agent bundle with tokens stripped. |

See [GitHub Integration](github-integration.md) for details.

## Status and testing

- `GET /api/setup/status` returns all block states from config
- `GET /api/setup/test` runs inline test scripts per block (defined in `TEST_SCRIPTS` dict in `brickforge/routes/setup.py`)
- Test results are cached in the frontend to avoid re-testing on every click
