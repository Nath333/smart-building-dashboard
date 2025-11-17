import React, { useState } from 'react';

/**
 * PlanToolbox - Reusable action toolbox for visual plan editing
 * Supports multiple tools with active state management
 */
const PlanToolbox = ({ onAddCircle, onAddGaine, onAddGaineVertical }) => {
  const [activeTool, setActiveTool] = useState(null);

  const tools = [
    {
      id: 'circle',
      label: 'Add Circle',
      icon: '⭕',
      description: 'Add a circle marker',
      action: onAddCircle
    },
    {
      id: 'gaine',
      label: 'Add Gaine H',
      icon: '━',
      description: 'Add a horizontal resizable cable duct',
      action: onAddGaine
    },
    {
      id: 'gaineVertical',
      label: 'Add Gaine V',
      icon: '┃',
      description: 'Add a vertical resizable cable duct',
      action: onAddGaineVertical
    }
    // Future tools can be added here:
    // { id: 'line', label: 'Draw Line', icon: '╱', action: onAddLine },
    // { id: 'text', label: 'Add Text', icon: '📝', action: onAddText },
    // { id: 'rectangle', label: 'Add Rectangle', icon: '▭', action: onAddRectangle }
  ];

  const handleToolClick = (tool) => {
    // Clear active tool when clicking the same tool
    if (activeTool === tool.id) {
      setActiveTool(null);
    } else {
      setActiveTool(tool.id);
      // Execute the tool's action
      if (tool.action && typeof tool.action === 'function') {
        tool.action();
      } else {
        console.warn(`⚠️ Action for tool "${tool.id}" is not available`);
      }
      // Auto-clear active state after action
      setTimeout(() => setActiveTool(null), 100);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        background: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 12,
        border: '1.5px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)',
        backdropFilter: 'blur(10px)',
        maxWidth: 'fit-content'
      }}
    >
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool)}
            title={tool.description}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: isActive ? '#1890ff' : '#fff',
              color: isActive ? '#fff' : '#2c3e50',
              border: isActive ? '1.5px solid #1890ff' : '1.5px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isActive
                ? '0 2px 8px rgba(24, 144, 255, 0.3)'
                : '0 1px 3px rgba(0, 0, 0, 0.05)',
              minWidth: 120
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.target.style.background = '#f5f5f5';
                e.target.style.borderColor = '#1890ff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.target.style.background = '#fff';
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
              }
            }}
          >
            <span style={{ fontSize: 16 }}>{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default PlanToolbox;
