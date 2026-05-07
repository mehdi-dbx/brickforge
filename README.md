# BrickForge

**Build production-ready AI agents on Databricks -- in a day, not a month.**

BrickForge is an open-source accelerator that turns Databricks into a complete agentic AI platform. It ships a working reference app (flight operations), a full data layer, and a visual setup experience -- so you can fork it, swap in your domain, and deploy.

The idea is simple: most agentic apps share the same architecture. The LLM reasons, tools fetch data, a frontend streams responses. What changes is the domain. BrickForge packages everything that doesn't change into a templatable, extensible framework -- and lets you focus on what does.

---

## Why BrickForge

- **Ship faster.** Auth, streaming, agent wiring, deployment -- already done. You write domain logic, not plumbing.
- **Databricks-native.** Runs on Unity Catalog, Genie, Model Serving, Knowledge Assistants, and Databricks Apps. Your data never leaves the platform.
- **Modular by design.** Six composable bricks (agent, UC functions, Genie MCP, Knowledge Assistant, data layer, chat app) -- swap any piece independently.
- **SDK-first.** Every resource created via Databricks SDK and CLI. Reproducible across workspaces and clients.
- **Visual setup.** A React-based control plane for provisioning, architecture visualization, data generation, and cleanup -- no CLI required.

---

## Architecture

```
User (chat UI)
    |
    v
React frontend  [port 3000]  (Vite, TypeScript, Vercel AI SDK)
    |
    v
Express.js API  [port 3001]  (Databricks auth, chat proxy)
    |
    v
MLflow AgentServer  [port 8000]
    |
    +-- LangGraph agent (LangChain tools + Claude via Databricks Model Serving)
    |       |-- UC Functions (SQL)       --> SQL Warehouse
    |       |-- Stored Procedures        --> Unity Catalog
    |       |-- Genie MCP               --> NL-to-SQL
    |       +-- Knowledge Assistant      --> RAG over PDFs
    |
    +-- Lakebase (Postgres 16)
```

---

## The Six Bricks

| Brick | What it does |
|-------|-------------|
| **Agent** | LangGraph orchestrator -- reasons over requests, picks the right tool |
| **UC Functions (SQL)** | Governed, versioned SQL functions the agent calls for precise queries |
| **Genie MCP** | Natural language to SQL -- ask in plain English, get structured results |
| **Knowledge Assistant** | RAG-powered answers grounded in your PDFs and documents |
| **Data Layer** | Unity Catalog tables, UC functions, stored procedures -- all auto-provisioned |
| **Chat App** | Streaming React frontend + Express API, pre-wired to the agent |

---

## Quick Start

### 1. Install dependencies

**Python** -- requires [uv](https://docs.astral.sh/uv/getting-started/installation/):

```bash
uv sync
```

> Fallback (without uv): `pip install -r requirements.txt`

**Visual app** (optional) -- requires [Node.js](https://nodejs.org/) v18+:

```bash
cd visual && bash start.sh
```

### 2. Configure environment

```bash
cp conf/.env.example .env.local
./scripts/sh/setup_dbx_env.sh
```

The guided setup walks through every required env var and provisions Databricks resources interactively. To check status without making changes:

```bash
./scripts/sh/setup_dbx_env.sh --check
```

### 3. Provision data

```bash
uv run python data/init/create_all_assets.py
```

Auto-creates UC schema, Delta tables, UC functions, and stored procedures.

### 4. Run locally

```bash
./scripts/sh/start_local.sh
```

Boots the backend (8000), Node API (3001), and frontend (3000).

### 5. Deploy

```bash
./run deploy
```

Validates, syncs config, bundles, deploys to Databricks Apps, and applies grants.

---

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `agent/` | LangGraph agent, MLflow server, Genie capture |
| `app/` | Full-stack chat app (React + Express + shared packages) |
| `tools/` | LangChain tool functions the agent can call |
| `data/default/` | Shipped airport-ops data (CSV, DDL, functions, procedures) |
| `data/gen/` | Synthetic data generation (LLM-powered wizard) |
| `conf/` | Env template, KA configs, prompt templates |
| `visual/` | Architecture viz + setup + data gen + cleanup UI |
| `eval/` | MLflow GenAI eval pipeline with custom LLM judge |
| `deploy/` | Deployment pipeline (Databricks Asset Bundles) |
| `scripts/` | Setup, local dev, KA management |
| `docs/` | Overview, guide, build flow |

See [`docs/Build & setup flow.md`](docs/Build%20&%20setup%20flow.md) for the full technical walkthrough.

---

## Evaluation

BrickForge includes an MLflow-based eval pipeline (`eval/run_eval.py`) that runs baseline vs with-guideline comparisons using a custom Claude LLM judge. Ships with 13 curated test questions for the reference domain.

---

## Make It Yours

1. **Fork** this repo
2. **Swap the domain** -- replace the flight-ops data, prompts, and tools with your own
3. **Add tools** -- one file per tool, register in `agent/agent.py`
4. **Deploy** -- `./run deploy` ships it to Databricks Apps

The flight-ops scenario is just a starting point. BrickForge is designed to be rewritten, not just configured.

---

## License

MIT
