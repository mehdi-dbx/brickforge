-- Search for vehicles filtered by make and optionally by category (e.g. SUV, Sedan, Truck). Returns vehicle details with location info, sorted by availability then daily rate. Params: {{make}}, {{category}}
SELECT
    v.vehicle_id,
    v.make,
    v.model,
    v.year,
    v.category,
    v.daily_rate,
    v.is_available,
    v.license_plate,
    l.name AS location_name,
    l.city,
    l.state
FROM __SCHEMA_QUALIFIED__.`vehicles` v
LEFT JOIN __SCHEMA_QUALIFIED__.`locations` l
    ON v.location_id = l.location_id
WHERE LOWER(v.make) = LOWER('{{make}}')
  AND ('{{category}}' = '' OR LOWER(v.category) = LOWER('{{category}}'))
ORDER BY v.is_available DESC, v.daily_rate ASC;
