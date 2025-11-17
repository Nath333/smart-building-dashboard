/**
 * Shared configuration constants
 */

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
    LEVEL: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  },
} as const;
