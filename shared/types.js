/**
 * Shared data structures between frontend and backend
 * Single source of truth for data structures
 */

/**
 * @typedef {Object} BuildingStatus
 * @property {boolean} isOnline
 * @property {Date} lastUpdated
 */

/**
 * @typedef {Object} EnergyData
 * @property {string} timestamp
 * @property {number} consumption - kWh
 * @property {number} realTime - current watts
 */

/**
 * @typedef {Object} TemperatureData
 * @property {string} date
 * @property {number} indoor - Celsius
 * @property {number} outdoor - Celsius
 */

/**
 * @typedef {'good'|'moderate'|'poor'} AirQuality
 */

/**
 * @typedef {Object} EnvironmentalData
 * @property {number} humidity - percentage (0-100)
 * @property {number} co2Level - ppm (parts per million)
 * @property {AirQuality} airQuality
 */

/**
 * @typedef {Object} DeviceStatus
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {boolean} isConnected
 * @property {Date} lastSeen
 */

/**
 * @typedef {Object} BuildingData
 * @property {BuildingStatus} status
 * @property {Object} energy
 * @property {number} energy.realTime
 * @property {EnergyData[]} energy.historical
 * @property {TemperatureData[]} temperature
 * @property {EnvironmentalData} environmental
 * @property {DeviceStatus[]} devices
 */

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {T} [data]
 * @property {string} [error]
 */

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
};
