import React, { useState, useEffect } from 'react';
import { Button, Typography, Empty, message, Card, Row, Col, Tag, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, FileImageOutlined, PictureOutlined } from '@ant-design/icons';
import CardEditor from './surfacePlan/CardEditor';
import PolygonDrawingControls from './surfacePlan/PolygonDrawingControls';
import ImageCropperModal from '../components/common/ImageCropperModal';
import PageHeader from '../components/common/PageHeader';
import ActionButtons from '../components/common/ActionButtons';
import uploadToImgBB from './surfacePlan/surfaceCardUpload';
import deleteSurfaceCard from './surfacePlan/deleteSurfaceCard';
import { getSiteName } from '../utils/siteContext';
import { API_BASE_URL } from '../api/apiConfig';
import PageLayout from '../components/layout/PageLayout';
import { LAYOUT_CONSTANTS } from '../components/layout/layoutConstants';

const SurfacePlanPage = () => {
  // Site name from localStorage for metadata
  const siteName = getSiteName();

  
  // Custom state for surface-specific cards (completely independent)
  const [surfaceCards, setSurfaceCards] = useState([]);
  const [_surfaceDeleteUrls, setSurfaceDeleteUrls] = useState([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [cropCardIndex, setCropCardIndex] = useState(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null); // Track selected card for editing
  
  // Surface-specific polygon drawing state
  const [imageSrc, setImageSrc] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [drawingColor, setDrawingColor] = useState('blue');
  const [activeDrawingCardIndex, setActiveDrawingCardIndex] = useState(null);

  // Reference line state for scale calculation (0.9m reference)
  // Each card can have its own reference line and scale
  const [referenceLine, setReferenceLine] = useState({});
  const [isDrawingReference, setIsDrawingReference] = useState(false);
  const [scalePixelsPerMeter, setScalePixelsPerMeter] = useState({});

  // Rectangle scale state - new feature for easier scale measurement
  const [isDrawingRectangleScale, setIsDrawingRectangleScale] = useState(false);
  const [scaleRectangle, setScaleRectangle] = useState(null);
  const [isResizingRectangle, setIsResizingRectangle] = useState(false);
  

  // CRITICAL: Convert CSS coordinates to image pixel coordinates (zoom-independent)
  const getImagePixelCoordinates = (e, cardIndex) => {
    // For zoom functionality, we need to get the actual image element, not the container
    const container = e.currentTarget;
    const imageElement = container.querySelector('img');
    if (!imageElement) return null;

    // COMPLETE ZOOM FIX: Detect both CSS transform zoom AND browser zoom

    // 1. Detect CSS Transform Zoom (card zoom buttons)
    const transformedParent = imageElement.closest('[style*="transform"]');
    let cssZoom = 1;

    if (transformedParent) {
      const computedStyle = window.getComputedStyle(transformedParent);
      const matrix = computedStyle.transform;
      if (matrix && matrix !== 'none') {
        const matrixValues = matrix.match(/matrix\(([^)]+)\)/);
        if (matrixValues) {
          const values = matrixValues[1].split(',').map(v => parseFloat(v.trim()));
          cssZoom = values[0]; // scaleX from transform matrix
        }
      }
    }

    // 2. Detect Browser Zoom (Ctrl+/Ctrl-) - Proper detection method
    let browserZoom = 1;

    try {
      // Create test element at document root (unaffected by local transforms)
      const testElement = document.createElement('div');
      testElement.style.cssText = `
        position: fixed;
        top: -1000px;
        left: 0;
        width: 100px;
        height: 100px;
        visibility: hidden;
        pointer-events: none;
        transform: none !important;
        zoom: normal !important;
      `;

      // Append to document root to avoid any container effects
      const targetParent = document.documentElement || document.body;
      targetParent.appendChild(testElement);

      // Measure actual vs expected dimensions
      const testRect = testElement.getBoundingClientRect();
      const expectedWidth = 100; // CSS pixels
      const actualWidth = testRect.width;

      if (actualWidth > 0 && isFinite(actualWidth)) {
        browserZoom = expectedWidth / actualWidth;

        // Validate browser zoom is within reasonable bounds
        if (browserZoom < 0.1 || browserZoom > 10) {
          browserZoom = 1; // Reset to normal if detection seems invalid
        }
      }

      // Cleanup test element
      targetParent.removeChild(testElement);

    } catch (error) {
      console.warn('⚠️ Browser zoom detection failed:', error.message);
      browserZoom = 1;
    }

    // 3. Combine both zoom factors for total compensation
    let totalZoomCompensation = cssZoom * browserZoom;

    // Final validation: Ensure total compensation is reasonable
    if (!isFinite(totalZoomCompensation) || totalZoomCompensation <= 0) {
      console.warn(`⚠️ Invalid total zoom compensation: ${totalZoomCompensation}, falling back to CSS zoom only`);
      totalZoomCompensation = cssZoom || 1;
    }

    // Clamp to prevent extreme values that could break coordinate calculations
    totalZoomCompensation = Math.max(0.1, Math.min(50, totalZoomCompensation));

    console.log(`🔍 COMPLETE ZOOM DETECTION:`);
    console.log(`   • CSS Transform Zoom: ${cssZoom.toFixed(3)}x`);
    console.log(`   • Browser Zoom: ${browserZoom.toFixed(3)}x`);
    console.log(`   • Total Compensation: ${totalZoomCompensation.toFixed(3)}x`);
    console.log(`   • Applied to coordinates: ${cardIndex !== null ? `card ${cardIndex}` : 'unknown card'}`);

    const rect = imageElement.getBoundingClientRect();

    // CORRECTED: getBoundingClientRect() returns SCALED dimensions, so multiply by total zoom to get original coordinates
    const cssX = (e.clientX - rect.left) * totalZoomCompensation;
    const cssY = (e.clientY - rect.top) * totalZoomCompensation;
    
    // Validate CSS coordinates are finite numbers
    if (!isFinite(cssX) || !isFinite(cssY)) {
      console.warn(`⚠️ Invalid CSS coordinates: (${cssX}, ${cssY})`);
      return null;
    }
    
    // Ensure coordinates are within the displayed image bounds (original dimensions)
    const originalWidth = rect.width * totalZoomCompensation;
    const originalHeight = rect.height * totalZoomCompensation;
    if (cssX < 0 || cssX > originalWidth || cssY < 0 || cssY > originalHeight) {
      console.warn(`⚠️ Click outside displayed image: (${cssX.toFixed(2)}, ${cssY.toFixed(2)}) vs (${originalWidth.toFixed(2)}x${originalHeight.toFixed(2)}) [total zoom: ${totalZoomCompensation.toFixed(3)}x]`);
      return null;
    }
    
    // Try to get natural dimensions from multiple sources for robustness
    let naturalWidth, naturalHeight;
    
    // Priority 1: From imageElement directly
    if (imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
      naturalWidth = imageElement.naturalWidth;
      naturalHeight = imageElement.naturalHeight;
    }
    // Priority 2: From stored card dimensions (stored in CardEditor onLoad)
    else if (cardIndex !== null && surfaceCards[cardIndex] && surfaceCards[cardIndex]._naturalWidth && surfaceCards[cardIndex]._naturalHeight) {
      naturalWidth = surfaceCards[cardIndex]._naturalWidth;
      naturalHeight = surfaceCards[cardIndex]._naturalHeight;
      console.log(`🔄 Using stored natural dimensions: ${naturalWidth}x${naturalHeight}`);
    }
    // Priority 3: From card width/height fallback
    else if (cardIndex !== null && surfaceCards[cardIndex] && surfaceCards[cardIndex].width && surfaceCards[cardIndex].height) {
      naturalWidth = surfaceCards[cardIndex].width;
      naturalHeight = surfaceCards[cardIndex].height;
      console.log(`🔄 Using card fallback dimensions: ${naturalWidth}x${naturalHeight}`);
    }
    else {
      console.warn(`⚠️ Image not ready for coordinate capture - no natural dimensions available`);
      console.warn(`⚠️ imageElement.naturalWidth: ${imageElement.naturalWidth}, cardIndex: ${cardIndex}`);
      message.warning('Image encore en chargement. Veuillez attendre quelques secondes avant de dessiner.');
      return null;
    }
    
    // Convert CSS pixels to actual image pixels with enhanced precision (total zoom compensated)
    const scaleX = naturalWidth / (rect.width * totalZoomCompensation);
    const scaleY = naturalHeight / (rect.height * totalZoomCompensation);
    
    // COMPREHENSIVE SCALE FACTOR VALIDATION & LOGGING
    console.log(`📐 SCALE FACTOR CALCULATION:`);
    console.log(`   • Natural image dimensions: ${naturalWidth} × ${naturalHeight} px`);
    console.log(`   • Displayed rect dimensions: ${rect.width.toFixed(2)} × ${rect.height.toFixed(2)} px`);
    console.log(`   • Total zoom compensation: ${totalZoomCompensation.toFixed(4)}x`);
    console.log(`   • Compensated rect dimensions: ${(rect.width * totalZoomCompensation).toFixed(2)} × ${(rect.height * totalZoomCompensation).toFixed(2)} px`);
    console.log(`   • Calculated scaleX: ${naturalWidth} ÷ ${(rect.width * totalZoomCompensation).toFixed(2)} = ${scaleX.toFixed(6)}`);
    console.log(`   • Calculated scaleY: ${naturalHeight} ÷ ${(rect.height * totalZoomCompensation).toFixed(2)} = ${scaleY.toFixed(6)}`);

    // Enhanced validation of scale factors with detailed error reporting
    if (!isFinite(scaleX) || !isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
      console.error(`❌ INVALID SCALE FACTORS DETECTED:`);
      console.error(`   • scaleX: ${scaleX} (should be positive finite number)`);
      console.error(`   • scaleY: ${scaleY} (should be positive finite number)`);
      console.error(`   • Natural dimensions: ${naturalWidth}×${naturalHeight}`);
      console.error(`   • Rect dimensions: ${rect.width}×${rect.height}`);
      console.error(`   • Total zoom: ${totalZoomCompensation}`);
      console.error(`   • Compensated rect: ${(rect.width * totalZoomCompensation).toFixed(2)}×${(rect.height * totalZoomCompensation).toFixed(2)}`);
      return null;
    }

    // Detailed warnings for suspicious scale factors
    const minReasonableScale = 0.05;  // Very zoomed out
    const maxReasonableScale = 20;    // Very zoomed in

    if (scaleX < minReasonableScale || scaleX > maxReasonableScale) {
      console.warn(`⚠️ SUSPICIOUS scaleX: ${scaleX.toFixed(6)} (normal range: ${minReasonableScale}-${maxReasonableScale})`);
      console.warn(`   • This might indicate image loading issues or incorrect zoom detection`);
    }

    if (scaleY < minReasonableScale || scaleY > maxReasonableScale) {
      console.warn(`⚠️ SUSPICIOUS scaleY: ${scaleY.toFixed(6)} (normal range: ${minReasonableScale}-${maxReasonableScale})`);
      console.warn(`   • This might indicate image loading issues or incorrect zoom detection`);
    }

    // Check for aspect ratio preservation
    const aspectRatioNatural = naturalWidth / naturalHeight;
    const aspectRatioDisplayed = (rect.width * totalZoomCompensation) / (rect.height * totalZoomCompensation);
    const aspectRatioDifference = Math.abs(aspectRatioNatural - aspectRatioDisplayed);

    console.log(`📏 ASPECT RATIO VALIDATION:`);
    console.log(`   • Natural aspect ratio: ${aspectRatioNatural.toFixed(4)} (${naturalWidth}÷${naturalHeight})`);
    console.log(`   • Displayed aspect ratio: ${aspectRatioDisplayed.toFixed(4)}`);
    console.log(`   • Difference: ${aspectRatioDifference.toFixed(6)} (should be near 0)`);

    if (aspectRatioDifference > 0.01) {
      console.warn(`⚠️ ASPECT RATIO MISMATCH: ${aspectRatioDifference.toFixed(6)}`);
      console.warn(`   • This suggests the image is stretched or zoom detection is incorrect`);
    }

    // Scale factor consistency check
    const scaleRatio = scaleX / scaleY;
    console.log(`🔍 SCALE CONSISTENCY: scaleX/scaleY ratio = ${scaleRatio.toFixed(6)} (should be near 1.0)`);

    if (Math.abs(scaleRatio - 1.0) > 0.001) {
      console.warn(`⚠️ INCONSISTENT SCALES: X and Y scales differ by ${((scaleRatio - 1.0) * 100).toFixed(3)}%`);
      console.warn(`   • This might cause coordinate distortion`);
    }
    
    // Calculate final image pixel coordinates with high precision
    const imagePixelX = cssX * scaleX;
    const imagePixelY = cssY * scaleY;

    // Validate final coordinates are finite numbers
    if (!isFinite(imagePixelX) || !isFinite(imagePixelY)) {
      console.warn(`⚠️ Invalid calculated coordinates: (${imagePixelX}, ${imagePixelY})`);
      return null;
    }

    // COMPREHENSIVE COORDINATE TRANSFORMATION LOGGING
    const rawClickX = e.clientX - rect.left;
    const rawClickY = e.clientY - rect.top;

    console.log(`🎯 COMPLETE COORDINATE TRANSFORMATION PIPELINE:`);
    console.log(`   ┌─ STEP 1: Raw Browser Click`);
    console.log(`   │  • Browser coordinates: (${e.clientX}, ${e.clientY})`);
    console.log(`   │  • Element rect: {left: ${rect.left.toFixed(2)}, top: ${rect.top.toFixed(2)}, width: ${rect.width.toFixed(2)}, height: ${rect.height.toFixed(2)}}`);
    console.log(`   │  • Relative to element: (${rawClickX.toFixed(2)}, ${rawClickY.toFixed(2)}) CSS px`);
    console.log(`   ├─ STEP 2: Zoom Compensation`);
    console.log(`   │  • CSS zoom factor: ${cssZoom.toFixed(4)}x`);
    console.log(`   │  • Browser zoom factor: ${browserZoom.toFixed(4)}x`);
    console.log(`   │  • Total compensation: ${totalZoomCompensation.toFixed(4)}x`);
    console.log(`   │  • Compensated coordinates: (${cssX.toFixed(4)}, ${cssY.toFixed(4)}) CSS px`);
    console.log(`   │  • Calculation: (${rawClickX.toFixed(2)} × ${totalZoomCompensation.toFixed(4)}, ${rawClickY.toFixed(2)} × ${totalZoomCompensation.toFixed(4)})`);
    console.log(`   ├─ STEP 3: CSS to Image Pixel Conversion`);
    console.log(`   │  • Scale factors: (${scaleX.toFixed(6)}, ${scaleY.toFixed(6)})`);
    console.log(`   │  • Final image pixels: (${imagePixelX.toFixed(4)}, ${imagePixelY.toFixed(4)})`);
    console.log(`   │  • Calculation: (${cssX.toFixed(4)} × ${scaleX.toFixed(6)}, ${cssY.toFixed(4)} × ${scaleY.toFixed(6)})`);
    console.log(`   └─ STEP 4: Validation`);
    console.log(`      • Image bounds: 0 to ${naturalWidth} × 0 to ${naturalHeight}`);
    console.log(`      • Within bounds: ${(imagePixelX >= 0 && imagePixelX <= naturalWidth && imagePixelY >= 0 && imagePixelY <= naturalHeight) ? '✅ YES' : '❌ NO'}`);

    // Percentage position for additional context
    const percentX = (imagePixelX / naturalWidth * 100).toFixed(2);
    const percentY = (imagePixelY / naturalHeight * 100).toFixed(2);
    console.log(`   📍 POSITION CONTEXT: ${percentX}% from left, ${percentY}% from top of image`);
    
    // Enhanced bounds validation with small tolerance for edge clicks
    const tolerance = 0.5; // Allow sub-pixel tolerance at edges
    if (imagePixelX < -tolerance || imagePixelX > naturalWidth + tolerance || 
        imagePixelY < -tolerance || imagePixelY > naturalHeight + tolerance) {
      console.warn(`⚠️ Click outside image bounds: (${imagePixelX.toFixed(2)}, ${imagePixelY.toFixed(2)}) vs (${naturalWidth}x${naturalHeight})`);
      return null;
    }
    
    // Clamp coordinates to exact image bounds to prevent floating point edge cases
    const clampedX = Math.max(0, Math.min(naturalWidth, imagePixelX));
    const clampedY = Math.max(0, Math.min(naturalHeight, imagePixelY));
    
    // Final coordinate clamping and precision logging
    if (Math.abs(clampedX - imagePixelX) > 0.001 || Math.abs(clampedY - imagePixelY) > 0.001) {
      console.log(`🔧 COORDINATE CLAMPING APPLIED:`);
      console.log(`   • Original: (${imagePixelX.toFixed(6)}, ${imagePixelY.toFixed(6)})`);
      console.log(`   • Clamped: (${clampedX.toFixed(6)}, ${clampedY.toFixed(6)})`);
      console.log(`   • Adjustment: (${(clampedX - imagePixelX).toFixed(6)}, ${(clampedY - imagePixelY).toFixed(6)}) px`);
    } else {
      console.log(`✅ COORDINATES WITHIN BOUNDS - No clamping needed`);
    }

    // Success summary
    console.log(`🎯 FINAL RESULT: (${clampedX.toFixed(4)}, ${clampedY.toFixed(4)}) image pixels`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    return {
      x: clampedX,
      y: clampedY,
      // Include debug info in return object for further analysis if needed
      _debug: {
        rawClick: { x: rawClickX, y: rawClickY },
        zoomCompensated: { x: cssX, y: cssY },
        totalZoom: totalZoomCompensation,
        scaleFactors: { x: scaleX, y: scaleY },
        naturalDimensions: { width: naturalWidth, height: naturalHeight },
        displayedDimensions: { width: rect.width, height: rect.height }
      }
    };
  };

  // Custom polygon handlers for surface cards
  const handlePolygonClick = (e, cardIndex) => {
    // If not drawing or not the active card, just set this card as active
    if (!isDrawingPolygon || cardIndex !== activeDrawingCardIndex) {
      console.log(`📍 Setting active drawing card to: ${cardIndex}`);
      setActiveDrawingCardIndex(cardIndex);
      return;
    }
    
    // Add polygon point using zoom-independent coordinates
    const coords = getImagePixelCoordinates(e, cardIndex);
    if (!coords) return;
    
    console.log(`🎯 Adding polygon point: (${coords.x.toFixed(1)}, ${coords.y.toFixed(1)}) to card ${cardIndex}`);
    setPolygonPoints((prev) => [...prev, coords]);
  };

  // Enhanced sub-pixel precision coordinate capture for ultra-accurate measurements
  const getUltraPreciseCoordinates = (e, cardIndex) => {
    const coords = getImagePixelCoordinates(e, cardIndex);
    if (!coords) return null;

    // Apply enhanced sub-pixel precision (0.01 pixel accuracy)
    const ultraPreciseX = Math.round(coords.x * 100) / 100;
    const ultraPreciseY = Math.round(coords.y * 100) / 100;

    return {
      x: ultraPreciseX,
      y: ultraPreciseY,
      originalX: coords.x,
      originalY: coords.y,
      precisionGain: {
        x: Math.abs(coords.x - ultraPreciseX),
        y: Math.abs(coords.y - ultraPreciseY)
      }
    };
  };

  // Ultra-precise directional snapping with multiple snap modes
  const ultraPreciseDirectionalSnap = (startPoint, endPoint) => {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const originalDistance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;

    // Ultra-tight snap tolerances for maximum precision
    const snapTolerance = 3; // Only ±3 degrees for ultra-precision

    let snappedPoint = { ...endPoint };
    let snapType = 'none';
    let precisionMetrics = {
      angleError: 0,
      distanceCorrection: 0,
      coordinateAdjustment: { x: 0, y: 0 }
    };

    // Perfect horizontal alignment (0°)
    if (angle < snapTolerance) {
      snappedPoint.y = startPoint.y;
      snapType = 'perfect-horizontal';
      precisionMetrics.angleError = angle;
      precisionMetrics.coordinateAdjustment.y = Math.abs(endPoint.y - startPoint.y);
      console.log(`🎯 ULTRA-SNAP: Perfect horizontal (${angle.toFixed(4)}° → 0°, Y-correction: ${precisionMetrics.coordinateAdjustment.y.toFixed(3)}px)`);
    }
    // Perfect vertical alignment (90°)
    else if (angle > (90 - snapTolerance)) {
      snappedPoint.x = startPoint.x;
      snapType = 'perfect-vertical';
      precisionMetrics.angleError = 90 - angle;
      precisionMetrics.coordinateAdjustment.x = Math.abs(endPoint.x - startPoint.x);
      console.log(`🎯 ULTRA-SNAP: Perfect vertical (${angle.toFixed(4)}° → 90°, X-correction: ${precisionMetrics.coordinateAdjustment.x.toFixed(3)}px)`);
    }
    // Perfect diagonal alignment (45°)
    else if (Math.abs(angle - 45) < snapTolerance) {
      // Force perfect 45° by making dx and dy equal
      const avgDistance = (Math.abs(dx) + Math.abs(dy)) / 2;
      snappedPoint.x = startPoint.x + (dx >= 0 ? avgDistance : -avgDistance);
      snappedPoint.y = startPoint.y + (dy >= 0 ? avgDistance : -avgDistance);
      snapType = 'perfect-diagonal';
      precisionMetrics.angleError = Math.abs(angle - 45);
      precisionMetrics.coordinateAdjustment.x = Math.abs(snappedPoint.x - endPoint.x);
      precisionMetrics.coordinateAdjustment.y = Math.abs(snappedPoint.y - endPoint.y);
      console.log(`🎯 ULTRA-SNAP: Perfect diagonal (${angle.toFixed(4)}° → 45°, corrections: X=${precisionMetrics.coordinateAdjustment.x.toFixed(3)}px, Y=${precisionMetrics.coordinateAdjustment.y.toFixed(3)}px)`);
    }

    const snappedDistance = Math.sqrt(
      Math.pow(snappedPoint.x - startPoint.x, 2) +
      Math.pow(snappedPoint.y - startPoint.y, 2)
    );

    precisionMetrics.distanceCorrection = Math.abs(snappedDistance - originalDistance);

    return {
      point: snappedPoint,
      snapType,
      originalDistance,
      snappedDistance,
      precisionMetrics,
      accuracyImprovement: (precisionMetrics.coordinateAdjustment.x + precisionMetrics.coordinateAdjustment.y) / originalDistance * 100
    };
  };

  // Ultra-precise 2-point reference line handlers
  const handleReferenceClick = (e, cardIndex) => {
    if (!isDrawingReference || cardIndex !== activeDrawingCardIndex) {
      setActiveDrawingCardIndex(cardIndex);
      return;
    }

    const coordsData = getUltraPreciseCoordinates(e, cardIndex);
    if (!coordsData) return;

    const coords = { x: coordsData.x, y: coordsData.y };
    const currentLine = referenceLine[cardIndex] || [];
    
    if (currentLine.length === 0) {
      // First point
      setReferenceLine(prev => ({
        ...prev,
        [cardIndex]: [coords]
      }));
      console.log(`📏 2-point reference: first point at (${coords.x.toFixed(1)}, ${coords.y.toFixed(1)})`);
    } else if (currentLine.length === 1) {
      // Second point with ultra-precise snapping
      const snapResult = ultraPreciseDirectionalSnap(currentLine[0], coords);
      const newLine = [currentLine[0], snapResult.point];

      setReferenceLine(prev => ({
        ...prev,
        [cardIndex]: newLine
      }));

      // Enhanced precision analytics
      console.log(`📏 ULTRA-PRECISE 2-point measurement analytics:`);
      console.log(`   • Snap type: ${snapResult.snapType}`);
      console.log(`   • Original coordinates: (${coords.x.toFixed(4)}, ${coords.y.toFixed(4)})`);
      console.log(`   • Snapped coordinates: (${snapResult.point.x.toFixed(4)}, ${snapResult.point.y.toFixed(4)})`);
      console.log(`   • Coordinate precision: X±${coordsData.precisionGain.x.toFixed(4)}px, Y±${coordsData.precisionGain.y.toFixed(4)}px`);
      console.log(`   • Accuracy improvement: ${snapResult.accuracyImprovement.toFixed(3)}%`);

      // Calculate scale with ultra-precision validation
      const lineLength = calculateReferenceLineLength(newLine);
      
      if (lineLength >= 4) { // Minimum 4 pixels for reliable 2-point measurement
        const REFERENCE_METERS = 0.9; // 2-point detection uses 0.9m (unchanged)
        const pixelsPerMeter = lineLength / REFERENCE_METERS;
        
        // Enhanced scale validation with reasonable bounds
        const minReasonableScale = 5;    // 5 px/m = very zoomed out
        const maxReasonableScale = 5000; // 5000 px/m = very zoomed in
        
        if (pixelsPerMeter >= minReasonableScale && pixelsPerMeter <= maxReasonableScale) {
          setScalePixelsPerMeter(prev => ({
            ...prev,
            [cardIndex]: pixelsPerMeter
          }));
          
          console.log(`📏 2-point reference scale complete for card ${cardIndex}:`);
          console.log(`   • Line length: ${lineLength.toFixed(3)} pixels`);
          console.log(`   • Reference distance: ${REFERENCE_METERS} meters`);
          console.log(`   • Calculated scale: ${pixelsPerMeter.toFixed(4)} px/m`);
          console.log(`   • Precision: ±${(1/pixelsPerMeter*1000).toFixed(3)}mm per pixel`);
          
          // Enhanced success message with precision metrics
          const precisionMm = (1/pixelsPerMeter*1000);
          const snapTypeText = snapResult.snapType !== 'none' ? ` (${snapResult.snapType.replace('-', ' ')})` : '';
          const accuracyText = snapResult.accuracyImprovement > 0.1 ? ` • +${snapResult.accuracyImprovement.toFixed(2)}% précision` : '';

          message.success({
            content: `✅ Échelle ultra-précise: ${pixelsPerMeter.toFixed(4)} px/m${snapTypeText} (0.9m = ${lineLength.toFixed(2)}px, ±${precisionMm.toFixed(3)}mm/px)${accuracyText}`,
            duration: 8
          });

          // Auto-disable reference drawing mode
          setIsDrawingReference(false);
        } else {
          console.warn(`⚠️ 2-point scale out of bounds: ${pixelsPerMeter.toFixed(1)} px/m`);
          message.warning(`Ligne de référence trop ${pixelsPerMeter < minReasonableScale ? 'courte' : 'longue'} - recommencez`);
          
          // Reset this card's reference line for retry
          setReferenceLine(prev => ({
            ...prev,
            [cardIndex]: []
          }));
        }
      } else {
        console.warn(`⚠️ 2-point reference line too short: ${lineLength.toFixed(1)}px (minimum: 4px)`);
        message.error('Ligne de référence trop courte - minimum 4 pixels pour une mesure précise');
        
        // Reset this card's reference line for retry
        setReferenceLine(prev => ({
          ...prev,
          [cardIndex]: []
        }));
      }
    } else {
      // Reset if clicking again (start over)
      setReferenceLine(prev => ({
        ...prev,
        [cardIndex]: [coords]
      }));
      console.log(`📏 2-point reference: restarted at (${coords.x.toFixed(1)}, ${coords.y.toFixed(1)})`);
    }
  };

  // Rectangle scale handlers
  const handleRectangleClick = (e, cardIndex) => {
    if (!isDrawingRectangleScale || cardIndex !== activeDrawingCardIndex) {
      setActiveDrawingCardIndex(cardIndex);
      return;
    }

    const coords = getImagePixelCoordinates(e, cardIndex);
    if (!coords) return;

    if (!scaleRectangle) {
      // Start drawing rectangle
      setScaleRectangle({
        startX: coords.x,
        startY: coords.y,
        width: 0,
        height: 0,
        cardIndex: cardIndex
      });
      setIsResizingRectangle(true);
      console.log(`📐 Started rectangle scale at (${coords.x.toFixed(1)}, ${coords.y.toFixed(1)})`);
    } else {
      // Allow user to restart rectangle by clicking when one exists
      setScaleRectangle({
        startX: coords.x,
        startY: coords.y,
        width: 0,
        height: 0,
        cardIndex: cardIndex
      });
      setIsResizingRectangle(true);
      console.log(`📐 Restarted rectangle scale at (${coords.x.toFixed(1)}, ${coords.y.toFixed(1)})`);
    }
  };

  const handleRectangleMouseMove = (e, cardIndex) => {
    if (!isDrawingRectangleScale || !isResizingRectangle || !scaleRectangle || cardIndex !== activeDrawingCardIndex) {
      return;
    }

    const coords = getImagePixelCoordinates(e, cardIndex);
    if (!coords) return;

    // Update rectangle dimensions (crop box)
    const newWidth = coords.x - scaleRectangle.startX;
    const newHeight = coords.y - scaleRectangle.startY;

    setScaleRectangle(prev => ({
      ...prev,
      width: newWidth,
      height: newHeight
    }));
  };

  const handleRectangleFinish = async (e, cardIndex) => {
    if (!scaleRectangle || !isResizingRectangle) return;

    setIsResizingRectangle(false);
    
    // Ultra-precise rectangle boundary calculation with validation
    const startX = scaleRectangle.startX;
    const startY = scaleRectangle.startY;
    const endX = startX + scaleRectangle.width;
    const endY = startY + scaleRectangle.height;

    // Normalized rectangle boundaries (top-left to bottom-right)
    const rectX = Math.min(startX, endX);
    const rectY = Math.min(startY, endY);
    const rectWidth = Math.abs(endX - startX);
    const rectHeight = Math.abs(endY - startY);

    console.log(`📐 Rectangle boundaries precision check:`);
    console.log(`   • Start: (${startX.toFixed(3)}, ${startY.toFixed(3)})`);
    console.log(`   • End: (${endX.toFixed(3)}, ${endY.toFixed(3)})`);
    console.log(`   • Normalized: (${rectX.toFixed(3)}, ${rectY.toFixed(3)}) + ${rectWidth.toFixed(3)}×${rectHeight.toFixed(3)}`);

    // Validate rectangle dimensions
    if (rectWidth < 1 || rectHeight < 1) {
      console.warn(`⚠️ Rectangle too small: ${rectWidth.toFixed(1)}×${rectHeight.toFixed(1)}px (minimum: 1×1px)`);
      message.error('Rectangle trop petit - dimensions minimum 1×1 pixel');

      setScaleRectangle(null);
      setIsResizingRectangle(false);
      return;
    }

    // Find the best line inside the rectangle using real image analysis ONLY
    console.log(`🎯 Starting REAL IMAGE ANALYSIS for rectangle ${rectWidth.toFixed(1)}×${rectHeight.toFixed(1)}px`);
    const detectedLine = await detectBestLineInRectangle(rectX, rectY, rectWidth, rectHeight);
    
    if (!detectedLine) {
      console.warn(`⚠️ No suitable line detected in rectangle - REFUSING geometric fallback`);
      message.warning('Aucune ligne détectée - essayez un autre endroit avec des lignes plus visibles');
      
      // Reset rectangle state and exit rectangle mode so user can try again or use another tool
      setScaleRectangle(null);
      setIsResizingRectangle(false);
      setIsDrawingRectangleScale(false);
      return;
    }
    
    console.log(`✅ Real image analysis SUCCESS: Found ${detectedLine.direction} line with detection method: ${detectedLine.detectionMethod}`);
    
    const edgeLength = detectedLine.length;
    
    // Cross-verification: Calculate actual line length from coordinates
    const dx = detectedLine.endX - detectedLine.startX;
    const dy = detectedLine.endY - detectedLine.startY;
    const calculatedLength = Math.sqrt(dx * dx + dy * dy);
    
    console.log(`📐 Line detection cross-verification:`);
    console.log(`   • Algorithm length: ${edgeLength.toFixed(4)}px`);
    console.log(`   • Coordinate length: ${calculatedLength.toFixed(4)}px`);
    console.log(`   • Difference: ${Math.abs(edgeLength - calculatedLength).toFixed(6)}px`);
    console.log(`   • Direction: ${detectedLine.direction} at ${detectedLine.angle}°`);
    
    // Use the more precise coordinate-based calculation
    const finalLength = calculatedLength;
    
    if (finalLength >= 4) { // Same minimum as reference line
      const REFERENCE_METERS = 1.1; // Rectangle detection uses 1.1m (updated from 1.2m)
      const pixelsPerMeter = finalLength / REFERENCE_METERS; // Use verified length
      
      // Enhanced scale validation
      const minReasonableScale = 5;
      const maxReasonableScale = 5000;
      
      if (pixelsPerMeter >= minReasonableScale && pixelsPerMeter <= maxReasonableScale) {
        setScalePixelsPerMeter(prev => ({
          ...prev,
          [cardIndex]: pixelsPerMeter
        }));
        
        console.log(`📐 Ultra-precise rectangle auto-detection complete for card ${cardIndex}:`);
        console.log(`   • Verified line length: ${finalLength.toFixed(4)} pixels (${detectedLine.direction})`);
        console.log(`   • Reference distance: ${REFERENCE_METERS} meters`);
        console.log(`   • Calculated scale: ${pixelsPerMeter.toFixed(6)} px/m`);
        console.log(`   • Precision: ±${(1/pixelsPerMeter*1000).toFixed(4)}mm per pixel`);
        console.log(`   • Line coordinates: (${detectedLine.startX.toFixed(3)}, ${detectedLine.startY.toFixed(3)}) → (${detectedLine.endX.toFixed(3)}, ${detectedLine.endY.toFixed(3)})`);
        
        // Store the detected line for visualization
        setScaleRectangle(prev => ({
          ...prev,
          detectedLine: detectedLine
        }));
        
        message.success(`Échelle ultra-précise: ${pixelsPerMeter.toFixed(4)} px/m (${detectedLine.direction} = 1.1m, ±${(1/pixelsPerMeter*1000).toFixed(2)}mm/px)`);
        
        // Reset rectangle mode
        setIsDrawingRectangleScale(false);
        setScaleRectangle(null);
      } else {
        console.warn(`⚠️ Rectangle scale out of bounds: ${pixelsPerMeter.toFixed(1)} px/m`);
        message.warning(`Rectangle trop ${pixelsPerMeter < minReasonableScale ? 'petit' : 'grand'} - cliquez à nouveau pour recommencer`);
        
        // CRITICAL: Reset rectangle state so user can start over
        setScaleRectangle(null);
        setIsResizingRectangle(false);
      }
    } else {
      console.warn(`⚠️ Detected line too small: ${finalLength.toFixed(3)}px (minimum: 1px)`);
      message.error('Ligne détectée trop courte - dessinez un rectangle plus grand (minimum 1 pixel)');
      
      // CRITICAL: Reset rectangle state so user can start over
      setScaleRectangle(null);
      setIsResizingRectangle(false);
    }
  };

  // Surface area calculation utilities - Ultra-high precision
  const calculatePolygonAreaPixels = (points) => {
    if (!points || points.length < 3) return 0;
    
    // Validate and clean all points with enhanced precision
    const validPoints = points.filter(p => 
      p && 
      typeof p.x === 'number' && 
      typeof p.y === 'number' && 
      !isNaN(p.x) && !isNaN(p.y) &&
      isFinite(p.x) && isFinite(p.y)
    );
    
    if (validPoints.length < 3) {
      console.warn(`⚠️ Insufficient valid points for area calculation: ${validPoints.length}/${points.length}`);
      return 0;
    }
    
    // Check for degenerate polygon (all points collinear or too close)
    const minArea = 0.001; // Minimum meaningful area in pixels²
    
    // Enhanced Shoelace formula with maximum mathematical precision
    let area = 0;
    const n = validPoints.length;
    
    // Use Kahan summation algorithm to minimize floating-point errors
    let compensation = 0;
    
    for (let i = 0; i < n; i++) {
      const current = validPoints[i];
      const next = validPoints[(i + 1) % n];
      
      // Calculate cross product component with high precision
      const crossProduct = current.x * next.y - next.x * current.y;
      
      // Kahan summation for improved numerical stability
      const y = crossProduct - compensation;
      const t = area + y;
      compensation = (t - area) - y;
      area = t;
    }
    
    const finalArea = Math.abs(area) / 2;
    
    // Validate result is geometrically reasonable
    if (finalArea < minArea) {
      console.warn(`⚠️ Calculated area too small (${finalArea.toFixed(6)} px²) - possible degenerate polygon`);
      return 0;
    }
    
    return finalArea;
  };

  const calculateDonutAreaPixels = (outerPoints, innerPoints) => {
    if (!outerPoints || !innerPoints) return 0;
    
    const outerArea = calculatePolygonAreaPixels(outerPoints);
    const innerArea = calculatePolygonAreaPixels(innerPoints);
    
    // Ensure inner area is not larger than outer area (geometric impossibility)
    if (innerArea > outerArea) {
      console.warn('⚠️ Inner area larger than outer area - possible polygon orientation issue');
      return 0;
    }
    
    return Math.max(0, outerArea - innerArea);
  };

  const calculateReferenceLineLength = (linePoints) => {
    if (!linePoints || linePoints.length !== 2) {
      console.warn(`⚠️ Invalid line points for distance calculation: ${linePoints?.length || 0} points`);
      return 0;
    }
    
    // Enhanced validation with finite number checks
    const [p1, p2] = linePoints;
    if (!p1 || !p2 || 
        typeof p1.x !== 'number' || typeof p1.y !== 'number' ||
        typeof p2.x !== 'number' || typeof p2.y !== 'number' ||
        !isFinite(p1.x) || !isFinite(p1.y) || !isFinite(p2.x) || !isFinite(p2.y)) {
      console.warn(`⚠️ Invalid point coordinates:`, { p1, p2 });
      return 0;
    }
    
    // Ultra-precise Euclidean distance calculation
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    
    // High-precision distance calculation
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check for reasonable minimum distance for accurate scale measurement
    const minDistance = 4; // Minimum 4 pixels for reliable scale measurement
    
    // Validate calculated distance is reasonable
    if (!isFinite(distance)) {
      console.warn(`⚠️ Invalid distance calculation: ${distance}`);
      return 0;
    }
    
    if (distance < minDistance) {
      console.warn(`⚠️ Reference line too short: ${distance.toFixed(1)}px (minimum: ${minDistance}px for accuracy)`);
      return 0;
    }
    
    // Log precision metrics for debugging
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    console.log(`📏 Line measurement: ${distance.toFixed(3)}px at ${angle.toFixed(1)}° (${dx.toFixed(2)}, ${dy.toFixed(2)})`);
    
    return distance;
  };

  const calculateIndividualShapeArea = (shape, cardIndex) => {
    if (!shape || !scalePixelsPerMeter[cardIndex]) return 0;
    
    // Enhanced scale validation with precision checks
    const cardScale = scalePixelsPerMeter[cardIndex];
    if (!isFinite(cardScale) || cardScale <= 0) {
      console.warn(`⚠️ Invalid scale for card ${cardIndex}: ${cardScale}`);
      return 0;
    }
    
    // Reasonable scale bounds (pixels per meter)
    if (cardScale < 1 || cardScale > 50000) {
      console.warn(`⚠️ Extreme scale factor for card ${cardIndex}: ${cardScale.toFixed(2)} px/m`);
    }
    
    let areaPixels = 0;
    if (shape.type === 'polygon') {
      areaPixels = calculatePolygonAreaPixels(shape.points);
    } else if (shape.type === 'donut') {
      areaPixels = calculateDonutAreaPixels(shape.outerPoints, shape.innerPoints);
    } else {
      console.warn(`⚠️ Unknown shape type: ${shape.type}`);
      return 0;
    }
    
    if (areaPixels <= 0) return 0;
    
    // Ultra-precise conversion from pixels² to m² 
    const scaleSquared = cardScale * cardScale;
    const areaSquareMeters = areaPixels / scaleSquared;
    
    // Enhanced bounds validation for realistic building surface areas
    const minReasonableArea = 0.0001; // 1 cm²
    const maxReasonableArea = 50000;   // 5 hectares
    
    if (!isFinite(areaSquareMeters)) {
      console.warn(`⚠️ Non-finite area calculation for card ${cardIndex}`);
      return 0;
    }
    
    if (areaSquareMeters < minReasonableArea) {
      console.warn(`⚠️ Area too small (${areaSquareMeters.toFixed(6)} m²) for card ${cardIndex} - possible precision issue`);
      return 0;
    }
    
    if (areaSquareMeters > maxReasonableArea) {
      console.warn(`⚠️ Area suspiciously large (${areaSquareMeters.toFixed(2)} m²) for card ${cardIndex} - check scale or polygon`);
    }
    
    return areaSquareMeters;
  };

  const calculateTotalSurfaceArea = (card, cardIndex) => {
    if (!card.shapes || card.shapes.length === 0 || !scalePixelsPerMeter[cardIndex]) return 0;
    
    // Accumulate individual shape areas for better precision tracking
    let totalArea = 0;
    card.shapes.forEach(shape => {
      if (shape && (shape.type === 'polygon' || shape.type === 'donut')) {
        const shapeArea = calculateIndividualShapeArea(shape, cardIndex);
        totalArea += shapeArea;
      }
    });
    
    return totalArea;
  };

  // Real image analysis for black line detection within rectangle crop box
  const detectBestLineInRectangle = async (rectX, rectY, rectWidth, rectHeight) => {
    console.log(`📐 Real image analysis starting: ${rectWidth.toFixed(3)}×${rectHeight.toFixed(3)} px`);
    
    // Enhanced minimum size validation
    if (rectWidth < 1 || rectHeight < 1) {
      console.warn(`⚠️ Rectangle too small: ${rectWidth.toFixed(1)}×${rectHeight.toFixed(1)}px (minimum: 1×1px)`);
      return null;
    }
    
    // Get the actual image element for pixel analysis
    const imageElement = document.querySelector(`img`); // Get the first image - need to make this more specific
    if (!imageElement) {
      console.warn(`⚠️ No image element found for analysis`);
      return null;
    }
    
    // Analyze actual image content within the rectangle
    const detectedLines = await analyzeImageContentForLines(imageElement, rectX, rectY, rectWidth, rectHeight);
    
    // Select the best line from detected lines
    const bestLine = selectBestDetectedLine(detectedLines, rectWidth, rectHeight);
    
    if (!bestLine) {
      console.warn(`⚠️ No black lines detected in crop box`);
      return null;
    }
    
    return bestLine;
  };

  // Analyze actual image pixels to detect black lines within rectangle
  const analyzeImageContentForLines = async (imageElement, rectX, rectY, rectWidth, rectHeight) => {
    console.log(`🔍 Analyzing image pixels for black lines...`);
    
    // Create canvas for image analysis
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match crop area
    canvas.width = Math.ceil(rectWidth);
    canvas.height = Math.ceil(rectHeight);
    
    // Get natural image dimensions for scaling
    const naturalWidth = imageElement.naturalWidth;
    const naturalHeight = imageElement.naturalHeight;
    const displayWidth = imageElement.width;
    const displayHeight = imageElement.height;
    
    if (!naturalWidth || !naturalHeight) {
      console.warn(`⚠️ Image not loaded properly for analysis`);
      return [];
    }
    
    // Calculate scaling factors
    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;
    
    // Convert display coordinates to natural image coordinates
    const sourceX = rectX * scaleX;
    const sourceY = rectY * scaleY;
    const sourceWidth = rectWidth * scaleX;
    const sourceHeight = rectHeight * scaleY;
    
    console.log(`🎯 Analyzing crop area: (${sourceX.toFixed(1)}, ${sourceY.toFixed(1)}) ${sourceWidth.toFixed(1)}×${sourceHeight.toFixed(1)}`);
    
    // Draw the cropped area to canvas
    try {
      ctx.drawImage(
        imageElement,
        sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle (natural coords)
        0, 0, canvas.width, canvas.height             // Destination rectangle (canvas coords)
      );
    } catch (error) {
      console.warn(`⚠️ Failed to draw image to canvas:`, error);
      return [];
    }
    
    // Get image data for pixel analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Detect lines using multiple algorithms
    const detectedLines = [];
    
    // 1. Horizontal line detection
    const horizontalLines = detectHorizontalLines(pixels, canvas.width, canvas.height);
    detectedLines.push(...horizontalLines);
    
    // 2. Vertical line detection
    const verticalLines = detectVerticalLines(pixels, canvas.width, canvas.height);
    detectedLines.push(...verticalLines);
    
    // 3. Diagonal line detection (optional for advanced analysis)
    const diagonalLines = detectDiagonalLines(pixels, canvas.width, canvas.height);
    detectedLines.push(...diagonalLines);
    
    console.log(`🔍 Image analysis complete: ${detectedLines.length} lines detected`);
    detectedLines.forEach((line, idx) => {
      console.log(`   • Line ${idx + 1}: ${line.direction} - ${line.length.toFixed(2)}px (confidence: ${line.confidence.toFixed(2)})`);
    });
    
    // Debug: Sample some pixels to understand the image content
    if (detectedLines.length === 0) {
      console.log(`🔬 Debug: Sampling pixels in ${canvas.width}×${canvas.height}px crop area:`);
      const samplePoints = [
        {x: 0, y: 0, label: 'top-left'},
        {x: Math.floor(canvas.width/2), y: 0, label: 'top-center'}, 
        {x: canvas.width-1, y: 0, label: 'top-right'},
        {x: 0, y: Math.floor(canvas.height/2), label: 'middle-left'},
        {x: Math.floor(canvas.width/2), y: Math.floor(canvas.height/2), label: 'center'},
        {x: canvas.width-1, y: Math.floor(canvas.height/2), label: 'middle-right'},
        {x: 0, y: canvas.height-1, label: 'bottom-left'},
        {x: Math.floor(canvas.width/2), y: canvas.height-1, label: 'bottom-center'},
        {x: canvas.width-1, y: canvas.height-1, label: 'bottom-right'}
      ];
      
      samplePoints.forEach(point => {
        const pixelIndex = (point.y * canvas.width + point.x) * 4;
        const r = pixels[pixelIndex] || 0;
        const g = pixels[pixelIndex + 1] || 0;
        const b = pixels[pixelIndex + 2] || 0;
        const brightness = (r + g + b) / 3;
        console.log(`   • ${point.label}: RGB(${r},${g},${b}) brightness=${brightness.toFixed(1)}`);
      });
    }
    
    return detectedLines;
  };

  // Enhanced horizontal line detection with multi-threshold analysis and gap tolerance
  const detectHorizontalLines = (pixels, width, height) => {
    const lines = [];
    
    // Multi-threshold analysis for better detection accuracy - make it more aggressive
    const thresholds = [60, 80, 100, 120, 150]; // Very dark to light gray thresholds
    // Dynamic thresholds based on rectangle size - much more lenient detection
    const rectSize = Math.min(width, height);
    const minLineLength = Math.max(1, Math.min(3, rectSize * 0.2));   // Much more lenient minimum length
    const maxGapSize = Math.max(1, Math.min(4, rectSize * 0.3));      // Allow larger gaps
    const minConfidence = Math.max(0.05, Math.min(0.2, rectSize * 0.03)); // Much lower confidence threshold
    
    console.log(`🔍 Enhanced horizontal line scanning: ${width}×${height}px with adaptive detection`);
    console.log(`   • Thresholds: ${thresholds.join(', ')} (dark → gray)`);
    console.log(`   • Adaptive settings: min length=${minLineLength.toFixed(1)}px, max gap=${maxGapSize.toFixed(1)}px, min confidence=${minConfidence.toFixed(3)}`);
    
    // Process each threshold level for comprehensive detection
    for (let thresholdIndex = 0; thresholdIndex < thresholds.length; thresholdIndex++) {
      const darkThreshold = thresholds[thresholdIndex];
      const thresholdLines = [];
      
      console.log(`   🎯 Processing threshold ${darkThreshold} (${thresholdIndex + 1}/${thresholds.length})`);
      
      // Scan each row for continuous dark pixels with gap tolerance
      for (let y = 1; y < height - 1; y += 1) { // Scan every row for accuracy
        let lineSegments = []; // Track all segments in this row
        let currentSegment = null;
        
        for (let x = 0; x < width; x++) {
          const pixelIndex = (y * width + x) * 4;
          const r = pixels[pixelIndex];
          const g = pixels[pixelIndex + 1];
          const b = pixels[pixelIndex + 2];
          const brightness = (r + g + b) / 3;
          
          if (brightness < darkThreshold) {
            // Dark pixel found
            if (!currentSegment) {
              currentSegment = {
                startX: x,
                endX: x,
                darkPixels: 1,
                totalPixels: 1
              };
            } else {
              currentSegment.endX = x;
              currentSegment.darkPixels++;
              currentSegment.totalPixels++;
            }
          } else {
            // Light pixel - handle gap tolerance
            if (currentSegment) {
              currentSegment.totalPixels++;
              
              // Check if gap is too large
              const gapSize = x - currentSegment.endX;
              if (gapSize > maxGapSize) {
                // End current segment
                if (currentSegment.endX - currentSegment.startX + 1 >= minLineLength) {
                  lineSegments.push(currentSegment);
                }
                currentSegment = null;
              }
            }
          }
        }
        
        // Handle segment at end of row
        if (currentSegment && currentSegment.endX - currentSegment.startX + 1 >= minLineLength) {
          lineSegments.push(currentSegment);
        }
        
        // Convert segments to lines with enhanced confidence calculation
        lineSegments.forEach((segment, segIndex) => {
          const lineLength = segment.endX - segment.startX + 1;
          const darkness = segment.darkPixels / segment.totalPixels;
          
          // Enhanced confidence calculation
          const lengthScore = Math.min(1.0, lineLength / 20); // Longer lines = higher confidence
          const darknessScore = darkness; // Higher dark pixel ratio = higher confidence
          const thresholdBonus = (thresholds.length - thresholdIndex) / thresholds.length * 0.2; // Earlier thresholds get bonus
          const confidence = Math.min(0.95, (lengthScore * 0.4 + darknessScore * 0.4 + thresholdBonus) * 0.9);
          
          if (confidence >= minConfidence) {
            thresholdLines.push({
              type: 'line',
              direction: 'horizontal-enhanced',
              startX: segment.startX,
              startY: y,
              endX: segment.endX,
              endY: y,
              length: lineLength,
              confidence: confidence,
              darkness: darkness,
              threshold: darkThreshold,
              darkPixels: segment.darkPixels,
              totalPixels: segment.totalPixels,
              segmentIndex: segIndex
            });
          }
        });
      }
      
      console.log(`     → Threshold ${darkThreshold}: ${thresholdLines.length} lines detected`);
      lines.push(...thresholdLines);
    }
    
    // Remove duplicate lines (same position but different thresholds)
    const uniqueLines = [];
    lines.forEach(line => {
      const existing = uniqueLines.find(existing => 
        Math.abs(existing.startX - line.startX) <= 2 &&
        Math.abs(existing.startY - line.startY) <= 2 &&
        Math.abs(existing.length - line.length) <= 3
      );
      
      if (!existing) {
        uniqueLines.push(line);
      } else if (line.confidence > existing.confidence) {
        // Replace with higher confidence line
        const index = uniqueLines.indexOf(existing);
        uniqueLines[index] = line;
      }
    });
    
    // Sort by confidence (best first)
    uniqueLines.sort((a, b) => b.confidence - a.confidence);
    
    console.log(`📏 Enhanced horizontal analysis complete:`);
    console.log(`   • Total detected: ${lines.length} lines`);
    console.log(`   • After deduplication: ${uniqueLines.length} unique lines`);
    
    uniqueLines.forEach((line, idx) => {
      console.log(`   • Line ${idx + 1}: ${line.length.toFixed(1)}px at (${line.startX},${line.startY}) - confidence: ${line.confidence.toFixed(3)} (threshold: ${line.threshold})`);
    });
    
    return uniqueLines;
  };

  // Detect vertical black lines in pixel data
  const detectVerticalLines = (pixels, width, height) => {
    const lines = [];
    const darkThreshold = 120; // More lenient threshold
    // Much more adaptive threshold for all rectangles
    const rectSize = Math.min(width, height);
    const minLineLength = Math.max(1, Math.min(3, rectSize * 0.2)); // Much more lenient
    
    console.log(`🔍 Scanning for vertical lines (adaptive min length: ${minLineLength.toFixed(1)}px)...`);
    
    // Scan each column for continuous dark pixels
    for (let x = 2; x < width - 2; x += 2) { // Skip every other column for performance
      let lineStart = -1;
      let darkPixelCount = 0;
      
      for (let y = 0; y < height; y++) {
        const pixelIndex = (y * width + x) * 4;
        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness < darkThreshold) {
          // Dark pixel found
          if (lineStart === -1) {
            lineStart = y;
          }
          darkPixelCount++;
        } else {
          // Light pixel - check if we were tracking a line
          if (lineStart !== -1 && darkPixelCount >= minLineLength) {
            const lineLength = y - lineStart;
            const confidence = Math.min(0.9, darkPixelCount / lineLength * 0.8);
            
            lines.push({
              type: 'line',
              direction: 'vertical-detected',
              startX: x,
              startY: lineStart,
              endX: x,
              endY: y - 1,
              length: lineLength,
              confidence: confidence,
              darkness: darkPixelCount / lineLength
            });
          }
          lineStart = -1;
          darkPixelCount = 0;
        }
      }
      
      // Check for line at end of column
      if (lineStart !== -1 && darkPixelCount >= minLineLength) {
        const lineLength = height - lineStart;
        const confidence = Math.min(0.9, darkPixelCount / lineLength * 0.8);
        
        lines.push({
          type: 'line',
          direction: 'vertical-detected',
          startX: x,
          startY: lineStart,
          endX: x,
          endY: height - 1,
          length: lineLength,
          confidence: confidence,
          darkness: darkPixelCount / lineLength
        });
      }
    }
    
    console.log(`📏 Found ${lines.length} vertical lines`);
    return lines;
  };

  // Detect diagonal black lines (simplified implementation)
  const detectDiagonalLines = (pixels, width, height) => {
    const lines = [];
    const darkThreshold = 120; // More lenient threshold
    // Much more adaptive threshold for all rectangles
    const rectSize = Math.min(width, height);
    const minLineLength = Math.max(1, Math.min(3, rectSize * 0.2)); // Much more lenient
    
    console.log(`🔍 Scanning for diagonal lines (adaptive min length: ${minLineLength.toFixed(1)}px)...`);
    
    // Simple diagonal detection - can be enhanced further
    // For now, just detect 45-degree lines from corners
    
    // Top-left to bottom-right diagonal
    let darkCount = 0;
    const maxDiag = Math.min(width, height);
    
    for (let i = 0; i < maxDiag; i++) {
      const pixelIndex = (i * width + i) * 4;
      const r = pixels[pixelIndex] || 255;
      const g = pixels[pixelIndex + 1] || 255;
      const b = pixels[pixelIndex + 2] || 255;
      const brightness = (r + g + b) / 3;
      
      if (brightness < darkThreshold) {
        darkCount++;
      }
    }
    
    if (darkCount >= minLineLength) {
      const diagonalLength = Math.sqrt(maxDiag * maxDiag + maxDiag * maxDiag);
      lines.push({
        type: 'line',
        direction: 'diagonal-detected',
        startX: 0,
        startY: 0,
        endX: maxDiag - 1,
        endY: maxDiag - 1,
        length: diagonalLength,
        confidence: Math.min(0.7, darkCount / maxDiag * 0.6),
        darkness: darkCount / maxDiag
      });
    }
    
    console.log(`📏 Found ${lines.length} diagonal lines`);
    return lines;
  };

  // Select the best detected line based on confidence and length
  const selectBestDetectedLine = (detectedLines) => {
    if (detectedLines.length === 0) {
      return null;
    }
    
    // Sort by confidence, then by length
    const sortedLines = detectedLines.sort((a, b) => {
      if (Math.abs(a.confidence - b.confidence) < 0.1) {
        return b.length - a.length; // Prefer longer lines if confidence is similar
      }
      return b.confidence - a.confidence;
    });
    
    const bestLine = sortedLines[0];
    const alternatives = sortedLines.slice(1, 3);
    
    console.log(`🎯 Best detected line selected:`);
    console.log(`   • Primary: ${bestLine.direction} - ${bestLine.length.toFixed(4)}px (confidence: ${bestLine.confidence.toFixed(3)})`);
    console.log(`   • Darkness ratio: ${bestLine.darkness.toFixed(3)} (${(bestLine.darkness * 100).toFixed(1)}% dark pixels)`);
    
    if (alternatives.length > 0) {
      console.log(`   • Alternatives detected:`);
      alternatives.forEach((alt, idx) => {
        console.log(`     ${idx + 1}. ${alt.direction}: ${alt.length.toFixed(2)}px (confidence: ${alt.confidence.toFixed(3)})`);
      });
    }
    
    // Convert to expected format
    return {
      length: bestLine.length,
      angle: bestLine.direction.includes('horizontal') ? 0 : (bestLine.direction.includes('vertical') ? 90 : 45),
      direction: bestLine.direction,
      startX: bestLine.startX,
      startY: bestLine.startY,
      endX: bestLine.endX,
      endY: bestLine.endY,
      confidence: bestLine.confidence,
      darkness: bestLine.darkness,
      detectionMethod: 'real-image-analysis',
      alternatives: alternatives
    };
  };

  // ULTRA-SMART donut detection - works with ANY polygon combination and order
  const checkForDonutCreation = (card, newShape) => {
    if (!card.shapes || card.shapes.length === 0) {
      console.log('🔍 No existing shapes to check for donut creation');
      return false;
    }

    console.log(`🔍 ULTRA-SMART donut detection for new shape: ${newShape.color}`);
    console.log(`🔍 Existing shapes:`, card.shapes.map(s => `${s.type} (${s.color})`));

    const newShapeBaseColor = (newShape.color || 'blue').replace('-hollow', '');

    // Find ALL matching color polygons (both hollow and solid of same color)
    const matchingShapes = card.shapes.filter(shape =>
      shape.type === 'polygon' &&
      shape.color &&
      shape.color.replace('-hollow', '') === newShapeBaseColor
    );

    console.log(`🔍 Found ${matchingShapes.length} matching color shapes for donut testing`);

    for (const existingShape of matchingShapes) {
      console.log(`🔍 Testing combination: existing(${existingShape.color}) + new(${newShape.color})`);

      let outerShape, innerShape;

      // BIDIRECTIONAL TEST: Test both containment directions

      // Direction 1: New shape contains existing shape
      if (isPolygonInsidePolygon(existingShape.points, newShape.points)) {
        outerShape = newShape;
        innerShape = existingShape;
        console.log('🍩 DONUT DETECTED! Existing shape is INSIDE new shape');
      }
      // Direction 2: Existing shape contains new shape
      else if (isPolygonInsidePolygon(newShape.points, existingShape.points)) {
        outerShape = existingShape;
        innerShape = newShape;
        console.log('🍩 DONUT DETECTED! New shape is INSIDE existing shape');
      }
      else {
        console.log('🔍 No containment relationship - polygons are separate or overlapping');
        continue;
      }

      // Success! Found a valid donut combination
      console.log(`🍩 CREATING DONUT: outer=${outerShape.color} inner=${innerShape.color}`);
      return {
        borderShape: outerShape,
        interiorShape: innerShape,
        existingShapeToRemove: existingShape
      };
    }

    console.log('🔍 No donut combinations found with existing shapes');
    return false;
  };

  // Check if polygon A is inside polygon B using ray casting algorithm
  const isPolygonInsidePolygon = (innerPoints, outerPoints) => {
    if (!innerPoints || !outerPoints || innerPoints.length < 3 || outerPoints.length < 3) {
      console.log('🔍 Invalid polygon points for inside check');
      return false;
    }

    console.log(`🔍 Checking if ${innerPoints.length} inner points are inside ${outerPoints.length} outer points`);

    // Test if all points of inner polygon are inside outer polygon
    let insideCount = 0;
    for (let i = 0; i < innerPoints.length; i++) {
      const point = innerPoints[i];
      const isInside = isPointInPolygon(point, outerPoints);
      if (isInside) {
        insideCount++;
      }
      console.log(`🔍 Point ${i} (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) inside: ${isInside}`);
    }

    const allInside = insideCount === innerPoints.length;
    console.log(`🔍 Inside check result: ${insideCount}/${innerPoints.length} points inside = ${allInside}`);

    return allInside;
  };

  // Ray casting algorithm to determine if point is inside polygon
  const isPointInPolygon = (point, polygon) => {
    const x = point.x;
    const y = point.y;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  };

  // Finish polygon and add it to the current card
  const finishPolygon = () => {
    if (polygonPoints.length < 3 || activeDrawingCardIndex === null) {
      message.warning('Polygon nécessite au moins 3 points');
      return;
    }

    const polygonId = `polygon-${Date.now()}`;
    const newShape = {
      id: polygonId,
      type: 'polygon',
      points: [...polygonPoints],
      color: drawingColor,
      timestamp: Date.now()
    };

    // Add polygon to the active card
    setSurfaceCards(prev => {
      const updated = [...prev];
      if (!updated[activeDrawingCardIndex].shapes) {
        updated[activeDrawingCardIndex].shapes = [];
      }

      // Check for donut creation
      const donutDetection = checkForDonutCreation(updated[activeDrawingCardIndex], newShape);

      if (donutDetection) {
        // Create donut shape and remove the existing shape that was combined
        const donutId = `donut-${Date.now()}`;
        const baseColor = donutDetection.borderShape.color.replace('-hollow', '');

        const donutShape = {
          id: donutId,
          type: 'donut',
          outerPoints: [...donutDetection.borderShape.points],
          innerPoints: [...donutDetection.interiorShape.points],
          color: `${baseColor}-donut`,
          timestamp: Date.now()
        };

        // Remove the existing shape that was combined and add the donut
        updated[activeDrawingCardIndex].shapes = updated[activeDrawingCardIndex].shapes.filter(
          shape => shape.id !== donutDetection.existingShapeToRemove.id
        );
        updated[activeDrawingCardIndex].shapes.push(donutShape);

        const outerArea = calculatePolygonAreaPixels(donutDetection.borderShape.points);
        const innerArea = calculatePolygonAreaPixels(donutDetection.interiorShape.points);

        console.log(`🍩 ULTRA-SMART DONUT CREATED:`);
        console.log(`   • Outer: ${donutDetection.borderShape.points.length} points (${outerArea.toFixed(1)} px²)`);
        console.log(`   • Inner: ${donutDetection.interiorShape.points.length} points (${innerArea.toFixed(1)} px²)`);
        console.log(`   • Net area: ${(outerArea - innerArea).toFixed(1)} px²`);

        message.success(`🍩 Donut intelligent créé! Surface = ${donutDetection.borderShape.color} - ${donutDetection.interiorShape.color}`);

      } else {
        // Regular polygon addition
        updated[activeDrawingCardIndex].shapes.push(newShape);
        console.log(`✅ Polygon completed: ${polygonPoints.length} points added to card ${activeDrawingCardIndex}`);
        message.success(`Polygone ajouté (${polygonPoints.length} points)`);
      }

      return updated;
    });

    // Reset polygon state
    setPolygonPoints([]);
    setIsDrawingPolygon(false);
  };

  // Load existing surface cards from SQL on mount
  useEffect(() => {
    const loadExistingSurfaceCards = async () => {
      try {
        setIsLoadingCards(true);
        const response = await fetch(`${API_BASE_URL}/images/get-sql-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site: siteName })
        });

        const data = await response.json();

        if (data.images && Array.isArray(data.images)) {
          const surfaceImages = data.images.filter(img => img.type === 'surface');

          if (surfaceImages.length > 0) {
            console.log(`📁 Loading ${surfaceImages.length} existing surface cards`);

            const loadedCards = surfaceImages.map(img => ({
              id: img.id,
              url: img.url_viewer,
              title: img.title || 'Surface sans titre',
              shapes: img.shapes ? JSON.parse(img.shapes) : [],
              comments: img.comments || '',
              width: img.width,
              height: img.height,
              crop_transform_x: img.crop_transform_x || 0,
              crop_transform_y: img.crop_transform_y || 0,
              crop_transform_width: img.crop_transform_width,
              crop_transform_height: img.crop_transform_height,
              timestamp: img.datetime
            }));

            setSurfaceCards(loadedCards);

            // Auto-select first card
            if (loadedCards.length > 0) {
              setSelectedCardIndex(0);
            }

            // Load delete URLs for cleanup
            const deleteUrls = surfaceImages.map(img => img.delete_url).filter(Boolean);
            setSurfaceDeleteUrls(deleteUrls);

            console.log(`✅ Surface cards loaded: ${loadedCards.length} cards with ${deleteUrls.length} delete URLs`);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load surface cards:', error);
        message.error('Erreur lors du chargement des surfaces');
      } finally {
        setIsLoadingCards(false);
      }
    };

    if (siteName && siteName !== 'unknown') {
      loadExistingSurfaceCards();
    }
  }, [siteName]);

  // Add new card
  const addNewCard = () => {
    const newCard = {
      id: `surface-card-${Date.now()}`,
      url: null,
      title: `Devis #${surfaceCards.length + 1}`,
      shapes: [],
      comments: '',
      timestamp: Date.now()
    };

    setSurfaceCards(prev => [...prev, newCard]);
    setSelectedCardIndex(surfaceCards.length); // Auto-select the newly created card
    console.log(`➕ Added new devis card: ${newCard.title}`);
    message.success('Nouveau devis créé');
  };

  // Handle image crop confirmation
  const onCropConfirm = (croppedDataUrl) => {
    if (cropCardIndex !== null && surfaceCards[cropCardIndex]) {
      setSurfaceCards(prev => {
        const updated = [...prev];
        updated[cropCardIndex] = {
          ...updated[cropCardIndex],
          url: croppedDataUrl
        };
        return updated;
      });
      
      console.log(`🖼️ Image cropped and applied to card ${cropCardIndex}`);
      message.success('Image recadrée et appliquée');
    }
    
    setImageSrc(null);
    setCropCardIndex(null);
  };

  // Enhanced upload - save single card or all cards
  const handleUpload = async (cardIndex = null) => {
    try {
      if (surfaceCards.length === 0) {
        message.warning('Aucune surface à enregistrer');
        return;
      }

      // Save single card or all cards
      const cardsToSave = cardIndex !== null ? [surfaceCards[cardIndex]] : surfaceCards;
      const indices = cardIndex !== null ? [cardIndex] : surfaceCards.map((_, i) => i);

      message.loading(cardIndex !== null ? 'Enregistrement...' : 'Enregistrement des surfaces...', 0);

      const uploadPromises = cardsToSave.map(async (card, i) => {
        const actualIndex = indices[i];
        try {
          return await uploadToImgBB(card, actualIndex, siteName, 'surface');
        } catch (error) {
          console.error(`❌ Failed to upload card ${actualIndex}:`, error);
          throw new Error(`Surface #${actualIndex + 1}: ${error.message}`);
        }
      });

      await Promise.all(uploadPromises);

      message.destroy();
      if (cardIndex !== null) {
        message.success(`Surface #${cardIndex + 1} enregistrée avec succès`);
      } else {
        message.success(`${surfaceCards.length} surface(s) enregistrée(s) avec succès`);
      }
      console.log(`✅ Surface card(s) uploaded successfully`);

    } catch (error) {
      message.destroy();
      console.error('❌ Upload failed:', error);
      message.error(`Erreur d'enregistrement: ${error.message}`);
    }
  };

  // Enhanced delete all with confirmation
  const handleDeleteAll = async () => {
    try {
      if (surfaceCards.length === 0) {
        message.info('Aucune surface à supprimer');
        return;
      }
      
      message.loading('Suppression des surfaces...', 0);
      
      // Delete from ImgBB and SQL
      await deleteSurfaceCard('all', siteName);
      
      // Reset local state
      setSurfaceCards([]);
      setSurfaceDeleteUrls([]);
      setScalePixelsPerMeter({});
      setReferenceLine({});
      setActiveDrawingCardIndex(null);
      setPolygonPoints([]);
      setIsDrawingPolygon(false);
      setIsDrawingReference(false);
      setIsDrawingRectangleScale(false);
      setScaleRectangle(null);
      
      message.destroy();
      message.success('Toutes les surfaces ont été supprimées');
      console.log('🗑️ All surface cards deleted');
      
    } catch (error) {
      message.destroy();
      console.error('❌ Delete failed:', error);
      message.error(`Erreur de suppression: ${error.message}`);
    }
  };

  // Handle image upload for cropping
  const handleImageUpload = (file, cardIndex) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      setCropCardIndex(cardIndex);
      console.log(`📁 Image loaded for cropping: card ${cardIndex}`);
    };
    reader.readAsDataURL(file);
    return false; // Prevent default upload
  };

  // Delete individual card
  const handleDeleteCard = async (cardIndex) => {
    try {
      const card = surfaceCards[cardIndex];

      if (!card) {
        message.error('Carte introuvable');
        return;
      }

      message.loading('Suppression...', 0);

      // Delete from ImgBB and SQL if card has an ID (was saved)
      if (card.id) {
        await deleteSurfaceCard(card.id, siteName);
        console.log(`🗑️ Deleted card ${cardIndex} from SQL and ImgBB`);
      }

      // Remove from local state
      setSurfaceCards(prev => prev.filter((_, i) => i !== cardIndex));

      // Reset active states if deleting active card
      if (activeDrawingCardIndex === cardIndex) {
        setActiveDrawingCardIndex(null);
        setPolygonPoints([]);
        setIsDrawingPolygon(false);
      }

      // Clear scale data for this card
      setScalePixelsPerMeter(prev => {
        const updated = { ...prev };
        delete updated[cardIndex];
        return updated;
      });

      setReferenceLine(prev => {
        const updated = { ...prev };
        delete updated[cardIndex];
        return updated;
      });

      message.destroy();
      message.success(`Surface #${cardIndex + 1} supprimée`);

    } catch (error) {
      message.destroy();
      console.error('❌ Delete failed:', error);
      message.error(`Erreur de suppression: ${error.message}`);
    }
  };

  // Update card title
  const updateCardTitle = (cardIndex, newTitle) => {
    setSurfaceCards(prev => {
      const updated = [...prev];
      updated[cardIndex] = {
        ...updated[cardIndex],
        title: newTitle
      };
      return updated;
    });
  };

  // Update card comments
  const updateCardComments = (cardIndex, newComments) => {
    setSurfaceCards(prev => {
      const updated = [...prev];
      updated[cardIndex] = {
        ...updated[cardIndex],
        comments: newComments
      };
      return updated;
    });
  };

  return (
    <PageLayout
      title="Plan de Surfaces"
      description="Créez et analysez des surfaces avec mesures polygonales précises"
    >
      {/* Devis Cards Grid */}
      {surfaceCards.length === 0 && !isLoadingCards ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Aucun devis créé"
          style={{ margin: '60px 0' }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addNewCard}
            size="large"
          >
            Créer le premier devis
          </Button>
        </Empty>
      ) : (
        <>
          {/* Devis Selection Grid */}
          <Card
            title="📋 Mes Devis"
            style={{ marginBottom: 24 }}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addNewCard}
              >
                Nouveau Devis
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              {surfaceCards.map((card, index) => {
                const totalArea = calculateTotalSurfaceArea(card, index);
                const isSelected = selectedCardIndex === index;

                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={card.id}>
                    <Card
                      hoverable
                      onClick={() => setSelectedCardIndex(index)}
                      style={{
                        border: isSelected ? '3px solid #1890ff' : '1px solid #d9d9d9',
                        boxShadow: isSelected
                          ? '0 4px 12px rgba(24, 144, 255, 0.3)'
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease',
                        height: '100%',
                      }}
                      cover={
                        card.url ? (
                          <div
                            style={{
                              height: 120,
                              overflow: 'hidden',
                              background: '#f0f0f0',
                              position: 'relative',
                            }}
                          >
                            <img
                              alt={card.title}
                              src={card.url}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            {isSelected && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  background: '#52c41a',
                                  borderRadius: '50%',
                                  width: 28,
                                  height: 28,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 8px rgba(82, 196, 26, 0.4)',
                                }}
                              >
                                <FileImageOutlined
                                  style={{ color: 'white', fontSize: 16 }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              height: 120,
                              background: '#fafafa',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px dashed #d9d9d9',
                            }}
                          >
                            <PictureOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
                          </div>
                        )
                      }
                    >
                      <Card.Meta
                        title={
                          <Typography.Text
                            editable={{
                              onChange: (value) => updateCardTitle(index, value),
                            }}
                            style={{ fontSize: 14 }}
                          >
                            {card.title}
                          </Typography.Text>
                        }
                        description={
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              {(card.shapes || []).length} forme{(card.shapes || []).length > 1 ? 's' : ''}
                              {totalArea > 0 && ` • ${totalArea.toFixed(2)} m²`}
                            </Typography.Text>
                            {isSelected && (
                              <Tag color="success" style={{ marginTop: 4 }}>
                                En édition
                              </Tag>
                            )}
                          </Space>
                        }
                      />
                      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                        <Button
                          size="small"
                          icon={<UploadOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpload(index);
                          }}
                          type="primary"
                          style={{ flex: 1 }}
                        >
                          Sauver
                        </Button>
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(index);
                          }}
                        />
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>

          {/* Selected Card Editor */}
          {selectedCardIndex !== null && surfaceCards[selectedCardIndex] && (
            <CardEditor
              key={surfaceCards[selectedCardIndex].id}
              card={surfaceCards[selectedCardIndex]}
              index={selectedCardIndex}
              beforeUpload={handleImageUpload}
              handlePolygonClick={handlePolygonClick}
              handleReferenceLineClick={handleReferenceClick}
              handleRectangleClick={handleRectangleClick}
              handleRectangleMouseMove={handleRectangleMouseMove}
              handleRectangleFinish={handleRectangleFinish}
              polygonPoints={polygonPoints}
              drawingColor={drawingColor}
              isDrawingPolygon={isDrawingPolygon}
              isDrawingReference={isDrawingReference}
              isDrawingRectangleScale={isDrawingRectangleScale}
              activeDrawingCardIndex={activeDrawingCardIndex}
              referenceLine={referenceLine}
              scalePixelsPerMeter={scalePixelsPerMeter}
              scaleRectangle={scaleRectangle}
              isResizingRectangle={isResizingRectangle}
              calculateTotalSurfaceArea={calculateTotalSurfaceArea}
              calculateIndividualShapeArea={calculateIndividualShapeArea}
              onTitleChange={(title) => updateCardTitle(selectedCardIndex, title)}
              onCommentsChange={(comments) => updateCardComments(selectedCardIndex, comments)}
            />
          )}
        </>
      )}

      <PolygonDrawingControls
        activeDrawingCardIndex={activeDrawingCardIndex}
        isDrawingPolygon={isDrawingPolygon}
        polygonPoints={polygonPoints}
        setDrawingColor={setDrawingColor}
        setPolygonPoints={setPolygonPoints}
        setIsDrawingPolygon={setIsDrawingPolygon}
        finishPolygon={finishPolygon}
        // Reference line props
        isDrawingReference={isDrawingReference}
        setIsDrawingReference={setIsDrawingReference}
        referenceLine={referenceLine}
        setReferenceLine={setReferenceLine}
        scalePixelsPerMeter={scalePixelsPerMeter}
        // Rectangle scale props
        isDrawingRectangleScale={isDrawingRectangleScale}
        setIsDrawingRectangleScale={setIsDrawingRectangleScale}
      />

      <ImageCropperModal
        imageSrc={imageSrc}
        open={!!imageSrc}
        onCancel={() => {
          setImageSrc(null);
          setCropCardIndex(null);
        }}
        onCropConfirm={onCropConfirm}
      />

      {/* Actions & Summary */}
      <Card 
        style={{ marginTop: 24 }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Actions & Résumé
            </Typography.Title>
          </div>
        }
      >
        {/* Surface Summary */}
        {Object.keys(scalePixelsPerMeter).length > 0 && surfaceCards.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Typography.Text strong style={{ 
              marginBottom: 16, 
              display: 'block',
              fontSize: 18,
              color: '#2c3e50',
              borderLeft: '4px solid #1890ff',
              paddingLeft: 12
            }}>
              📊 Résumé détaillé des surfaces:
            </Typography.Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {surfaceCards.map((card, index) => {
                const cardArea = calculateTotalSurfaceArea(card, index);
                const shapes = (card.shapes || []).filter(shape => shape && (shape.type === 'polygon' || shape.type === 'donut'));
                const shapeCount = shapes.length;
                
                if (cardArea === 0 && shapeCount === 0) return null;
                
                return (
                  <div key={index} style={{ 
                    background: 'rgba(24, 144, 255, 0.03)',
                    padding: '16px',
                    borderRadius: 12,
                    border: '1px solid rgba(24, 144, 255, 0.15)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Typography.Text strong style={{ fontSize: 16, color: '#2c3e50' }}>
                        Surface #{index + 1}
                      </Typography.Text>
                      <Typography.Text strong style={{ 
                        fontSize: 16, 
                        color: '#1890ff',
                        background: 'rgba(24, 144, 255, 0.1)',
                        padding: '4px 12px',
                        borderRadius: 20
                      }}>
                        {cardArea.toFixed(2)} m²
                      </Typography.Text>
                    </div>
                    
                    {/* Individual polygon details */}
                    {shapes.length > 0 && (
                      <div style={{ 
                        display: 'grid', 
                        gap: 6, 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        marginTop: 8
                      }}>
                        {shapes.map((shape, shapeIndex) => {
                          const area = calculateIndividualShapeArea ? calculateIndividualShapeArea(shape, index) : 0;
                          const shapeType = shape.type === 'donut' ? 'Donut' : 'Polygone';
                          const colorName = shape.color ? shape.color.replace('-hollow', '').replace('-donut', '') : 'blue';
                          const colorDisplay = colorName === 'red' ? 'Rouge' : 'Bleu';
                          const isHollow = shape.color && shape.color.includes('hollow');
                          const isDonut = shape.type === 'donut';

                          // Calculate donut details for display
                          let donutDetails = '';
                          if (isDonut && shape.outerPoints && shape.innerPoints && scalePixelsPerMeter[index]) {
                            const scale = scalePixelsPerMeter[index];
                            const outerAreaPixels = calculatePolygonAreaPixels(shape.outerPoints);
                            const innerAreaPixels = calculatePolygonAreaPixels(shape.innerPoints);
                            const outerAreaM2 = outerAreaPixels / (scale * scale);
                            const innerAreaM2 = innerAreaPixels / (scale * scale);
                            const netAreaM2 = outerAreaM2 - innerAreaM2;

                            console.log(`🍩 Donut calculation: ${outerAreaM2.toFixed(3)} - ${innerAreaM2.toFixed(3)} = ${netAreaM2.toFixed(3)} m²`);
                            donutDetails = ` (${outerAreaM2.toFixed(2)} - ${innerAreaM2.toFixed(2)} = ${netAreaM2.toFixed(2)})`;
                          }

                          return (
                            <div key={shapeIndex} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'rgba(255, 255, 255, 0.6)',
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: `1px solid ${colorName === 'red' ? 'rgba(255, 77, 79, 0.2)' : 'rgba(24, 144, 255, 0.2)'}`,
                              fontSize: 13
                            }}>
                              <span style={{
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                              }}>
                                <div style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: isDonut ? '50%' : '50%',
                                  background: colorName === 'red' ? '#ff4d4f' : '#1890ff',
                                  border: isDonut ? `2px solid ${colorName === 'red' ? '#ff4d4f' : '#1890ff'}` : 'none',
                                  backgroundColor: isDonut ? 'transparent' : (colorName === 'red' ? '#ff4d4f' : '#1890ff')
                                }} />
                                {shapeType} {shapeIndex + 1} ({colorDisplay}{isHollow ? ' creux' : ''}{isDonut ? ' - Bordure moins Intérieur' : ''})
                              </span>
                              <span style={{
                                fontWeight: 600,
                                color: area === 0 ? '#ccc' : '#1890ff',
                                fontSize: isDonut ? 11 : 13
                              }}>
                                {area.toFixed(2)} m²{donutDetails}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {shapeCount === 0 && (
                      <Typography.Text style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>
                        Aucune forme définie
                      </Typography.Text>
                    )}
                  </div>
                );
              })}
              
              {/* Total Summary */}
              {surfaceCards.some(card => calculateTotalSurfaceArea(card) > 0) && (
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.15) 0%, rgba(24, 144, 255, 0.08) 100%)',
                  padding: '20px',
                  borderRadius: 16,
                  border: '2px solid #1890ff',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(24, 144, 255, 0.2)',
                  marginTop: 8
                }}>
                  <Typography.Text strong style={{ 
                    fontSize: 18, 
                    color: '#1890ff',
                    display: 'block',
                    marginBottom: 8,
                    letterSpacing: '0.5px'
                  }}>
                    🏢 TOTAL GÉNÉRAL 🏢
                  </Typography.Text>
                  <Typography.Text strong style={{ 
                    fontSize: 24, 
                    color: '#1890ff',
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: '8px 20px',
                    borderRadius: 25,
                    display: 'inline-block',
                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.15)'
                  }}>
                    {surfaceCards.reduce((total, card, index) => total + calculateTotalSurfaceArea(card, index), 0).toFixed(2)} m²
                  </Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <Typography.Text style={{ 
                      fontSize: 14, 
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      {surfaceCards.filter(card => calculateTotalSurfaceArea(card) > 0).length} surface{surfaceCards.filter(card => calculateTotalSurfaceArea(card) > 0).length > 1 ? 's' : ''} avec polygones
                    </Typography.Text>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <ActionButtons
          layout="grid"
          buttons={[
            {
              icon: <PlusOutlined />,
              onClick: addNewCard,
              children: 'Nouvelle Surface'
            },
            {
              type: 'primary',
              icon: <UploadOutlined />,
              onClick: handleUpload,
              disabled: surfaceCards.length === 0,
              children: 'Enregistrer Tout'
            },
            {
              danger: true,
              icon: <DeleteOutlined />,
              onClick: handleDeleteAll,
              disabled: surfaceCards.length === 0,
              children: 'Supprimer Tout'
            }
          ]}
        />
      </Card>
    </PageLayout>
  );
};

export default SurfacePlanPage;