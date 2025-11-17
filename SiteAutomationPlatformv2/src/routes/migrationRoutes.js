import express from 'express';
import db from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Apply zone_name migration
router.post('/add-zone-column', async (req, res) => {
  try {
    console.log('🔄 Applying zone_name migration...');

    // Check if column already exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'image_sql'
        AND COLUMN_NAME = 'zone_name'
    `);

    if (columns.length > 0) {
      console.log('ℹ️ Column zone_name already exists');
      return res.json({
        success: true,
        message: 'Column zone_name already exists',
        alreadyExists: true
      });
    }

    // Add the column
    await db.execute(`
      ALTER TABLE image_sql
      ADD COLUMN zone_name VARCHAR(100) DEFAULT NULL
      COMMENT 'Zone identifier for equipment images (e.g., surface_de_vente, bureau)'
      AFTER type
    `);

    // Add index
    await db.execute(`
      CREATE INDEX idx_site_type_zone ON image_sql(site, type, zone_name)
    `);

    console.log('✅ Migration complete: zone_name column added');
    res.json({
      success: true,
      message: 'Successfully added zone_name column and index to image_sql table'
    });
  } catch (err) {
    console.error('❌ Migration error:', err);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: err.message
    });
  }
});

// Get current table structure
router.get('/table-structure', async (req, res) => {
  try {
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'image_sql'
      ORDER BY ORDINAL_POSITION
    `);

    res.json({ success: true, columns });
  } catch (err) {
    console.error('❌ Error fetching table structure:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
