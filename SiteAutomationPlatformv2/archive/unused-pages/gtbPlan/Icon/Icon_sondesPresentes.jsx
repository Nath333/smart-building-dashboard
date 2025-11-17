const Icon_sondesPresentes = ({ style = {}, ...props }) => (
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
      {/* Presence sensor body */}
      <rect x="6" y="8" width="12" height="6" fill="#4CAF50" stroke="#2E7D32" strokeWidth="2" rx="3"/>
      {/* PIR sensor dome */}
      <ellipse cx="12" cy="11" rx="4" ry="2" fill="#81C784" stroke="#4CAF50" strokeWidth="1"/>
      <ellipse cx="12" cy="11" rx="2" ry="1" fill="#A5D6A7"/>
      {/* Detection field */}
      <g stroke="#4CAF50" strokeWidth="1" fill="none" opacity="0.6">
        <path d="M12 11 Q8 8 4 12"/>
        <path d="M12 11 Q16 8 20 12"/>
        <path d="M12 11 Q10 6 8 4"/>
        <path d="M12 11 Q14 6 16 4"/>
      </g>
      {/* Person detected symbol */}
      <g fill="#2E7D32" opacity="0.8">
        <circle cx="18" cy="6" r="1"/>
        <path d="M17 7 L17 9 L18 9 L18 11 L19 11 L19 9 L19 7 Z"/>
      </g>
      {/* Connection */}
      <g stroke="#424242" strokeWidth="1.5" fill="none">
        <path d="M6 11 Q4 13 2 11"/>
        <circle cx="2" cy="11" r="1" fill="#424242"/>
      </g>
      {/* Activity indicator */}
      <circle cx="16" cy="10" r="0.8" fill="#FFEB3B"/>
    </g>
  </svg>
);

export default Icon_sondesPresentes;