// ===============================================
// DUAL-WRITE MIDDLEWARE - KEEP BOTH SQL SYSTEMS SYNCHRONIZED
// Automatically saves to BOTH old form_sql AND new normalized tables
// ===============================================

import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'admin',
  database: 'avancement',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ===============================================
// DUAL-WRITE FUNCTIONS
// ===============================================

/**
 * Save to BOTH old form_sql AND new normalized tables
 */
export async function dualWritePage2(siteName, formData) {
  console.log(`🔄 [DUAL-WRITE] Saving to BOTH systems for: ${siteName}`);

  try {
    // 1. Save to OLD system (form_sql) - EXISTING CODE
    await saveToFormSql(siteName, formData);
    console.log(`✅ [DUAL-WRITE] Saved to old form_sql`);

    // 2. Save to NEW system (normalized tables) - NEW CODE
    await saveToNormalizedTables(siteName, formData);
    console.log(`✅ [DUAL-WRITE] Saved to new normalized tables`);

    console.log(`🎉 [DUAL-WRITE] Both systems synchronized successfully`);
    return { success: true, message: 'Data saved to both systems' };

  } catch (error) {
    console.error(`❌ [DUAL-WRITE] Failed for ${siteName}:`, error);
    throw error;
  }
}

/**
 * Save to old form_sql table (your existing logic)
 */
async function saveToFormSql(siteName, formData) {
  // Get all the fields you're currently saving
  const fields = [
    'nb_aerotherme', 'thermostat_aerotherme', 'coffret_aerotherme', 'zone_aerotherme',
    'marque_aerotherme_0', 'marque_aerotherme_1', 'marque_aerotherme_2', 'marque_aerotherme_3', 'marque_aerotherme_4',
    'nb_clim_ir', 'nb_clim_wire', 'coffret_clim', 'zone_clim',
    'clim_ir_ref_0', 'clim_ir_ref_1', 'clim_ir_ref_2',
    'nb_rooftop', 'thermostat_rooftop', 'coffret_rooftop', 'zone_rooftop'
  ];

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => formData[field] || null);
  values.push(siteName); // For WHERE clause

  await db.execute(`
    UPDATE form_sql
    SET ${setClause}
    WHERE site = ?
  `, values);
}

/**
 * Save to new normalized tables
 */
async function saveToNormalizedTables(siteName, formData) {
  // Get site ID
  const [siteRows] = await db.execute('SELECT id FROM sites WHERE site_name = ?', [siteName]);
  if (siteRows.length === 0) {
    throw new Error(`Site ${siteName} not found in sites table`);
  }
  const siteId = siteRows[0].id;

  // Clear existing equipment for this site
  await db.execute('DELETE er FROM equipment_references er JOIN equipment_configs ec ON ec.id = er.config_id WHERE ec.site_id = ?', [siteId]);
  await db.execute('DELETE FROM equipment_configs WHERE site_id = ?', [siteId]);

  // Transform and save each equipment type
  const equipmentTypes = [
    {
      quantityField: 'nb_aerotherme',
      categoryCode: 'AERO',
      thermostatField: 'thermostat_aerotherme',
      panelField: 'coffret_aerotherme',
      zoneField: 'zone_aerotherme',
      refPrefix: 'marque_aerotherme_'
    },
    {
      quantityField: 'nb_clim_ir',
      categoryCode: 'CLIM_IR',
      panelField: 'coffret_clim',
      zoneField: 'zone_clim',
      refPrefix: 'clim_ir_ref_'
    },
    {
      quantityField: 'nb_clim_wire',
      categoryCode: 'CLIM_WIRE',
      refPrefix: 'clim_wire_ref_'
    },
    {
      quantityField: 'nb_rooftop',
      categoryCode: 'ROOFTOP',
      thermostatField: 'thermostat_rooftop',
      panelField: 'coffret_rooftop',
      zoneField: 'zone_rooftop',
      refPrefix: 'marque_rooftop_'
    }
  ];

  for (const equipType of equipmentTypes) {
    const quantity = parseInt(formData[equipType.quantityField]) || 0;

    if (quantity > 0) {
      // Get category ID
      const [categoryRows] = await db.execute('SELECT id FROM equipment_categories WHERE category_code = ?', [equipType.categoryCode]);
      if (categoryRows.length === 0) continue;

      // Insert equipment config
      const [configResult] = await db.execute(`
        INSERT INTO equipment_configs (
          site_id, category_id, quantity_total, zones, equipment_types,
          has_thermostat, has_electrical_panel, operational_status, maintenance_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        siteId,
        categoryRows[0].id,
        quantity,
        JSON.stringify(equipType.zoneField && formData[equipType.zoneField] ? [formData[equipType.zoneField]] : []),
        JSON.stringify([]),
        equipType.thermostatField ? (formData[equipType.thermostatField] > 0) : false,
        equipType.panelField ? (formData[equipType.panelField] > 0) : false,
        'working',
        'up_to_date'
      ]);

      const configId = configResult.insertId;

      // Insert references
      for (let i = 0; i < 10; i++) {
        const refValue = formData[`${equipType.refPrefix}${i}`];
        if (refValue && refValue.trim() !== '') {
          await db.execute(`
            INSERT INTO equipment_references (config_id, reference_code, brand_name, position_index, is_active)
            VALUES (?, ?, ?, ?, ?)
          `, [configId, refValue, refValue, i, true]);
        }
      }
    }
  }
}

/**
 * Load from BOTH systems and merge data
 */
export async function dualReadPage2(siteName) {
  console.log(`🔍 [DUAL-READ] Loading from BOTH systems for: ${siteName}`);

  try {
    // Load from old system
    const [oldData] = await db.execute(`
      SELECT * FROM form_sql WHERE site = ?
    `, [siteName]);

    // Load from new system and transform to old format
    const newData = await loadFromNormalizedTables(siteName);

    // Merge data (prioritize old system for now, but verify with new)
    const mergedData = oldData.length > 0 ? oldData[0] : {};

    // Add verification from new system
    if (newData) {
      mergedData._newSystemData = newData;
      mergedData._systemsMatch = compareSystemData(mergedData, newData);
    }

    console.log(`✅ [DUAL-READ] Data loaded from both systems`);
    return mergedData;

  } catch (error) {
    console.error(`❌ [DUAL-READ] Failed for ${siteName}:`, error);
    throw error;
  }
}

/**
 * Load from new normalized tables and transform to old format
 */
async function loadFromNormalizedTables(siteName) {
  const [siteRows] = await db.execute('SELECT id FROM sites WHERE site_name = ?', [siteName]);
  if (siteRows.length === 0) return null;

  const siteId = siteRows[0].id;

  // Load equipment configs with categories
  const [equipmentRows] = await db.execute(`
    SELECT ec.*, cat.category_code
    FROM equipment_configs ec
    JOIN equipment_categories cat ON cat.id = ec.category_id
    WHERE ec.site_id = ?
  `, [siteId]);

  const transformedData = {};

  for (const equipment of equipmentRows) {
    switch (equipment.category_code) {
      case 'AERO':
        transformedData.nb_aerotherme = equipment.quantity_total;
        transformedData.thermostat_aerotherme = equipment.has_thermostat ? 1 : 0;
        transformedData.coffret_aerotherme = equipment.has_electrical_panel ? 1 : 0;

        // Load references
        const [aeroRefs] = await db.execute(`
          SELECT reference_code, position_index FROM equipment_references
          WHERE config_id = ? ORDER BY position_index
        `, [equipment.id]);

        aeroRefs.forEach(ref => {
          transformedData[`marque_aerotherme_${ref.position_index}`] = ref.reference_code;
        });
        break;

      case 'CLIM_IR':
        transformedData.nb_clim_ir = equipment.quantity_total;
        transformedData.coffret_clim = equipment.has_electrical_panel ? 1 : 0;

        const [climRefs] = await db.execute(`
          SELECT reference_code, position_index FROM equipment_references
          WHERE config_id = ? ORDER BY position_index
        `, [equipment.id]);

        climRefs.forEach(ref => {
          transformedData[`clim_ir_ref_${ref.position_index}`] = ref.reference_code;
        });
        break;

      // Add other equipment types...
    }
  }

  return transformedData;
}

/**
 * Compare data between old and new systems
 */
function compareSystemData(oldData, newData) {
  const criticalFields = ['nb_aerotherme', 'nb_clim_ir', 'nb_clim_wire', 'nb_rooftop'];

  for (const field of criticalFields) {
    if ((oldData[field] || 0) !== (newData[field] || 0)) {
      return false;
    }
  }

  return true;
}

export default {
  dualWritePage2,
  dualReadPage2
};