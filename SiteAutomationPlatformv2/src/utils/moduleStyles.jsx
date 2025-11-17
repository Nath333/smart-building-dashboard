/**
 * moduleStyles.js
 * ----------------
 * Centralized style definitions for draggable card types.
 * Each style includes width, height, borderRadius, and backgroundColor.
 * Used by DraggableIcon for visual rendering of UI cards.
 * 
 * Note: Some modules have context-specific variants (e.g., aero module
 * dimensions differ between visual plans and GTB plans)
 */

const moduleStyles = {
  // ✅ Sensors
  sonde: {
    width: 40,
    height: 40,
    borderRadius: '30%', // circle-like
    backgroundColor: '#52c41a', // green - active probe
  },
  present: {
    width: 40,
    height: 40,
    borderRadius: '30%',
    backgroundColor: '#8c8c8c', // neutral grey - presence marker
  },

  // ✅ HVAC Modules
  aero: {
    // Default size for GTB plans
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: '#faad14', // orange - air handler
    // For visual plans, use aero.visualPlan variant
    visualPlan: {
      width: 340,
      height: 340,
      borderRadius: 50,
      backgroundColor: '#faad14',
    }
  },
  rooftop: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: '#13c2c2', // cyan - rooftop unit
  },
  clim: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: '#eb2f96', // pink - climate module
  },

  // ✅ Generic control
  control: {
    width: 80,
    height: 20,
    borderRadius: 50,
    backgroundColor: '#1890ff', // Ant Design blue
  },

  // ✅ Electrical Panels (TDs and TGBT)
  tgbt: {
    width: 80,
    height: 20,
    borderRadius: 50,
    backgroundColor: '#002766', // dark blue - main panel
  },
  td1: {
    width: 80,
    height: 20,
    borderRadius: 50,
    backgroundColor: '#0050b3', // blue
  },
  td2: {
    width: 80,
    height: 20,
    borderRadius: 50,
    backgroundColor: '#096dd9',
  },
  td3: {
    width: 80,
    height: 20,
    borderRadius: 50,
    backgroundColor: '#1890ff',
  },
  tdfroid: {
    width: 80,
    height: 20,
    borderRadius: 50,
    backgroundColor: '#eb2f96', // light blue - cold zone
  },

  // ✅ Specialized control enclosures
  coffretaero: {
    width: 80,
    height: 20,
    borderRadius: 50,
    backgroundColor: '#ffc53d', // warm yellow-orange
  },
  commandeeclairage: {
    width: 80,
    height: 20,
    borderRadius: 50,
    backgroundColor: '#d3adf7', // light purple - lighting control
  },
  commandeaero: {
    width: 90,
    height: 20,
    borderRadius: 50,
    backgroundColor: '#d3adf7', // light purple - lighting control
  },
};

/**
 * Helper function to get module styles with context-specific overrides
 * @param {string} moduleType - The module type key
 * @param {string} context - Optional context ('visualPlan', 'gtbPlan', etc.)
 * @returns {object} Style object for the module
 */
export const getModuleStyle = (moduleType, context = null) => {
  const baseStyle = moduleStyles[moduleType];
  if (!baseStyle) return {};
  
  if (context && baseStyle[context]) {
    return { ...baseStyle, ...baseStyle[context] };
  }
  
  return baseStyle;
};

export default moduleStyles;