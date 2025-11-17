// ===============================================
// IMPROVED EQUIPMENT DATA API
// Works with normalized database schema
// Maintains backward compatibility with existing frontend
// ===============================================

import { API_BASE_URL } from './apiConfig.js';

// 🎯 Equipment category mapping for new schema
const CATEGORY_MAPPING = {
  'Aero': 'AERO',
  'Clim': ['CLIM_IR', 'CLIM_WIRE'],
  'Rooftop': 'ROOFTOP',
  'Eclairage': 'LIGHTING'
};

// 📡 Fetch equipment data for a site (NEW NORMALIZED APPROACH)
export const fetchEquipmentData = async (siteName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/equipment/get-by-site`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: siteName })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform normalized data back to expected frontend format
    return transformToLegacyFormat(data);
  } catch (error) {
    console.error('❌ Error fetching equipment data:', error);
    throw error;
  }
};

// 📤 Save equipment data (NEW NORMALIZED APPROACH)
export const saveEquipmentData = async (siteName, equipmentData) => {
  try {
    // Transform legacy format to normalized structure
    const normalizedData = transformFromLegacyFormat(siteName, equipmentData);

    const response = await fetch(`${API_BASE_URL}/api/equipment/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error saving equipment data:', error);
    throw error;
  }
};

// 🔄 Transform normalized DB data to legacy frontend format
const transformToLegacyFormat = (normalizedData) => {
  const legacy = {};

  if (!normalizedData?.equipment_configs) return legacy;

  normalizedData.equipment_configs.forEach(config => {
    const categoryCode = config.category_code;

    // Map back to legacy field names
    switch (categoryCode) {
      case 'AERO':
        legacy.nb_aerotherme = config.quantity_total || 0;
        legacy.zone_aerotherme = Array.isArray(config.zones) ? config.zones.join(', ') : config.zones;
        legacy.type_aerotherme = Array.isArray(config.equipment_types) ? config.equipment_types.join(', ') : config.equipment_types;
        legacy.thermostat_aerotherme = config.has_thermostat ? 1 : 0;
        legacy.coffret_aerotherme = config.has_electrical_panel ? 1 : 0;
        legacy.coffret_horloge_aerotherme = config.has_timer ? 1 : 0;
        legacy.Fonctionement_aerotherme = config.operational_status || 'unknown';
        legacy.Maintenance_aerotherme = config.maintenance_status || 'unknown';
        legacy.commentaire_aero = config.comments;

        // Map equipment references back to legacy array format
        if (config.references) {
          config.references.forEach((ref, index) => {
            if (index < 10) {
              legacy[`marque_aerotherme_${index}`] = ref.reference_code || ref.brand_name;
            }
          });
        }
        break;

      case 'CLIM_IR':
        legacy.nb_clim_ir = config.quantity_total || 0;
        legacy.zone_clim = Array.isArray(config.zones) ? config.zones.join(', ') : config.zones;
        legacy.type_clim = Array.isArray(config.equipment_types) ? config.equipment_types.join(', ') : config.equipment_types;
        legacy.coffret_clim = config.has_electrical_panel ? 1 : 0;
        legacy.Fonctionement_clim = config.operational_status || 'unknown';
        legacy.Maintenance_clim = config.maintenance_status || 'unknown';
        legacy.commentaire_clim = config.comments;

        if (config.references) {
          config.references.forEach((ref, index) => {
            if (index < 10) {
              legacy[`clim_ir_ref_${index}`] = ref.reference_code || ref.brand_name;
            }
          });
        }
        break;

      case 'CLIM_WIRE':
        legacy.nb_clim_wire = config.quantity_total || 0;
        legacy.nb_telecommande_clim_wire = config.quantity_total || 0;

        if (config.references) {
          config.references.forEach((ref, index) => {
            if (index < 10) {
              legacy[`clim_wire_ref_${index}`] = ref.reference_code || ref.brand_name;
            }
          });
        }
        break;

      case 'ROOFTOP':
        legacy.nb_rooftop = config.quantity_total || 0;
        legacy.zone_rooftop = Array.isArray(config.zones) ? config.zones.join(', ') : config.zones;
        legacy.type_rooftop = Array.isArray(config.equipment_types) ? config.equipment_types.join(', ') : config.equipment_types;
        legacy.thermostat_rooftop = config.has_thermostat ? 1 : 0;
        legacy.telecomande_modbus_rooftop = config.has_modbus ? 1 : 0;
        legacy.coffret_rooftop = config.has_electrical_panel ? 1 : 0;
        legacy.Fonctionement_rooftop = config.operational_status || 'unknown';
        legacy.Maintenance_rooftop = config.maintenance_status || 'unknown';
        legacy.commentaire_rooftop = config.comments;

        if (config.references) {
          config.references.forEach((ref, index) => {
            if (index < 10) {
              legacy[`marque_rooftop_${index}`] = ref.reference_code || ref.brand_name;
            }
          });
        }
        break;

      case 'LIGHTING':
        legacy.Eclairage_interieur = config.quantity_total || 0;
        legacy.Eclairage_contacteur = config.has_electrical_panel ? 1 : 0;
        legacy.Eclairage_exterieur = config.technical_specs?.exterior_lights || 0;
        legacy.Eclairage_horloge = config.has_timer ? 1 : 0;
        legacy.commentaire_eclairage = config.comments;
        break;
    }
  });

  return legacy;
};

// 🔄 Transform legacy frontend format to normalized DB structure
const transformFromLegacyFormat = (siteName, legacyData) => {
  const normalized = {
    site_name: siteName,
    equipment_configs: []
  };

  // Transform Aero equipment
  if (legacyData.nb_aerotherme > 0 || legacyData.zone_aerotherme || legacyData.type_aerotherme) {
    const aeroConfig = {
      category_code: 'AERO',
      quantity_total: parseInt(legacyData.nb_aerotherme) || 0,
      zones: parseMultiSelectValue(legacyData.zone_aerotherme),
      equipment_types: parseMultiSelectValue(legacyData.type_aerotherme),
      has_thermostat: !!legacyData.thermostat_aerotherme,
      has_electrical_panel: !!legacyData.coffret_aerotherme,
      has_timer: !!legacyData.coffret_horloge_aerotherme,
      operational_status: legacyData.Fonctionement_aerotherme || 'unknown',
      maintenance_status: legacyData.Maintenance_aerotherme || 'unknown',
      comments: legacyData.commentaire_aero,
      references: []
    };

    // Extract references from legacy array format
    for (let i = 0; i < 10; i++) {
      const refValue = legacyData[`marque_aerotherme_${i}`];
      if (refValue && refValue.trim()) {
        aeroConfig.references.push({
          reference_code: refValue.trim(),
          position_index: i,
          is_active: true
        });
      }
    }

    normalized.equipment_configs.push(aeroConfig);
  }

  // Transform Clim IR equipment
  if (legacyData.nb_clim_ir > 0 || legacyData.zone_clim) {
    const climIrConfig = {
      category_code: 'CLIM_IR',
      quantity_total: parseInt(legacyData.nb_clim_ir) || 0,
      zones: parseMultiSelectValue(legacyData.zone_clim),
      equipment_types: parseMultiSelectValue(legacyData.type_clim),
      has_electrical_panel: !!legacyData.coffret_clim,
      operational_status: legacyData.Fonctionement_clim || 'unknown',
      maintenance_status: legacyData.Maintenance_clim || 'unknown',
      comments: legacyData.commentaire_clim,
      references: []
    };

    for (let i = 0; i < 10; i++) {
      const refValue = legacyData[`clim_ir_ref_${i}`];
      if (refValue && refValue.trim()) {
        climIrConfig.references.push({
          reference_code: refValue.trim(),
          position_index: i,
          is_active: true
        });
      }
    }

    normalized.equipment_configs.push(climIrConfig);
  }

  // Transform Clim Wire equipment
  if (legacyData.nb_clim_wire > 0) {
    const climWireConfig = {
      category_code: 'CLIM_WIRE',
      quantity_total: parseInt(legacyData.nb_clim_wire) || 0,
      zones: parseMultiSelectValue(legacyData.zone_clim),
      equipment_types: parseMultiSelectValue(legacyData.type_clim),
      has_electrical_panel: !!legacyData.coffret_clim,
      operational_status: legacyData.Fonctionement_clim || 'unknown',
      maintenance_status: legacyData.Maintenance_clim || 'unknown',
      comments: legacyData.commentaire_clim,
      references: []
    };

    for (let i = 0; i < 10; i++) {
      const refValue = legacyData[`clim_wire_ref_${i}`];
      if (refValue && refValue.trim()) {
        climWireConfig.references.push({
          reference_code: refValue.trim(),
          position_index: i,
          is_active: true
        });
      }
    }

    normalized.equipment_configs.push(climWireConfig);
  }

  // Transform Rooftop equipment
  if (legacyData.nb_rooftop > 0 || legacyData.zone_rooftop) {
    const rooftopConfig = {
      category_code: 'ROOFTOP',
      quantity_total: parseInt(legacyData.nb_rooftop) || 0,
      zones: parseMultiSelectValue(legacyData.zone_rooftop),
      equipment_types: parseMultiSelectValue(legacyData.type_rooftop),
      has_thermostat: !!legacyData.thermostat_rooftop,
      has_modbus: !!legacyData.telecomande_modbus_rooftop,
      has_electrical_panel: !!legacyData.coffret_rooftop,
      operational_status: legacyData.Fonctionement_rooftop || 'unknown',
      maintenance_status: legacyData.Maintenance_rooftop || 'unknown',
      comments: legacyData.commentaire_rooftop,
      references: []
    };

    for (let i = 0; i < 10; i++) {
      const refValue = legacyData[`marque_rooftop_${i}`];
      if (refValue && refValue.trim()) {
        rooftopConfig.references.push({
          reference_code: refValue.trim(),
          position_index: i,
          is_active: true
        });
      }
    }

    normalized.equipment_configs.push(rooftopConfig);
  }

  // Transform Lighting equipment
  if (legacyData.Eclairage_interieur || legacyData.Eclairage_exterieur) {
    const lightingConfig = {
      category_code: 'LIGHTING',
      quantity_total: parseInt(legacyData.Eclairage_interieur) || 0,
      has_electrical_panel: !!legacyData.Eclairage_contacteur,
      has_timer: !!legacyData.Eclairage_horloge,
      technical_specs: {
        exterior_lights: parseInt(legacyData.Eclairage_exterieur) || 0
      },
      comments: legacyData.commentaire_eclairage,
      references: []
    };

    normalized.equipment_configs.push(lightingConfig);
  }

  return normalized;
};

// 🔧 Utility function to parse multi-select values
const parseMultiSelectValue = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
  }
  return [];
};

// 📊 Get equipment summary for a site
export const getEquipmentSummary = async (siteName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/equipment/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: siteName })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching equipment summary:', error);
    throw error;
  }
};

// 🏷️ Get all equipment categories
export const getEquipmentCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/equipment/categories`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching equipment categories:', error);
    throw error;
  }
};

// 🔄 BACKWARD COMPATIBILITY WRAPPER
// These functions maintain the existing API interface
export const submitForm2 = saveEquipmentData;
export const fetchSiteForm2Data = fetchEquipmentData;