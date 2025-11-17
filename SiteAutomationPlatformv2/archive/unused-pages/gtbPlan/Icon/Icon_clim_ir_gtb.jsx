const Icon_clim_ir_gtb = ({ style = {}, ...props }) => (
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
      <rect x="3" y="6" width="18" height="8" fill="#E3F2FD" stroke="#1976D2" strokeWidth="2" rx="2"/>
      {/* Fan grills */}
      <g stroke="#1976D2" strokeWidth="1">
        <line x1="6" y1="8" x2="6" y2="12"/>
        <line x1="8" y1="8" x2="8" y2="12"/>
        <line x1="10" y1="8" x2="10" y2="12"/>
        <line x1="14" y1="8" x2="14" y2="12"/>
        <line x1="16" y1="8" x2="16" y2="12"/>
        <line x1="18" y1="8" x2="18" y2="12"/>
      </g>
      {/* IR Remote signal */}
      <g stroke="#E91E63" strokeWidth="1.5" fill="none">
        <path d="M12 2 Q10 4 8 2"/>
        <path d="M12 2 Q14 4 16 2"/>
        <path d="M12 2 Q11 3 12 4"/>
        <path d="M12 2 Q13 3 12 4"/>
      </g>
      {/* Remote control */}
      <rect x="10" y="16" width="4" height="6" fill="#424242" stroke="#212121" strokeWidth="1" rx="1"/>
      <circle cx="12" cy="18" r="0.5" fill="#E91E63"/>
      <rect x="11" y="19.5" width="2" height="0.5" fill="#666"/>
    </g>
  </svg>
);

export default Icon_clim_ir_gtb;