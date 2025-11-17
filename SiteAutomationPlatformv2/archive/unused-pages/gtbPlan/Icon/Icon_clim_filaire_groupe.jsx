const Icon_clim_filaire_groupe = ({ style = {}, ...props }) => (
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
      {/* AC unit group */}
      <rect x="2" y="6" width="20" height="8" fill="#F3E5F5" stroke="#9C27B0" strokeWidth="2" rx="2"/>
      {/* Fan grills */}
      <g stroke="#9C27B0" strokeWidth="1">
        <line x1="5" y1="7" x2="5" y2="13"/>
        <line x1="7" y1="7" x2="7" y2="13"/>
        <line x1="9" y1="7" x2="9" y2="13"/>
        <line x1="15" y1="7" x2="15" y2="13"/>
        <line x1="17" y1="7" x2="17" y2="13"/>
        <line x1="19" y1="7" x2="19" y2="13"/>
      </g>
      {/* Group separator */}
      <line x1="12" y1="7" x2="12" y2="13" stroke="#9C27B0" strokeWidth="2"/>
      {/* Multiple wired connections */}
      <g stroke="#FF5722" strokeWidth="2" fill="none">
        <path d="M8 14 L8 18 Q8 19 9 19 L11 19"/>
        <path d="M12 14 L12 17 Q12 18 13 18 L15 18"/>
        <path d="M16 14 L16 19 Q16 20 17 20 L19 20"/>
        <circle cx="11" cy="19" r="1" fill="#FF5722"/>
        <circle cx="15" cy="18" r="1" fill="#FF5722"/>
        <circle cx="19" cy="20" r="1" fill="#FF5722"/>
      </g>
      {/* Group indicator */}
      <g fill="#9C27B0">
        <circle cx="11" cy="10" r="1"/>
        <circle cx="13" cy="10" r="1"/>
      </g>
    </g>
  </svg>
);

export default Icon_clim_filaire_groupe;