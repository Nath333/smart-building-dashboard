// ===============================================
// REWRITTEN SERVER - USES NEW NORMALIZED SCHEMA
// Complete migration from old form_sql to new tables
// ===============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import imageRoutes from './src/routes/imageRoutes.js';
import equipmentRoutes from './src/routes/equipmentRoutes.js';

dotenv.config();

const app = express();

// Middleware setup
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawSize = buf.length;
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawSize = buf.length;
  }
}));

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
// 🔄 HELPER FUNCTIONS FOR DATA TRANSFORMATION
// ===============================================

// Transform new schema data to legacy format for frontend compatibility
const transformToLegacyFormat = async (siteId) => {
  const [siteRows] = await db.execute('SELECT * FROM sites WHERE id = ?', [siteId]);
  if (siteRows.length === 0) return null;

  const site = siteRows[0];
  const legacy = {
    id: site.id,
    site: site.site_name,
    client: site.client_name,
    address: site.address,
    number1: site.phone_primary,
    number2: site.phone_secondary,
    email: site.email,
    submitted_at: site.created_at
  };

  // Get equipment configurations
  const [equipConfigs] = await db.execute(`
    SELECT ec.*, cat.category_code
    FROM equipment_configs ec
    JOIN equipment_categories cat ON cat.id = ec.category_id
    WHERE ec.site_id = ?
  `, [siteId]);

  // Transform each equipment category
  for (const config of equipConfigs) {
    const { category_code } = config;

    switch (category_code) {
      case 'AERO':
        legacy.zone_aerotherme = Array.isArray(config.zones) ? config.zones.join(', ') : config.zones;
        legacy.nb_aerotherme = config.quantity_total || 0;
        legacy.thermostat_aerotherme = config.has_thermostat ? 1 : 0;
        legacy.nb_contacts_aerotherme = config.nb_contacts_aerotherme || 0;
        legacy.coffret_aerotherme = config.has_electrical_panel ? 1 : 0;
        legacy.coffret_horloge_aerotherme = config.has_timer ? 1 : 0;
        legacy.type_aerotherme = Array.isArray(config.equipment_types) ? config.equipment_types.join(', ') : config.equipment_types;
        legacy.Fonctionement_aerotherme = config.operational_status || 'unknown';
        legacy.Maintenance_aerotherme = config.maintenance_status || 'unknown';
        legacy.commentaire_aero = config.comments;
        legacy.pos_x = config.pos_x;
        legacy.pos_y = config.pos_y;

        // Get references
        const [aeroRefs] = await db.execute(
          'SELECT * FROM equipment_references WHERE config_id = ? ORDER BY position_index',
          [config.id]
        );
        aeroRefs.forEach((ref, index) => {
          if (index < 10) {
            legacy[`marque_aerotherme_${index}`] = ref.reference_code || ref.brand_name;
          }
        });
        break;

      case 'CLIM_IR':
        legacy.zone_clim = Array.isArray(config.zones) ? config.zones.join(', ') : config.zones;
        legacy.nb_clim_ir = config.quantity_total || 0;
        legacy.coffret_clim = config.has_electrical_panel ? 1 : 0;
        legacy.type_clim = Array.isArray(config.equipment_types) ? config.equipment_types.join(', ') : config.equipment_types;
        legacy.Fonctionement_clim = config.operational_status || 'unknown';
        legacy.Maintenance_clim = config.maintenance_status || 'unknown';
        legacy.nb_telecommande_clim_smartwire = config.nb_telecommande_clim_smartwire || 0;
        legacy.commentaire_clim = config.comments;

        const [climIrRefs] = await db.execute(
          'SELECT * FROM equipment_references WHERE config_id = ? ORDER BY position_index',
          [config.id]
        );
        climIrRefs.forEach((ref, index) => {
          if (index < 10) {
            legacy[`clim_ir_ref_${index}`] = ref.reference_code || ref.brand_name;
          }
        });
        break;

      case 'CLIM_WIRE':
        legacy.nb_clim_wire = config.quantity_total || 0;
        legacy.nb_telecommande_clim_wire = config.nb_telecommande_clim_wire || 0;

        const [climWireRefs] = await db.execute(
          'SELECT * FROM equipment_references WHERE config_id = ? ORDER BY position_index',
          [config.id]
        );
        climWireRefs.forEach((ref, index) => {
          if (index < 10) {
            legacy[`clim_wire_ref_${index}`] = ref.reference_code || ref.brand_name;
          }
        });
        break;

      case 'ROOFTOP':
        legacy.zone_rooftop = Array.isArray(config.zones) ? config.zones.join(', ') : config.zones;
        legacy.zone_rooftop_1 = config.zone_rooftop_1;
        legacy.zone_rooftop_2 = config.zone_rooftop_2;
        legacy.zone_rooftop_3 = config.zone_rooftop_3;
        legacy.zone_rooftop_4 = config.zone_rooftop_4;
        legacy.nb_rooftop = config.quantity_total || 0;
        legacy.thermostat_rooftop = config.has_thermostat ? 1 : 0;
        legacy.telecomande_modbus_rooftop = config.telecomande_modbus_rooftop ? 1 : 0;
        legacy.coffret_rooftop = config.has_electrical_panel ? 1 : 0;
        legacy.type_rooftop = Array.isArray(config.equipment_types) ? config.equipment_types.join(', ') : config.equipment_types;
        legacy.type_rooftop_1 = config.type_rooftop_1;
        legacy.type_rooftop_2 = config.type_rooftop_2;
        legacy.type_rooftop_3 = config.type_rooftop_3;
        legacy.Fonctionement_rooftop = config.operational_status || 'unknown';
        legacy.Maintenance_rooftop = config.maintenance_status || 'unknown';
        legacy.commentaire_rooftop = config.comments;

        const [rooftopRefs] = await db.execute(
          'SELECT * FROM equipment_references WHERE config_id = ? ORDER BY position_index',
          [config.id]
        );
        rooftopRefs.forEach((ref, index) => {
          if (index < 10) {
            legacy[`marque_rooftop_${index}`] = ref.reference_code || ref.brand_name;
          }
        });
        break;

      case 'LIGHTING':
        legacy.Eclairage_interieur = config.quantity_total || 0;
        legacy.Eclairage_contacteur = config.has_electrical_panel ? 1 : 0;
        legacy.Eclairage_exterieur = config.quantity_ir || 0;
        legacy.Eclairage_horloge = config.has_timer ? 1 : 0;
        legacy.commentaire_eclairage = config.comments;
        break;
    }
  }

  // Get GTB configuration
  const [gtbConfig] = await db.execute('SELECT * FROM gtb_site_config WHERE site_id = ?', [siteId]);
  if (gtbConfig.length > 0) {
    const gtb = gtbConfig[0];
    legacy.refs = gtb.refs || 0;
    legacy.sondes = gtb.sondes || 0;
    legacy.sondesPresentes = gtb.sondesPresentes || 0;
    legacy.gazCompteur = gtb.gazCompteur || 0;
    legacy.Izit = gtb.Izit || 0;
    legacy.modules = gtb.modules || 0;
    legacy.aeroeau = gtb.aeroeau || 0;
    legacy.aerogaz = gtb.aerogaz || 0;
    legacy.clim_filaire_simple = gtb.clim_filaire_simple || 0;
    legacy.clim_filaire_groupe = gtb.clim_filaire_groupe || 0;
    legacy.Comptage_Froid = gtb.Comptage_Froid || 0;
    legacy.Comptage_Eclairage = gtb.Comptage_Eclairage || 0;
    legacy.eclairage = gtb.eclairage || 0;

    // Add reference arrays as individual fields
    ['ref_aeroeau', 'ref_aerogaz', 'ref_clim_ir', 'ref_clim_filaire_simple',
     'ref_clim_filaire_groupe', 'ref_rooftop', 'ref_Comptage_Froid',
     'ref_Comptage_Eclairage', 'ref_eclairage', 'ref_sondes',
     'ref_sondesPresentes', 'ref_gazCompteur', 'ref_Izit'].forEach(refField => {
      const refs = gtb[refField];
      if (Array.isArray(refs)) {
        refs.forEach((ref, index) => {
          legacy[`${refField}_${index}`] = ref;
        });
      }
    });
  }

  return legacy;
};

// Transform legacy data to new schema format
const transformFromLegacyFormat = (siteId, legacyData) => {
  const transformations = {
    equipmentConfigs: [],
    gtbConfig: null
  };

  // Helper function to parse multi-select values
  const parseMultiSelect = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value.toString().split(',').map(v => v.trim()).filter(v => v.length > 0);
  };

  // Extract references
  const extractReferences = (data, prefix, maxCount) => {
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
  };

  // Process equipment configurations
  const equipmentTypes = [
    {
      category: 'AERO',
      condition: legacyData.nb_aerotherme > 0 || legacyData.zone_aerotherme,
      config: {
        quantity_total: parseInt(legacyData.nb_aerotherme) || 0,
        zones: parseMultiSelect(legacyData.zone_aerotherme),
        equipment_types: parseMultiSelect(legacyData.type_aerotherme),
        has_thermostat: !!legacyData.thermostat_aerotherme,
        has_electrical_panel: !!legacyData.coffret_aerotherme,
        has_timer: !!legacyData.coffret_horloge_aerotherme,
        nb_contacts_aerotherme: parseInt(legacyData.nb_contacts_aerotherme) || 0,
        operational_status: legacyData.Fonctionement_aerotherme || 'unknown',
        maintenance_status: legacyData.Maintenance_aerotherme || 'unknown',
        comments: legacyData.commentaire_aero,
        pos_x: legacyData.pos_x,
        pos_y: legacyData.pos_y,
        references: extractReferences(legacyData, 'marque_aerotherme_', 10)
      }
    },
    {
      category: 'CLIM_IR',
      condition: legacyData.nb_clim_ir > 0,
      config: {
        quantity_total: parseInt(legacyData.nb_clim_ir) || 0,
        zones: parseMultiSelect(legacyData.zone_clim),
        equipment_types: parseMultiSelect(legacyData.type_clim),
        has_electrical_panel: !!legacyData.coffret_clim,
        nb_telecommande_clim_smartwire: parseInt(legacyData.nb_telecommande_clim_smartwire) || 0,
        operational_status: legacyData.Fonctionement_clim || 'unknown',
        maintenance_status: legacyData.Maintenance_clim || 'unknown',
        comments: legacyData.commentaire_clim,
        references: extractReferences(legacyData, 'clim_ir_ref_', 10)
      }
    },
    {
      category: 'CLIM_WIRE',
      condition: legacyData.nb_clim_wire > 0,
      config: {
        quantity_total: parseInt(legacyData.nb_clim_wire) || 0,
        zones: parseMultiSelect(legacyData.zone_clim),
        equipment_types: parseMultiSelect(legacyData.type_clim),
        has_electrical_panel: !!legacyData.coffret_clim,
        nb_telecommande_clim_wire: parseInt(legacyData.nb_telecommande_clim_wire) || 0,
        operational_status: legacyData.Fonctionement_clim || 'unknown',
        maintenance_status: legacyData.Maintenance_clim || 'unknown',
        comments: legacyData.commentaire_clim,
        references: extractReferences(legacyData, 'clim_wire_ref_', 10)
      }
    },
    {
      category: 'ROOFTOP',
      condition: legacyData.nb_rooftop > 0 || legacyData.zone_rooftop,
      config: {
        quantity_total: parseInt(legacyData.nb_rooftop) || 0,
        zones: parseMultiSelect(legacyData.zone_rooftop),
        equipment_types: parseMultiSelect(legacyData.type_rooftop),
        has_thermostat: !!legacyData.thermostat_rooftop,
        has_electrical_panel: !!legacyData.coffret_rooftop,
        telecomande_modbus_rooftop: !!legacyData.telecomande_modbus_rooftop,
        zone_rooftop_1: legacyData.zone_rooftop_1,
        zone_rooftop_2: legacyData.zone_rooftop_2,
        zone_rooftop_3: legacyData.zone_rooftop_3,
        zone_rooftop_4: legacyData.zone_rooftop_4,
        type_rooftop_1: legacyData.type_rooftop_1,
        type_rooftop_2: legacyData.type_rooftop_2,
        type_rooftop_3: legacyData.type_rooftop_3,
        operational_status: legacyData.Fonctionement_rooftop || 'unknown',
        maintenance_status: legacyData.Maintenance_rooftop || 'unknown',
        comments: legacyData.commentaire_rooftop,
        references: extractReferences(legacyData, 'marque_rooftop_', 10)
      }
    },
    {
      category: 'LIGHTING',
      condition: legacyData.Eclairage_interieur || legacyData.Eclairage_exterieur,
      config: {
        quantity_total: parseInt(legacyData.Eclairage_interieur) || 0,
        quantity_ir: parseInt(legacyData.Eclairage_exterieur) || 0,
        has_electrical_panel: !!legacyData.Eclairage_contacteur,
        has_timer: !!legacyData.Eclairage_horloge,
        comments: legacyData.commentaire_eclairage,
        references: []
      }
    }
  ];

  // Add equipment configs that have data
  equipmentTypes.forEach(({ category, condition, config }) => {
    if (condition) {
      transformations.equipmentConfigs.push({ category, config });
    }
  });

  // Process GTB configuration
  if (legacyData.refs || legacyData.sondes || legacyData.modules) {
    transformations.gtbConfig = {
      refs: parseInt(legacyData.refs) || 0,
      sondes: parseInt(legacyData.sondes) || 0,
      sondesPresentes: parseInt(legacyData.sondesPresentes) || 0,
      gazCompteur: parseInt(legacyData.gazCompteur) || 0,
      Izit: parseInt(legacyData.Izit) || 0,
      modules: parseInt(legacyData.modules) || 0,
      aeroeau: parseInt(legacyData.aeroeau) || 0,
      aerogaz: parseInt(legacyData.aerogaz) || 0,
      clim_filaire_simple: parseInt(legacyData.clim_filaire_simple) || 0,
      clim_filaire_groupe: parseInt(legacyData.clim_filaire_groupe) || 0,
      Comptage_Froid: parseInt(legacyData.Comptage_Froid) || 0,
      Comptage_Eclairage: parseInt(legacyData.Comptage_Eclairage) || 0,
      eclairage: parseInt(legacyData.eclairage) || 0
    };

    // Extract reference arrays
    ['ref_aeroeau', 'ref_aerogaz', 'ref_clim_ir', 'ref_clim_filaire_simple',
     'ref_clim_filaire_groupe', 'ref_rooftop', 'ref_Comptage_Froid',
     'ref_Comptage_Eclairage', 'ref_eclairage', 'ref_sondes',
     'ref_sondesPresentes', 'ref_gazCompteur', 'ref_Izit'].forEach(refField => {
      const refs = [];
      for (let i = 0; i < 20; i++) {
        const refValue = legacyData[`${refField}_${i}`];
        if (refValue && refValue.trim()) {
          refs.push(refValue.trim());
        }
      }
      if (refs.length > 0) {
        transformations.gtbConfig[refField] = refs;
      }
    });
  }

  return transformations;
};

// ===============================================
// 🔄 NEW SCHEMA ENDPOINTS (BACKWARD COMPATIBLE)
// ===============================================

// Save Page 1 - Site Information
app.post('/save-page1', async (req, res) => {
  const { site, client, address, number1, number2, email } = req.body;

  if (!site || typeof site !== 'string' || !site.trim()) {
    return res.status(400).json({ error: 'Le champ "site" est requis' });
  }

  const trimmedSite = site.trim();

  try {
    await db.execute(`
      INSERT INTO sites (site_name, client_name, address, phone_primary, phone_secondary, email)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        client_name = VALUES(client_name),
        address = VALUES(address),
        phone_primary = VALUES(phone_primary),
        phone_secondary = VALUES(phone_secondary),
        email = VALUES(email),
        updated_at = CURRENT_TIMESTAMP
    `, [
      trimmedSite,
      client?.trim() || null,
      address?.trim() || null,
      number1?.trim() || null,
      number2?.trim() || null,
      email?.trim() || null
    ]);

    res.status(200).json({ message: '✅ Site information saved successfully' });
  } catch (err) {
    console.error('❌ Error saving site:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get Page 1 - Site Information
app.post('/get-page1', async (req, res) => {
  const { site } = req.body;

  if (!site || typeof site !== 'string' || !site.trim()) {
    return res.status(400).json({ error: 'Invalid site name' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT site_name as site, client_name as client, address, phone_primary as number1, phone_secondary as number2, email FROM sites WHERE site_name = ? LIMIT 1',
      [site.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error fetching site:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// List Sites
app.post('/list-sites', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT site_name as site FROM sites ORDER BY site_name ASC');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching sites:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Save Page 2 - Equipment Data
app.post('/save_page2', async (req, res) => {
  const { site, ...legacyData } = req.body;

  if (!site) {
    return res.status(400).json({ error: 'Missing site in request' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Get site ID
    const [siteRows] = await connection.execute('SELECT id FROM sites WHERE site_name = ?', [site]);
    if (siteRows.length === 0) {
      await connection.execute('INSERT INTO sites (site_name) VALUES (?)', [site]);
      const [newSiteRows] = await connection.execute('SELECT id FROM sites WHERE site_name = ?', [site]);
      siteId = newSiteRows[0].id;
    } else {
      var siteId = siteRows[0].id;
    }

    // Transform legacy data to new schema
    const { equipmentConfigs, gtbConfig } = transformFromLegacyFormat(siteId, legacyData);

    // Save equipment configurations
    for (const { category, config } of equipmentConfigs) {
      // Get category ID
      const [catRows] = await connection.execute(
        'SELECT id FROM equipment_categories WHERE category_code = ?',
        [category]
      );

      if (catRows.length === 0) continue;

      const categoryId = catRows[0].id;
      const { references, ...configData } = config;

      // Convert arrays to JSON
      const zonesJson = JSON.stringify(configData.zones || []);
      const typesJson = JSON.stringify(configData.equipment_types || []);

      // Upsert equipment configuration
      await connection.execute(`
        INSERT INTO equipment_configs (
          site_id, category_id, quantity_total, quantity_ir, quantity_wire,
          zones, equipment_types, has_thermostat, has_remote_control,
          has_modbus, has_electrical_panel, has_timer,
          nb_contacts_aerotherme, nb_telecommande_clim_smartwire, nb_telecommande_clim_wire,
          telecomande_modbus_rooftop, zone_rooftop_1, zone_rooftop_2, zone_rooftop_3, zone_rooftop_4,
          type_rooftop_1, type_rooftop_2, type_rooftop_3, pos_x, pos_y,
          operational_status, maintenance_status, comments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          nb_contacts_aerotherme = VALUES(nb_contacts_aerotherme),
          nb_telecommande_clim_smartwire = VALUES(nb_telecommande_clim_smartwire),
          nb_telecommande_clim_wire = VALUES(nb_telecommande_clim_wire),
          telecomande_modbus_rooftop = VALUES(telecomande_modbus_rooftop),
          zone_rooftop_1 = VALUES(zone_rooftop_1),
          zone_rooftop_2 = VALUES(zone_rooftop_2),
          zone_rooftop_3 = VALUES(zone_rooftop_3),
          zone_rooftop_4 = VALUES(zone_rooftop_4),
          type_rooftop_1 = VALUES(type_rooftop_1),
          type_rooftop_2 = VALUES(type_rooftop_2),
          type_rooftop_3 = VALUES(type_rooftop_3),
          pos_x = VALUES(pos_x),
          pos_y = VALUES(pos_y),
          operational_status = VALUES(operational_status),
          maintenance_status = VALUES(maintenance_status),
          comments = VALUES(comments),
          updated_at = CURRENT_TIMESTAMP
      `, [
        siteId, categoryId, configData.quantity_total || 0, configData.quantity_ir || 0, configData.quantity_wire || 0,
        zonesJson, typesJson, configData.has_thermostat || false, configData.has_remote_control || false,
        configData.has_modbus || false, configData.has_electrical_panel || false, configData.has_timer || false,
        configData.nb_contacts_aerotherme || null, configData.nb_telecommande_clim_smartwire || null,
        configData.nb_telecommande_clim_wire || null, configData.telecomande_modbus_rooftop || false,
        configData.zone_rooftop_1 || null, configData.zone_rooftop_2 || null, configData.zone_rooftop_3 || null,
        configData.zone_rooftop_4 || null, configData.type_rooftop_1 || null, configData.type_rooftop_2 || null,
        configData.type_rooftop_3 || null, configData.pos_x || null, configData.pos_y || null,
        configData.operational_status || 'unknown', configData.maintenance_status || 'unknown', configData.comments || null
      ]);

      // Get config ID and save references
      const [configRows] = await connection.execute(
        'SELECT id FROM equipment_configs WHERE site_id = ? AND category_id = ?',
        [siteId, categoryId]
      );
      const configId = configRows[0].id;

      // Delete existing references
      await connection.execute('DELETE FROM equipment_references WHERE config_id = ?', [configId]);

      // Insert new references
      if (references && references.length > 0) {
        for (const ref of references) {
          await connection.execute(`
            INSERT INTO equipment_references (
              config_id, reference_code, brand_name, position_index, is_active
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            configId,
            ref.reference_code || null,
            ref.brand_name || null,
            ref.position_index || 0,
            ref.is_active !== false
          ]);
        }
      }
    }

    // Save GTB configuration
    if (gtbConfig) {
      const gtbFields = Object.keys(gtbConfig).filter(key => !key.startsWith('ref_'));
      const refFields = Object.keys(gtbConfig).filter(key => key.startsWith('ref_'));

      const fieldNames = [...gtbFields, ...refFields];
      const fieldValues = fieldNames.map(field => {
        if (field.startsWith('ref_')) {
          return JSON.stringify(gtbConfig[field] || []);
        }
        return gtbConfig[field] || 0;
      });

      const placeholders = fieldNames.map(field => `${field} = ?`).join(', ');

      await connection.execute(`
        INSERT INTO gtb_site_config (site_id, ${fieldNames.join(', ')})
        VALUES (?, ${fieldValues.map(() => '?').join(', ')})
        ON DUPLICATE KEY UPDATE ${placeholders}, updated_at = CURRENT_TIMESTAMP
      `, [siteId, ...fieldValues, ...fieldValues]);
    }

    await connection.commit();
    res.status(200).json({ message: '✅ Equipment data saved successfully' });

  } catch (err) {
    await connection.rollback();
    console.error('❌ Error saving equipment data:', err);
    res.status(500).json({ error: 'Equipment save failed', details: err.message });
  } finally {
    connection.release();
  }
});

// Get Page 2 - Equipment Data
app.post('/get-page2', async (req, res) => {
  const { site } = req.body;

  if (!site || typeof site !== 'string' || !site.trim()) {
    return res.status(400).json({ error: 'Invalid or missing site' });
  }

  try {
    const [siteRows] = await db.execute('SELECT id FROM sites WHERE site_name = ?', [site.trim()]);

    if (siteRows.length === 0) {
      return res.json({}); // Return empty object for non-existent sites
    }

    const siteId = siteRows[0].id;
    const legacyData = await transformToLegacyFormat(siteId);

    res.json(legacyData);
  } catch (err) {
    console.error('❌ Error fetching equipment data:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Save Page 3 - GTB Configuration
app.post('/save_page3', async (req, res) => {
  const { site, ...gtbData } = req.body;

  if (!site) {
    return res.status(400).json({ error: 'Missing site in request' });
  }

  try {
    // Get site ID
    const [siteRows] = await db.execute('SELECT id FROM sites WHERE site_name = ?', [site]);
    if (siteRows.length === 0) {
      await db.execute('INSERT INTO sites (site_name) VALUES (?)', [site]);
      const [newSiteRows] = await db.execute('SELECT id FROM sites WHERE site_name = ?', [site]);
      var siteId = newSiteRows[0].id;
    } else {
      var siteId = siteRows[0].id;
    }

    // Extract field names and values from gtbData
    const validFields = [
      'refs', 'sondes', 'sondesPresentes', 'gazCompteur', 'Izit', 'modules',
      'aeroeau', 'aerogaz', 'clim_filaire_simple', 'clim_filaire_groupe',
      'Comptage_Froid', 'Comptage_Eclairage', 'eclairage'
    ];

    const refFields = [
      'ref_aeroeau', 'ref_aerogaz', 'ref_clim_ir', 'ref_clim_filaire_simple',
      'ref_clim_filaire_groupe', 'ref_rooftop', 'ref_Comptage_Froid',
      'ref_Comptage_Eclairage', 'ref_eclairage', 'ref_sondes',
      'ref_sondesPresentes', 'ref_gazCompteur', 'ref_Izit'
    ];

    const updateFields = [];
    const updateValues = [];

    // Process numeric fields
    validFields.forEach(field => {
      if (gtbData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(parseInt(gtbData[field]) || 0);
      }
    });

    // Process reference fields (convert to JSON)
    refFields.forEach(field => {
      if (gtbData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        const refs = Array.isArray(gtbData[field]) ? gtbData[field] : [];
        updateValues.push(JSON.stringify(refs));
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to save' });
    }

    // Upsert GTB configuration
    const insertFields = ['site_id', ...updateFields.map(f => f.split(' = ')[0])];
    const insertValues = [siteId, ...updateValues];
    const insertPlaceholders = insertValues.map(() => '?').join(', ');

    await db.execute(`
      INSERT INTO gtb_site_config (${insertFields.join(', ')})
      VALUES (${insertPlaceholders})
      ON DUPLICATE KEY UPDATE ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    `, [...insertValues, ...updateValues]);

    res.status(200).json({
      success: true,
      message: `✅ GTB configuration saved for site: ${site}`
    });

  } catch (err) {
    console.error('❌ Error saving GTB config:', err);
    res.status(500).json({ error: 'GTB save failed', details: err.message });
  }
});

// Legacy compatibility endpoint
app.get('/form_sql/:site', async (req, res) => {
  const site = req.params.site;

  try {
    const [siteRows] = await db.execute('SELECT id FROM sites WHERE site_name = ?', [site]);

    if (siteRows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const siteId = siteRows[0].id;
    const legacyData = await transformToLegacyFormat(siteId);

    res.json(legacyData);
  } catch (err) {
    console.error('❌ Error fetching site data:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Position update endpoint
app.put('/update-position', async (req, res) => {
  const { site, id, x, y } = req.body;

  try {
    const [siteRows] = await db.execute('SELECT id FROM sites WHERE site_name = ?', [site]);
    if (siteRows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const siteId = siteRows[0].id;

    // Update position in equipment_configs (assuming AERO category for now)
    await db.execute(`
      UPDATE equipment_configs
      SET pos_x = ?, pos_y = ?
      WHERE site_id = ? AND category_id = (SELECT id FROM equipment_categories WHERE category_code = 'AERO')
    `, [x, y, siteId]);

    res.json({ success: true, message: 'Position updated' });
  } catch (err) {
    console.error('❌ Error updating position:', err);
    res.status(500).json({ error: 'Position update failed' });
  }
});

// ===============================================
// 🖼️ IMAGE AND EQUIPMENT ROUTES
// ===============================================
app.use('/images', imageRoutes);
app.use('/api/equipment', equipmentRoutes);

// ===============================================
// 🚀 SERVER STARTUP
// ===============================================
const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ Using NEW NORMALIZED DATABASE SCHEMA`);
  console.log(`📊 Backward compatible with existing frontend`);
});

export default app;