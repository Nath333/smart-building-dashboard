// Shared types between frontend and backend
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
  indoor: number;
  outdoor: number;
}

export interface EnvironmentalData {
  humidity: number; // percentage
  co2Level: number; // ppm
  airQuality: 'good' | 'moderate' | 'poor';
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
