# Plan: Git Push Agent App Code

> Status: PLANNED

## Context

User wants to push the deployed agent app code to GitHub with least friction. The agent app code lives inside `brickforge/` (agent/, tools/, data/, conf/, app/) and gets bundled into a zip for deploy. But there's no standalone repo for the agent app itself -- it's part of the brickforge monorepo.

## Question: what exactly to push?

The "agent app" is the code that runs on Databricks Apps:
- `agent/` -- LangGraph agent, memory, genie capture
- `tools/` -- UC function tools, tool factory, SQL executor
- `lib/` -- config provider, env utils, project paths
- `data/` -- demo data, gen data, init scripts
- `conf/` -- KA output format (prompts are project-scoped)
- `app/` -- chat UI (client + server, Node.js)
- `eval/` -- evaluation scripts
- `requirements.txt` -- pinned deps
- `pyproject.toml` -- package metadata

Plus project-scoped artifacts:
- `projects/{name}/prompt/` -- system prompt, knowledge base
- `projects/{name}/gen/` -- SQL, CSVs, manifests
- `config.json` -- project config (minus tokens)

## Options

### A. Push brickforge branch to GitHub (existing flow)
The `exec-git-push` action already exists in setup.py. It pushes the current state to a Databricks git repo. Could be adapted for GitHub.

### B. Export bundle as a repo
Create a standalone repo from the deploy bundle contents. The bundle already has everything needed. Zip -> extract -> git init -> push.

### C. Push from Setup App UI
Add a "Push to GitHub" button in the deploy block or a new setup block. User enters repo URL, clicks push. Backend creates a clean commit from the bundle contents and pushes.

## Least friction approach

The deploy bundle (`build_agent_bundle()`) already creates a clean zip with exactly the right files. The simplest path:

1. User clicks "Push to GitHub" in Setup App
2. Backend builds the same bundle as deploy
3. Extracts to a temp dir
4. `git init` + `git add` + `git commit` + `git remote add` + `git push`
5. Done

The `exec-git-push` block already exists. It uses `deploy/git_push.py` which pushes to Databricks git credentials. Extend it to support GitHub.

## Finding: Feature Already Exists

> Status: EXISTS -- needs token stripping fix only

`deploy/git_push.py` already implements the full flow:
1. Builds the same bundle as deploy (`build_agent_bundle`)
2. Creates Databricks Git Folder linked to user's repo
3. Uploads all files via workspace API
4. Submits one-shot job to `git add + commit + push`
5. Uses Databricks Git Credentials (Settings > Developer > Git integration)

Setup block "Source Control" exists. User enters repo URL, clicks push.

### One fix needed

`build_agent_bundle` writes `config.json` with the in-memory token. For deploy this is correct (app needs it). For git push, the token would be committed to GitHub. Need to strip `workspace.token` and `model.token` from the config before bundling for git push.

### Files to modify

- `brickforge/deploy/git_push.py` -- strip tokens from config before `build_agent_bundle`
