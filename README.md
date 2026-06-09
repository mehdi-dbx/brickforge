<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/doc/assets/logo-dark.svg">
  <img alt="BrickForge" src="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/doc/assets/logo-light.svg" width="100%">
</picture>

---

**Build and deploy production AI agents to Databricks in minutes.**

BrickForge is a pip-installable tool that takes you from zero to a live, deployed AI agent on Databricks Apps. A browser-based Setup App walks you through workspace connection, data generation, agent configuration, and one-click deployment. No code, no notebooks, no YAML wrangling.

> **Beta** -- BrickForge is under active development. APIs and features may change.

[![PyPI](https://img.shields.io/pypi/v/brickforge)](https://pypi.org/project/brickforge/)
[![Website](https://img.shields.io/badge/website-brickforge.dev-red)](https://brickforge.dev)

---

## Quick Start

```bash
pip install brickforge
brickforge
```

Opens the Setup App at `http://localhost:9000`. Walk through 18 setup blocks to connect, configure, and deploy.

---

## What You Get

A deployed Databricks App with:

- **LangGraph agent** backed by a Foundation Model (Claude, DBRX, Llama, etc. via serving endpoint)
- **Chat UI** with streaming responses, structured response blocks, inline charts, action buttons
- **Auto-discovered tools** from your Unity Catalog schema (functions + stored procedures)
- **Genie NL-to-SQL** via MCP -- ask data questions in natural language
- **Knowledge Assistants** -- RAG over uploaded documents with source citations
- **Vector Search** -- semantic document retrieval
- **External APIs** -- REST calls via UC connections or direct HTTP
- **MCP servers** -- connect any MCP-compatible tool server
- **A2A agents** -- delegate to remote agents via Google A2A protocol
- **Per-user memory** -- long-term recall backed by Lakebase
- **Charts** -- inline bar, line, area, and pie visualizations

---

## How It Works

| Step | What happens |
|------|-------------|
| **Connect** | Authenticate to any Databricks workspace via one-click OAuth. Token stored in OS keychain, never on disk. |
| **Generate** | Describe your domain in plain English. AI generates table schemas, synthetic data, SQL functions, stored procedures, system prompts, and a knowledge base. |
| **Wire** | Pick a model endpoint. Connect Genie, KA, Vector Search, APIs, MCP servers, or other agents. Toggle features. |
| **Deploy** | One click. Bundles code + config + chat UI, deploys to Databricks Apps, auto-grants all UC permissions. |
| **Iterate** | Save projects, export as `.forge` bundles, share with colleagues. Push to GitHub. Clean up when done. |

---

## 18 Setup Blocks

Every resource your agent needs, covered by a visual step:

`Workspace` `SQL Warehouse` `Unity Catalog` `Data Tables` `Functions` `Model Endpoint` `Agent Prompt` `Genie Space` `Agent Bricks` `Vector Search` `MCP Servers` `REST APIs` `A2A Agents` `Features` `Lakebase` `MLflow` `Deploy` `GitHub`

Each block follows the same pattern: **choose** an approach, **configure**, **execute**, **done**.

---

## Architecture

```
Setup App (localhost:9000)
  FastAPI backend + React frontend
  18 setup blocks in a directed graph
  Configures, generates data, deploys
      |
      v
Databricks App (your workspace)
  |
  +-- MLflow AgentServer [port 8000]
  |     LangGraph agent + LangChain tools + Foundation Model
  |     Tools: Genie, KA, Vector Search, UC Functions,
  |            APIs, MCP, A2A, Memory, Charts
  |
  +-- Chat UI [port 3000]
        React frontend (Vercel AI SDK) + Express backend
        Live data panel, action buttons, inline charts

Config: single config.json shipped in bundle
        Agent reads at boot, flattens to env vars
```

---

## Project Structure

```
brickforge/
  routes/          FastAPI API (setup, auth, gen, projects, ka, cleanup)
  agent/           LangGraph agent runtime (agent.py, start_server.py, memory)
  tools/           Dynamic tool loading (UC functions, KA, API, A2A, MCP, charts)
  lib/             Config provider, env utils, SSE streaming, project paths
  data/            Seed data (demo/) + AI data generation wizard (gen/)
  deploy/          Bundle build + SDK deploy + grant scripts
  app/             Chat UI (Node.js monorepo -- React client + Express server)
  conf/            Agent prompt, KA configs, vector search configs
  stash/           Pre-built demo templates (.forge bundles)
  eval/            MLflow GenAI eval pipeline with custom LLM judge
  static/          Pre-built Setup App frontend
visual/
  frontend/        Setup App React source (Vite + TypeScript)
projects/          User project configs (JSON files + artifact dirs)
website/           Landing page (brickforge.dev, Cloudflare Worker)
```

---

## AI Data Generation

Describe a domain, get a complete data layer:

1. **Table schemas** -- LLM designs 2-8 relational tables from your description
2. **Synthetic data** -- realistic CSV rows generated per table
3. **UC functions** -- parameterized SQL queries as agent tools
4. **Stored procedures** -- mutation operations (UPDATE, INSERT)
5. **System prompt + knowledge base** -- tailored to your domain

SQL generation uses a 5-layer defense system: hardened prompts, Databricks SQL reference doc, auto-sanitizer, self-healing loop, and a learning feedback mechanism.

---

## Deploy Pipeline

Deploy uses the **Databricks SDK** (`w.apps.create()` / `w.apps.deploy()`), not DAB CLI:

1. Bundle agent code + chat UI + `config.json` + `app.yaml` into zip
2. Upload to workspace via `w.workspace.import_()`
3. Generate startup script (creates venv, installs 160 pinned deps)
4. `w.apps.deploy()` triggers deployment
5. Auto-grant permissions: tables (SELECT), functions (EXECUTE), warehouse (CAN_USE), Genie (CAN_RUN), serving endpoints (CAN_QUERY), Lakebase

---

## Project System

- Save, load, switch between multiple projects
- Each project: separate `config.json` + artifact dirs (prompts, generated data)
- Export as `.forge.zip` bundles, share with colleagues
- Import with "Load" (same workspace) or "New" (different workspace)
- Push to GitHub via OAuth Device Flow

---

## Config System

All configuration lives in a single `config.json`. No `.env` files.

- `lib/config_provider.py` -- structured access: `config.get("workspace.host")`
- `flatten()` converts nested JSON to flat env vars for subprocesses
- Tokens never written to disk -- stored in OS keychain
- Agent reads `config.json` at boot, flattens to `os.environ`

---

## Evaluation

MLflow-based eval pipeline (`eval/run_eval.py`):

- Baseline vs with-guideline comparisons
- Custom Claude LLM judge scorer
- Ships with curated test questions for the reference domain

---

## Use Cases

BrickForge ships with a **flight-operations reference agent** (check-in performance advisor with 5 tables, 8 SQL functions, 4 stored procedures, 15 custom React components). But the data gen wizard lets you build for any domain:

- **Financial services** -- portfolio risk, compliance checks, regulatory docs
- **Healthcare** -- clinical trial tracking, enrollment metrics, protocol retrieval
- **Retail** -- inventory ops, demand forecasting, supplier APIs
- **Energy & IoT** -- sensor monitoring, anomaly detection, maintenance dispatch
- **Your domain** -- describe it, generate it, deploy it

---

## Website

[brickforge.dev](https://brickforge.dev)

---

<p align="center"><sub>MIT License</sub></p>
