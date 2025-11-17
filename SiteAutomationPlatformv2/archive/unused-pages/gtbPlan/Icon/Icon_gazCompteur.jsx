const Icon_gazCompteur = ({ style = {}, ...props }) => (
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
      {/* Gas meter body */}
      <rect x="3" y="6" width="18" height="12" fill="#FFF3E0" stroke="#F57C00" strokeWidth="2" rx="2"/>
      {/* Gas pipes */}
      <g stroke="#795548" strokeWidth="3" strokeLinecap="round">
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
      </g>
      {/* Display */}
      <rect x="5" y="8" width="14" height="3" fill="#263238" stroke="#37474F" strokeWidth="1" rx="1"/>
      <text x="12" y="10.2" textAnchor="middle" fontSize="2.5" fill="#FFEB3B" fontFamily="monospace">m³</text>
      {/* Gas flame symbol */}
      <g fill="#FF5722" stroke="#D84315" strokeWidth="0.5">
        <path d="M9 13 C8 14 8 15 9 16 C10 17 11 17 12 16 C13 15 13 14 12 13 C11 12 10 12 9 13 Z"/>
        <path d="M15 13 C14 14 14 15 15 16 C16 17 17 17 18 16 C19 15 19 14 18 13 C17 12 16 12 15 13 Z"/>
      </g>
      {/* Valve indicator */}
      <circle cx="12" cy="18" r="1" fill="#795548" stroke="#5D4037" strokeWidth="1"/>
      <rect x="11.5" y="17" width="1" height="2" fill="#5D4037"/>
      {/* Safety warning */}
      <g fill="#FF5722" fontSize="2">
        <text x="6" y="16" fontWeight="bold">⚠</text>
      </g>
    </g>
  </svg>
);

export default Icon_gazCompteur;