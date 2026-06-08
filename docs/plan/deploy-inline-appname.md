# Plan: Simplify Deploy Block -- Inline App Name

> Status: PLANNED

## Context

The deploy block has two choices: "Set App Name" and "Deploy Now". The first choice opens a text input for the app name. This is an unnecessary extra step -- the app name should be an inline editable field with a pen icon, defaulting to "agent-app" when empty. Deploy should be grayed out until the name is set.

## Problem with removing the choice

Can't just remove "Set App Name" and keep only "Deploy Now" as a single choice. Single-choice blocks auto-skip to configure phase, but `exec-deploy-agent` has no configure renderer -- it's an exec action that fires the subprocess immediately.

## Solution

Keep "Deploy Now" as the only choice. Add a configure renderer for `exec-deploy-agent` that shows:
1. App name field (inline editable, pen icon, defaults to "agent-app")
2. "Deploy" button (disabled until name is set)

When user clicks "Deploy" in the configure phase, it saves the name first (via `save-deploy-name`), then fires the exec.

### setupSteps.ts

Single choice:
```typescript
choices: [
  { title: 'Deploy', desc: 'Bundle Agent + Chat UI, Upload, Deploy', action: 'exec-deploy-agent' },
],
```

### SetupDrawer.tsx

Add configure body for `exec-deploy-agent`:
```typescript
else if (action === 'exec-deploy-agent')
  body = (
    <>
      <Label>app name</Label>
      <div className="flex items-center gap-2">
        <Input value={manualVal || 'agent-app'} onChange={setManualVal} placeholder="agent-app" />
      </div>
      <InfoBox>Databricks App will be created with this name</InfoBox>
    </>
  )
```

Add readiness check:
```typescript
if (action === 'exec-deploy-agent') return !!(manualVal.trim() || currentValues.DBX_APP_NAME)
```

In `onContinue`, save the name before exec:
```typescript
if (action === 'exec-deploy-agent' && manualVal.trim()) {
  action = 'save-deploy-name'
  // After save completes, trigger exec-deploy-agent
}
```

Wait -- this gets complicated with the two-step save-then-exec. Simpler: pre-fill `manualVal` from `currentValues.DBX_APP_NAME` on mount. If user changes it, save on deploy. If they don't change it, use existing value.

Actually, simplest: the deploy exec handler already reads `config.get("app.name")`. Just make sure the name is set before allowing deploy. The configure phase shows the name field, user sets it (or keeps default), clicks continue -> name is saved -> exec fires.

## Files

| File | Change |
|------|--------|
| `visual/frontend/src/setupSteps.ts` | Single choice "Deploy" |
| `visual/frontend/src/components/SetupDrawer.tsx` | Configure body for exec-deploy-agent with app name field |
