"""Generate SQL function/procedure schemas from a domain description using the LLM."""
from __future__ import annotations

import re
from typing import Any

from data.gen.llm_client import call_llm_json

ALLOWED_TYPES = frozenset(
    ["STRING", "INT", "BIGINT", "DOUBLE", "FLOAT", "BOOLEAN", "DATE", "TIMESTAMP_NTZ"]
)

SYSTEM_PROMPT = """\
You are a SQL architect designing functions and stored procedures for Databricks Unity Catalog.

Given the user's domain description and existing table schemas, design SQL routines that complement the data model.

Return ONLY a JSON object — no markdown, no explanation:
{{
  "routines": [
    {{
      "name": "snake_case_routine_name",
      "type": "function" or "procedure",
      "description": "What this routine does",
      "parameters": [
        {{"name": "param_name", "sql_type": "SPARK_SQL_TYPE"}}
      ],
      "tables_referenced": ["table_name_1", "table_name_2"],
      "instructions": "Detailed instructions for generating the SQL code"
    }}
  ]
}}

Rules:
- Design 3-8 routines total, balanced between functions and procedures
- **Functions** (type: "function"): read-only SELECT query templates used by an AI agent to look up data
  - These are query templates, NOT CREATE FUNCTION DDL
  - They use {{param_name}} placeholders for user-supplied parameters
  - They reference tables via __SCHEMA_QUALIFIED__ placeholder
- **Procedures** (type: "procedure"): write operations (UPDATE, INSERT, DELETE) wrapped in CREATE OR REPLACE PROCEDURE
  - Parameters use IN param_name TYPE syntax
  - They reference tables via __SCHEMA_QUALIFIED__ placeholder
- Names: lowercase snake_case, letters/digits/underscores only
- Parameter sql_type must be one of: STRING, INT, BIGINT, DOUBLE, FLOAT, BOOLEAN, DATE, TIMESTAMP_NTZ
- tables_referenced: list the table names this routine reads from or writes to
- instructions: describe the business logic, filtering conditions, join logic, what to return/update
- Make the routines practical for an AI agent assistant that queries data and takes actions"""


def _validate_name(name: str) -> str:
    """Ensure name is valid snake_case."""
    cleaned = re.sub(r"[^a-z0-9_]", "_", name.lower()).strip("_")
    if not cleaned or not cleaned[0].isalpha():
        cleaned = "r_" + cleaned
    return cleaned


def _validate_type(sql_type: str) -> str:
    """Return a valid Spark SQL type, falling back to STRING."""
    upper = sql_type.upper().strip()
    return upper if upper in ALLOWED_TYPES else "STRING"


def _validate_routine(routine: dict[str, Any]) -> dict[str, Any]:
    """Validate and clean a single routine definition."""
    name = _validate_name(routine.get("name", "unnamed_routine"))
    rtype = routine.get("type", "function")
    if rtype not in ("function", "procedure"):
        rtype = "function"

    params = []
    for p in routine.get("parameters", []):
        p_name = _validate_name(p.get("name", "param"))
        p_type = _validate_type(p.get("sql_type", "STRING"))
        params.append({"name": p_name, "sql_type": p_type})

    tables_ref = []
    for t in routine.get("tables_referenced", []):
        if isinstance(t, str) and t.strip():
            tables_ref.append(t.strip())

    description = routine.get("description", "")
    if not isinstance(description, str):
        description = str(description)

    instructions = routine.get("instructions", "")
    if not isinstance(instructions, str):
        instructions = str(instructions)

    return {
        "name": name,
        "type": rtype,
        "description": description,
        "parameters": params,
        "tables_referenced": tables_ref,
        "instructions": instructions,
    }


def generate_routine_schema(
    domain_description: str,
    table_schemas: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Generate routine schemas from a domain description and optional table context.

    Returns a list of validated routine definitions.
    """
    print(f"[+] Generating routine schemas for: {domain_description[:80]}...")

    user_prompt = domain_description
    if table_schemas:
        user_prompt += "\n\nExisting table schemas for context:"
        for t in table_schemas:
            cols = ", ".join(f"{c['name']} {c['type']}" for c in t.get("columns", []))
            user_prompt += f"\n  - {t['name']}: [{cols}]"

    result = call_llm_json(SYSTEM_PROMPT, user_prompt)

    routines_raw = result.get("routines", [])
    if not isinstance(routines_raw, list) or len(routines_raw) == 0:
        raise ValueError("LLM returned no routines in schema")

    routines = [_validate_routine(r) for r in routines_raw]

    func_count = sum(1 for r in routines if r["type"] == "function")
    proc_count = sum(1 for r in routines if r["type"] == "procedure")
    print(f"[+] Generated {len(routines)} routine(s): {func_count} function(s), {proc_count} procedure(s)")
    for r in routines:
        params_str = ", ".join(f"{p['name']} {p['sql_type']}" for p in r["parameters"])
        print(f"    [{r['type'][:4]}] {r['name']}({params_str})")

    return routines
