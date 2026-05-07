CREATE OR REPLACE PROCEDURE __SCHEMA_QUALIFIED__.`update_vehicle_availability`(
  IN vehicle_id STRING,
  IN is_available BOOLEAN
)
LANGUAGE SQL
SQL SECURITY INVOKER
AS
BEGIN
  -- Update the availability status of the specified vehicle
  UPDATE __SCHEMA_QUALIFIED__.`vehicles`
  SET is_available = update_vehicle_availability.is_available
  WHERE vehicle_id = update_vehicle_availability.vehicle_id;

  -- Raise an error if no rows were affected (vehicle not found)
  IF (SELECT COUNT(*) FROM __SCHEMA_QUALIFIED__.`vehicles` WHERE vehicle_id = update_vehicle_availability.vehicle_id) = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Vehicle not found: no rows updated for the provided vehicle_id';
  END IF;

  -- Return the updated vehicle record to confirm the change
  SELECT
    vehicle_id,
    make,
    model,
    year,
    category,
    daily_rate,
    is_available,
    license_plate,
    location_id,
    'UPDATED' AS status
  FROM __SCHEMA_QUALIFIED__.`vehicles`
  WHERE vehicle_id = update_vehicle_availability.vehicle_id;
END;
