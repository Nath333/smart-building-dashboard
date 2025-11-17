const BaseIcon = ({ 
  children, 
  width = 24, 
  height = 24, 
  viewBox = "0 0 24 24",
  fill = "none",
  style = {},
  className = "",
  ...props 
}) => {
  const baseStyle = {
    width,
    height,
    display: 'inline-block',
    ...style,
  };

  return (
    <svg
      viewBox={viewBox}
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      style={baseStyle}
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
};

export default BaseIcon;