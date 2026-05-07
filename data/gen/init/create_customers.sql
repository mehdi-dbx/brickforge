CREATE OR REPLACE TABLE __SCHEMA_QUALIFIED__.customers (
    customer_id STRING,
    first_name STRING,
    last_name STRING,
    email STRING,
    phone STRING,
    drivers_license STRING,
    member_since DATE
)
USING DELTA
TBLPROPERTIES (delta.enableChangeDataFeed = true);

INSERT INTO __SCHEMA_QUALIFIED__.customers VALUES
('CUST-001', 'James', 'Harrington', 'james.harrington@gmail.com', '(555) 234-0101', 'DL-A1234567', '2018-03-15'),
('CUST-002', 'Sofia', 'Mendoza', 'sofia.mendoza@yahoo.com', '(555) 312-0202', 'DL-B2345678', '2019-07-22'),
('CUST-003', 'Marcus', 'Thompson', 'marcus.thompson@outlook.com', '(555) 415-0303', 'DL-C3456789', '2020-01-10'),
('CUST-004', 'Priya', 'Patel', 'priya.patel@gmail.com', '(555) 503-0404', 'DL-D4567890', '2021-05-18'),
('CUST-005', 'Ethan', 'Kowalski', 'ethan.kowalski@hotmail.com', '(555) 617-0505', 'DL-E5678901', '2018-11-03'),
('CUST-006', 'Aaliyah', 'Washington', 'aaliyah.washington@gmail.com', '(555) 720-0606', 'DL-F6789012', '2022-02-28'),
('CUST-007', 'Connor', 'O''Brien', 'connor.obrien@icloud.com', '(555) 813-0707', 'DL-G7890123', '2019-09-14'),
('CUST-008', 'Yuki', 'Tanaka', 'yuki.tanaka@yahoo.com', '(555) 904-0808', 'DL-H8901234', '2023-04-07'),
('CUST-009', 'Destiny', 'Robinson', 'destiny.robinson@gmail.com', '(555) 214-0909', 'DL-I9012345', '2020-08-19'),
('CUST-010', 'Rafael', 'Gutierrez', 'rafael.gutierrez@outlook.com', '(555) 316-1010', 'DL-J0123456', '2021-12-01'),
('CUST-011', 'Hannah', 'Bergstrom', 'hannah.bergstrom@hotmail.com', '(555) 418-1111', 'DL-K1234560', '2018-06-25'),
('CUST-012', 'Darius', 'Freeman', 'darius.freeman@gmail.com', '(555) 512-1212', 'DL-L2345671', '2022-09-30'),
('CUST-013', 'Mei', 'Chen', 'mei.chen@yahoo.com', '(555) 614-1313', 'DL-M3456782', '2019-03-08'),
('CUST-014', 'Tyler', 'Blackwood', 'tyler.blackwood@icloud.com', '(555) 716-1414', 'DL-N4567893', '2023-07-15'),
('CUST-015', 'Fatima', 'Al-Hassan', 'fatima.alhassan@gmail.com', '(555) 818-1515', 'DL-O5678904', '2020-11-22'),
('CUST-016', 'Liam', 'Fitzgerald', 'liam.fitzgerald@outlook.com', '(555) 912-1616', 'DL-P6789015', '2021-04-05'),
('CUST-017', 'Jasmine', 'Okafor', 'jasmine.okafor@gmail.com', '(555) 213-1717', 'DL-Q7890126', '2018-08-17'),
('CUST-018', 'Nikolai', 'Volkov', 'nikolai.volkov@hotmail.com', '(555) 315-1818', 'DL-R8901237', '2022-12-11'),
('CUST-019', 'Camille', 'Dubois', 'camille.dubois@yahoo.com', '(555) 417-1919', 'DL-S9012348', '2019-01-29'),
('CUST-020', 'Andre', 'Jackson', 'andre.jackson@gmail.com', '(555) 519-2020', 'DL-T0123459', '2023-10-03'),
('CUST-021', 'Ingrid', 'Sorensen', 'ingrid.sorensen@icloud.com', '(555) 621-2121', 'DL-U1234562', '2020-05-14'),
('CUST-022', 'Malik', 'Williams', 'malik.williams@outlook.com', '(555) 723-2222', 'DL-V2345673', '2021-08-27'),
('CUST-023', 'Serena', 'Nakamura', 'serena.nakamura@gmail.com', '(555) 825-2323', 'DL-W3456784', '2018-12-06'),
('CUST-024', 'Brandon', 'Castillo', 'brandon.castillo@yahoo.com', '(555) 927-2424', 'DL-X4567895', '2022-06-19'),
('CUST-025', 'Amara', 'Diallo', 'amara.diallo@hotmail.com', '(555) 228-2525', 'DL-Y5678906', '2019-10-31'),
('CUST-026', 'Kevin', 'Lindqvist', 'kevin.lindqvist@gmail.com', '(555) 330-2626', 'DL-Z6789017', '2023-01-20'),
('CUST-027', 'Valentina', 'Rossi', 'valentina.rossi@icloud.com', '(555) 432-2727', 'DL-A7890128', '2020-03-09'),
('CUST-028', 'DeShawn', 'Harris', 'deshawn.harris@outlook.com', '(555) 534-2828', 'DL-B8901239', '2021-11-16'),
('CUST-029', 'Nadia', 'Petrov', 'nadia.petrov@yahoo.com', '(555) 636-2929', 'DL-C9012340', '2018-04-24'),
('CUST-030', 'Elijah', 'Morrison', 'elijah.morrison@gmail.com', '(555) 738-3030', 'DL-D0123451', '2023-11-08');
