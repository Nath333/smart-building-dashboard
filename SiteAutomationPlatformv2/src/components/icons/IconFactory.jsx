import BaseIcon from './BaseIcon';
import { ICON_TYPES, ICON_CONFIG } from './IconRegistry';

// Shared SVG paths and components
const SVGPaths = {
  // Aerotherme - Compact air heater (professional design)
  aerotherme: (
    <g>
      {/* Main heater body - compact */}
      <rect x="3" y="7.5" width="18" height="9" fill="currentColor" stroke="#2c3e50" strokeWidth="0.7" rx="1.2"/>
      {/* Heating elements - distinctive orange bars */}
      <g fill="#FF6B35">
        <rect x="5.5" y="9" width="2.5" height="1.2" rx="0.3"/>
        <rect x="9" y="9" width="2.5" height="1.2" rx="0.3"/>
        <rect x="12.5" y="9" width="2.5" height="1.2" rx="0.3"/>
        <rect x="16" y="9" width="2.5" height="1.2" rx="0.3"/>
      </g>
      {/* Airflow vents */}
      <g stroke="white" strokeWidth="0.6" opacity="0.8">
        <line x1="5" y1="11.5" x2="19" y2="11.5"/>
        <line x1="5" y1="13" x2="19" y2="13"/>
        <line x1="5" y1="14.5" x2="19" y2="14.5"/>
      </g>
      {/* Fan indicator - compact */}
      <circle cx="12" cy="13" r="2" fill="none" stroke="white" strokeWidth="0.6" opacity="0.7"/>
      <g stroke="white" strokeWidth="0.5" opacity="0.7">
        <line x1="12" y1="11" x2="12" y2="15"/>
        <line x1="10" y1="13" x2="14" y2="13"/>
      </g>
    </g>
  ),

  // Climate control unit - Professional Split AC (compact & modern)
  climateUnit: (
    <g>
      {/* Main unit body - sleek design */}
      <rect x="2" y="7.5" width="20" height="9" fill="currentColor" stroke="#2c3e50" strokeWidth="0.7" rx="1"/>
      {/* Air outlet divider - clean line */}
      <line x1="2" y1="12.5" x2="22" y2="12.5" stroke="#2c3e50" strokeWidth="0.6"/>
      {/* Louvers - professional vents */}
      <g opacity="0.75" stroke="white" strokeWidth="0.5">
        <line x1="3.5" y1="13.5" x2="18" y2="13.5"/>
        <line x1="3.5" y1="14.5" x2="18" y2="14.5"/>
        <line x1="3.5" y1="15.5" x2="18" y2="15.5"/>
      </g>
      {/* Display panel - compact */}
      <rect x="3.5" y="8.5" width="4" height="2" fill="white" opacity="0.5" rx="0.4"/>
      {/* LED indicator */}
      <circle cx="20" cy="9.5" r="0.7" fill="#4CAF50"/>
      {/* Control indicator */}
      <line x1="19" y1="14" x2="21" y2="14" stroke="#2c3e50" strokeWidth="0.6"/>
    </g>
  ),

  // Climate control unit - Split AC Outdoor Unit (for reference)
  climateOutdoor: (
    <g>
      {/* Outdoor condenser unit */}
      <rect x="4" y="8" width="16" height="10" fill="currentColor" stroke="currentColor" strokeWidth="1" rx="1"/>
      {/* Fan grille pattern */}
      <g stroke="white" strokeWidth="0.6" fill="none" opacity="0.8">
        <circle cx="12" cy="13" r="3.5"/>
        <circle cx="12" cy="13" r="2"/>
        <line x1="12" y1="9.5" x2="12" y2="16.5"/>
        <line x1="8.5" y1="13" x2="15.5" y2="13"/>
        <line x1="9.5" y1="10" x2="14.5" y2="16"/>
        <line x1="14.5" y1="10" x2="9.5" y2="16"/>
      </g>
      {/* Ventilation slots */}
      <g stroke="white" strokeWidth="0.5" fill="none" opacity="0.6">
        <line x1="5" y1="9" x2="19" y2="9"/>
        <line x1="5" y1="17" x2="19" y2="17"/>
      </g>
    </g>
  ),

  // IR signal waves - Infrared sensor indicator
  irSignal: (
    <g opacity="0.85">
      {/* IR sensor window */}
      <circle cx="20" cy="10" r="1.2" fill="#E91E63" opacity="0.7"/>
      {/* Signal waves emanating from IR sensor */}
      <g stroke="#E91E63" strokeWidth="0.3" fill="none" opacity="0.6">
        <path d="M20 8.5 Q18.5 7.5 17 8.5"/>
        <path d="M20 8 Q18 6.5 16 8"/>
        <path d="M20.5 8.5 Q22 7.5 23.5 8.5"/>
      </g>
    </g>
  ),

  // Remote control - Compact AC remote
  remote: (
    <g>
      {/* Remote body - streamlined */}
      <rect x="9" y="6" width="6" height="12" fill="currentColor" stroke="#2c3e50" strokeWidth="0.5" rx="1"/>
      {/* LCD screen - compact */}
      <rect x="9.5" y="7" width="5" height="2.5" fill="#B3E5FC" opacity="0.85" rx="0.3"/>
      {/* Display segments */}
      <g fill="#01579B" opacity="0.5">
        <rect x="10" y="7.5" width="1.5" height="0.4" rx="0.1"/>
        <rect x="10" y="8.2" width="2.5" height="0.4" rx="0.1"/>
      </g>
      {/* Power button */}
      <circle cx="12" cy="11" r="0.8" fill="#E91E63"/>
      {/* Control buttons - compact grid */}
      <g fill="white" opacity="0.5">
        <rect x="10" y="12.5" width="1.5" height="1" rx="0.3"/>
        <rect x="12.5" y="12.5" width="1.5" height="1" rx="0.3"/>
        <circle cx="10.8" cy="15" r="0.7"/>
        <circle cx="13.2" cy="15" r="0.7"/>
      </g>
      {/* Bottom buttons */}
      <rect x="10.2" y="16.5" width="3.6" height="1" fill="white" opacity="0.4" rx="0.3"/>
    </g>
  ),

  // Water symbol with waves
  water: (
    <g>
      <circle cx="12" cy="12" r="10" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
      <path d="M6 12 Q9 8 12 12 Q15 16 18 12" stroke="white" strokeWidth="2" fill="none"/>
      <path d="M7 14 Q9 11 12 14 Q15 17 17 14" stroke="white" strokeWidth="1.5" fill="none"/>
    </g>
  ),

  // Gas/heat symbol
  flame: (
    <g>
      <path d="M12 2 Q8 6 8 12 Q8 16 12 20 Q16 16 16 12 Q16 6 12 2" fill="currentColor"/>
      <path d="M12 6 Q10 8 10 12 Q10 14 12 16 Q14 14 14 12 Q14 8 12 6" fill="white"/>
    </g>
  ),

  // Control box - Compact electrical cabinet
  controlBox: (
    <g>
      {/* Main cabinet - professional */}
      <rect x="5" y="5" width="14" height="14" fill="currentColor" stroke="#2c3e50" strokeWidth="0.7" rx="1"/>
      {/* Door panel */}
      <rect x="6" y="6" width="12" height="12" fill="currentColor" opacity="0.9" stroke="#2c3e50" strokeWidth="0.4" rx="0.6"/>
      {/* Ventilation - compact */}
      <g stroke="white" strokeWidth="0.5" opacity="0.6">
        <line x1="7" y1="7.5" x2="17" y2="7.5"/>
        <line x1="7" y1="8.5" x2="17" y2="8.5"/>
      </g>
      {/* Control elements - streamlined */}
      <g fill="white" opacity="0.6">
        <rect x="7.5" y="10.5" width="3.5" height="1.3" rx="0.3"/>
        <rect x="13" y="10.5" width="3.5" height="1.3" rx="0.3"/>
        <rect x="7.5" y="13" width="3.5" height="1.3" rx="0.3"/>
        <rect x="13" y="13" width="3.5" height="1.3" rx="0.3"/>
      </g>
      {/* LED indicators - compact */}
      <circle cx="8" cy="16" r="0.7" fill="#4CAF50"/>
      <circle cx="10.5" cy="16" r="0.7" fill="#FFC107"/>
      <circle cx="13" cy="16" r="0.7" fill="#2196F3"/>
      {/* Handle */}
      <circle cx="16.5" cy="12" r="0.6" fill="white" opacity="0.6"/>
    </g>
  ),

  // Sensor/monitoring device
  sensor: (
    <g>
      <circle cx="12" cy="12" r="8" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <path d="M12 4 Q8 8 12 12 Q16 8 12 4"/>
        <path d="M20 12 Q16 8 12 12 Q16 16 20 12"/>
        <path d="M12 20 Q16 16 12 12 Q8 16 12 20"/>
        <path d="M4 12 Q8 16 12 12 Q8 8 4 12"/>
      </g>
    </g>
  ),

  // Counter/meter
  counter: (
    <g>
      <rect x="3" y="8" width="18" height="8" fill="currentColor" stroke="currentColor" strokeWidth="1" rx="2"/>
      <rect x="5" y="10" width="14" height="4" fill="white" rx="1"/>
      <text x="12" y="13.5" fontSize="6" fill="currentColor" textAnchor="middle">000</text>
      <circle cx="17" cy="6" r="1.5" fill="currentColor"/>
      <circle cx="17" cy="18" r="1.5" fill="currentColor"/>
    </g>
  ),

  // Lighting fixture
  lighting: (
    <g>
      <circle cx="12" cy="10" r="6" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
      <g stroke="currentColor" strokeWidth="2" fill="none">
        <line x1="12" y1="2" x2="12" y2="4"/>
        <line x1="18.36" y1="4.64" x2="16.95" y2="6.05"/>
        <line x1="21" y1="10" x2="19" y2="10"/>
        <line x1="18.36" y1="15.36" x2="16.95" y2="13.95"/>
        <line x1="5.64" y1="4.64" x2="7.05" y2="6.05"/>
        <line x1="3" y1="10" x2="5" y2="10"/>
        <line x1="5.64" y1="15.36" x2="7.05" y2="13.95"/>
      </g>
      <rect x="11" y="16" width="2" height="4" fill="currentColor"/>
      <rect x="9" y="20" width="6" height="2" fill="currentColor" rx="1"/>
    </g>
  ),

  // Simple circle/zone marker
  circle: (
    <circle cx="12" cy="12" r="8" fill="currentColor" stroke="currentColor" strokeWidth="2"/>
  ),

  // Rooftop unit - Compact commercial HVAC
  rooftop: (
    <g>
      {/* Base unit - streamlined */}
      <rect x="3" y="8" width="18" height="8" fill="currentColor" stroke="#2c3e50" strokeWidth="0.7" rx="1"/>
      {/* Top section - compact */}
      <rect x="5" y="6" width="14" height="3" fill="currentColor" opacity="0.8" stroke="#2c3e50" strokeWidth="0.5" rx="0.6"/>
      {/* Dual fans - compact design */}
      <g opacity="0.9" stroke="white" strokeWidth="0.6">
        <circle cx="8.5" cy="12" r="2.2" fill="none"/>
        <circle cx="8.5" cy="12" r="1" fill="none" strokeWidth="0.4"/>
        <circle cx="15.5" cy="12" r="2.2" fill="none"/>
        <circle cx="15.5" cy="12" r="1" fill="none" strokeWidth="0.4"/>
      </g>
      {/* Ventilation - top */}
      <g stroke="white" strokeWidth="0.5" opacity="0.6">
        <line x1="6" y1="6.8" x2="18" y2="6.8"/>
        <line x1="6" y1="7.8" x2="18" y2="7.8"/>
      </g>
      {/* Bottom grille */}
      <g stroke="white" strokeWidth="0.4" opacity="0.6">
        <line x1="4" y1="14.5" x2="20" y2="14.5"/>
        <line x1="4" y1="15.5" x2="20" y2="15.5"/>
      </g>
    </g>
  ),
};

// Icon component factory
const IconFactory = ({ type, variant = 'default', style = {}, ...props }) => {
  const config = ICON_CONFIG[type];
  if (!config) {
    console.warn(`Unknown icon type: ${type}`);
    return null;
  }

  const iconStyle = {
    color: config.color,
    ...style,
  };

  // Map icon types to SVG content
  const getIconContent = () => {
    switch (type) {
      case ICON_TYPES.AEROTHERME:
        return SVGPaths.aerotherme;

      case ICON_TYPES.CLIM_IR:
        return (
          <g>
            {SVGPaths.climateUnit}
            {SVGPaths.irSignal}
            {variant === 'gtb' && SVGPaths.remote}
          </g>
        );
        
      case ICON_TYPES.CLIM_WIRE:
        return SVGPaths.climateUnit;
        
      case ICON_TYPES.ROOFTOP:
        return SVGPaths.rooftop;
        
      case ICON_TYPES.AERO_EAU:
        return (
          <g>
            {SVGPaths.water}
            <g fill="#FFD700" stroke="#FFA000" strokeWidth="0.5">
              <circle cx="12" cy="6" r="1"/>
              <circle cx="18" cy="12" r="1"/>
              <circle cx="12" cy="18" r="1"/>
              <circle cx="6" cy="12" r="1"/>
            </g>
          </g>
        );
        
      case ICON_TYPES.AERO_GAZ:
        return SVGPaths.flame;
        
      case ICON_TYPES.ECLAIRAGE:
        return SVGPaths.lighting;
        
      case ICON_TYPES.COFFRET_CLIM:
      case ICON_TYPES.COFFRET_AEROTHERME:
        return SVGPaths.controlBox;
        
      case ICON_TYPES.REMOTE_CONTROL:
        return SVGPaths.remote;
        
      case ICON_TYPES.COMPTAGE_AEROTHERME:
      case ICON_TYPES.COMPTAGE_CLIMATE:
      case ICON_TYPES.COMPTAGE_ROOFTOP:
      case ICON_TYPES.COMPTAGE_LIGHTING:
      case ICON_TYPES.COMPTAGE_FROID:
      case ICON_TYPES.COMPTAGE_ECLAIRAGE:
      case ICON_TYPES.GAZ_COMPTEUR:
        return SVGPaths.counter;
        
      case ICON_TYPES.SONDES:
      case ICON_TYPES.SONDES_PRESENTES:
        return SVGPaths.sensor;
        
      case ICON_TYPES.IZIT:
        return (
          <g>
            {SVGPaths.controlBox}
            <text x="12" y="13" fontSize="4" fill="white" textAnchor="middle" fontWeight="bold">GTB</text>
          </g>
        );
        
      case ICON_TYPES.CIRCLE:
        return SVGPaths.circle;
        
      case ICON_TYPES.CLIM_FILAIRE_SIMPLE:
        return (
          <g>
            {SVGPaths.climateUnit}
            <line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="2"/>
          </g>
        );
        
      case ICON_TYPES.CLIM_FILAIRE_GROUPE:
        return (
          <g>
            {SVGPaths.climateUnit}
            <g stroke="currentColor" strokeWidth="2">
              <line x1="6" y1="16" x2="18" y2="16"/>
              <line x1="8" y1="18" x2="16" y2="18"/>
              <line x1="10" y1="20" x2="14" y2="20"/>
            </g>
          </g>
        );
        
      default:
        return <circle cx="12" cy="12" r="8" fill="currentColor"/>;
    }
  };

  const viewBox = "0 0 24 24";

  return (
    <BaseIcon viewBox={viewBox} style={iconStyle} {...props}>
      {getIconContent()}
    </BaseIcon>
  );
};

export default IconFactory;