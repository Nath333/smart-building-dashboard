-- ===============================================
-- ADD devis_id SUPPORT TO gtb_site_config
-- This allows multiple GTB configurations per site (one per devis)
-- ===============================================

-- Step 1: Add devis_id column
ALTER TABLE gtb_site_config
ADD COLUMN devis_id VARCHAR(255) DEFAULT 'default' AFTER site_id;

-- Step 2: Drop the old unique constraint on site_id only
ALTER TABLE gtb_site_config
DROP INDEX unique_site_gtb;

-- Step 3: Add new composite unique constraint on (site_id, devis_id)
ALTER TABLE gtb_site_config
ADD UNIQUE KEY unique_site_devis_gtb (site_id, devis_id);

-- Step 4: Update index to include devis_id for better performance
ALTER TABLE gtb_site_config
DROP INDEX idx_site_gtb_config,
ADD INDEX idx_site_devis_gtb_config (site_id, devis_id);

-- Step 5: Update performance index
ALTER TABLE gtb_site_config
DROP INDEX idx_gtb_site_perf,
ADD INDEX idx_gtb_site_devis_perf (site_id, devis_id, refs, modules);

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Verify column was added
DESCRIBE gtb_site_config;

-- Check constraints
SHOW INDEX FROM gtb_site_config;

-- Test query with devis_id
-- SELECT * FROM gtb_site_config WHERE site_id = 1 AND devis_id = 'default';

COMMIT;
