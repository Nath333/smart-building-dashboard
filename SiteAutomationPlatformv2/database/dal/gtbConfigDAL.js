// =====================================================
// GTB Configuration Data Access Layer (DAL)
// =====================================================
// Purpose: Abstraction layer for GTB module configuration
// Replaces: form_sql flat structure with normalized gtb_modules
// Date: 2025-10-15
// =====================================================

import db from '../../src/config/database.js';

/**
 * GTB Configuration DAL
 * Handles all database operations for Page 5 (GTB Configuration)
 */
class GtbConfigDAL {
  // =====================================================
  // READ OPERATIONS
  // =====================================================

  /**
   * Get complete GTB configuration for a site + devis
   * @param {string} siteName - Site identifier
   * @param {string} devisName - Devis identifier (default: 'Devis Principal')
   * @returns {Promise<Object>} - GTB configuration in flat format (backward compatible)
   */
  async getGtbConfig(siteName, devisName = 'Devis Principal') {
    try {
      // ✅ CRITICAL: Trim all string inputs to prevent whitespace issues
      const cleanSiteName = siteName.trim();
      const cleanDevisName = devisName.trim();

      console.log(`📥 [GTB DAL] Fetching GTB config for site: "${cleanSiteName}", devis: "${cleanDevisName}"`);

      // ✅ Get all modules for this site + devis (ONLY from gtb_modules table)
      const [moduleRows] = await db.execute(
        `SELECT module_type, quantity, refs,
                sondes, sondes_presentes, gaz_compteur, izit,
                ref_sondes, ref_sondes_presentes, ref_gaz_compteur
         FROM gtb_modules
         WHERE site_name = ? AND devis_name = ?`,
        [cleanSiteName, cleanDevisName]
      );

      if (moduleRows.length === 0) {
        console.log(`ℹ️ [GTB DAL] No GTB config found for site: "${cleanSiteName}", devis: "${cleanDevisName}"`);
        return null;
      }

      // Convert to flat structure (backward compatible with frontend)
      // No longer using gtb_module_references - all refs stored in gtb_modules.refs column
      const flatData = this._convertToFlatStructure(moduleRows);
      flatData.site = cleanSiteName;
      flatData.devis_name = cleanDevisName;

      console.log(`✅ [GTB DAL] Retrieved GTB config for ${cleanSiteName}, devis: ${cleanDevisName}`);
      console.log(`📊 [GTB DAL] Modules found: ${moduleRows.length}`);
      return flatData;
    } catch (error) {
      console.error('❌ [GTB DAL] Error fetching GTB config:', error);
      throw error;
    }
  }

  /**
   * Get available module types with metadata
   * @returns {Promise<Array>} - List of module types
   */
  async getModuleTypes() {
    try {
      const [rows] = await db.execute(
        `SELECT module_type, module_category, display_name_fr, display_order
         FROM gtb_module_types
         WHERE is_active = TRUE
         ORDER BY display_order`
      );
      return rows;
    } catch (error) {
      console.error('❌ [GTB DAL] Error fetching module types:', error);
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
      console.error('❌ [GTB DAL] Error checking GTB config:', error);
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
      // ✅ CRITICAL: Trim all string inputs to prevent whitespace issues
      const cleanSiteName = siteName.trim();
      const cleanDevisName = devisName.trim();

      console.log(`💾 [GTB DAL] Saving GTB config for site: "${cleanSiteName}", devis: "${cleanDevisName}"`);
      await connection.beginTransaction();

      // ✅ Ensure site exists in sites table (required for foreign key)
      const [siteRows] = await connection.execute(
        'SELECT site_name FROM sites WHERE site_name = ?',
        [cleanSiteName]
      );

      if (siteRows.length === 0) {
        console.log(`ℹ️ [GTB DAL] Creating site entry for: ${cleanSiteName}`);
        await connection.execute(
          'INSERT INTO sites (site_name) VALUES (?)',
          [cleanSiteName]
        );
      }

      const result = {
        site: cleanSiteName,
        devis: cleanDevisName,
        modulesProcessed: 0
      };

      // Extract sensor data (special handling)
      const sensorData = {
        sondes: parseInt(gtbData.sondes) || 0,
        sondes_presentes: parseInt(gtbData.sondesPresentes) || 0,
        gaz_compteur: gtbData.gazCompteur === 'oui' ? 1 : (parseInt(gtbData.gazCompteur) || 0),
        // Store Izit as comma-separated string of selected coffret names (not count!)
        izit: Array.isArray(gtbData.Izit) ? gtbData.Izit.join(',') : (gtbData.Izit || ''),
        ref_sondes: gtbData.ref_sondes || null,
        ref_sondes_presentes: gtbData.ref_sondesPresentes || null,
        ref_gaz_compteur: gtbData.ref_gazCompteur || null
      };

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

      // ✅ Delete existing configuration for this site + devis (ONLY from gtb_modules)
      const [deleteResult] = await connection.execute(
        'DELETE FROM gtb_modules WHERE site_name = ? AND devis_name = ?',
        [cleanSiteName, cleanDevisName]
      );
      console.log(`🗑️ [GTB DAL] Deleted ${deleteResult.affectedRows} existing config rows for site: "${cleanSiteName}", devis: "${cleanDevisName}"`);

      // Process each module type from gtbData
      for (const [frontendKey, dbKey] of Object.entries(moduleMap)) {
        const quantity = gtbData[frontendKey] || gtbData[dbKey] || 0;
        const refKey = `ref_${dbKey}`;
        const refsString = gtbData[refKey] || '';

        if (quantity > 0) {
          // ✅ INSERT module with quantity and refs string (ONLY to gtb_modules table)
          // Using INSERT ... ON DUPLICATE KEY UPDATE as safety net
          await connection.execute(
            `INSERT INTO gtb_modules
             (site_name, devis_name, module_type, quantity, refs,
              sondes, sondes_presentes, gaz_compteur, izit,
              ref_sondes, ref_sondes_presentes, ref_gaz_compteur)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               quantity = VALUES(quantity),
               refs = VALUES(refs),
               sondes = VALUES(sondes),
               sondes_presentes = VALUES(sondes_presentes),
               gaz_compteur = VALUES(gaz_compteur),
               izit = VALUES(izit),
               ref_sondes = VALUES(ref_sondes),
               ref_sondes_presentes = VALUES(ref_sondes_presentes),
               ref_gaz_compteur = VALUES(ref_gaz_compteur)`,
            [
              cleanSiteName,
              cleanDevisName,
              dbKey,
              quantity,
              refsString,  // Store refs as comma-separated string
              sensorData.sondes,
              sensorData.sondes_presentes,
              sensorData.gaz_compteur,
              sensorData.izit,
              sensorData.ref_sondes,
              sensorData.ref_sondes_presentes,
              sensorData.ref_gaz_compteur
            ]
          );

          result.modulesProcessed++;
          console.log(`   ✅ Saved ${dbKey}: quantity=${quantity}, refs="${refsString}"`);
        }
      }

      // ✅ Save sensor-only entry if sensors exist but no modules
      if (result.modulesProcessed === 0 &&
          (sensorData.sondes > 0 || sensorData.sondes_presentes > 0 ||
           sensorData.gaz_compteur > 0 || sensorData.izit.length > 0)) {

        await connection.execute(
          `INSERT INTO gtb_modules
           (site_name, devis_name, module_type, quantity,
            sondes, sondes_presentes, gaz_compteur, izit,
            ref_sondes, ref_sondes_presentes, ref_gaz_compteur)
           VALUES (?, ?, 'sensors_config', 0, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             sondes = VALUES(sondes),
             sondes_presentes = VALUES(sondes_presentes),
             gaz_compteur = VALUES(gaz_compteur),
             izit = VALUES(izit),
             ref_sondes = VALUES(ref_sondes),
             ref_sondes_presentes = VALUES(ref_sondes_presentes),
             ref_gaz_compteur = VALUES(ref_gaz_compteur)`,
          [
            cleanSiteName,
            cleanDevisName,
            sensorData.sondes,
            sensorData.sondes_presentes,
            sensorData.gaz_compteur,
            sensorData.izit,
            sensorData.ref_sondes,
            sensorData.ref_sondes_presentes,
            sensorData.ref_gaz_compteur
          ]
        );

        result.modulesProcessed++;
        console.log(`   ✅ Saved sensors_config entry`);
      }

      await connection.commit();
      console.log(`✅ [GTB DAL] Saved GTB config for ${cleanSiteName}, devis: ${cleanDevisName}`);
      console.log(`   📊 Total: ${result.modulesProcessed} module entries saved to gtb_modules`);

      return result;
    } catch (error) {
      await connection.rollback();
      console.error('❌ [GTB DAL] Error saving GTB config:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete GTB configuration for a site (and optionally specific devis)
   * @param {string} siteName - Site identifier
   * @param {string} devisName - Optional devis identifier (deletes all if not provided)
   * @returns {Promise<number>} - Number of records deleted
   */
  async deleteGtbConfig(siteName, devisName = null) {
    try {
      console.log(`🗑️ [GTB DAL] Deleting GTB config for site: ${siteName}${devisName ? `, devis: ${devisName}` : ' (all devis)'}`);

      let query = 'DELETE FROM gtb_modules WHERE site_name = ?';
      const params = [siteName];

      if (devisName) {
        query += ' AND devis_name = ?';
        params.push(devisName);
      }

      const [result] = await db.execute(query, params);

      console.log(`✅ [GTB DAL] Deleted ${result.affectedRows} records for ${siteName}`);
      return result.affectedRows;
    } catch (error) {
      console.error('❌ [GTB DAL] Error deleting GTB config:', error);
      throw error;
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Convert database rows to flat structure (backward compatible)
   * @private
   * @param {Array} moduleRows - Rows from gtb_modules table
   */
  _convertToFlatStructure(moduleRows) {
    const flatData = {};
    const modules = [];
    const refs = {};

    console.log(`🔄 [GTB DAL] Converting ${moduleRows.length} module rows to flat structure`);

    // Process modules - all data comes from gtb_modules table
    moduleRows.forEach(row => {
      console.log(`   - Module: ${row.module_type}, quantity: ${row.quantity}, refs: ${row.refs}`);

      flatData[row.module_type] = row.quantity;

      // Convert refs string to array for frontend compatibility
      if (row.refs) {
        const refsArray = row.refs.split(',').map(r => r.trim()).filter(Boolean);
        refs[row.module_type] = refsArray;
        flatData[`ref_${row.module_type}`] = row.refs; // Keep string for backward compatibility
      }

      // Add module type to modules array if quantity > 0
      if (row.quantity > 0 && row.module_type !== 'sensors_config') {
        modules.push(row.module_type);
        console.log(`   ✅ Added ${row.module_type} to modules array`);
      }

      // Add sensor data (stored in each module row)
      if (row.sondes > 0) flatData.sondes = row.sondes;
      if (row.sondes_presentes > 0) flatData.sondesPresentes = row.sondes_presentes;
      if (row.gaz_compteur > 0) flatData.gazCompteur = row.gaz_compteur;

      // Convert Izit from comma-separated string back to array of coffret names
      if (row.izit) {
        if (typeof row.izit === 'string' && row.izit.length > 0) {
          // Split comma-separated string: "coffret gtb(asp/do12/routeur/ug65),isma" → array
          flatData.Izit = row.izit.split(',').map(r => r.trim()).filter(Boolean);
        } else {
          flatData.Izit = [];
        }
      }

      if (row.ref_sondes) {
        flatData.ref_sondes = row.ref_sondes;
        refs.sondes = row.ref_sondes.split(',').map(r => r.trim()).filter(Boolean);
      }
      if (row.ref_sondes_presentes) {
        flatData.ref_sondesPresentes = row.ref_sondes_presentes;
        refs.sondesPresentes = row.ref_sondes_presentes.split(',').map(r => r.trim()).filter(Boolean);
      }
      if (row.ref_gaz_compteur) {
        flatData.ref_gazCompteur = row.ref_gaz_compteur;
        refs.gazCompteur = [row.ref_gaz_compteur];
      }
    });

    // Add modules array to flatData
    flatData.modules = modules;
    flatData.refs = refs; // Add refs object for frontend

    console.log(`✅ [GTB DAL] Converted structure - Modules: [${modules.join(', ')}]`);

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
    return true;
  }
}

// Export singleton instance
export default new GtbConfigDAL();
