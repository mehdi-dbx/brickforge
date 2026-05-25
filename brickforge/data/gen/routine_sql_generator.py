"""Generate SQL code for a single function or procedure using the LLM."""
from __future__ import annotations

import re
from typing import Any

from data.gen.llm_client import call_llm

FUNCTION_SYSTEM_PROMPT = """\
You are a SQL developer writing query templates for Databricks Unity Catalog.

Generate a SELECT query template that an AI agent will use to look up data.

Return ONLY the raw SQL — no markdown fences, no explanation.

Format:
-- Description of what the query does. Params: {{param1}}, {{param2}}
SELECT column1, column2
FROM __SCHEMA_QUALIFIED__.`table_name`
WHERE column = '{{param1}}' AND other = {{param2}};

Rules:
- First line: SQL comment with description and list of parameters
- Use __SCHEMA_QUALIFIED__ before every table name (backtick-quoted)
- Use {{param_name}} for parameter placeholders (curly braces)
- String parameters: wrap in single quotes '{{param}}'
- Numeric parameters: no quotes {{param}}
- Write realistic WHERE, JOIN, GROUP BY, ORDER BY as appropriate
- Return useful columns for an AI agent to reason about
- No CREATE FUNCTION wrapper — just the raw SELECT template"""

PROCEDURE_SYSTEM_PROMPT = """\
You are a SQL developer writing stored procedures for Databricks Unity Catalog.

Generate a CREATE OR REPLACE PROCEDURE statement.

Return ONLY the raw SQL — no markdown fences, no explanation.

Format:
CREATE OR REPLACE PROCEDURE __SCHEMA_QUALIFIED__.`procedure_name`(
  IN param1 TYPE,
  IN param2 TYPE
)
LANGUAGE SQL
SQL SECURITY INVOKER
AS
BEGIN
  -- Logic here (UPDATE, INSERT, DELETE, IF/ELSE)
  SELECT 'UPDATED' AS status;
END;

Rules:
- Use __SCHEMA_QUALIFIED__ before the procedure name and every table name (backtick-quoted)
- All parameters use IN keyword
- Include LANGUAGE SQL and SQL SECURITY INVOKER
- End with a SELECT returning a status message
- Use proper BEGIN...END block
- Write realistic business logic (UPDATE, conditional logic, etc.)"""


def _build_user_prompt(
    routine: dict[str, Any],
    table_schemas: list[dict[str, Any]] | None = None,
) -> str:
    """Build the user prompt with routine definition and table context."""
    params_desc = "\n".join(
        f"  - {p['name']}: {p['sql_type']}" for p in routine.get("parameters", [])
    )
    prompt = f"""Routine: {routine['name']}
Type: {routine['type']}
Description: {routine.get('description', '')}

Parameters:
{params_desc or '  (none)'}

Tables referenced: {', '.join(routine.get('tables_referenced', []))}

Instructions: {routine.get('instructions', 'Generate appropriate SQL')}"""

    if table_schemas:
        prompt += "\n\nFull table schemas:"
        for t in table_schemas:
            cols = "\n".join(f"    {c['name']} {c['type']}" for c in t.get("columns", []))
            prompt += f"\n  {t['name']}:\n{cols}"

    return prompt


def _strip_fences(raw: str) -> str:
    """Strip markdown code fences if present."""
    cleaned = re.sub(r"^```(?:sql)?\s*\n?", "", raw.strip())
    cleaned = re.sub(r"\n?```\s*$", "", cleaned)
    return cleaned.strip()


def _validate_sql(sql: str, routine_type: str) -> str:
    """Basic validation of generated SQL."""
    if "__SCHEMA_QUALIFIED__" not in sql:
        raise ValueError("Generated SQL missing __SCHEMA_QUALIFIED__ placeholder")

    if routine_type == "procedure":
        if "CREATE" not in sql.upper():
            raise ValueError("Procedure SQL missing CREATE statement")
        if "BEGIN" not in sql.upper() or "END" not in sql.upper():
            raise ValueError("Procedure SQL missing BEGIN...END block")
    else:
        if "SELECT" not in sql.upper():
            raise ValueError("Function SQL missing SELECT statement")

    return sql


def generate_routine_sql(
    routine: dict[str, Any],
    table_schemas: list[dict[str, Any]] | None = None,
) -> str:
    """Generate SQL code for a single routine.

    Returns the raw SQL string.
    """
    print(f"[+] Generating SQL for {routine['type']}: {routine['name']}...")

    system = PROCEDURE_SYSTEM_PROMPT if routine["type"] == "procedure" else FUNCTION_SYSTEM_PROMPT
    user = _build_user_prompt(routine, table_schemas)

    raw = call_llm(system, user, max_tokens=4096)
    sql = _strip_fences(raw)

    try:
        sql = _validate_sql(sql, routine["type"])
    except ValueError as e:
        print(f"[~] Validation warning: {e} — retrying...")
        correction = (
            f"Your SQL was invalid: {e}. "
            "Return ONLY the corrected raw SQL, no markdown fences."
        )
        raw2 = call_llm(system, f"{user}\n\n{correction}", max_tokens=4096)
        sql = _strip_fences(raw2)
        sql = _validate_sql(sql, routine["type"])

    line_count = len(sql.splitlines())
    print(f"[+] Generated {line_count} lines for {routine['name']}")
    return sql
