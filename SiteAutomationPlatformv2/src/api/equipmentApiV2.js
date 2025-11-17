// ===============================================
// EQUIPMENT API V2 - PARALLEL ENDPOINTS
// Uses normalized schema: equipment_categories, equipment_configs, equipment_references
// ===============================================

import { API_BASE_URL } from './apiConfig.js';

// Fetch equipment data from v2 normalized schema
export const fetchEquipmentDataV2 = async (siteName) => {
  console.log(`📡 [V2] Fetching equipment data for site: ${siteName}`);

  try {
    const response = await fetch(`${API_BASE_URL}/v2/get-page2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ site: siteName }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ [V2] Equipment data received:`, data);
    return data;
  } catch (error) {
    console.error(`❌ [V2] Failed to fetch equipment data:`, error);
    throw error;
  }
};

// Save equipment data to v2 normalized schema
export const saveEquipmentDataV2 = async (siteName, equipmentData) => {
  console.log(`💾 [V2] Saving equipment data for site: ${siteName}`);

  try {
    const response = await fetch(`${API_BASE_URL}/v2/save_page2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        site: siteName,
        ...equipmentData
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ [V2] Equipment data saved successfully:`, result);
    return result;
  } catch (error) {
    console.error(`❌ [V2] Failed to save equipment data:`, error);
    throw error;
  }
};

// Fetch equipment categories from normalized schema
export const fetchEquipmentCategoriesV2 = async () => {
  console.log(`📋 [V2] Fetching equipment categories`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/equipment/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const categories = await response.json();
    console.log(`✅ [V2] Equipment categories received:`, categories);
    return categories;
  } catch (error) {
    console.error(`❌ [V2] Failed to fetch equipment categories:`, error);
    throw error;
  }
};

// Fetch equipment references for a site
export const fetchEquipmentReferencesV2 = async (siteName) => {
  console.log(`🔧 [V2] Fetching equipment references for site: ${siteName}`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/equipment/references`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ site: siteName }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const references = await response.json();
    console.log(`✅ [V2] Equipment references received:`, references);
    return references;
  } catch (error) {
    console.error(`❌ [V2] Failed to fetch equipment references:`, error);
    throw error;
  }
};

// Hybrid API function - tries v2 first, fallback to v1
export const fetchEquipmentDataHybrid = async (siteName) => {
  console.log(`🔄 [HYBRID] Attempting parallel load for site: ${siteName}`);

  try {
    // Try v2 parallel endpoint first
    const v2Data = await fetchEquipmentDataV2(siteName);
    console.log(`✅ [HYBRID] Successfully loaded from v2 normalized schema`);
    return {
      data: v2Data,
      source: 'v2_normalized',
      schema: 'equipment_configs'
    };
  } catch (v2Error) {
    console.warn(`⚠️ [HYBRID] V2 failed, falling back to v1:`, v2Error.message);

    try {
      // Fallback to original API
      const { fetchSiteForm2Data } = await import('./formDataApi');
      const v1Data = await fetchSiteForm2Data(siteName);
      console.log(`✅ [HYBRID] Successfully loaded from v1 legacy schema`);
      return {
        data: v1Data,
        source: 'v1_legacy',
        schema: 'form_sql'
      };
    } catch (v1Error) {
      console.error(`❌ [HYBRID] Both v2 and v1 failed:`, { v2Error, v1Error });
      throw new Error(`Failed to load equipment data from both v2 and v1 APIs`);
    }
  }
};

// Save with hybrid approach - save to both schemas for safety
export const saveEquipmentDataHybrid = async (siteName, equipmentData) => {
  console.log(`💾 [HYBRID] Dual-save equipment data for site: ${siteName}`);

  const results = {
    v2_success: false,
    v1_success: false,
    errors: []
  };

  // Try v2 first
  try {
    await saveEquipmentDataV2(siteName, equipmentData);
    results.v2_success = true;
    console.log(`✅ [HYBRID] V2 save successful`);
  } catch (v2Error) {
    console.warn(`⚠️ [HYBRID] V2 save failed:`, v2Error.message);
    results.errors.push({ source: 'v2', error: v2Error.message });
  }

  // Try v1 for compatibility
  try {
    const { submitForm2 } = await import('./formDataApi');
    await submitForm2({
      site: siteName,
      ...equipmentData
    });
    results.v1_success = true;
    console.log(`✅ [HYBRID] V1 save successful`);
  } catch (v1Error) {
    console.warn(`⚠️ [HYBRID] V1 save failed:`, v1Error.message);
    results.errors.push({ source: 'v1', error: v1Error.message });
  }

  // Require at least one success
  if (!results.v2_success && !results.v1_success) {
    throw new Error(`Failed to save to both v2 and v1 schemas: ${JSON.stringify(results.errors)}`);
  }

  console.log(`🎉 [HYBRID] Save completed:`, results);
  return results;
};

export default {
  fetchEquipmentDataV2,
  saveEquipmentDataV2,
  fetchEquipmentCategoriesV2,
  fetchEquipmentReferencesV2,
  fetchEquipmentDataHybrid,
  saveEquipmentDataHybrid
};