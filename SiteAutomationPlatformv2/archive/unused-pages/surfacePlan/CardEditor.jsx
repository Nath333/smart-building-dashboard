
import React, { useState, useRef } from 'react';
import { Button, Card, Upload, Typography, Space, Badge, Divider, List, Tooltip } from 'antd';
import { UploadOutlined, DeleteOutlined, PictureOutlined, BorderOutlined, ZoomInOutlined, ZoomOutOutlined, DragOutlined } from '@ant-design/icons';

const CardEditor = ({
  index,
  card,
  onRemove,
  beforeUpload,
  handlePolygonClick,
  polygonPoints,
  isDrawingPolygon,
  activeDrawingCardIndex,
  drawingColor,
  // Reference line props
  handleReferenceLineClick,
  referenceLine,
  isDrawingReference,
  calculateTotalSurfaceArea,
  // Rectangle scale props
  handleRectangleClick,
  handleRectangleMouseMove,
  handleRectangleFinish,
  isDrawingRectangleScale,
  scaleRectangle,
}) => {
  const polygonCount = (card.shapes || []).filter(shape => shape?.type === 'polygon').length;

  // Zoom state management
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageContainerRef = useRef(null);

  // Zoom control functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5)); // Max 5x zoom
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5)); // Min 0.5x zoom
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Calculate optimal container height based on image dimensions and zoom
  const getOptimalContainerHeight = () => {
    if (!imageDimensions.width || !imageDimensions.height) {
      return 600; // Default fallback
    }

    const aspectRatio = imageDimensions.height / imageDimensions.width;
    const containerWidth = imageContainerRef.current?.offsetWidth || 800;

    // Calculate natural display height (maintaining aspect ratio)
    const naturalDisplayHeight = containerWidth * aspectRatio;

    // At different zoom levels, ensure container accommodates the zoomed image
    const zoomedHeight = naturalDisplayHeight * zoomLevel;

    // Minimum height for usability, maximum for reasonable display
    const minHeight = 400;
    const maxHeight = 1200;

    // Add padding for pan operations
    const paddedHeight = zoomedHeight + 100;

    return Math.max(minHeight, Math.min(maxHeight, paddedHeight));
  };

  // Pan control functions with corrected offset calculation
  const handlePanStart = (e) => {
    if (e.ctrlKey || e.metaKey) { // Only pan with Ctrl/Cmd key
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handlePanMove = (e) => {
    if (isPanning) {
      const newPanOffset = {
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      };

      // Constrain pan to reasonable bounds to prevent image from going too far off-screen
      const containerWidth = imageContainerRef.current?.offsetWidth || 800;
      const containerHeight = getOptimalContainerHeight();

      const maxPanX = containerWidth * 0.5; // Allow 50% off-screen
      const maxPanY = containerHeight * 0.5;

      setPanOffset({
        x: Math.max(-maxPanX, Math.min(maxPanX, newPanOffset.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, newPanOffset.y))
      });
    }
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };


  return (
    <Card
      key={index}
      style={{
        maxWidth: 1600,
        width: '100%',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        position: 'relative',
        overflow: 'hidden',
        background: '#ffffff',
        border: '1px solid #f0f0f0'
      }}
      styles={{ body: { padding: 0 } }}
      title={
        <Space>
          <Badge count={polygonCount} showZero color="#52c41a">
            <PictureOutlined style={{ fontSize: 16, color: '#1890ff' }} />
          </Badge>
          <Typography.Text strong style={{ color: '#2c3e50' }}>
            Surface #{index + 1}
          </Typography.Text>
          {polygonCount > 0 && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {polygonCount} polygone{polygonCount > 1 ? 's' : ''}
            </Typography.Text>
          )}
          {calculateTotalSurfaceArea && calculateTotalSurfaceArea(card) > 0 && (
            <Typography.Text style={{ fontSize: 12, color: '#1890ff', fontWeight: 'bold' }}>
              • {calculateTotalSurfaceArea(card).toFixed(2)} m²
            </Typography.Text>
          )}
        </Space>
      }
      extra={
        (card.image || card.url) && (
          <Space>
            {/* Zoom Controls */}
            <Tooltip title="Zoom avant (précision)">
              <Button
                type="text"
                icon={<ZoomInOutlined />}
                onClick={handleZoomIn}
                disabled={zoomLevel >= 5}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>
            <Tooltip title="Zoom arrière">
              <Button
                type="text"
                icon={<ZoomOutOutlined />}
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>
            <Tooltip title="Réinitialiser zoom • Ctrl+glisser pour déplacer">
              <Button
                type="text"
                icon={<DragOutlined />}
                onClick={handleZoomReset}
                style={{
                  borderRadius: 6,
                  backgroundColor: zoomLevel !== 1 ? 'rgba(24, 144, 255, 0.1)' : 'transparent'
                }}
              >
                {(zoomLevel * 100).toFixed(0)}%
              </Button>
            </Tooltip>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onRemove(index)}
              style={{ borderRadius: 6 }}
            >
              Supprimer
            </Button>
          </Space>
        )
      }
    >
      {(card.image || card.url) ? (
        <div
          ref={imageContainerRef}
          style={{
            position: 'relative',
            width: '100%',
            height: `${getOptimalContainerHeight()}px`,
            overflow: 'hidden',
            cursor: isPanning ? 'grabbing' : ((isDrawingPolygon || isDrawingReference || isDrawingRectangleScale) && index === activeDrawingCardIndex ? 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A//www.w3.org/2000/svg%22 width%3D%2215%22 height%3D%2215%22 viewBox%3D%220 0 15 15%22%3E%3Cline x1%3D%227.5%22 y1%3D%220%22 x2%3D%227.5%22 y2%3D%2215%22 stroke%3D%22%23000%22 stroke-width%3D%221%22/%3E%3Cline x1%3D%220%22 y1%3D%227.5%22 x2%3D%2215%22 y2%3D%227.5%22 stroke%3D%22%23000%22 stroke-width%3D%221%22/%3E%3C/svg%3E") 7 7, crosshair' : 'grab'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => {
            if (isPanning) return; // Don't process clicks while panning

            if (isDrawingReference) {
              handleReferenceLineClick(e, index);
            } else if (isDrawingRectangleScale) {
              handleRectangleClick(e, index);
            } else {
              handlePolygonClick(e, index);
            }
          }}
          onMouseDown={handlePanStart}
          onMouseMove={(e) => {
            handlePanMove(e);
            if (isDrawingRectangleScale && !isPanning) {
              handleRectangleMouseMove(e, index);
            }
          }}
          onMouseUp={(e) => {
            handlePanEnd();
            if (isDrawingRectangleScale && !isPanning) {
              handleRectangleFinish(e, index);
            }
          }}
          onMouseLeave={handlePanEnd}
        >
          <div
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.2s ease',
              width: 'auto',
              height: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
          <img
            ref={(imgRef) => {
              // Store natural dimensions when image loads for SVG coordinate system
              if (imgRef && imgRef.naturalWidth && imgRef.naturalHeight) {
                card._naturalWidth = imgRef.naturalWidth;
                card._naturalHeight = imgRef.naturalHeight;
                card.width = imgRef.naturalWidth;
                card.height = imgRef.naturalHeight;
                console.log(`🔄 Ref callback stored dimensions: ${imgRef.naturalWidth}x${imgRef.naturalHeight}`);
              }
            }}
            onLoad={(e) => {
              // Ensure natural dimensions are available immediately after load
              const img = e.target;
              card._naturalWidth = img.naturalWidth;
              card._naturalHeight = img.naturalHeight;

              // CRITICAL: Also update the card width/height for fallback
              card.width = img.naturalWidth;
              card.height = img.naturalHeight;

              // Update state for dynamic container sizing
              setImageDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight
              });

              console.log(`✅ Image loaded and ready for coordinate capture: ${img.naturalWidth}x${img.naturalHeight}`);
              console.log(`🔄 Stored natural dimensions in card for fallback access`);
            }}
            onError={(e) => {
              console.error('❌ Image failed to load:', e.target.src);
            }}
            src={card.image || card.url}
            alt="recadrée"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              display: 'block',
              userSelect: 'none',
              filter: 'none',
              imageRendering: 'crisp-edges',
              pointerEvents: 'none' // Let parent handle events
            }}
            decoding="async"
            loading="lazy"
            draggable={false}
          />
          <svg
            viewBox={`0 0 ${card._naturalWidth || card.width || 800} ${card._naturalHeight || card.height || 600}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {(card.shapes || []).map((shape) => {
              // Handle donut shapes
              if (shape && shape.type === 'donut' && shape.outerPoints && shape.innerPoints) {
                const baseColor = shape.color ? shape.color.replace('-donut', '') : 'blue';
                const fillColor = baseColor === 'red' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 255, 0.3)';
                const strokeColor = baseColor === 'red' ? '#ff4d4f' : '#1890ff';

                // Create proper SVG path for donut with hole
                const outerPoints = shape.outerPoints.filter(p => p && typeof p.x === 'number' && typeof p.y === 'number');
                const innerPoints = shape.innerPoints.filter(p => p && typeof p.x === 'number' && typeof p.y === 'number');

                if (outerPoints.length < 3 || innerPoints.length < 3) return null;

                // Create perfect donut with transparent hole using SVG path
                // Use proper winding rules: outer clockwise, inner counter-clockwise
                const outerPath = `M${outerPoints.map(p => `${p.x},${p.y}`).join(' L')} Z`;

                // CRITICAL: Reverse inner polygon for counter-clockwise winding to create hole
                const reversedInnerPoints = [...innerPoints].reverse();
                const innerPath = `M${reversedInnerPoints.map(p => `${p.x},${p.y}`).join(' L')} Z`;

                // Combine paths for proper donut with transparent center
                const donutPath = `${outerPath} ${innerPath}`;

                console.log(`🍩 Rendering donut: outer(${outerPoints.length}) inner(${innerPoints.length}) reversed`);

                return (
                  <g key={shape.id || `donut-${Math.random()}`}>
                    {/* DONUT: Outer filled, inner completely transparent */}
                    <path
                      d={donutPath}
                      fill={fillColor}
                      fillRule="evenodd"
                      stroke={strokeColor}
                      strokeWidth={2}
                      strokeOpacity={0.9}
                      style={{
                        pointerEvents: 'none',
                        // Ensure perfect transparency in the hole
                        fillOpacity: 1
                      }}
                    />
                    {/* OPTIONAL: Subtle inner border to show hole edge */}
                    <polygon
                      points={innerPoints.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="transparent"
                      stroke={strokeColor}
                      strokeWidth={1.5}
                      strokeDasharray="4,2"
                      strokeOpacity={0.6}
                      style={{
                        pointerEvents: 'none',
                        mixBlendMode: 'normal'
                      }}
                    />
                  </g>
                );
              }
              
              // Handle regular polygons
              if (!shape || shape.type !== 'polygon' || !Array.isArray(shape.points) || shape.points.length < 3) {
                return null;
              }

              const isHollow = shape.color && shape.color.includes('hollow');
              const baseColor = shape.color ? shape.color.replace('-hollow', '') : 'blue';
              
              
              return (
                <polygon
                  key={shape.id || `polygon-${Math.random()}`}
                  points={shape.points
                    .filter(p => p && typeof p.x === 'number' && typeof p.y === 'number')
                    .map((p) => `${p.x},${p.y}`)
                    .join(' ')
                  }
                  fill={isHollow ? 'none' : (baseColor === 'red' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 255, 0.3)')}
                  stroke={baseColor === 'red' ? '#ff4d4f' : '#1890ff'}
                  strokeWidth={isHollow ? 4 : 2}
                  strokeDasharray={isHollow ? 'none' : undefined}
                  style={{ 
                    pointerEvents: 'none',
                    mixBlendMode: isHollow ? 'normal' : undefined
                  }}
                />
              );
            })}
            {isDrawingPolygon && index === activeDrawingCardIndex && Array.isArray(polygonPoints) && polygonPoints.length > 0 && (() => {
              const currentDrawingColor = drawingColor || 'blue';
              const isHollowDrawing = currentDrawingColor.includes('hollow');
              const baseDrawingColor = currentDrawingColor.replace('-hollow', '');
              
              return (
                <polyline
                  points={polygonPoints
                    .filter(p => p && typeof p.x === 'number' && typeof p.y === 'number')
                    .map((p) => `${p.x},${p.y}`)
                    .join(' ')
                  }
                  fill="none"
                  stroke={baseDrawingColor === 'red' ? '#ff4d4f' : '#1890ff'}
                  strokeDasharray={isHollowDrawing ? "8,4" : "4"}
                  strokeWidth={isHollowDrawing ? 3 : 2}
                />
              );
            })()}
            
            {/* Reference line visualization */}
            {isDrawingReference && index === activeDrawingCardIndex && Array.isArray(referenceLine[index]) && referenceLine[index].length > 0 && (() => {
              const line = referenceLine[index];
              // Validate coordinates to prevent NaN errors
              const isValidCoord = (coord) => coord && typeof coord.x === 'number' && typeof coord.y === 'number' && 
                                            !isNaN(coord.x) && !isNaN(coord.y) && isFinite(coord.x) && isFinite(coord.y);
              
              return (
                <g>
                  {line.length === 1 && isValidCoord(line[0]) && (
                    <circle
                      cx={line[0].x}
                      cy={line[0].y}
                      r={2}
                      fill="#52c41a"
                      stroke="#389e0d"
                      strokeWidth={1}
                    />
                  )}
                  {line.length === 2 && isValidCoord(line[0]) && isValidCoord(line[1]) && (
                    <>
                      <line
                        x1={line[0].x}
                        y1={line[0].y}
                        x2={line[1].x}
                        y2={line[1].y}
                        stroke="#52c41a"
                        strokeWidth={1.5}
                        strokeDasharray="none"
                      />
                      <circle
                        cx={line[0].x}
                        cy={line[0].y}
                        r={2}
                        fill="#52c41a"
                        stroke="#389e0d"
                        strokeWidth={1}
                      />
                      <circle
                        cx={line[1].x}
                        cy={line[1].y}
                        r={2}
                        fill="#52c41a"
                        stroke="#389e0d"
                        strokeWidth={1}
                      />
                    </>
                  )}
                </g>
              );
            })()}
            
            {/* Show saved reference line if exists */}
            {!isDrawingReference && referenceLine[index]?.length === 2 && index === activeDrawingCardIndex && (() => {
              const line = referenceLine[index];
              // Validate coordinates to prevent NaN errors
              const isValidCoord = (coord) => coord && typeof coord.x === 'number' && typeof coord.y === 'number' && 
                                            !isNaN(coord.x) && !isNaN(coord.y) && isFinite(coord.x) && isFinite(coord.y);
              
              if (!isValidCoord(line[0]) || !isValidCoord(line[1])) return null;
              
              const centerX = (line[0].x + line[1].x) / 2;
              const centerY = (line[0].y + line[1].y) / 2 - 10;
              
              return (
                <g>
                  <line
                    x1={line[0].x}
                    y1={line[0].y}
                    x2={line[1].x}
                    y2={line[1].y}
                    stroke="#52c41a"
                    strokeWidth={2}
                    strokeOpacity={0.8}
                  />
                  {!isNaN(centerX) && !isNaN(centerY) && isFinite(centerX) && isFinite(centerY) && (
                    <text
                      x={centerX}
                      y={centerY}
                      fill="#52c41a"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      0.9m
                    </text>
                  )}
                </g>
              );
            })()}
            
            {/* Rectangle scale visualization - shows crop box and detected line */}
            {isDrawingRectangleScale && index === activeDrawingCardIndex && scaleRectangle && scaleRectangle.cardIndex === index && (
              <g>
                {/* Rectangle crop box */}
                <rect
                  x={Math.min(scaleRectangle.startX, scaleRectangle.startX + scaleRectangle.width)}
                  y={Math.min(scaleRectangle.startY, scaleRectangle.startY + scaleRectangle.height)}
                  width={Math.abs(scaleRectangle.width)}
                  height={Math.abs(scaleRectangle.height)}
                  fill="rgba(114, 46, 209, 0.2)"
                  stroke="none"
                  style={{ pointerEvents: 'none' }}
                />
                
                {/* Detected measurement line (if available) */}
                {scaleRectangle.detectedLine && (
                  <>
                    {/* Black outline for visibility */}
                    <line
                      x1={scaleRectangle.detectedLine.startX}
                      y1={scaleRectangle.detectedLine.startY}
                      x2={scaleRectangle.detectedLine.endX}
                      y2={scaleRectangle.detectedLine.endY}
                      stroke="black"
                      strokeWidth={4}
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* Purple measurement line */}
                    <line
                      x1={scaleRectangle.detectedLine.startX}
                      y1={scaleRectangle.detectedLine.startY}
                      x2={scaleRectangle.detectedLine.endX}
                      y2={scaleRectangle.detectedLine.endY}
                      stroke="#722ed1"
                      strokeWidth={2}
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* Start point marker */}
                    <circle
                      cx={scaleRectangle.detectedLine.startX}
                      cy={scaleRectangle.detectedLine.startY}
                      r={3}
                      fill="black"
                      stroke="white"
                      strokeWidth={1}
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* End point marker */}
                    <circle
                      cx={scaleRectangle.detectedLine.endX}
                      cy={scaleRectangle.detectedLine.endY}
                      r={3}
                      fill="black"
                      stroke="white"
                      strokeWidth={1}
                      style={{ pointerEvents: 'none' }}
                    />
                  </>
                )}
              </g>
            )}
          </svg>
          </div>
        </div>
      ) : (
        <div style={{ 
          padding: 48,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <PictureOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Typography.Text style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>
            Aucune image chargée
          </Typography.Text>
          <Upload
            showUploadList={false}
            accept="image/png, image/jpeg, image/webp, image/gif"
            beforeUpload={(file) => beforeUpload(file, index)}
          >
            <Button
              type="primary"
              icon={<UploadOutlined />}
              size="large"
              style={{ 
                height: 44,
                paddingLeft: 24,
                paddingRight: 24,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontWeight: 500
              }}
            >
              Charger et Recadrer Image
            </Button>
          </Upload>
        </div>
      )}

    </Card>
  );
};

export default CardEditor;