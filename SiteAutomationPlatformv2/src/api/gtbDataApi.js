// ===============================================
// GTB DATA API - NORMALIZED DATABASE
// Parallel structure to equipmentDataApi.js
// Works with normalized GTB database schema
// ===============================================

import { API_BASE_URL } from './apiConfig.js';

// 🎯 GTB module category mapping for new schema
const GTB_CATEGORY_MAPPING = {
  'aeroeau': 'AERO_EAU',
  'aerogaz': 'AERO_GAZ',
  'clim_ir': 'CLIM_IR',
  'clim_filaire_simple': 'CLIM_FILAIRE_SIMPLE',
  'clim_filaire_groupe': 'CLIM_FILAIRE_GROUPE',
  'rooftop': 'ROOFTOP',
  'Comptage_Froid': 'COMPTAGE_FROID',
  'Comptage_Eclairage': 'COMPTAGE_ECLAIRAGE',
  'eclairage': 'ECLAIRAGE'
};

// 📡 Fetch GTB data for a site (NEW NORMALIZED APPROACH)
export const fetchGtbData = async (siteName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gtb/get-by-site`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: siteName })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform normalized data back to expected frontend format
    return transformGtbToLegacyFormat(data);
  } catch (error) {
    console.error('❌ Error fetching GTB data:', error);
    throw error;
  }
};

// 📤 Save GTB data (NEW NORMALIZED APPROACH)
export const saveGtbData = async (siteName, gtbData) => {
  try {
    // Transform legacy format to normalized structure
    const normalizedData = transformGtbFromLegacyFormat(siteName, gtbData);

    const response = await fetch(`${API_BASE_URL}/api/gtb/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error saving GTB data:', error);
    throw error;
  }
};

// 🔄 Transform normalized GTB DB data to legacy frontend format
const transformGtbToLegacyFormat = (normalizedData) => {
  const legacy = {};

  // Handle GTB module configurations
  if (normalizedData?.gtb_configs) {
    normalizedData.gtb_configs.forEach(config => {
      const categoryCode = config.category_code;

      // Map back to legacy field names
      switch (categoryCode) {
        case 'AERO_EAU':
          legacy.aeroeau = config.quantity || 0;
          if (config.references) {
            legacy.ref_aeroeau = config.references.map(ref => ref.reference_code);
          }
          break;

        case 'AERO_GAZ':
          legacy.aerogaz = config.quantity || 0;
          if (config.references) {
            legacy.ref_aerogaz = config.references.map(ref => ref.reference_code);
          }
          break;

        case 'CLIM_IR':
          legacy.clim_ir = config.quantity || 0;
          if (config.references) {
            legacy.ref_clim_ir = config.references.map(ref => ref.reference_code);
          }
          break;

        case 'CLIM_FILAIRE_SIMPLE':
          legacy.clim_filaire_simple = config.quantity || 0;
          if (config.references) {
            legacy.ref_clim_filaire_simple = config.references.map(ref => ref.reference_code);
          }
          break;

        case 'CLIM_FILAIRE_GROUPE':
          legacy.clim_filaire_groupe = config.quantity || 0;
          if (config.references) {
            legacy.ref_clim_filaire_groupe = config.references.map(ref => ref.reference_code);
          }
          break;

        case 'ROOFTOP':
          legacy.rooftop = config.quantity || 0;
          if (config.references) {
            legacy.ref_rooftop = config.references.map(ref => ref.reference_code);
          }
          break;

        case 'COMPTAGE_FROID':
          legacy.Comptage_Froid = config.quantity || 0;
          if (config.references) {
            legacy.ref_Comptage_Froid = config.references.map(ref => ref.reference_code);
          }
          break;

        case 'COMPTAGE_ECLAIRAGE':
          legacy.Comptage_Eclairage = config.quantity || 0;
          if (config.references) {
            legacy.ref_Comptage_Eclairage = config.references.map(ref => ref.reference_code);
          }
          break;

        case 'ECLAIRAGE':
          legacy.eclairage = config.quantity || 0;
          if (config.references) {
            legacy.ref_eclairage = config.references.map(ref => ref.reference_code);
          }
          break;
      }
    });

    // Collect all modules for the modules array
    const modules = normalizedData.gtb_configs
      .map(config => getModuleNameFromCategory(config.category_code))
      .filter(Boolean);

    if (modules.length > 0) {
      legacy.modules = modules;
    }
  }

  // Handle special configurations
  if (normalizedData?.special_config) {
    const special = normalizedData.special_config;

    legacy.sondes = special.sondes_temperature || 0;
    legacy.sondesPresentes = special.sondes_presence || 0;
    legacy.gazCompteur = special.gas_meter_enabled ? 'oui' : 'non';

    if (special.izit_coffrets && special.izit_coffrets.length > 0) {
      legacy.Izit = special.izit_coffrets;
    }

    // Set special refs
    if (legacy.sondes > 0) {
      legacy.ref_sondes = Array(legacy.sondes).fill('pi33');
    }
    if (legacy.sondesPresentes > 0) {
      legacy.ref_sondesPresentes = Array(legacy.sondesPresentes).fill('wt101');
    }
    if (special.gas_meter_enabled) {
      legacy.ref_gazCompteur = ['gaz 34325'];
    }
    if (legacy.Izit && legacy.Izit.length > 0) {
      legacy.ref_Izit = legacy.Izit.map(coffret => getIzitRef(coffret));
    }
  }

  // Build refs object for compatibility
  legacy.refs = {};
  Object.keys(legacy).forEach(key => {
    if (key.startsWith('ref_')) {
      const refName = key.replace('ref_', '');
      legacy.refs[refName] = legacy[key];
    }
  });

  return legacy;
};

// 🔄 Transform legacy GTB frontend format to normalized DB structure
const transformGtbFromLegacyFormat = (siteName, legacyData) => {
  const normalized = {
    site_name: siteName,
    gtb_configs: [],
    special_config: {}
  };

  // Transform GTB module configurations
  Object.entries(GTB_CATEGORY_MAPPING).forEach(([legacyField, categoryCode]) => {
    const quantity = parseInt(legacyData[legacyField]) || 0;

    if (quantity > 0) {
      const references = [];
      const refField = `ref_${legacyField}`;

      // Extract references
      if (legacyData.refs && legacyData.refs[legacyField]) {
        const refArray = Array.isArray(legacyData.refs[legacyField])
          ? legacyData.refs[legacyField]
          : legacyData.refs[legacyField].split(',');

        refArray.forEach((ref, index) => {
          if (ref && ref.trim()) {
            references.push({
              reference_code: ref.trim(),
              reference_name: ref.trim(),
              position_index: index,
              is_active: true
            });
          }
        });
      } else if (legacyData[refField]) {
        const refArray = Array.isArray(legacyData[refField])
          ? legacyData[refField]
          : legacyData[refField].split(',');

        refArray.forEach((ref, index) => {
          if (ref && ref.trim()) {
            references.push({
              reference_code: ref.trim(),
              reference_name: ref.trim(),
              position_index: index,
              is_active: true
            });
          }
        });
      }

      normalized.gtb_configs.push({
        category_code: categoryCode,
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
    normalized.special_config.sondes_temperature = parseInt(legacyData.sondes) || 0;
  }

  if (legacyData.sondesPresentes) {
    normalized.special_config.sondes_presence = parseInt(legacyData.sondesPresentes) || 0;
  }

  if (legacyData.gazCompteur) {
    normalized.special_config.gas_meter_enabled = legacyData.gazCompteur === 'oui';
  }

  if (legacyData.Izit) {
    normalized.special_config.izit_coffrets = Array.isArray(legacyData.Izit)
      ? legacyData.Izit
      : legacyData.Izit.split(',').map(i => i.trim());
  }

  if (legacyData.modules) {
    normalized.special_config.special_modules = Array.isArray(legacyData.modules)
      ? legacyData.modules
      : legacyData.modules.split(',').map(m => m.trim());
  }

  return normalized;
};

// 🔧 Helper function to get module name from category code
const getModuleNameFromCategory = (categoryCode) => {
  const mapping = {
    'AERO_EAU': 'aeroeau',
    'AERO_GAZ': 'aerogaz',
    'CLIM_IR': 'clim_ir',
    'CLIM_FILAIRE_SIMPLE': 'clim_filaire_simple',
    'CLIM_FILAIRE_GROUPE': 'clim_filaire_groupe',
    'ROOFTOP': 'rooftop',
    'COMPTAGE_FROID': 'Comptage_Froid',
    'COMPTAGE_ECLAIRAGE': 'Comptage_Eclairage',
    'ECLAIRAGE': 'eclairage'
  };
  return mapping[categoryCode];
};

// 🔧 Helper function to get Izit reference
const getIzitRef = (coffretType) => {
  const refs = {
    'coffret gtb(asp/do12/routeur/ug65)': '234543FRR',
    'coffret gtb(asb/routeur/ug65)': '3434',
    'isma': '55'
  };
  return refs[coffretType] || coffretType;
};

// 📊 Get GTB summary for a site
export const getGtbSummary = async (siteName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gtb/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: siteName })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching GTB summary:', error);
    throw error;
  }
};

// 🏷️ Get all GTB module categories
export const getGtbCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gtb/categories`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching GTB categories:', error);
    throw error;
  }
};

// 🚀 OPTIMIZED API CALLS (using cached endpoints)
export const fetchGtbDataOptimized = async (siteName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/optimized/gtb/${siteName}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return transformGtbToLegacyFormat(data);
  } catch (error) {
    console.error('❌ Error fetching optimized GTB data:', error);
    throw error;
  }
};

export const saveGtbDataOptimized = async (siteName, gtbData) => {
  try {
    const normalizedData = transformGtbFromLegacyFormat(siteName, gtbData);

    const response = await fetch(`${API_BASE_URL}/optimized/gtb/${siteName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error saving optimized GTB data:', error);
    throw error;
  }
};

// 🔄 BACKWARD COMPATIBILITY WRAPPER
// These functions maintain the existing API interface for GtbConfigPage
export const fetchGtbForm3Data = fetchGtbData;
export const submitGtbForm3 = saveGtbData;

// Legacy function names for compatibility
export const getPage3Data = fetchGtbData;
export const savePage3Data = saveGtbData;