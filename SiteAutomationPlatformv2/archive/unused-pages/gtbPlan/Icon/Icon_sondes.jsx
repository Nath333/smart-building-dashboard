const Icon_sondes = ({ style = {}, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      width: 24,
      height: 24,
      display: 'inline-block',
      ...style,
    }}
    {...props}
  >
    <g>
      {/* Temperature sensor body */}
      <rect x="10" y="4" width="4" height="12" fill="#FF5722" stroke="#D84315" strokeWidth="2" rx="2"/>
      {/* Sensor bulb */}
      <circle cx="12" cy="18" r="3" fill="#FF5722" stroke="#D84315" strokeWidth="2"/>
      {/* Temperature scale */}
      <g stroke="white" strokeWidth="1">
        <line x1="11" y1="6" x2="13" y2="6"/>
        <line x1="11" y1="8" x2="13" y2="8"/>
        <line x1="11" y1="10" x2="13" y2="10"/>
        <line x1="11" y1="12" x2="13" y2="12"/>
        <line x1="11" y1="14" x2="13" y2="14"/>
      </g>
      {/* Temperature indicator */}
      <rect x="11" y="15" width="2" height="2" fill="white" rx="1"/>
      {/* Connection wire */}
      <g stroke="#424242" strokeWidth="1.5" fill="none">
        <path d="M12 4 Q10 2 8 4 L6 6"/>
        <circle cx="6" cy="6" r="1" fill="#424242"/>
      </g>
      {/* Temperature readings */}
      <text x="16" y="8" fontSize="3" fill="#FF5722" fontFamily="monospace">°C</text>
    </g>
  </svg>
);

export default Icon_sondes;