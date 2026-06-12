"""Graph builder: generates nodes/edges for the architecture DAG.

Reads config from os.environ (populated by config_provider at startup).
Scans project-scoped paths for data assets.
"""
from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from pathlib import Path

from brickforge import PACKAGE_ROOT
from brickforge.lib.project_paths import gen_dir as _gen_dir


def _scan_dir(directory: Path, ext: str) -> list[str]:
    try:
        return sorted(f.stem for f in directory.iterdir() if f.suffix == ext)
    except FileNotFoundError:
        return []


def _dedup(project_items: list[str], demo_items: list[str]) -> list[str]:
    """Merge two lists, project items take precedence over demo items."""
    seen = set(project_items)
    return project_items + [i for i in demo_items if i not in seen]


def _parse_model_name(endpoint: str) -> str:
    m = re.search(r"serving-endpoints/([^/]+)/invocations", endpoint or "")
    return m.group(1) if m else (endpoint or "unknown")


def _scan_env_prefix(prefix: str, exclude_suffixes: tuple[str, ...] = ("_HEADER",)) -> list[tuple[str, str]]:
    """Scan os.environ for keys starting with prefix, return (slug, value) pairs."""
    results = []
    for key, val in os.environ.items():
        if not key.startswith(prefix) or not val.strip():
            continue
        if any(key.endswith(s) for s in exclude_suffixes):
            continue
        slug = key[len(prefix):]
        results.append((slug, val.strip()))
    return sorted(results)


def _scan_api_slugs() -> list[str]:
    """Extract unique API slugs from PROJECT_API_*_URL or PROJECT_API_*_CONN env vars."""
    slugs = set()
    for key in os.environ:
        if not key.startswith("PROJECT_API_"):
            continue
        rest = key[len("PROJECT_API_"):]
        parts = rest.rsplit("_", 1)
        if len(parts) == 2 and parts[1] in ("URL", "CONN", "METHOD", "PATH", "DESC"):
            slugs.add(parts[0])
    return sorted(slugs)


# Must match _FRAMEWORK_MODULES in agent/agent.py
_FRAMEWORK_TOOLS = {
    "sql_executor", "ka_factory", "api_factory", "a2a_factory",
    "generate_chart", "get_current_time", "tool_factory", "__init__",
}


def build_graph() -> dict:
    """Build the architecture graph from current env vars and project files."""
    endpoint = os.environ.get("AGENT_MODEL", "")
    model_name = _parse_model_name(endpoint)
    schema = os.environ.get("PROJECT_UNITY_CATALOG_SCHEMA", "")
    parts = schema.split(".", 1) if schema else ["", ""]
    catalog, schema_name = parts[0], parts[1] if len(parts) > 1 else ""

    # Scan tools (exclude framework modules)
    tools = [t for t in _scan_dir(PACKAGE_ROOT / "tools", ".py") if t not in _FRAMEWORK_TOOLS]

    # Scan data assets (project-scoped + demo, deduped)
    gd = _gen_dir()
    demo = PACKAGE_ROOT / "data" / "demo"
    funcs = _dedup(_scan_dir(gd / "func", ".sql"), _scan_dir(demo / "func", ".sql"))
    procs = _dedup(_scan_dir(gd / "proc", ".sql"), _scan_dir(demo / "proc", ".sql"))
    tables = _dedup(_scan_dir(gd / "csv", ".csv"), _scan_dir(demo / "csv", ".csv"))

    # Scan integrations from env vars
    genie_raw = os.environ.get("PROJECT_GENIE_SPACES", "")
    genie_keys = [s.strip() for s in genie_raw.split(",") if s.strip()] if genie_raw else []
    ka_endpoints = _scan_env_prefix("PROJECT_KA_")
    vs_index = os.environ.get("PROJECT_VS_INDEX", "").strip()
    mcp_servers = _scan_env_prefix("PROJECT_MCP_")
    a2a_agents = _scan_env_prefix("PROJECT_A2A_")
    api_slugs = _scan_api_slugs()
    lakebase = os.environ.get("LAKEBASE_INSTANCE_NAME", "").strip()

    # Scan enabled features
    features = []
    for key, val in sorted(os.environ.items()):
        if key.startswith("PROJECT_TOOL_") and val.strip().lower() == "true":
            name = key[len("PROJECT_TOOL_"):]
            features.append(name)

    nodes = []
    edges = []

    # ── Column 1: Agent (x=80) ─────────────────────────────────────────────
    nodes.append({
        "id": "agent", "type": "agent", "position": {"x": 80, "y": 300},
        "data": {"kind": "agent", "label": "Agent", "subtitle": "LangGraph ResponsesAgent",
                 "sourceFile": "agent/agent.py",
                 "meta": {"framework": "LangGraph", "server": "MLflow GenAI", "port": "8000"}},
    })

    # ── Column 2: Core wiring (x=380) ─────────────────────────────────────
    y_core = 60

    # LLM
    nodes.append({
        "id": "llm", "type": "llm", "position": {"x": 380, "y": y_core},
        "data": {"kind": "llm", "label": model_name or "(not set)", "subtitle": "Model endpoint",
                 "meta": {"endpoint": endpoint or "(not set)"}},
    })
    edges.append({"id": "e-agent-llm", "source": "agent", "target": "llm", "label": "uses model"})
    y_core += 140

    # Genie
    if genie_keys:
        nodes.append({
            "id": "genie", "type": "genie", "position": {"x": 380, "y": y_core},
            "data": {"kind": "genie",
                     "label": f"Genie ({len(genie_keys)} space{'s' if len(genie_keys) > 1 else ''})",
                     "subtitle": "MCP-based NL-to-SQL",
                     "meta": {"spaces": ", ".join(genie_keys)}},
        })
        edges.append({"id": "e-agent-genie", "source": "agent", "target": "genie", "label": "has MCP tool"})
        y_core += 140

    # Domain tools
    for i, tool in enumerate(tools):
        tid = f"tool-{i}"
        nodes.append({
            "id": tid, "type": "tool", "position": {"x": 380, "y": y_core + i * 80},
            "data": {"kind": "tool", "label": tool, "subtitle": "domain tool",
                     "sourceFile": f"tools/{tool}.py"},
        })
        edges.append({"id": f"e-agent-{tid}", "source": "agent", "target": tid, "label": "has tool"})

    # ── Column 3: Integrations (x=700) ────────────────────────────────────
    y_integ = 60

    # KA endpoints
    for i, (slug, url) in enumerate(ka_endpoints):
        nid = f"ka-{i}"
        nodes.append({
            "id": nid, "type": "tool", "position": {"x": 700, "y": y_integ},
            "data": {"kind": "tool", "label": slug.lower(), "subtitle": "Knowledge Assistant",
                     "meta": {"endpoint": url}},
        })
        edges.append({"id": f"e-agent-{nid}", "source": "agent", "target": nid, "label": "has brick"})
        y_integ += 80

    # Vector Search
    if vs_index:
        nodes.append({
            "id": "vs", "type": "tool", "position": {"x": 700, "y": y_integ},
            "data": {"kind": "tool", "label": "Vector Search", "subtitle": vs_index},
        })
        edges.append({"id": "e-agent-vs", "source": "agent", "target": "vs", "label": "has tool"})
        y_integ += 80

    # MCP servers
    for i, (slug, url) in enumerate(mcp_servers):
        nid = f"mcp-{i}"
        nodes.append({
            "id": nid, "type": "tool", "position": {"x": 700, "y": y_integ},
            "data": {"kind": "tool", "label": slug.lower(), "subtitle": "MCP server",
                     "meta": {"url": url}},
        })
        edges.append({"id": f"e-agent-{nid}", "source": "agent", "target": nid, "label": "has MCP tool"})
        y_integ += 80

    # A2A agents
    for i, (slug, url) in enumerate(a2a_agents):
        nid = f"a2a-{i}"
        nodes.append({
            "id": nid, "type": "tool", "position": {"x": 700, "y": y_integ},
            "data": {"kind": "tool", "label": slug.lower(), "subtitle": "A2A agent",
                     "meta": {"url": url}},
        })
        edges.append({"id": f"e-agent-{nid}", "source": "agent", "target": nid, "label": "delegates to"})
        y_integ += 80

    # External APIs
    for i, slug in enumerate(api_slugs):
        nid = f"api-{i}"
        api_type = "UC Connection" if os.environ.get(f"PROJECT_API_{slug}_CONN") else "Direct HTTP"
        nodes.append({
            "id": nid, "type": "tool", "position": {"x": 700, "y": y_integ},
            "data": {"kind": "tool", "label": slug.lower(), "subtitle": f"REST API ({api_type})"},
        })
        edges.append({"id": f"e-agent-{nid}", "source": "agent", "target": nid, "label": "has API tool"})
        y_integ += 80

    # Features (enabled only)
    for i, feat in enumerate(features):
        nid = f"feat-{i}"
        nodes.append({
            "id": nid, "type": "tool", "position": {"x": 700, "y": y_integ},
            "data": {"kind": "tool", "label": feat.capitalize(), "subtitle": "feature"},
        })
        edges.append({"id": f"e-agent-{nid}", "source": "agent", "target": nid, "label": "has feature"})
        y_integ += 80

    # Lakebase
    if lakebase:
        nodes.append({
            "id": "lakebase", "type": "data", "position": {"x": 700, "y": y_integ},
            "data": {"kind": "data", "label": lakebase, "subtitle": "Lakebase instance",
                     "dataVariant": "table"},
        })
        edges.append({"id": "e-agent-lakebase", "source": "agent", "target": "lakebase", "label": "checkpoints to"})

    # ── Column 4: Data layer (x=1020) ─────────────────────────────────────
    data_y = 60

    # Functions
    for i, fn in enumerate(funcs):
        nodes.append({
            "id": f"func-{i}", "type": "data", "position": {"x": 1020, "y": data_y},
            "data": {"kind": "data", "label": fn, "subtitle": "UC function", "dataVariant": "function",
                     "sourceFile": f"gen/func/{fn}.sql"},
        })
        data_y += 80

    # Procedures
    if procs:
        data_y += 20
    for i, proc in enumerate(procs):
        nodes.append({
            "id": f"proc-{i}", "type": "data", "position": {"x": 1020, "y": data_y},
            "data": {"kind": "data", "label": proc, "subtitle": "UC procedure", "dataVariant": "procedure",
                     "sourceFile": f"gen/proc/{proc}.sql"},
        })
        data_y += 80

    # Tables
    if tables:
        data_y += 20
    for i, table in enumerate(tables):
        tid = f"table-{i}"
        full_name = f"{catalog}.{schema_name}.{table}" if catalog and schema_name else table
        nodes.append({
            "id": tid, "type": "data", "position": {"x": 1020, "y": data_y},
            "data": {"kind": "data", "label": table, "subtitle": full_name, "dataVariant": "table",
                     "meta": {"catalog": catalog, "schema": schema_name, "table": table}},
        })
        if genie_keys:
            edges.append({"id": f"e-genie-{tid}", "source": "genie", "target": tid,
                          "label": "queries", "animated": True})
        data_y += 100

    # ── Empty state ───────────────────────────────────────────────────────
    if not tools and not funcs and not tables and not ka_endpoints and not mcp_servers and not a2a_agents:
        nodes.append({
            "id": "empty", "type": "data", "position": {"x": 500, "y": 300},
            "data": {"kind": "data", "label": "No domain loaded",
                     "subtitle": "Configure setup blocks to populate the architecture",
                     "dataVariant": "table"},
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "meta": {
            "projectRoot": str(PACKAGE_ROOT),
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        },
    }
