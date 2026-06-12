# Data Generation

BrickForge includes an AI-powered data generation wizard that creates your entire data layer from a plain-English domain description.

## The wizard flow

### Step 1: Describe your domain

Enter a description like:

> "E-commerce platform with customers, products, orders, and reviews."

The wizard sends this to your configured Foundation Model endpoint.

### Step 2: Generate table schemas

The LLM designs table schemas - column names, types, constraints, relationships. Review and adjust before proceeding.

Source: `brickforge/data/gen/schema_generator.py`

### Step 3: Generate synthetic data

From the schemas, the LLM generates realistic synthetic rows as CSV files. Saved to `projects/{name}/gen/csv/`.

Source: `brickforge/data/gen/data_generator.py`

### Step 4: Provision to Unity Catalog

BrickForge creates Delta tables from the generated CSVs using `CREATE TABLE` DDL + CSV-to-Delta ingestion. Tables land in your configured `catalog.schema`.

### Step 5: Generate UC functions and stored procedures

The routines wizard takes your table context and generates:

- **UC functions** - SQL functions that query and aggregate your data
- **Stored procedures** - mutation operations (inserts, updates, deletes)

Source: `brickforge/data/gen/routine_schema_generator.py`, `brickforge/data/gen/routine_sql_generator.py`

Generated SQL files are written to `projects/{name}/gen/func/` and tracked in `routine_manifest.json`.

## Data sources

BrickForge supports three data sources, controlled by flags in `config.json`:

| Source | Config flag | Directory | Description |
|--------|-----------|-----------|-------------|
| Demo | `data.use_demo_data` | `brickforge/data/demo/` | Pre-built seed data (CSV, DDL, functions, procedures). Ships with the package. |
| Generated | `data.use_gen_data` | `projects/{name}/gen/` | AI-generated from your domain description. Project-scoped. |
| Uploaded | (manual) | (user-specified) | Your own CSVs uploaded through the setup block. |

Both demo and generated data can be active simultaneously. The provisioning scripts combine them.

## The 5-layer SQL defense system

Generating valid Databricks SQL from an LLM is hard. Databricks SQL has strict syntax rules the model doesn't know natively. BrickForge uses a 5-layer defense system to prevent and auto-correct errors:

| Layer | Name | Location | What it does |
|-------|------|----------|-------------|
| 0 | Hardened prompt | `routine_sql_generator.py` | Explicit instructions: "Write Databricks SQL only. Be minimalist." + banned syntax list. |
| 1 | Knowledge base | `databricks_sql_reference.md` | Compact Databricks SQL spec injected into every LLM call. Auto-grows via Layer 4. |
| 2 | Sanitizer | `_sanitize_sql()` | Post-generation regex fixes: strips `SQL SECURITY INVOKER`, fixes `LIMIT` in params, reorders `DEFAULT` params. |
| 3 | Self-healing | `_self_heal()` | On provision failure: captures the SQL error, sends error + SQL back to LLM for correction, sanitizes again, retries (max 2 attempts). |
| 4 | Learning loop | `_learn_constraint()` | On successful self-heal: appends the new constraint to `databricks_sql_reference.md` so future generations avoid the same error. |

### How self-healing works

```
Generate SQL
    |
    v
Sanitize (Layer 2)
    |
    v
Provision to UC
    |
    +-- Success -> done
    |
    +-- Failure -> capture error
                    |
                    v
                Send error + SQL to LLM (Layer 3)
                    |
                    v
                Sanitize again (Layer 2)
                    |
                    v
                Retry provision
                    |
                    +-- Success -> learn constraint (Layer 4)
                    +-- Failure -> retry once more or fail
```

## Generated artifacts

After a full wizard run, your project directory contains:

```
projects/{name}/gen/
  csv/                    # Generated CSV files
  init/                   # DDL SQL for table creation
  func/                   # Generated UC function SQL files
  manifest.json           # Tracks generated tables
  routine_manifest.json   # Tracks generated routines
  wizard-state.json       # Wizard progress state
```

## Provisioning pipeline

The full provisioning pipeline runs as a subprocess via SSE streaming:

1. `create_catalog_schema.py` - create catalog + schema if needed
2. `csv_to_delta.py` - load CSVs into Delta tables
3. `create_genie_space.py` - create Genie space with table context
4. `create_all_functions.py` - provision UC functions from `demo/func/` + `gen/func/`
5. `create_all_procedures.py` - provision stored procedures
6. `create_lakebase.py` - create Lakebase instance (if enabled)

Each step streams output back to the Setup App terminal.

!!! note
    Stored procedures in Databricks SQL cannot use `BEGIN...END` compound statements via `%sql`. BrickForge uses `spark.sql()` for procedure provisioning.
