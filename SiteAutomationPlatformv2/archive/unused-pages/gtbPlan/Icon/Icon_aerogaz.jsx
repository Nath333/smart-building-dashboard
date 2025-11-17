const Icon_aerogaz = ({ style = {}, ...props }) => (
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
      {/* Gas symbol - orange circle with flame */}
      <circle cx="12" cy="12" r="10" fill="#FF5722" stroke="#D84315" strokeWidth="2"/>
      <path d="M12 6 C10 8 8 10 10 14 C12 16 14 16 16 14 C18 10 16 8 14 6 Z" 
            fill="#FFD700" stroke="#FF8F00" strokeWidth="1"/>
      <path d="M12 8 C11 9 10 10 11 12 C12 13 13 13 14 12 C15 10 14 9 13 8 Z" 
            fill="#FF8F00"/>
      {/* Heat symbol - small radiating dots */}
      <g fill="#FFD700" opacity="0.8">
        <circle cx="8" cy="8" r="0.8"/>
        <circle cx="16" cy="8" r="0.8"/>
        <circle cx="8" cy="16" r="0.8"/>
        <circle cx="16" cy="16" r="0.8"/>
      </g>
    </g>
  </svg>
);

export default Icon_aerogaz;