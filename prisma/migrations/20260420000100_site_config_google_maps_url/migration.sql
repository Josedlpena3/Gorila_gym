ALTER TABLE "site_config"
ADD COLUMN "googleMapsUrl" TEXT;

UPDATE "site_config"
SET "googleMapsUrl" = COALESCE(
  NULLIF(
    CASE
      WHEN trim("googleMapsEmbed") LIKE 'http%' THEN trim("googleMapsEmbed")
      ELSE NULL
    END,
    ''
  ),
  NULLIF(substring("googleMapsEmbed" from 'src=''([^'']+)'''), ''),
  NULLIF(substring("googleMapsEmbed" from 'src="([^"]+)"'), ''),
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3409.1325460175212!2d-64.2776806!3d-31.300081499999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94329cf75ca7fb19%3A0x942d968762389d9a!2sVilla%20Allende%20Shopping%20-%20VAS!5e0!3m2!1ses!2sar!4v1776644156188!5m2!1ses!2sar'
);

ALTER TABLE "site_config"
ALTER COLUMN "googleMapsUrl" SET NOT NULL;

ALTER TABLE "site_config"
DROP COLUMN "googleMapsEmbed";
