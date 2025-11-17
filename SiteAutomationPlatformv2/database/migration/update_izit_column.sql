-- =====================================================
-- Migration: Update izit column to store coffret names
-- Date: 2025-10-18
-- Purpose: Change izit from INT to VARCHAR to store comma-separated coffret names
-- =====================================================

USE avancement;

-- Show current column type
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'gtb_modules' AND COLUMN_NAME = 'izit';

-- Update column type from INT to VARCHAR(500)
ALTER TABLE gtb_modules
MODIFY COLUMN izit VARCHAR(500) DEFAULT NULL
COMMENT 'Comma-separated list of selected coffret names (e.g., "coffret gtb(asp/do12/routeur/ug65),isma")';

-- Verify the change
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_TYPE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'gtb_modules' AND COLUMN_NAME = 'izit';

-- =====================================================
-- DONE: izit column now stores coffret names as string
-- =====================================================
