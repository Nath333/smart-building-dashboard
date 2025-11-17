-- Add devis_name column to devis table if it doesn't exist
-- This allows multiple devis per site

-- Check if column exists and add it if needed
SET @dbname = DATABASE();
SET @tablename = 'devis';
SET @columnname = 'devis_name';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(255) NOT NULL DEFAULT ''Devis Principal'' AFTER site_name')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Drop old unique constraint if exists
ALTER TABLE devis DROP INDEX IF EXISTS unique_site_equipment_zone;

-- Add new unique constraint including devis_name
ALTER TABLE devis ADD UNIQUE KEY IF NOT EXISTS unique_site_devis_equipment_zone (site_name, devis_name, equipment_type, zone_name);

-- Add index on devis_name
ALTER TABLE devis ADD INDEX IF NOT EXISTS idx_devis_name (devis_name);
