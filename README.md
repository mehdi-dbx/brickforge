<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/logo-dark.svg">
  <img alt="BrickForge" src="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/logo-light.svg" width="100%">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/architecture-dark.svg">
  <img alt="Architecture" src="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/architecture-light.svg" width="100%">
</picture>

---

## What is BrickForge?

BrickForge is an open-source accelerator that turns Databricks into a complete agentic AI platform. It ships a working reference app (flight operations), a full data layer, and a visual setup experience -- so you can **fork it, swap in your domain, and deploy**.

The insight is simple: most agentic apps share the same architecture. The LLM reasons, tools fetch data, a frontend streams responses. What changes is the domain. BrickForge packages everything that stays the same into a templatable, extensible framework -- and lets you focus on what makes your app unique.

---

## Why BrickForge

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/bricks-dark.svg">
  <img alt="The Six Bricks" src="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/bricks-light.svg" width="100%">
</picture>

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
