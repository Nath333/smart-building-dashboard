import { Droplets, Wind, Activity } from 'lucide-react';
import { memo } from 'react';
import {
  AIR_QUALITY,
  ENVIRONMENTAL_THRESHOLDS,
  ENVIRONMENTAL_LABELS,
  ENVIRONMENTAL_COLORS,
  ICON_SIZES
} from '../constants.js';

// Helper functions moved outside component for performance
const getAirQualityColor = (quality) => {
  return AIR_QUALITY.COLORS[quality.toUpperCase()] || AIR_QUALITY.COLORS.DEFAULT;
};

const getHumidityStatus = (humidity) => {
  if (humidity < ENVIRONMENTAL_THRESHOLDS.HUMIDITY.LOW) return ENVIRONMENTAL_LABELS.HUMIDITY.LOW;
  if (humidity > ENVIRONMENTAL_THRESHOLDS.HUMIDITY.HIGH) return ENVIRONMENTAL_LABELS.HUMIDITY.HIGH;
  return ENVIRONMENTAL_LABELS.HUMIDITY.OPTIMAL;
};

const getCO2Status = (co2) => {
  if (co2 < ENVIRONMENTAL_THRESHOLDS.CO2.GOOD) return ENVIRONMENTAL_LABELS.CO2.EXCELLENT;
  if (co2 < ENVIRONMENTAL_THRESHOLDS.CO2.MODERATE) return ENVIRONMENTAL_LABELS.CO2.GOOD;
  return ENVIRONMENTAL_LABELS.CO2.MODERATE;
};

const getAirQualityLabel = (quality) => {
  return AIR_QUALITY.LABELS[quality.toUpperCase()] || quality;
};

/**
 * Environmental metrics display component
 * Shows humidity, CO2 levels, and air quality with status indicators
 *
 * @param {Object} props - Component props
 * @param {Object} props.data - Environmental data
 * @returns {JSX.Element} Environmental metrics grid
 */
function EnvironmentalMetricsComponent({ data }) {
  const airQualityColor = getAirQualityColor(data.airQuality);
  const airQualityBg = `${airQualityColor}20`;

  return (
    <div className="environmental-grid">
      <div className="metric-card">
        <div className="metric-icon" style={{ backgroundColor: ENVIRONMENTAL_COLORS.HUMIDITY.BG }}>
          <Droplets size={ICON_SIZES.MEDIUM} color={ENVIRONMENTAL_COLORS.HUMIDITY.ICON} aria-hidden="true" />
        </div>
        <div className="metric-content">
          <h4>Humidité</h4>
          <p className="metric-value">{Math.round(data.humidity)}%</p>
          <p className="metric-status">{getHumidityStatus(data.humidity)}</p>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon" style={{ backgroundColor: ENVIRONMENTAL_COLORS.CO2.BG }}>
          <Wind size={ICON_SIZES.MEDIUM} color={ENVIRONMENTAL_COLORS.CO2.ICON} aria-hidden="true" />
        </div>
        <div className="metric-content">
          <h4>Niveau de CO₂</h4>
          <p className="metric-value">{Math.round(data.co2Level)} ppm</p>
          <p className="metric-status">{getCO2Status(data.co2Level)}</p>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon" style={{ backgroundColor: airQualityBg }}>
          <Activity size={ICON_SIZES.MEDIUM} color={airQualityColor} aria-hidden="true" />
        </div>
        <div className="metric-content">
          <h4>Qualité de l'Air</h4>
          <p className="metric-value" style={{ color: airQualityColor }}>
            {getAirQualityLabel(data.airQuality)}
          </p>
          <p className="metric-status">Évaluation globale</p>
        </div>
      </div>
    </div>
  );
}

// Export memoized version for performance
export const EnvironmentalMetrics = memo(EnvironmentalMetricsComponent);
