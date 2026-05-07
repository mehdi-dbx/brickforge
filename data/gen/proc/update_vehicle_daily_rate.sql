CREATE OR REPLACE PROCEDURE __SCHEMA_QUALIFIED__.`update_vehicle_daily_rate`(
  IN vehicle_id STRING,
  IN new_daily_rate DOUBLE
)
LANGUAGE SQL
SQL SECURITY INVOKER
AS
BEGIN
  -- Validate that new_daily_rate is greater than zero
  IF new_daily_rate <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Daily rate must be greater than zero';
  END IF;

  -- Update the daily rate for the specified vehicle
  UPDATE __SCHEMA_QUALIFIED__.`vehicles`
  SET daily_rate = new_daily_rate
  WHERE `vehicles`.vehicle_id = vehicle_id;

  -- Check if any rows were updated; if not, signal that the vehicle was not found
  IF (SELECT COUNT(*) FROM __SCHEMA_QUALIFIED__.`vehicles` WHERE `vehicles`.vehicle_id = vehicle_id) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vehicle not found: no matching vehicle_id exists';
  END IF;

  SELECT CONCAT('Daily rate successfully updated to ', CAST(new_daily_rate AS STRING), ' for vehicle_id: ', vehicle_id) AS status;
END;
