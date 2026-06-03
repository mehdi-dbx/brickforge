# Self-Healing SQL Generation

## Problem

LLM-generated SQL for Databricks UC functions/procedures fails at provision time because Databricks has strict syntax constraints the LLM doesn't know. Previous approach was whack-a-mole: each failure patched one at a time.

## Solution: 5-Layer Defense

### Layer 0 -- Hardened Prompts
- **File**: `brickforge/data/gen/routine_sql_generator.py` (FUNCTION_SYSTEM_PROMPT, PROCEDURE_SYSTEM_PROMPT)
- **File**: `brickforge/data/gen/routine_schema_generator.py` (SYSTEM_PROMPT)
- Sets the tone: "You write Databricks SQL. Not standard SQL. Be minimalist."
- Explicit ban: no optional clauses, no exotic features, no parameters the user didn't ask for
- Fewer params, fewer columns, shorter SQL. If in doubt, leave it out.

### Layer 1 -- Knowledge (Reference Doc + Working Examples)
- **File**: `brickforge/data/gen/databricks_sql_reference.md`
- Compact spec of Databricks CREATE FUNCTION / CREATE PROCEDURE syntax
- Explicit constraints: no SQL SECURITY INVOKER for functions, no LIMIT with params, DEFAULT ordering
- 3 working examples (simple function, complex function with CTE/JOIN, procedure)
- Loaded into every LLM generation call via `_load_reference()`
- Bootstrapped from official Databricks docs + stash examples that have been successfully provisioned

### Layer 2 -- Sanitizer (Auto-Fix Known Patterns)
- **File**: `brickforge/data/gen/routine_sql_generator.py` (`_sanitize_sql()`)
- Runs after every LLM generation, before saving SQL to disk
- Auto-fixes (logs each fix to SSE terminal):
  - Strip `SQL SECURITY INVOKER` from functions
  - Replace `LIMIT p_param` with `LIMIT 100`
  - Reorder DEFAULT params after non-DEFAULT
  - Insert missing `LANGUAGE SQL`
- Rejects (triggers LLM retry with specific error):
  - `BEGIN...END` in functions
  - Write operations (`UPDATE`/`INSERT`/`DELETE`) in functions
  - Missing `RETURNS TABLE` or `RETURN`
  - Missing `__SCHEMA_QUALIFIED__`

### Layer 3 -- Self-Healing Loop (Catch Unknown Errors at Provision)
- **File**: `brickforge/data/gen/generate_routines.py` (`mode_provision_gen()`, `_self_heal()`)
- When `run_sql.py` fails against Databricks:
  1. Capture the Databricks error message
  2. Read the SQL file
  3. Send both to LLM: "this SQL failed, here's the error, fix it"
  4. Run corrected SQL through `_sanitize_sql()`
  5. Write corrected SQL back to file
  6. Retry provision
- Max 2 retries per file
- SSE terminal output: `[~] Self-healing attempt 1/2...` / `[+] Self-healed`

### Layer 4 -- Learning (Errors Feed Back to Knowledge)
- **File**: `brickforge/data/gen/generate_routines.py` (`_learn_constraint()`)
- On successful self-heal, appends new constraint to `databricks_sql_reference.md`
- Extracts error code (e.g. `[USER_DEFINED_FUNCTIONS.NOT_A_VALID_DEFAULT_PARAMETER_POSITION]`) and summary
- Deduplicates: skips if error code or summary already in reference doc
- Next generation reads updated reference doc -- same error never happens again
- The system gets smarter with each provision

## Data Flow

```
User describes routines
        |
        v
[Layer 0] Hardened prompt + [Layer 1] Reference doc
        |
        v
LLM generates SQL
        |
        v
[Layer 2] _sanitize_sql() -- auto-fix or reject
        |
        v
SQL saved to disk
        |
        v
[Layer 3] Provision to Databricks via run_sql.py
        |
    success? ----yes----> done
        |
       no
        |
        v
Capture error -> LLM corrects -> _sanitize_sql() -> write -> retry
        |
    success? ----yes----> [Layer 4] Learn constraint -> done
        |
       no (after 2 retries)
        |
        v
    Surface error to user
```

## Files

| File | Layer | Role |
|------|-------|------|
| `data/gen/routine_sql_generator.py` | 0, 1, 2 | Prompts, reference loader, sanitizer |
| `data/gen/routine_schema_generator.py` | 0 | Schema generation prompt |
| `data/gen/databricks_sql_reference.md` | 1, 4 | Reference doc (static + learned) |
| `data/gen/generate_routines.py` | 3, 4 | Self-healing loop, learning |

## Verified

- Layer 0+1: LLM produced 1 minimalist function with 1 param, clean SQL, no exotic features
- Layer 2: Sanitizer auto-fixes SQL SECURITY INVOKER, LIMIT params, DEFAULT ordering (unit tested)
- Layer 3: Deliberately broken SQL (column mismatch) auto-corrected and provisioned on retry
- Layer 4: New constraint appended to reference doc after self-heal
