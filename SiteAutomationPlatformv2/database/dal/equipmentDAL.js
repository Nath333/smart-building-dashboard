/**
 * Equipment Data Access Layer
 * Handles all equipment-related database operations with normalized tables
 * Uses site_name as the foreign key (matches existing sites table)
 *
 * ZONE SUPPORT: Handles zone-suffixed fields (e.g., nb_aerotherme_surface_de_vente)
 */

import mysql from 'mysql2/promise';
import { db } from '../../src/config/database.js';
import logger from '../utils/logger.js';

// Available zones (matches frontend zoneUtils.js)
const AVAILABLE_ZONES = [
  'surface_de_vente',
  'galerie_marchande',
  'reserve',
  'bureau',
  'entrepot',
  'parking',
  'autre'
];

class EquipmentDAL {
  /**
   * Parse zone-suffixed fields from flat data
   * Example: { nb_aerotherme_surface_de_vente: 5, nb_aerotherme_reserve: 3 }
   * Returns: { surface_de_vente: { nb_aerotherme: 5 }, reserve: { nb_aerotherme: 3 } }
   */
  parseZoneSuffixedFields(flatData, baseFields) {
    const zoneData = {};

    // First, check if there are ANY zone-suffixed fields
    const hasZoneSuffixes = Object.keys(flatData).some(key =>
      AVAILABLE_ZONES.some(zone => key.endsWith(`_${zone}`))
    );

    if (!hasZoneSuffixes) {
      // Legacy format: no zone suffixes, return as 'default' zone
      const legacyData = {};
      baseFields.forEach(field => {
        if (flatData[field] !== undefined && flatData[field] !== null) {
          legacyData[field] = flatData[field];
        }
      });
      if (Object.keys(legacyData).length > 0) {
        zoneData['default'] = legacyData;
      }
      return zoneData;
    }

    // Process zone-suffixed fields
    AVAILABLE_ZONES.forEach(zone => {
      const zoneFields = {};
      baseFields.forEach(baseField => {
        const zonedKey = `${baseField}_${zone}`;
        if (flatData[zonedKey] !== undefined && flatData[zonedKey] !== null && flatData[zonedKey] !== '') {
          zoneFields[baseField] = flatData[zonedKey];
        }
      });
      if (Object.keys(zoneFields).length > 0) {
        zoneData[zone] = zoneFields;
      }
    });

    return zoneData;
  }

  /**
   * Convert zone-based rows back to flat structure with zone suffixes
   * Example: [{ zone_aerotherme: 'surface_de_vente', nb_aerotherme: 5 }]
   * Returns: { nb_aerotherme_surface_de_vente: 5 }
   */
  flattenZoneRows(rows, fieldMap, zoneColumn) {
    const flat = {};

    rows.forEach(row => {
      const zone = row[zoneColumn];
      if (!zone) return;

      Object.entries(fieldMap).forEach(([dbColumn, flatKey]) => {
        // Include all fields from fieldMap, even if NULL (frontend needs empty fields)
        if (row[dbColumn] !== undefined) {
          const zonedKey = `${flatKey}_${zone}`;
          flat[zonedKey] = row[dbColumn];
        }
      });
    });

    return flat;
  }
  /**
   * Get all equipment data for a site (Aerotherme) - Zone-aware
   * Returns all zones as flat data with zone suffixes
   */
  async getAerothermeData(siteName) {
    const timer = logger.startTimer();

    try {
      logger.logQuery('SELECT', 'equipment_aerotherme + references', siteName);

      // Get ALL aerotherme rows for this site (multiple zones)
      const [aeroData] = await db.execute(
        'SELECT * FROM equipment_aerotherme WHERE site_name = ?',
        [siteName]
      );

      // Get aerotherme references (all zones)
      const [brands] = await db.execute(
        'SELECT zone_aerotherme, brand_index, brand_name FROM aerotherme_references WHERE site_name = ? ORDER BY zone_aerotherme, brand_index',
        [siteName]
      );

      const duration = logger.endTimer(timer);
      logger.logSuccess('SELECT', 'equipment_aerotherme', siteName, {
        equipment_records: aeroData.length,
        brand_records: brands.length,
        zones: aeroData.map(r => r.zone_aerotherme).filter(Boolean)
      });
      logger.logPerformance('getAerothermeData', siteName, duration);

      // Convert to zone-suffixed flat format
      const fieldMap = {
        nb_aerotherme: 'nb_aerotherme',
        thermostat_aerotherme: 'thermostat_aerotherme',
        coffret_aerotherme: 'coffret_aerotherme',
        type_aerotherme: 'type_aerotherme',
        fonctionement_aerotherme: 'Fonctionement_aerotherme',
        maintenance_aerotherme: 'Maintenance_aerotherme',
        commentaire_aero: 'commentaire_aero',
        etat_vetuste_aerotherme: 'etat_vetuste_aerotherme',
        localisation_aerotherme: 'localisation_aerotherme',
        localisation_comptage: 'localisation_comptage_aerotherme'
      };

      const flatData = this.flattenZoneRows(aeroData, fieldMap, 'zone_aerotherme');

      // Flatten brands with zone suffixes
      brands.forEach(brand => {
        const zone = brand.zone_aerotherme;
        if (zone) {
          const key = `marque_aerotherme_${brand.brand_index}_${zone}`;
          flatData[key] = brand.brand_name;
        }
      });

      return flatData;
    } catch (error) {
      logger.logError('SELECT', 'equipment_aerotherme', siteName, error);
      throw error;
    }
  }

  /**
   * Save aerotherme equipment data - Zone-aware
   * Accepts zone-suffixed fields and creates multiple rows
   */
  async saveAerothermeData(siteName, data) {
    const timer = logger.startTimer();
    const connection = await db.getConnection();

    try {
      // Define base fields for aerotherme
      const baseFields = [
        'nb_aerotherme',
        'thermostat_aerotherme',
        'coffret_aerotherme',
        'type_aerotherme',
        'Fonctionement_aerotherme',
        'Maintenance_aerotherme',
        'commentaire_aero',
        'etat_vetuste_aerotherme',
        'localisation_aerotherme',
        'localisation_comptage_aerotherme'
      ];

      // Parse zone-suffixed fields
      console.log('🔍 [DEBUG saveAerothermeData] Incoming data keys:', Object.keys(data));
      console.log('🔍 [DEBUG saveAerothermeData] Looking for localisation/etat_vetuste fields:',
        Object.keys(data).filter(k => k.includes('localisation') || k.includes('etat_vetuste')));

      const zoneData = this.parseZoneSuffixedFields(data, baseFields);

      console.log('🔍 [DEBUG saveAerothermeData] Parsed zoneData:', JSON.stringify(zoneData, null, 2));
      console.log('🔍 [DEBUG saveAerothermeData] Checking for localisation/etat_vetuste in zoneData:');
      Object.entries(zoneData).forEach(([zone, fields]) => {
        console.log(`   Zone "${zone}":`, {
          has_localisation: 'localisation_aerotherme' in fields,
          has_etat_vetuste: 'etat_vetuste_aerotherme' in fields,
          localisation_value: fields.localisation_aerotherme,
          etat_vetuste_value: fields.etat_vetuste_aerotherme
        });
      });

      logger.logQuery('UPSERT', 'equipment_aerotherme + references', siteName, {
        zones: Object.keys(zoneData)
      });

      await connection.beginTransaction();

      // Delete ALL existing aerotherme rows for this site (we'll recreate them)
      await connection.execute(
        'DELETE FROM equipment_aerotherme WHERE site_name = ?',
        [siteName]
      );

      // Delete ALL existing references for this site
      await connection.execute(
        'DELETE FROM aerotherme_references WHERE site_name = ?',
        [siteName]
      );

      let totalRows = 0;
      let totalBrands = 0;

      // Insert rows for each zone
      for (const [zone, zoneFields] of Object.entries(zoneData)) {
        const query = `
          INSERT INTO equipment_aerotherme (
            site_name, zone_aerotherme, nb_aerotherme, thermostat_aerotherme,
            coffret_aerotherme, type_aerotherme, fonctionement_aerotherme,
            maintenance_aerotherme, commentaire_aero, etat_vetuste_aerotherme,
            localisation_aerotherme
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.execute(query, [
          siteName,
          zone === 'default' ? null : zone, // Store zone name or NULL for legacy
          zoneFields.nb_aerotherme || null,
          zoneFields.thermostat_aerotherme || null,
          zoneFields.coffret_aerotherme || null,
          zoneFields.type_aerotherme || null,
          zoneFields.Fonctionement_aerotherme || null,
          zoneFields.Maintenance_aerotherme || null,
          zoneFields.commentaire_aero || null,
          zoneFields.etat_vetuste_aerotherme || null,
          zoneFields.localisation_aerotherme || null
        ]);

        totalRows++;

        // Save references for this zone (marque_aerotherme_0_zone to marque_aerotherme_9_zone)
        for (let i = 0; i < 10; i++) {
          const brandKey = zone === 'default'
            ? `marque_aerotherme_${i}`
            : `marque_aerotherme_${i}_${zone}`;

          if (data[brandKey]) {
            await connection.execute(
              'INSERT INTO aerotherme_references (site_name, zone_aerotherme, brand_index, brand_name) VALUES (?, ?, ?, ?)',
              [siteName, zone === 'default' ? null : zone, i, data[brandKey]]
            );
            totalBrands++;
          }
        }
      }

      await connection.commit();

      const duration = logger.endTimer(timer);
      logger.logSuccess('UPSERT', 'equipment_aerotherme', siteName, {
        zones_saved: Object.keys(zoneData),
        equipment_rows: totalRows,
        brands_saved: totalBrands
      });
      logger.logPerformance('saveAerothermeData', siteName, duration);

      return { success: true };
    } catch (error) {
      await connection.rollback();
      logger.logError('UPSERT', 'equipment_aerotherme', siteName, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get rooftop equipment data - Zone-aware
   * Returns all zones as flat data with zone suffixes
   */
  async getRooftopData(siteName) {
    const timer = logger.startTimer();

    try {
      logger.logQuery('SELECT', 'equipment_rooftop + references', siteName);

      // Get ALL rooftop rows for this site (multiple zones)
      const [rooftopData] = await db.execute(
        'SELECT * FROM equipment_rooftop WHERE site_name = ?',
        [siteName]
      );

      // Get rooftop references (all zones)
      const [brands] = await db.execute(
        'SELECT zone_rooftop, brand_index, brand_name FROM rooftop_references WHERE site_name = ? ORDER BY zone_rooftop, brand_index',
        [siteName]
      );

      const duration = logger.endTimer(timer);
      logger.logSuccess('SELECT', 'equipment_rooftop', siteName, {
        equipment_records: rooftopData.length,
        brand_records: brands.length,
        zones: rooftopData.map(r => r.zone_rooftop).filter(Boolean)
      });
      logger.logPerformance('getRooftopData', siteName, duration);

      // Convert to zone-suffixed flat format
      const fieldMap = {
        nb_rooftop: 'nb_rooftop',
        thermostat_rooftop: 'thermostat_rooftop',
        telecomande_modbus_rooftop: 'telecomande_modbus_rooftop',
        coffret_rooftop: 'coffret_rooftop',
        type_rooftop: 'type_rooftop',
        type_rooftop_1: 'type_rooftop_1',
        type_rooftop_2: 'type_rooftop_2',
        type_rooftop_3: 'type_rooftop_3',
        zone_rooftop_1: 'zone_rooftop_1',
        zone_rooftop_2: 'zone_rooftop_2',
        zone_rooftop_3: 'zone_rooftop_3',
        zone_rooftop_4: 'zone_rooftop_4',
        fonctionement_rooftop: 'Fonctionement_rooftop',
        maintenance_rooftop: 'Maintenance_rooftop',
        commentaire_rooftop: 'commentaire_rooftop',
        etat_vetuste_rooftop: 'etat_vetuste_rooftop',
        localisation_rooftop: 'localisation_rooftop',
        localisation_comptage: 'localisation_comptage_rooftop'
      };

      const flatData = this.flattenZoneRows(rooftopData, fieldMap, 'zone_rooftop');

      // Flatten brands with zone suffixes
      brands.forEach(brand => {
        const zone = brand.zone_rooftop;
        if (zone) {
          const key = `marque_rooftop_${brand.brand_index}_${zone}`;
          flatData[key] = brand.brand_name;
        }
      });

      return flatData;
    } catch (error) {
      logger.logError('SELECT', 'equipment_rooftop', siteName, error);
      throw error;
    }
  }

  /**
   * Save rooftop equipment data - Zone-aware
   * Accepts zone-suffixed fields and creates multiple rows
   */
  async saveRooftopData(siteName, data) {
    const timer = logger.startTimer();
    const connection = await db.getConnection();

    try {
      // Define base fields for rooftop (only columns that exist in DB)
      const baseFields = [
        'nb_rooftop',
        'thermostat_rooftop',
        'telecomande_modbus_rooftop',
        'coffret_rooftop',
        'type_rooftop',
        'Fonctionement_rooftop',
        'Maintenance_rooftop',
        'commentaire_rooftop',
        'etat_vetuste_rooftop',
        'localisation_rooftop',
        'localisation_comptage_rooftop'
      ];

      // Parse zone-suffixed fields
      const zoneData = this.parseZoneSuffixedFields(data, baseFields);

      logger.logQuery('UPSERT', 'equipment_rooftop + references', siteName, {
        zones: Object.keys(zoneData)
      });

      await connection.beginTransaction();

      // Delete ALL existing rooftop rows for this site
      await connection.execute(
        'DELETE FROM equipment_rooftop WHERE site_name = ?',
        [siteName]
      );

      // Delete ALL existing references for this site
      await connection.execute(
        'DELETE FROM rooftop_references WHERE site_name = ?',
        [siteName]
      );

      let totalRows = 0;
      let totalBrands = 0;

      // Insert rows for each zone
      for (const [zone, zoneFields] of Object.entries(zoneData)) {
        const query = `
          INSERT INTO equipment_rooftop (
            site_name, zone_rooftop, nb_rooftop, thermostat_rooftop,
            telecomande_modbus_rooftop, coffret_rooftop,
            type_rooftop, fonctionement_rooftop, maintenance_rooftop, commentaire_rooftop,
            etat_vetuste_rooftop, localisation_rooftop
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.execute(query, [
          siteName,
          zone === 'default' ? null : zone,
          zoneFields.nb_rooftop || null,
          zoneFields.thermostat_rooftop || null,
          zoneFields.telecomande_modbus_rooftop || null,
          zoneFields.coffret_rooftop || null,
          zoneFields.type_rooftop || null,
          zoneFields.Fonctionement_rooftop || null,
          zoneFields.Maintenance_rooftop || null,
          zoneFields.commentaire_rooftop || null,
          zoneFields.etat_vetuste_rooftop || null,
          zoneFields.localisation_rooftop || null
        ]);

        totalRows++;

        // Save references for this zone
        console.log(`🔍 [DEBUG] Checking rooftop references for zone="${zone}":`, {
          availableKeys: Object.keys(data).filter(k => k.startsWith('marque_rooftop'))
        });

        for (let i = 0; i < 10; i++) {
          const brandKey = zone === 'default'
            ? `marque_rooftop_${i}`
            : `marque_rooftop_${i}_${zone}`;

          console.log(`🔍 [DEBUG] Looking for brandKey="${brandKey}", value=`, data[brandKey]);

          if (data[brandKey]) {
            await connection.execute(
              'INSERT INTO rooftop_references (site_name, zone_rooftop, brand_index, brand_name) VALUES (?, ?, ?, ?)',
              [siteName, zone === 'default' ? null : zone, i, data[brandKey]]
            );
            totalBrands++;
            console.log(`✅ [DEBUG] Saved reference ${i} for zone "${zone}": ${data[brandKey]}`);
          }
        }
      }

      await connection.commit();

      const duration = logger.endTimer(timer);
      logger.logSuccess('UPSERT', 'equipment_rooftop', siteName, {
        zones_saved: Object.keys(zoneData),
        equipment_rows: totalRows,
        brands_saved: totalBrands
      });
      logger.logPerformance('saveRooftopData', siteName, duration);

      return { success: true };
    } catch (error) {
      await connection.rollback();
      logger.logError('UPSERT', 'equipment_rooftop', siteName, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get climate control equipment data - Zone-aware
   * Returns all zones as flat data with zone suffixes
   */
  async getClimateData(siteName) {
    const timer = logger.startTimer();

    try {
      logger.logQuery('SELECT', 'equipment_climate + references', siteName);

      const [climateData] = await db.execute(
        'SELECT * FROM equipment_climate WHERE site_name = ?',
        [siteName]
      );

      const [references] = await db.execute(
        'SELECT zone_clim, ref_type, ref_index, ref_value FROM climate_references WHERE site_name = ? ORDER BY zone_clim, ref_type, ref_index',
        [siteName]
      );

      const duration = logger.endTimer(timer);
      logger.logSuccess('SELECT', 'equipment_climate', siteName, {
        equipment_records: climateData.length,
        reference_records: references.length,
        zones: climateData.map(r => r.zone_clim).filter(Boolean)
      });
      logger.logPerformance('getClimateData', siteName, duration);

      const fieldMap = {
        nb_clim_ir: 'nb_clim_ir',
        nb_unite_ext_clim_ir: 'nb_unite_ext_clim_ir',
        nb_clim_wire: 'nb_clim_wire',
        nb_unite_ext_clim_wire: 'nb_unite_ext_clim_wire',
        coffret_clim: 'coffret_clim',
        type_clim: 'type_clim',
        fonctionement_clim: 'Fonctionement_clim',
        maintenance_clim: 'Maintenance_clim',
        nb_telecommande_clim_smartwire: 'nb_telecommande_clim_smartwire',
        nb_telecommande_clim_wire: 'nb_telecommande_clim_wire',
        commentaire_clim: 'commentaire_clim',
        td_clim: 'tableau_comptage_clim',
        etat_vetuste_clim: 'etat_vetuste_clim',
        localisation_clim: 'localisation_clim',
        localisation_comptage: 'localisation_comptage_clim'
      };

      const flatData = this.flattenZoneRows(climateData, fieldMap, 'zone_clim');

      references.forEach(ref => {
        const zone = ref.zone_clim;
        if (zone) {
          const key = `${ref.ref_type}_ref_${ref.ref_index}_${zone}`;
          flatData[key] = ref.ref_value;
        }
      });

      return flatData;
    } catch (error) {
      logger.logError('SELECT', 'equipment_climate', siteName, error);
      throw error;
    }
  }

  /**
   * Save climate control equipment data - Zone-aware
   * Accepts zone-suffixed fields and creates multiple rows
   */
  async saveClimateData(siteName, data) {
    const timer = logger.startTimer();
    const connection = await db.getConnection();

    try {
      const baseFields = [
        'nb_clim_ir',
        'nb_unite_ext_clim_ir',
        'nb_clim_wire',
        'nb_unite_ext_clim_wire',
        'coffret_clim',
        'type_clim',
        'Fonctionement_clim',
        'Maintenance_clim',
        'nb_telecommande_clim_smartwire',
        'nb_telecommande_clim_wire',
        'commentaire_clim',
        'tableau_comptage_clim',
        'etat_vetuste_clim',
        'localisation_clim',
        'localisation_comptage_clim'
      ];

      const zoneData = this.parseZoneSuffixedFields(data, baseFields);

      logger.logQuery('UPSERT', 'equipment_climate + references', siteName, {
        zones: Object.keys(zoneData)
      });

      await connection.beginTransaction();

      await connection.execute(
        'DELETE FROM equipment_climate WHERE site_name = ?',
        [siteName]
      );

      await connection.execute(
        'DELETE FROM climate_references WHERE site_name = ?',
        [siteName]
      );

      let totalRows = 0;
      let totalRefs = 0;

      for (const [zone, zoneFields] of Object.entries(zoneData)) {
        const query = `
          INSERT INTO equipment_climate (
            site_name, zone_clim, nb_clim_ir, nb_clim_wire, coffret_clim,
            type_clim, fonctionement_clim, maintenance_clim,
            nb_telecommande_clim_smartwire, nb_telecommande_clim_wire,
            commentaire_clim, td_clim, etat_vetuste_clim, localisation_clim
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.execute(query, [
          siteName,
          zone === 'default' ? null : zone,
          zoneFields.nb_clim_ir || null,
          zoneFields.nb_clim_wire || null,
          zoneFields.coffret_clim || null,
          zoneFields.type_clim || null,
          zoneFields.Fonctionement_clim || null,
          zoneFields.Maintenance_clim || null,
          zoneFields.nb_telecommande_clim_smartwire || null,
          zoneFields.nb_telecommande_clim_wire || null,
          zoneFields.commentaire_clim || null,
          zoneFields.tableau_comptage_clim || null,
          zoneFields.etat_vetuste_clim || null,
          zoneFields.localisation_clim || null
        ]);

        totalRows++;

        for (const refType of ['clim_ir', 'clim_wire']) {
          for (let i = 0; i < 10; i++) {
            const refKey = zone === 'default'
              ? `${refType}_ref_${i}`
              : `${refType}_ref_${i}_${zone}`;

            if (data[refKey]) {
              await connection.execute(
                'INSERT INTO climate_references (site_name, zone_clim, ref_type, ref_index, ref_value) VALUES (?, ?, ?, ?, ?)',
                [siteName, zone === 'default' ? null : zone, refType, i, data[refKey]]
              );
              totalRefs++;
            }
          }
        }
      }

      await connection.commit();

      const duration = logger.endTimer(timer);
      logger.logSuccess('UPSERT', 'equipment_climate', siteName, {
        zones_saved: Object.keys(zoneData),
        equipment_rows: totalRows,
        references_saved: totalRefs
      });
      logger.logPerformance('saveClimateData', siteName, duration);

      return { success: true };
    } catch (error) {
      await connection.rollback();
      logger.logError('UPSERT', 'equipment_climate', siteName, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get lighting equipment data - Zone-aware
   * Returns all zones as flat data with zone suffixes
   */
  async getLightingData(siteName) {
    const timer = logger.startTimer();

    try {
      logger.logQuery('SELECT', 'equipment_lighting', siteName);

      const [lightingData] = await db.execute(
        'SELECT * FROM equipment_lighting WHERE site_name = ?',
        [siteName]
      );

      const duration = logger.endTimer(timer);
      logger.logSuccess('SELECT', 'equipment_lighting', siteName, {
        equipment_records: lightingData.length,
        zones: lightingData.map(r => r.zone_eclairage).filter(Boolean)
      });
      logger.logPerformance('getLightingData', siteName, duration);

      const fieldMap = {
        panneau_eclairage: 'panneau_eclairage',
        nb_points_lumineux_interieur: 'nb_points_lumineux_interieur',
        ref_ecl_panneau: 'ref_ecl_panneau',
        nb_contacteurs: 'nb_contacteurs',
        ref_disjoncteur_contacteur: 'ref_disjoncteur_contacteur',
        nb_contacteurs_biphase_interieur: 'nb_contacteurs_biphase_interieur',
        commande_contacteur_interieur: 'commande_contacteur_interieur',
        nb_points_lumineux_exterieur: 'nb_points_lumineux_exterieur',
        commande_contacteur_exterieur: 'commande_contacteur_exterieur',
        nb_contacteurs_ext: 'nb_contacteurs_ext',
        ref_disjoncteur_contacteur_ext: 'ref_disjoncteur_contacteur_ext',
        commande_horloge_crepusculaire: 'commande_horloge_crepusculaire',
        commentaire_eclairage: 'commentaire_eclairage',
        etat_vetuste_eclairage: 'etat_vetuste_eclairage',
        localisation_eclairage: 'localisation_eclairage'
      };

      const flatData = this.flattenZoneRows(lightingData, fieldMap, 'zone_eclairage');

      console.log('🔍 [DEBUG getLightingData] Raw DB rows:', JSON.stringify(lightingData, null, 2));
      console.log('🔍 [DEBUG getLightingData] Flattened data:', JSON.stringify(flatData, null, 2));
      console.log('🔍 [DEBUG getLightingData] Field keys returned:', Object.keys(flatData));

      return flatData;
    } catch (error) {
      logger.logError('SELECT', 'equipment_lighting', siteName, error);
      throw error;
    }
  }

  /**
   * Save lighting equipment data - Zone-aware
   * Accepts zone-suffixed fields and creates multiple rows
   */
  async saveLightingData(siteName, data) {
    const timer = logger.startTimer();
    const connection = await db.getConnection();

    try {
      console.log('💡 [saveLightingData] Received data:', JSON.stringify(data, null, 2));

      const baseFields = [
        'panneau_eclairage',
        'nb_points_lumineux_interieur',
        'ref_ecl_panneau',
        'nb_contacteurs',
        'ref_disjoncteur_contacteur',
        'nb_contacteurs_biphase_interieur',
        'commande_contacteur_interieur',
        'nb_points_lumineux_exterieur',
        'commande_contacteur_exterieur',
        'nb_contacteurs_ext',
        'ref_disjoncteur_contacteur_ext',
        'commande_horloge_crepusculaire',
        'commentaire_eclairage',
        'etat_vetuste_eclairage',
        'localisation_eclairage',
        'localisation_comptage_eclairage'
      ];

      const zoneData = this.parseZoneSuffixedFields(data, baseFields);
      console.log('💡 [saveLightingData] Parsed zone data:', JSON.stringify(zoneData, null, 2));

      logger.logQuery('UPSERT', 'equipment_lighting', siteName, {
        zones: Object.keys(zoneData)
      });

      await connection.beginTransaction();

      await connection.execute(
        'DELETE FROM equipment_lighting WHERE site_name = ?',
        [siteName]
      );

      let totalRows = 0;

      for (const [zone, zoneFields] of Object.entries(zoneData)) {
        const query = `
          INSERT INTO equipment_lighting (
            site_name, zone_eclairage,
            panneau_eclairage,
            nb_points_lumineux_interieur,
            ref_ecl_panneau,
            nb_contacteurs,
            ref_disjoncteur_contacteur,
            nb_contacteurs_biphase_interieur,
            commande_contacteur_interieur,
            nb_points_lumineux_exterieur,
            commande_contacteur_exterieur,
            nb_contacteurs_ext,
            ref_disjoncteur_contacteur_ext,
            commande_horloge_crepusculaire,
            commentaire_eclairage,
            etat_vetuste_eclairage,
            localisation_eclairage
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          siteName,
          zone === 'default' ? null : zone,
          zoneFields.panneau_eclairage || null,
          zoneFields.nb_points_lumineux_interieur || null,
          zoneFields.ref_ecl_panneau || null,
          zoneFields.nb_contacteurs || null,
          zoneFields.ref_disjoncteur_contacteur || null,
          zoneFields.nb_contacteurs_biphase_interieur || null,
          zoneFields.commande_contacteur_interieur || null,
          zoneFields.nb_points_lumineux_exterieur || null,
          zoneFields.commande_contacteur_exterieur || null,
          zoneFields.nb_contacteurs_ext || null,
          zoneFields.ref_disjoncteur_contacteur_ext || null,
          zoneFields.commande_horloge_crepusculaire || null,
          zoneFields.commentaire_eclairage || null,
          zoneFields.etat_vetuste_eclairage || null,
          zoneFields.localisation_eclairage || null
        ];

        console.log(`💡 [saveLightingData] Inserting zone "${zone}" with values:`, values);
        await connection.execute(query, values);

        totalRows++;
      }

      await connection.commit();

      const duration = logger.endTimer(timer);
      logger.logSuccess('UPSERT', 'equipment_lighting', siteName, {
        zones_saved: Object.keys(zoneData),
        equipment_rows: totalRows
      });
      logger.logPerformance('saveLightingData', siteName, duration);

      return { success: true };
    } catch (error) {
      await connection.rollback();
      logger.logError('UPSERT', 'equipment_lighting', siteName, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get all equipment data for a site (combined)
   */
  async getAllEquipmentData(siteName) {
    try {
      const [aerotherme, rooftop, climate, lighting] = await Promise.all([
        this.getAerothermeData(siteName),
        this.getRooftopData(siteName),
        this.getClimateData(siteName),
        this.getLightingData(siteName)
      ]);

      return {
        aerotherme,
        rooftop,
        climate,
        lighting
      };
    } catch (error) {
      console.error('Error fetching all equipment data:', error);
      throw error;
    }
  }
}

export default new EquipmentDAL();
