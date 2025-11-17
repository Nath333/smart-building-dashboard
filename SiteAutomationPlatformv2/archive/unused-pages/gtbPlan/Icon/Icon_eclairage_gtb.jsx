const Icon_eclairage_gtb = ({ style = {}, ...props }) => (
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
      {/* Light bulb symbol */}
      <circle cx="12" cy="10" r="6" fill="#FFC107" stroke="#FF8F00" strokeWidth="2"/>
      <rect x="10" y="16" width="4" height="2" fill="#795548" rx="1"/>
      <rect x="9" y="18" width="6" height="1" fill="#5D4037" rx="0.5"/>
      {/* Light rays */}
      <g stroke="#FFC107" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="4"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="2" y1="12" x2="4" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="20" y1="12" x2="22" y2="12"/>
        <line x1="19.78" y1="4.22" x2="18.36" y2="5.64"/>
        <line x1="19.78" y1="19.78" x2="18.36" y2="18.36"/>
      </g>
      {/* Contact symbol */}
      <rect x="11" y="9" width="2" height="2" fill="#FF8F00" rx="1"/>
    </g>
  </svg>
);

export default Icon_eclairage_gtb;