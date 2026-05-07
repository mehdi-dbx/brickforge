-- Retrieve full details for a specific vehicle by vehicle_id, including location and active reservation info. Params: {{vehicle_id}}
SELECT v.vehicle_id, v.make, v.model, v.year, v.category, v.daily_rate, v.is_available, v.license_plate, v.location_id,
       l.name AS location_name, l.city, l.state, l.airport_code, l.phone AS location_phone,
       r.reservation_id AS active_reservation_id, r.pickup_date, r.dropoff_date
FROM __SCHEMA_QUALIFIED__.`vehicles` v
LEFT JOIN __SCHEMA_QUALIFIED__.`locations` l ON v.location_id = l.location_id
LEFT JOIN __SCHEMA_QUALIFIED__.`reservations` r ON v.vehicle_id = r.vehicle_id
    AND r.status IN ('confirmed', 'active')
    AND r.dropoff_date >= CURRENT_DATE
WHERE v.vehicle_id = '{{vehicle_id}}';
