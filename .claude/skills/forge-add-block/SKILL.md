# Add Setup Block

Guided wizard for adding a new setup block (step) to the BrickForge visual app. Walks through all required features and generates the code across all integration points.

Triggered by `/forge-add-block`, "add a setup block", "add a setup step", or similar.

## Workflow

### Step 1: Gather requirements

Ask the user the following questions (use AskUserQuestion with multi-select where noted):

**Q1: Block identity**
- What is the `id` (short, lowercase, no spaces)? e.g. `lakebase`, `mcp`
- What is the `label` (sidebar display name)? e.g. `lakebase`, `external MCP`
- What is the `title` (drawer header)? e.g. `Lakebase instance`
- What Lucide icon? (suggest one based on purpose, let user override)

**Q2: Environment variable**
- What env key(s) does this block manage? e.g. `LAKEBASE_INSTANCE_NAME`
- If none (file-based or special logic), note that.

**Q3: Features (multi-select)**
- [ ] Testable -- has a test button that validates live connection
- [ ] Multi-instance -- supports multiple entries with enable/disable toggles and "+" button
- [ ] Provisionable -- has an `exec-*` action that creates the resource
- [ ] Manual entry -- user can paste a value directly

**Q4: If testable**
- What does the test script check? (API call, CLI command, SDK method)
- What's the success message format?

**Q5: If multi-instance**
- What env key prefix? e.g. `PROJECT_GENIE_`
- What border color for instance rows? (amber, blue, purple, emerald, etc.)
- Should it filter keys? (e.g. VS filters to `_INDEX` only, MCP filters out `_HEADER`)

**Q6: If provisionable**
- What script/command does it run?
- Does it write the env var automatically?

**Q7: Choices**
- List the choice options (title, desc, action). Minimum 2.
- Include `keep current` / `done` option.

**Q8: Help text**
- What should the help box say? (1-3 sentences explaining purpose and constraints)

### Step 2: Review plan

Present the complete spec to the user in a table:

| Feature | Value |
|---------|-------|
| id | `...` |
| label | `...` |
| env key(s) | `...` |
| testable | yes/no |
| multi-instance | yes/no (prefix: `...`) |
| provisionable | yes/no (script: `...`) |
| choices | list |
| icon | `...` |

Ask for confirmation before proceeding.

### Step 3: Implement (follow this exact checklist)

#### 3a. `visual/frontend/src/types.ts`
- Add new StepId to the union type

#### 3b. `visual/frontend/src/setupSteps.ts`
- Add step definition to `SETUP_STEPS` array in correct position
- Include: id, label, title, help, choices[]

#### 3c. `visual/frontend/src/components/SetupDag.tsx`
- Add icon to `STEP_ICON` record
- Add case to `subLabel()` function
- If multi-instance: add to `MULTI_INSTANCE_STEPS` array
- If multi-instance: add border color to `INSTANCE_BORDER` record

#### 3d. `visual/frontend/src/components/SetupDrawer.tsx`
- If testable: add to `TESTABLE_STEPS` array
- Add case to `currentValueLabel()` function
- If has configure action: add UI in `renderConfigure()`

#### 3e. `visual/backend/index.js`
- Add to `STEP_ENV_KEYS` with env key(s) or `[]`
- If multi-instance: add instance parsing in `/api/setup/status` handler
- If multi-instance: add prefix to toggle whitelist in `PUT /api/setup/toggle`
- If testable: add test script to `TEST_SCRIPTS` or dynamic test in `/api/setup/test`
- If provisionable: add `case 'exec-<id>':` in `POST /api/setup/exec`
- If has save action: add `case 'save-<id>':` handler

#### 3f. Rebuild and test
- Run `npx vite build` in `visual/frontend/`
- Restart backend: `node visual/backend/index.js`
- Verify: block appears in DAG, correct icon, correct status color
- If testable: verify test button appears and runs
- If multi-instance: verify toggle and "+" buttons work
- If provisionable: verify exec action streams output

### Step 4: Verify checklist

Before declaring done, confirm:
- [ ] Block shows in DAG with correct icon
- [ ] Status orb is gray when not configured, green when configured
- [ ] SubLabel shows correct value or "not configured"
- [ ] Test button works (if testable)
- [ ] Toggle on/off works (if multi-instance)
- [ ] "+" button works (if multi-instance)
- [ ] Execute action runs and streams output (if provisionable)
- [ ] "keep current" / "done" choice works
- [ ] "manual" entry works (if applicable)
- [ ] Connector lines render correctly above and below

## Files to modify

| File | What to add |
|------|-------------|
| `visual/frontend/src/types.ts` | StepId union |
| `visual/frontend/src/setupSteps.ts` | Step definition |
| `visual/frontend/src/components/SetupDag.tsx` | Icon, subLabel, multi-instance config |
| `visual/frontend/src/components/SetupDrawer.tsx` | Testable, currentValueLabel, configure UI |
| `visual/frontend/src/components/SetupView.tsx` | Usually no changes (auto-wired) |
| `visual/backend/index.js` | STEP_ENV_KEYS, test script, exec handler, toggle whitelist |
