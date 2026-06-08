# New Features

## 1. MAGE Assistant

BrickForge chat assistant embedded in the Setup App. Same concept as the deployed agent chat UI, but for the setup experience itself.

### What it is

MAGE is a conversational automation layer for the Setup App. Instead of clicking through setup blocks, the user can type what they want and MAGE executes it via the existing REST/API endpoints.

### Location

Right side of the Setup App, same position as the drawer panel. Fully retractable -- user can collapse it and use the traditional UI, or expand it and drive everything through chat.

### Why it works

Most setup actions are already mapped to API endpoints:
- `/api/setup/exec` -- execute any setup block action
- `/api/setup/status` -- get all block states
- `/api/setup/test` -- test any block
- `/api/projects` -- CRUD projects
- `/api/gen/*` -- data generation
- `/api/stash/*` -- stash management
- `/api/auth/*` -- workspace auth

MAGE wraps these endpoints as tools and lets a model orchestrate them conversationally.

### UX

- Retractable panel on the right (like the drawer, replaces or coexists)
- Chat input at bottom, message history above
- MAGE can show setup progress, run blocks, diagnose issues, suggest next steps
- Actions MAGE takes are reflected in the main UI (blocks update, status refreshes)

## 2. Additive Data Generation

The data gen wizard must be additive, not destructive. Users should be able to generate tables, provision them, then come back and generate more tables without losing what they already have.

### Current problem

- "New generation" deletes all generated files (CSVs, SQL, manifests) via `DELETE /api/gen/clear`
- User loses all previously generated tables
- No way to add tables to an existing set
- Clicking the button after provisioning wipes the local files even though tables exist on Databricks

### What it should do

- "New generation" resets the wizard to domain step but KEEPS existing generated files
- New tables are ADDED to the existing set (appended to manifest, new SQL/CSV files alongside existing ones)
- Provision only provisions tables that haven't been provisioned yet (or re-provisions all with CREATE OR REPLACE)
- A separate explicit "Delete all generated data" action exists for when the user truly wants to start over, with confirmation dialog
- The wizard should show which tables already exist (from previous generation runs) and allow adding more

## 3. Saved Workspace Connections

The workspace host block should remember previously connected workspaces and offer them as quick-pick choices in the drawer.

### Current problem

- Every time the user connects to a workspace, they enter the host URL from scratch (or use bridge auth)
- Switching between workspaces (e.g. fevm-agent-ops and e2-demo-field-eng) requires re-entering the full URL each time
- No memory of past connections

### What it should do

- Save each successfully connected workspace (host + display name) to a persistent list
- Show saved workspaces as selectable choices in the host drawer, alongside bridge auth and manual entry
- One click to reconnect to a previously used workspace (token still needs to be valid or re-authenticated)
- Allow removing saved workspaces from the list

## 4. Import Validation

Validate `.forge.zip` structure before importing. Reject invalid files with a clear error modal.

### What it should do

- On file pick, check the zip is valid and contains `config.json` at root
- Check expected structure: `config.json`, optional `prompt/`, optional `gen/`
- If invalid (not a zip, missing config.json, corrupt): show error modal with reason, cancel the import
- If valid but incomplete (e.g. no prompt files, no SQL): import anyway but show a warning about missing content
- Never silently fail or show a generic "import failed" -- always tell the user what's wrong

## 5. Add Multiple Genie Spaces

The (+) button on a configured genie block does nothing. Users can't add a second genie space to an existing project.

### Current problems

- No UI path to reach "Create New Room" when genie block is already configured. The (+) button and block click both go to the "done" phase.
- `create_genie_space.py` replaces the `genie_spaces` array instead of appending. Adding a second space wipes the first.

### What it should do

- (+) button opens the choose phase (Pick Existing / Create New Room) regardless of block status
- `create_genie_space.py` appends new space ID to `genie_spaces[]` instead of replacing
- Collapsible list under the block shows all configured spaces
- Each space can be toggled on/off or removed individually

## 6. Centralized Logging

All operations (build, deploy, provisioning, genie creation, data generation) need traceable logs in one place.

### Current problem

- Server logs go to `~/.brickforge/brickforge_*.log` (session-scoped, rotates on restart)
- Exec logs go to `logs/exec/` (action-scoped, timestamped)
- Provisioning logs go to `brickforge/logs/` (create_all_functions.log, etc.)
- Build output only visible in SSE terminal -- not persisted
- Deploy output only visible in SSE terminal -- not persisted
- No way to review what happened after the fact

### What it should do

- All exec actions (build, deploy, provisioning, genie, mlflow) persist full output to a log file
- Logs organized by date + action: `logs/2026-06-08/exec-build.log`, `logs/2026-06-08/exec-deploy-agent.log`
- Viewable from the UI (log viewer tab or expandable section)
- Retained across restarts

## 7. Remove "Configured" Overlay -- Always Show Drawer

The "configured" full-page overlay that appears when a block is done masks the setup drawer entirely. User can't see or interact with the drawer content (current values, test button, reconfigure). The overlay is impractical -- it forces the user to click "reconfigure" just to see what's configured.

### Current problem

- Clicking a configured block shows a green checkmark overlay with "configured" + the current value
- The setup drawer underneath is hidden
- User must click "reconfigure" to see the actual drawer with details, test, edit
- This happens on EVERY configured block (host, warehouse, schema, model, genie, etc.)

### What it should do

- Remove the "configured" overlay entirely
- When a configured block is clicked, show the setup drawer directly with:
  - Current configured value(s) displayed at the top
  - Test button accessible immediately
  - Reconfigure / edit options inline
  - No extra click needed to see what's there
