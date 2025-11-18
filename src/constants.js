/**
 * Application constants and configuration
 * Centralized location for all app-wide constants
 */

/**
 * Chart configuration constants
 */
export const CHART_CONFIG = {
  // Chart dimensions
  DEFAULT_HEIGHT: 300,
  RESPONSIVE_WIDTH: '100%',

  // Chart colors
  GRID_STROKE: '#e0e0e0',
  AXIS_STROKE: '#666',
  PRIMARY_LINE: '#2563eb',
  INDOOR_TEMP: '#ef4444',
  OUTDOOR_TEMP: '#3b82f6',
  INDOOR_FILL: '#fecaca',
  OUTDOOR_FILL: '#bfdbfe',

  // Chart text
  TICK_FONT_SIZE: 12,
  STROKE_WIDTH: 2,
  GRID_DASH: '3 3',

  // Tooltip styling
  TOOLTIP_BG: '#fff',
  TOOLTIP_BORDER: '1px solid #ccc',
  TOOLTIP_RADIUS: '8px',
};

/**
 * Icon sizes
 */
export const ICON_SIZES = {
  SMALL: 20,
  MEDIUM: 24,
  LARGE: 32,
  XLARGE: 48,
};

/**
 * Air quality thresholds and colors
 */
export const AIR_QUALITY = {
  THRESHOLDS: {
    GOOD: 600,
    MODERATE: 800,
  },
  COLORS: {
    GOOD: '#22c55e',
    MODERATE: '#f59e0b',
    POOR: '#ef4444',
    DEFAULT: '#6b7280',
  },
  LABELS: {
    GOOD: 'Bon',
    MODERATE: 'Modéré',
    POOR: 'Mauvais',
  },
};

/**
 * Environmental metric thresholds
 */
export const ENVIRONMENTAL_THRESHOLDS = {
  HUMIDITY: {
    LOW: 30,
    HIGH: 60,
  },
  CO2: {
    GOOD: 600,
    MODERATE: 800,
  },
};

/**
 * Environmental status labels
 */
export const ENVIRONMENTAL_LABELS = {
  HUMIDITY: {
    LOW: 'Faible',
    OPTIMAL: 'Optimal',
    HIGH: 'Élevé',
  },
  CO2: {
    EXCELLENT: 'Excellent',
    GOOD: 'Bon',
    MODERATE: 'Moyen',
  },
};

/**
 * Environmental metric styling
 */
export const ENVIRONMENTAL_COLORS = {
  HUMIDITY: {
    BG: '#e0f2fe',
    ICON: '#0284c7',
  },
  CO2: {
    BG: '#fef3c7',
    ICON: '#d97706',
  },
};

/**
 * Locale configuration
 */
export const LOCALE = {
  LANGUAGE: 'fr-FR',
  TIMEZONE: 'Europe/Paris',
};

/**
 * Auto-refresh configuration
 */
export const AUTO_REFRESH = {
  INTERVAL: 30000, // 30 seconds
  ENABLED: true,
};

/**
 * Device types
 */
export const DEVICE_TYPES = {
  HVAC: 'Contrôle Climatique',
  LIGHTING: 'Éclairage',
  SECURITY: 'Sécurité',
  MONITORING: 'Surveillance',
};

/**
 * Week days in French
 */
export const WEEKDAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
