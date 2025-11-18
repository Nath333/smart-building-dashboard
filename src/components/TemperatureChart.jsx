import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Thermometer } from 'lucide-react';
import { useMemo, memo } from 'react';
import { CHART_CONFIG, ICON_SIZES } from '../constants.js';

/**
 * Temperature trends chart component
 * Displays 7-day indoor/outdoor temperature comparison
 *
 * @param {Object} props - Component props
 * @param {Array} props.data - Weekly temperature data
 * @returns {JSX.Element} Temperature area chart
 */
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
          <Thermometer size={ICON_SIZES.MEDIUM} className="header-icon" aria-hidden="true" />
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

      <ResponsiveContainer width={CHART_CONFIG.RESPONSIVE_WIDTH} height={CHART_CONFIG.DEFAULT_HEIGHT}>
        <AreaChart data={formattedData}>
          <CartesianGrid strokeDasharray={CHART_CONFIG.GRID_DASH} stroke={CHART_CONFIG.GRID_STROKE} />
          <XAxis
            dataKey="date"
            stroke={CHART_CONFIG.AXIS_STROKE}
            tick={{ fontSize: CHART_CONFIG.TICK_FONT_SIZE }}
          />
          <YAxis
            stroke={CHART_CONFIG.AXIS_STROKE}
            tick={{ fontSize: CHART_CONFIG.TICK_FONT_SIZE }}
            label={{ value: '°C', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_CONFIG.TOOLTIP_BG,
              border: CHART_CONFIG.TOOLTIP_BORDER,
              borderRadius: CHART_CONFIG.TOOLTIP_RADIUS
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="indoor"
            stroke={CHART_CONFIG.INDOOR_TEMP}
            fill={CHART_CONFIG.INDOOR_FILL}
            strokeWidth={CHART_CONFIG.STROKE_WIDTH}
            name="Intérieur (°C)"
          />
          <Area
            type="monotone"
            dataKey="outdoor"
            stroke={CHART_CONFIG.OUTDOOR_TEMP}
            fill={CHART_CONFIG.OUTDOOR_FILL}
            strokeWidth={CHART_CONFIG.STROKE_WIDTH}
            name="Extérieur (°C)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Export memoized version for performance
export const TemperatureChart = memo(TemperatureChartComponent);
