#!/usr/bin/env python3
"""CLI orchestrator for synthetic data generation.

Invoked by the visual backend via subprocess. Communicates progress via
[+]/[~]/[x] prefixed stdout lines and returns results via __RESULT__:{json}.

Modes:
  --mode=schema  --domain="..."     Generate table schemas from domain description
  --mode=data                       Generate rows for a table (reads JSON from stdin)
  --mode=save                       Write CSV + SQL for a table (reads JSON from stdin)
  --mode=provision-gen              Create generated tables in Databricks (only data/gen/init SQL)
"""
from __future__ import annotations

import argparse
import json
import sys
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env.local", override=True)


def _emit_result(data: dict | list) -> None:
    """Print a result line the backend can parse."""
    print(f"__RESULT__:{json.dumps(data)}", flush=True)


def mode_schema(domain: str) -> None:
    from data.gen.schema_generator import generate_schema
    try:
        tables = generate_schema(domain)
        _emit_result({"tables": tables})
    except Exception as e:
        print(f"[x] Schema generation failed: {e}")
        traceback.print_exc()
        sys.exit(1)


def mode_data() -> None:
    from data.gen.data_generator import generate_data
    try:
        input_data = json.loads(sys.stdin.read())
        table = input_data["table"]
        context_tables = input_data.get("contextTables")
        rows = generate_data(table, context_tables)
        _emit_result({"rows": rows})
    except Exception as e:
        print(f"[x] Data generation failed: {e}")
        traceback.print_exc()
        sys.exit(1)


def mode_save() -> None:
    from data.gen.writer import write_csv, write_create_sql, write_manifest
    try:
        input_data = json.loads(sys.stdin.read())
        table = input_data["table"]
        rows = input_data["rows"]
        columns = table["columns"]

        write_csv(table["name"], columns, rows)
        write_create_sql(table["name"], columns, rows)

        # Update manifest with all saved tables so far
        all_tables = input_data.get("allTables", [table])
        write_manifest(all_tables)

        _emit_result({"ok": True, "table": table["name"]})
    except Exception as e:
        print(f"[x] Save failed: {e}")
        traceback.print_exc()
        sys.exit(1)


def mode_provision_gen() -> None:
    """Run only the generated table SQL files via data/py/run_sql.py."""
    import subprocess

    gen_init = ROOT / "data" / "gen" / "init"
    if not gen_init.exists():
        print("[x] No generated SQL files found in data/gen/init/")
        sys.exit(1)

    sql_files = sorted(gen_init.glob("create_*.sql"))
    if not sql_files:
        print("[x] No create_*.sql files found in data/gen/init/")
        sys.exit(1)

    # Ensure catalog/schema exists first
    print("[~] Ensuring catalog and schema exist...")
    sys.stdout.flush()
    r = subprocess.run(
        ["uv", "run", "python", "data/init/create_catalog_schema.py"],
        cwd=ROOT, capture_output=True, text=True,
    )
    if r.returncode != 0:
        print(f"[x] create_catalog_schema failed: {r.stderr.strip() or r.stdout.strip()}")
        sys.exit(1)
    print("[+] Catalog and schema ready")

    # Run each generated SQL file
    total = len(sql_files)
    for i, sql_file in enumerate(sql_files, 1):
        rel = str(sql_file.relative_to(ROOT))
        print(f"[~] ({i}/{total}) Running {rel}...")
        sys.stdout.flush()
        r = subprocess.run(
            ["uv", "run", "python", "data/py/run_sql.py", rel],
            cwd=ROOT, capture_output=True, text=True,
        )
        if r.returncode != 0:
            print(f"[x] Failed: {r.stderr.strip() or r.stdout.strip()}")
            sys.exit(1)
        table_name = sql_file.stem.replace("create_", "")
        print(f"[+] Created table: {table_name}")

    print(f"[+] All {total} generated table(s) provisioned")
    _emit_result({"ok": True, "tables": total})


def main() -> None:
    parser = argparse.ArgumentParser(description="Synthetic data generation orchestrator")
    parser.add_argument("--mode", required=True, choices=["schema", "data", "save", "provision-gen"])
    parser.add_argument("--domain", default="")
    args = parser.parse_args()

    if args.mode == "schema":
        if not args.domain:
            print("[x] --domain is required for schema mode")
            sys.exit(1)
        mode_schema(args.domain)
    elif args.mode == "data":
        mode_data()
    elif args.mode == "save":
        mode_save()
    elif args.mode == "provision-gen":
        mode_provision_gen()


if __name__ == "__main__":
    main()
