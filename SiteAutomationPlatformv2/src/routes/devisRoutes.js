/**
 * Devis Routes - Manage quotes/projects and equipment installations
 */

import express from 'express';
import db from '../config/database.js';

const router = express.Router();

/**
 * GET /devis/list/:siteName
 * Get all devis names for a site
 */
router.get('/list/:siteName', async (req, res) => {
  try {
    const { siteName } = req.params;
    console.log('📋 Fetching devis list for site:', siteName);

    const [rows] = await db.execute(`
      SELECT DISTINCT devis_name
      FROM devis
      WHERE site_name = ?
      ORDER BY devis_name
    `, [siteName]);

    // Always include "Devis Principal" as default
    const devisList = rows.map(r => r.devis_name);
    if (!devisList.includes('Devis Principal')) {
      devisList.unshift('Devis Principal');
    }

    console.log('✅ Found devis:', devisList);
    res.json(devisList);
  } catch (error) {
    console.error('❌ Error fetching devis list:', error);
    res.status(500).json({ error: 'Failed to fetch devis list' });
  }
});

/**
 * POST /devis/save
 * Save or update equipment for a zone in a devis
 */
router.post('/save', async (req, res) => {
  try {
    const { site_name, devis_name, equipment_type, zone_name, existing_count, to_install_count } = req.body;

    if (!site_name || !devis_name || !equipment_type || !zone_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('💾 Saving devis equipment:', { site_name, devis_name, equipment_type, zone_name });

    // UPSERT: Insert or update if exists
    await db.execute(`
      INSERT INTO devis (site_name, devis_name, equipment_type, zone_name, existing_count, to_install_count)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        existing_count = VALUES(existing_count),
        to_install_count = VALUES(to_install_count),
        updated_at = CURRENT_TIMESTAMP
    `, [site_name, devis_name, equipment_type, zone_name, existing_count || 0, to_install_count || 0]);

    console.log('✅ Devis equipment saved');
    res.json({ success: true, message: 'Devis equipment saved' });
  } catch (error) {
    console.error('❌ Error saving devis equipment:', error);
    res.status(500).json({ error: 'Failed to save devis equipment' });
  }
});

/**
 * GET /devis/installations/:siteName/:devisName
 * Get all installation quantities for a devis
 */
router.get('/installations/:siteName/:devisName', async (req, res) => {
  try {
    const { siteName, devisName } = req.params;
    console.log('📊 Fetching installations for:', { siteName, devisName });

    const [rows] = await db.execute(`
      SELECT
        equipment_type,
        zone_name,
        existing_count,
        to_install_count
      FROM devis
      WHERE site_name = ? AND devis_name = ?
      ORDER BY equipment_type, zone_name
    `, [siteName, devisName]);

    console.log(`✅ Found ${rows.length} installation records`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching installations:', error);
    res.status(500).json({ error: 'Failed to fetch installations' });
  }
});

/**
 * GET /devis/summary/:siteName/:devisName
 * Get aggregated installation summary (total per equipment type)
 */
router.get('/summary/:siteName/:devisName', async (req, res) => {
  try {
    const { siteName, devisName } = req.params;
    console.log('📊 Fetching devis summary for:', { siteName, devisName });

    const [rows] = await db.execute(`
      SELECT
        equipment_type,
        SUM(existing_count) as total_existing,
        SUM(to_install_count) as total_to_install
      FROM devis
      WHERE site_name = ? AND devis_name = ?
      GROUP BY equipment_type
      ORDER BY equipment_type
    `, [siteName, devisName]);

    console.log(`✅ Summary: ${rows.length} equipment types`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching devis summary:', error);
    res.status(500).json({ error: 'Failed to fetch devis summary' });
  }
});

/**
 * DELETE /devis/delete/:siteName/:devisName
 * Delete an entire devis (all zones/equipment)
 */
router.delete('/delete/:siteName/:devisName', async (req, res) => {
  try {
    const { siteName, devisName } = req.params;

    if (devisName === 'Devis Principal') {
      return res.status(400).json({ error: 'Cannot delete Devis Principal' });
    }

    console.log('🗑️ Deleting devis:', { siteName, devisName });

    const [result] = await db.execute(`
      DELETE FROM devis
      WHERE site_name = ? AND devis_name = ?
    `, [siteName, devisName]);

    console.log(`✅ Deleted ${result.affectedRows} records`);
    res.json({ success: true, deletedRows: result.affectedRows });
  } catch (error) {
    console.error('❌ Error deleting devis:', error);
    res.status(500).json({ error: 'Failed to delete devis' });
  }
});

/**
 * POST /devis/create
 * Create a new empty devis
 */
router.post('/create', async (req, res) => {
  try {
    const { site_name, devis_name } = req.body;

    if (!site_name || !devis_name) {
      return res.status(400).json({ error: 'Missing site_name or devis_name' });
    }

    console.log('➕ Creating new devis:', { site_name, devis_name });

    // Check if already exists
    const [existing] = await db.execute(`
      SELECT COUNT(*) as count FROM devis WHERE site_name = ? AND devis_name = ?
    `, [site_name, devis_name]);

    if (existing[0].count > 0) {
      return res.status(400).json({ error: 'Devis already exists' });
    }

    // Create with a placeholder entry
    await db.execute(`
      INSERT INTO devis (site_name, devis_name, equipment_type, zone_name, existing_count, to_install_count)
      VALUES (?, ?, 'Aero', 'default', 0, 0)
    `, [site_name, devis_name]);

    console.log('✅ Devis created');
    res.json({ success: true, message: 'Devis created' });
  } catch (error) {
    console.error('❌ Error creating devis:', error);
    res.status(500).json({ error: 'Failed to create devis' });
  }
});

export default router;
