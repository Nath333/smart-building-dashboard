import { DataConstants } from '../../shared/types.js';
import { logger } from '../utils/logger.js';

/**
 * Backend data service - generates realistic building data
 * In production, replace with actual IoT sensor integrations
 */
export class BuildingDataService {
  static buildingOnline = true;
  static lastUpdated = new Date();
  static energyBaseline = 120; // Base consumption in kWh

  /**
   * Generate realistic 24-hour energy consumption history
   * Patterns: Morning peak (6-9), Business hours (9-17), Evening peak (17-22), Night low
   */
  static generateEnergyHistory() {
    const data = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hour = timestamp.getHours();

      // Time-based consumption patterns
      let baseConsumption = this.energyBaseline;
      if (hour >= 6 && hour < 9) baseConsumption = 145; // Morning peak
      else if (hour >= 9 && hour < 17) baseConsumption = 125; // Business hours
      else if (hour >= 17 && hour < 22) baseConsumption = 135; // Evening peak
      else baseConsumption = 75; // Night low

      // Add realistic variation (±10%)
      const variation = (Math.random() - 0.5) * 20;
      const consumption = Math.max(
        DataConstants.ENERGY.MIN_CONSUMPTION,
        Math.min(DataConstants.ENERGY.MAX_CONSUMPTION, baseConsumption + variation)
      );

      data.push({
        timestamp: timestamp.toISOString(),
        consumption: Math.round(consumption * 100) / 100,
        realTime: Math.round(consumption * 1000),
      });
    }

    return data;
  }

  /**
   * Generate 7-day temperature history
   * Indoor: controlled climate (21-23°C)
   * Outdoor: natural variation
   */
  static generateTemperatureHistory() {
    const data = [];
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    for (let i = 0; i < 7; i++) {
      // Indoor temperature: HVAC-controlled, stable
      const indoorBase = 21.5;
      const indoorVariation = (Math.random() - 0.5) * 2;
      const indoor = Math.round((indoorBase + indoorVariation) * 10) / 10;

      // Outdoor temperature: more variable, slight upward trend
      const outdoorBase = 15 + (i * 0.5); // Gradual warming
      const outdoorVariation = (Math.random() - 0.5) * 6;
      const outdoor = Math.round((outdoorBase + outdoorVariation) * 10) / 10;

      data.push({
        date: days[i],
        indoor: Math.max(DataConstants.TEMPERATURE.MIN_INDOOR, Math.min(DataConstants.TEMPERATURE.MAX_INDOOR, indoor)),
        outdoor: Math.max(DataConstants.TEMPERATURE.MIN_OUTDOOR, Math.min(DataConstants.TEMPERATURE.MAX_OUTDOOR, outdoor)),
      });
    }

    return data;
  }

  /**
   * Generate current environmental metrics
   * Air quality based on CO2 levels: <600 = good, 600-800 = moderate, >800 = poor
   */
  static generateEnvironmentalData() {
    const humidity = Math.round((48 + Math.random() * 8) * 10) / 10; // 48-56%
    const co2Level = Math.round(420 + Math.random() * 280); // 420-700 ppm

    let airQuality;
    if (co2Level < 600) airQuality = 'good';
    else if (co2Level < 800) airQuality = 'moderate';
    else airQuality = 'poor';

    return {
      humidity: Math.max(DataConstants.ENVIRONMENTAL.MIN_HUMIDITY, Math.min(DataConstants.ENVIRONMENTAL.MAX_HUMIDITY, humidity)),
      co2Level: Math.max(DataConstants.ENVIRONMENTAL.MIN_CO2, Math.min(DataConstants.ENVIRONMENTAL.MAX_CO2, co2Level)),
      airQuality,
    };
  }

  /**
   * Generate building device statuses
   * 95%+ uptime for critical systems
   */
  static generateDevices() {
    const isOnline = this.buildingOnline;

    return [
      {
        id: 'hvac-001',
        name: 'Système CVC',
        type: 'Contrôle Climatique',
        isConnected: isOnline && Math.random() > 0.02, // 98% uptime
        lastSeen: new Date(),
      },
      {
        id: 'light-001',
        name: 'Système d\'Éclairage',
        type: 'Éclairage',
        isConnected: isOnline && Math.random() > 0.01, // 99% uptime
        lastSeen: new Date(),
      },
      {
        id: 'security-001',
        name: 'Système de Sécurité',
        type: 'Sécurité',
        isConnected: isOnline && Math.random() > 0.005, // 99.5% uptime
        lastSeen: new Date(),
      },
      {
        id: 'energy-001',
        name: 'Compteur d\'Énergie',
        type: 'Surveillance',
        isConnected: isOnline, // Always online with building
        lastSeen: new Date(),
      },
    ];
  }

  // Public API methods
  static async getBuildingData() {
    logger.debug('Fetching complete building data');

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

  static async getBuildingStatus() {
    return {
      isOnline: this.buildingOnline,
      lastUpdated: this.lastUpdated,
    };
  }

  static async getCurrentEnergy() {
    const history = this.generateEnergyHistory();
    const latest = history[history.length - 1];
    return { realTime: latest.realTime };
  }

  static async getEnergyHistory() {
    return this.generateEnergyHistory();
  }

  static async getTemperatureWeek() {
    return this.generateTemperatureHistory();
  }

  static async getEnvironmentalData() {
    return this.generateEnvironmentalData();
  }

  static async getDevices() {
    return this.generateDevices();
  }

  static async updateDeviceStatus(deviceId, status) {
    logger.info(`Updating device ${deviceId} to ${status ? 'connected' : 'disconnected'}`);
    // In a real app, this would update the database/send command to IoT device
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  static async getHistoricalData(startDate, endDate) {
    // In a real app, this would query based on date range
    logger.debug(`Fetching historical data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    return this.generateEnergyHistory();
  }
}
