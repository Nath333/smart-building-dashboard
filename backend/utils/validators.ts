/**
 * Request validation utilities
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validators = {
  /**
   * Validate device ID format
   */
  isValidDeviceId(id: string): boolean {
    return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0 && id.length < 100;
  },

  /**
   * Validate date range
   */
  isValidDateRange(startDate: Date, endDate: Date): boolean {
    return startDate < endDate && startDate <= new Date();
  },

  /**
   * Validate boolean value
   */
  isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  },
};
