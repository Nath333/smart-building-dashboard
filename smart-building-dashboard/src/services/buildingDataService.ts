import type { BuildingData, EnergyData, TemperatureData } from '../types';

// Mock data generator - replace with real API calls later
export class BuildingDataService {
  private static generateEnergyHistory(): EnergyData[] {
    const data: EnergyData[] = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString(),
        consumption: Math.random() * 50 + 100, // 100-150 kWh
        realTime: Math.random() * 5000 + 3000, // 3000-8000 watts
      });
    }

    return data;
  }

  private static generateTemperatureHistory(): TemperatureData[] {
    const data: TemperatureData[] = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      data.push({
        date: days[i],
        indoor: Math.random() * 4 + 20, // 20-24°C
        outdoor: Math.random() * 10 + 10, // 10-20°C
      });
    }

    return data;
  }

  static async fetchBuildingData(): Promise<BuildingData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const isOnline = Math.random() > 0.1; // 90% online

    return {
      status: {
        isOnline,
        lastUpdated: new Date(),
      },
      energy: {
        realTime: Math.random() * 5000 + 3000,
        historical: this.generateEnergyHistory(),
      },
      temperature: this.generateTemperatureHistory(),
      environmental: {
        humidity: Math.random() * 20 + 40, // 40-60%
        co2Level: Math.random() * 400 + 400, // 400-800 ppm
        airQuality: Math.random() > 0.7 ? 'good' : Math.random() > 0.3 ? 'moderate' : 'poor',
      },
      devices: [
        {
          id: '1',
          name: 'HVAC System',
          type: 'Climate Control',
          isConnected: isOnline,
          lastSeen: new Date(),
        },
        {
          id: '2',
          name: 'Lighting System',
          type: 'Lighting',
          isConnected: isOnline,
          lastSeen: new Date(),
        },
        {
          id: '3',
          name: 'Security System',
          type: 'Security',
          isConnected: isOnline,
          lastSeen: new Date(),
        },
        {
          id: '4',
          name: 'Energy Meter',
          type: 'Monitoring',
          isConnected: isOnline,
          lastSeen: new Date(),
        },
      ],
    };
  }

  // Future API integration points
  static async updateDeviceStatus(deviceId: string, status: boolean): Promise<void> {
    // TODO: Implement API call
    console.log(`Updating device ${deviceId} to ${status}`);
  }

  static async getHistoricalData(startDate: Date, endDate: Date): Promise<EnergyData[]> {
    // TODO: Implement API call
    console.log(`Fetching data from ${startDate} to ${endDate}`);
    return this.generateEnergyHistory();
  }
}
