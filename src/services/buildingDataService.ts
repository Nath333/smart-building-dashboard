import type { BuildingData, EnergyData, ApiResponse } from '../types';
import { Config } from '../../shared/config';

/**
 * API client for backend data service
 * Handles all communication with the backend REST API
 */
export class BuildingDataService {
  private static readonly API_URL = import.meta.env.VITE_API_URL || Config.API.DEFAULT_URL;

  /**
   * Fetch data from API with error handling and type conversion
   */
  private static async fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
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

      const result: ApiResponse<T> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      // Convert date strings to Date objects
      return this.convertDates(result.data as T);
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

  private static convertDates(obj: any): any {
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
      const converted: any = {};
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

  static async fetchBuildingData(): Promise<BuildingData> {
    return this.fetchAPI<BuildingData>('/building/data');
  }

  static async updateDeviceStatus(deviceId: string, status: boolean): Promise<void> {
    await this.fetchAPI(`/building/devices/${deviceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isConnected: status }),
    });
  }

  static async getHistoricalData(startDate: Date, endDate: Date): Promise<EnergyData[]> {
    // Include date range as query parameters
    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });
    return this.fetchAPI<EnergyData[]>(`/building/energy/history?${params}`);
  }
}
