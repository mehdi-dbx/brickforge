X`# BrickForge Bridge Auth

> One terminal paste. Zero token copy. Works cross-account.

---

## Problem

Setup App runs in a cloud container. User's Databricks CLI runs on their laptop. The container can't reach the CLI. The CLI can't reach the container. The user is the bridge.

## Solution

A local script that the user runs once. It authenticates via the CLI (which has browser access for OAuth), then sends the token back to the Setup App over HTTPS.

## Flow

```
Setup App (cloud)                    User's Terminal (local)
    |                                        |
    |  1. Shows one-liner + copy button      |
    |  "Run this in your terminal:"          |
    |  [npx brickforge-connect <app-url>]    |
    |                                        |
    |                                   2. User pastes, runs
    |                                        |
    |                                   3. Script calls:
    |                                      databricks auth login --host <ws-b>
    |                                        |
    |                                   4. Browser opens -> SSO on workspace B
    |                                      (localhost redirect works locally)
    |                                        |
    |                                   5. CLI gets token
    |                                        |
    |  6. POST /api/auth/receive     <---------- Script sends token over HTTPS
    |                                        |
    |  7. Token stored in config             |
    |     UI updates: "Connected to ws-b"    |
    |                                        |
```

## Setup App Side

### Backend Endpoint

```javascript
// POST /api/auth/receive - receives token from local bridge script
app.post('/api/auth/receive', express.json(), (req, res) => {
  const { host, token, user } = req.body
  if (!host || !token) return res.status(400).json({ error: 'host and token required' })

  // Store in config
  config.setMany({
    DATABRICKS_HOST: host,
    DATABRICKS_TOKEN: token,
  })

  // Notify waiting frontend via SSE or flag
  authBridgeState = { status: 'connected', host, user, time: Date.now() }

  res.json({ ok: true })
})

// GET /api/auth/bridge-status - frontend polls this
app.get('/api/auth/bridge-status', (_req, res) => {
  res.json(authBridgeState || { status: 'waiting' })
})
```

### Frontend UI (in SetupDrawer)

When user picks "connect via terminal" for host/auth step:

```
  Connect to external workspace
  ─────────────────────────────────────────
  Run this in your terminal:

  ┌──────────────────────────────────────┐
  │ npx brickforge-connect <app-url>    │ [Copy]
  └──────────────────────────────────────┘

  [....] Waiting for connection...

  (Setup App will update automatically
   when the script completes)
```

When token arrives:

```
  [+] Connected to https://workspace-b.cloud.databricks.com
      as mehdi.lamrani@databricks.com
```

## Local Script

### `scripts/connect.sh`

```bash
#!/bin/bash
# BrickForge Bridge Auth - connects local CLI to cloud Setup App
set -e

APP_URL="${1:?Usage: bash connect.sh <setup-app-url>}"
APP_URL="${APP_URL%/}"

echo "BrickForge Bridge Auth"
echo "======================"

# 0. Ensure Databricks CLI is installed
if ! command -v databricks &>/dev/null; then
  echo "[~] Databricks CLI not found. Installing..."
  OS="$(uname -s 2>/dev/null || echo Windows)"
  case "$OS" in
    Darwin)
      if command -v brew &>/dev/null; then
        brew tap databricks/tap && brew install databricks
      else
        curl -fsSL https://raw.githubusercontent.com/databricks/setup-cli/main/install.sh | sh
      fi
      ;;
    Linux)
      curl -fsSL https://raw.githubusercontent.com/databricks/setup-cli/main/install.sh | sh
      ;;
    MINGW*|MSYS*|CYGWIN*|Windows)
      # Windows (Git Bash / MSYS2 / WSL)
      if command -v winget &>/dev/null; then
        winget install Databricks.DatabricksCLI
      elif command -v pip &>/dev/null; then
        pip install databricks-cli --quiet
      else
        echo "[x] Install CLI manually: https://docs.databricks.com/dev-tools/cli/install"
        exit 1
      fi
      ;;
    *)
      echo "[x] Unknown OS. Install CLI manually: https://docs.databricks.com/dev-tools/cli/install"
      exit 1
      ;;
  esac
  echo "[+] Databricks CLI installed"
fi
echo "[+] CLI: $(databricks --version 2>/dev/null || echo 'installed')"

# 1. Get target workspace
read -p "Target workspace URL: " WS_HOST
WS_HOST="${WS_HOST%/}"

# 2. Auth via CLI (opens browser)
echo "[~] Authenticating to ${WS_HOST}..."
databricks auth login --host "$WS_HOST"

# 3. Get token
TOKEN=$(databricks auth token --host "$WS_HOST" 2>/dev/null)
if [ -z "$TOKEN" ]; then
  echo "[x] Failed to get token"
  exit 1
fi

# 4. Get user info
USER=$(databricks auth describe --host "$WS_HOST" 2>/dev/null | grep -i user | head -1 | awk '{print $NF}')

# 5. Send to Setup App
echo "[~] Sending token to Setup App..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${APP_URL}/api/auth/receive" \
  -H "Content-Type: application/json" \
  -d "{\"host\":\"${WS_HOST}\",\"token\":\"${TOKEN}\",\"user\":\"${USER}\"}")

if [ "$HTTP_CODE" = "200" ]; then
  echo "[+] Connected! Setup App has your token."
  echo "[+] You can close this terminal."
else
  echo "[x] Failed to send token (HTTP ${HTTP_CODE})"
  echo "[~] Paste this token manually in the Setup App:"
  echo "    ${TOKEN}"
fi
```

### `npx` Alternative

Package as `brickforge-connect` on npm:

```javascript
#!/usr/bin/env node
const { execSync } = require('child_process')
const https = require('https')

const appUrl = process.argv[2]
if (!appUrl) { console.error('Usage: npx brickforge-connect <setup-app-url>'); process.exit(1) }

// Same flow as bash script but cross-platform
```

### Curl One-Liner (No Install)

```bash
curl -sL https://raw.githubusercontent.com/mehdi-dbx/brickforge/main/scripts/connect.sh | bash -s -- https://brickforge-setup-xxx.aws.databricksapps.com
```

## Security

### Defense in Depth

1. **HTTPS** -- encrypted in transit (baseline)
2. **Nonce** -- one-time session key, prevents unauthorized POSTs, expires in 5 minutes
3. **Payload encryption** -- token encrypted with nonce as key before sending. Never travels in cleartext, not even over HTTPS. Not visible in `ps aux`, not in server access logs.
4. **Short-lived token** -- script generates a 1-hour PAT instead of forwarding the OAuth token
5. **User-initiated** -- explicit action, no background automation

### Nonce as Encryption Key

The nonce serves double duty: auth (proves the POST came from the right script) and encryption key (protects the token payload).

```
Setup App                              Local Script
    |                                      |
    |  generate nonce (32 bytes random)    |
    |  store server-side (expires 5 min)   |
    |                                      |
    |  nonce embedded in download -------->|
    |                                      |
    |                            encrypt(token, nonce) = ciphertext
    |                                      |
    |  POST { ciphertext, nonce_id } <-----|
    |                                      |
    |  lookup nonce by id                  |
    |  decrypt(ciphertext, nonce) = token  |
    |  delete nonce (single use)           |
```

### Script-Side Encryption (bash + openssl)

```bash
# Encrypt token with nonce as AES-256 key
ENCRYPTED=$(echo -n "$TOKEN" | openssl enc -aes-256-cbc -a -pass "pass:${NONCE}" -pbkdf2 2>/dev/null)

# Send encrypted payload
curl -s -X POST "${APP_URL}/api/auth/receive" \
  -H "Content-Type: application/json" \
  -d "{\"ciphertext\":\"${ENCRYPTED}\",\"nonce_id\":\"${NONCE_ID}\"}"
```

### Server-Side Decryption (Node.js)

```javascript
const crypto = require('crypto')

function decrypt(ciphertext, nonce) {
  // Match openssl enc -aes-256-cbc -pass -pbkdf2 format
  const buf = Buffer.from(ciphertext, 'base64')
  const salt = buf.subarray(8, 16)  // openssl "Salted__" prefix
  const ct = buf.subarray(16)
  const keyIv = crypto.pbkdf2Sync(nonce, salt, 10000, 48, 'sha256')
  const key = keyIv.subarray(0, 32)
  const iv = keyIv.subarray(32, 48)
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  return decipher.update(ct) + decipher.final('utf8')
}

app.post('/api/auth/receive', express.json(), (req, res) => {
  const { ciphertext, nonce_id } = req.body
  const nonce = pendingNonces.get(nonce_id)
  if (!nonce) return res.status(403).json({ error: 'invalid or expired nonce' })

  const token = decrypt(ciphertext, nonce.value)
  pendingNonces.delete(nonce_id)  // single use

  config.setMany({ DATABRICKS_HOST: nonce.host, DATABRICKS_TOKEN: token })
  authBridgeState = { status: 'connected', host: nonce.host, time: Date.now() }
  res.json({ ok: true })
})
```

### What's Protected

| Threat | Mitigation |
|--------|-----------|
| Token visible in `ps aux` / shell history | Encrypted before curl call |
| Token in server access logs | Only ciphertext in POST body |
| Man-in-the-middle (even with HTTPS compromised) | AES-256 encryption with nonce key |
| Replay attack | Nonce is single-use, deleted after first POST |
| Unauthorized POST | Nonce expires in 5 minutes, must match server-side |
| Token lifetime | 1-hour PAT, not long-lived OAuth token |

## Prerequisites

- Databricks CLI installed locally (`pip install databricks-cli` or `brew install databricks`)
- Terminal access
- Browser for SSO

## Auto-Launch Variant: Downloadable `.command` File

Instead of "copy paste into terminal", the Setup App serves a downloadable script file that auto-opens in Terminal when double-clicked. Zero copy, zero paste.

### Flow

1. User clicks "Connect to workspace" in Setup App
2. Browser downloads `brickforge-connect.command` (macOS) or `.bat` (Windows)
3. File is pre-filled with app URL + nonce -- user doesn't edit anything
4. User double-clicks the file
5. Terminal.app opens, script runs automatically
6. CLI does OAuth (browser opens, SSO login)
7. Token sent back to Setup App over HTTPS
8. Setup App auto-updates. Done.

**One click + one double-click. Zero typing.**

### Backend Endpoint

```javascript
app.get('/api/auth/bridge-script', (req, res) => {
  const nonce = generateNonce()  // store server-side, expires in 5 min
  const appUrl = `https://${req.headers.host}`
  const script = `#!/bin/bash
# BrickForge Bridge Auth
echo "BrickForge - Connect to Workspace"
echo "================================="
read -p "Target workspace URL: " WS
WS="\${WS%/}"
echo "[~] Authenticating to \${WS}..."
databricks auth login --host "\$WS"
TOKEN=\$(databricks auth token --host "\$WS" 2>/dev/null)
if [ -z "\$TOKEN" ]; then
  echo "[x] Failed to get token"; exit 1
fi
USER=\$(databricks auth describe --host "\$WS" 2>/dev/null | grep -i user | head -1 | awk '{print \$NF}')
echo "[~] Sending token to Setup App..."
curl -s -X POST ${appUrl}/api/auth/receive \\
  -H "Content-Type: application/json" \\
  -d "{\\"host\\":\\"\$WS\\",\\"token\\":\\"\$TOKEN\\",\\"user\\":\\"\$USER\\",\\"nonce\\":\\"${nonce}\\"}"
echo "[+] Connected! You can close this window."
`
  res.setHeader('Content-Disposition', 'attachment; filename=brickforge-connect.command')
  res.setHeader('Content-Type', 'application/octet-stream')
  res.send(script)
})
```

### Platform Support

| Platform | File | Behavior |
|----------|------|----------|
| macOS | `.command` | Double-click opens Terminal.app, runs automatically |
| Windows | `.bat` | Double-click opens cmd.exe, runs automatically |
| Linux | `.sh` | Needs `chmod +x` or `bash <file>` -- slightly more friction |

### UI in Setup App

```
  Connect to external workspace
  ────────────────────────────────────────

  [Download Connect Script]     <- downloads .command file

  After downloading, double-click the file.
  Your terminal will open and guide you through authentication.

  [....] Waiting for connection...
```

### Why This Is Better Than Copy-Paste

- No terminal knowledge needed -- user just double-clicks a file
- No clipboard juggling -- token flows back automatically
- Pre-filled with app URL and nonce -- nothing to configure
- Familiar UX -- downloading and opening a file is universal

## Fallback

If user doesn't have CLI:
- Show deep link to `{workspace_b}/#setting/account/token`
- Manual PAT copy/paste (5 steps)
- Animated GIF showing the steps
