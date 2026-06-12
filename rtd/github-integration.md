# GitHub Integration

BrickForge can push your entire agent project to GitHub from the Setup App. No terminal needed.

## OAuth Device Flow

BrickForge uses the GitHub OAuth Device Flow for authentication. This works from localhost with no redirect URL required.

### How it works

1. Click **Connect GitHub** in the Source Control block
2. BrickForge requests a device code from GitHub
3. You see a user code and a link to `https://github.com/login/device`
4. Open the link, enter the code, authorize BrickForge
5. BrickForge polls for the token in the background
6. Token stored in keyring via `get_token_store().set("github.com", token)`

Client ID: `Ov23liqaGLy9v7sWlVsM` (BrickForge GitHub OAuth App - public, not secret)

### API endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/github/status` | GET | Check if GitHub is connected (token in keyring) |
| `/api/github/connect` | POST | Start device flow, returns user_code + verification_uri |
| `/api/github/poll` | GET | Poll for token completion |
| `/api/github/push` | POST | Create repo + push code (SSE streaming) |

Source: `brickforge/lib/github_client.py`

## What gets pushed

BrickForge builds an agent bundle (same as deploy) and pushes it as a git repo:

- Agent runtime code (`agent/`, `tools/`, `data/`)
- System prompt and knowledge base
- Config (`config.json` with tokens stripped)
- Chat UI source and pre-built dist
- `pyproject.toml` + `requirements.txt`
- Generated SQL functions and procedures

### What does NOT get pushed

- Workspace tokens
- Model tokens
- GitHub tokens
- Any secrets from keyring

!!! note
    All tokens are stripped before push. The pushed code is safe for version control.

## Repo creation

On first push, BrickForge:

1. Creates a **private** repo on GitHub via the API
2. Repo name defaults to the project name (can be customized)
3. Initializes with a commit containing the full agent bundle
4. Pushes to `main` branch

On subsequent pushes, BrickForge creates a new commit and pushes to the existing repo.

## Vibe coding on top

The pushed repo is real code - Python, TypeScript, SQL. You can:

1. Clone the repo
2. Open it in your editor
3. Modify the agent logic, tools, prompts, chat UI
4. Set up CI/CD
5. Deploy from your own pipeline instead of the Setup App

BrickForge is the scaffolding. Once you push to GitHub, you graduate to your own codebase and workflow.
