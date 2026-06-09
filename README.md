<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/logo-dark.svg?v=2">
  <img alt="BrickForge" src="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/logo-light.svg?v=2" width="100%">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/architecture-dark.svg">
  <img alt="Architecture" src="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/architecture-light.svg" width="100%">
</picture>

---

## What is BrickForge?

BrickForge is an open-source accelerator that turns Databricks into a complete agentic AI platform. It ships a working reference app (flight operations), a full data layer, and a visual setup experience -so you can **fork it, swap in your domain, and deploy**.

The insight is simple: most agentic apps share the same architecture. The LLM reasons, tools fetch data, a frontend streams responses. What changes is the domain. BrickForge packages everything that stays the same into a templatable, extensible framework -and lets you focus on what makes your app unique.

---

## Why BrickForge

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/bricks-dark.svg">
  <img alt="The Six Bricks" src="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/bricks-light.svg" width="100%">
</picture>

---

## Quick Start

```bash
pip install brickforge
brickforge
```

Opens the Setup App at `http://localhost:9000`. Walk through the setup blocks to connect, configure, generate data, and deploy.

> $\textcolor{red}{\textsf{Behind Databricks VPN? (note for Bricksters)}}$ The corporate VPN may route pip traffic through an internal proxy that lags behind PyPI. If `pip install brickforge` hangs or installs an old version, install directly from the GitHub release instead:
>
> ```bash
> pip install https://github.com/mehdi-dbx/brickforge/releases/download/latest/brickforge-latest-py3-none-any.whl
> ```
>
> This downloads the pre-built wheel directly from GitHub -no proxy, no resolution delay.

---

## Agent Tools

Every tool is auto-discovered, dynamically loaded, and feature-gated. No hardcoding.

| Tool | How it works | Discovery |
|------|-------------|-----------|
| UC Functions | Auto-discovered from your schema. Parameterized SQL queries as callable tools. | Auto |
| Stored Procedures | `CALL proc(params)` for data mutations. Update records, trigger workflows. | Auto |
| Genie MCP | Natural-language questions translated to SQL via Databricks Genie. | Config |
| Knowledge Assistant | RAG over uploaded documents. Grounded answers with citations. | Toggle |
| Vector Search | Semantic document retrieval via Databricks Vector Search index. | Config |
| External APIs | REST calls via UC connections or direct HTTP. GET, POST, PUT, DELETE. | Config |
| MCP Servers | Any MCP-compatible tool server. Weather, Slack, custom services. | Config |
| A2A Agents | Delegate to remote agents via Google A2A protocol (JSON-RPC). | Config |
| Charts | Generate bar, line, area, and pie charts inline in chat. | Toggle |
| Memory | Per-user long-term memory. Save, recall, delete across sessions. | Toggle |
| Custom Tools | Drop a Python file with `@tool` functions into `tools/`. Auto-loaded. | Auto |

---

## Portable Agents

Every agent you build is fully portable. Export it, version it, share it, deploy it to any workspace.

**`.forge` Bundles** - Your entire agent in one file. Config, data schemas, SQL functions, stored procedures, system prompt, knowledge base, all packaged as a portable `.forge.zip`.
- Design locally, export, deploy to a different workspace
- Share with a customer, partner, or team
- Store as versioned snapshots, roll back anytime

**GitHub Export** - Push your agent to a private GitHub repo in one click. All generated code is yours.
- Full agent source: LangGraph runtime, tool definitions, SQL functions, prompts
- Config as code: `config.json` with all wiring (tokens stripped)
- Vibe code on top with Claude Code, Cursor, or any AI IDE

---

## Use Cases

BrickForge ships with a flight-operations reference agent, but the data gen wizard lets you build for any domain:

| Domain | Example |
|--------|---------|
| **Financial Services** | Portfolio risk, compliance checks, regulatory docs |
| **Healthcare** | Clinical trial tracking, enrollment metrics, protocol retrieval |
| **Retail** | Inventory ops, demand forecasting, supplier APIs |
| **Energy & IoT** | Sensor monitoring, anomaly detection, maintenance dispatch |
| **Your Domain** | Describe it, generate it, deploy it |

---

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `agent/` | LangGraph agent, MLflow server, Genie capture |
| `app/` | Full-stack chat app (React + Express + shared packages) |
| `tools/` | LangChain tool functions the agent can call |
| `data/demo/` | Shipped airport-ops data (CSV, DDL, functions, procedures) |
| `data/gen/` | Synthetic data generation (LLM-powered wizard) |
| `conf/` | Env template, KA configs, prompt templates |
| `visual/` | Architecture viz + setup + data gen + cleanup UI |
| `eval/` | MLflow GenAI eval pipeline with custom LLM judge |
| `deploy/` | Deployment pipeline (Databricks Asset Bundles) |
| `scripts/` | Setup, local dev, KA management |
| `doc/` | Guide, reference, assets |

See [`doc/guide/brickforge-guide.md`](doc/guide/brickforge-guide.md) for the full getting started guide.

---

## Evaluation

BrickForge includes an MLflow-based eval pipeline (`eval/run_eval.py`) that runs baseline vs with-guideline comparisons using a custom Claude LLM judge. Ships with 13 curated test questions for the reference domain.

---

## Make It Yours

1. **Fork** this repo
2. **Swap the domain** -replace the flight-ops data, prompts, and tools with your own
3. **Add tools** -one file per tool, register in `agent/agent.py`
4. **Deploy** -`./run deploy` ships it to Databricks Apps

The flight-ops scenario is just a starting point. BrickForge is designed to be rewritten, not just configured.

---

<p align="center"><sub>MIT License</sub></p>
