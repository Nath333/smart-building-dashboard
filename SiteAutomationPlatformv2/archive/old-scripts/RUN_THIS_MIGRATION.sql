-- =====================================================
-- CRITICAL: Run this SQL migration for multi-image feature
-- =====================================================
-- This adds image_id support to visual_positions table
-- allowing different icon positions per background image
-- =====================================================

USE avancement2;

-- Step 1: Add image_id column
ALTER TABLE visual_positions
ADD COLUMN image_id VARCHAR(50) DEFAULT NULL AFTER page_type;

-- Step 2: Create index for performance
CREATE INDEX idx_image_id ON visual_positions(image_id);

-- Step 3: Drop old unique constraint
ALTER TABLE visual_positions
DROP INDEX unique_position;

-- Step 4: Add new unique constraint including image_id
ALTER TABLE visual_positions
ADD UNIQUE KEY unique_position (site_name, page_type, image_id, element_id);

-- =====================================================
-- Migration complete!
-- =====================================================
SELECT 'Migration complete! You can now use multi-image feature.' AS status;
