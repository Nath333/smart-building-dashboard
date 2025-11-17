const Icon_aeroeau = ({ style = {}, ...props }) => (
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
      {/* Water symbol - blue circle with waves */}
      <circle cx="12" cy="12" r="10" fill="#2196F3" stroke="#1976D2" strokeWidth="2"/>
      <path d="M6 12 Q9 8 12 12 Q15 16 18 12" stroke="white" strokeWidth="2" fill="none"/>
      <path d="M7 14 Q9 11 12 14 Q15 17 17 14" stroke="white" strokeWidth="1.5" fill="none"/>
      {/* Heat symbol - small sun rays */}
      <g fill="#FFD700" stroke="#FFA000" strokeWidth="0.5">
        <circle cx="12" cy="6" r="1"/>
        <circle cx="18" cy="12" r="1"/>
        <circle cx="12" cy="18" r="1"/>
        <circle cx="6" cy="12" r="1"/>
      </g>
    </g>
  </svg>
);

export default Icon_aeroeau;