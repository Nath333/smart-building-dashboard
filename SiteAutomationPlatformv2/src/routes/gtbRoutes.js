// ===============================================
// GTB ROUTES - NORMALIZED DATABASE
// Parallel structure to equipmentRoutes.js
// Works with normalized GTB schema
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
// 📊 GET GTB DATA BY SITE (NORMALIZED)
// ===============================================
router.post('/get-by-site', async (req, res) => {
  const { site } = req.body;

  if (!site || typeof site !== 'string' || !site.trim()) {
    return res.status(400).json({ error: 'Site name is required' });
  }

  try {
    console.log(`📥 [GET] GTB data for site: "${site}"`);

    // Get site ID
    const [siteRows] = await db.execute(
      'SELECT id FROM sites WHERE site_name = ?',
      [site.trim()]
    );

    if (siteRows.length === 0) {
      console.log(`⚠️ Site not found: ${site}`);
      return res.json({
        gtb_configs: [],
        special_config: null,
        message: 'No GTB configuration found'
      });
    }

    const siteId = siteRows[0].id;

    // Get GTB configurations with categories
    const [configRows] = await db.execute(`
      SELECT
        gsc.*,
        gmc.category_code,
        gmc.category_name,
        gmc.default_reference,
        gmc.icon_name
      FROM gtb_site_configs gsc
      JOIN gtb_module_categories gmc ON gmc.id = gsc.category_id
      WHERE gsc.site_id = ?
      ORDER BY gmc.category_code
    `, [siteId]);

    // Get GTB module references for each config
    const gtbConfigs = [];
    for (const config of configRows) {
      const [refRows] = await db.execute(`
        SELECT *
        FROM gtb_module_references
        WHERE config_id = ?
        ORDER BY position_index
      `, [config.id]);

      gtbConfigs.push({
        ...config,
        references: refRows,
        configuration_data: config.configuration_data ? JSON.parse(config.configuration_data) : {}
      });
    }

    // Get special configurations (sensors, gas meters, etc.)
    const [specialRows] = await db.execute(`
      SELECT *
      FROM gtb_special_configs
      WHERE site_id = ?
    `, [siteId]);

    const specialConfig = specialRows.length > 0 ? {
      ...specialRows[0],
      izit_coffrets: specialRows[0].izit_coffrets ? JSON.parse(specialRows[0].izit_coffrets) : [],
      special_modules: specialRows[0].special_modules ? JSON.parse(specialRows[0].special_modules) : []
    } : null;

    console.log(`✅ Found ${gtbConfigs.length} GTB configurations`);
    res.json({
      gtb_configs: gtbConfigs,
      special_config: specialConfig
    });

  } catch (error) {
    console.error('❌ Error fetching GTB data:', error);
    res.status(500).json({
      error: 'Database error',
      details: error.message
    });
  }
});

// ===============================================
// 💾 SAVE GTB DATA (NORMALIZED)
// ===============================================
router.post('/save', async (req, res) => {
  const { site_name, gtb_configs, special_config } = req.body;

  if (!site_name) {
    return res.status(400).json({ error: 'Site name is required' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    console.log(`💾 [SAVE] GTB data for site: "${site_name}"`);

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

    // Process GTB module configurations
    if (Array.isArray(gtb_configs)) {
      for (const config of gtb_configs) {
        const { category_code, references = [], ...configData } = config;

        // Get category ID
        const [catRows] = await connection.execute(
          'SELECT id FROM gtb_module_categories WHERE category_code = ?',
          [category_code]
        );

        if (catRows.length === 0) {
          throw new Error(`Unknown GTB module category: ${category_code}`);
        }

        const categoryId = catRows[0].id;

        // Prepare configuration data
        const {
          quantity = 0,
          is_enabled = false,
          configuration_data = {},
          installation_notes = null,
          operational_status = 'unknown'
        } = configData;

        // Convert configuration data to JSON
        const configJson = JSON.stringify(configuration_data);

        // Upsert GTB site configuration
        await connection.execute(`
          INSERT INTO gtb_site_configs (
            site_id, category_id, quantity, is_enabled, configuration_data,
            installation_notes, operational_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            quantity = VALUES(quantity),
            is_enabled = VALUES(is_enabled),
            configuration_data = VALUES(configuration_data),
            installation_notes = VALUES(installation_notes),
            operational_status = VALUES(operational_status),
            updated_at = CURRENT_TIMESTAMP
        `, [
          siteId, categoryId, quantity, is_enabled, configJson,
          installation_notes, operational_status
        ]);

        // Get the config ID for references
        const [configRows] = await connection.execute(
          'SELECT id FROM gtb_site_configs WHERE site_id = ? AND category_id = ?',
          [siteId, categoryId]
        );
        const configId = configRows[0].id;

        // Delete existing references
        await connection.execute(
          'DELETE FROM gtb_module_references WHERE config_id = ?',
          [configId]
        );

        // Insert new references
        if (references.length > 0) {
          const referenceValues = references.map(ref => [
            configId,
            ref.reference_code || null,
            ref.reference_name || null,
            ref.position_index || 0,
            ref.is_active !== false, // Default to true
            ref.installation_date || null,
            ref.technical_specs ? JSON.stringify(ref.technical_specs) : null,
            ref.notes || null
          ]);

          const placeholders = references.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
          const flatValues = referenceValues.flat();

          await connection.execute(`
            INSERT INTO gtb_module_references (
              config_id, reference_code, reference_name, position_index,
              is_active, installation_date, technical_specs, notes
            ) VALUES ${placeholders}
          `, flatValues);
        }
      }
    }

    // Process special configurations (sensors, gas meters, etc.)
    if (special_config) {
      const {
        sondes_temperature = 0,
        sondes_presence = 0,
        gas_meter_enabled = false,
        izit_coffrets = [],
        special_modules = []
      } = special_config;

      await connection.execute(`
        INSERT INTO gtb_special_configs (
          site_id, sondes_temperature, sondes_presence, gas_meter_enabled,
          izit_coffrets, special_modules
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          sondes_temperature = VALUES(sondes_temperature),
          sondes_presence = VALUES(sondes_presence),
          gas_meter_enabled = VALUES(gas_meter_enabled),
          izit_coffrets = VALUES(izit_coffrets),
          special_modules = VALUES(special_modules),
          updated_at = CURRENT_TIMESTAMP
      `, [
        siteId, sondes_temperature, sondes_presence, gas_meter_enabled,
        JSON.stringify(izit_coffrets), JSON.stringify(special_modules)
      ]);
    }

    await connection.commit();
    console.log(`✅ GTB data saved successfully for site: ${site_name}`);

    res.json({
      success: true,
      message: `GTB configuration saved for site: ${site_name}`,
      configs_saved: Array.isArray(gtb_configs) ? gtb_configs.length : 0
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error saving GTB data:', error);
    res.status(500).json({
      error: 'Failed to save GTB data',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// ===============================================
// 📈 GET GTB SUMMARY
// ===============================================
router.post('/summary', async (req, res) => {
  const { site } = req.body;

  try {
    console.log(`📊 [SUMMARY] GTB summary for site: "${site}"`);

    const [summaryRows] = await db.execute(`
      SELECT
        s.site_name,
        gmc.category_code,
        gmc.category_name,
        gsc.quantity,
        gsc.is_enabled,
        gsc.configuration_data,
        gsc.operational_status,
        COUNT(gmr.id) as reference_count,
        gsc.updated_at
      FROM sites s
      JOIN gtb_site_configs gsc ON gsc.site_id = s.id
      JOIN gtb_module_categories gmc ON gmc.id = gsc.category_id
      LEFT JOIN gtb_module_references gmr ON gmr.config_id = gsc.id
      WHERE s.site_name = ?
      GROUP BY s.id, gsc.id, gmc.id
      ORDER BY gmc.category_code
    `, [site]);

    // Get special config summary
    const [specialRows] = await db.execute(`
      SELECT
        sondes_temperature,
        sondes_presence,
        gas_meter_enabled,
        izit_coffrets,
        special_modules
      FROM gtb_special_configs gsp
      JOIN sites s ON s.id = gsp.site_id
      WHERE s.site_name = ?
    `, [site]);

    const specialSummary = specialRows.length > 0 ? {
      ...specialRows[0],
      izit_coffrets: specialRows[0].izit_coffrets ? JSON.parse(specialRows[0].izit_coffrets) : [],
      special_modules: specialRows[0].special_modules ? JSON.parse(specialRows[0].special_modules) : []
    } : null;

    res.json({
      summary: summaryRows,
      special_summary: specialSummary
    });

  } catch (error) {
    console.error('❌ Error fetching GTB summary:', error);
    res.status(500).json({
      error: 'Database error',
      details: error.message
    });
  }
});

// ===============================================
// 🏷️ GET GTB MODULE CATEGORIES
// ===============================================
router.get('/categories', async (req, res) => {
  try {
    console.log(`📋 [CATEGORIES] Fetching GTB module categories`);

    const [categoryRows] = await db.execute(`
      SELECT
        id,
        category_code,
        category_name,
        description,
        default_reference,
        icon_name,
        is_active
      FROM gtb_module_categories
      WHERE is_active = TRUE
      ORDER BY category_name
    `);

    res.json({ categories: categoryRows });

  } catch (error) {
    console.error('❌ Error fetching GTB categories:', error);
    res.status(500).json({
      error: 'Database error',
      details: error.message
    });
  }
});

// ===============================================
// 🔧 BACKWARD COMPATIBILITY ENDPOINTS
// ===============================================

// Legacy endpoint for existing frontend (form_sql compatibility)
router.post('/save_page3_normalized', async (req, res) => {
  try {
    const { site, ...legacyData } = req.body;

    // Transform legacy data to normalized format
    const normalizedData = transformLegacyGtbToNormalized(site, legacyData);

    // Use the new save endpoint
    req.body = normalizedData;
    return router.handle(Object.assign(req, {
      method: 'POST',
      url: '/save'
    }), res);

  } catch (error) {
    console.error('❌ Error in GTB legacy compatibility:', error);
    res.status(500).json({
      error: 'GTB legacy compatibility error',
      details: error.message
    });
  }
});

// Transform legacy GTB form_sql data to normalized format
function transformLegacyGtbToNormalized(siteName, legacyData) {
  const gtb_configs = [];
  const special_config = {};

  // Module mappings from legacy form_sql to normalized
  const moduleMappings = [
    { legacyField: 'aeroeau', categoryCode: 'AERO_EAU', refField: 'ref_aeroeau' },
    { legacyField: 'aerogaz', categoryCode: 'AERO_GAZ', refField: 'ref_aerogaz' },
    { legacyField: 'clim_ir', categoryCode: 'CLIM_IR', refField: 'ref_clim_ir' },
    { legacyField: 'clim_filaire_simple', categoryCode: 'CLIM_FILAIRE_SIMPLE', refField: 'ref_clim_filaire_simple' },
    { legacyField: 'clim_filaire_groupe', categoryCode: 'CLIM_FILAIRE_GROUPE', refField: 'ref_clim_filaire_groupe' },
    { legacyField: 'rooftop', categoryCode: 'ROOFTOP', refField: 'ref_rooftop' },
    { legacyField: 'Comptage_Froid', categoryCode: 'COMPTAGE_FROID', refField: 'ref_Comptage_Froid' },
    { legacyField: 'Comptage_Eclairage', categoryCode: 'COMPTAGE_ECLAIRAGE', refField: 'ref_Comptage_Eclairage' },
    { legacyField: 'eclairage', categoryCode: 'ECLAIRAGE', refField: 'ref_eclairage' }
  ];

  // Process each module type
  moduleMappings.forEach(mapping => {
    const quantity = parseInt(legacyData[mapping.legacyField]) || 0;

    if (quantity > 0) {
      const references = [];

      // Extract references from ref_ fields
      if (legacyData[mapping.refField]) {
        const refArray = Array.isArray(legacyData[mapping.refField])
          ? legacyData[mapping.refField]
          : legacyData[mapping.refField].split(',');

        refArray.forEach((ref, index) => {
          if (ref && ref.trim()) {
            references.push({
              reference_code: ref.trim(),
              position_index: index,
              is_active: true
            });
          }
        });
      }

      gtb_configs.push({
        category_code: mapping.categoryCode,
        quantity,
        is_enabled: true,
        configuration_data: {},
        operational_status: 'working',
        references
      });
    }
  });

  // Handle special configurations
  if (legacyData.sondes) {
    special_config.sondes_temperature = parseInt(legacyData.sondes) || 0;
  }

  if (legacyData.sondesPresentes) {
    special_config.sondes_presence = parseInt(legacyData.sondesPresentes) || 0;
  }

  if (legacyData.gazCompteur) {
    special_config.gas_meter_enabled = legacyData.gazCompteur === 'oui';
  }

  if (legacyData.Izit) {
    special_config.izit_coffrets = Array.isArray(legacyData.Izit)
      ? legacyData.Izit
      : legacyData.Izit.split(',').map(i => i.trim());
  }

  return {
    site_name: siteName,
    gtb_configs,
    special_config: Object.keys(special_config).length > 0 ? special_config : null
  };
}

export default router;