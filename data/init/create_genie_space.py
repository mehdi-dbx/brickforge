#!/usr/bin/env python3
"""
Create a Genie space named "PROJECT CHECKIN" with all tables from PROJECT_UNITY_CATALOG_SCHEMA.

Prints space_id to stdout. Updates .env.local with PROJECT_GENIE_CHECKIN.

Requires: PROJECT_UNITY_CATALOG_SCHEMA, DATABRICKS_WAREHOUSE_ID (or a warehouse in the workspace).
"""
import json
import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))
os.chdir(ROOT)
load_dotenv(ROOT / ".env.local", override=True)


def main():
    spec = os.environ.get("PROJECT_UNITY_CATALOG_SCHEMA") or ""
    if "." not in spec:
        print("Set PROJECT_UNITY_CATALOG_SCHEMA to catalog.schema in .env.local", file=sys.stderr)
        sys.exit(1)
    catalog, schema = spec.strip().split(".", 1)

    from databricks.sdk import WorkspaceClient
    token = os.environ.get("DATABRICKS_TOKEN")
    # Prefer token over profile to avoid databricks-cli auth when token is set
    if token:
        _profile = os.environ.pop("DATABRICKS_CONFIG_PROFILE", None)
        try:
            w = WorkspaceClient(host=os.environ.get("DATABRICKS_HOST"), token=token)
        finally:
            if _profile is not None:
                os.environ["DATABRICKS_CONFIG_PROFILE"] = _profile
    else:
        w = WorkspaceClient()

    wh_id = os.environ.get("DATABRICKS_WAREHOUSE_ID") or next(iter(w.warehouses.list()), None)
    if not wh_id:
        print("No warehouse. Set DATABRICKS_WAREHOUSE_ID or create one.", file=sys.stderr)
        sys.exit(1)
    wh_id = getattr(wh_id, "id", wh_id)

    tables = list(w.tables.list(catalog_name=catalog, schema_name=schema))
    if not tables:
        print(f"No tables in {catalog}.{schema}. Run csv_to_delta.py first.", file=sys.stderr)
        sys.exit(1)

    table_identifiers = []
    for t in tables:
        full = getattr(t, "full_name", None) or f"{catalog}.{schema}.{t.name}"
        table_identifiers.append(full)

    def gen_id():
        return uuid.uuid4().hex[:24] + "0" * 8

    title = os.environ.get("GENIE_ROOM_NAME", "").strip() or "PROJECT"
    description = "Natural language exploration of check-in and flight performance data in Unity Catalog."
    sample_questions = [
        {"id": gen_id(), "question": ["What are total check-ins by airline?"]},
        {"id": gen_id(), "question": ["Show load factor and SLA by airline"]},
    ]
    # Derive env var name from GENIE_ENV_KEY (if set) or room name slug
    env_var = os.environ.get("GENIE_ENV_KEY", "").strip()
    if not env_var:
        import re as _re
        slug = _re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_").upper()
        env_var = f"PROJECT_GENIE_{slug}"

    serialized = {
        "version": 2,
        "config": {"sample_questions": sample_questions},
        "data_sources": {
            "tables": [{"identifier": tid} for tid in table_identifiers],
            "metric_views": [],
        },
        "instructions": {
            "text_instructions": [],
            "example_question_sqls": [],
            "sql_functions": [],
            "join_specs": [],
            "sql_snippets": {"filters": [], "expressions": [], "measures": []},
        },
        "benchmarks": {"questions": []},
    }

    space = w.genie.create_space(
        warehouse_id=wh_id,
        serialized_space=json.dumps(serialized),
        title=title,
        description=description,
    )
    print(space.space_id)

    env_path = ROOT / ".env.local"
    import re as _re
    new_val = f"{env_var}={space.space_id}"
    lines = env_path.read_text().splitlines() if env_path.exists() else []
    new_lines, replaced = [], False
    for ln in lines:
        m = _re.match(r"^(\s*)(#?\s*)([A-Za-z_][A-Za-z0-9_]*)\s*=", ln)
        if m and m.group(3) == env_var and not ln.strip().startswith("#"):
            new_lines.append(new_val)
            replaced = True
        else:
            new_lines.append(ln)
    if not replaced:
        new_lines.append(new_val)
    env_path.write_text("\n".join(new_lines) + "\n")
    print(f"Updated {env_path} with {env_var}={space.space_id}", file=sys.stderr)


if __name__ == "__main__":
    main()
