# BrickForge

**Build and deploy Databricks AI agents in minutes.**

BrickForge is a pip-installable tool that takes you from zero to a live, production-grade AI agent on Databricks Apps. A browser-based Setup App walks you through workspace connection, data generation, agent configuration, and one-click deployment. No code, no notebooks, no YAML.

```bash
pip install brickforge
brickforge
```

!!! note "Beta"
    BrickForge is under active development. APIs and features may change.

---

## What you get

A deployed Databricks App with:

- **LangGraph agent** backed by a Foundation Model (Claude, DBRX, Llama via serving endpoint)
- **Chat UI** with streaming responses, structured blocks, inline charts, action buttons
- **Auto-discovered tools** from your Unity Catalog schema (functions + stored procedures)
- **Genie NL-to-SQL** via MCP - ask data questions in natural language
- **Knowledge Assistants** - RAG over uploaded documents with source citations
- **Vector Search** - semantic document retrieval
- **External APIs** - REST calls via UC connections or direct HTTP
- **MCP servers** - connect any MCP-compatible tool server
- **A2A agents** - delegate to remote agents via Google A2A protocol
- **Per-user memory** - long-term recall backed by Lakebase
- **Charts** - inline bar, line, area, and pie visualizations

---

## How it works

| Step | What happens |
|------|-------------|
| **Connect** | Authenticate to any Databricks workspace via one-click OAuth. Token stored in OS keychain, never on disk. |
| **Generate** | Describe your domain in plain English. AI generates table schemas, synthetic data, SQL functions, stored procedures, system prompts, and a knowledge base. |
| **Wire** | Pick a model endpoint. Connect Genie, KA, Vector Search, APIs, MCP servers, or other agents. Toggle features. |
| **Deploy** | One click. Bundles code + config + chat UI, deploys to Databricks Apps, auto-grants all UC permissions. |
| **Iterate** | Save projects, export as `.forge` bundles, share with colleagues. Push to GitHub. Clean up when done. |

---

## 18 setup blocks

Every resource your agent needs, covered by a visual step:

`Workspace` `SQL Warehouse` `Unity Catalog` `Data Tables` `Functions` `Model Endpoint` `Agent Prompt` `Genie Space` `Agent Bricks` `Vector Search` `MCP Servers` `REST APIs` `A2A Agents` `Features` `Lakebase` `MLflow` `Deploy` `GitHub`

Each block follows the same pattern: **choose** an approach, **configure**, **execute**, **done**.

---

## Documentation

| Section | What it covers |
|---------|---------------|
| [Getting Started](getting-started.md) | Install, first run, connect workspace, pick warehouse, set schema |
| [Setup Blocks](setup-blocks.md) | All 18 blocks - choices, actions, what happens on execute |
| [Data Generation](data-generation.md) | AI wizard: domain description to tables, functions, procedures, prompts |
| [Agent Tools](agent-tools.md) | All tool types: UC functions, Genie, KA, APIs, MCP, A2A, charts, memory |
| [Prompt System](prompt-system.md) | System prompt, knowledge base, generation, project-scoped prompts |
| [Deploy](deploy.md) | Bundle build, upload, app creation, grants pipeline |
| [Projects](projects.md) | Save, load, export .forge bundles, import on different workspaces |
| [Config](config.md) | config.json system, no .env files, token security, flatten() |
| [Evaluation](evaluation.md) | MLflow eval pipeline, LLM judge scorer, test datasets |
| [GitHub Integration](github-integration.md) | Push to GitHub, own the code, vibe on top |
| [Architecture](architecture.md) | Setup App + Agent App, config flow, package structure |

### Reference

| Section | What it covers |
|---------|---------------|
| [Tools Table](reference/tools-table.md) | Complete tools reference with discovery method, feature gates, source files |
| [Config Reference](reference/config-reference.md) | Full config.json schema - every field, type, env var mapping |
| [Known Issues](reference/known-issues.md) | Current known issues and workarounds |

---

## Links

- **Website**: [brickforge.dev](https://brickforge.dev)
- **PyPI**: [pypi.org/project/brickforge](https://pypi.org/project/brickforge/)
- **GitHub**: [github.com/mehdi-dbx/brickforge](https://github.com/mehdi-dbx/brickforge)
