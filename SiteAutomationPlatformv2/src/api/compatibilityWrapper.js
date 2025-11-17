// ===============================================
// BACKWARD COMPATIBILITY WRAPPER
// Allows existing frontend code to work with new normalized API
// Gradually migrate to equipmentDataApi.js for better performance
// ===============================================

import { fetchEquipmentData, saveEquipmentData } from './equipmentDataApi.js';

// 🔄 LEGACY API WRAPPER - keeps existing code working
export const submitForm2 = async (payload) => {
  try {
    const { site, ...equipmentData } = payload;

    console.log('🔄 [COMPATIBILITY] Legacy submitForm2 called, converting to normalized API');

    // Use the new normalized API
    const result = await saveEquipmentData(site, equipmentData);

    // Return legacy format response
    return {
      message: '✅ Données mises à jour',
      affectedRows: result.configs_saved || 1
    };
  } catch (error) {
    console.error('❌ Compatibility wrapper error (submitForm2):', error);
    throw error;
  }
};

export const fetchSiteForm2Data = async (site) => {
  try {
    console.log('🔄 [COMPATIBILITY] Legacy fetchSiteForm2Data called, converting to normalized API');

    // Use the new normalized API
    const normalizedData = await fetchEquipmentData(site);

    console.log('📦 [COMPATIBILITY] Converted data:', normalizedData);
    return normalizedData;
  } catch (error) {
    console.error('❌ Compatibility wrapper error (fetchSiteForm2Data):', error);
    throw error;
  }
};

// 📊 Enhanced logging for migration tracking
export const logAPIUsage = (functionName, site) => {
  console.log(`📈 [API_USAGE] ${functionName} called for site: ${site} | Time: ${new Date().toISOString()}`);
};