CREATE OR REPLACE TABLE __SCHEMA_QUALIFIED__.vehicles (
    vehicle_id STRING,
    make STRING,
    model STRING,
    year INT,
    category STRING,
    daily_rate DOUBLE,
    is_available BOOLEAN,
    license_plate STRING,
    location_id STRING
)
USING DELTA
TBLPROPERTIES (delta.enableChangeDataFeed = true);

INSERT INTO __SCHEMA_QUALIFIED__.vehicles VALUES
('VEH-001', 'Toyota', 'Camry', 2022, 'Compact', 65.99, TRUE, 'KJT-4821', 'LOC-001'),
('VEH-002', 'Honda', 'Civic', 2023, 'Economy', 39.99, TRUE, 'MNP-7734', 'LOC-002'),
('VEH-003', 'Ford', 'Explorer', 2022, 'SUV', 119.99, FALSE, 'BXQ-2291', 'LOC-001'),
('VEH-004', 'BMW', '3 Series', 2023, 'Luxury', 189.99, TRUE, 'LRZ-5503', 'LOC-003'),
('VEH-005', 'Tesla', 'Model 3', 2023, 'Electric', 149.99, TRUE, 'ELX-9901', 'LOC-002'),
('VEH-006', 'Chevrolet', 'Malibu', 2021, 'Compact', 59.99, FALSE, 'GHT-3347', 'LOC-004'),
('VEH-007', 'Hyundai', 'Elantra', 2022, 'Economy', 37.5, TRUE, 'PQW-8812', 'LOC-003'),
('VEH-008', 'Jeep', 'Grand Cherokee', 2023, 'SUV', 134.99, TRUE, 'DFV-6620', 'LOC-005'),
('VEH-009', 'Mercedes-Benz', 'C-Class', 2023, 'Luxury', 219.99, FALSE, 'RNK-1145', 'LOC-001'),
('VEH-010', 'Tesla', 'Model Y', 2023, 'Electric', 174.99, TRUE, 'EVQ-4478', 'LOC-004'),
('VEH-011', 'Nissan', 'Altima', 2021, 'Compact', 62.5, FALSE, 'WCB-5593', 'LOC-002'),
('VEH-012', 'Kia', 'Soul', 2022, 'Economy', 42.0, TRUE, 'YJM-7761', 'LOC-005'),
('VEH-013', 'Ford', 'Escape', 2022, 'SUV', 109.99, TRUE, 'TBH-2234', 'LOC-003'),
('VEH-014', 'Audi', 'A4', 2023, 'Luxury', 209.99, TRUE, 'ZKP-8890', 'LOC-001'),
('VEH-015', 'Chevrolet', 'Bolt EV', 2023, 'Electric', 129.99, FALSE, 'EBT-3312', 'LOC-002'),
('VEH-016', 'Toyota', 'Corolla', 2021, 'Economy', 35.99, TRUE, 'HVL-6647', 'LOC-004'),
('VEH-017', 'GMC', 'Terrain', 2022, 'SUV', 114.99, FALSE, 'SXN-9923', 'LOC-005'),
('VEH-018', 'Lexus', 'ES 350', 2023, 'Luxury', 245.0, TRUE, 'FQD-1178', 'LOC-003'),
('VEH-019', 'Volkswagen', 'ID.4', 2023, 'Electric', 139.99, TRUE, 'EVN-5541', 'LOC-001'),
('VEH-020', 'Honda', 'CR-V', 2022, 'SUV', 124.99, FALSE, 'CLR-4456', 'LOC-005');
