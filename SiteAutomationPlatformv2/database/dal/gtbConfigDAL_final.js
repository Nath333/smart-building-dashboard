// =====================================================
// GTB Configuration Data Access Layer - FINAL (JSON-Based)
// =====================================================
// Purpose: Clean, efficient GTB storage using MySQL JSON
// Features:
//   - Single source of truth (JSON columns)
//   - Izit cabinet-to-ref mapping preserved
//   - No redundant storage
//   - Devis-aware (complete isolation)
// Date: 2025-10-16
// =====================================================

import db from '../../src/config/database.js';

/**
 * GTB Configuration DAL - Final Version (JSON-Optimized)
 * Uses MySQL JSON columns for efficient,  clean storage
 */
class GtbConfigDAL_Final {
  // =====================================================
  // READ OPERATIONS
  // =====================================================

  /**
   * Get complete GTB configuration for a site + devis
   * @param {string} siteName - Site identifier
   * @param {string} devisName - Devis identifier (default: 'Devis Principal')
   * @returns {Promise<Object>} - GTB configuration (frontend format)
   */
  async getGtbConfig(siteName, devisName = 'Devis Principal') {
    try {
      console.log(`📥 [GTB DAL Final] Fetching GTB config for site: ${siteName}, devis: ${devisName}`);

      // 1️⃣ Get modules with JSON refs
      const [moduleRows] = await db.execute(
        `SELECT module_type, quantity, references
         FROM gtb_modules
         WHERE site_name = ? AND devis_name = ?`,
        [siteName, devisName]
      );

      // 2️⃣ Get sensors with JSON refs
      const [sensorRows] = await db.execute(
        `SELECT sondes_count, sondes_refs,
                sondes_presentes_count, sondes_presentes_refs,
                gaz_compteur, gaz_compteur_ref,
                izit_cabinets
         FROM gtb_sensors
         WHERE site_name = ? AND devis_name = ?`,
        [siteName, devisName]
      );

      if (moduleRows.length === 0 && sensorRows.length === 0) {
        console.log(`ℹ️ [GTB DAL Final] No GTB config found for site: ${siteName}, devis: ${devisName}`);
        return null;
      }

      // 3️⃣ Transform to frontend format
      const flatData = this._convertToFlatStructure(moduleRows, sensorRows);
      flatData.site = siteName;
      flatData.devis_name = devisName;

      console.log(`✅ [GTB DAL Final] Retrieved GTB config for ${siteName}, devis: ${devisName}`);
      return flatData;
    } catch (error) {
      console.error('❌ [GTB DAL Final] Error fetching GTB config:', error);
      throw error;
    }
  }

  /**
   * Check if site has GTB configuration for a specific devis
   * @param {string} siteName - Site identifier
   * @param {string} devisName - Devis identifier
   * @returns {Promise<boolean>}
   */
  async hasGtbConfig(siteName, devisName = 'Devis Principal') {
    try {
      const [moduleRows] = await db.execute(
        'SELECT COUNT(*) as count FROM gtb_modules WHERE site_name = ? AND devis_name = ?',
        [siteName, devisName]
      );

      const [sensorRows] = await db.execute(
        'SELECT COUNT(*) as count FROM gtb_sensors WHERE site_name = ? AND devis_name = ?',
        [siteName, devisName]
      );

      return (moduleRows[0].count > 0) || (sensorRows[0].count > 0);
    } catch (error) {
      console.error('❌ [GTB DAL Final] Error checking GTB config:', error);
      throw error;
    }
  }

  // =====================================================
  // WRITE OPERATIONS
  // =====================================================

  /**
   * Save complete GTB configuration for a site + devis
   * @param {string} siteName - Site identifier
   * @param {string} devisName - Devis identifier
   * @param {Object} gtbData - GTB configuration data (frontend format)
   * @returns {Promise<Object>} - Result summary
   */
  async saveGtbConfig(siteName, devisName = 'Devis Principal', gtbData) {
    const connection = await db.getConnection();

    try {
      console.log(`💾 [GTB DAL Final] Saving GTB config for site: ${siteName}, devis: ${devisName}`);
      await connection.beginTransaction();

      // ✅ Ensure site exists
      const [siteRows] = await connection.execute(
        'SELECT site_name FROM sites WHERE site_name = ?',
        [siteName]
      );

      if (siteRows.length === 0) {
        console.log(`ℹ️ [GTB DAL Final] Creating site entry for: ${siteName}`);
        await connection.execute(
          'INSERT INTO sites (site_name) VALUES (?)',
          [siteName]
        );
      }

      const result = {
        site: siteName,
        devis: devisName,
        modulesProcessed: 0,
        sensorsProcessed: false
      };

      // 1️⃣ DELETE old data (devis-specific)
      await connection.execute(
        'DELETE FROM gtb_modules WHERE site_name = ? AND devis_name = ?',
        [siteName, devisName]
      );
      await connection.execute(
        'DELETE FROM gtb_sensors WHERE site_name = ? AND devis_name = ?',
        [siteName, devisName]
      );

      // Module type mappings
      const moduleMap = {
        'aeroeau': 'aeroeau',
        'aerogaz': 'aerogaz',
        'clim ir': 'clim_ir',
        'clim_ir': 'clim_ir',
        'clim filaire simple': 'clim_filaire_simple',
        'clim_filaire_simple': 'clim_filaire_simple',
        'clim filaire groupe': 'clim_filaire_groupe',
        'clim_filaire_groupe': 'clim_filaire_groupe',
        'rooftop': 'rooftop',
        'Comptage Froid': 'Comptage_Froid',
        'Comptage_Froid': 'Comptage_Froid',
        'Comptage Eclairage': 'Comptage_Eclairage',
        'Comptage_Eclairage': 'Comptage_Eclairage',
        'eclairage': 'eclairage'
      };

      // 2️⃣ SAVE modules with JSON refs
      const modulesToSave = gtbData.modules || [];

      for (const moduleKey of modulesToSave) {
        const dbKey = moduleMap[moduleKey] || moduleKey;
        const quantity = gtbData[moduleKey] || gtbData[dbKey] || 0;
        const refs = gtbData.refs?.[moduleKey] || gtbData.refs?.[dbKey] || [];

        if (quantity > 0) {
          await connection.execute(
            `INSERT INTO gtb_modules
             (site_name, devis_name, module_type, quantity, references)
             VALUES (?, ?, ?, ?, ?)`,
            [siteName, devisName, dbKey, quantity, JSON.stringify(refs)]
          );

          result.modulesProcessed++;
        }
      }

      // 3️⃣ SAVE sensors with JSON refs + Izit mapping
      const hasAnySensors = (gtbData.sondes && gtbData.sondes > 0) ||
                           (gtbData.sondesPresentes && gtbData.sondesPresentes > 0) ||
                           (gtbData.gazCompteur === 'oui') ||
                           (Array.isArray(gtbData.Izit) && gtbData.Izit.length > 0);

      if (hasAnySensors) {
        // Build Izit cabinet mapping
        const izitCabinets = {};
        if (Array.isArray(gtbData.Izit) && gtbData.Izit.length > 0) {
          gtbData.Izit.forEach((cabinetType, index) => {
            const ref = gtbData.refs?.Izit?.[index] || '';
            izitCabinets[cabinetType] = ref;
          });
        }

        await connection.execute(
          `INSERT INTO gtb_sensors
           (site_name, devis_name,
            sondes_count, sondes_refs,
            sondes_presentes_count, sondes_presentes_refs,
            gaz_compteur, gaz_compteur_ref,
            izit_cabinets)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            siteName,
            devisName,
            parseInt(gtbData.sondes) || 0,
            JSON.stringify(gtbData.refs?.sondes || []),
            parseInt(gtbData.sondesPresentes) || 0,
            JSON.stringify(gtbData.refs?.sondesPresentes || []),
            gtbData.gazCompteur === 'oui' ? 1 : 0,
            gtbData.refs?.gazCompteur?.[0] || null,
            JSON.stringify(izitCabinets)
          ]
        );

        result.sensorsProcessed = true;
      }

      await connection.commit();
      console.log(`✅ [GTB DAL Final] Saved GTB config for ${siteName}, devis: ${devisName}:`, result);

      return result;
    } catch (error) {
      await connection.rollback();
      console.error('❌ [GTB DAL Final] Error saving GTB config:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete GTB configuration for a site + devis
   * @param {string} siteName - Site identifier
   * @param {string} devisName - Devis identifier (optional, deletes ALL if not provided)
   * @returns {Promise<number>} - Number of records deleted
   */
  async deleteGtbConfig(siteName, devisName = null) {
    const connection = await db.getConnection();

    try {
      const logMsg = devisName
        ? `🗑️ [GTB DAL Final] Deleting GTB config for site: ${siteName}, devis: ${devisName}`
        : `🗑️ [GTB DAL Final] Deleting ALL GTB configs for site: ${siteName}`;
      console.log(logMsg);

      await connection.beginTransaction();

      const whereClause = devisName
        ? 'WHERE site_name = ? AND devis_name = ?'
        : 'WHERE site_name = ?';
      const params = devisName ? [siteName, devisName] : [siteName];

      const [moduleResult] = await connection.execute(
        `DELETE FROM gtb_modules ${whereClause}`,
        params
      );

      const [sensorResult] = await connection.execute(
        `DELETE FROM gtb_sensors ${whereClause}`,
        params
      );

      await connection.commit();

      const totalDeleted = moduleResult.affectedRows + sensorResult.affectedRows;
      console.log(`✅ [GTB DAL Final] Deleted ${totalDeleted} records for ${siteName}`);

      return totalDeleted;
    } catch (error) {
      await connection.rollback();
      console.error('❌ [GTB DAL Final] Error deleting GTB config:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Convert database rows to frontend format
   * @private
   */
  _convertToFlatStructure(moduleRows, sensorRows) {
    const flatData = {
      modules: [],
      refs: {}
    };

    // Process modules (parse JSON refs)
    moduleRows.forEach(row => {
      flatData.modules.push(row.module_type);
      flatData[row.module_type] = row.quantity;

      // Parse JSON references
      try {
        const refs = JSON.parse(row.references || '[]');
        flatData.refs[row.module_type] = Array.isArray(refs) ? refs : [];
      } catch (error) {
        console.error(`⚠️ [GTB DAL Final] Error parsing refs for ${row.module_type}:`, error);
        flatData.refs[row.module_type] = [];
      }
    });

    // Process sensors (parse JSON refs)
    if (sensorRows && sensorRows.length > 0) {
      const sensors = sensorRows[0];

      flatData.sondes = sensors.sondes_count || 0;
      flatData.sondesPresentes = sensors.sondes_presentes_count || 0;
      flatData.gazCompteur = sensors.gaz_compteur ? 'oui' : 'non';

      // Parse sensor JSON refs
      try {
        flatData.refs.sondes = JSON.parse(sensors.sondes_refs || '[]');
        flatData.refs.sondesPresentes = JSON.parse(sensors.sondes_presentes_refs || '[]');

        if (sensors.gaz_compteur_ref) {
          flatData.refs.gazCompteur = [sensors.gaz_compteur_ref];
        }

        // ✅ Reconstruct Izit cabinet types and refs (preserving order)
        const izitCabinets = JSON.parse(sensors.izit_cabinets || '{}');
        if (Object.keys(izitCabinets).length > 0) {
          flatData.Izit = Object.keys(izitCabinets);  // Array of cabinet types
          flatData.refs.Izit = Object.values(izitCabinets);  // Array of refs (same order)
        } else {
          flatData.Izit = [];
          flatData.refs.Izit = [];
        }
      } catch (error) {
        console.error('⚠️ [GTB DAL Final] Error parsing sensor JSON:', error);
        flatData.refs.sondes = [];
        flatData.refs.sondesPresentes = [];
        flatData.Izit = [];
        flatData.refs.Izit = [];
      }
    }

    return flatData;
  }

  /**
   * Validate GTB data structure
   * @private
   */
  _validateGtbData(gtbData) {
    if (!gtbData || typeof gtbData !== 'object') {
      throw new Error('Invalid GTB data: must be an object');
    }

    // Validate modules array
    if (gtbData.modules && !Array.isArray(gtbData.modules)) {
      throw new Error('Invalid GTB data: modules must be an array');
    }

    // Validate refs object
    if (gtbData.refs && typeof gtbData.refs !== 'object') {
      throw new Error('Invalid GTB data: refs must be an object');
    }

    // Validate Izit structure (special case)
    if (gtbData.Izit) {
      if (!Array.isArray(gtbData.Izit)) {
        throw new Error('Invalid GTB data: Izit must be an array of cabinet types');
      }

      // Validate Izit refs match cabinet types
      if (gtbData.refs?.Izit && gtbData.Izit.length !== gtbData.refs.Izit.length) {
        console.warn(`⚠️ [GTB DAL Final] Izit mismatch: ${gtbData.Izit.length} cabinets but ${gtbData.refs.Izit.length} refs`);
      }
    }

    return true;
  }
}

// Export singleton instance
export default new GtbConfigDAL_Final();
