// DraggableCardList.jsx
import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useDrag } from 'react-dnd';
import { getSiteName } from '../../utils/siteContext';
import { IconFactory } from '../../components/icons';
import { fetchEquipmentCounts, fetchVisualPositions, saveVisualPositions } from '../../api/visualPlanApi';
import PlanToolbox from './PlanToolbox';
import GaineIcon from '../../components/icons/GaineIcon';

// Import PNG images
import aeroIcon from '../../assets/icons/aerotherme.png';
import climIrIcon from '../../assets/icons/clim_ir.png';
import climWireIcon from '../../assets/icons/clim_wire.png';
import rooftopIcon from '../../assets/icons/rooftop.png';
import coffretAeroIcon from '../../assets/icons/coffret_aerotherme.png';
import remoteIcon from '../../assets/icons/remote_control.png';

// Module Icons now use PNG images for better visual quality (except circle which is SVG)
const ModuleIcons = {
  aerotherme: (props) => <img src={aeroIcon} alt="Aerotherme" style={{ width: 56, height: 56, objectFit: 'contain' }} {...props} />,
  clim_ir: (props) => <img src={climIrIcon} alt="Climate IR" style={{ width: 56, height: 56, objectFit: 'contain' }} {...props} />,
  clim_wire: (props) => <img src={climWireIcon} alt="Climate Wire" style={{ width: 56, height: 56, objectFit: 'contain' }} {...props} />,
  rooftop: (props) => <img src={rooftopIcon} alt="Rooftop" style={{ width: 56, height: 56, objectFit: 'contain' }} {...props} />,
  coffret_aerotherme: (props) => <img src={coffretAeroIcon} alt="Coffret Aero" style={{ width: 56, height: 56, objectFit: 'contain' }} {...props} />,
  coffret_clim: (props) => <img src={coffretAeroIcon} alt="Coffret Clim" style={{ width: 56, height: 56, objectFit: 'contain' }} {...props} />,
  remote_control: (props) => <img src={remoteIcon} alt="Remote" style={{ width: 56, height: 56, objectFit: 'contain' }} {...props} />,
  circle: (props) => <IconFactory type="circle" variant="visual" {...props} />,
  gaine: (props) => <GaineIcon {...props} />,
};

const ItemType = 'CARD';

const DraggableIcon = memo(({ id, x, y, label, moduleType, onPositionChange, onIconClick, onDoubleClick, width, height, onResize, orientation }) => {
  const ref = useRef(null);
  const lastClickTime = useRef(0);
  const clickTimeout = useRef(null);
  const dragStartPos = useRef(null);
  const hasDragged = useRef(false);

  const isCircle = moduleType === 'circle';
  const isGaine = moduleType === 'gaine';

  // Resize handle drag handlers (for gaine) - DECLARE BEFORE USING
  const [isResizing, setIsResizing] = useState(false);
  const [tempSize, setTempSize] = useState(null); // For visual feedback during resize
  const resizeStartPos = useRef(null);
  const resizeThrottleTimer = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: () => {
      // Prevent drag if currently resizing
      if (isResizing) {
        return null;
      }
      // Record starting position when drag begins (v14+ API)
      const offset = ref.current?.getBoundingClientRect();
      if (offset) {
        dragStartPos.current = { x: offset.left, y: offset.top };
      }
      hasDragged.current = false;
      return { id };
    },
    canDrag: () => !isResizing, // Disable dragging during resize
    end: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const bounds = ref.current?.parentNode?.getBoundingClientRect();

      // Check if actually dragged (moved more than 5px)
      if (dragStartPos.current && offset) {
        const dx = Math.abs(offset.x - dragStartPos.current.x);
        const dy = Math.abs(offset.y - dragStartPos.current.y);
        hasDragged.current = (dx > 5 || dy > 5);
      }

      if (offset && bounds && hasDragged.current) {
        const iconRect = ref.current?.getBoundingClientRect();
        const iconWidth = iconRect?.width || 90;
        const iconHeight = iconRect?.height || 42;
        const newX = Math.max(0, Math.min(bounds.width - iconWidth, offset.x - bounds.left - iconWidth / 2));
        const newY = Math.max(0, Math.min(bounds.height - iconHeight, offset.y - bounds.top - iconHeight / 2));
        onPositionChange(id, newX, newY);
      }

      dragStartPos.current = null;
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }, [isResizing]);
  drag(ref);

  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    const currentWidth = width || 100;
    const currentHeight = height || 30;

    // Lock orientation at resize start - don't recalculate during resize
    const lockedOrientation = orientation === 'vertical' ||
                              (orientation === 'auto' && currentHeight > currentWidth) ? 'vertical' : 'horizontal';

    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: currentWidth,
      height: currentHeight,
      orientation: lockedOrientation // Store locked orientation
    };
    setTempSize({ width: currentWidth, height: currentHeight });
  };

  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !resizeStartPos.current) return;

    e.preventDefault();

    // Use locked orientation from resize start
    const isVertical = resizeStartPos.current.orientation === 'vertical';

    if (isVertical) {
      // Resize vertically (change height only)
      const dy = e.clientY - resizeStartPos.current.y;
      const newHeight = Math.max(60, Math.min(500, resizeStartPos.current.height + dy));

      // Update visual feedback immediately
      setTempSize({ width: resizeStartPos.current.width, height: newHeight });

      // Throttle actual state updates for performance (update every 16ms = ~60fps)
      if (resizeThrottleTimer.current) {
        clearTimeout(resizeThrottleTimer.current);
      }
      resizeThrottleTimer.current = setTimeout(() => {
        if (onResize) {
          onResize(id, resizeStartPos.current.width, newHeight);
        }
      }, 16);
    } else {
      // Resize horizontally (change width only)
      const dx = e.clientX - resizeStartPos.current.x;
      const newWidth = Math.max(60, Math.min(800, resizeStartPos.current.width + dx));

      // Update visual feedback immediately
      setTempSize({ width: newWidth, height: resizeStartPos.current.height });

      // Throttle actual state updates for performance (update every 16ms = ~60fps)
      if (resizeThrottleTimer.current) {
        clearTimeout(resizeThrottleTimer.current);
      }
      resizeThrottleTimer.current = setTimeout(() => {
        if (onResize) {
          onResize(id, newWidth, resizeStartPos.current.height);
        }
      }, 16);
    }
  }, [isResizing, id, onResize]);

  const handleResizeEnd = useCallback(() => {
    // Clear throttle timer
    if (resizeThrottleTimer.current) {
      clearTimeout(resizeThrottleTimer.current);
    }

    // Do final update with tempSize to ensure state is synced
    if (tempSize && onResize) {
      onResize(id, tempSize.width, tempSize.height);
    }

    setIsResizing(false);
    setTempSize(null);
    resizeStartPos.current = null;
  }, [id, onResize, tempSize]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const handleClick = (e) => {
    // Don't process clicks if user just dragged
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }

    e.stopPropagation();
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;

    if (timeSinceLastClick < 300) {
      // Double click detected
      clearTimeout(clickTimeout.current);
      if (onDoubleClick) {
        onDoubleClick(id);
      }
      lastClickTime.current = 0; // Reset
    } else {
      // Single click - wait to see if it's a double click
      clearTimeout(clickTimeout.current);
      clickTimeout.current = setTimeout(() => {
        if (onIconClick) {
          onIconClick(id);
        }
      }, 300);
      lastClickTime.current = now;
    }
  };

  const IconComponent = ModuleIcons[moduleType];

  // Calculate dimensions for different types - use tempSize during resize for immediate feedback
  const displayWidth = isGaine && tempSize ? tempSize.width : (width || 100);
  const displayHeight = isGaine && tempSize ? tempSize.height : (height || 30);
  const itemWidth = isCircle ? 24 : (isGaine ? displayWidth : 'auto');
  const itemHeight = isCircle ? 24 : (isGaine ? displayHeight : 'auto');

  return (
    <div
      ref={ref}
      className={isCircle ? 'draggable-icon-circle' : 'draggable-icon-pro'}
      onClick={handleClick}
      title={isCircle ? 'Double-click to delete' : (isGaine ? 'Drag to move, drag handle to resize' : '')}
      style={{
        position: 'absolute',
        transform: isDragging ? `translate(${x}px, ${y}px) scale(1.08)` : `translate(${x}px, ${y}px)`,
        transition: (isDragging || isResizing) ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease',
        willChange: 'transform',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isGaine ? 'center' : 'flex-start',
        gap: 6,
        padding: isCircle ? '4px' : (isGaine ? '0' : '1px 8px'),
        minWidth: isCircle ? 24 : (isGaine ? itemWidth : 'auto'),
        width: itemWidth,
        height: itemHeight,
        fontSize: 13,
        fontWeight: 600,
        color: '#1a1a1a',
        fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        cursor: isResizing ? 'default' : (isDragging ? 'grabbing' : 'grab'),
        userSelect: 'none',
        pointerEvents: 'auto',
        opacity: (isDragging || isResizing) ? 0.95 : 1,
        zIndex: (isDragging || isResizing) ? 999 : 10,
        borderRadius: isCircle ? '50%' : (isGaine ? '6px' : '10px'),
        backgroundColor: isGaine ? 'transparent' : '#ffffff',
        backdropFilter: isGaine ? 'none' : 'blur(10px)',
        border: (isDragging || isResizing) ? '2px solid #1890ff' : (isGaine ? 'none' : '2px solid rgba(24, 144, 255, 0.2)'),
        boxShadow: (isDragging || isResizing)
          ? '0 16px 40px rgba(24, 144, 255, 0.25), 0 8px 16px rgba(0, 0, 0, 0.1)'
          : (isGaine ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)'),
      }}
    >
      {isGaine ? (
        <>
          <IconComponent width={displayWidth} height={displayHeight} orientation={orientation || 'horizontal'} />

          {/* Size indicator during resize */}
          {isResizing && tempSize && (
            <div
              style={{
                position: 'absolute',
                top: -35,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#1890ff',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(24, 144, 255, 0.4)',
                zIndex: 1001,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {Math.round(tempSize.width)} × {Math.round(tempSize.height)}
            </div>
          )}

          {/* Resize handle - right for horizontal, bottom for vertical */}
          <div
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              // Determine handle position based on current dimensions
              ...((orientation === 'vertical' || (orientation === 'auto' && displayHeight > displayWidth)) ? {
                // Bottom handle for vertical gaine
                bottom: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80%',
                minWidth: 32,
                height: 12,
                cursor: 'ns-resize',
              } : {
                // Right handle for horizontal gaine
                right: -6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 12,
                height: '80%',
                minHeight: 32,
                cursor: 'ew-resize',
              }),
              backgroundColor: isResizing ? '#40a9ff' : '#1890ff',
              borderRadius: 6,
              opacity: isResizing ? 1 : 0.7,
              transition: isResizing ? 'none' : 'all 0.2s ease',
              boxShadow: isResizing
                ? '0 0 0 3px rgba(24, 144, 255, 0.2), 0 2px 8px rgba(24, 144, 255, 0.4)'
                : '0 2px 6px rgba(24, 144, 255, 0.3)',
              border: '2px solid #fff',
              zIndex: 1000,
              pointerEvents: 'auto',
            }}
            onMouseEnter={(e) => {
              if (!isResizing) {
                e.target.style.opacity = 1;
                e.target.style.backgroundColor = '#40a9ff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isResizing) {
                e.target.style.opacity = 0.7;
                e.target.style.backgroundColor = '#1890ff';
              }
            }}
          />
        </>
      ) : (
        <>
          {IconComponent && !isCircle && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              minWidth: '56px',
              minHeight: '56px',
              maxWidth: '56px',
              maxHeight: '56px',
            }}>
              <IconComponent style={{
                width: '100%',
                height: '100%',
                filter: isDragging ? 'brightness(1.1)' : 'none',
                transition: 'filter 0.2s ease'
              }} />
            </div>
          )}
          {!isCircle && (
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#1a1a1a',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)'
            }}>
              {label}
            </span>
          )}
        </>
      )}
    </div>
  );
});
const DraggableCardList = ({
  imageNaturalWidth,
  imageDisplayedWidth,
  imageId = null, // Optional image ID for multi-image support
  visibleIcons = null, // Optional list of icons to show (for filtered view)
  onAddCircle = null, // External callback for adding circles (from toolbox)
  onAddGaine = null, // External callback for adding horizontal gaine (from toolbox)
  onAddGaineVertical = null // External callback for adding vertical gaine (from toolbox)
}) => {
  const containerRef = useRef(null);
  const [cards, setCards] = useState([]);
  const [lines, setLines] = useState([]);
  const [pendingLine, setPendingLine] = useState(null);
  const lineClickTimes = useRef({}); // Track last click times for line double-click detection

  // Get site name from centralized utility
  const siteName = getSiteName();

  const scaleRatio = imageNaturalWidth && imageDisplayedWidth ? imageDisplayedWidth / imageNaturalWidth : 1;

  // Default transform (no crop offset)
  const transform = { x: 0, y: 0 };

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

  const handleDoubleClick = (id) => {
    const card = cards.find(c => c.id === id);
    // Allow deleting circles and gaines (manually added items)
    if (card && (card.moduleType === 'circle' || card.moduleType === 'gaine')) {
      console.log(`🗑️ Deleting ${card.moduleType}: ${id}`);
      // Remove the card
      setCards(prevCards => prevCards.filter(c => c.id !== id));
      // Remove any lines connected to this item
      setLines(prevLines => prevLines.filter(line => line.from !== id && line.to !== id));
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
        } catch {
          console.log('ℹ️ No saved positions found (first time setup)');
        }

        // ✅ Try to use localStorage SHAPES for backward compatibility with lines
        const savedCardsRaw = localStorage.getItem('draggableCards');
        let savedLines = [];

        if (savedCardsRaw) {
          try {
            const savedData = JSON.parse(savedCardsRaw);
            // Handle both old format (array) and new format (object with cards and lines)
            if (Array.isArray(savedData)) {
              savedLines = [];
            } else {
              savedLines = savedData.lines || [];
            }
            console.log('📍 Using localStorage shapes (for lines):', { savedLines });
          } catch (e) {
            console.error('❌ Failed to parse saved cards:', e);
          }
        }

        // 🏷️ ENRICH saved cards with proper labels and moduleTypes (unused for now)
        // eslint-disable-next-line no-unused-vars
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

        // ✅ Add circles, gaines, and other manually-added items from saved positions that aren't in generatedCards
        const generatedCardIds = new Set(generatedCards.map(c => c.id));
        const manuallyAddedCards = savedPositions
          .filter(pos => !generatedCardIds.has(pos.id))
          .map(pos => {
            // Determine type based on ID prefix
            const isCircle = pos.id.startsWith('circle-');
            const isGaine = pos.id.startsWith('gaine-');

            return {
              id: pos.id,
              label: isCircle ? '' : (isGaine ? 'Gaine' : pos.id),
              x: pos.x,
              y: pos.y,
              moduleType: isCircle ? 'circle' : (isGaine ? 'gaine' : 'circle'),
              isCircle: isCircle,
              width: pos.width || (isCircle ? 24 : (isGaine ? 100 : 24)),
              height: pos.height || (isCircle ? 24 : (isGaine ? 30 : 24)),
              orientation: pos.orientation || (isGaine ? 'horizontal' : undefined)
            };
          });

        finalCards = [...finalCards, ...manuallyAddedCards];
        console.log(`✅ Restored ${manuallyAddedCards.length} manually-added items (circles, gaines, etc.)`);

        // ✅ Filter cards to only show assigned icons if visibleIcons is provided
        // BUT always keep circles and gaines (manually-added items) regardless of assignments
        if (visibleIcons && Array.isArray(visibleIcons) && visibleIcons.length > 0) {
          const visibleIconIds = new Set(visibleIcons.map(icon => icon.id));
          finalCards = finalCards.filter(card => {
            // Always show circles, gaines, and other manually-added items
            if (card.moduleType === 'circle' || card.id.startsWith('circle-') ||
                card.moduleType === 'gaine' || card.id.startsWith('gaine-')) {
              return true;
            }
            // For equipment icons, only show if assigned to this image
            return visibleIconIds.has(card.id);
          });
          console.log(`🔍 Filtered to ${finalCards.length} visible icons for image ${imageId} (circles and gaines always included)`);
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

  // Handler for resizing gaine elements
  const handleResize = useCallback((id, newWidth, newHeight) => {
    setCards(prev => prev.map(c =>
      c.id === id ? { ...c, width: newWidth, height: newHeight } : c
    ));
  }, []);

  // Handler for adding a circle from the toolbox
  const handleAddCircle = useCallback(() => {
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
        width: 24,
        height: 24,
      },
    ]);
    console.log('⭕ Added circle from toolbox:', id);
  }, []);

  // Handler for adding a horizontal gaine from the toolbox
  const handleAddGaine = useCallback(() => {
    const id = `gaine-${Date.now()}`;
    setCards(prev => [
      ...prev,
      {
        id,
        label: 'Gaine',
        x: 150,
        y: 150,
        moduleType: 'gaine',
        width: 100,
        height: 30,
        orientation: 'horizontal'
      },
    ]);
    console.log('📏 Added horizontal gaine from toolbox:', id);
  }, []);

  // Handler for adding a vertical gaine from the toolbox
  const handleAddGaineVertical = useCallback(() => {
    const id = `gaine-${Date.now()}`;
    setCards(prev => [
      ...prev,
      {
        id,
        label: 'Gaine V',
        x: 150,
        y: 150,
        moduleType: 'gaine',
        width: 30,
        height: 100,
        orientation: 'vertical'
      },
    ]);
    console.log('📐 Added vertical gaine from toolbox:', id);
  }, []);

  // Expose handlers to parent via callbacks
  useEffect(() => {
    if (onAddCircle) {
      onAddCircle(handleAddCircle);
    }
    if (onAddGaine) {
      onAddGaine(handleAddGaine);
    }
    if (onAddGaineVertical) {
      onAddGaineVertical(handleAddGaineVertical);
    }
  }, [onAddCircle, handleAddCircle, onAddGaine, handleAddGaine, onAddGaineVertical, handleAddGaineVertical]);

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
            y: card.y,
            width: card.width, // Include width for resizable elements (gaine)
            height: card.height, // Include height for resizable elements (gaine)
            orientation: card.orientation // Include orientation for gaines
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
              opacity: 0.2;
              transform: scaleY(0.9);
            }
            50% {
              opacity: 0.6;
              transform: scaleY(1.1);
            }
          }

          /* Hover effect for professional draggable icons */
          .draggable-icon-pro:hover {
            border-color: rgba(24, 144, 255, 0.5) !important;
            box-shadow: 0 6px 20px rgba(24, 144, 255, 0.15), 0 3px 10px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
          }

          /* Hover effect for deletable circles */
          .draggable-icon-circle:hover {
            border-color: #ff4d4f !important;
            box-shadow: 0 0 15px rgba(255, 77, 79, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          }

          /* Hover effect for deletable lines */
          .line-clickable-area:hover + .line-visual {
            box-shadow: 0 0 15px rgba(255, 77, 79, 0.6), 0 2px 6px rgba(0, 0, 0, 0.2) !important;
            opacity: 1 !important;
          }
        `}
      </style>
      <div
        ref={containerRef}
        onContextMenu={handleRightClick}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}
      >
{lines.map((line, idx) => {
  const from = cards.find(c => c.id === line.from);
  const to = cards.find(c => c.id === line.to);
  if (!from || !to) return null;

  const fromType = from.moduleType || '';
  const toType = to.moduleType || '';
  const isCircleLine = fromType === 'circle' || toType === 'circle';

  // Offsets: center of circle vs center of regular icon
  const getOffset = (type) =>
    type === 'circle'
      ? { x: 12, y: 12 }  // Half of 24px circle size
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

  // Modern line styling - better colors and thickness
  const lineColor = isCircleLine ? '#ff6b6b' : '#4dabf7';
  const lineWidth = 2.5;  // Consistent width for cleaner look
  const shadowColor = isCircleLine ? 'rgba(255, 107, 107, 0.4)' : 'rgba(77, 171, 247, 0.4)';

  // Handle line double-click for deletion
  const lineKey = `${line.from}-${line.to}`;
  const handleLineDoubleClick = (e) => {
    e.stopPropagation();
    const now = Date.now();
    const lastClickTime = lineClickTimes.current[lineKey] || 0;

    if (now - lastClickTime < 300) {
      // Double click detected - delete the line
      setLines(prevLines => prevLines.filter((_, i) => i !== idx));
      console.log(`🗑️ Deleting line between ${line.from} and ${line.to}`);
      delete lineClickTimes.current[lineKey];
    } else {
      lineClickTimes.current[lineKey] = now;
    }
  };

  return (
    <React.Fragment key={`line-div-${idx}`}>
      {/* Invisible clickable area for line deletion */}
      <div
        className="line-clickable-area"
        onClick={handleLineDoubleClick}
        title="Double-click to delete line"
        style={{
          position: 'absolute',
          left: `${x1}px`,
          top: `${y1 - 8}px`,  // Larger hit area
          width: `${length}px`,
          height: '16px',
          pointerEvents: 'auto',
          cursor: 'pointer',
          zIndex: 5,
          transform: `rotate(${angle}deg)`,
          transformOrigin: '0 50%',
        }}
      />
      {/* Modern Line with Smooth Gradient and Shadow */}
      <div
        className="line-visual"
        style={{
          position: 'absolute',
          left: `${x1}px`,
          top: `${y1 - lineWidth / 2}px`,  // Center vertically
          width: `${length}px`,
          height: `${lineWidth}px`,
          background: `linear-gradient(90deg, ${lineColor}dd, ${lineColor}, ${lineColor}dd)`,
          pointerEvents: 'none',
          zIndex: 2,
          transform: `rotate(${angle}deg)`,
          transformOrigin: '0 50%',
          borderRadius: `${lineWidth}px`,
          boxShadow: `0 0 10px ${shadowColor}, 0 1px 3px rgba(0,0,0,0.15)`,
          opacity: 0.95,
        }}
      />
      {/* Animated pulse overlay for circle lines */}
      {isCircleLine && (
        <div
          style={{
            position: 'absolute',
            left: `${x1}px`,
            top: `${y1 - lineWidth / 2 - 1}px`,  // Centered with main line
            width: `${length}px`,
            height: `${lineWidth + 2}px`,
            background: `linear-gradient(90deg, transparent, ${lineColor}88, transparent)`,
            pointerEvents: 'none',
            zIndex: 3,
            transform: `rotate(${angle}deg)`,
            transformOrigin: '0 50%',
            borderRadius: `${lineWidth + 2}px`,
            animation: 'linePulse 2.5s ease-in-out infinite',
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
          onDoubleClick={handleDoubleClick}
          onResize={handleResize}
        />
      ))}
      </div>
    </>
  );
};

export default DraggableCardList;
