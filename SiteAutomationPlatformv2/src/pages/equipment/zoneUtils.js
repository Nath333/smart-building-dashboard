/**
 * Zone Management Utility
 * Handles multi-zone equipment configuration with backward compatibility
 */

// Available zones for equipment
export const AVAILABLE_ZONES = [
  { value: 'surface_de_vente', label: 'Surface de vente' },
  { value: 'galerie_marchande', label: 'Galerie marchande' },
  { value: 'reserve', label: 'Réserve' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'entrepot', label: 'Entrepôt' },
  { value: 'parking', label: 'Parking' },
  { value: 'autre', label: 'Autre' }
];

// Equipment types that support zones
export const EQUIPMENT_TYPES = [
  { value: 'Aero', label: 'Aérothermes' },
  { value: 'Clim', label: 'Climatisation' },
  { value: 'Rooftop', label: 'Rooftop' },
  { value: 'Eclairage', label: 'Éclairage' }
];

// Comptage types - separate cards for each equipment type
export const COMPTAGE_TYPES = [
  { value: 'Comptage_Aero', label: '📊 Comptage Aérotherme' },
  { value: 'Comptage_Clim', label: '📊 Comptage Climatisation' },
  { value: 'Comptage_Rooftop', label: '📊 Comptage Rooftop' },
  { value: 'Comptage_Eclairage', label: '📊 Comptage Éclairage' }
];

/**
 * Parse a card key into type and zone
 * @param {string} key - Card key (e.g., "Aero::surface_de_vente" or "Aero")
 * @returns {{type: string, zone: string|null}}
 */
export const parseCardKey = (key) => {
  if (!key || typeof key !== 'string') {
    return { type: '', zone: null };
  }

  // New format: "Type::zone"
  if (key.includes('::')) {
    const [type, zone] = key.split('::');
    return { type, zone };
  }

  // Legacy format: "Type" (backward compatible)
  return { type: key, zone: null };
};

/**
 * Create a card key from type and zone
 * @param {string} type - Equipment type
 * @param {string|null} zone - Zone name (null for legacy mode)
 * @returns {string}
 */
export const createCardKey = (type, zone = null) => {
  if (!type) return '';
  return zone ? `${type}::${zone}` : type;
};

/**
 * Get display label for a card
 * @param {string} type - Equipment type
 * @param {string|null} zone - Zone name
 * @returns {string}
 */
export const getCardLabel = (type, zone = null) => {
  if (!zone) return type;

  const zoneLabel = AVAILABLE_ZONES.find(z => z.value === zone)?.label || zone;
  return `${type} - ${zoneLabel}`;
};

/**
 * Check if data contains zone-based structure
 * @param {Object} data - Equipment data object
 * @returns {boolean}
 */
export const isZoneBasedData = (data) => {
  if (!data || typeof data !== 'object') return false;

  // Check if any key contains the zone separator
  return Object.keys(data).some(key => key.includes('::'));
};

/**
 * Migrate legacy data to zone-based structure
 * @param {Object} legacyData - Legacy data structure {Aero: {...}, Clim: {...}}
 * @param {string} defaultZone - Default zone for migration
 * @returns {Object} Zone-based data structure
 */
export const migrateLegacyData = (legacyData, defaultZone = 'surface_de_vente') => {
  if (!legacyData || typeof legacyData !== 'object') return {};

  const migratedData = {};

  Object.entries(legacyData).forEach(([type, value]) => {
    // If already zone-based, keep as is
    if (type.includes('::')) {
      migratedData[type] = value;
    } else {
      // Convert legacy format to zone-based
      const newKey = createCardKey(type, defaultZone);
      migratedData[newKey] = value;
    }
  });

  return migratedData;
};

/**
 * Convert zone-based data back to flat SQL structure
 * @param {Object} zoneData - Zone-based data {Aero::zone: {data, status, images}}
 * @returns {Object} Flat SQL structure
 */
export const flattenZoneData = (zoneData) => {
  if (!zoneData || typeof zoneData !== 'object') {
    console.log('⚠️ flattenZoneData: No zoneData provided');
    return {};
  }

  console.log('🔄 flattenZoneData: Processing zoneData:', zoneData);

  const flattened = {};

  Object.entries(zoneData).forEach(([cardKey, cardData]) => {
    const { type, zone } = parseCardKey(cardKey);
    const sectionData = cardData?.data || {};

    console.log(`📦 Processing card "${cardKey}":`, { type, zone, fieldCount: Object.keys(sectionData).length });

    Object.entries(sectionData).forEach(([fieldKey, fieldValue]) => {
      if (zone) {
        // Zone-based: add zone suffix (e.g., nb_aerotherme → nb_aerotherme_surface_de_vente)
        const zonedFieldKey = `${fieldKey}_${zone}`;
        flattened[zonedFieldKey] = fieldValue;
        console.log(`  ✅ "${fieldKey}" → "${zonedFieldKey}" = "${fieldValue}"`);
      } else {
        // Legacy: no zone suffix (for backward compatibility)
        flattened[fieldKey] = fieldValue;
        console.log(`  ✅ "${fieldKey}" = "${fieldValue}" (legacy format)`);
      }
    });
  });

  // Debug: Check for rooftop brands specifically
  const rooftopBrands = Object.keys(flattened).filter(k => k.startsWith('marque_rooftop'));
  if (rooftopBrands.length > 0) {
    console.log('🔍 [ROOFTOP BRANDS] Found in flattened data:', rooftopBrands.map(k => ({ key: k, value: flattened[k] })));
  }

  console.log('🎉 flattenZoneData final result:', flattened);
  return flattened;
};

/**
 * Group flat SQL data by zones
 * @param {Object} flatData - Flat SQL data
 * @param {Array} sections - Equipment sections to process
 * @returns {Object} Zone-based grouped data
 */
export const groupDataByZones = (flatData, sections = ['Aero', 'Clim', 'Rooftop', 'Eclairage']) => {
  if (!flatData || typeof flatData !== 'object') {
    console.log('⚠️ groupDataByZones: No flatData provided');
    return {};
  }

  console.log('🔄 groupDataByZones: Processing flatData:', flatData);
  console.log('🔍 [DEBUG] Eclairage fields in flatData:', Object.keys(flatData).filter(k => k.toLowerCase().includes('eclairage')));

  const grouped = {};
  const processedFields = new Set();

  sections.forEach((section) => {
    // Find all unique zones for this section
    const zonesForSection = new Set();
    const sectionLower = section.toLowerCase();

    // Step 1: Find all zones that have data for THIS section
    Object.keys(flatData).forEach((fieldKey) => {
      const fieldLower = fieldKey.toLowerCase();

      // Check if field belongs to this section
      let belongsToSection = false;

      if (section === 'Eclairage') {
        // For Eclairage, also match contacteur fields which don't contain "eclairage"
        belongsToSection =
          fieldLower.includes('eclairage') ||
          fieldLower.includes('contacteur') ||
          fieldLower.includes('disjoncteur') ||
          fieldLower.includes('panneau_eclairage') ||
          fieldLower.includes('ref_ecl_panneau') ||
          fieldLower.includes('points_lumineux');
      } else {
        belongsToSection =
          fieldLower.includes(sectionLower) ||
          fieldLower.includes('aero') && section === 'Aero' ||
          fieldLower.includes('clim') && section === 'Clim' ||
          fieldLower.includes('rooftop') && section === 'Rooftop';
      }

      if (belongsToSection) {
        // Check if it has a zone suffix
        AVAILABLE_ZONES.forEach(({ value: zone }) => {
          if (fieldKey.endsWith(`_${zone}`)) {
            zonesForSection.add(zone);
            console.log(`✅ Found zone "${zone}" for section "${section}" in field "${fieldKey}"`);
          }
        });
      }
    });

    console.log(`📊 Section "${section}" has zones:`, Array.from(zonesForSection));

    // Step 2: Create cards for each zone found
    if (zonesForSection.size > 0) {
      zonesForSection.forEach((zone) => {
        const cardKey = createCardKey(section, zone);
        const cardData = { data: {}, status: {}, images: [] };

        Object.entries(flatData).forEach(([fieldKey, fieldValue]) => {
          // Check if field ends with this zone
          if (fieldKey.endsWith(`_${zone}`)) {
            // Remove zone suffix to get base field name
            const baseFieldKey = fieldKey.replace(new RegExp(`_${zone}$`), '');

            // Import FIELD_REGISTRY to check if field belongs to this section
            const registry = {
              Aero: ['zone_aerotherme', 'nb_aerotherme', 'thermostat_aerotherme', 'nb_contacts_aerotherme', 'coffret_aerotherme', 'coffret_horloge_aerotherme', 'type_aerotherme', 'Fonctionement_aerotherme', 'Maintenance_aerotherme', 'commentaire_aero', 'etat_vetuste_aerotherme', 'localisation_aerotherme', 'localisation_comptage_aerotherme'],
              Clim: ['zone_clim', 'nb_clim_ir', 'nb_clim_wire', 'coffret_clim', 'type_clim', 'Fonctionement_clim', 'Maintenance_clim', 'nb_telecommande_clim_smartwire', 'nb_telecommande_clim_wire', 'commentaire_clim', 'tableau_comptage_clim', 'etat_vetuste_clim', 'localisation_clim', 'localisation_comptage_clim'],
              Rooftop: ['zone_rooftop_1', 'zone_rooftop_2', 'zone_rooftop_3', 'zone_rooftop_4', 'zone_rooftop', 'nb_rooftop', 'thermostat_rooftop', 'telecomande_modbus_rooftop', 'coffret_rooftop', 'type_rooftop_1', 'type_rooftop_2', 'type_rooftop_3', 'type_rooftop', 'Fonctionement_rooftop', 'Maintenance_rooftop', 'commentaire_rooftop', 'etat_vetuste_rooftop', 'localisation_rooftop', 'localisation_comptage_rooftop'],
              Eclairage: ['zone_eclairage', 'panneau_eclairage', 'nb_points_lumineux_interieur', 'ref_ecl_panneau', 'nb_contacteurs', 'ref_disjoncteur_contacteur', 'nb_contacteurs_tetra_interieur', 'nb_contacteurs_mono_interieur', 'nb_contacteurs_biphase_interieur', 'commande_contacteur_interieur', 'nb_points_lumineux_exterieur', 'commande_contacteur_exterieur', 'nb_contacteurs_ext', 'ref_disjoncteur_contacteur_ext', 'nb_contacteurs_tetra_exterieur', 'nb_contacteurs_mono_exterieur', 'nb_contacteurs_biphase_exterieur', 'commande_horloge_crepusculaire', 'commentaire_eclairage', 'etat_vetuste_eclairage', 'localisation_eclairage']
            };

            const sectionFields = registry[section] || [];
            const belongsToSection = sectionFields.includes(baseFieldKey);

            if (belongsToSection && fieldValue !== null && fieldValue !== '') {
              cardData.data[baseFieldKey] = fieldValue;
              processedFields.add(fieldKey);
              console.log(`  ✅ Added field "${baseFieldKey}" = "${fieldValue}" to card "${cardKey}"`);
            }
          }
        });

        if (Object.keys(cardData.data).length > 0) {
          grouped[cardKey] = cardData;
          console.log(`✅ Created card "${cardKey}" with ${Object.keys(cardData.data).length} fields`);
        }
      });
    } else {
      // No zones found, use legacy format (fields without zone suffix)
      const cardData = { data: {}, status: {}, images: [] };

      Object.entries(flatData).forEach(([fieldKey, fieldValue]) => {
        const fieldLower = fieldKey.toLowerCase();

        // Check if field belongs to this section AND has no zone suffix
        const belongsToSection =
          fieldLower.includes(sectionLower) ||
          fieldLower.includes('aero') && section === 'Aero' ||
          fieldLower.includes('clim') && section === 'Clim' ||
          fieldLower.includes('rooftop') && section === 'Rooftop' ||
          fieldLower.includes('eclairage') && section === 'Eclairage';

        // Check if field has any zone suffix
        const hasZoneSuffix = AVAILABLE_ZONES.some(({ value: zone }) => fieldKey.endsWith(`_${zone}`));

        if (belongsToSection && !hasZoneSuffix && !processedFields.has(fieldKey)) {
          if (fieldValue !== null && fieldValue !== '') {
            cardData.data[fieldKey] = fieldValue;
            processedFields.add(fieldKey);
            console.log(`  ✅ Added legacy field "${fieldKey}" = "${fieldValue}" to section "${section}"`);
          }
        }
      });

      if (Object.keys(cardData.data).length > 0) {
        grouped[section] = cardData; // Legacy key format
        console.log(`✅ Created legacy card "${section}" with ${Object.keys(cardData.data).length} fields`);
      }
    }
  });

  console.log('🎉 groupDataByZones final result:', grouped);
  return grouped;
};

/**
 * Validate zone card configuration
 * @param {string} type - Equipment type
 * @param {string} zone - Zone name
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateZoneCard = (type, zone) => {
  if (!type) {
    return { valid: false, error: 'Type d\'équipement requis' };
  }

  if (!EQUIPMENT_TYPES.find(t => t.value === type)) {
    return { valid: false, error: 'Type d\'équipement invalide' };
  }

  if (zone && !AVAILABLE_ZONES.find(z => z.value === zone)) {
    return { valid: false, error: 'Zone invalide' };
  }

  return { valid: true, error: null };
};

/**
 * Get all cards for a specific equipment type
 * @param {Object} data - All equipment data
 * @param {string} type - Equipment type
 * @returns {Array} Array of card keys
 */
export const getCardsForType = (data, type) => {
  if (!data || !type) return [];

  return Object.keys(data).filter(key => {
    const parsed = parseCardKey(key);
    return parsed.type === type;
  });
};

/**
 * Check if a card key already exists
 * @param {Object} data - All equipment data
 * @param {string} type - Equipment type
 * @param {string} zone - Zone name
 * @returns {boolean}
 */
export const cardExists = (data, type, zone) => {
  if (!data) return false;

  const key = createCardKey(type, zone);
  return key in data;
};
