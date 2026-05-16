# Cross-Workspace Authentication Plan

> How does a user on Setup App (workspace A) authenticate to a target workspace B?

---

## The Problem

Setup App runs on workspace A. User wants to configure/deploy an agent on workspace B. The app needs a token for workspace B. The user's local CLI is unreachable from the cloud container.

---

## Options Explored

### 1. Manual PAT Entry
- User opens workspace B settings, generates PAT, pastes in Setup App
- Deep link: `{workspace_b_url}/#setting/account/token`
- 5 steps: open link, click generate, name it, copy token, paste back
- Works everywhere, no dependencies
- **Status: WORKS. Fallback option.**

### 2. OAuth U2M with `databricks-cli` Client ID
- `databricks-cli` is a published OAuth client on every workspace
- PKCE flow, no client secret needed
- Flow: redirect to workspace B OAuth -> SSO -> redirect back with auth code -> exchange for token
- **Blocker: `redirect_uri` locked to `http://localhost:*`. Setup App URL rejected.**
- If Databricks loosens redirect_uri validation -> zero-friction, zero-registration
- **Status: BLOCKED by redirect_uri validation. Needs verification.**

### 3. OAuth with Custom App Registration
- Register Setup App as OAuth app at account level (Account Console -> App Connections)
- Gets a `client_id` with Setup App URL as allowed `redirect_uri`
- Same PKCE flow as option 2, but with custom client_id
- One-time admin setup per account, works for all workspaces in that account
- **Status: VIABLE for same-account. Needs admin action.**

### 4. Account-Level SP Federation
- Setup App SP gets account-level access
- Can list workspaces, mint tokens, verify user identity
- User picks workspace from dropdown, zero auth prompts
- **Status: VIABLE for same-account. Needs admin to grant SP account access.**

### 5. `x-forwarded-access-token` + Account API
- DBX App receives user's OAuth token via `x-forwarded-access-token` header
- Token is scoped to workspace A only
- With account-level SP, could exchange user identity for workspace B token
- **Status: VIABLE for same-account. Same admin requirement as option 4.**

### 6. Bookmarklet (JS auto-generate PAT)
- JavaScript bookmarklet calls `/api/2.0/token/create` on workspace B
- User clicks bookmark while on workspace B page -> token in clipboard
- **Blocker: 401 Unauthorized. Browser session auth doesn't carry to fetch() calls.**
- Workspace UI uses internal auth mechanism, not session cookies for API
- **Status: DEAD END.**

### 7. Console Snippet
- Paste JS in browser console to call token API
- Same 401 problem as bookmarklet
- Chrome shows scary warnings, corporate policies may block
- **Status: DEAD END.**

### 8. Browser Extension
- Auto-generates PAT when user visits workspace B
- Sends to Setup App via postMessage
- Requires installing extension -- high friction
- **Status: IMPRACTICAL.**

---

## Recommended: Local Bridge Script

The Setup App can't reach the user's CLI. But the user can run a script locally that bridges the gap.

### How It Works

1. Setup App shows a one-liner with a copy button:
   ```
   npx brickforge-connect https://brickforge-setup-xxx.aws.databricksapps.com
   ```

2. User copies, pastes in their terminal

3. The script runs locally:
   - Has access to Databricks CLI, browser, filesystem
   - Runs `databricks auth login --host <workspace_b>` (opens browser, OAuth flow)
   - Gets token via CLI's built-in OAuth (localhost redirect works locally)
   - POSTs token back to Setup App: `POST /api/auth/receive-token`

4. Setup App side:
   - Shows spinner: "Waiting for connection..."
   - When `/api/auth/receive-token` receives the POST -> stores token, UI updates
   - Done. No manual paste.

### User Experience
- Copy one line, paste in terminal
- Browser opens, SSO login on workspace B
- Setup App auto-updates with token
- Zero manual token copy/paste

### Implementation
- `scripts/connect.sh` -- 20-line bash script
- Or `npx brickforge-connect` -- tiny npm package
- Or hosted as a gist: `curl -s <gist_url> | bash -s -- <app_url>`
- Setup App backend: `POST /api/auth/receive-token` endpoint
- Frontend: polling or WebSocket to detect when token arrives

### Security
- HTTPS between script and Setup App (encrypted)
- Token sent once, stored in config, not logged
- Short-lived token (24h default)
- User explicitly initiates the flow (not automated)

### Alternative: Simple CLI One-Liner (No Bridge)
If the bridge feels overengineered, a simpler version:
```bash
databricks auth token --host https://workspace-b.cloud.databricks.com | pbcopy
```
User runs this, token in clipboard, pastes in Setup App. Two pastes total. No bridge server needed.

---

## Summary

| Scenario | Best Option | Friction |
|----------|------------|---------|
| Same account, admin cooperates | OAuth custom app registration (option 3) | Zero (one-time admin setup) |
| Same account, SP has account access | SP federation (option 4) | Zero (dropdown pick) |
| Cross-account, user has CLI | Local bridge script (option 8) | One terminal paste |
| Cross-account, no CLI | Deep link + manual PAT (option 1) | 5 steps |
| If `databricks-cli` redirect_uri loosened | OAuth U2M PKCE (option 2) | Zero |

---

## Open Questions

1. Is `databricks-cli` redirect_uri validation strict or can non-localhost URIs work? **Needs testing.**
2. Can `custom_app_integration.create()` be called with workspace-level auth or only account-level? **Account-level only (confirmed).**
3. Can `x-forwarded-access-token` from workspace A generate a PAT on workspace A via token API? **Yes (confirmed via API test).**
4. Can a DBX App's SP be promoted to account-level programmatically? **Unknown -- likely needs admin UI.**
