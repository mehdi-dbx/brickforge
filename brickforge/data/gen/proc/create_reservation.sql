CREATE OR REPLACE PROCEDURE __SCHEMA_QUALIFIED__.create_reservation(
  p_reservation_id STRING,
  p_guest_id STRING,
  p_room_id STRING,
  p_check_in_date STRING,
  p_check_out_date STRING,
  p_status STRING,
  p_total_amount STRING,
  p_booked_at STRING
)
SQL SECURITY INVOKER
BEGIN
  INSERT INTO __SCHEMA_QUALIFIED__.reservations (reservation_id, guest_id, room_id, check_in_date, check_out_date, status, total_amount, booked_at)
  VALUES (p_reservation_id, p_guest_id, p_room_id, CAST(p_check_in_date AS DATE), CAST(p_check_out_date AS DATE), p_status, CAST(p_total_amount AS DOUBLE), CAST(p_booked_at AS TIMESTAMP_NTZ));
END