import React from 'react';
import BaseIcon from './BaseIcon';

/**
 * GaineIcon - Cable duct/conduit icon
 * Displays as a rectangular tube (horizontal or vertical)
 */
const GaineIcon = ({ width = 60, height = 20, color = '#95a5a6', orientation = 'horizontal', ...props }) => {
  // Auto-detect orientation if not explicitly set
  const isVertical = orientation === 'vertical' || (orientation === 'auto' && height > width);
  return (
    <BaseIcon width={width} height={height} viewBox={`0 0 ${width} ${height}`} {...props}>
      {/* Outer tube */}
      <rect
        x="2"
        y="2"
        width={width - 4}
        height={height - 4}
        fill={color}
        stroke="#34495e"
        strokeWidth="1.5"
        rx="2"
      />

      {/* Inner highlight for 3D effect */}
      <rect
        x="4"
        y="4"
        width={width - 8}
        height={(height - 8) / 2}
        fill="rgba(255, 255, 255, 0.3)"
        rx="1"
      />

      {/* Segmentation lines to show it's a duct */}
      {isVertical ? (
        // Horizontal lines for vertical duct
        <>
          <line
            x1="2"
            y1={height / 3}
            x2={width - 2}
            y2={height / 3}
            stroke="#34495e"
            strokeWidth="1"
            opacity="0.3"
          />
          <line
            x1="2"
            y1={(2 * height) / 3}
            x2={width - 2}
            y2={(2 * height) / 3}
            stroke="#34495e"
            strokeWidth="1"
            opacity="0.3"
          />
        </>
      ) : (
        // Vertical lines for horizontal duct
        <>
          <line
            x1={width / 3}
            y1="2"
            x2={width / 3}
            y2={height - 2}
            stroke="#34495e"
            strokeWidth="1"
            opacity="0.3"
          />
          <line
            x1={(2 * width) / 3}
            y1="2"
            x2={(2 * width) / 3}
            y2={height - 2}
            stroke="#34495e"
            strokeWidth="1"
            opacity="0.3"
          />
        </>
      )}
    </BaseIcon>
  );
};

export default GaineIcon;
