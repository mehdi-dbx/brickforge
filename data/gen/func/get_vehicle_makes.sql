-- Returns a distinct list of all vehicle makes in the fleet with total and available vehicle counts per make. No parameters needed.
SELECT
    make,
    COUNT(*) AS total_vehicles,
    SUM(CASE WHEN is_available THEN 1 ELSE 0 END) AS available_vehicles
FROM __SCHEMA_QUALIFIED__.`vehicles`
GROUP BY make
ORDER BY make ASC;
