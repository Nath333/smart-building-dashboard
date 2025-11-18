import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Thermometer } from 'lucide-react';
import { useMemo, memo } from 'react';

function TemperatureChartComponent({ data }) {
  // Memoize formatted data to avoid recalculation on every render
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      indoor: Math.round(item.indoor * 10) / 10,
      outdoor: Math.round(item.outdoor * 10) / 10,
    }));
  }, [data]);

  const currentIndoor = useMemo(() => {
    return formattedData[formattedData.length - 1]?.indoor || 0;
  }, [formattedData]);

  const currentOutdoor = useMemo(() => {
    return formattedData[formattedData.length - 1]?.outdoor || 0;
  }, [formattedData]);

  return (
    <div className="chart-card">
      <div className="card-header">
        <div className="header-content">
          <Thermometer size={24} className="header-icon" />
          <h3>Tendances de Température</h3>
        </div>
        <div className="temperature-display">
          <div className="temp-item">
            <span className="temp-label">Intérieur</span>
            <span className="temp-value indoor">{currentIndoor}°C</span>
          </div>
          <div className="temp-item">
            <span className="temp-label">Extérieur</span>
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
            name="Intérieur (°C)"
          />
          <Area
            type="monotone"
            dataKey="outdoor"
            stroke="#3b82f6"
            fill="#bfdbfe"
            strokeWidth={2}
            name="Extérieur (°C)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Export memoized version for performance
export const TemperatureChart = memo(TemperatureChartComponent);
