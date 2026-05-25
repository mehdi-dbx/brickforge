#!/usr/bin/env python3
"""CLI orchestrator for SQL function/procedure generation.

Invoked by the visual backend via subprocess. Communicates progress via
[+]/[~]/[x] prefixed stdout lines and returns results via __RESULT__:{json}.

Modes:
  --mode=schema  --domain="..." [--tables-json="[...]"]  Generate routine schemas
  --mode=sql                                              Generate SQL for one routine (stdin JSON)
  --mode=save                                             Write SQL file for one routine (stdin JSON)
  --mode=provision-gen                                    Provision generated procedures to Databricks
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
load_dotenv(os.environ.get("ENV_FILE", str(ROOT / ".env.local")), override=True)


def _emit_result(data: dict | list) -> None:
    """Print a result line the backend can parse."""
    print(f"__RESULT__:{json.dumps(data)}", flush=True)


def mode_schema(domain: str, tables_json: str | None) -> None:
    from data.gen.routine_schema_generator import generate_routine_schema

    table_schemas = None
    if tables_json:
        try:
            table_schemas = json.loads(tables_json)
        except json.JSONDecodeError:
            print("[~] Could not parse --tables-json, proceeding without table context")

    try:
        routines = generate_routine_schema(domain, table_schemas)
        _emit_result({"routines": routines})
    except Exception as e:
        print(f"[x] Schema generation failed: {e}")
        traceback.print_exc()
        sys.exit(1)


def mode_sql() -> None:
    from data.gen.routine_sql_generator import generate_routine_sql

    try:
        input_data = json.loads(sys.stdin.read())
        routine = input_data["routine"]
        table_schemas = input_data.get("tableSchemas")
        sql = generate_routine_sql(routine, table_schemas)
        _emit_result({"sql": sql})
    except Exception as e:
        print(f"[x] SQL generation failed: {e}")
        traceback.print_exc()
        sys.exit(1)


def mode_save() -> None:
    from data.gen.routine_writer import (
        write_function_sql,
        write_procedure_sql,
        write_routine_manifest,
    )

    try:
        input_data = json.loads(sys.stdin.read())
        routine = input_data["routine"]
        sql = input_data["sql"]

        if routine["type"] == "procedure":
            write_procedure_sql(routine["name"], sql)
        else:
            write_function_sql(routine["name"], sql)

        # Update manifest with all routines so far
        all_routines = input_data.get("allRoutines", [routine])
        write_routine_manifest(all_routines)

        _emit_result({"ok": True, "routine": routine["name"]})
    except Exception as e:
        print(f"[x] Save failed: {e}")
        traceback.print_exc()
        sys.exit(1)


def mode_provision_gen() -> None:
    """Run generated procedure SQL files via data/py/run_sql.py.

    Functions are query templates (not DDL) and are NOT provisioned.
    Only procedures (CREATE OR REPLACE PROCEDURE) are executed.
    """
    import subprocess

    gen_proc = ROOT / "data" / "gen" / "proc"
    if not gen_proc.exists():
        print("[x] No generated procedure files found in data/gen/proc/")
        sys.exit(1)

    sql_files = sorted(gen_proc.glob("*.sql"))
    if not sql_files:
        print("[x] No .sql files found in data/gen/proc/")
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

    # Run each generated procedure SQL file
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
        proc_name = sql_file.stem
        print(f"[+] Created procedure: {proc_name}")

    # Count function templates saved (informational only)
    gen_func = ROOT / "data" / "gen" / "func"
    func_count = len(list(gen_func.glob("*.sql"))) if gen_func.exists() else 0

    print(f"[+] Provisioned {total} procedure(s)")
    if func_count:
        print(f"[+] {func_count} function template(s) saved locally (query templates, not provisioned)")
    _emit_result({"ok": True, "procedures": total, "functions": func_count})


def main() -> None:
    parser = argparse.ArgumentParser(description="SQL function/procedure generation orchestrator")
    parser.add_argument("--mode", required=True, choices=["schema", "sql", "save", "provision-gen"])
    parser.add_argument("--domain", default="")
    parser.add_argument("--tables-json", default=None)
    args = parser.parse_args()

    if args.mode == "schema":
        if not args.domain:
            print("[x] --domain is required for schema mode")
            sys.exit(1)
        mode_schema(args.domain, args.tables_json)
    elif args.mode == "sql":
        mode_sql()
    elif args.mode == "save":
        mode_save()
    elif args.mode == "provision-gen":
        mode_provision_gen()


if __name__ == "__main__":
    main()
