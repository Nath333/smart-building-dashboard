import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Thermometer } from 'lucide-react';
import type { TemperatureData } from '../types';

interface TemperatureChartProps {
  data: TemperatureData[];
}

export function TemperatureChart({ data }: TemperatureChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    indoor: Math.round(item.indoor * 10) / 10,
    outdoor: Math.round(item.outdoor * 10) / 10,
  }));

  const currentIndoor = formattedData[formattedData.length - 1]?.indoor || 0;
  const currentOutdoor = formattedData[formattedData.length - 1]?.outdoor || 0;

  return (
    <div className="chart-card">
      <div className="card-header">
        <div className="header-content">
          <Thermometer size={24} className="header-icon" />
          <h3>Temperature Trends</h3>
        </div>
        <div className="temperature-display">
          <div className="temp-item">
            <span className="temp-label">Indoor</span>
            <span className="temp-value indoor">{currentIndoor}°C</span>
          </div>
          <div className="temp-item">
            <span className="temp-label">Outdoor</span>
            <span className="temp-value outdoor">{currentOutdoor}°C</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            stroke="#666"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            stroke="#666"
            tick={{ fontSize: 12 }}
            label={{ value: '°C', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="indoor"
            stroke="#ef4444"
            fill="#fecaca"
            strokeWidth={2}
            name="Indoor (°C)"
          />
          <Area
            type="monotone"
            dataKey="outdoor"
            stroke="#3b82f6"
            fill="#bfdbfe"
            strokeWidth={2}
            name="Outdoor (°C)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
