-- Add image_id column to visual_positions table
-- This allows multiple images per site with different icon assignments

ALTER TABLE visual_positions
ADD COLUMN image_id VARCHAR(50) DEFAULT NULL AFTER page_type;

-- Add index for faster queries
CREATE INDEX idx_image_id ON visual_positions(image_id);

-- Update the unique key to include image_id
ALTER TABLE visual_positions
DROP INDEX unique_position;

ALTER TABLE visual_positions
ADD UNIQUE KEY unique_position (site_name, page_type, image_id, element_id);
