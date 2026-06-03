CREATE OR REPLACE FUNCTION __SCHEMA_QUALIFIED__.lookup_products_en_by_id(
    p_id STRING
)
RETURNS TABLE(id STRING, oid_product_ref STRING, categoryL1 STRING, categoryL2 STRING, image STRING, code_type STRING, ean_code STRING, currency STRING, price STRING, title STRING, description STRING, downloadUrl STRING, openUrl STRING, endOfCommercializationDate STRING, chars ARRAY<STRING>, cat ARRAY<STRING>, subcat ARRAY<STRING>, `range` ARRAY<STRING>, keyword ARRAY<STRING>, shingle ARRAY<STRING>)
LANGUAGE SQL
RETURN
    SELECT
        p.id,
        p.oid_product_ref,
        p.categoryL1,
        p.categoryL2,
        p.image,
        p.code_type,
        p.ean_code,
        p.currency,
        p.price,
        p.title,
        p.description,
        p.downloadUrl,
        p.openUrl,
        p.endOfCommercializationDate,
        p.chars,
        p.cat,
        p.subcat,
        p.`range`,
        p.keyword,
        p.shingle
    FROM __SCHEMA_QUALIFIED__.products_en p
    WHERE p.id = p_id;