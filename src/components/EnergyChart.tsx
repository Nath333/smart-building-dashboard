import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap } from 'lucide-react';
import type { EnergyData } from '../types';
import { useMemo, memo } from 'react';

interface EnergyChartProps {
  data: EnergyData[];
  realTime: number;
}

function EnergyChartComponent({ data, realTime }: EnergyChartProps) {
  // Memoize formatted data to avoid recalculation on every render
  const formattedData = useMemo(() => {
    return data.map(item => ({
      time: new Date(item.timestamp).getHours() + ':00',
      consumption: Math.round(item.consumption),
    }));
  }, [data]);

  const formattedRealTime = useMemo(() => {
    return Math.round(realTime).toLocaleString('fr-FR');
  }, [realTime]);

  return (
    <div className="chart-card">
      <div className="card-header">
        <div className="header-content">
          <Zap size={24} className="header-icon" />
          <h3>Consommation d'Énergie</h3>
        </div>
        <div className="realtime-display">
          <span className="realtime-label">Actuel</span>
          <span className="realtime-value">{formattedRealTime} W</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="time"
            stroke="#666"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            stroke="#666"
            tick={{ fontSize: 12 }}
            label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="consumption"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="Énergie (kWh)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Export memoized version for performance
export const EnergyChart = memo(EnergyChartComponent);
