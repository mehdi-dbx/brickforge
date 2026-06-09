<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/logo-dark.svg?v=2">
  <img alt="BrickForge" src="https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/docs/assets/logo-light.svg?v=2" width="100%">
</picture>

---

**Build and deploy production AI agents on Databricks in minutes.**

[![PyPI](https://img.shields.io/pypi/v/brickforge)](https://pypi.org/project/brickforge/)
[![Website](https://img.shields.io/badge/website-brickforge.dev-red)](https://brickforge.dev)

> **Beta** - BrickForge is under active development. APIs and features may change.

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
> This downloads the pre-built wheel directly from GitHub, no proxy, no resolution delay.

---

## How It Works

| Step | What happens |
|------|-------------|
| **1. Connect** | Authenticate to any Databricks workspace via one-click OAuth. Token stored in OS keychain, never on disk. |
| **2. Generate** | Describe your domain in plain English. AI generates table schemas, synthetic data, SQL functions, stored procedures, system prompts, and a knowledge base. |
| **3. Wire** | Pick a Foundation Model endpoint. Connect Genie, KA, Vector Search, APIs, MCP servers, or other agents. Toggle features. |
| **4. Deploy** | One click. Bundles code + config + chat UI, deploys to Databricks Apps, auto-grants all UC permissions. |
| **5. Iterate** | Save projects, export as `.forge` bundles, share with colleagues. Push to GitHub. Clean up when done. |

---

## 18 Setup Blocks

Every resource your agent needs, covered by a visual step:

`Workspace` `SQL Warehouse` `Unity Catalog` `Data Tables` `Functions` `Model Endpoint` `Agent Prompt` `Genie Space` `Agent Bricks` `Vector Search` `MCP Servers` `REST APIs` `A2A Agents` `Features` `Lakebase` `MLflow` `Deploy` `GitHub`

Each block follows the same pattern: **choose** an approach, **configure**, **execute**, **done**.

---

## Capabilities

| Tool | How it works | Discovery |
|------|-------------|-----------|
| **UC Functions** | Auto-discovered from your schema. Parameterized SQL queries as callable tools. | Auto |
| **Stored Procedures** | `CALL proc(params)` for data mutations. Update records, trigger workflows. | Auto |
| **Genie MCP** | Natural-language questions translated to SQL via Databricks Genie. | Config |
| **Knowledge Assistant** | RAG over uploaded documents. Grounded answers with citations. | Toggle |
| **Vector Search** | Semantic document retrieval via Databricks Vector Search index. | Config |
| **External APIs** | REST calls via UC connections or direct HTTP. GET, POST, PUT, DELETE. | Config |
| **MCP Servers** | Any MCP-compatible tool server. Weather, Slack, custom services. | Config |
| **A2A Agents** | Delegate to remote agents via Google A2A protocol (JSON-RPC). | Config |
| **Charts** | Generate bar, line, area, and pie charts inline in chat. | Toggle |
| **Memory** | Per-user long-term memory. Save, recall, delete across sessions. | Toggle |
| **Custom Tools** | Drop a Python file with `@tool` functions into `tools/`. Auto-loaded. | Auto |

---

## Architecture

```
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

## Portable Agents

Every agent you build is fully portable. Export it, version it, share it, deploy it to any workspace, or take over the code entirely.

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
| `agent/` | LangGraph agent runtime (agent.py, start_server.py, memory) |
| `app/` | Chat UI (Node.js monorepo: React client + Express server) |
| `tools/` | Dynamic tool loading (UC functions, KA, API, A2A, MCP, charts) |
| `data/` | Seed data (demo/) + AI data generation wizard (gen/) |
| `deploy/` | Bundle build + SDK deploy + grant scripts |
| `conf/` | Agent prompt, KA configs |
| `eval/` | MLflow GenAI eval pipeline with custom LLM judge |
| `visual/` | Setup App React frontend (Vite + TypeScript) |
| `lib/` | Config provider, env utils, SSE streaming, project paths |

---

<p align="center">
  <a href="https://brickforge.dev">brickforge.dev</a>
  &nbsp;&middot;&nbsp;
  <a href="https://pypi.org/project/brickforge/">PyPI</a>
  &nbsp;&middot;&nbsp;
  MIT License
</p>
