-- Search for currently available vehicles by make, optionally filtered by city. Params: {{make}}, {{city}}
SELECT v.vehicle_id, v.make, v.model, v.year, v.category, v.daily_rate, v.license_plate,
       l.name AS location_name, l.city, l.state, l.airport_code
FROM __SCHEMA_QUALIFIED__.`vehicles` v
JOIN __SCHEMA_QUALIFIED__.`locations` l ON v.location_id = l.location_id
WHERE LOWER(v.make) = LOWER('{{make}}')
  AND v.is_available = TRUE
  AND ('{{city}}' = '' OR LOWER(l.city) = LOWER('{{city}}'))
ORDER BY v.daily_rate ASC;
