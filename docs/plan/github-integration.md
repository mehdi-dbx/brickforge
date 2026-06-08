# Plan: GitHub Integration -- Create Repo & Push from BrickForge

> Status: PLANNED

## Context

User wants to push their agent app code to GitHub from within BrickForge. Current flow requires manual steps outside the app (configure Databricks git credentials, create repo on GitHub manually, paste URL). We want: one-click -- BrickForge connects to GitHub, creates the repo, pushes the code.

## User journey

1. User clicks Source Control block in Setup
2. First time: "Connect GitHub" -- OAuth flow, user authorizes BrickForge
3. GitHub token stored in keyring (same as workspace tokens)
4. User enters repo name (or accepts default from project name)
5. BrickForge creates the repo on GitHub via API
6. Builds the agent bundle (same as deploy, minus tokens)
7. Pushes to the repo via GitHub API or git
8. Shows repo URL when done

## GitHub Auth

### OAuth Device Flow (simplest for CLI/local apps)

No redirect URL needed. Works from localhost. No server-side OAuth app registration hassle.

1. `POST https://github.com/login/device/code` with `client_id`
2. Returns `user_code` + `verification_uri`
3. User opens `https://github.com/login/device` in browser, enters code
4. BrickForge polls `POST https://github.com/login/oauth/access_token` until authorized
5. Returns `access_token` with `repo` scope
6. Token stored in keyring: `keyring.set_password("brickforge-github", "github.com", token)`

### Requirement: GitHub OAuth App

Need a registered GitHub OAuth App (or use a well-known client_id for device flow). The `client_id` is public (not secret). Can be hardcoded in BrickForge.

Alternatively: user pastes a GitHub PAT manually. Less friction to implement, more friction for the user. Device flow is better UX.

## Create Repo

```python
import urllib.request, json

def create_github_repo(token: str, name: str, private: bool = True) -> str:
    req = urllib.request.Request(
        "https://api.github.com/user/repos",
        data=json.dumps({"name": name, "private": private}).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        repo = json.loads(r.read())
    return repo["clone_url"]
```

## Push Code

Two options:

### A. Git CLI (if available locally)
```bash
cd /tmp/brickforge-push-{name}
# Extract bundle
unzip bundle.zip -d .
git init
git add .
git commit -m "BrickForge: initial push"
git remote add origin https://{token}@github.com/{user}/{name}.git
git push -u origin main
```

Pros: simple, reliable. Cons: needs git installed.

### B. GitHub API (no git needed)
Use the GitHub Contents API or Git Data API to create blobs, trees, and commits programmatically. No local git needed.

Pros: works everywhere. Cons: more complex, slow for many files.

### Recommendation: Git CLI with GitHub API fallback

Check if `git` is available. If yes, use it (fast, reliable). If not, use the API.

## Storage

- GitHub token: `keyring.set_password("brickforge-github", "github.com", token)` (same TokenStore pattern)
- GitHub username: derived from token via `GET /user`
- Last pushed repo URL: stored in project config

## Backend

### New endpoints in `routes/setup.py` or `routes/auth.py`:

- `POST /api/github/connect` -- start device flow, return user_code + verification_uri
- `GET /api/github/poll` -- poll for token completion
- `GET /api/github/status` -- check if GitHub is connected (token in keyring)
- `POST /api/github/push` -- create repo (if needed) + push code (SSE streaming)

### New module: `brickforge/lib/github_client.py`

- `start_device_flow(client_id)` -> user_code, device_code, verification_uri
- `poll_device_flow(client_id, device_code)` -> access_token (or pending)
- `get_user(token)` -> username
- `create_repo(token, name, private)` -> clone_url
- `push_bundle(token, repo_url, bundle_zip)` -- git CLI or API

## Frontend

### Source Control block in SetupDrawer:

**Not connected:**
- "Connect GitHub" button
- On click: starts device flow, shows user_code + link to github.com/login/device
- Polls for completion
- On success: stores token, shows "Connected as {username}"

**Connected:**
- Shows "Connected as {username}" with green dot
- Repo name input (default: project name)
- "Create & Push" button
- Terminal output showing progress

## Files

| File | Change |
|------|--------|
| `brickforge/lib/github_client.py` | NEW: device flow, create repo, push |
| `brickforge/routes/setup.py` | GitHub endpoints + exec-git-push update |
| `visual/frontend/src/setupSteps.ts` | Update Source Control choices |
| `visual/frontend/src/components/SetupDrawer.tsx` | GitHub connect UI + push UI |

## Open questions

1. ~~Do we need a registered GitHub OAuth App for device flow?~~ DONE. client_id: `Ov23liqaGLy9v7sWlVsM` (registered under mehdi-dbx, homepage: brickforge.dev)
2. Private or public repo default? Private.
3. Should we support GitHub Enterprise? Not initially.
4. What about GitLab? Separate flow, separate plan. GitHub first.
