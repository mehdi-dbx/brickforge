#!/bin/bash
# BrickForge Bridge Auth - connects local CLI to cloud Setup App
# Usage: bash connect.sh <setup-app-url> <nonce>
#   or: curl -sL <app-url>/api/auth/bridge-script?nonce=<id> | bash
# When served by the Setup App, APP_URL/NONCE/NONCE_ID are pre-filled below.
set -e

# --- Config (replaced by Setup App when served as download) ---
APP_URL="${1:?Usage: bash connect.sh <setup-app-url> <nonce>}"
NONCE="${2:?Usage: bash connect.sh <setup-app-url> <nonce>}"
NONCE_ID="${NONCE}"
APP_URL="${APP_URL%/}"

echo ""
echo "  BrickForge - Connect to Workspace"
echo "  ================================="
echo ""
echo "  [i] App URL:  ${APP_URL}"
echo "  [i] Nonce:    ${NONCE:0:8}..."
echo "  [i] OS:       $(uname -s 2>/dev/null || echo 'unknown')"
echo "  [i] Shell:    $SHELL"
echo ""

# Ensure Databricks CLI is installed
if ! command -v databricks &>/dev/null; then
  echo "  [~] Databricks CLI not found. Installing..."
  OS="$(uname -s 2>/dev/null || echo Windows)"
  case "$OS" in
    Darwin)
      if command -v brew &>/dev/null; then
        echo "  [~] Installing via Homebrew..."
        brew tap databricks/tap && brew install databricks
      else
        echo "  [~] Installing via curl..."
        curl -fsSL https://raw.githubusercontent.com/databricks/setup-cli/main/install.sh | sh
      fi
      ;;
    Linux)
      echo "  [~] Installing via curl..."
      curl -fsSL https://raw.githubusercontent.com/databricks/setup-cli/main/install.sh | sh
      ;;
    MINGW*|MSYS*|CYGWIN*)
      if command -v winget &>/dev/null; then
        echo "  [~] Installing via winget..."
        winget install Databricks.DatabricksCLI
      elif command -v pip &>/dev/null; then
        echo "  [~] Installing via pip..."
        pip install databricks-cli --quiet
      else
        echo "  [x] Cannot install CLI automatically."
        echo "  [x] Install manually: https://docs.databricks.com/dev-tools/cli/install"
        exit 1
      fi
      ;;
    *)
      echo "  [x] Unknown OS: $OS"
      echo "  [x] Install CLI manually: https://docs.databricks.com/dev-tools/cli/install"
      exit 1
      ;;
  esac
  echo "  [+] Databricks CLI installed"
else
  echo "  [+] CLI found: $(which databricks)"
fi
echo "  [+] CLI version: $(databricks --version 2>/dev/null || echo 'unknown')"
echo ""

# Get target workspace
if [ -z "${WS:-}" ]; then
  if [ -t 0 ]; then
    # Interactive terminal -- prompt
    read -p "  Target workspace URL: " WS
  else
    # Piped (curl | bash) -- read from /dev/tty
    echo -n "  Target workspace URL: "
    read WS < /dev/tty
  fi
fi
WS="${WS%/}"
if [ -z "$WS" ]; then
  echo "  [x] No workspace URL provided. Set WS env var or run interactively."
  exit 1
fi
echo "  [i] Target: ${WS}"
echo ""

# Authenticate via CLI (opens browser for OAuth)
echo "  [~] Opening browser for authentication..."
echo "  [i] If the browser doesn't open, copy the URL from the CLI output."
echo ""
databricks auth login --host "$WS"
echo ""

# Get token
echo "  [~] Retrieving token..."
TOKEN_JSON=$(databricks auth token --host "$WS" 2>/dev/null)
if [ -z "$TOKEN_JSON" ]; then
  echo "  [x] Failed to get token from CLI."
  echo "  [x] Try running: databricks auth login --host $WS"
  exit 1
fi
TOKEN=$(echo "$TOKEN_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token', d) if isinstance(d, dict) else d)" 2>/dev/null)
if [ -z "$TOKEN" ]; then
  echo "  [x] Failed to parse token from CLI response."
  exit 1
fi
echo "  [+] Token acquired (length=${#TOKEN}, type=${TOKEN:0:3}...)"

# Get user info
BRIDGE_USER=$(databricks current-user me --host "$WS" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('userName','unknown'))" 2>/dev/null || echo "unknown")
echo "  [+] User: ${BRIDGE_USER}"
echo ""

# Encrypt token with nonce (AES-256-CBC)
echo "  [~] Encrypting token..."
ENCRYPTED=$(echo -n "$TOKEN" | openssl enc -aes-256-cbc -a -A -pass "pass:${NONCE}" -pbkdf2 2>/dev/null)
if [ -z "$ENCRYPTED" ]; then
  echo "  [!] openssl encryption failed -- sending over HTTPS only"
  ENCRYPTED="PLAIN:${TOKEN}"
else
  echo "  [+] Token encrypted (ciphertext_len=${#ENCRYPTED})"
fi
echo ""

# Send to Setup App
echo "  [~] Sending credentials to Setup App at ${APP_URL}..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${APP_URL}/api/auth/bridge-receive" \
  -H "Content-Type: application/json" \
  -d "{\"ciphertext\":\"${ENCRYPTED}\",\"nonce_id\":\"${NONCE_ID}\",\"host\":\"${WS}\",\"user\":\"${BRIDGE_USER}\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
HTTP_BODY=$(echo "$RESPONSE" | head -1)

echo "  [i] HTTP response: ${HTTP_CODE}"
echo "  [i] Body: ${HTTP_BODY}"

if [ "$HTTP_CODE" = "200" ]; then
  echo ""
  echo "  [+] ================================="
  echo "  [+]  Connected! Setup App updated."
  echo "  [+]  You can close this window."
  echo "  [+] ================================="
else
  echo ""
  echo "  [x] Failed to send credentials (HTTP ${HTTP_CODE})"
  echo "  [x] Response: ${HTTP_BODY}"
  echo ""
  echo "  [~] Fallback: paste this token manually in the Setup App:"
  echo "      ${TOKEN}"
fi
