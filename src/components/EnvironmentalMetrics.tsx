import { Droplets, Wind, Activity } from 'lucide-react';
import type { EnvironmentalData, AirQuality } from '../types';
import { memo } from 'react';

interface EnvironmentalMetricsProps {
  data: EnvironmentalData;
}

// Helper functions moved outside component for performance
const getAirQualityColor = (quality: AirQuality): string => {
  switch (quality) {
    case 'good':
      return '#22c55e';
    case 'moderate':
      return '#f59e0b';
    case 'poor':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const getHumidityStatus = (humidity: number): string => {
  if (humidity < 30) return 'Faible';
  if (humidity > 60) return 'Élevé';
  return 'Optimal';
};

const getCO2Status = (co2: number): string => {
  if (co2 < 600) return 'Excellent';
  if (co2 < 800) return 'Bon';
  return 'Moyen';
};

const getAirQualityLabel = (quality: AirQuality): string => {
  switch (quality) {
    case 'good':
      return 'Bon';
    case 'moderate':
      return 'Modéré';
    case 'poor':
      return 'Mauvais';
    default:
      return quality;
  }
};

function EnvironmentalMetricsComponent({ data }: EnvironmentalMetricsProps) {
  const airQualityColor = getAirQualityColor(data.airQuality);
  const airQualityBg = `${airQualityColor}20`;

  return (
    <div className="environmental-grid">
      <div className="metric-card">
        <div className="metric-icon" style={{ backgroundColor: '#e0f2fe' }}>
          <Droplets size={24} color="#0284c7" />
        </div>
        <div className="metric-content">
          <h4>Humidité</h4>
          <p className="metric-value">{Math.round(data.humidity)}%</p>
          <p className="metric-status">{getHumidityStatus(data.humidity)}</p>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon" style={{ backgroundColor: '#fef3c7' }}>
          <Wind size={24} color="#d97706" />
        </div>
        <div className="metric-content">
          <h4>Niveau de CO₂</h4>
          <p className="metric-value">{Math.round(data.co2Level)} ppm</p>
          <p className="metric-status">{getCO2Status(data.co2Level)}</p>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon" style={{ backgroundColor: airQualityBg }}>
          <Activity size={24} color={airQualityColor} />
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
