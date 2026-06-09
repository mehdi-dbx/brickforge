# Plan: Standalone Agent Repo -- Zero-Friction Cloneable Project

> Status: IMPLEMENTED

## Principle

**The developer should never have to do anything the system can do for them.** Every step that doesn't require human judgment should be automated. The gap between "I cloned this" and "it's running" should be as small as physically possible.

## Context

When a user pushes their BrickForge agent project to GitHub, the resulting repo must be a self-contained, runnable project. Today it's broken: no start script, compressed frontend, wrong package name, dead entry points, no auth guidance. A developer cloning it hits a wall at every step.

## Current state (what gets pushed)

`push_bundle()` calls `build_agent_bundle()` which ships:
- `agent/`, `tools/`, `lib/`, `data/`, `conf/`, `eval/` -- flat Python dirs
- `app/client/dist.tar.gz`, `app/server/dist.tar.gz` -- compressed frontend (not extracted)
- `config.json` -- project config (token stripped)
- `app.yaml` -- Databricks Apps runtime config (references `start.sh` which doesn't exist)
- `databricks.yml` -- resource permissions
- `pyproject.toml` -- from BrickForge parent (wrong package name, broken entry points)
- `requirements.txt` -- pinned deps

`start.sh` is generated inline in `deploy()` and uploaded separately -- never included in the zip or git push.

## What the developer experiences today

1. No README -- no idea what this is or how to run it
2. `pip install -e .` -- empty package, broken entry points (`brickforge.cli` doesn't exist)
3. `app.yaml` says `bash start.sh` -- file doesn't exist
4. Frontend is compressed tarballs -- can't serve without manual extraction
5. No auth -- `config.json` has `token: null`, no guidance on what to set
6. `PYTHONPATH` not set -- bare imports (`from lib.config_provider`) fail
7. `from brickforge.*` imports in some `lib/` files -- crash because no `brickforge` package

## Target state

```
git clone <repo>
cd <repo>
./start_local.sh
# Checks Python >= 3.11, Node.js, ports, auth -- handles everything
# Server starts, chat UI available at http://localhost:3000
```

One command. Zero questions if auth is already configured. Graceful handling of every failure.

## Implementation

All changes are isolated to the **GitHub push path only**. The deploy path and Setup App are untouched.

### Where changes happen

| File | What changes | Deploy affected? | Setup App affected? |
|------|-------------|-----------------|-------------------|
| `brickforge/lib/github_client.py` | `push_bundle()` post-processes tmpdir before git add | NO | NO |
| `brickforge/routes/setup.py` | `github_push` endpoint passes config to `push_bundle` | NO | NO |

**No changes to `build_agent_bundle()`.** All post-processing happens in `push_bundle()` after zip extraction to tmpdir, before `git add`. This keeps the deploy bundle completely untouched.

### Callers of `build_agent_bundle()` (unchanged)

1. `deploy_agent_app.py:293` -- deploy flow. **Unaffected.**
2. `routes/setup.py:514` -- GitHub push. Calls `build_agent_bundle` as before, then passes zip to `push_bundle`.
3. `deploy/git_push.py:198` -- legacy Databricks git push. **Unaffected.**

### What `push_bundle()` does after zip extraction (NEW)

After extracting the bundle zip to tmpdir (already happens today), and before `git add`, add these steps:

#### 0. Set file permissions

```python
for script in ["start_local.sh", "start.sh"]:
    path = os.path.join(tmpdir, script)
    if os.path.exists(path):
        os.chmod(path, 0o755)
```

Git tracks the execute bit. Without this, `./start_local.sh` fails with "Permission denied" after clone.

#### 1. Extract tarballs

```python
# In tmpdir after zip extraction
for tgz in ["app/client/dist.tar.gz", "app/server/dist.tar.gz"]:
    tgz_path = os.path.join(tmpdir, tgz)
    if os.path.exists(tgz_path):
        tarfile.open(tgz_path).extractall(os.path.dirname(tgz_path))
        os.remove(tgz_path)
```

#### 2. Strip Setup App-only files from lib/

These files have `from brickforge.*` imports and are never used by the agent runtime:

```python
STRIP_FROM_PUSH = [
    "lib/bridge_oauth.py",   # Setup App inline OAuth
    "lib/env_utils.py",      # Setup App subprocess env builder
    "lib/sse.py",            # Setup App SSE streaming
    "lib/graph_builder.py",  # Setup App DAG builder
    "lib/token_store.py",    # Setup App keyring integration
    "lib/github_client.py",  # Setup App GitHub push (meta: this file itself)
    "lib/config_json.py",    # Setup App config JSON migration
]
```

**Verified safe:** Agent runtime imports only `lib/config_provider.py`, `lib/project_paths.py`, and `lib/export_config_env.py`. No other `lib/` files are touched by `agent/`, `tools/`, or `data/` code.

#### 3. Generate `start_local.sh`

Robust local dev script with pre-flight checks. Handles every failure gracefully so the developer never hits a cryptic error.

```bash
#!/bin/bash
set -e
cd "$(dirname "$0")"

# ── Pre-flight checks ──────────────────────────────────────────────────────

# 1. Python version check (>= 3.11 required)
PYTHON=""
for cmd in python3.11 python3 python; do
    if command -v "$cmd" &>/dev/null; then
        ver=$("$cmd" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null)
        major=$(echo "$ver" | cut -d. -f1)
        minor=$(echo "$ver" | cut -d. -f2)
        if [ "$major" -ge 3 ] && [ "$minor" -ge 11 ]; then
            PYTHON="$cmd"
            break
        fi
    fi
done
if [ -z "$PYTHON" ]; then
    echo "[x] Python 3.11+ is required but not found."
    echo "    Install it from https://www.python.org/downloads/"
    exit 1
fi
echo "[+] Using $PYTHON ($ver)"

# 2. Node.js check (required for chat UI)
if ! command -v node &>/dev/null; then
    echo "[x] Node.js is required for the chat UI but not found."
    echo "    Install it from https://nodejs.org/ (v20+ recommended)"
    exit 1
fi
NODE_VER=$(node -v 2>/dev/null)
echo "[+] Node.js $NODE_VER"

# 3. Port checks (8000 = agent server, 3000 = chat UI)
for PORT in 8000 3000; do
    PID=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PID" ]; then
        echo "[!] Port $PORT is in use (PID $PID)"
        read -p "    Kill it? (Y/n): " KILL
        if [ "$KILL" != "n" ] && [ "$KILL" != "N" ]; then
            kill -9 $PID 2>/dev/null
            sleep 1
            echo "[+] Killed process on port $PORT"
        else
            if [ "$PORT" = "8000" ]; then
                echo "[~] Will try next available port for agent server"
                export AGENT_PORT=8001
            else
                echo "[~] Will try next available port for chat UI"
                export CHAT_APP_PORT=3001
            fi
        fi
    fi
done

# ── Auth ───────────────────────────────────────────────────────────────────
#
# Auth resolution order:
#   1. DATABRICKS_TOKEN env var (already set by user)
#   2. Existing CLI profile in ~/.databrickscfg matching the workspace host
#      -> use `databricks auth token` to get a short-lived OAuth token
#   3. No profile exists -> offer to create one via `databricks auth login`
#   4. Fallback: manual PAT paste
#
# Note: `databricks auth login` uses OAuth (no PAT stored in file).
# We use `databricks auth token --host $HOST` to resolve a short-lived token
# from the OAuth session. This token is ephemeral (env var only, never on disk).

# 4. Read host from config.json
HOST=$($PYTHON -c "import json; print(json.load(open('config.json')).get('workspace',{}).get('host',''))" 2>/dev/null)
if [ -z "$HOST" ]; then
    echo "[x] No workspace host found in config.json"
    echo "    Set workspace.host in config.json and re-run."
    exit 1
fi
echo "[~] Workspace: $HOST"

# 5. Resolve token
if [ -z "$DATABRICKS_TOKEN" ]; then
    # Check if a CLI profile exists for this host
    PROFILE=$($PYTHON -c "
import configparser, os
cfg = configparser.ConfigParser()
cfg.read(os.path.expanduser('~/.databrickscfg'))
host = '$HOST'.rstrip('/')
for s in cfg.sections():
    if cfg.get(s, 'host', fallback='').rstrip('/') == host:
        print(s)
        break
" 2>/dev/null)

    if [ -n "$PROFILE" ]; then
        # Profile exists -- get a short-lived token from the OAuth session
        echo "[~] Found CLI profile: $PROFILE"
        TOKEN=$(databricks auth token --host "$HOST" -o json 2>/dev/null | $PYTHON -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
        if [ -n "$TOKEN" ]; then
            export DATABRICKS_TOKEN="$TOKEN"
            echo "[+] Token loaded from CLI profile"
        else
            echo "[!] CLI profile expired. Re-authenticating..."
            databricks auth login --host "$HOST"
            TOKEN=$(databricks auth token --host "$HOST" -o json 2>/dev/null | $PYTHON -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
            if [ -n "$TOKEN" ]; then
                export DATABRICKS_TOKEN="$TOKEN"
                echo "[+] Token refreshed"
            else
                echo "[x] Auth failed. Try: export DATABRICKS_TOKEN=<your-token>"
                exit 1
            fi
        fi
    else
        # No profile -- offer to create one
        echo ""
        echo "[!] No authentication configured for $HOST"
        echo ""
        echo "    Options:"
        echo "    1) Create a CLI profile (recommended -- opens browser for OAuth)"
        echo "    2) Paste a Personal Access Token manually"
        echo ""
        read -p "    Choose (1/2): " AUTH_CHOICE

        if [ "$AUTH_CHOICE" = "1" ]; then
            # Check if Databricks CLI is installed
            if ! command -v databricks &>/dev/null; then
                echo ""
                echo "[x] Databricks CLI not found."
                echo "    Install: brew install databricks/tap/databricks"
                echo "    Or:      curl -fsSL https://raw.githubusercontent.com/databricks/setup-cli/main/install.sh | sh"
                echo ""
                read -p "    Try installing now? (Y/n): " INSTALL
                if [ "$INSTALL" != "n" ] && [ "$INSTALL" != "N" ]; then
                    curl -fsSL https://raw.githubusercontent.com/databricks/setup-cli/main/install.sh | sh
                    if ! command -v databricks &>/dev/null; then
                        echo "[x] Installation failed. Install manually and re-run."
                        exit 1
                    fi
                else
                    echo "[x] Cannot continue without auth. Exiting."
                    exit 1
                fi
            fi
            echo "[~] Creating CLI profile for $HOST..."
            echo "    A browser window will open for authentication."
            echo ""
            databricks auth login --host "$HOST"
            # Get token from new profile
            TOKEN=$(databricks auth token --host "$HOST" -o json 2>/dev/null | $PYTHON -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
            if [ -n "$TOKEN" ]; then
                export DATABRICKS_TOKEN="$TOKEN"
                echo "[+] Profile created and token loaded"
            else
                echo "[x] Profile created but token retrieval failed."
                echo "    Try: export DATABRICKS_TOKEN=<your-token> && ./start_local.sh"
                exit 1
            fi
        elif [ "$AUTH_CHOICE" = "2" ]; then
            echo -n "    Token: "
            read -s TOKEN
            echo ""
            if [ -z "$TOKEN" ]; then
                echo "[x] Empty token. Exiting."
                exit 1
            fi
            export DATABRICKS_TOKEN="$TOKEN"
        else
            echo "[x] Invalid choice. Exiting."
            exit 1
        fi
    fi
fi

# 6. Validate token
echo -n "[~] Verifying connection..."
HTTP_CODE=$($PYTHON -c "
import urllib.request, os
req = urllib.request.Request('$HOST/api/2.0/preview/scim/v2/Me',
    headers={'Authorization': 'Bearer ' + os.environ['DATABRICKS_TOKEN']})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        print(r.status)
except Exception as e:
    print(getattr(e, 'code', 0))
" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo " ok"
else
    echo " failed (HTTP $HTTP_CODE)"
    echo "[x] Token is invalid or expired for $HOST"
    echo "    Re-run this script to re-authenticate."
    exit 1
fi

# ── Venv + deps ────────────────────────────────────────────────────────────

if [ ! -d .venv ]; then
    echo "[~] Creating virtual environment..."
    $PYTHON -m venv .venv
    . .venv/bin/activate
    echo "[~] Installing dependencies (this may take a few minutes)..."
    pip install -q -r requirements.txt
else
    echo "[~] Activating virtual environment..."
    . .venv/bin/activate
fi

# ── Start ──────────────────────────────────────────────────────────────────

# Core paths
export PYTHONPATH="$(pwd)"
export CONFIG_FILE="$(pwd)/config.json"

# Flatten config.json to env vars (needed for Node.js chat UI)
python lib/export_config_env.py
. /tmp/_env_exports.sh
rm -f /tmp/_env_exports.sh

# Chat UI env vars (normally injected by Databricks Apps runtime via app.yaml)
export API_PROXY="${API_PROXY:-http://localhost:8000/invocations}"
export CHAT_APP_PORT="${CHAT_APP_PORT:-3000}"
export TASK_EVENTS_URL="${TASK_EVENTS_URL:-http://127.0.0.1:${CHAT_APP_PORT}}"
export CHAT_PROXY_TIMEOUT_SECONDS="${CHAT_PROXY_TIMEOUT_SECONDS:-300}"

# MLflow (optional -- enables tracing to Databricks)
export MLFLOW_TRACKING_URI="${MLFLOW_TRACKING_URI:-databricks}"
export MLFLOW_REGISTRY_URI="${MLFLOW_REGISTRY_URI:-databricks-uc}"

echo ""
echo "[+] Starting agent server..."
echo "    Chat UI: http://localhost:${CHAT_APP_PORT}"
echo ""
exec python -c "from agent.start_server import main; main()"
```

**Pre-flight checks:**
1. Python >= 3.11 (tries `python3.11`, `python3`, `python`) -- exits with install URL if not found
2. Node.js -- exits with install URL if not found
3. Ports 8000/3000 -- offers to kill (Y/n) or increment port if declined

**Auth flow (order of resolution):**
1. `DATABRICKS_TOKEN` env var already set -- use it
2. Existing CLI profile in `~/.databrickscfg` matching the configured workspace host -- use `databricks auth token --host -o json` to get short-lived OAuth token (parsed from JSON response)
3. Profile exists but expired -- auto re-auth via `databricks auth login`
4. No profile exists -- offer to create one via `databricks auth login` (opens browser for OAuth)
5. CLI not installed -- offer to install via official installer script (`curl -fsSL ... | sh`)
6. Fallback -- manual PAT paste
7. Token validation -- hits `/api/2.0/preview/scim/v2/Me` to confirm token works before proceeding

**Chat UI env vars** (normally injected by Databricks Apps runtime via `app.yaml`):
- `API_PROXY=http://localhost:8000/invocations` -- where the Node chat UI proxies agent requests
- `CHAT_APP_PORT=3000` -- chat UI listen port
- `TASK_EVENTS_URL=http://127.0.0.1:3000` -- task event listener
- `CHAT_PROXY_TIMEOUT_SECONDS=300` -- proxy timeout
- `MLFLOW_TRACKING_URI=databricks` -- MLflow tracing
- `MLFLOW_REGISTRY_URI=databricks-uc` -- MLflow registry

These are set explicitly in `start_local.sh` since `app.yaml` is only read by the Databricks Apps runtime.

**Key: tokens are always ephemeral (env var only).** `databricks auth login` creates an OAuth profile in `~/.databrickscfg` (no PAT on disk). `databricks auth token` resolves a short-lived token from the OAuth session at runtime. Nothing is written to the repo.

**File permissions:** `start_local.sh` and `start.sh` are `chmod 755` before git add so they're executable after clone.

#### 4. Generate `start.sh`

Extract the inline string from `deploy()` in `deploy_agent_app.py` and write it to tmpdir. This is the Databricks Apps boot script -- different from `run.sh`.

#### 5. Rewrite `pyproject.toml`

Replace the BrickForge parent `pyproject.toml` with a minimal one:

```toml
[project]
name = "{project_name}"
version = "1.0.0"
requires-python = ">=3.11"
```

No entry points (use `run.sh` instead). Project name from config `app.name` or repo name.

#### 6. Generate `README.md`

```markdown
# {project_name}

Databricks AI agent application.

## Quick Start

    ./start_local.sh

The script checks prerequisites (Python 3.11+, Node.js), handles authentication,
installs dependencies, and starts the server.

Chat UI will be available at http://localhost:3000

## Configuration

All settings are in `config.json`:
- Workspace: {host}
- Schema: {schema}
- Model: {model_endpoint}

## Notes

- Chat history is stored in memory and lost on restart (no database in local mode)
- Authentication uses a short-lived OAuth token resolved at startup -- re-run the script if it expires

## Deploy to Databricks Apps

    pip install brickforge
    brickforge
```

#### 7. Generate `.gitignore`

```
.venv/
__pycache__/
*.pyc
.env.local
.DS_Store
brickforge.egg-info/
```

### Passing config to push_bundle

`push_bundle()` currently receives `(token, repo_url, bundle_zip)`. It needs config data for README generation (host, schema, model, project name). Two options:

- **A.** Pass config dict as new param: `push_bundle(token, repo_url, bundle_zip, config=None)`
- **B.** Read config.json from the extracted zip (it's already in the bundle)

**Choice: B.** No signature change needed. After extraction, `json.load(open(tmpdir/config.json))` gives us everything. Zero impact on callers.

## Regression guard

- `build_agent_bundle()` -- **NOT MODIFIED**. All 3 callers continue to work identically.
- `push_bundle()` signature -- **NOT MODIFIED**. The one caller (`routes/setup.py:518`) works identically.
- Deploy flow -- **NOT AFFECTED**. `deploy()` in `deploy_agent_app.py` is untouched.
- Setup App routes -- **NOT AFFECTED**. Only `github_push` SSE endpoint calls `push_bundle`, and its behavior is unchanged from the caller's perspective.
- Frontend -- **NOT AFFECTED**. No frontend changes.

## What the developer does NOT need to know

- What BrickForge is
- What `PYTHONPATH` is
- That tarballs need extracting
- What `app.yaml` or `databricks.yml` are for
- How to set 7 env vars
- That `pyproject.toml` had wrong entry points

## Open questions

1. Should we write the token back to `config.json` after prompting, or keep it ephemeral (env var only)?
2. Should the README mention BrickForge at all, or be fully standalone?
