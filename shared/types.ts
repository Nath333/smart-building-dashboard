/**
 * Shared types between frontend and backend
 * Single source of truth for data structures
 */

export interface BuildingStatus {
  isOnline: boolean;
  lastUpdated: Date;
}

export interface EnergyData {
  timestamp: string;
  consumption: number; // kWh
  realTime: number; // current watts
}

export interface TemperatureData {
  date: string;
  indoor: number; // Celsius
  outdoor: number; // Celsius
}

export type AirQuality = 'good' | 'moderate' | 'poor';

export interface EnvironmentalData {
  humidity: number; // percentage (0-100)
  co2Level: number; // ppm (parts per million)
  airQuality: AirQuality;
}

export interface DeviceStatus {
  id: string;
  name: string;
  type: string;
  isConnected: boolean;
  lastSeen: Date;
}

export interface BuildingData {
  status: BuildingStatus;
  energy: {
    realTime: number;
    historical: EnergyData[];
  };
  temperature: TemperatureData[];
  environmental: EnvironmentalData;
  devices: DeviceStatus[];
}

/**
 * API Response wrapper for error handling
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Constants for data validation
 */
export const DataConstants = {
  TEMPERATURE: {
    MIN_INDOOR: 15,
    MAX_INDOOR: 30,
    MIN_OUTDOOR: -10,
    MAX_OUTDOOR: 40,
  },
  ENERGY: {
    MIN_CONSUMPTION: 50,
    MAX_CONSUMPTION: 200,
    MIN_REALTIME: 1000,
    MAX_REALTIME: 10000,
  },
  ENVIRONMENTAL: {
    MIN_HUMIDITY: 30,
    MAX_HUMIDITY: 70,
    MIN_CO2: 350,
    MAX_CO2: 1000,
  },
} as const;
