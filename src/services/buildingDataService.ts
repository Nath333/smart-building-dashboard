import type { BuildingData, EnergyData } from '../types';

// API client for backend data service
export class BuildingDataService {
  private static readonly API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  private static async fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Convert date strings to Date objects
      return this.convertDates(data);
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}:`, error);
      throw error;
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
