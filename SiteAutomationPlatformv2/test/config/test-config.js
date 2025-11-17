/**
 * Enhanced Test Configuration for Ultra-High Accuracy
 * Provides precise settings and validation for comprehensive testing
 *
 * Note: Uses centralized API_BASE_URL from app.config.js for consistency
 */

// Import centralized config (backend port)
const API_BASE_URL = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:4001';

export const TEST_CONFIG = {
  // Server Configuration
  server: {
    baseURL: API_BASE_URL,
    timeout: 15000, // Increased timeout for complex operations
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // Accuracy Settings
  accuracy: {
    responseTimeThreshold: 500, // ms - tests fail if slower
    dataValidationStrict: true,
    precisionValidation: true,
    typeChecking: true,
    fieldPresenceValidation: true,
  },

  // Test Data Precision
  testData: {
    siteNamePattern: /^[a-zA-Z0-9_]+$/,
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phonePattern: /^\d{3}-\d{4}$/,
    maxTextLength: 500,
    maxArrayItems: 50,
  },

  // Database Validation
  database: {
    validateConstraints: true,
    checkReferentialIntegrity: true,
    enforceDataTypes: true,
    validateJSONFields: true,
  },

  // Security Testing
  security: {
    testSqlInjection: true,
    testXssPayloads: true,
    validateInputSanitization: true,
    checkAuthenticationBypass: true,
  },

  // Performance Benchmarks
  performance: {
    maxConcurrentRequests: 20,
    maxResponseTime: 2000,
    memoryLeakDetection: true,
    loadTestDuration: 30000, // 30 seconds
  },

  // Expected Response Structures
  expectedStructures: {
    siteInfo: {
      required: ['site', 'client'],
      optional: ['address', 'number1', 'number2', 'email'],
      types: {
        site: 'string',
        client: 'string',
        address: 'string',
        number1: 'string',
        number2: 'string',
        email: 'string'
      }
    },
    equipment: {
      required: ['site'],
      optional: [
        'nb_aerotherme', 'zone_aerotherme', 'thermostat_aerotherme',
        'nb_clim_ir', 'nb_clim_wire', 'zone_clim',
        'nb_rooftop', 'zone_rooftop'
      ],
      types: {
        site: 'string',
        nb_aerotherme: ['string', 'number'],
        nb_clim_ir: ['string', 'number'],
        nb_clim_wire: ['string', 'number'],
        nb_rooftop: ['string', 'number']
      }
    },
    gtbConfig: {
      required: ['site', 'modules'],
      optional: ['refs', 'sondes', 'sondesPresentes', 'gazCompteur', 'Izit'],
      types: {
        site: 'string',
        modules: 'array',
        refs: 'object',
        sondes: ['string', 'number'],
        sondesPresentes: ['string', 'number']
      }
    },
    imageData: {
      required: ['site', 'type', 'title'],
      optional: ['url_viewer', 'delete_url', 'shapes', 'width', 'height'],
      types: {
        site: 'string',
        type: 'string',
        title: 'string',
        shapes: 'array',
        width: 'number',
        height: 'number'
      }
    }
  },

  // Test Categories with Precision Settings
  categories: {
    connectivity: {
      name: 'System Connectivity',
      timeout: 5000,
      retries: 2,
      criticalFailureThreshold: 0
    },
    crud: {
      name: 'CRUD Operations',
      timeout: 10000,
      retries: 1,
      criticalFailureThreshold: 5
    },
    images: {
      name: 'Image Operations',
      timeout: 20000,
      retries: 2,
      criticalFailureThreshold: 10
    },
    security: {
      name: 'Security Validation',
      timeout: 15000,
      retries: 0,
      criticalFailureThreshold: 0
    },
    performance: {
      name: 'Performance Testing',
      timeout: 30000,
      retries: 1,
      criticalFailureThreshold: 20
    },
    integration: {
      name: 'Integration Testing',
      timeout: 25000,
      retries: 2,
      criticalFailureThreshold: 15
    }
  },

  // Validation Rules
  validation: {
    strictTypeChecking: true,
    validateResponseHeaders: true,
    checkResponseTiming: true,
    validateDatabaseConsistency: true,
    enforceBusinessRules: true
  },

  // Error Classification
  errorClassification: {
    critical: ['connection_failed', 'data_corruption', 'security_breach'],
    major: ['timeout', 'validation_failed', 'data_inconsistency'],
    minor: ['performance_degraded', 'warning_triggered'],
    acceptable: ['expected_validation_error', 'rate_limit']
  },

  // Cleanup Configuration
  cleanup: {
    autoCleanupTestData: true,
    preserveFailedTestData: true,
    maxTestDataAge: 3600000, // 1 hour in ms
    cleanupRetries: 3
  }
};

export default TEST_CONFIG;