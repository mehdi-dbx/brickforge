#!/bin/bash
# BrickForge Bridge Auth -- Pure Python, zero dependencies
# Launches an embedded Python script that handles OAuth PKCE directly.
# No Databricks CLI needed. Just Python 3 + a browser.

# --- Config (replaced by Setup App when served as download) ---
APP_URL="${1:?Usage: bash connect.sh <setup-app-url> <nonce>}"
NONCE="${2:?Usage: bash connect.sh <setup-app-url> <nonce>}"
NONCE_ID="${NONCE}"
WS_DEFAULT=""

# Find python3
PY=""
for cmd in python3 python; do
  if command -v "$cmd" &>/dev/null; then PY="$cmd"; break; fi
done
if [ -z "$PY" ]; then
  echo ""
  echo "  Python 3 is required but not installed."
  echo ""
  OS="$(uname -s 2>/dev/null || echo Windows)"
  case "$OS" in
    Darwin)
      echo "  Install on macOS (pick one):"
      echo "    1. Open Terminal and run:  brew install python3"
      echo "    2. Or download from:       https://www.python.org/downloads/macos/"
      ;;
    Linux)
      echo "  Install on Linux:"
      echo "    Ubuntu/Debian:  sudo apt install python3"
      echo "    Fedora/RHEL:    sudo dnf install python3"
      ;;
    MINGW*|MSYS*|CYGWIN*)
      echo "  Install on Windows:"
      echo "    1. Run:                    winget install Python.Python.3.12"
      echo "    2. Or open Microsoft Store and search for 'Python 3.12'"
      echo "    3. Or download from:       https://www.python.org/downloads/windows/"
      ;;
    *)
      echo "  Download from: https://www.python.org/downloads/"
      ;;
  esac
  echo ""
  echo "  After installing, run this script again."
  echo ""
  exit 1
fi

exec "$PY" - "$APP_URL" "$NONCE" "$NONCE_ID" "$WS_DEFAULT" << 'PYTHON_SCRIPT'
import sys, os, secrets, hashlib, base64, json, socket, webbrowser, ssl
import http.server, urllib.request, urllib.parse
from threading import Timer

APP_URL = sys.argv[1].rstrip('/')
NONCE = sys.argv[2]
NONCE_ID = sys.argv[3]
WS_DEFAULT = sys.argv[4] if len(sys.argv) > 4 else ''

# ── ANSI ────────────────────────────────────────────────────────────────────
BOLD, B, G, R, Y, C, M, W, DIM = '\033[1m', '\033[34m', '\033[32m', '\033[31m', '\033[33m', '\033[36m', '\033[35m', '\033[0m', '\033[2m'
OK   = f'  {G}✓{W}'
FAIL = f'  {R}✗{W}'
WARN = f'  {Y}⚠{W}'
INFO = f'  {C}→{W}'
RUN  = f'  {B}~{W}'

def section(title):
    print(f'\n{BOLD}{B}═══ {title} ═══{W}')

print(f'\n{BOLD}{M}╔══════════════════════════════════════════════╗{W}')
print(f'{BOLD}{M}║       BrickForge  ·  bridge auth              ║{W}')
print(f'{BOLD}{M}╚══════════════════════════════════════════════╝{W}\n')

print(f'{INFO} App URL:  {DIM}{APP_URL}{W}')
print(f'{INFO} Nonce:    {DIM}{NONCE_ID[:8]}...{W}')
print(f'{INFO} OS:       {DIM}{os.uname().sysname}{W}')
print(f'{INFO} Python:   {DIM}{sys.version.split()[0]}{W}')
print(f'{INFO} Mode:     {DIM}Pure Python (no CLI needed){W}')

# ── Step 1: Target workspace ───────────────────────────────────────────────
section('Workspace')

ws = WS_DEFAULT
if not ws:
    try:
        ws = input('  Target workspace URL: ').strip()
    except EOFError:
        ws = ''
ws = ws.rstrip('/')
if not ws:
    print(f'{FAIL} No workspace URL provided')
    sys.exit(1)
if not ws.startswith('http'):
    ws = 'https://' + ws
print(f'{OK} Target: {C}{ws}{W}')

# ── Step 2: Discover OAuth endpoints ───────────────────────────────────────
section('OAuth discovery')

discovery_url = f'{ws}/oidc/.well-known/oauth-authorization-server'
print(f'{RUN} Fetching {DIM}{discovery_url}{W}')
ctx = ssl.create_default_context()
try:
    with urllib.request.urlopen(discovery_url, timeout=10, context=ctx) as r:
        endpoints = json.loads(r.read())
    auth_endpoint = endpoints['authorization_endpoint']
    token_endpoint = endpoints['token_endpoint']
    print(f'{OK} Auth:  {DIM}{auth_endpoint}{W}')
    print(f'{OK} Token: {DIM}{token_endpoint}{W}')
except Exception as e:
    print(f'{FAIL} OAuth discovery failed: {e}')
    print(f'  {DIM}This workspace may not support OAuth. Try the CLI version or enter a token manually.{W}')
    sys.exit(1)

# ── Step 3: PKCE + localhost server ────────────────────────────────────────
section('Authentication')

verifier = secrets.token_urlsafe(64)
challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b'=').decode()
state = secrets.token_urlsafe(16)

# Find free port
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.bind(('localhost', 0))
port = sock.getsockname()[1]
sock.close()

redirect_uri = f'http://localhost:{port}'
auth_url = (
    f'{auth_endpoint}'
    f'?client_id=databricks-cli'
    f'&redirect_uri={urllib.parse.quote(redirect_uri, safe="")}'
    f'&response_type=code'
    f'&scope=all-apis+offline_access'
    f'&state={state}'
    f'&code_challenge={challenge}'
    f'&code_challenge_method=S256'
)

auth_code = [None]
bridge_url_holder = [None]

def do_token_exchange(code):
    """Exchange auth code for token, encrypt, build bridge URL. Returns bridge URL or None."""
    print(f'{OK} Auth code received {DIM}({code[:16]}...){W}')

    section('Token')
    print(f'{RUN} Exchanging code for token...')
    token_data = urllib.parse.urlencode({
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': 'databricks-cli',
        'redirect_uri': redirect_uri,
        'code_verifier': verifier,
    }).encode()
    req = urllib.request.Request(token_endpoint, data=token_data, method='POST')
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
            token_resp = json.loads(r.read())
        TOKEN = token_resp['access_token']
        REFRESH_TOKEN = token_resp.get('refresh_token', '')
        print(f'{OK} Token acquired {DIM}({len(TOKEN)} chars, {TOKEN[:6]}...){W}')
        print(f'{OK} Expires in: {DIM}{token_resp.get("expires_in", "?")}s{W}')
        if REFRESH_TOKEN:
            print(f'{OK} Refresh token: {DIM}({len(REFRESH_TOKEN)} chars){W}')
    except Exception as e:
        print(f'{FAIL} Token exchange failed: {e}')
        return None

    # User info
    print(f'{RUN} Fetching user info...')
    try:
        me_req = urllib.request.Request(f'{ws}/api/2.0/preview/scim/v2/Me', headers={'Authorization': f'Bearer {TOKEN}'})
        with urllib.request.urlopen(me_req, timeout=10, context=ctx) as r:
            me = json.loads(r.read())
        BRIDGE_USER = me.get('userName', 'unknown')
    except Exception:
        BRIDGE_USER = 'unknown'
    print(f'{OK} User: {C}{BRIDGE_USER}{W}')

    # Encrypt
    section('Encryption')
    print(f'{RUN} Encrypting token...')
    # Bundle access + refresh token as JSON
    import subprocess
    token_bundle = json.dumps({'access_token': TOKEN, 'refresh_token': REFRESH_TOKEN, 'token_endpoint': token_endpoint})
    try:
        proc = subprocess.run(
            ['openssl', 'enc', '-aes-256-cbc', '-a', '-A', '-pass', f'pass:{NONCE}', '-pbkdf2'],
            input=token_bundle.encode(), capture_output=True, timeout=5
        )
        ENCRYPTED = proc.stdout.decode().strip()
        if not ENCRYPTED:
            raise Exception('empty output')
        print(f'{OK} Encrypted {DIM}({len(ENCRYPTED)} chars){W}')
    except Exception as e:
        print(f'{WARN} openssl not available ({e}) -- token sent over HTTPS only')
        ENCRYPTED = f'PLAIN:{token_bundle}'

    # Build bridge URL
    encoded = urllib.parse.quote(ENCRYPTED, safe='')
    encoded_host = urllib.parse.quote(ws, safe='')
    encoded_user = urllib.parse.quote(BRIDGE_USER, safe='')
    return f'{APP_URL}/#bridge/{NONCE_ID}/{encoded}/{encoded_host}/{encoded_user}'


class CallbackHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        if qs.get('state', [None])[0] != state:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'State mismatch')
            return
        auth_code[0] = qs.get('code', [None])[0]

        # Do the full token exchange + encryption before responding
        bridge_url_holder[0] = do_token_exchange(auth_code[0])

        if bridge_url_holder[0]:
            # Redirect browser directly to the Setup App with the token
            self.send_response(302)
            self.send_header('Location', bridge_url_holder[0])
            self.end_headers()
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0d0d12;color:#FF3522"><h2>Token exchange failed. Check terminal.</h2></body></html>')
    def log_message(self, *a): pass

server = http.server.HTTPServer(('localhost', port), CallbackHandler)
server.timeout = 120

print(f'{RUN} Opening browser for OAuth...')
print(f'  {DIM}Callback: {redirect_uri}{W}')
print(f'  {DIM}If the browser doesn\'t open, copy this URL:{W}')
print(f'  {DIM}{auth_url[:100]}...{W}\n')

webbrowser.open(auth_url)

# Timeout guard
def timeout_handler():
    if not auth_code[0]:
        print(f'\n{FAIL} Timed out waiting for OAuth callback (120s)')
        os._exit(1)
timer = Timer(120, timeout_handler)
timer.daemon = True
timer.start()

server.handle_request()
server.server_close()
timer.cancel()

if not auth_code[0]:
    print(f'{FAIL} No auth code received')
    sys.exit(1)

# ── Done ───────────────────────────────────────────────────────────────────
section('Connect')

if bridge_url_holder[0]:
    print(f'{OK} Browser redirected to Setup App\n')
    print(f'{BOLD}{G}╔══════════════════════════════════════════════╗{W}')
    print(f'{BOLD}{G}║  Token delivered via browser redirect.       ║{W}')
    print(f'{BOLD}{G}║  Check the Setup App -- it should update.    ║{W}')
    print(f'{BOLD}{G}║  You can close this window.                  ║{W}')
    print(f'{BOLD}{G}╚══════════════════════════════════════════════╝{W}\n')
else:
    print(f'{FAIL} Token exchange failed. Check errors above.\n')
PYTHON_SCRIPT
