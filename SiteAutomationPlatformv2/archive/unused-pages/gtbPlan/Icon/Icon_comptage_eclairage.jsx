const Icon_comptage_eclairage = ({ style = {}, ...props }) => (
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
      {/* Counter/meter body */}
      <rect x="4" y="6" width="16" height="12" fill="#FFF8E1" stroke="#F57F17" strokeWidth="2" rx="2"/>
      {/* Display screen */}
      <rect x="6" y="8" width="12" height="4" fill="#263238" stroke="#37474F" strokeWidth="1" rx="1"/>
      {/* Digital numbers */}
      <text x="12" y="11" textAnchor="middle" fontSize="3" fill="#FFEB3B" fontFamily="monospace">kWh</text>
      {/* Lightning/electricity symbol */}
      <g fill="#FFC107" stroke="#FF8F00" strokeWidth="0.5">
        <path d="M10 13 L12 13 L11 16 L14 16 L12 19 L11 17 L8 17 L10 13 Z"/>
      </g>
      {/* Light rays around */}
      <g stroke="#FFC107" strokeWidth="1" strokeLinecap="round">
        <line x1="2" y1="12" x2="4" y2="12"/>
        <line x1="20" y1="12" x2="22" y2="12"/>
        <line x1="12" y1="2" x2="12" y2="4"/>
        <line x1="12" y1="20" x2="12" y2="22"/>
      </g>
      {/* Connection ports */}
      <circle cx="6" cy="20" r="1" fill="#F57F17"/>
      <circle cx="18" cy="20" r="1" fill="#F57F17"/>
      <line x1="6" y1="18" x2="6" y2="19" stroke="#F57F17" strokeWidth="2"/>
      <line x1="18" y1="18" x2="18" y2="19" stroke="#F57F17" strokeWidth="2"/>
    </g>
  </svg>
);

export default Icon_comptage_eclairage;