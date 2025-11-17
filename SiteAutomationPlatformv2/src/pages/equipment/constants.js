export const OPTIONS = ['Aero', 'Clim', 'Rooftop', 'Eclairage'];
export const COMPTAGE_OPTIONS = [
  'Comptage_Aero',
  'Comptage_Clim',
  'Comptage_Rooftop',
  'Comptage_Eclairage'
];


// Unified Field Registry System - Single source of truth for all field mappings
export const FIELD_REGISTRY = {
  Aero: {
    // Core fields
    core: [
      'zone_aerotherme', 'nb_aerotherme', 'thermostat_aerotherme', 'nb_contacts_aerotherme', 
      'coffret_aerotherme', 'coffret_horloge_aerotherme', 'type_aerotherme', 
      'Fonctionement_aerotherme', 'Maintenance_aerotherme', 'commentaire_aero'
    ],
    // Dynamic fields with rules
    dynamic: [
      { prefix: 'marque_aerotherme_', count_field: 'nb_aerotherme', max: 10 }
    ],
    // Legacy prefixes for backward compatibility
    prefixes: ['aero_'],
    // Multi-select fields (for backend serialization)
    multiSelect: ['zone_aerotherme', 'type_aerotherme']
  },
  Clim: {
    core: [
      'zone_clim', 'nb_clim_ir', 'nb_clim_wire', 'coffret_clim', 'type_clim', 
      'Fonctionement_clim', 'Maintenance_clim', 'nb_telecommande_clim_smartwire', 
      'nb_telecommande_clim_wire', 'commentaire_clim'
    ],
    dynamic: [
      { prefix: 'clim_ir_ref_', count_field: 'nb_clim_ir', max: 10 },
      { prefix: 'clim_wire_ref_', count_field: 'nb_clim_wire', max: 10 }
    ],
    prefixes: ['clim_'],
    multiSelect: ['zone_clim', 'type_clim']
  },
  Rooftop: {
    core: [
      'zone_rooftop_1', 'zone_rooftop_2', 'zone_rooftop_3', 'zone_rooftop_4', 'zone_rooftop',
      'nb_rooftop', 'thermostat_rooftop', 'telecomande_modbus_rooftop', 'coffret_rooftop', 
      'type_rooftop_1', 'type_rooftop_2', 'type_rooftop_3', 'type_rooftop',
      'Fonctionement_rooftop', 'Maintenance_rooftop', 'commentaire_rooftop'
    ],
    dynamic: [
      { prefix: 'marque_rooftop_', count_field: 'nb_rooftop', max: 10 }
    ],
    prefixes: ['rooftop_'],
    multiSelect: ['zone_rooftop', 'type_rooftop']
  },
  Eclairage: {
    core: [
      'zone_eclairage',
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
    ],
    dynamic: [],
    prefixes: ['eclairage_'],
    multiSelect: ['zone_eclairage']
  },
  Comptage_Aero: {
    core: [
      'nb_comptage_aero', 'etat_vetuste_comptage_aero',
      'localisation_comptage_aero', 'commentaire_comptage_aero'
    ],
    dynamic: [
      { prefix: 'type_comptage_aero_', count_field: 'nb_comptage_aero', max: 10 },
      { prefix: 'connexion_comptage_aero_', count_field: 'nb_comptage_aero', max: 10 },
      { prefix: 'puissance_comptage_aero_', count_field: 'nb_comptage_aero', max: 10 }
    ],
    prefixes: ['comptage_aero_'],
    multiSelect: []
  },
  Comptage_Clim: {
    core: [
      'nb_comptage_clim', 'etat_vetuste_comptage_clim',
      'localisation_comptage_clim', 'commentaire_comptage_clim'
    ],
    dynamic: [
      { prefix: 'type_comptage_clim_', count_field: 'nb_comptage_clim', max: 10 },
      { prefix: 'connexion_comptage_clim_', count_field: 'nb_comptage_clim', max: 10 },
      { prefix: 'puissance_comptage_clim_', count_field: 'nb_comptage_clim', max: 10 }
    ],
    prefixes: ['comptage_clim_'],
    multiSelect: []
  },
  Comptage_Rooftop: {
    core: [
      'nb_comptage_rooftop', 'etat_vetuste_comptage_rooftop',
      'localisation_comptage_rooftop', 'commentaire_comptage_rooftop'
    ],
    dynamic: [
      { prefix: 'type_comptage_rooftop_', count_field: 'nb_comptage_rooftop', max: 10 },
      { prefix: 'connexion_comptage_rooftop_', count_field: 'nb_comptage_rooftop', max: 10 },
      { prefix: 'puissance_comptage_rooftop_', count_field: 'nb_comptage_rooftop', max: 10 }
    ],
    prefixes: ['comptage_rooftop_'],
    multiSelect: []
  },
  Comptage_Eclairage: {
    core: [
      'nb_comptage_eclairage', 'etat_vetuste_comptage_eclairage',
      'localisation_comptage_eclairage', 'commentaire_comptage_eclairage'
    ],
    dynamic: [
      { prefix: 'selection_comptage_eclairage_', count_field: 'nb_comptage_eclairage', max: 10 },
      { prefix: 'type_comptage_eclairage_', count_field: 'nb_comptage_eclairage', max: 10 },
      { prefix: 'connexion_comptage_eclairage_', count_field: 'nb_comptage_eclairage', max: 10 },
      { prefix: 'puissance_comptage_eclairage_', count_field: 'nb_comptage_eclairage', max: 10 }
    ],
    prefixes: ['comptage_eclairage_'],
    multiSelect: []
  },
};

// Utility function to get all fields for a section (replaces SECTION_FIELDS)
export const getSectionFields = (section) => {
  const registry = FIELD_REGISTRY[section];
  if (!registry) return [];
  
  const allFields = [...registry.core];
  
  // Add all possible dynamic fields
  registry.dynamic.forEach(rule => {
    for (let i = 0; i < rule.max; i++) {
      allFields.push(`${rule.prefix}${i}`);
    }
  });
  
  return allFields;
};

// Utility function to check if a field belongs to a section (replaces fragmented detection)
export const isFieldInSection = (fieldKey, section, formData = {}) => {
  const registry = FIELD_REGISTRY[section];
  if (!registry) return false;
  
  // 1. Check core fields
  if (registry.core.includes(fieldKey)) return true;
  
  // 2. Check dynamic fields with count validation
  for (const rule of registry.dynamic) {
    if (fieldKey.startsWith(rule.prefix)) {
      const index = parseInt(fieldKey.replace(rule.prefix, ''), 10);
      const count = parseInt(formData[rule.count_field], 10) || 0;
      return index < count; // Only include if within current count
    }
  }
  
  // 3. Check legacy prefixes
  return registry.prefixes.some(prefix => fieldKey.startsWith(prefix));
};

// Unified dynamic field cleanup function
export const cleanupDynamicFields = (sectionData, section) => {
  const registry = FIELD_REGISTRY[section];
  if (!registry) return sectionData;
  
  const cleaned = { ...sectionData };
  
  // Process each dynamic field rule
  registry.dynamic.forEach(rule => {
    const currentCount = parseInt(cleaned[rule.count_field], 10) || 0;
    
    // Remove fields that exceed the current count
    Object.keys(cleaned).forEach(fieldKey => {
      if (fieldKey.startsWith(rule.prefix)) {
        const index = parseInt(fieldKey.replace(rule.prefix, ''), 10);
        if (index >= currentCount) {
          delete cleaned[fieldKey];
        }
      }
    });
  });
  
  return cleaned;
};

// Legacy compatibility - keep existing SECTION_FIELDS for components that use it
export const SECTION_FIELDS = Object.fromEntries(
  Object.keys(FIELD_REGISTRY).map(section => [section, getSectionFields(section)])
);

export const styles = {
  container: {
    padding: '32px 16px',
    maxWidth: 1300,
    margin: '0 auto',
    backgroundColor: '#fff',
    minHeight: '100vh',
  },
  selectorBox: {
    maxWidth: 560,
    margin: '0 auto 40px',
    padding: 24,
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    border: '1px solid #f0f0f0',
  },
  title: {
    textAlign: 'center',
    fontWeight: 700,
    fontSize: 26,
    marginBottom: 32,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 32,
    marginTop: 32,
  },
};
