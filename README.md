<p align="center">
  <svg width="96" height="96" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 3L29 10.5V21.5L16 29L3 21.5V10.5L16 3Z" fill="#eb1600" opacity="0.12"/>
    <path d="M16 3L29 10.5V21.5L16 29L3 21.5V10.5L16 3Z" stroke="#eb1600" stroke-width="1.5"/>
    <path d="M16 8L24 12.5V19.5L16 24L8 19.5V12.5L16 8Z" fill="#eb1600" opacity="0.35"/>
    <path d="M16 12L21 14.75V19.25L16 22L11 19.25V14.75L16 12Z" fill="#eb1600"/>
  </svg>
</p>

<h1 align="center">Brick<span style="color:#eb1600">Forge</span></h1>

<p align="center">
  <strong>Build production-ready AI agents on Databricks -- in a day, not a month.</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#the-six-bricks">The Bricks</a> &middot;
  <a href="#architecture">Architecture</a> &middot;
  <a href="#make-it-yours">Make It Yours</a> &middot;
  <a href="edu/index.html">Slide Deck</a>
</p>

---

## What is BrickForge?

BrickForge is an open-source accelerator that turns Databricks into a complete agentic AI platform. It ships a working reference app (flight operations), a full data layer, and a visual setup experience -- so you can **fork it, swap in your domain, and deploy**.

The insight is simple: most agentic apps share the same architecture. The LLM reasons, tools fetch data, a frontend streams responses. What changes is the domain. BrickForge packages everything that stays the same into a templatable, extensible framework -- and lets you focus on what makes your app unique.

---

## Why BrickForge

<table>
  <tr>
    <td width="80" align="center">&#9889;</td>
    <td><strong>Ship faster</strong><br/>Auth, streaming, agent wiring, deployment -- already done. You write domain logic, not plumbing.</td>
  </tr>
  <tr>
    <td align="center">&#9878;</td>
    <td><strong>Databricks-native</strong><br/>Runs on Unity Catalog, Genie, Model Serving, Knowledge Assistants, and Databricks Apps. Your data never leaves the platform.</td>
  </tr>
  <tr>
    <td align="center">&#128736;</td>
    <td><strong>Modular by design</strong><br/>Six composable bricks -- swap any piece independently without touching the rest.</td>
  </tr>
  <tr>
    <td align="center">&#128268;</td>
    <td><strong>SDK-first</strong><br/>Every resource created via Databricks SDK and CLI. Reproducible across workspaces and clients.</td>
  </tr>
  <tr>
    <td align="center">&#127912;</td>
    <td><strong>Visual setup</strong><br/>A React-based control plane for provisioning, architecture visualization, data generation, and cleanup.</td>
  </tr>
</table>

---

## The Six Bricks

<table>
  <tr>
    <th align="center" width="160">Brick</th>
    <th>What it does</th>
  </tr>
  <tr>
    <td align="center"><strong>Agent</strong><br/><sub>Orchestrator</sub></td>
    <td>LangGraph agent -- reads your system prompt, reasons over requests, and picks the right tool to call.</td>
  </tr>
  <tr>
    <td align="center"><strong>UC Functions</strong><br/><sub>SQL Tool</sub></td>
    <td>Governed, versioned Unity Catalog functions the agent calls for precise, auditable queries against your Delta tables.</td>
  </tr>
  <tr>
    <td align="center"><strong>Genie MCP</strong><br/><sub>NL-to-SQL</sub></td>
    <td>Natural language to SQL -- ask in plain English, Genie translates and returns structured results.</td>
  </tr>
  <tr>
    <td align="center"><strong>Knowledge Assistant</strong><br/><sub>RAG</sub></td>
    <td>RAG-powered answers grounded in your PDFs and documents, with source citations.</td>
  </tr>
  <tr>
    <td align="center"><strong>Data Layer</strong><br/><sub>Unity Catalog</sub></td>
    <td>Tables, UC functions, stored procedures -- all auto-provisioned from SQL scripts via a single command.</td>
  </tr>
  <tr>
    <td align="center"><strong>Chat App</strong><br/><sub>Frontend</sub></td>
    <td>Streaming React frontend + Express API server, pre-wired to the agent and ready to deploy.</td>
  </tr>
</table>

---

## Architecture

How a message flows through the stack:

<table>
  <tr>
    <td align="center" width="100">
      <strong>User</strong><br/><sub>asks a question</sub>
    </td>
    <td align="center" width="30">&rarr;</td>
    <td align="center" width="100">
      <strong>Chat UI</strong><br/><sub>React frontend</sub>
    </td>
    <td align="center" width="30">&rarr;</td>
    <td align="center" width="100">
      <strong>API Server</strong><br/><sub>auth + routing</sub>
    </td>
    <td align="center" width="30">&rarr;</td>
    <td align="center" width="120">
      <strong>Agent</strong><br/><sub>LLM reasons &amp; routes</sub>
    </td>
    <td align="center" width="30">&rarr;</td>
    <td align="center" width="120">
      <strong>UC Function</strong><br/><sub>precise queries</sub><br/><em>or</em><br/><strong>Genie MCP</strong><br/><sub>NL &rarr; SQL</sub><br/><em>or</em><br/><strong>KA Agent</strong><br/><sub>docs &amp; PDFs</sub>
    </td>
    <td align="center" width="30">&rarr;</td>
    <td align="center" width="100">
      <strong>Delta Tables</strong><br/><sub>Unity Catalog</sub>
    </td>
    <td align="center" width="30">&rarr;</td>
    <td align="center" width="100">
      <strong>Answer</strong><br/><sub>streamed live</sub>
    </td>
  </tr>
</table>

```
React frontend  [3000]  ──>  Express API  [3001]  ──>  MLflow AgentServer  [8000]
                                                          │
                                                          ├── LangGraph agent (Claude via Databricks Model Serving)
                                                          │     ├── UC Functions (SQL)       ──> SQL Warehouse
                                                          │     ├── Stored Procedures        ──> Unity Catalog
                                                          │     ├── Genie MCP               ──> NL-to-SQL
                                                          │     └── Knowledge Assistant      ──> RAG over PDFs
                                                          │
                                                          └── Lakebase (Postgres 16)
```

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

The guided setup walks through every required env var and provisions Databricks resources interactively. To check status:

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

<p align="center"><sub>MIT License</sub></p>
