import { Config } from '../../shared/config.js';
import { MockDataService } from './mockDataService.js';

/**
 * API client for backend data service
 * Handles all communication with the backend REST API
 * Falls back to mock data when backend is unavailable (e.g., on GitHub Pages)
 */
export class BuildingDataService {
  static API_URL = import.meta.env.VITE_API_URL || Config.API.DEFAULT_URL;
  static useMockData = false; // Will be set to true if backend is unavailable

  /**
   * Fetch data from API with error handling and type conversion
   */
  static async fetchAPI(endpoint, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Config.API.TIMEOUT);

    try {
      const response = await fetch(`${this.API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `API error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      // Convert date strings to Date objects
      return this.convertDates(result.data);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${Config.API.TIMEOUT}ms`);
        }
        console.error(`Failed to fetch ${endpoint}:`, error.message);
        throw error;
      }
      throw new Error('Unknown error occurred');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  static convertDates(obj) {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      // Check if string is an ISO date
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      if (dateRegex.test(obj)) {
        return new Date(obj);
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertDates(item));
    }

    if (typeof obj === 'object') {
      const converted = {};
      for (const key in obj) {
        if (key === 'lastUpdated' || key === 'lastSeen') {
          converted[key] = new Date(obj[key]);
        } else {
          converted[key] = this.convertDates(obj[key]);
        }
      }
      return converted;
    }

    return obj;
  }

  static async fetchBuildingData() {
    // If we've already determined to use mock data, use it directly
    if (this.useMockData) {
      console.info('Using mock data (backend unavailable)');
      return MockDataService.generateMockData();
    }

    try {
      return await this.fetchAPI('/building/data');
    } catch (error) {
      // If API fails, switch to mock data mode
      console.warn('Backend unavailable, switching to mock data mode:', error.message);
      this.useMockData = true;
      return MockDataService.generateMockData();
    }
  }

  static async updateDeviceStatus(deviceId, status) {
    await this.fetchAPI(`/building/devices/${deviceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isConnected: status }),
    });
  }

  static async getHistoricalData(startDate, endDate) {
    // Include date range as query parameters
    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });
    return this.fetchAPI(`/building/energy/history?${params}`);
  }
}
