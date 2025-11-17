import { Droplets, Wind, Activity } from 'lucide-react';
import type { EnvironmentalData } from '../types';

interface EnvironmentalMetricsProps {
  data: EnvironmentalData;
}

export function EnvironmentalMetrics({ data }: EnvironmentalMetricsProps) {
  const getAirQualityColor = (quality: string) => {
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

  const getHumidityStatus = (humidity: number) => {
    if (humidity < 30) return 'Low';
    if (humidity > 60) return 'High';
    return 'Optimal';
  };

  const getCO2Status = (co2: number) => {
    if (co2 < 600) return 'Excellent';
    if (co2 < 800) return 'Good';
    return 'Fair';
  };

  return (
    <div className="environmental-grid">
      <div className="metric-card">
        <div className="metric-icon" style={{ backgroundColor: '#e0f2fe' }}>
          <Droplets size={24} color="#0284c7" />
        </div>
        <div className="metric-content">
          <h4>Humidity</h4>
          <p className="metric-value">{Math.round(data.humidity)}%</p>
          <p className="metric-status">{getHumidityStatus(data.humidity)}</p>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon" style={{ backgroundColor: '#fef3c7' }}>
          <Wind size={24} color="#d97706" />
        </div>
        <div className="metric-content">
          <h4>CO₂ Level</h4>
          <p className="metric-value">{Math.round(data.co2Level)} ppm</p>
          <p className="metric-status">{getCO2Status(data.co2Level)}</p>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon" style={{ backgroundColor: getAirQualityColor(data.airQuality) + '20' }}>
          <Activity size={24} color={getAirQualityColor(data.airQuality)} />
        </div>
        <div className="metric-content">
          <h4>Air Quality</h4>
          <p className="metric-value" style={{ color: getAirQualityColor(data.airQuality) }}>
            {data.airQuality.charAt(0).toUpperCase() + data.airQuality.slice(1)}
          </p>
          <p className="metric-status">Overall rating</p>
        </div>
      </div>
    </div>
  );
}
