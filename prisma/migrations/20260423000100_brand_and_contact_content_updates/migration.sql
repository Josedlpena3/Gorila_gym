UPDATE "products"
SET "brand" = 'Gorilla Strong'
WHERE "brand" = 'Gorila Strong';

UPDATE "order_items"
SET "brandSnapshot" = 'Gorilla Strong'
WHERE "brandSnapshot" = 'Gorila Strong';

UPDATE "site_config"
SET "whatsappNumber" = '5493513552255'
WHERE regexp_replace("whatsappNumber", '\D', '', 'g') IN ('3512288010', '5493512288010');

UPDATE "site_config"
SET "address" = replace("address", 'Rio de janeiro', 'Rio de Janeiro')
WHERE "address" LIKE '%Rio de janeiro%';
