"""Dynamic tool factory for .forge-declared SQL and action tools.

Reads tool specs from .forge config and generates @tool functions at runtime.
All query tools call UC functions (no local SQL file reads).
Action tools call UC stored procedures.

Two tool patterns:
  1. SQL read  -- calls a UC function: SELECT * FROM TABLE(schema.func(args))
  2. Action    -- calls a UC stored procedure: CALL schema.proc(args)
"""

import logging
import os
import re

from langchain_core.tools import tool

from data.py.sql_utils import get_schema_qualified
from tools.sql_executor import (
    _escape_sql_string,
    execute_query,
    execute_statement,
    format_query_result,
    get_warehouse,
)

_log = logging.getLogger(__name__)

_SAFE_NAME_RE = re.compile(r"[^a-zA-Z0-9_]")


# ---------------------------------------------------------------------------
# Pattern 1: SQL read tool (UC function call)
# ---------------------------------------------------------------------------

def create_sql_read_tool(
    name: str,
    function_name: str,
    params: list[str],
    description: str,
):
    """Create a @tool that calls a UC function and returns the result.

    The function is invoked as
    ``SELECT * FROM TABLE(<schema>.<function_name>('<p1>', '<p2>', ...))``.
    """

    safe_func = _SAFE_NAME_RE.sub("", function_name)

    @tool
    def sql_read_tool(**kwargs: str) -> str:  # noqa: D401
        """Placeholder docstring -- replaced below."""
        try:
            w, wh_id = get_warehouse()
            schema = get_schema_qualified()
            args_sql = ", ".join(
                f"'{_escape_sql_string(str(kwargs.get(p, '')))}'" for p in params
            )
            stmt = f"SELECT * FROM TABLE({schema}.{safe_func}({args_sql}))"
            columns, rows = execute_query(w, wh_id, stmt)
            return format_query_result(columns, rows)
        except Exception as e:
            return f"Error executing {name}: {e}"

    sql_read_tool.__name__ = name
    sql_read_tool.name = name
    sql_read_tool.__doc__ = description
    sql_read_tool.args_schema = _build_args_schema(name, params, description)

    _log.info("SQL-read tool registered: %s -> UC function %s", name, safe_func)
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
    """Create a @tool that calls the stored procedure *procedure_name*.

    The procedure is invoked as
    ``CALL <schema>.<procedure_name>('<p1>', '<p2>', ...)``.
    """

    safe_proc = _SAFE_NAME_RE.sub("", procedure_name)

    @tool
    def action_tool(**kwargs: str) -> str:  # noqa: D401
        """Placeholder docstring -- replaced below."""
        try:
            w, wh_id = get_warehouse()
            schema = get_schema_qualified()
            args_sql = ", ".join(
                f"'{_escape_sql_string(str(kwargs.get(p, '')))}'" for p in params
            )
            stmt = f"CALL {schema}.{safe_proc}({args_sql})"
            execute_statement(w, wh_id, stmt)
            param_summary = ", ".join(f"{p}={kwargs.get(p, '')}" for p in params)
            return f"Procedure {safe_proc} executed successfully ({param_summary})."
        except Exception as e:
            return f"Error executing {name}: {e}"

    action_tool.__name__ = name
    action_tool.name = name
    action_tool.__doc__ = description
    action_tool.args_schema = _build_args_schema(name, params, description)

    _log.info("Action tool registered: %s -> UC procedure %s", name, safe_proc)
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
              "name": "query_flights_at_risk",
              "type": "sql_read",
              "function": "flights_at_risk",
              "params": ["zone", "time_start", "time_end"],
              "description": "Flights at risk of delay in a zone within a time window"
            },
            {
              "name": "update_flight_risk",
              "type": "action",
              "procedure": "update_flight_risk",
              "params": ["flight_number", "at_risk"],
              "description": "Mark a flight as at-risk or normal"
            }
          ]
        }

    Tool specs can come from:
      - FORGE_TOOLS_JSON env var (JSON string)
      - .forge project config (loaded by config provider)
    """
    import json

    tools_list = forge_config.get("tools", [])

    # If no tools in config, try FORGE_TOOLS_JSON env var
    if not tools_list:
        raw = os.environ.get("FORGE_TOOLS_JSON", "").strip()
        if raw:
            try:
                tools_list = json.loads(raw)
            except json.JSONDecodeError:
                _log.warning("FORGE_TOOLS_JSON is not valid JSON, skipping")

    tools = []
    for spec in tools_list:
        tool_type = spec.get("type", "")
        tool_name = spec.get("name", "")
        params = spec.get("params", [])
        desc = spec.get("description", tool_name)

        if tool_type == "sql_read":
            func = spec.get("function", "")
            if not func:
                _log.warning("Skipping sql_read tool %s: no function name", tool_name)
                continue
            t = create_sql_read_tool(tool_name, func, params, desc)
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


# ---------------------------------------------------------------------------
# UC function discovery from PROJECT_FUNCTIONS env var
# ---------------------------------------------------------------------------

def discover_uc_function_tools() -> list:
    """Read ``PROJECT_FUNCTIONS`` env var and create sql_read tools.

    Each comma-separated function name is resolved against Unity Catalog
    to fetch its input parameters, then wrapped via ``create_sql_read_tool``.
    """
    raw = os.environ.get("PROJECT_FUNCTIONS", "").strip()
    if not raw:
        return []

    schema = os.environ.get("PROJECT_UNITY_CATALOG_SCHEMA", "").strip()
    if not schema or schema.count(".") != 1:
        _log.warning("PROJECT_FUNCTIONS set but PROJECT_UNITY_CATALOG_SCHEMA missing or invalid (expected catalog.schema, got '%s')", schema)
        return []

    func_names = [f.strip() for f in raw.split(",") if f.strip()]
    if not func_names:
        return []

    cat, sch = schema.split(".", 1)

    # Fetch UC metadata for param discovery
    try:
        from databricks.sdk import WorkspaceClient
        w = WorkspaceClient()
        uc_funcs = {fn.name: fn for fn in w.functions.list(catalog_name=cat, schema_name=sch) if fn.name}
    except Exception as e:
        _log.warning("Could not list UC functions in %s: %s — creating tools without params", schema, e)
        uc_funcs = {}

    tools = []
    for func_name in func_names:
        uc_info = uc_funcs.get(func_name)
        params = []
        desc = uc_info.comment if uc_info and uc_info.comment else f"Query {func_name.replace('_', ' ')}"

        if uc_info and uc_info.input_params and uc_info.input_params.parameters:
            params = [p.name for p in uc_info.input_params.parameters if p.name]
        elif uc_funcs:
            _log.warning("UC function '%s' not found in %s — registering with no params", func_name, schema)

        t = create_sql_read_tool(func_name, func_name, params, desc)
        tools.append(t)

    _log.info("Discovered %d UC function tool(s) from PROJECT_FUNCTIONS", len(tools))
    return tools
