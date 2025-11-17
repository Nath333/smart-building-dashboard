// comptageDAL.js - Data Access Layer for comptage (metering) equipment
// Handles CRUD operations for aerotherme, climate, lighting, and rooftop comptage tables

import { db } from '../../src/config/database.js';

const comptageDAL = {
  /**
   * Save comptage data for a specific equipment category
   * @param {string} siteName - Site identifier
   * @param {string} category - Equipment category (aerotherme, climate, lighting, rooftop)
   * @param {Array} comptageData - Array of comptage records
   */
  async saveComptageData(siteName, category, comptageData) {
    const tableName = `equipment_comptage_${category}`;

    try {
      // Delete existing records for this site and category
      await db.execute(`DELETE FROM ${tableName} WHERE site_name = ?`, [siteName]);

      if (!comptageData || comptageData.length === 0) {
        return { success: true, message: 'No comptage data to save' };
      }

      // Insert new records
      const insertPromises = comptageData.map(async (record) => {
        const query = `
          INSERT INTO ${tableName}
          (site_name, selection_comptage, zone, nb, type, connection_type, puissance, commentaire, etat_vetuste, localisation)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        return db.execute(query, [
          siteName,
          record.selection_comptage || null,
          record.zone || null,
          record.nb || 1,
          record.type || null,
          record.connection_type || null,
          record.puissance || null,
          record.commentaire || null,
          record.etat_vetuste || null,
          record.localisation || null
        ]);
      });

      await Promise.all(insertPromises);
      return { success: true, message: `Saved ${comptageData.length} comptage records` };
    } catch (error) {
      console.error(`Error saving comptage data for ${category}:`, error);
      throw error;
    }
  },

  /**
   * Get all comptage data for a specific site and category
   * @param {string} siteName - Site identifier
   * @param {string} category - Equipment category
   * @returns {Array} - Array of comptage records
   */
  async getComptageData(siteName, category) {
    const tableName = `equipment_comptage_${category}`;

    try {
      const [rows] = await db.execute(
        `SELECT * FROM ${tableName} WHERE site_name = ? ORDER BY id`,
        [siteName]
      );
      return rows;
    } catch (error) {
      console.error(`Error fetching comptage data for ${category}:`, error);
      throw error;
    }
  },

  /**
   * Get all comptage data for a site (all categories)
   * @param {string} siteName - Site identifier
   * @returns {Object} - Object with comptage data grouped by category
   */
  async getAllComptageData(siteName) {
    try {
      const categories = ['aerotherme', 'climate', 'lighting', 'rooftop'];
      const result = {};

      for (const category of categories) {
        result[category] = await this.getComptageData(siteName, category);
      }

      return result;
    } catch (error) {
      console.error('Error fetching all comptage data:', error);
      throw error;
    }
  },

  /**
   * Delete a specific comptage record
   * @param {string} category - Equipment category
   * @param {number} id - Record ID
   */
  async deleteComptageRecord(category, id) {
    const tableName = `equipment_comptage_${category}`;

    try {
      await db.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
      return { success: true, message: 'Comptage record deleted' };
    } catch (error) {
      console.error(`Error deleting comptage record:`, error);
      throw error;
    }
  },

  /**
   * Delete all comptage records for a site and category
   * @param {string} siteName - Site identifier
   * @param {string} category - Equipment category
   */
  async deleteAllComptageForCategory(siteName, category) {
    const tableName = `equipment_comptage_${category}`;

    try {
      await db.execute(`DELETE FROM ${tableName} WHERE site_name = ?`, [siteName]);
      return { success: true, message: `All ${category} comptage records deleted` };
    } catch (error) {
      console.error(`Error deleting comptage records:`, error);
      throw error;
    }
  },

  /**
   * Update a single comptage record
   * @param {string} category - Equipment category
   * @param {number} id - Record ID
   * @param {Object} updateData - Fields to update
   */
  async updateComptageRecord(category, id, updateData) {
    const tableName = `equipment_comptage_${category}`;

    try {
      const fields = [];
      const values = [];

      // Build dynamic update query
      const allowedFields = ['selection_comptage', 'zone', 'nb', 'type', 'connection_type', 'puissance', 'commentaire', 'etat_vetuste', 'localisation'];

      allowedFields.forEach(field => {
        if (updateData.hasOwnProperty(field)) {
          fields.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      });

      if (fields.length === 0) {
        return { success: false, message: 'No fields to update' };
      }

      values.push(id);
      const query = `UPDATE ${tableName} SET ${fields.join(', ')} WHERE id = ?`;

      await db.execute(query, values);
      return { success: true, message: 'Comptage record updated' };
    } catch (error) {
      console.error(`Error updating comptage record:`, error);
      throw error;
    }
  }
};

export default comptageDAL;
