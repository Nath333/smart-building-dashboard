# Code Duplication Analysis Report

## Summary
Identified 7 major duplication areas with specific line numbers and consolidation strategies.

## 1. Canvas Coordinate Calculation (3 locations)
**File**: GTBPlanApp.jsx
- Line 178-180: handleCanvasDrop
- Line 292-294: handleCanvasClick  
- Line 323-325: handleCanvasMouseMove

**Solution**: Create src/utils/canvasUtils.js with getCanvasCoordinates()

## 2. Line Style Stroke Pattern (2 locations)
**File**: GTBPlanApp.jsx
- Line 854-858: Completed lines
- Line 923-927: Current line preview

**Solution**: Create src/utils/lineStyles.js with getStrokeDasharray()

## 3. SVG Circle Markers (4 locations)
**File**: GTBPlanApp.jsx
- Line 862-867: Start point circle (completed)
- Line 869-874: End point circle (completed)
- Line 932-937: Start point circle (preview)
- Line 940-945: End point circle (preview)

**Solution**: Create src/components/SVGLinePoint.jsx component

## 4. Message Notifications (15+ locations)
**File**: GTBPlanApp.jsx
- Line 109, 126, 170, 206, 215, 220, 239, 252-256, 260-263, 273, 281, 283, 314, 338, 345

**Solution**: Create src/utils/notifications.js with MESSAGES constant and notify functions

## 5. Hardcoded Values (11+ locations)
**File**: GTBPlanApp.jsx
- Module size default: 120
- Line color default: #1890ff
- Line thickness default: 3
- Slider ranges and steps
- Arrow offsets: 8, 4
- Delete button properties
- Color gradients

**Solution**: Create src/constants/config.js

## 6. Flexbox Styling (5+ locations)
**File**: GTBPlanApp.jsx

**Solution**: Create src/utils/styles.js

## 7. Button Styling (6 locations)
**File**: GTBPlanApp.jsx
- Lines 380-391, 401-407, 419-423, 436-440, 452-458, 467-475

**Solution**: Create src/utils/buttonStyles.js
