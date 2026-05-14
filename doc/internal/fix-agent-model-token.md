# Fix: AGENT_MODEL_TOKEN — Same-workspace vs Cross-workspace handling

## Goal

The codebase supports two model modes:
- **Same-workspace**: model lives in the current Databricks workspace → `AGENT_MODEL_ENDPOINT` and `AGENT_MODEL_TOKEN` are NOT needed
- **Cross-workspace**: model lives on a different workspace (e.g. `e2-demo-field-eng`) → `AGENT_MODEL_ENDPOINT` (full URL) + `AGENT_MODEL_TOKEN` (PAT for that workspace) required

**Current bug**: `agent/agent.py` hard-crashes with `ValueError("AGENT_MODEL_TOKEN must be set for cross-workspace endpoint")` when the token is missing. Additionally, deployment artifacts don't handle same-workspace mode cleanly — they always require/warn on `AGENT_MODEL_ENDPOINT` and `AGENT_MODEL_TOKEN` even when they're not needed.

---

## Files to change

| File | What |
|------|------|
| `agent/agent.py` | Fall back to `DATABRICKS_TOKEN` when `AGENT_MODEL_TOKEN` missing (log warning, don't hard crash) |
| `deploy/deploy.sh` | Remove `AGENT_MODEL_ENDPOINT` from REQUIRED list; make token warning conditional on cross-workspace |
| `deploy/sync_databricks_yml_from_env.py` | When `AGENT_MODEL_ENDPOINT` is empty (same-workspace), clean up `databricks.yml` and `app.yaml` |

---

## Change 1 — `agent/agent.py` lines 86–88

Replace:
```python
token = os.environ.get("AGENT_MODEL_TOKEN", "").strip()
if not token:
    raise ValueError("AGENT_MODEL_TOKEN must be set for cross-workspace endpoint")
```

With:
```python
token = os.environ.get("AGENT_MODEL_TOKEN", "").strip()
if not token:
    token = os.environ.get("DATABRICKS_TOKEN", "").strip()
    if token:
        import logging
        logging.getLogger(__name__).warning(
            "AGENT_MODEL_TOKEN not set — falling back to DATABRICKS_TOKEN for cross-workspace endpoint. "
            "Set AGENT_MODEL_TOKEN for a dedicated PAT."
        )
    else:
        raise ValueError(
            "AGENT_MODEL_TOKEN (or DATABRICKS_TOKEN as fallback) must be set for cross-workspace endpoint"
        )
```

**Why**: consistent with `test_agent_model.py` (lines 32–42) and `eval/scorer.py` (lines 32–38) which already do this fallback.

---

## Change 2 — `deploy/deploy.sh` lines 86–107 and line 117

**Remove `AGENT_MODEL_ENDPOINT` from the `REQUIRED` array** (it's intentionally empty in same-workspace mode — currently causes deploy to abort).

After the REQUIRED check block, add:
```bash
# Model endpoint: optional in same-workspace mode
if [[ -z "${AGENT_MODEL_ENDPOINT:-}" ]]; then
  info "AGENT_MODEL_ENDPOINT not set — same-workspace model mode (derived at runtime)"
else
  info "${C}AGENT_MODEL_ENDPOINT${W} = ${DIM}${AGENT_MODEL_ENDPOINT:0:70}${W}"
  # Only warn about token for cross-workspace URLs
  if [[ "$AGENT_MODEL_ENDPOINT" == *"/serving-endpoints/"* ]] && \
     [[ "${AGENT_MODEL_ENDPOINT%%/serving-endpoints*}" != "${DATABRICKS_HOST%/}" ]]; then
    [[ -z "${AGENT_MODEL_TOKEN:-}" ]] && warn "AGENT_MODEL_TOKEN not set — cross-workspace model token may be missing from secrets"
  fi
fi
```

Remove line 117 (the unconditional `AGENT_MODEL_TOKEN` warn — replaced by the conditional above).

---

## Change 3 — `deploy/sync_databricks_yml_from_env.py` lines 240+

When `AGENT_MODEL_ENDPOINT` is empty, add same-workspace cleanup **before** the existing `if endpoint:` block:

```python
if not endpoint:
    # Same-workspace mode: remove agent_model_token secret resource from databricks.yml
    new_content = re.sub(
        r"\s*- name: 'agent_model_token'\s*\n\s+secret:\s*\n\s+scope: '[^']*'\s*\n\s+key: '[^']*'\s*\n\s+permission: '[^']*'",
        "",
        content,
    )
    if new_content != content:
        content = new_content
        changes.append(("agent_model_token secret resource", "AGENT_MODEL_ENDPOINT", "removed (same-workspace mode)"))
```

And in the `app.yaml` section (lines 292+), when endpoint is empty:
```python
if not endpoint and app_yml.exists():
    app_content = app_yml.read_text()
    app_changed = False
    # Remove AGENT_MODEL_TOKEN valueFrom entry (resource no longer exists)
    new_app = re.sub(
        r"\s*- name: AGENT_MODEL_TOKEN\s*\n\s+valueFrom: \"agent_model_token\"\n?",
        "\n",
        app_content,
    )
    # Clear AGENT_MODEL_ENDPOINT value
    new_app = re.sub(
        r"(AGENT_MODEL_ENDPOINT\s*\n\s+value:\s*)[\"'][^\"']*[\"']",
        r'\g<1>""',
        new_app,
    )
    if new_app != app_content:
        app_content = new_app
        app_changed = True
        changes.append(("app.yaml", "AGENT_MODEL_ENDPOINT", "cleared (same-workspace mode)"))
    if app_changed and not args.dry_run:
        app_yml.write_text(app_content)
```

---

## End-to-end result

| Scenario | Before | After |
|----------|--------|-------|
| Cross-workspace, token missing, local chatbot | Hard crash ValueError | Warning + fallback to DATABRICKS_TOKEN |
| Same-workspace, deploy | Aborts (AGENT_MODEL_ENDPOINT required) | Passes with info message |
| Same-workspace, deploy | Warns about token unconditionally | No spurious token warning |
| Same-workspace, sync | app.yaml retains stale cross-workspace URL + token ref | Cleared on next sync |
| Same-workspace, sync | databricks.yml retains agent_model_token secret resource | Removed on next sync |
