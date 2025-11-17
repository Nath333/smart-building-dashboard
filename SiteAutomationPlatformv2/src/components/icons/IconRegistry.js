// Centralized icon registry for both visualPlan and gtbPlan
export const ICON_TYPES = {
  // Equipment types
  AEROTHERME: 'aerotherme',
  CLIM_IR: 'clim_ir',
  CLIM_WIRE: 'clim_wire',
  ROOFTOP: 'rooftop',
  
  // GTB/Control types
  AERO_EAU: 'aero_eau',
  AERO_GAZ: 'aero_gaz',
  CLIM_FILAIRE_SIMPLE: 'clim_filaire_simple',
  CLIM_FILAIRE_GROUPE: 'clim_filaire_groupe',
  ECLAIRAGE: 'eclairage',
  
  // Accessories 
  COFFRET_CLIM: 'coffret_clim',
  COFFRET_AEROTHERME: 'coffret_aerotherme',
  REMOTE_CONTROL: 'remote_control',
  CIRCLE: 'circle',
  
  // Monitoring/Sensors (Comptage by equipment type)
  COMPTAGE_AEROTHERME: 'comptage_aerotherme',
  COMPTAGE_CLIMATE: 'comptage_climate',
  COMPTAGE_ROOFTOP: 'comptage_rooftop',
  COMPTAGE_LIGHTING: 'comptage_lighting',
  COMPTAGE_FROID: 'comptage_froid', // Legacy/alias for climate
  COMPTAGE_ECLAIRAGE: 'comptage_eclairage', // Legacy/alias for lighting
  SONDES: 'sondes',
  SONDES_PRESENTES: 'sondes_presentes',
  GAZ_COMPTEUR: 'gaz_compteur',
  IZIT: 'izit',
};

// Icon metadata for both systems
export const ICON_CONFIG = {
  [ICON_TYPES.AEROTHERME]: {
    label: 'Aerotherme',
    labelGtb: 'Contacts Aéro Eau',
    color: '#ad2a2aff',
    category: 'equipment'
  },
  [ICON_TYPES.CLIM_IR]: {
    label: 'Clim IR',
    labelGtb: 'Télécommandes Clim IR', 
    color: '#1976D2',
    category: 'climate'
  },
  [ICON_TYPES.CLIM_WIRE]: {
    label: 'Clim Fil',
    labelGtb: 'Clim Filaire',
    color: '#2196F3',
    category: 'climate'
  },
  [ICON_TYPES.ROOFTOP]: {
    label: 'Rooftop',
    labelGtb: 'Télécommandes Rooftop',
    color: '#4CAF50',
    category: 'equipment'
  },
  [ICON_TYPES.AERO_EAU]: {
    label: 'Aero Eau',
    labelGtb: 'Contacts Aéro Eau',
    color: '#2196F3',
    category: 'gtb'
  },
  [ICON_TYPES.AERO_GAZ]: {
    label: 'Aero Gaz',
    labelGtb: 'Contacts Aéro Gaz',
    color: '#FF9800',
    category: 'gtb'
  },
  [ICON_TYPES.CLIM_FILAIRE_SIMPLE]: {
    label: 'Clim Filaire Simple',
    labelGtb: 'Clim Filaire Simple',
    color: '#03A9F4',
    category: 'gtb'
  },
  [ICON_TYPES.CLIM_FILAIRE_GROUPE]: {
    label: 'Clim Filaire Groupe',
    labelGtb: 'Clim Filaire Groupe',
    color: '#0288D1',
    category: 'gtb'
  },
  [ICON_TYPES.ECLAIRAGE]: {
    label: 'Éclairage',
    labelGtb: 'Contacts Éclairage',
    color: '#FFD700',
    category: 'lighting'
  },
  [ICON_TYPES.COFFRET_CLIM]: {
    label: 'Coffret Clim',
    labelGtb: 'Coffret Clim',
    color: '#607D8B',
    category: 'control'
  },
  [ICON_TYPES.COFFRET_AEROTHERME]: {
    label: 'Coffret Aero',
    labelGtb: 'Coffret Aero',
    color: '#795548',
    category: 'control'
  },
  [ICON_TYPES.REMOTE_CONTROL]: {
    label: 'Cmd Clim Fil',
    labelGtb: 'Télécommande',
    color: '#9C27B0',
    category: 'control'
  },
  [ICON_TYPES.COMPTAGE_AEROTHERME]: {
    label: 'Comptage Aérotherme',
    labelGtb: 'Compteurs Aérotherme',
    color: '#D84315',
    category: 'monitoring'
  },
  [ICON_TYPES.COMPTAGE_CLIMATE]: {
    label: 'Comptage Climatisation',
    labelGtb: 'Compteurs Climatisation',
    color: '#00BCD4',
    category: 'monitoring'
  },
  [ICON_TYPES.COMPTAGE_ROOFTOP]: {
    label: 'Comptage Rooftop',
    labelGtb: 'Compteurs Rooftop',
    color: '#558B2F',
    category: 'monitoring'
  },
  [ICON_TYPES.COMPTAGE_LIGHTING]: {
    label: 'Comptage Éclairage',
    labelGtb: 'Compteurs Éclairage',
    color: '#FFC107',
    category: 'monitoring'
  },
  [ICON_TYPES.COMPTAGE_FROID]: {
    label: 'Comptage Froid',
    labelGtb: 'Compteurs Froid',
    color: '#00BCD4',
    category: 'monitoring'
  },
  [ICON_TYPES.COMPTAGE_ECLAIRAGE]: {
    label: 'Comptage Éclairage',
    labelGtb: 'Compteurs Éclairage',
    color: '#FFC107',
    category: 'monitoring'
  },
  [ICON_TYPES.SONDES]: {
    label: 'Sondes',
    labelGtb: 'Sondes Température',
    color: '#E91E63',
    category: 'sensor'
  },
  [ICON_TYPES.SONDES_PRESENTES]: {
    label: 'Sondes Présence',
    labelGtb: 'Sondes Présence',
    color: '#9E9E9E',
    category: 'sensor'
  },
  [ICON_TYPES.GAZ_COMPTEUR]: {
    label: 'Compteur Gaz',
    labelGtb: 'Compteur Gaz',
    color: '#FF5722',
    category: 'monitoring'
  },
  [ICON_TYPES.IZIT]: {
    label: 'GTB',
    labelGtb: 'Coffret GTB',
    color: '#3F51B5',
    category: 'gtb'
  },
  [ICON_TYPES.CIRCLE]: {
    label: 'Zone',
    labelGtb: 'Zone',
    color: '#666666',
    category: 'utility'
  }
};

// Icon sets for different contexts
export const VISUAL_PLAN_ICONS = [
  ICON_TYPES.AEROTHERME,
  ICON_TYPES.CLIM_IR,
  ICON_TYPES.CLIM_WIRE,
  ICON_TYPES.ROOFTOP,
  ICON_TYPES.REMOTE_CONTROL,
  ICON_TYPES.COFFRET_CLIM,
  ICON_TYPES.COFFRET_AEROTHERME,
  ICON_TYPES.CIRCLE,
];

export const GTB_PLAN_ICONS = [
  ICON_TYPES.AERO_EAU,
  ICON_TYPES.AERO_GAZ, 
  ICON_TYPES.ROOFTOP,
  ICON_TYPES.ECLAIRAGE,
  ICON_TYPES.CLIM_IR,
  ICON_TYPES.CLIM_FILAIRE_SIMPLE,
  ICON_TYPES.CLIM_FILAIRE_GROUPE,
  ICON_TYPES.COMPTAGE_FROID,
  ICON_TYPES.COMPTAGE_ECLAIRAGE,
  ICON_TYPES.SONDES,
  ICON_TYPES.SONDES_PRESENTES,
  ICON_TYPES.GAZ_COMPTEUR,
  ICON_TYPES.IZIT,
];