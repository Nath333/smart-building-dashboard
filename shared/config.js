/**
 * Shared configuration constants
 * Compatible with both Node.js (backend) and browser (frontend)
 */

// Check if we're in a Node.js environment
const isNode = typeof process !== 'undefined' && process.env !== undefined;
const isProduction = isNode
  ? process.env.NODE_ENV === 'production'
  : false; // Frontend uses Vite's import.meta.env

export const Config = {
  API: {
    DEFAULT_PORT: 3001,
    DEFAULT_URL: 'http://localhost:3001/api',
    TIMEOUT: 5000, // 5 seconds
  },
  DATA: {
    REFRESH_INTERVAL: 30000, // 30 seconds
    HISTORY_HOURS: 24,
    TEMPERATURE_DAYS: 7,
  },
  LOGGING: {
    ENABLED: true,
    LEVEL: isProduction ? 'error' : 'debug',
  },
};
