# Plan: Inline Bridge Auth (Local Mode)

## Context

When running locally, the user has to copy a curl command from the UI, paste it in a terminal, run it, then wait. The entire OAuth flow runs on localhost anyway. We can run it directly from BrickForge's Python process -- one click, browser opens, token captured, done. No terminal.

When deployed on Databricks Apps, the curl/terminal flow remains (browser redirect needs the user's machine).

## How it works

### Current flow (terminal)
1. Frontend shows curl command
2. User runs it in terminal
3. Script starts local HTTP server on random port
4. Script opens browser for OAuth
5. Browser redirects to localhost callback
6. Script exchanges code for token, creates PAT
7. Script encrypts token, redirects browser to Setup App
8. Frontend polls bridge-status until "connected"

### New flow (inline, local only)
1. Frontend detects local mode (no `DATABRICKS_APP_PORT`)
2. Shows "Connect" button instead of curl command
3. User clicks Connect
4. Backend endpoint starts the OAuth flow in a thread:
   - Starts temp HTTP server on random port
   - Opens browser for OAuth (same URL construction as connect.sh)
   - Captures callback with auth code
   - Exchanges code for token (PKCE)
   - Creates 7-day PAT
   - Stores token in config + keyring
5. Frontend streams progress via SSE (same terminal-style output as other exec actions)
6. On completion, frontend advances to done state

### Detection
```python
is_local = not os.environ.get("DATABRICKS_APP_PORT")
```
Frontend: `GET /api/auth/bridge-mode` returns `{"mode": "local"}` or `{"mode": "deployed"}`

## Backend

### New endpoint: `POST /api/auth/bridge-inline`

SSE streaming endpoint. First checks keyring, only runs OAuth if needed:

```python
@router.post("/api/auth/bridge-inline")
async def bridge_inline(request: Request):
    body = await request.json()
    ws_host = body.get("host", "")

    async def generate():
        # Step 0: Check keyring first
        from brickforge.lib.token_store import get_token_store
        store = get_token_store()
        existing_token = store.get(ws_host)
        if existing_token:
            yield sse_line("[~] Found saved token, verifying...\n")
            if _verify_token(ws_host, existing_token):
                _store_token(ws_host, existing_token, config)
                yield sse_line(f"[+] Reconnected to {ws_host}\n")
                yield sse_done(True)
                return
            else:
                yield sse_line("[~] Saved token expired, starting OAuth...\n")

        yield sse_line("[~] Starting OAuth flow...\n")

        # 1. OAuth discovery
        yield sse_line(f"[~] Discovering OAuth endpoints for {ws_host}...\n")
        auth_endpoint, token_endpoint = _discover_oauth(ws_host)

        # 2. PKCE setup + start local server
        yield sse_line("[~] Starting local callback server...\n")
        verifier, challenge, state, port = _setup_pkce()

        # 3. Open browser
        yield sse_line("[~] Opening browser for authentication...\n")
        _open_browser(auth_endpoint, challenge, state, port)

        # 4. Wait for callback (blocking in thread)
        yield sse_line("[~] Waiting for SSO authentication...\n")
        code = await _wait_for_callback(port, state, timeout=120)

        # 5. Exchange code for token
        yield sse_line("[~] Exchanging auth code for token...\n")
        access_token, refresh_token = _exchange_token(token_endpoint, code, verifier, port)

        # 6. Create PAT
        yield sse_line("[~] Creating 7-day PAT...\n")
        pat = _create_pat(ws_host, access_token)

        # 7. Store
        yield sse_line("[~] Saving credentials...\n")
        _store_token(ws_host, pat, config)

        yield sse_line(f"[+] Connected to {ws_host}\n")
        yield sse_done(True)

    return StreamingResponse(generate(), media_type="text/event-stream")
```

### Extract OAuth logic from connect.sh

Create `brickforge/lib/bridge_oauth.py` -- pure Python module with the same logic as the embedded Python in connect.sh:
- `_verify_token(host, token)` -> bool (quick check: GET /api/2.0/current-user/me with Bearer token)
- `_discover_oauth(host)` -> (auth_endpoint, token_endpoint)
- `_setup_pkce()` -> (verifier, challenge, state, port)
- `_open_browser(auth_endpoint, challenge, state, port)`
- `_wait_for_callback(port, state, timeout)` -> auth_code (async, runs server in thread)
- `_exchange_token(token_endpoint, code, verifier, port)` -> (access_token, refresh_token)
- `_create_pat(host, access_token)` -> pat_token
- `_store_token(host, token, config)` -> saves to config + keyring + .workspaces

No encryption/decryption needed -- token stays in-process (no URL transport).
No IP whitelisting needed -- local mode, same machine.

### Connection flow priority

1. Check keyring for existing token
2. If found: verify with API call (fast, <1s)
3. If valid: inject to memory, done. No browser, no OAuth.
4. If expired/invalid: run full OAuth flow
5. If no token in keyring: run full OAuth flow

### New endpoint: `GET /api/auth/bridge-mode`

```python
@router.get("/api/auth/bridge-mode")
async def bridge_mode():
    is_local = not os.environ.get("DATABRICKS_APP_PORT")
    return {"mode": "local" if is_local else "deployed"}
```

## Frontend

### BridgeAuthPanel changes

On mount, fetch `/api/auth/bridge-mode`. Based on result:

**Local mode:**
- Show workspace URL input (pre-filled from config if available)
- Show "Connect" button
- On click: POST `/api/auth/bridge-inline` with `{host: ws_url}` as SSE stream
- Render terminal output (same pattern as GenTerminal / Build modal)
- On SSE done=true: advance to done state

**Deployed mode:**
- Show curl command (existing flow, unchanged)
- Poll bridge-status (existing flow)

### Terminal output in drawer

Reuse the SSE parsing pattern from exec actions in SetupDrawer. The bridge-inline endpoint streams `[~]` and `[+]` lines. Same colorize function. Show in the drawer's terminal area.

## Files

| File | Change |
|------|--------|
| `brickforge/lib/bridge_oauth.py` | NEW: OAuth PKCE flow extracted from connect.sh |
| `brickforge/routes/auth.py` | Add bridge-inline + bridge-mode endpoints |
| `visual/frontend/src/components/SetupDrawer.tsx` | BridgeAuthPanel: detect mode, show Connect button or curl |

## What does NOT change

- connect.sh -- stays for deployed mode
- bridge-receive -- stays for deployed mode
- bridge-nonce/bridge-status -- stays for deployed mode polling
- Manual entry flow -- unchanged

## Gaps found in review

1. **Browser after callback**: callback server returns HTML "Authentication successful. You can close this tab." (not a redirect to Setup App -- no ciphertext needed in inline mode)
2. **_wait_for_callback threading**: use `asyncio.to_thread(server.handle_request)` -- blocks thread not event loop. `server.timeout = 120` for auto-timeout.
3. **Workspace URL input**: frontend needs a host input field in inline mode (pre-filled from config or saved workspaces). Collect BEFORE calling bridge-inline.
4. **Double-click guard**: reject bridge-inline if a flow is already running (server-side flag).
5. **Fallback link**: in local mode, add small "use terminal command instead" link below Connect button for edge cases.

## Verification

1. Local: click Connect -> browser opens -> SSO -> PAT created -> terminal shows progress -> connected
2. Local: token in keyring + .workspaces after connect
3. Deployed: curl command shown as before (no regression)
4. Timeout: if user doesn't authenticate within 120s, show error
5. Cancel: if user navigates away, callback server cleans up
