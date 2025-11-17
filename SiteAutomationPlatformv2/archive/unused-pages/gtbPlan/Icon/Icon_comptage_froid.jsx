const Icon_comptage_froid = ({ style = {}, ...props }) => (
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
      <rect x="4" y="6" width="16" height="12" fill="#E1F5FE" stroke="#0277BD" strokeWidth="2" rx="2"/>
      {/* Display screen */}
      <rect x="6" y="8" width="12" height="4" fill="#263238" stroke="#37474F" strokeWidth="1" rx="1"/>
      {/* Digital numbers */}
      <text x="12" y="11" textAnchor="middle" fontSize="3" fill="#00E676" fontFamily="monospace">8888</text>
      {/* Cold/Freezing symbol */}
      <g fill="#00BCD4" stroke="#0097A7" strokeWidth="0.5">
        <path d="M12 13 L10 15 L12 17 L14 15 Z"/>
        <path d="M9 14 L7 14"/>
        <path d="M17 14 L15 14"/>
        <path d="M10 12 L8 12"/>
        <path d="M16 12 L14 12"/>
        <path d="M10 16 L8 16"/>
        <path d="M16 16 L14 16"/>
      </g>
      {/* Connection ports */}
      <circle cx="6" cy="20" r="1" fill="#0277BD"/>
      <circle cx="18" cy="20" r="1" fill="#0277BD"/>
      <line x1="6" y1="18" x2="6" y2="19" stroke="#0277BD" strokeWidth="2"/>
      <line x1="18" y1="18" x2="18" y2="19" stroke="#0277BD" strokeWidth="2"/>
    </g>
  </svg>
);

export default Icon_comptage_froid;