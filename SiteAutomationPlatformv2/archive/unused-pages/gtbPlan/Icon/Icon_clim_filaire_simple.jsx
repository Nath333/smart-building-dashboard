const Icon_clim_filaire_simple = ({ style = {}, ...props }) => (
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
      {/* AC unit */}
      <rect x="3" y="8" width="18" height="6" fill="#E8F5E8" stroke="#4CAF50" strokeWidth="2" rx="2"/>
      {/* Fan grills */}
      <g stroke="#4CAF50" strokeWidth="1">
        <line x1="6" y1="9" x2="6" y2="13"/>
        <line x1="8" y1="9" x2="8" y2="13"/>
        <line x1="10" y1="9" x2="10" y2="13"/>
        <line x1="14" y1="9" x2="14" y2="13"/>
        <line x1="16" y1="9" x2="16" y2="13"/>
        <line x1="18" y1="9" x2="18" y2="13"/>
      </g>
      {/* Wired connection - single wire */}
      <g stroke="#FF5722" strokeWidth="2" fill="none">
        <path d="M12 14 L12 18 Q12 19 13 19 L15 19"/>
        <circle cx="15" cy="19" r="1" fill="#FF5722"/>
      </g>
      {/* Simple indicator */}
      <circle cx="20" cy="11" r="1" fill="#4CAF50"/>
    </g>
  </svg>
);

export default Icon_clim_filaire_simple;