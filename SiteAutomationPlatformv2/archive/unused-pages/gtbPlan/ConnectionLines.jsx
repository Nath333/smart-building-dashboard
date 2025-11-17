import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Helper functions moved outside component for better performance
const groupModulesByType = (moduleList) => {
  return moduleList.reduce((acc, module) => {
    const type = module.moduleType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(module);
    return acc;
  }, {});
};

const determineConnectionType = (fromType, toType) => {
  const connectionMap = {
    // GTB connections to other modules
    izit: {
      aero_eau: { protocol: 'ModBus RTU', type: 'wired', color: '#3498db', style: 'solid' },
      aero_gaz: { protocol: 'ModBus RTU', type: 'wired', color: '#3498db', style: 'solid' },
      rooftop: { protocol: 'ModBus RTU', type: 'wired', color: '#3498db', style: 'solid' },
      eclairage: { protocol: 'Contact Sec', type: 'wired', color: '#f39c12', style: 'dashed' },
      clim_ir: { protocol: 'IR Signal', type: 'wireless', color: '#9b59b6', style: 'dotted' },
      clim_filaire_simple: { protocol: 'ModBus RTU', type: 'wired', color: '#3498db', style: 'solid' },
      clim_filaire_groupe: { protocol: 'ModBus RTU', type: 'wired', color: '#3498db', style: 'solid' },
      comptage_froid: { protocol: 'Impulsion', type: 'wired', color: '#1abc9c', style: 'solid' },
      comptage_eclairage: { protocol: 'Impulsion', type: 'wired', color: '#1abc9c', style: 'solid' },
      sondes: { protocol: 'Analogique', type: 'wired', color: '#e67e22', style: 'solid' },
      sondes_presentes: { protocol: 'Contact Sec', type: 'wired', color: '#e67e22', style: 'dashed' },
      gaz_compteur: { protocol: 'Impulsion', type: 'wired', color: '#1abc9c', style: 'solid' }
    }
  };

  return connectionMap[fromType]?.[toType] || null;
};

const ConnectionLines = ({ modules, imageNaturalWidth, imageDisplayedWidth, onConnectionUpdate }) => {
  const [connections, setConnections] = useState([]);

  // Scale ratio for proper positioning
  const scaleRatio = imageNaturalWidth && imageDisplayedWidth ? imageDisplayedWidth / imageNaturalWidth : 1;

  // Auto-generate intelligent connections based on module types
  useEffect(() => {
    if (!modules || modules.length === 0) return;

    const autoConnections = generateAutoConnections(modules);
    setConnections(autoConnections);

    // Notify parent component of connections for persistence
    if (onConnectionUpdate) {
      onConnectionUpdate(autoConnections);
    }
  }, [modules, onConnectionUpdate]);

  // Generate intelligent connections based on building automation logic
  const generateAutoConnections = (moduleList) => {
    const connections = [];
    const modulesByType = groupModulesByType(moduleList);

    // GTB (IZIT) modules are central controllers - connect to everything
    const gtbModules = modulesByType.izit || [];
    const allOtherModules = moduleList.filter(m => m.moduleType !== 'izit');

    gtbModules.forEach(gtbModule => {
      allOtherModules.forEach(module => {
        const connectionType = determineConnectionType(gtbModule.moduleType, module.moduleType);
        if (connectionType) {
          connections.push({
            id: `${gtbModule.id}-${module.id}`,
            from: gtbModule.id,
            to: module.id,
            fromModule: gtbModule,
            toModule: module,
            protocol: connectionType.protocol,
            type: connectionType.type, // 'wired' or 'wireless'
            color: connectionType.color,
            style: connectionType.style
          });
        }
      });
    });

    // Add inter-module connections (like rooftop to eclairage)
    const rooftopModules = modulesByType.rooftop || [];
    const eclairageModules = modulesByType.eclairage || [];

    rooftopModules.forEach(rooftop => {
      eclairageModules.slice(0, 2).forEach(eclairage => { // Connect first 2 lights to each rooftop
        connections.push({
          id: `${rooftop.id}-${eclairage.id}`,
          from: rooftop.id,
          to: eclairage.id,
          fromModule: rooftop,
          toModule: eclairage,
          protocol: 'Contact Sec',
          type: 'wired',
          color: '#e74c3c',
          style: 'solid'
        });
      });
    });

    return connections;
  };

  const groupModulesByType = (moduleList) => {
    return moduleList.reduce((acc, module) => {
      const type = module.moduleType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(module);
      return acc;
    }, {});
  };

  const determineConnectionType = (fromType, toType) => {
    const connectionMap = {
      // GTB connections to other modules
      izit: {
        aero_eau: { protocol: 'ModBus RTU', type: 'wired', color: '#3498db', style: 'solid' },
        aero_gaz: { protocol: 'ModBus RTU', type: 'wired', color: '#3498db', style: 'solid' },
        rooftop: { protocol: 'ModBus RTU', type: 'wired', color: '#3498db', style: 'solid' },
        eclairage: { protocol: 'Contact Sec', type: 'wired', color: '#f39c12', style: 'dashed' },
        clim_ir: { protocol: 'IR Signal', type: 'wireless', color: '#9b59b6', style: 'dotted' },
        clim_filaire_simple: { protocol: 'ModBus RTU', type: 'wired', color: '#3498db', style: 'solid' },
        clim_filaire_groupe: { protocol: 'ModBus RTU', type: 'wired', color: '#3498db', style: 'solid' },
        comptage_froid: { protocol: 'Impulsion', type: 'wired', color: '#1abc9c', style: 'solid' },
        comptage_eclairage: { protocol: 'Impulsion', type: 'wired', color: '#1abc9c', style: 'solid' },
        sondes: { protocol: 'Analogique', type: 'wired', color: '#e67e22', style: 'solid' },
        sondes_presentes: { protocol: 'Contact Sec', type: 'wired', color: '#e67e22', style: 'dashed' },
        gaz_compteur: { protocol: 'Impulsion', type: 'wired', color: '#1abc9c', style: 'solid' }
      }
    };

    return connectionMap[fromType]?.[toType] || null;
  };

  const getModuleCenter = (module) => {
    const moduleWidth = 90; // From DraggableIcon width
    const moduleHeight = 32; // From DraggableIcon height

    return {
      x: (module.x * scaleRatio) + (moduleWidth / 2),
      y: (module.y * scaleRatio) + (moduleHeight / 2)
    };
  };

  const getConnectionPath = (fromModule, toModule) => {
    const start = getModuleCenter(fromModule);
    const end = getModuleCenter(toModule);

    // Create smooth curved paths for better visual appeal
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Control points for cubic bezier curve
    const controlOffset = Math.min(distance * 0.3, 50);
    const control1X = start.x + (deltaX > 0 ? controlOffset : -controlOffset);
    const control1Y = start.y;
    const control2X = end.x - (deltaX > 0 ? controlOffset : -controlOffset);
    const control2Y = end.y;

    return `M ${start.x} ${start.y} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${end.x} ${end.y}`;
  };

  const getStrokeDashArray = (connectionType) => {
    switch (connectionType) {
      case 'dashed': return '8,4';
      case 'dotted': return '2,3';
      default: return 'none';
    }
  };

  if (!connections.length) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5
      }}
    >
      {/* Define arrow markers for connection endpoints */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#666"
            stroke="#666"
            strokeWidth="1"
          />
        </marker>

        {/* Different arrow colors for different protocols */}
        <marker
          id="arrowhead-modbus"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#3498db"
            stroke="#3498db"
            strokeWidth="1"
          />
        </marker>

        <marker
          id="arrowhead-contact"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#f39c12"
            stroke="#f39c12"
            strokeWidth="1"
          />
        </marker>

        <marker
          id="arrowhead-wireless"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#9b59b6"
            stroke="#9b59b6"
            strokeWidth="1"
          />
        </marker>
      </defs>

      {/* Render all connections */}
      {connections.map(connection => {
        const path = getConnectionPath(connection.fromModule, connection.toModule);
        const midPoint = getModuleCenter(connection.fromModule);
        const endPoint = getModuleCenter(connection.toModule);
        const labelX = (midPoint.x + endPoint.x) / 2;
        const labelY = (midPoint.y + endPoint.y) / 2;

        const markerEnd = connection.protocol.includes('ModBus') ? 'url(#arrowhead-modbus)' :
                         connection.protocol.includes('Contact') ? 'url(#arrowhead-contact)' :
                         connection.protocol.includes('IR') ? 'url(#arrowhead-wireless)' :
                         'url(#arrowhead)';

        return (
          <g key={connection.id}>
            {/* Connection line */}
            <path
              d={path}
              stroke={connection.color}
              strokeWidth={connection.type === 'wireless' ? '2' : '2.5'}
              strokeDasharray={getStrokeDashArray(connection.style)}
              fill="none"
              markerEnd={markerEnd}
              opacity={0.8}
            />

            {/* Protocol label with background */}
            <rect
              x={labelX - 25}
              y={labelY - 8}
              width="50"
              height="16"
              fill="rgba(255, 255, 255, 0.9)"
              stroke={connection.color}
              strokeWidth="1"
              rx="8"
              ry="8"
            />

            <text
              x={labelX}
              y={labelY + 4}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill={connection.color}
              fontFamily="'Inter', sans-serif"
            >
              {connection.protocol}
            </text>

            {/* Wireless indicator for IR connections */}
            {connection.type === 'wireless' && (
              <g>
                <circle
                  cx={labelX + 30}
                  cy={labelY}
                  r="8"
                  fill="none"
                  stroke={connection.color}
                  strokeWidth="1"
                  opacity="0.6"
                />
                <circle
                  cx={labelX + 30}
                  cy={labelY}
                  r="5"
                  fill="none"
                  stroke={connection.color}
                  strokeWidth="1"
                  opacity="0.4"
                />
                <circle
                  cx={labelX + 30}
                  cy={labelY}
                  r="2"
                  fill={connection.color}
                  opacity="0.8"
                />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default ConnectionLines;