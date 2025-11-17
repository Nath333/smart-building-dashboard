import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useDrag } from 'react-dnd';
import { API_BASE_URL } from '../../api/apiConfig';
import { getSiteName } from '../../utils/siteContext';
import { IconFactory } from '../../components/icons';
import ConnectionLines from './ConnectionLines';

// GTB Module Icons mapping - now uses IconFactory for consistency with legend
const GtbModuleIcons = {
  aero_eau: (props) => <IconFactory type="aero_eau" variant="gtb" {...props} />,
  aero_gaz: (props) => <IconFactory type="aero_gaz" variant="gtb" {...props} />,
  rooftop: (props) => <IconFactory type="rooftop" variant="gtb" {...props} />,
  eclairage: (props) => <IconFactory type="eclairage" variant="gtb" {...props} />,
  clim_ir: (props) => <IconFactory type="clim_ir" variant="gtb" {...props} />,
  clim_filaire_simple: (props) => <IconFactory type="clim_filaire_simple" variant="gtb" {...props} />,
  clim_filaire_groupe: (props) => <IconFactory type="clim_filaire_groupe" variant="gtb" {...props} />,
  comptage_froid: (props) => <IconFactory type="comptage_froid" variant="gtb" {...props} />,
  comptage_eclairage: (props) => <IconFactory type="comptage_eclairage" variant="gtb" {...props} />,
  sondes: (props) => <IconFactory type="sondes" variant="gtb" {...props} />,
  sondes_presentes: (props) => <IconFactory type="sondes_presentes" variant="gtb" {...props} />,
  gaz_compteur: (props) => <IconFactory type="gaz_compteur" variant="gtb" {...props} />,
  izit: (props) => <IconFactory type="izit" variant="gtb" {...props} />,
};

// GTB icons use modern glass effect instead of colored backgrounds
// Colors are now handled by the IconFactory components themselves

const ItemType = 'CARD';

const DraggableIcon = memo(({ id, x, y, label, moduleType, onPositionChange }) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id },
    end: (_, monitor) => {
      const offset = monitor.getClientOffset();
      const bounds = ref.current?.parentNode?.getBoundingClientRect();
      if (offset && bounds) {
        const iconRect = ref.current?.getBoundingClientRect();
        const iconWidth = iconRect?.width || 80;
        const iconHeight = iconRect?.height || 50;

        const newX = Math.max(0, Math.min(bounds.width - iconWidth, offset.x - bounds.left - iconWidth / 2));
        const newY = Math.max(0, Math.min(bounds.height - iconHeight, offset.y - bounds.top - iconHeight / 2));

        onPositionChange(id, newX, newY);
      }
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  });

  drag(ref);

  const IconComponent = GtbModuleIcons[moduleType];
  
  // Debug: Warn if moduleType mapping is missing
  if (!GtbModuleIcons[moduleType]) {
    console.warn('🔍 Missing GTB icon for moduleType:', moduleType, 'Available:', Object.keys(GtbModuleIcons));
  }

return (
  <div
    ref={ref}
    style={{
      position: 'absolute',
      transform: `translate(${x}px, ${y}px)`,
      transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s',
      willChange: 'transform',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 6,
      padding: '6px 10px',
      minWidth: 90,
      width: 90,
      height: 32,
      fontSize: 11,
      fontWeight: 600,
      color: '#2c3e50',
      fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
      cursor: 'pointer',
      userSelect: 'none',
      pointerEvents: 'auto',
      opacity: isDragging ? 0.8 : 1,
      scale: isDragging ? 1.02 : 1,
      zIndex: isDragging ? 999 : 10,
      borderRadius: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: isDragging
        ? '0 8px 25px rgba(0, 0, 0, 0.15), 0 3px 10px rgba(0, 0, 0, 0.1)'
        : '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
    }}

  >
    {IconComponent && (
      <IconComponent
        width="18"
        height="18"
        style={{
          flexShrink: 0,
          minWidth: '18px',
          minHeight: '18px',
          maxWidth: '18px',
          maxHeight: '18px'
        }}
      />
    )}

    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#2c3e50',
        whiteSpace: 'nowrap',
        letterSpacing: '0.3px',
        lineHeight: 1.2,
        opacity: 0.9
      }}
    >
      {label}
    </span>
  </div>
);
});

const DraggableCardList = ({ imageNaturalWidth, imageDisplayedWidth }) => {
  const containerRef = useRef(null);
  const [cards, setCards] = useState([]);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    const fetchGtbData = async () => {
      const siteName = getSiteName();
      
      if (!siteName || siteName === 'unknown') {
        console.log('⚠️ No valid site name for GTB data');
        return;
      }
      
      // Check if there are saved positions from PlanPageBase (loaded from SQL)
      const savedCards = localStorage.getItem('draggableCards');
      let existingSavedCards = [];
      
      if (savedCards) {
        try {
          existingSavedCards = JSON.parse(savedCards);
          console.log('📍 Found saved GTB card positions from SQL:', existingSavedCards);
          
          // If saved positions exist and look valid, enrich them with moduleType and use them
          if (Array.isArray(existingSavedCards) && existingSavedCards.length > 0) {
            console.log('✅ Using saved GTB positions - enriching with moduleType');
            
            // Enrich saved cards with proper moduleType based on ID pattern
            const enrichedCards = existingSavedCards.map(card => {
              const idPrefix = card.id.split('-')[0]; // Extract "aero" from "aero-1"
              
              // Map ID prefixes to GTB moduleTypes (matching generation logic)
              const moduleTypeMapping = {
                'aeau': 'aero_eau',     // aeroeau -> aeau prefix
                'agaz': 'aero_gaz',     // aerogaz -> agaz prefix
                'ecla': 'eclairage',    // eclairage -> ecla prefix
                'clim': 'clim_ir',
                'roof': 'rooftop', 
                'Comp': 'comptage_froid',
                'sond': 'sondes',
                'pres': 'sondes_presentes',
                'gaz': 'gaz_compteur',
                'izit': 'izit',
                'Izit': 'izit' // Alternative case
              };
              
              const moduleType = moduleTypeMapping[idPrefix] || 'eclairage'; // fallback
              
              return {
                ...card,
                moduleType,
                label: card.label || `${idPrefix}${card.id.split('-')[1] || ''}` // Reconstruct label if missing
              };
            });
            
            console.log('🔄 Enriched saved GTB cards:', enrichedCards);
            setCards(enrichedCards);
            return;
          }
        } catch (e) {
          console.warn('⚠️ Failed to parse saved GTB cards, generating new ones:', e);
        }
      }
      
      try {
        console.log('📡 Fetching GTB data from Page 5 for site:', siteName);
        const response = await fetch(`${API_BASE_URL}/get-page3`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: siteName })
        });
        
        if (!response.ok) {
          console.log('📭 No GTB data found');
          return;
        }
        
        const gtbData = await response.json();
        console.log('📥 GTB data received:', gtbData);
        
        const generateGtbCards = (count, prefix, labelPrefix, xBase, yBase, moduleType) =>
          Array.from({ length: count }, (_, i) => ({
            id: `${prefix}-${i + 1}`,
            label: `${labelPrefix}${i + 1}`,
            x: xBase + (i % 5) * 90,
            y: yBase + Math.floor(i / 5) * 60,
            moduleType
          }));
        
        let allGtbCards = [];
        let yOffset = 50;
        
        // Generate cards for each GTB module type
        if (gtbData.modules && Array.isArray(gtbData.modules)) {
          gtbData.modules.forEach(moduleType => {
            const count = gtbData[moduleType] || 0;
            if (count > 0) {
              // Convert database field names to legend-compatible names
              const legendModuleType = moduleType === 'aeroeau' ? 'aero_eau' :
                                     moduleType === 'aerogaz' ? 'aero_gaz' :
                                     moduleType === 'Comptage_Froid' ? 'comptage_froid' :
                                     moduleType === 'Comptage_Eclairage' ? 'comptage_eclairage' :
                                     moduleType === 'sondesPresentes' ? 'sondes_presentes' :
                                     moduleType === 'gazCompteur' ? 'gaz_compteur' :
                                     moduleType === 'Izit' ? 'izit' :
                                     moduleType;
              
              // Generate unique prefix for each module type
              const uniquePrefix = moduleType === 'aeroeau' ? 'aeau' :
                                  moduleType === 'aerogaz' ? 'agaz' :
                                  moduleType.slice(0,4);
              
              const moduleCards = generateGtbCards(
                count,
                uniquePrefix, // Unique prefix
                moduleType.charAt(0).toUpperCase() + moduleType.slice(1).substring(0,3), // Label
                50,
                yOffset,
                legendModuleType
              );
              allGtbCards = [...allGtbCards, ...moduleCards];
              yOffset += 70;
            }
          });
        }
        
        // Add special modules
        if (gtbData.sondes > 0) {
          const sondesCards = generateGtbCards(gtbData.sondes, 'sond', 'Temp', 50, yOffset, 'sondes');
          allGtbCards = [...allGtbCards, ...sondesCards];
          yOffset += 70;
        }
        
        if (gtbData.sondesPresentes > 0) {
          const presenceCards = generateGtbCards(gtbData.sondesPresentes, 'pres', 'Pres', 50, yOffset, 'sondes_presentes');
          allGtbCards = [...allGtbCards, ...presenceCards];
          yOffset += 70;
        }
        
        if (gtbData.gazCompteur === 'oui') {
          allGtbCards.push({
            id: 'gaz-1',
            label: 'Gaz',
            x: 50,
            y: yOffset,
            moduleType: 'gaz_compteur'
          });
          yOffset += 70;
        }
        
        if (gtbData.Izit && Array.isArray(gtbData.Izit) && gtbData.Izit.length > 0) {
          gtbData.Izit.forEach((coffretType, i) => {
            allGtbCards.push({
              id: `izit-${i + 1}`,
              label: `GTB${i + 1}`,
              x: 50 + (i * 90),
              y: yOffset,
              moduleType: 'izit'
            });
          });
        }
        
        console.log('🎯 Generated fresh GTB cards:', allGtbCards);
        setCards(allGtbCards);
        
      } catch (err) {
        console.error('❌ Error fetching GTB data:', err);
      }
    };
    
    fetchGtbData();
  }, []);

  useEffect(() => {
    const cardsAndConnections = {
      cards,
      lines: connections
    };
    localStorage.setItem('draggableCards', JSON.stringify(cardsAndConnections));
  }, [cards, connections]);
  const updateCard = useCallback((id, updates) => {
    setCards(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const handleConnectionUpdate = useCallback((newConnections) => {
    setConnections(newConnections);
  }, []);

  
  const scaleRatio = imageNaturalWidth && imageDisplayedWidth ? imageDisplayedWidth / imageNaturalWidth : 1;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto'
      }}
    >
      {/* Connection Lines Layer */}
      <ConnectionLines
        modules={cards}
        imageNaturalWidth={imageNaturalWidth}
        imageDisplayedWidth={imageDisplayedWidth}
        onConnectionUpdate={handleConnectionUpdate}
      />

      {/* Draggable Modules Layer */}
      {cards.map(card => (
        <DraggableIcon
          key={card.id}
          id={card.id}
          x={card.x * scaleRatio}
          y={card.y * scaleRatio}
          label={card.label}
          moduleType={card.moduleType}
          onPositionChange={(id, newX, newY) => {
            updateCard(id, {
              x: newX / scaleRatio,
              y: newY / scaleRatio
            });
          }}
        />
      ))}
    </div>
  );
};

export default DraggableCardList;
