/**
 * Mock data service for frontend-only demos (GitHub Pages)
 * Generates realistic building data without backend
 */

import { WEEKDAYS_FR } from '../constants.js';

const DataConstants = {
  TEMPERATURE: { MIN_INDOOR: 15, MAX_INDOOR: 30, MIN_OUTDOOR: -10, MAX_OUTDOOR: 40 },
  ENERGY: { MIN_CONSUMPTION: 50, MAX_CONSUMPTION: 200 },
  ENVIRONMENTAL: { MIN_HUMIDITY: 30, MAX_HUMIDITY: 70, MIN_CO2: 350, MAX_CO2: 1000 },
};

export class MockDataService {
  static generateMockData() {
    const now = new Date();

    // Generate 24-hour energy history
    const energyHistory = [];
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hour = timestamp.getHours();

      let baseConsumption = 120;
      if (hour >= 6 && hour < 9) baseConsumption = 145;
      else if (hour >= 9 && hour < 17) baseConsumption = 125;
      else if (hour >= 17 && hour < 22) baseConsumption = 135;
      else baseConsumption = 75;

      const variation = (Math.random() - 0.5) * 20;
      const consumption = Math.max(
        DataConstants.ENERGY.MIN_CONSUMPTION,
        Math.min(DataConstants.ENERGY.MAX_CONSUMPTION, baseConsumption + variation)
      );

      energyHistory.push({
        timestamp: timestamp.toISOString(),
        consumption: Math.round(consumption * 100) / 100,
        realTime: Math.round(consumption * 1000),
      });
    }

    // Generate 7-day temperature data
    const temperatureData = WEEKDAYS_FR.map((day, i) => {
      const indoorBase = 21.5;
      const indoorVariation = (Math.random() - 0.5) * 2;
      const indoor = Math.round((indoorBase + indoorVariation) * 10) / 10;

      const outdoorBase = 15 + (i * 0.5);
      const outdoorVariation = (Math.random() - 0.5) * 6;
      const outdoor = Math.round((outdoorBase + outdoorVariation) * 10) / 10;

      return {
        date: day,
        indoor: Math.max(DataConstants.TEMPERATURE.MIN_INDOOR, Math.min(DataConstants.TEMPERATURE.MAX_INDOOR, indoor)),
        outdoor: Math.max(DataConstants.TEMPERATURE.MIN_OUTDOOR, Math.min(DataConstants.TEMPERATURE.MAX_OUTDOOR, outdoor)),
      };
    });

    // Generate environmental data
    const humidity = Math.round((48 + Math.random() * 8) * 10) / 10;
    const co2Level = Math.round(420 + Math.random() * 280);
    let airQuality;
    if (co2Level < 600) airQuality = 'good';
    else if (co2Level < 800) airQuality = 'moderate';
    else airQuality = 'poor';

    // Generate devices
    const devices = [
      {
        id: 'hvac-001',
        name: 'Système CVC',
        type: 'Contrôle Climatique',
        isConnected: Math.random() > 0.02,
        lastSeen: new Date(),
      },
      {
        id: 'light-001',
        name: 'Système d\'Éclairage',
        type: 'Éclairage',
        isConnected: Math.random() > 0.01,
        lastSeen: new Date(),
      },
      {
        id: 'security-001',
        name: 'Système de Sécurité',
        type: 'Sécurité',
        isConnected: Math.random() > 0.005,
        lastSeen: new Date(),
      },
      {
        id: 'energy-001',
        name: 'Compteur d\'Énergie',
        type: 'Surveillance',
        isConnected: true,
        lastSeen: new Date(),
      },
    ];

    const latestEnergy = energyHistory[energyHistory.length - 1];

    return {
      status: {
        isOnline: true,
        lastUpdated: new Date(),
      },
      energy: {
        realTime: latestEnergy.realTime,
        historical: energyHistory,
      },
      temperature: temperatureData,
      environmental: {
        humidity: Math.max(DataConstants.ENVIRONMENTAL.MIN_HUMIDITY, Math.min(DataConstants.ENVIRONMENTAL.MAX_HUMIDITY, humidity)),
        co2Level: Math.max(DataConstants.ENVIRONMENTAL.MIN_CO2, Math.min(DataConstants.ENVIRONMENTAL.MAX_CO2, co2Level)),
        airQuality,
      },
      devices,
    };
  }
}
