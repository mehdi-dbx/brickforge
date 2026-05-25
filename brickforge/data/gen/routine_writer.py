"""Write generated SQL files for functions and procedures."""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent.parent.parent
GEN_DIR = ROOT / "data" / "gen"
FUNC_DIR = GEN_DIR / "func"
PROC_DIR = GEN_DIR / "proc"
MANIFEST_PATH = GEN_DIR / "routine_manifest.json"


def write_function_sql(name: str, sql: str) -> Path:
    """Write a function query template to data/gen/func/<name>.sql."""
    FUNC_DIR.mkdir(parents=True, exist_ok=True)
    path = FUNC_DIR / f"{name}.sql"
    with open(path, "w", encoding="utf-8") as f:
        f.write(sql + "\n")
    print(f"[+] Wrote {path.relative_to(ROOT)}")
    return path


def write_procedure_sql(name: str, sql: str) -> Path:
    """Write a procedure DDL to data/gen/proc/<name>.sql."""
    PROC_DIR.mkdir(parents=True, exist_ok=True)
    path = PROC_DIR / f"{name}.sql"
    with open(path, "w", encoding="utf-8") as f:
        f.write(sql + "\n")
    print(f"[+] Wrote {path.relative_to(ROOT)}")
    return path


def write_routine_manifest(routines: list[dict[str, Any]]) -> Path:
    """Write data/gen/routine_manifest.json with metadata about generated routines."""
    manifest = {
        "generated_at": datetime.now().isoformat(),
        "routines": [
            {
                "name": r["name"],
                "type": r["type"],
                "description": r.get("description", ""),
                "parameters": r.get("parameters", []),
                "tables_referenced": r.get("tables_referenced", []),
                "instructions": r.get("instructions", ""),
            }
            for r in routines
        ],
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"[+] Wrote {MANIFEST_PATH.relative_to(ROOT)}")
    return MANIFEST_PATH


def clear_all_generated_routines() -> None:
    """Remove all generated function/procedure SQL files and reset manifest."""
    count = 0
    for d in (FUNC_DIR, PROC_DIR):
        if d.exists():
            for f in d.iterdir():
                if f.is_file():
                    f.unlink()
                    count += 1
    if MANIFEST_PATH.exists():
        MANIFEST_PATH.unlink()
    print(f"[+] Cleared {count} generated routine file(s)")
