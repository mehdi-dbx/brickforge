# Plan: Exec Log Persistence

## Context

All exec action output (deploy, build, grants, tables, functions, genie, mlflow) is only visible in the SSE terminal during execution. Navigating away or restarting loses everything. ExecLogger exists but only appends to a single session log -- not per-action, not fetchable.

## What it does

Every exec action's output persists to a per-action log file. Frontend fetches the latest log on drawer mount for any configured block.

## Backend

### Extend ExecLogger (sse.py)

ExecLogger already exists and is created per action. Extend it to:
1. Write to the session log (existing behavior)
2. Also write to a per-action file: `{LOG_DIR}/{action}-latest.log`

Log dir: use `PROJECT_ROOT / "logs" / "exec"` (matches existing exec-log endpoint at setup.py:428).

```python
class ExecLogger:
    def __init__(self, action: str):
        self.log_file = LOG_FILE  # session log (existing)
        self._lines: list[str] = []
        self._lines.append(f"\n=== EXEC {action} {time.strftime(...)} ===\n")
        # Per-action log file
        self._action_log_dir = PROJECT_ROOT / "logs" / "exec"
        self._action_log_dir.mkdir(parents=True, exist_ok=True)
        self._action_log_path = self._action_log_dir / f"{action}-latest.log"
        self._action_file = open(self._action_log_path, "w")
        self._action_file.write(self._lines[0])

    def log(self, text: str) -> None:
        line = text if text.endswith("\n") else text + "\n"
        self._lines.append(line)
        if self._action_file and not self._action_file.closed:
            self._action_file.write(line)
            self._action_file.flush()

    def finish(self, ok: bool, code: int = 0) -> None:
        # Session log (existing)
        self._lines.append(f"=== {'OK' if ok else 'FAILED'} (exit {code}) ===\n")
        with open(self.log_file, "a") as f:
            f.write("".join(self._lines))
        # Close per-action file
        if self._action_file and not self._action_file.closed:
            self._action_file.write(f"=== {'OK' if ok else 'FAILED'} ===\n")
            self._action_file.close()

    def __del__(self):
        # Safety net: close file if finish() was never called
        if hasattr(self, '_action_file') and self._action_file and not self._action_file.closed:
            self._action_file.close()
```

### Add logger param to stream_subprocess

```python
async def stream_subprocess(cmd, env, cwd, timeout, detect_result, logger=None):
    ...
    # In stdout read loop:
    if logger:
        logger.log(text)
    yield sse_line(text, "out")
```

### Pass logger in exec handler

The exec handler already creates `logger = ExecLogger(action)` at line 1112. Pass it to every `stream_subprocess` call in the handler. Also call `logger.log()` for inline `yield sse_line()` calls that bypass `stream_subprocess`:

```python
yield sse_line("[~] Running grants...\n")
logger.log("[~] Running grants...\n")  # also log the inline message
```

### Exec-log endpoint (already exists at setup.py:424)

Already reads from `PROJECT_ROOT / "logs" / "exec" / f"{action}-latest.log"`.
Returns `{"action": ..., "log": ..., "lines": [...]}`.

Add `?step=` support -- frontend can pass step ID, backend resolves to action:

```python
STEP_ACTIONS = {
    'deploy': 'exec-deploy-agent',
    'tables': 'exec-tables',
    'functions': 'exec-functions',
    'genie': 'exec-genie',
    'mlflow': 'exec-mlflow',
}

@router.get("/api/setup/exec-log")
async def exec_log(action: str = "", step: str = ""):
    if step and not action:
        action = STEP_ACTIONS.get(step, "")
    ...
```

## Frontend

### Fetch last log on drawer mount

For ANY block in done phase, fetch the latest exec log by step ID:

```typescript
useEffect(() => {
  if (phase === 'done') {
    fetch(`/api/setup/exec-log?step=${activeStep}`)
      .then(r => r.json())
      .then(data => {
        if (data.lines?.length) setExecLines(data.lines)
      })
      .catch(() => {})
  }
}, [activeStep, phase])
```

Uses `.json()` (endpoint returns JSON), reads `.lines` array.

### Assets tab Build modal

On mount, fetch exec-build log:

```typescript
useEffect(() => {
  fetch('/api/setup/exec-log?action=exec-build')
    .then(r => r.json())
    .then(data => { if (data.lines?.length) setBuildLines(data.lines) })
    .catch(() => {})
}, [])
```

## Files

| File | Change |
|------|--------|
| `brickforge/lib/sse.py` | Extend ExecLogger with per-action file + add `logger` param to `stream_subprocess` |
| `brickforge/routes/setup.py` | Pass logger to stream_subprocess calls + inline log() calls + step mapping in exec-log endpoint |
| `visual/frontend/src/components/SetupDrawer.tsx` | Fetch last log on mount for done blocks |
| `visual/frontend/src/components/StashHealthView.tsx` | Fetch build log on mount |

## Gaps resolved

1. **Path alignment** -- both ExecLogger and exec-log endpoint use `PROJECT_ROOT / "logs" / "exec"`
2. **Response format** -- frontend uses `.json()` and reads `.lines` (matches endpoint format)
3. **Inline yields** -- handler calls `logger.log()` alongside `yield sse_line()` for messages outside `stream_subprocess`
4. **Crash safety** -- `__del__` closes file if `finish()` never called
5. **Step-to-action mapping** -- exec-log endpoint accepts `?step=` param
6. **exec-build** -- one logger shared across all stream_subprocess calls
7. **Deploy wrapper** -- output flows through inherited stdout, captured by stream_subprocess

## Verification

1. Deploy -> navigate away -> come back -> deploy terminal shows last output
2. Restart server -> open deploy block -> last deploy log visible
3. Run exec-tables -> navigate away -> come back -> tables output visible
4. Build from Assets -> close modal -> reopen Assets -> build log visible
5. Log files persist in PROJECT_ROOT/logs/exec/
6. exec-build log contains all 6 steps
7. Crash mid-exec -> log file still has partial output (not empty)
