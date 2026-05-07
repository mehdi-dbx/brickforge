-- Look up all vehicles matching a given make with availability status and location details. Params: {{make}}
SELECT v.vehicle_id, v.make, v.model, v.year, v.category, v.daily_rate, v.is_available, v.license_plate, l.name AS location_name, l.city, l.state
FROM __SCHEMA_QUALIFIED__.`vehicles` v
LEFT JOIN __SCHEMA_QUALIFIED__.`locations` l ON v.location_id = l.location_id
WHERE LOWER(v.make) = LOWER('{{make}}')
ORDER BY v.year DESC, v.model ASC;
