-- Verify the exact column order in equipment_lighting table
SHOW COLUMNS FROM equipment_lighting;

-- Also show with detailed info
SELECT
    ORDINAL_POSITION,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'equipment_lighting'
ORDER BY ORDINAL_POSITION;
