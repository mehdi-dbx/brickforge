CREATE OR REPLACE PROCEDURE __SCHEMA_QUALIFIED__.`transfer_vehicle_location`(
  IN vehicle_id STRING,
  IN new_location_id STRING
)
LANGUAGE SQL
SQL SECURITY INVOKER
AS
BEGIN
  -- Verify the new location exists
  IF NOT EXISTS (
    SELECT 1
    FROM __SCHEMA_QUALIFIED__.`locations`
    WHERE location_id = new_location_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Location not found';
  END IF;

  -- Update the vehicle's location
  UPDATE __SCHEMA_QUALIFIED__.`vehicles`
  SET location_id = new_location_id
  WHERE vehicle_id = vehicle_id;

  -- Verify the vehicle was found and updated
  IF (
    SELECT COUNT(*)
    FROM __SCHEMA_QUALIFIED__.`vehicles`
    WHERE vehicle_id = vehicle_id
      AND location_id = new_location_id
  ) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vehicle not found';
  END IF;

  -- Return the updated vehicle row joined with the new location details
  SELECT
    v.vehicle_id,
    v.make,
    v.model,
    v.year,
    v.category,
    v.daily_rate,
    v.is_available,
    v.license_plate,
    v.location_id,
    l.name         AS location_name,
    l.city         AS location_city,
    l.state        AS location_state,
    l.airport_code AS location_airport_code,
    l.phone        AS location_phone,
    'TRANSFER SUCCESSFUL' AS status
  FROM __SCHEMA_QUALIFIED__.`vehicles` v
  INNER JOIN __SCHEMA_QUALIFIED__.`locations` l
    ON v.location_id = l.location_id
  WHERE v.vehicle_id = vehicle_id;
END;
