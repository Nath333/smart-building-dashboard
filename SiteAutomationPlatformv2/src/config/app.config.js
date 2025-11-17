/**
 * Centralized Application Configuration
 * Single source of truth for all API endpoints and environment settings
 *
 * Usage:
 *   import { API_BASE_URL } from '@/config/app.config';
 *   const response = await fetch(`${API_BASE_URL}/endpoint`);
 */

// Determine environment
const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

// Frontend Configuration
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5177';

// External Services
export const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || import.meta.env.VITE_IMGBB_KEY || '7be8ca9b4ade9518e1515f4832884239';

// Application Settings
export const APP_CONFIG = {
  // API Settings
  api: {
    baseUrl: API_BASE_URL,
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },

  // Image Settings
  image: {
    maxSizeMB: 5,
    maxDimensions: 2048,
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    compressionQuality: 0.8,
  },

  // Storage Settings
  storage: {
    prefix: 'siteAutomation_', // localStorage key prefix
    enablePersistence: true,
  },

  // Feature Flags
  features: {
    enableAutoSave: true,
    autoSaveInterval: 30000, // 30 seconds
    enableOfflineMode: false,
    enableMultiUserEditing: false,
  },

  // Environment
  env: {
    isDevelopment,
    isProduction,
    mode: import.meta.env.MODE,
  },
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

// Helper function to validate configuration
export const validateConfig = () => {
  const errors = [];

  if (!API_BASE_URL) {
    errors.push('API_BASE_URL is not configured');
  }

  if (!IMGBB_API_KEY && isProduction) {
    errors.push('IMGBB_API_KEY is required in production');
  }

  if (errors.length > 0) {
    console.error('Configuration Errors:', errors);
    return false;
  }

  return true;
};

// Log configuration on startup (development only)
if (isDevelopment) {
  console.log('🔧 App Configuration Loaded:', {
    apiBaseUrl: API_BASE_URL,
    frontendUrl: FRONTEND_URL,
    environment: import.meta.env.MODE,
  });
}

export default APP_CONFIG;
