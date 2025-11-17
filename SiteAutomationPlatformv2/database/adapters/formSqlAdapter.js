/**
 * Form SQL Adapter
 * Converts between flat form_sql structure and normalized tables
 * Ensures backward compatibility with existing frontend code
 */

import equipmentDAL from '../dal/equipmentDAL.js';
import { db } from '../../src/config/database.js';
import logger from '../utils/logger.js';

class FormSqlAdapter {
  /**
   * Convert normalized structure to flat form_sql format
   * This maintains backward compatibility with existing frontend
   */
  async convertToFlatStructure(siteName) {
    const timer = logger.startTimer();

    try {
      logger.logConversion('toFlat', siteName);

      // Get site basic info
      const [siteInfo] = await db.execute(
        'SELECT * FROM sites WHERE site_name = ?',
        [siteName]
      );

      // Get all equipment data from normalized tables (now returns zone-suffixed flat data)
      const aeroData = await equipmentDAL.getAerothermeData(siteName);
      const rooftopData = await equipmentDAL.getRooftopData(siteName);
      const climateData = await equipmentDAL.getClimateData(siteName);
      const lightingData = await equipmentDAL.getLightingData(siteName);

      // Build flat object matching zone-suffixed format
      const flatData = {
        // Site info (map to old column names)
        site: siteInfo[0]?.site_name || siteName,
        client: siteInfo[0]?.client_name || null,
        address: siteInfo[0]?.address || null,
        number1: siteInfo[0]?.phone_primary || null,
        number2: siteInfo[0]?.phone_secondary || null,
        email: siteInfo[0]?.email || null,
        submitted_at: siteInfo[0]?.created_at || null,

        // Equipment data (already zone-suffixed from DAL)
        ...aeroData,
        ...rooftopData,
        ...climateData,
        ...lightingData
      };

      const duration = logger.endTimer(timer);
      const fieldCount = Object.keys(flatData).length;
      logger.logSuccess('CONVERT', 'normalized_to_flat', siteName, {
        fields_generated: fieldCount
      });
      logger.logPerformance('convertToFlatStructure', siteName, duration, { fields: fieldCount });

      return flatData;
    } catch (error) {
      logger.logError('CONVERT', 'normalized_to_flat', siteName, error);
      throw error;
    }
  }

  /**
   * Convert brands array to flat structure
   */
  flattenBrands(brands, prefix) {
    const result = {};
    for (let i = 0; i < 10; i++) {
      const brand = brands.find(b => b.brand_index === i);
      result[`${prefix}_${i}`] = brand ? brand.brand_name : null;
    }
    return result;
  }

  /**
   * Convert climate references array to flat structure
   */
  flattenClimateReferences(refs) {
    const result = {};

    // IR references
    for (let i = 0; i < 10; i++) {
      const ref = refs.find(r => r.ref_type === 'clim_ir' && r.ref_index === i);
      result[`clim_ir_ref_${i}`] = ref ? ref.ref_value : null;
    }

    // Wire references
    for (let i = 0; i < 10; i++) {
      const ref = refs.find(r => r.ref_type === 'clim_wire' && r.ref_index === i);
      result[`clim_wire_ref_${i}`] = ref ? ref.ref_value : null;
    }

    return result;
  }

  /**
   * Save data to normalized tables (from flat structure)
   */
  async saveFromFlatStructure(flatData) {
    const siteName = flatData.site;

    if (!siteName) {
      throw new Error('Site name is required');
    }

    try {
      // Save to all equipment tables
      await Promise.all([
        equipmentDAL.saveAerothermeData(siteName, flatData),
        equipmentDAL.saveRooftopData(siteName, flatData),
        equipmentDAL.saveClimateData(siteName, flatData),
        equipmentDAL.saveLightingData(siteName, flatData)
      ]);

      return { success: true, message: 'Data saved to normalized tables' };
    } catch (error) {
      console.error('Error saving from flat structure:', error);
      throw error;
    }
  }

  /**
   * Save data to normalized tables ONLY (no more form_sql)
   * Legacy dual-write removed - fully migrated to normalized structure
   */
  async saveToBothStructures(flatData) {
    const siteName = flatData.site;
    const timer = logger.startTimer();

    if (!siteName) {
      throw new Error('Site name is required');
    }

    try {
      logger.logConversion('fromFlat', siteName);

      // ✅ Save to normalized tables only (no more form_sql)
      await this.saveFromFlatStructure(flatData);

      const duration = logger.endTimer(timer);
      logger.logSuccess('SAVE', 'normalized_tables', siteName, {
        message: 'Data saved to normalized tables only'
      });
      logger.logPerformance('saveToNormalizedTables', siteName, duration);

      return { success: true, message: 'Data saved to normalized tables' };
    } catch (error) {
      logger.logError('SAVE', 'normalized_tables', siteName, error);
      throw error;
    }
  }

  /**
   * DEPRECATED - Legacy form_sql table no longer used
   * Keeping method for reference but it should not be called
   */
  async saveToFormSql(flatData) {
    console.warn('⚠️ saveToFormSql called but form_sql is deprecated - use normalized tables only');
    throw new Error('form_sql table is deprecated - use normalized tables');
  }
}

export default new FormSqlAdapter();
