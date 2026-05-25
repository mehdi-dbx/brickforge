"""Dynamic tool factory for .forge-declared SQL and action tools.

Reads tool specs from a config dict (later sourced from .forge YAML) and
generates @tool functions at runtime -- the same pattern as ka_factory.py.

Two tool patterns:
  1. SQL read  -- reads SQL from a func/ file, substitutes params, executes via warehouse
  2. Action    -- calls a UC stored procedure with params
"""

import logging
from pathlib import Path

from langchain_core.tools import tool

from data.py.sql_utils import get_schema_qualified, substitute_schema
from tools.sql_executor import (
    _escape_sql_string,
    execute_query,
    execute_statement,
    format_query_result,
    get_warehouse,
)

_log = logging.getLogger(__name__)

_FUNC_DIR = Path(__file__).resolve().parents[2] / "data" / "func"


# ---------------------------------------------------------------------------
# Pattern 1: SQL read tool
# ---------------------------------------------------------------------------

def create_sql_read_tool(
    name: str,
    function_sql_file: str,
    params: list[str],
    description: str,
):
    """Create a @tool that reads SQL from *function_sql_file*, substitutes
    *params* into it, and returns the query result as a formatted string.

    ``function_sql_file`` is resolved relative to ``data/func/``.
    Parameter placeholders in the SQL must be ``{param_name}``.
    """

    sql_path = _FUNC_DIR / function_sql_file

    @tool
    def sql_read_tool(**kwargs: str) -> str:  # noqa: D401
        """Placeholder docstring -- replaced below."""
        try:
            w, wh_id = get_warehouse()
            raw_sql = sql_path.read_text().strip()
            stmt = substitute_schema(raw_sql)
            for p in params:
                value = kwargs.get(p, "")
                stmt = stmt.replace(f"{{{p}}}", _escape_sql_string(str(value)))
            columns, rows = execute_query(w, wh_id, stmt)
            return format_query_result(columns, rows)
        except Exception as e:
            return f"Error executing {name}: {e}"

    # Patch LangChain metadata so the agent sees the right name/description.
    sql_read_tool.__name__ = name
    sql_read_tool.name = name
    sql_read_tool.__doc__ = description

    # Build a proper schema so LangChain knows each param is a string arg.
    sql_read_tool.args_schema = _build_args_schema(name, params, description)

    _log.info("SQL-read tool registered: %s -> %s", name, function_sql_file)
    return sql_read_tool


# ---------------------------------------------------------------------------
# Pattern 2: Action tool (stored procedure)
# ---------------------------------------------------------------------------

def create_action_tool(
    name: str,
    procedure_name: str,
    params: list[str],
    description: str,
):
    """Create a @tool that calls the stored procedure *procedure_name* with
    the given *params*.

    The procedure is invoked as
    ``CALL <schema>.<procedure_name>('<p1>', '<p2>', ...)``.
    """

    @tool
    def action_tool(**kwargs: str) -> str:  # noqa: D401
        """Placeholder docstring -- replaced below."""
        try:
            w, wh_id = get_warehouse()
            schema = get_schema_qualified()
            args_sql = ", ".join(
                f"'{_escape_sql_string(str(kwargs.get(p, '')))}'" for p in params
            )
            stmt = f"CALL {schema}.{procedure_name}({args_sql})"
            execute_statement(w, wh_id, stmt)
            param_summary = ", ".join(f"{p}={kwargs.get(p, '')}" for p in params)
            return f"Procedure {procedure_name} executed successfully ({param_summary})."
        except Exception as e:
            return f"Error executing {name}: {e}"

    action_tool.__name__ = name
    action_tool.name = name
    action_tool.__doc__ = description

    action_tool.args_schema = _build_args_schema(name, params, description)

    _log.info("Action tool registered: %s -> %s", name, procedure_name)
    return action_tool


# ---------------------------------------------------------------------------
# Schema helper
# ---------------------------------------------------------------------------

def _build_args_schema(tool_name: str, params: list[str], description: str):
    """Return a Pydantic model suitable for LangChain ``args_schema``."""
    from pydantic import Field, create_model

    fields = {p: (str, Field(description=p)) for p in params}
    model = create_model(f"{tool_name}_schema", **fields)
    model.__doc__ = description
    return model


# ---------------------------------------------------------------------------
# Discovery entry-point
# ---------------------------------------------------------------------------

def discover_forge_tools(forge_config: dict) -> list:
    """Read the ``tools`` section of *forge_config* and create all tools.

    Expected structure::

        {
          "tools": [
            {
              "name": "query_inventory",
              "type": "sql_read",
              "sql_file": "inventory.sql",
              "params": ["warehouse_id"],
              "description": "Query current inventory levels by warehouse"
            },
            {
              "name": "update_status",
              "type": "action",
              "procedure": "update_status",
              "params": ["item_id", "new_status"],
              "description": "Update item status"
            }
          ]
        }
    """
    tools = []
    for spec in forge_config.get("tools", []):
        tool_type = spec.get("type", "")
        tool_name = spec.get("name", "")
        params = spec.get("params", [])
        desc = spec.get("description", tool_name)

        if tool_type == "sql_read":
            sql_file = spec.get("sql_file", "")
            if not sql_file:
                _log.warning("Skipping sql_read tool %s: no sql_file", tool_name)
                continue
            t = create_sql_read_tool(tool_name, sql_file, params, desc)
            tools.append(t)

        elif tool_type == "action":
            procedure = spec.get("procedure", "")
            if not procedure:
                _log.warning("Skipping action tool %s: no procedure", tool_name)
                continue
            t = create_action_tool(tool_name, procedure, params, desc)
            tools.append(t)

        else:
            _log.warning("Unknown tool type '%s' for tool '%s'", tool_type, tool_name)

    return tools
