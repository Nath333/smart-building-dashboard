// ===============================================
// EQUIPMENT ROUTES - NORMALIZED DATABASE
// Works with improved database schema
// Provides backward compatibility with existing frontend
// ===============================================

import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'admin',
  database: process.env.DB_NAME || 'avancement',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ===============================================
// 📊 GET EQUIPMENT DATA BY SITE (NORMALIZED)
// ===============================================
router.post('/get-by-site', async (req, res) => {
  const { site } = req.body;

  if (!site || typeof site !== 'string' || !site.trim()) {
    return res.status(400).json({ error: 'Site name is required' });
  }

  try {
    console.log(`📥 [GET] Equipment data for site: "${site}"`);

    // Get site ID
    const [siteRows] = await db.execute(
      'SELECT id FROM sites WHERE site_name = ?',
      [site.trim()]
    );

    if (siteRows.length === 0) {
      console.log(`⚠️ Site not found: ${site}`);
      return res.json({ equipment_configs: [] });
    }

    const siteId = siteRows[0].id;

    // Get equipment configurations with categories
    const [configRows] = await db.execute(`
      SELECT
        ec.*,
        cat.category_code,
        cat.category_name
      FROM equipment_configs ec
      JOIN equipment_categories cat ON cat.id = ec.category_id
      WHERE ec.site_id = ?
      ORDER BY cat.category_code
    `, [siteId]);

    // Get equipment references for each config
    const equipmentConfigs = [];
    for (const config of configRows) {
      const [refRows] = await db.execute(`
        SELECT *
        FROM equipment_references
        WHERE config_id = ?
        ORDER BY position_index
      `, [config.id]);

      equipmentConfigs.push({
        ...config,
        references: refRows
      });
    }

    console.log(`✅ Found ${equipmentConfigs.length} equipment configurations`);
    res.json({ equipment_configs: equipmentConfigs });

  } catch (error) {
    console.error('❌ Error fetching equipment data:', error);
    res.status(500).json({
      error: 'Database error',
      details: error.message
    });
  }
});

// ===============================================
// 💾 SAVE EQUIPMENT DATA (NORMALIZED)
// ===============================================
router.post('/save', async (req, res) => {
  const { site_name, equipment_configs } = req.body;

  if (!site_name || !Array.isArray(equipment_configs)) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    console.log(`💾 [SAVE] Equipment data for site: "${site_name}"`);

    // Ensure site exists
    const [siteRows] = await connection.execute(
      'SELECT id FROM sites WHERE site_name = ?',
      [site_name]
    );

    let siteId;
    if (siteRows.length === 0) {
      const [insertResult] = await connection.execute(
        'INSERT INTO sites (site_name) VALUES (?)',
        [site_name]
      );
      siteId = insertResult.insertId;
      console.log(`✅ Created new site with ID: ${siteId}`);
    } else {
      siteId = siteRows[0].id;
    }

    // Process each equipment configuration
    for (const config of equipment_configs) {
      const { category_code, references = [], ...configData } = config;

      // Get category ID
      const [catRows] = await connection.execute(
        'SELECT id FROM equipment_categories WHERE category_code = ?',
        [category_code]
      );

      if (catRows.length === 0) {
        throw new Error(`Unknown equipment category: ${category_code}`);
      }

      const categoryId = catRows[0].id;

      // Prepare configuration data
      const {
        quantity_total = 0,
        quantity_ir = 0,
        quantity_wire = 0,
        zones = [],
        equipment_types = [],
        has_thermostat = false,
        has_remote_control = false,
        has_modbus = false,
        has_electrical_panel = false,
        has_timer = false,
        operational_status = 'unknown',
        maintenance_status = 'unknown',
        comments = null
      } = configData;

      // Convert zones and types to JSON
      const zonesJson = JSON.stringify(Array.isArray(zones) ? zones : []);
      const typesJson = JSON.stringify(Array.isArray(equipment_types) ? equipment_types : []);

      // Upsert equipment configuration
      await connection.execute(`
        INSERT INTO equipment_configs (
          site_id, category_id, quantity_total, quantity_ir, quantity_wire,
          zones, equipment_types, has_thermostat, has_remote_control,
          has_modbus, has_electrical_panel, has_timer,
          operational_status, maintenance_status, comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          quantity_total = VALUES(quantity_total),
          quantity_ir = VALUES(quantity_ir),
          quantity_wire = VALUES(quantity_wire),
          zones = VALUES(zones),
          equipment_types = VALUES(equipment_types),
          has_thermostat = VALUES(has_thermostat),
          has_remote_control = VALUES(has_remote_control),
          has_modbus = VALUES(has_modbus),
          has_electrical_panel = VALUES(has_electrical_panel),
          has_timer = VALUES(has_timer),
          operational_status = VALUES(operational_status),
          maintenance_status = VALUES(maintenance_status),
          comments = VALUES(comments),
          updated_at = CURRENT_TIMESTAMP
      `, [
        siteId, categoryId, quantity_total, quantity_ir, quantity_wire,
        zonesJson, typesJson, has_thermostat, has_remote_control,
        has_modbus, has_electrical_panel, has_timer,
        operational_status, maintenance_status, comments
      ]);

      // Get the config ID for references
      const [configRows] = await connection.execute(
        'SELECT id FROM equipment_configs WHERE site_id = ? AND category_id = ?',
        [siteId, categoryId]
      );
      const configId = configRows[0].id;

      // Delete existing references
      await connection.execute(
        'DELETE FROM equipment_references WHERE config_id = ?',
        [configId]
      );

      // Insert new references
      if (references.length > 0) {
        const referenceValues = references.map(ref => [
          configId,
          ref.reference_code || null,
          ref.brand_name || null,
          ref.model_name || null,
          ref.serial_number || null,
          ref.installation_zone || null,
          ref.installation_date || null,
          ref.position_index || 0,
          ref.technical_specs ? JSON.stringify(ref.technical_specs) : null,
          ref.is_active !== false, // Default to true
          ref.condition_rating || null,
          ref.notes || null
        ]);

        const placeholders = references.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const flatValues = referenceValues.flat();

        await connection.execute(`
          INSERT INTO equipment_references (
            config_id, reference_code, brand_name, model_name, serial_number,
            installation_zone, installation_date, position_index, technical_specs,
            is_active, condition_rating, notes
          ) VALUES ${placeholders}
        `, flatValues);
      }
    }

    await connection.commit();
    console.log(`✅ Equipment data saved successfully for site: ${site_name}`);

    res.json({
      success: true,
      message: `Equipment configuration saved for site: ${site_name}`,
      configs_saved: equipment_configs.length
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error saving equipment data:', error);
    res.status(500).json({
      error: 'Failed to save equipment data',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// ===============================================
// 📈 GET EQUIPMENT SUMMARY
// ===============================================
router.post('/summary', async (req, res) => {
  const { site } = req.body;

  try {
    console.log(`📊 [SUMMARY] Equipment summary for site: "${site}"`);

    const [summaryRows] = await db.execute(`
      SELECT
        s.site_name,
        cat.category_code,
        cat.category_name,
        ec.quantity_total,
        ec.zones,
        ec.equipment_types,
        ec.operational_status,
        ec.maintenance_status,
        COUNT(er.id) as reference_count,
        ec.updated_at
      FROM sites s
      JOIN equipment_configs ec ON ec.site_id = s.id
      JOIN equipment_categories cat ON cat.id = ec.category_id
      LEFT JOIN equipment_references er ON er.config_id = ec.id
      WHERE s.site_name = ?
      GROUP BY s.id, ec.id, cat.id
      ORDER BY cat.category_code
    `, [site]);

    res.json({ summary: summaryRows });

  } catch (error) {
    console.error('❌ Error fetching equipment summary:', error);
    res.status(500).json({
      error: 'Database error',
      details: error.message
    });
  }
});

// ===============================================
// 🏷️ GET EQUIPMENT CATEGORIES
// ===============================================
router.get('/categories', async (req, res) => {
  try {
    console.log(`📋 [CATEGORIES] Fetching equipment categories`);

    const [categoryRows] = await db.execute(`
      SELECT
        id,
        category_code,
        category_name,
        description,
        is_active
      FROM equipment_categories
      WHERE is_active = TRUE
      ORDER BY category_name
    `);

    res.json({ categories: categoryRows });

  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      error: 'Database error',
      details: error.message
    });
  }
});

// ===============================================
// 🔧 BACKWARD COMPATIBILITY ENDPOINTS
// ===============================================

// Legacy endpoint for existing frontend
router.post('/save_page2_normalized', async (req, res) => {
  try {
    const { site, ...legacyData } = req.body;

    // Transform legacy data to normalized format
    const normalizedData = transformLegacyToNormalized(site, legacyData);

    // Use the new save endpoint
    req.body = normalizedData;
    return router.handle(Object.assign(req, {
      method: 'POST',
      url: '/save'
    }), res);

  } catch (error) {
    console.error('❌ Error in legacy compatibility:', error);
    res.status(500).json({
      error: 'Legacy compatibility error',
      details: error.message
    });
  }
});

// Legacy data transformation helper
function transformLegacyToNormalized(siteName, legacyData) {
  const equipment_configs = [];

  // Transform Aero data
  if (legacyData.nb_aerotherme > 0 || legacyData.zone_aerotherme) {
    const aeroConfig = {
      category_code: 'AERO',
      quantity_total: parseInt(legacyData.nb_aerotherme) || 0,
      zones: parseCSV(legacyData.zone_aerotherme),
      equipment_types: parseCSV(legacyData.type_aerotherme),
      has_thermostat: !!legacyData.thermostat_aerotherme,
      has_electrical_panel: !!legacyData.coffret_aerotherme,
      has_timer: !!legacyData.coffret_horloge_aerotherme,
      operational_status: legacyData.Fonctionement_aerotherme || 'unknown',
      maintenance_status: legacyData.Maintenance_aerotherme || 'unknown',
      comments: legacyData.commentaire_aero,
      references: extractReferences(legacyData, 'marque_aerotherme_', 10)
    };
    equipment_configs.push(aeroConfig);
  }

  // Transform Clim IR data
  if (legacyData.nb_clim_ir > 0) {
    const climIrConfig = {
      category_code: 'CLIM_IR',
      quantity_total: parseInt(legacyData.nb_clim_ir) || 0,
      zones: parseCSV(legacyData.zone_clim),
      equipment_types: parseCSV(legacyData.type_clim),
      has_electrical_panel: !!legacyData.coffret_clim,
      operational_status: legacyData.Fonctionement_clim || 'unknown',
      maintenance_status: legacyData.Maintenance_clim || 'unknown',
      comments: legacyData.commentaire_clim,
      references: extractReferences(legacyData, 'clim_ir_ref_', 10)
    };
    equipment_configs.push(climIrConfig);
  }

  // Transform Clim Wire data
  if (legacyData.nb_clim_wire > 0) {
    const climWireConfig = {
      category_code: 'CLIM_WIRE',
      quantity_total: parseInt(legacyData.nb_clim_wire) || 0,
      zones: parseCSV(legacyData.zone_clim),
      equipment_types: parseCSV(legacyData.type_clim),
      has_electrical_panel: !!legacyData.coffret_clim,
      operational_status: legacyData.Fonctionement_clim || 'unknown',
      maintenance_status: legacyData.Maintenance_clim || 'unknown',
      comments: legacyData.commentaire_clim,
      references: extractReferences(legacyData, 'clim_wire_ref_', 10)
    };
    equipment_configs.push(climWireConfig);
  }

  // Transform Rooftop data
  if (legacyData.nb_rooftop > 0 || legacyData.zone_rooftop) {
    const rooftopConfig = {
      category_code: 'ROOFTOP',
      quantity_total: parseInt(legacyData.nb_rooftop) || 0,
      zones: parseCSV(legacyData.zone_rooftop),
      equipment_types: parseCSV(legacyData.type_rooftop),
      has_thermostat: !!legacyData.thermostat_rooftop,
      has_modbus: !!legacyData.telecomande_modbus_rooftop,
      has_electrical_panel: !!legacyData.coffret_rooftop,
      operational_status: legacyData.Fonctionement_rooftop || 'unknown',
      maintenance_status: legacyData.Maintenance_rooftop || 'unknown',
      comments: legacyData.commentaire_rooftop,
      references: extractReferences(legacyData, 'marque_rooftop_', 10)
    };
    equipment_configs.push(rooftopConfig);
  }

  // Transform Lighting data
  if (legacyData.Eclairage_interieur || legacyData.Eclairage_exterieur) {
    const lightingConfig = {
      category_code: 'LIGHTING',
      quantity_total: parseInt(legacyData.Eclairage_interieur) || 0,
      has_electrical_panel: !!legacyData.Eclairage_contacteur,
      has_timer: !!legacyData.Eclairage_horloge,
      comments: legacyData.commentaire_eclairage,
      references: []
    };
    equipment_configs.push(lightingConfig);
  }

  return { site_name: siteName, equipment_configs };
}

// Helper functions
function parseCSV(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.toString().split(',').map(v => v.trim()).filter(v => v.length > 0);
}

function extractReferences(data, prefix, maxCount) {
  const references = [];
  for (let i = 0; i < maxCount; i++) {
    const refValue = data[`${prefix}${i}`];
    if (refValue && refValue.trim()) {
      references.push({
        reference_code: refValue.trim(),
        position_index: i,
        is_active: true
      });
    }
  }
  return references;
}

export default router;