import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap } from 'lucide-react';
import { useMemo, memo } from 'react';
import { CHART_CONFIG, ICON_SIZES, LOCALE } from '../constants.js';

/**
 * Energy consumption chart component
 * Displays 24-hour historical energy data with real-time current consumption
 *
 * @param {Object} props - Component props
 * @param {Array} props.data - Historical energy data (24 hours)
 * @param {number} props.realTime - Current energy consumption in watts
 * @returns {JSX.Element} Energy chart with line graph
 */
function EnergyChartComponent({ data, realTime }) {
  // Memoize formatted data to avoid recalculation on every render
  const formattedData = useMemo(() => {
    return data.map(item => ({
      time: new Date(item.timestamp).getHours() + ':00',
      consumption: Math.round(item.consumption),
    }));
  }, [data]);

  const formattedRealTime = useMemo(() => {
    return Math.round(realTime).toLocaleString(LOCALE.LANGUAGE);
  }, [realTime]);

  return (
    <div className="chart-card">
      <div className="card-header">
        <div className="header-content">
          <Zap size={ICON_SIZES.MEDIUM} className="header-icon" aria-hidden="true" />
          <h3>Consommation d'Énergie</h3>
        </div>
        <div className="realtime-display">
          <span className="realtime-label">Actuel</span>
          <span className="realtime-value">{formattedRealTime} W</span>
        </div>
      </div>

      <ResponsiveContainer width={CHART_CONFIG.RESPONSIVE_WIDTH} height={CHART_CONFIG.DEFAULT_HEIGHT}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray={CHART_CONFIG.GRID_DASH} stroke={CHART_CONFIG.GRID_STROKE} />
          <XAxis
            dataKey="time"
            stroke={CHART_CONFIG.AXIS_STROKE}
            tick={{ fontSize: CHART_CONFIG.TICK_FONT_SIZE }}
          />
          <YAxis
            stroke={CHART_CONFIG.AXIS_STROKE}
            tick={{ fontSize: CHART_CONFIG.TICK_FONT_SIZE }}
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
            stroke={CHART_CONFIG.PRIMARY_LINE}
            strokeWidth={CHART_CONFIG.STROKE_WIDTH}
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
