/**
 * Request validation utilities
 */

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validators = {
  /**
   * Validate device ID format
   */
  isValidDeviceId(id) {
    return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0 && id.length < 100;
  },

  /**
   * Validate date range
   */
  isValidDateRange(startDate, endDate) {
    return startDate < endDate && startDate <= new Date();
  },

  /**
   * Validate boolean value
   */
  isBoolean(value) {
    return typeof value === 'boolean';
  },
};
