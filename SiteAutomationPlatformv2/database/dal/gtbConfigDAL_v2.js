// =====================================================
// GTB Configuration Data Access Layer (DAL) - V2 IMPROVED
// =====================================================
// Purpose: Clean abstraction for GTB module configuration
// Changes from V1:
//   - Single source of truth (gtb_module_references only)
//   - Removed redundant refs column in gtb_modules
//   - Devis-aware reference storage
//   - Centralized sensor storage (gtb_sensors table)
// Date: 2025-10-16
// =====================================================

import db from '../../src/config/database.js';

/**
 * GTB Configuration DAL - Version 2 (Improved)
 * Eliminates redundancy and adds proper devis isolation
 */
class GtbConfigDAL_V2 {
  // =====================================================
  // READ OPERATIONS
  // =====================================================

  /**
   * Get complete GTB configuration for a site + devis
   * @param {string} siteName - Site identifier
   * @param {string} devisName - Devis identifier (default: 'Devis Principal')
   * @returns {Promise<Object>} - GTB configuration in flat format (frontend compatible)
   */
  async getGtbConfig(siteName, devisName = 'Devis Principal') {
    try {
      console.log(`📥 [GTB DAL V2] Fetching GTB config for site: ${siteName}, devis: ${devisName}`);

      // 1️⃣ Get modules (quantity only, NO refs column)
      const [moduleRows] = await db.execute(
        `SELECT module_type, quantity
         FROM gtb_modules
         WHERE site_name = ? AND devis_name = ?`,
        [siteName, devisName]
      );

      if (moduleRows.length === 0) {
        console.log(`ℹ️ [GTB DAL V2] No GTB config found for site: ${siteName}, devis: ${devisName}`);
        return null;
      }

      // 2️⃣ Get references (devis-aware, single source of truth)
      const [refRows] = await db.execute(
        `SELECT module_type, ref_index, ref_value
         FROM gtb_module_references
         WHERE site_name = ? AND devis_name = ?
         ORDER BY module_type, ref_index`,
        [siteName, devisName]
      );

      // 3️⃣ Get sensors (stored once, not duplicated per module)
      const [sensorRows] = await db.execute(
        `SELECT sondes_count, sondes_refs,
                sondes_presentes_count, sondes_presentes_refs,
                gaz_compteur, gaz_compteur_ref,
                izit_count, izit_types
         FROM gtb_sensors
         WHERE site_name = ? AND devis_name = ?`,
        [siteName, devisName]
      );

      // 4️⃣ Transform to frontend format (backward compatible)
      const flatData = this._convertToFlatStructure(moduleRows, refRows, sensorRows);
      flatData.site = siteName;
      flatData.devis_name = devisName;

      console.log(`✅ [GTB DAL V2] Retrieved GTB config for ${siteName}, devis: ${devisName}`);
      return flatData;
    } catch (error) {
      console.error('❌ [GTB DAL V2] Error fetching GTB config:', error);
      throw error;
    }
  }

  /**
   * Check if site has GTB configuration for a specific devis
   * @param {string} siteName - Site identifier
   * @param {string} devisName - Devis identifier (default: 'Devis Principal')
   * @returns {Promise<boolean>}
   */
  async hasGtbConfig(siteName, devisName = 'Devis Principal') {
    try {
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM gtb_modules WHERE site_name = ? AND devis_name = ?',
        [siteName, devisName]
      );
      return rows[0].count > 0;
    } catch (error) {
      console.error('❌ [GTB DAL V2] Error checking GTB config:', error);
      throw error;
    }
  }

  // =====================================================
  // WRITE OPERATIONS
  // =====================================================

  /**
   * Save complete GTB configuration for a site + devis
   * @param {string} siteName - Site identifier
   * @param {string} devisName - Devis identifier (default: 'Devis Principal')
   * @param {Object} gtbData - GTB configuration data (flat format from frontend)
   * @returns {Promise<Object>} - Result summary
   */
  async saveGtbConfig(siteName, devisName = 'Devis Principal', gtbData) {
    const connection = await db.getConnection();

    try {
      console.log(`💾 [GTB DAL V2] Saving GTB config for site: ${siteName}, devis: ${devisName}`);
      await connection.beginTransaction();

      // ✅ Ensure site exists in sites table (required for foreign key)
      const [siteRows] = await connection.execute(
        'SELECT site_name FROM sites WHERE site_name = ?',
        [siteName]
      );

      if (siteRows.length === 0) {
        console.log(`ℹ️ [GTB DAL V2] Creating site entry for: ${siteName}`);
        await connection.execute(
          'INSERT INTO sites (site_name) VALUES (?)',
          [siteName]
        );
      }

      const result = {
        site: siteName,
        devis: devisName,
        modulesProcessed: 0,
        referencesProcessed: 0,
        sensorsProcessed: false
      };

      // 1️⃣ DELETE old data (devis-specific only)
      await connection.execute(
        'DELETE FROM gtb_modules WHERE site_name = ? AND devis_name = ?',
        [siteName, devisName]
      );
      await connection.execute(
        'DELETE FROM gtb_module_references WHERE site_name = ? AND devis_name = ?',
        [siteName, devisName]
      );
      await connection.execute(
        'DELETE FROM gtb_sensors WHERE site_name = ? AND devis_name = ?',
        [siteName, devisName]
      );

      // Module type mappings (frontend field name → database column name)
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

      // 2️⃣ SAVE modules (quantity only, NO refs column)
      for (const [frontendKey, dbKey] of Object.entries(moduleMap)) {
        const quantity = gtbData[frontendKey] || gtbData[dbKey] || 0;

        if (quantity > 0) {
          // Insert module with quantity ONLY (no refs column)
          await connection.execute(
            `INSERT INTO gtb_modules
             (site_name, devis_name, module_type, quantity)
             VALUES (?, ?, ?, ?)`,
            [siteName, devisName, dbKey, quantity]
          );

          result.modulesProcessed++;

          // 3️⃣ SAVE references (devis-aware, single source of truth)
          const refs = gtbData.refs?.[dbKey] || gtbData.refs?.[frontendKey] || [];

          if (Array.isArray(refs) && refs.length > 0) {
            for (let i = 0; i < refs.length; i++) {
              if (refs[i] && refs[i].trim()) {  // Only save non-empty refs
                await connection.execute(
                  `INSERT INTO gtb_module_references
                   (site_name, devis_name, module_type, ref_index, ref_value)
                   VALUES (?, ?, ?, ?, ?)`,
                  [siteName, devisName, dbKey, i, refs[i].trim()]
                );
                result.referencesProcessed++;
              }
            }
          }
        }
      }

      // 4️⃣ SAVE sensors (centralized, stored ONCE, not per module)
      const sensorData = {
        sondes_count: parseInt(gtbData.sondes) || 0,
        sondes_refs: gtbData.refs?.sondes || [],
        sondes_presentes_count: parseInt(gtbData.sondesPresentes) || 0,
        sondes_presentes_refs: gtbData.refs?.sondesPresentes || [],
        gaz_compteur: gtbData.gazCompteur === 'oui' ? 1 : 0,
        gaz_compteur_ref: gtbData.refs?.gazCompteur?.[0] || null,
        izit_count: Array.isArray(gtbData.Izit) ? gtbData.Izit.length : (parseInt(gtbData.Izit) || 0),
        izit_types: Array.isArray(gtbData.Izit) ? gtbData.Izit : []
      };

      // Only save sensors if at least one sensor exists
      if (sensorData.sondes_count > 0 ||
          sensorData.sondes_presentes_count > 0 ||
          sensorData.gaz_compteur > 0 ||
          sensorData.izit_count > 0) {

        await connection.execute(
          `INSERT INTO gtb_sensors
           (site_name, devis_name,
            sondes_count, sondes_refs,
            sondes_presentes_count, sondes_presentes_refs,
            gaz_compteur, gaz_compteur_ref,
            izit_count, izit_types)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            siteName,
            devisName,
            sensorData.sondes_count,
            JSON.stringify(sensorData.sondes_refs),
            sensorData.sondes_presentes_count,
            JSON.stringify(sensorData.sondes_presentes_refs),
            sensorData.gaz_compteur,
            sensorData.gaz_compteur_ref,
            sensorData.izit_count,
            JSON.stringify(sensorData.izit_types)
          ]
        );

        result.sensorsProcessed = true;
      }

      await connection.commit();
      console.log(`✅ [GTB DAL V2] Saved GTB config for ${siteName}, devis: ${devisName}:`, result);

      return result;
    } catch (error) {
      await connection.rollback();
      console.error('❌ [GTB DAL V2] Error saving GTB config:', error);
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
        ? `🗑️ [GTB DAL V2] Deleting GTB config for site: ${siteName}, devis: ${devisName}`
        : `🗑️ [GTB DAL V2] Deleting ALL GTB configs for site: ${siteName}`;
      console.log(logMsg);

      await connection.beginTransaction();

      const whereClause = devisName
        ? 'WHERE site_name = ? AND devis_name = ?'
        : 'WHERE site_name = ?';
      const params = devisName ? [siteName, devisName] : [siteName];

      const [refResult] = await connection.execute(
        `DELETE FROM gtb_module_references ${whereClause}`,
        params
      );

      const [moduleResult] = await connection.execute(
        `DELETE FROM gtb_modules ${whereClause}`,
        params
      );

      const [sensorResult] = await connection.execute(
        `DELETE FROM gtb_sensors ${whereClause}`,
        params
      );

      await connection.commit();

      const totalDeleted = refResult.affectedRows + moduleResult.affectedRows + sensorResult.affectedRows;
      console.log(`✅ [GTB DAL V2] Deleted ${totalDeleted} records for ${siteName}`);

      return totalDeleted;
    } catch (error) {
      await connection.rollback();
      console.error('❌ [GTB DAL V2] Error deleting GTB config:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Convert database rows to flat structure (backward compatible with frontend)
   * @private
   */
  _convertToFlatStructure(moduleRows, refRows, sensorRows) {
    const flatData = {
      modules: [],
      refs: {}
    };

    // Process modules (add to modules array + set quantities)
    moduleRows.forEach(row => {
      flatData.modules.push(row.module_type);
      flatData[row.module_type] = row.quantity;
    });

    // Process references (group by module type)
    refRows.forEach(row => {
      if (!flatData.refs[row.module_type]) {
        flatData.refs[row.module_type] = [];
      }
      flatData.refs[row.module_type][row.ref_index] = row.ref_value;
    });

    // Process sensors (stored once, not duplicated)
    if (sensorRows && sensorRows.length > 0) {
      const sensors = sensorRows[0];

      flatData.sondes = sensors.sondes_count || 0;
      flatData.sondesPresentes = sensors.sondes_presentes_count || 0;
      flatData.gazCompteur = sensors.gaz_compteur ? 'oui' : 'non';
      flatData.Izit = sensors.izit_count || 0;

      // Parse JSON sensor refs
      try {
        flatData.refs.sondes = JSON.parse(sensors.sondes_refs || '[]');
        flatData.refs.sondesPresentes = JSON.parse(sensors.sondes_presentes_refs || '[]');

        if (sensors.gaz_compteur_ref) {
          flatData.refs.gazCompteur = [sensors.gaz_compteur_ref];
        }

        // Izit types (for multi-select display)
        const izitTypes = JSON.parse(sensors.izit_types || '[]');
        if (Array.isArray(izitTypes) && izitTypes.length > 0) {
          flatData.Izit = izitTypes;
        }
      } catch (jsonError) {
        console.error('⚠️ [GTB DAL V2] Error parsing sensor JSON:', jsonError);
        flatData.refs.sondes = [];
        flatData.refs.sondesPresentes = [];
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

    return true;
  }
}

// Export singleton instance
export default new GtbConfigDAL_V2();
