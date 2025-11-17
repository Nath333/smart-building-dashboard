const Icon_rooftop_gtb = ({ style = {}, ...props }) => (
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
      {/* Rooftop unit symbol - rectangular unit with fan */}
      <rect x="2" y="8" width="20" height="12" fill="#607D8B" stroke="#37474F" strokeWidth="2" rx="2"/>
      {/* Fan symbol */}
      <circle cx="12" cy="14" r="4" fill="#90A4AE" stroke="#546E7A" strokeWidth="1"/>
      <path d="M12 10 L16 14 L12 18 L8 14 Z" fill="#37474F"/>
      <circle cx="12" cy="14" r="1" fill="#263238"/>
      {/* Remote control signal */}
      <g stroke="#4CAF50" strokeWidth="1.5" fill="none">
        <path d="M12 4 Q10 6 8 4"/>
        <path d="M12 4 Q14 6 16 4"/>
        <path d="M12 4 Q11 5 12 6"/>
        <path d="M12 4 Q13 5 12 6"/>
      </g>
    </g>
  </svg>
);

export default Icon_rooftop_gtb;