const Icon_izit = ({ style = {}, ...props }) => (
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
      {/* GTB cabinet/coffret body */}
      <rect x="4" y="3" width="16" height="18" fill="#37474F" stroke="#263238" strokeWidth="2" rx="2"/>
      {/* Front panel */}
      <rect x="5" y="4" width="14" height="16" fill="#546E7A" stroke="#37474F" strokeWidth="1" rx="1"/>
      {/* Status display */}
      <rect x="7" y="6" width="10" height="3" fill="#1B5E20" stroke="#2E7D32" strokeWidth="1" rx="0.5"/>
      <text x="12" y="8.2" textAnchor="middle" fontSize="2" fill="#4CAF50" fontFamily="monospace">GTB</text>
      {/* Module slots */}
      <g fill="#424242" stroke="#212121" strokeWidth="0.5">
        <rect x="7" y="11" width="2" height="2" rx="0.3"/>
        <rect x="10" y="11" width="2" height="2" rx="0.3"/>
        <rect x="13" y="11" width="2" height="2" rx="0.3"/>
        <rect x="7" y="14" width="2" height="2" rx="0.3"/>
        <rect x="10" y="14" width="2" height="2" rx="0.3"/>
        <rect x="13" y="14" width="2" height="2" rx="0.3"/>
      </g>
      {/* Connection indicators */}
      <g fill="#4CAF50">
        <circle cx="8" cy="12" r="0.3"/>
        <circle cx="11" cy="12" r="0.3"/>
        <circle cx="14" cy="15" r="0.3"/>
      </g>
      {/* Network connection */}
      <g stroke="#2196F3" strokeWidth="1.5" fill="none">
        <path d="M12 21 Q10 19 8 21"/>
        <path d="M12 21 Q14 19 16 21"/>
        <circle cx="12" cy="21" r="0.5" fill="#2196F3"/>
      </g>
      {/* Brand indicator */}
      <circle cx="16" cy="7" r="1" fill="#FF5722"/>
      <text x="16" y="7.5" textAnchor="middle" fontSize="1.5" fill="white" fontFamily="sans-serif">I</text>
    </g>
  </svg>
);

export default Icon_izit;