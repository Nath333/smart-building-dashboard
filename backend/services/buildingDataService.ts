import type {
  BuildingData,
  BuildingStatus,
  EnergyData,
  TemperatureData,
  EnvironmentalData,
  DeviceStatus
} from '../types';

// Backend data service - generates realistic building data
export class BuildingDataService {
  private static buildingOnline = true;
  private static lastUpdated = new Date();

  private static generateEnergyHistory(): EnergyData[] {
    const data: EnergyData[] = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hour = timestamp.getHours();

      // More realistic energy consumption based on time of day
      let baseConsumption = 100;
      if (hour >= 6 && hour < 9) baseConsumption = 150; // Morning peak
      else if (hour >= 9 && hour < 17) baseConsumption = 130; // Business hours
      else if (hour >= 17 && hour < 22) baseConsumption = 140; // Evening peak
      else baseConsumption = 80; // Night low

      data.push({
        timestamp: timestamp.toISOString(),
        consumption: baseConsumption + Math.random() * 20,
        realTime: (baseConsumption * 1000) + Math.random() * 2000,
      });
    }

    return data;
  }

  private static generateTemperatureHistory(): TemperatureData[] {
    const data: TemperatureData[] = [];
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    for (let i = 0; i < 7; i++) {
      // Indoor temperature stays relatively stable
      const indoor = 21 + Math.random() * 2; // 21-23°C

      // Outdoor temperature varies more
      const outdoor = 12 + Math.random() * 8; // 12-20°C

      data.push({
        date: days[i],
        indoor,
        outdoor,
      });
    }

    return data;
  }

  private static generateEnvironmentalData(): EnvironmentalData {
    const humidity = 45 + Math.random() * 10; // 45-55%
    const co2Level = 450 + Math.random() * 250; // 450-700 ppm

    let airQuality: 'good' | 'moderate' | 'poor';
    if (co2Level < 600) airQuality = 'good';
    else if (co2Level < 800) airQuality = 'moderate';
    else airQuality = 'poor';

    return {
      humidity,
      co2Level,
      airQuality,
    };
  }

  private static generateDevices(): DeviceStatus[] {
    const isOnline = this.buildingOnline;

    return [
      {
        id: '1',
        name: 'Système CVC',
        type: 'Contrôle Climatique',
        isConnected: isOnline && Math.random() > 0.05,
        lastSeen: new Date(),
      },
      {
        id: '2',
        name: 'Système d\'Éclairage',
        type: 'Éclairage',
        isConnected: isOnline && Math.random() > 0.02,
        lastSeen: new Date(),
      },
      {
        id: '3',
        name: 'Système de Sécurité',
        type: 'Sécurité',
        isConnected: isOnline && Math.random() > 0.01,
        lastSeen: new Date(),
      },
      {
        id: '4',
        name: 'Compteur d\'Énergie',
        type: 'Surveillance',
        isConnected: isOnline,
        lastSeen: new Date(),
      },
    ];
  }

  // Public API methods
  static async getBuildingData(): Promise<BuildingData> {
    // Simulate database/sensor query delay
    await new Promise(resolve => setTimeout(resolve, 100));

    this.lastUpdated = new Date();

    const energyHistory = this.generateEnergyHistory();
    const latestEnergy = energyHistory[energyHistory.length - 1];

    return {
      status: {
        isOnline: this.buildingOnline,
        lastUpdated: this.lastUpdated,
      },
      energy: {
        realTime: latestEnergy.realTime,
        historical: energyHistory,
      },
      temperature: this.generateTemperatureHistory(),
      environmental: this.generateEnvironmentalData(),
      devices: this.generateDevices(),
    };
  }

  static async getBuildingStatus(): Promise<BuildingStatus> {
    return {
      isOnline: this.buildingOnline,
      lastUpdated: this.lastUpdated,
    };
  }

  static async getCurrentEnergy(): Promise<{ realTime: number }> {
    const history = this.generateEnergyHistory();
    const latest = history[history.length - 1];
    return { realTime: latest.realTime };
  }

  static async getEnergyHistory(): Promise<EnergyData[]> {
    return this.generateEnergyHistory();
  }

  static async getTemperatureWeek(): Promise<TemperatureData[]> {
    return this.generateTemperatureHistory();
  }

  static async getEnvironmentalData(): Promise<EnvironmentalData> {
    return this.generateEnvironmentalData();
  }

  static async getDevices(): Promise<DeviceStatus[]> {
    return this.generateDevices();
  }

  static async updateDeviceStatus(deviceId: string, status: boolean): Promise<void> {
    // In a real app, this would update the database
    console.log(`Device ${deviceId} updated to ${status ? 'connected' : 'disconnected'}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  static async getHistoricalData(startDate: Date, endDate: Date): Promise<EnergyData[]> {
    // In a real app, this would query based on date range
    console.log(`Fetching data from ${startDate} to ${endDate}`);
    return this.generateEnergyHistory();
  }
}
