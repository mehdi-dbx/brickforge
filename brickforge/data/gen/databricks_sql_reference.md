# Databricks SQL Reference -- CREATE FUNCTION & CREATE PROCEDURE

You are writing **Databricks SQL**. Not standard SQL. Not PostgreSQL. Not MySQL.
Databricks has strict syntax rules. Follow this reference exactly.

## FUNCTION rules

```sql
CREATE OR REPLACE FUNCTION schema.name(params) RETURNS TABLE(cols) LANGUAGE SQL RETURN SELECT ...;
```

- Use `RETURN SELECT ...` -- NOT `BEGIN...END`
- NO `SQL SECURITY INVOKER` -- not supported for functions
- NO `LIMIT p_param` -- LIMIT must be a literal constant (e.g. `LIMIT 100`), never a parameter
- NO `DETERMINISTIC`, `CONTAINS SQL`, `READS SQL DATA` -- omit all optional characteristics
- NO `TEMPORARY`, no `IF NOT EXISTS` combined with `OR REPLACE`
- NO write operations (`UPDATE`, `INSERT`, `DELETE`) -- functions are read-only
- Parameters with `DEFAULT` must come AFTER all parameters without `DEFAULT`
- `DEFAULT` expressions cannot reference other parameters
- Always include `LANGUAGE SQL` before `RETURN`
- Always use `RETURNS TABLE(col1 TYPE, col2 TYPE)` with explicit columns

## PROCEDURE rules

```sql
CREATE OR REPLACE PROCEDURE schema.name(IN p TYPE) LANGUAGE SQL SQL SECURITY INVOKER AS BEGIN ... END;
```

- Use `BEGIN...END` block
- `SQL SECURITY INVOKER` IS allowed for procedures
- `IN` keyword before each parameter
- End with `SELECT 'status' AS status;` for agent feedback

## Parameter types (allowed)

STRING, INT, BIGINT, DOUBLE, FLOAT, BOOLEAN, DATE, TIMESTAMP_NTZ

## Style rules

- Be minimalist. Fewer parameters is better. Fewer columns is better.
- Do NOT add parameters the user didn't ask for.
- Do NOT add DEFAULT unless the routine genuinely needs optional filtering.
- Do NOT add LIMIT unless explicitly requested.
- Prefix parameters with `p_` to avoid column name collisions.
- Use `__SCHEMA_QUALIFIED__` before every table and routine name.

## Working function example (simple)

```sql
CREATE OR REPLACE FUNCTION __SCHEMA_QUALIFIED__.checkin_metrics(
    p_flight_number STRING
)
RETURNS TABLE(flight_number STRING, zone STRING, departure_time TIMESTAMP_NTZ, delay_risk STRING, status STRING)
LANGUAGE SQL
RETURN
    SELECT flight_number, zone, departure_time, delay_risk, status
    FROM __SCHEMA_QUALIFIED__.flights
    WHERE flight_number = p_flight_number;
```

## Working function example (complex -- CTE, JOIN, CASE)

```sql
CREATE OR REPLACE FUNCTION __SCHEMA_QUALIFIED__.checkin_performance_metrics(
    p_zone STRING
)
RETURNS TABLE(zone STRING, avg_checkin_time DOUBLE, baseline DOUBLE, pct_change DOUBLE, window_mins INT, timestamp TIMESTAMP_NTZ, is_anomalous BOOLEAN)
LANGUAGE SQL
RETURN
    WITH latest_metrics AS (
        SELECT zone, MAX(recorded_at) AS latest_recorded_at
        FROM __SCHEMA_QUALIFIED__.checkin_metrics
        WHERE zone IS NOT NULL
        AND recorded_at IS NOT NULL
        AND (p_zone IS NULL OR zone = p_zone)
        GROUP BY zone
    )
    SELECT
        m.zone,
        m.avg_checkin_time_mins AS avg_checkin_time,
        m.baseline_mins AS baseline,
        m.pct_change,
        m.window_mins,
        m.recorded_at AS timestamp,
        CASE WHEN ABS(m.pct_change) > 0.2 THEN TRUE ELSE FALSE END AS is_anomalous
    FROM __SCHEMA_QUALIFIED__.checkin_metrics m
    JOIN latest_metrics lm
        ON m.zone = lm.zone AND m.recorded_at = lm.latest_recorded_at
    ORDER BY m.zone;
```

## Working procedure example

```sql
CREATE OR REPLACE PROCEDURE __SCHEMA_QUALIFIED__.update_flight_risk(
    flight_number STRING,
    at_risk BOOLEAN
)
LANGUAGE SQL
SQL SECURITY INVOKER
BEGIN
    UPDATE __SCHEMA_QUALIFIED__.flights
    SET delay_risk = CASE WHEN at_risk THEN 'AT_RISK' ELSE 'NORMAL' END
    WHERE flights.flight_number = flight_number;
END;
```

## Learned constraints (auto-appended by self-healing)

- Statement FAILED: The number of columns produced by the RETURN clause (num: `21`) does not match the number of column names specified by the RETURNS clause (num: `20`) of mehdi_catalog.se.lookup_produ
