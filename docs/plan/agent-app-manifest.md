# Agent App File Manifest

Which files belong to the **Agent App** (deployed to the Databricks workspace)
vs the **Setup App** (stays local / runs the setup flow).

---

## Agent App (uploaded to workspace on deploy)

| Path | Purpose |
|------|---------|
| `agent/` | Python agent runtime |
| `app/` | React + Express chat app (with pre-built `dist/`) |
| `tools/` | Framework tools only: `sql_executor`, `ka_factory`, `api_factory`, `a2a_factory`, `generate_chart`, `get_current_time`, `tool_factory` |
| `data/default/` | Domain data files (populated from `.forge`) |
| `data/init/` | Provisioning scripts |
| `data/py/` | Shared Python utilities |
| `conf/` | Prompts, KA configs (populated from `.forge`) |
| `eval/` | Framework eval scripts |
| `pyproject.toml` | Python project metadata |
| `requirements.txt` | Pinned Python dependencies |
| `app.yaml` | Generated from `.forge` config |
| `databricks.yml` | Generated from `.forge` config |

---

## Setup App (NOT uploaded to Agent App)

| Path | Purpose |
|------|---------|
| `visual/` | Setup App itself (React + Express) |
| `stash/` | Domain packs (source material for `.forge`) |
| `deploy/` | Deploy scripts (Setup App handles deploy) |
| `scripts/` | Setup and utility scripts |
| `doc/` | Documentation |
| `edu/` | Education / slide decks |
| `.claude/` | Claude Code configuration |
| `setup-app.yaml` | Setup App descriptor |
| `.env.local`, `.env.*` | Local environment files |
| `changes.md` | Changelog |
| `README.md` | Project readme |
