// DraggableCardList.jsx
import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useDrag } from 'react-dnd';
import { getSiteName } from '../../utils/siteContext';
import { IconFactory } from '../../components/icons';
import { fetchEquipmentCounts, fetchVisualPositions, saveVisualPositions } from '../../api/visualPlanApi';
// Module Icons now use IconFactory for consistency with legend
const ModuleIcons = {
  aerotherme: (props) => <IconFactory type="aerotherme" variant="visual" {...props} />,
  nb_contacts_aerotherme: (props) => <IconFactory type="nb_contacts_aerotherme" variant="visual" {...props} />,
  clim_ir: (props) => <IconFactory type="clim_ir" variant="visual" {...props} />,
  clim_wire: (props) => <IconFactory type="clim_wire" variant="visual" {...props} />,
  rooftop: (props) => <IconFactory type="rooftop" variant="visual" {...props} />,
  coffret_aerotherme: (props) => <IconFactory type="coffret_aerotherme" variant="visual" {...props} />,
  coffret_clim: (props) => <IconFactory type="coffret_clim" variant="visual" {...props} />,
  remote_control: (props) => <IconFactory type="remote_control" variant="visual" {...props} />,
  circle: (props) => <IconFactory type="circle" variant="visual" {...props} />,
};

const ItemType = 'CARD';

const DraggableIcon = memo(({ id, x, y, label, moduleType, onPositionChange, onIconClick }) => {
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
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(ref);
  const isCircle = moduleType === 'circle';

  const IconComponent = ModuleIcons[moduleType];
  return (
    <div
      ref={ref}
      onClick={() => onIconClick(id)}
      style={{
        position: 'absolute',
        transform: `translate(${x}px, ${y}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s',
        willChange: 'transform',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 6,
        padding: isCircle ? '4px' : '6px 10px',
        minWidth: isCircle ? 20 : 90,
        width: isCircle ? 20 : 90,
        height: isCircle ? 20 : 32,
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
        borderRadius: isCircle ? '50%' : '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: isDragging
          ? '0 8px 25px rgba(0, 0, 0, 0.15), 0 3px 10px rgba(0, 0, 0, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
      }}
    >
      {IconComponent && !isCircle && (
        <IconComponent width="18" height="18" style={{ flexShrink: 0, minWidth: '18px', minHeight: '18px', maxWidth: '18px', maxHeight: '18px' }} />
      )}
      {!isCircle && <span style={{ fontSize: 11, fontWeight: 600, color: '#2c3e50', whiteSpace: 'nowrap', letterSpacing: '0.3px', lineHeight: 1.2, opacity: 0.9 }}>{label}</span>}
    </div>
  );
});
const DraggableCardList = ({
  imageNaturalWidth,
  imageDisplayedWidth,
  imageId = null, // Optional image ID for multi-image support
  visibleIcons = null // Optional list of icons to show (for filtered view)
}) => {
  const containerRef = useRef(null);
  const [cards, setCards] = useState([]);
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [lines, setLines] = useState([]);
  const [pendingLine, setPendingLine] = useState(null);

  // Get site name from centralized utility
  const siteName = getSiteName();

  const scaleRatio = imageNaturalWidth && imageDisplayedWidth ? imageDisplayedWidth / imageNaturalWidth : 1;

  const handleIconClick = (id) => {
    if (pendingLine && pendingLine.id !== id) {
      const exists = lines.some(line =>
        (line.from === pendingLine.id && line.to === id) ||
        (line.from === id && line.to === pendingLine.id)
      );
      if (exists) {
        setLines(lines => lines.filter(line =>
          !((line.from === pendingLine.id && line.to === id) ||
            (line.from === id && line.to === pendingLine.id))
        ));
      } else {
        setLines(lines => [...lines, { from: pendingLine.id, to: id }]);
      }
      setPendingLine(null);
    } else {
      setPendingLine({ id });
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    const bounds = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - bounds.left;
    const clickY = e.clientY - bounds.top;
    setLines((prevLines) =>
      prevLines.filter((line) => {
        const from = cards.find(c => c.id === line.from);
        const to = cards.find(c => c.id === line.to);
        if (!from || !to) return true;
        const x1 = (from.x - transform.x) * scaleRatio + 65;
        const y1 = (from.y - transform.y) * scaleRatio + 25;
        const x2 = (to.x - transform.x) * scaleRatio + 65;
        const y2 = (to.y - transform.y) * scaleRatio + 25;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        return Math.abs(midX - clickX) > 15 || Math.abs(midY - clickY) > 15;
      })
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`🔍 DraggableCardList loading data for site: ${siteName}`);

        // ✅ NEW: Fetch equipment counts from normalized DB
        const counts = await fetchEquipmentCounts(siteName);
        console.log('📊 Equipment counts from normalized DB:', counts);

        // Calculate total counts for icon generation
        const totalAerotherme = counts.aerotherme.reduce((sum, zone) => sum + zone.count, 0);
        const totalClimIr = counts.clim_ir.reduce((sum, zone) => sum + zone.count, 0);
        const totalClimWire = counts.clim_wire.reduce((sum, zone) => sum + zone.count, 0);
        const totalRooftop = counts.rooftop.reduce((sum, zone) => sum + zone.count, 0);

        console.log('📊 Total counts:', { totalAerotherme, totalClimIr, totalClimWire, totalRooftop });

        // ✅ NEW: Fetch saved positions from visual_positions table (with optional imageId)
        let savedPositions = [];
        try {
          savedPositions = await fetchVisualPositions(siteName, 'vt_plan', imageId);
          console.log(`📍 Loaded saved positions from visual_positions table (imageId: ${imageId || 'default'}):`, savedPositions);
        } catch (err) {
          console.log('ℹ️ No saved positions found (first time setup)');
        }

        // ✅ Try to use localStorage SHAPES for backward compatibility with lines
        const savedCardsRaw = localStorage.getItem('draggableCards');
        let savedCards = [];
        let savedLines = [];

        if (savedCardsRaw) {
          try {
            const savedData = JSON.parse(savedCardsRaw);
            // Handle both old format (array) and new format (object with cards and lines)
            if (Array.isArray(savedData)) {
              savedCards = savedData;
              savedLines = [];
            } else {
              savedCards = savedData.cards || [];
              savedLines = savedData.lines || [];
            }
            console.log('📍 Using localStorage shapes (for lines):', { savedLines });
          } catch (e) {
            console.error('❌ Failed to parse saved cards:', e);
          }
        }
        
        // 🏷️ ENRICH saved cards with proper labels and moduleTypes
        const enrichCard = (card) => {
          const idPrefix = card.id.split('-')[0]; // Extract "aero" from "aero-1"
          const idNumber = card.id.split('-')[1]; // Extract "1" from "aero-1"
          
          const typeMapping = {
            'aero': { label: `Aero${idNumber}`, moduleType: 'aerotherme' },
            'contact': { label: `Contact${idNumber}`, moduleType: 'nb_contacts_aerotherme' },
            'clim': { label: `Clim Ir${idNumber}`, moduleType: 'clim_ir' },
            'climwire': { label: `Clim Fil${idNumber}`, moduleType: 'clim_wire' },
            'cmdclim': { label: `Cmd Fil${idNumber}`, moduleType: 'remote_control' },
            'rooftop': { label: `Rooftop${idNumber}`, moduleType: 'rooftop' },
            'circle': { label: '', moduleType: 'circle' }
          };
          
          const mapping = typeMapping[idPrefix] || { label: card.id, moduleType: 'circle' };
          
          return {
            ...card,
            label: mapping.label,
            moduleType: mapping.moduleType
          };
        };
        
        // ✅ NEW: Generate icons based on normalized DB counts
        console.log('🔧 Generating icons from normalized DB equipment counts');
        const generatedCards = [];
        let xPosition = 50;
        let yPosition = 50;
        const spacing = 120;

        // Generate aerotherme icons
        for (let i = 0; i < totalAerotherme; i++) {
          generatedCards.push({
            id: `aero-${i + 1}`,
            label: `Aero${i + 1}`,
            x: xPosition,
            y: yPosition,
            moduleType: 'aerotherme'
          });
          xPosition += spacing;
          if (xPosition > 500) {
            xPosition = 50;
            yPosition += 70;
          }
        }

        // Generate clim IR icons
        for (let i = 0; i < totalClimIr; i++) {
          generatedCards.push({
            id: `clim-${i + 1}`,
            label: `Clim Ir${i + 1}`,
            x: xPosition,
            y: yPosition,
            moduleType: 'clim_ir'
          });
          xPosition += spacing;
          if (xPosition > 500) {
            xPosition = 50;
            yPosition += 70;
          }
        }

        // Generate clim wire icons
        for (let i = 0; i < totalClimWire; i++) {
          generatedCards.push({
            id: `climwire-${i + 1}`,
            label: `Clim Fil${i + 1}`,
            x: xPosition,
            y: yPosition,
            moduleType: 'clim_wire'
          });
          xPosition += spacing;
          if (xPosition > 500) {
            xPosition = 50;
            yPosition += 70;
          }
        }

        // Generate rooftop icons
        for (let i = 0; i < totalRooftop; i++) {
          generatedCards.push({
            id: `rooftop-${i + 1}`,
            label: `Rooftop${i + 1}`,
            x: xPosition,
            y: yPosition,
            moduleType: 'rooftop'
          });
          xPosition += spacing;
          if (xPosition > 500) {
            xPosition = 50;
            yPosition += 70;
          }
        }

        // ✅ Merge with saved positions from visual_positions table
        const positionMap = new Map(savedPositions.map(p => [p.id, p]));
        let finalCards = generatedCards.map(card => {
          const savedPos = positionMap.get(card.id);
          if (savedPos) {
            return {
              ...card,
              x: savedPos.x,
              y: savedPos.y
            };
          }
          return card;
        });

        // ✅ Filter cards to only show assigned icons if visibleIcons is provided
        if (visibleIcons && Array.isArray(visibleIcons) && visibleIcons.length > 0) {
          const visibleIconIds = new Set(visibleIcons.map(icon => icon.id));
          finalCards = finalCards.filter(card => visibleIconIds.has(card.id));
          console.log(`🔍 Filtered to ${finalCards.length} visible icons for image ${imageId}`);
        }

        console.log('🎯 Final cards with positions:', finalCards);

        console.log('🎯 Setting finalCards:', finalCards.length, 'cards');
        console.log('📋 Cards details:', finalCards);
        console.log('🔗 Setting savedLines:', savedLines.length, 'lines');
        setCards(finalCards);
        setLines(savedLines);
      } catch (err) {
        console.error('❌ Erreur lors du fetch SQL:', err);
      }
    };
    
    // Only fetch if we have a valid site name
    if (siteName && siteName !== 'unknown') {
      fetchData();
    }
  }, [siteName, imageId, visibleIcons]);

  const updateCard = useCallback((id, updates) => {
    setCards(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  // ✅ NEW: Save positions to visual_positions table when cards change
  useEffect(() => {
    const savePositions = async () => {
      if (siteName && siteName !== 'unknown') {
        // Save to localStorage (for lines backward compatibility)
        const dataToSave = {
          cards,
          lines
        };
        localStorage.setItem('draggableCards', JSON.stringify(dataToSave));

        // ✅ Save positions to visual_positions table (even if empty to clear DB)
        try {
          const positions = cards.map(card => ({
            id: card.id,
            x: card.x,
            y: card.y
          }));
          await saveVisualPositions(siteName, 'vt_plan', positions, imageId);
          console.log(`✅ Positions auto-saved to visual_positions table (${positions.length} positions, imageId: ${imageId || 'default'})`);
        } catch (err) {
          console.error('❌ Failed to save positions to DB:', err);
        }
      }
    };

    // Debounce the save to avoid too many DB writes
    const timeoutId = setTimeout(savePositions, 1000);
    return () => clearTimeout(timeoutId);
  }, [cards, lines, siteName, imageId]);

  return (
    <>
      <style>
        {`
          @keyframes linePulse {
            0%, 100% {
              opacity: 0.3;
              filter: brightness(1);
            }
            50% {
              opacity: 0.7;
              filter: brightness(1.3);
            }
          }
        `}
      </style>
      <div
        ref={containerRef}
        onContextMenu={handleRightClick}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}
      >
<button
  onClick={() => {
    const id = `circle-${Date.now()}`;
    setCards(prev => [
      ...prev,
      {
        id,
        label: '',
        x: 100,
        y: 100,
        moduleType: 'circle',
        isCircle: true,
        width: 30,
        height: 30,
      },
    ]);
  }}
  style={{
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1000,
    padding: '3px 6px',
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: '12px',
    lineHeight: '1',
    cursor: 'pointer',
  }}
>
  ⭕ Add Circle
</button>
{lines.map((line, idx) => {
  const from = cards.find(c => c.id === line.from);
  const to = cards.find(c => c.id === line.to);
  if (!from || !to) return null;

  const fromType = from.moduleType || '';
  const toType = to.moduleType || '';
  const isCircleLine = fromType === 'circle' || toType === 'circle';

  // Offsets: smaller for circle
  const getOffset = (type) =>
    type === 'circle'
      ? { x: 5, y: 5 }
      : { x: 65, y: 25 };

  const fromOffset = getOffset(fromType);
  const toOffset = getOffset(toType);

  const x1 = (from.x - transform.x) * scaleRatio + fromOffset.x;
  const y1 = (from.y - transform.y) * scaleRatio + fromOffset.y;
  const x2 = (to.x - transform.x) * scaleRatio + toOffset.x;
  const y2 = (to.y - transform.y) * scaleRatio + toOffset.y;

  // Compute length and angle for CSS line
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Modern line styling
  const lineColor = isCircleLine ? '#ff4757' : '#3742fa';
  const lineWidth = isCircleLine ? 4 : 3;
  const shadowColor = isCircleLine ? 'rgba(255, 71, 87, 0.3)' : 'rgba(55, 66, 250, 0.3)';

  return (
    <React.Fragment key={`line-div-${idx}`}>
      {/* Modern Line with Gradient and Shadow */}
      <div
        style={{
          position: 'absolute',
          left: `${x1}px`,
          top: `${y1}px`,
          width: `${length}px`,
          height: `${lineWidth}px`,
          background: `linear-gradient(90deg, ${lineColor}cc, ${lineColor}, ${lineColor}cc)`,
          pointerEvents: 'none',
          zIndex: 2,
          transform: `rotate(${angle}deg)`,
          transformOrigin: '0 50%',
          borderRadius: `${lineWidth}px`,
          boxShadow: `0 0 8px ${shadowColor}, 0 2px 4px rgba(0,0,0,0.1)`,
          filter: 'brightness(1.1)',
        }}
      />
      {/* Animated pulse overlay for circle lines */}
      {isCircleLine && (
        <div
          style={{
            position: 'absolute',
            left: `${x1}px`,
            top: `${y1 - 1}px`,
            width: `${length}px`,
            height: `${lineWidth + 2}px`,
            background: `linear-gradient(90deg, transparent, ${lineColor}66, transparent)`,
            pointerEvents: 'none',
            zIndex: 3,
            transform: `rotate(${angle}deg)`,
            transformOrigin: '0 50%',
            borderRadius: `${lineWidth + 2}px`,
            animation: 'linePulse 2s ease-in-out infinite',
          }}
        />
      )}
    </React.Fragment>
  );
})}
      {cards.map(card => (
        <DraggableIcon
          key={card.id}
          {...card}
          x={(card.x - transform.x) * scaleRatio}
          y={(card.y - transform.y) * scaleRatio}
          onPositionChange={(id, x, y) => {
            const realX = x / scaleRatio + transform.x;
            const realY = y / scaleRatio + transform.y;
            updateCard(id, { x: realX, y: realY });
          }}
          onIconClick={handleIconClick}
        />
      ))}
      </div>
    </>
  );
};

export default DraggableCardList;
