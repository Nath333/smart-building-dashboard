# Archived Pages - Unused Components

**Archive Date**: 2025-10-15

## Purpose
This directory contains pages and components that were removed from the main application workflow but preserved for potential future use.

## Archived Pages

### 1. SurfacePlanPage.jsx
- **Original Location**: `src/pages/SurfacePlanPage.jsx`
- **Description**: Interactive site surface editor with polygon drawing
- **Features**:
  - Upload and crop images per card
  - Draw polygons on each card
  - Save to SQL and ImgBB
  - Delete individual or all cards
  - Restore previously saved polygons
- **Reason for Archive**: Not part of the main 5-page workflow

### 2. GtbPlanPage.jsx
- **Original Location**: `src/pages/GtbPlanPage.jsx`
- **Description**: Interactive GTB plan editor with draggable modules
- **Features**:
  - Upload and crop background image
  - Drag GTB modules on plan
  - Save module positions to SQL
  - Restore previous layouts
- **Reason for Archive**: Not part of the main 5-page workflow

## Archived Folders

### surfacePlan/
**Contents**:
- `CardEditor.jsx` - Individual card editor component
- `PolygonDrawingControls.jsx` - Polygon drawing tools
- `drawPolygonsOnImage.js` - Canvas polygon rendering utility
- `surfaceCardUpload.js` - Upload functionality
- `deleteSurfaceCard.js` - Deletion utilities
- `getDeleteUrlFromSQL.js` - SQL delete URL retrieval

### gtbPlan/
**Contents**:
- `GtbPlanDragArea.jsx` - Drag area component
- `ConnectionLines.jsx` - Module connection visualization
- `Icon/` directory with GTB module icons:
  - Icon_aeroeau.jsx
  - Icon_aerogaz.jsx
  - Icon_clim_filaire_groupe.jsx
  - Icon_clim_filaire_simple.jsx
  - Icon_clim_ir_gtb.jsx
  - Icon_comptage_eclairage.jsx
  - Icon_comptage_froid.jsx
  - Icon_eclairage_gtb.jsx
  - Icon_gazCompteur.jsx
  - Icon_izit.jsx
  - Icon_rooftop_gtb.jsx
  - Icon_sondes.jsx
  - Icon_sondesPresentes.jsx
  - GtbPlanLegend.jsx

### vtPlan/
**Contents**:
- `VisualPlanDragArea.jsx` - Visual plan drag area
- `imageUtils.js` - Image processing utilities
- `visualPlanUpload.js` - Upload utilities
- `Icon/` directory:
  - VisualPlanLegend.jsx

## Current Active Pages (5 Total)

1. **Page 1** - SiteInfoPage.jsx (Site Info)
2. **Page 2** - EquipmentPage.jsx (Equipment)
3. **Page 3** - VisualPlanPage.jsx (Visual Plan)
4. **Page 4** - DevisPage.jsx (Quotes/Estimates)
5. **Page 5** - GtbConfigPage.jsx (GTB Configuration)

## Restoration Instructions

If you need to restore any of these pages:

1. Move the page file back to `src/pages/`
2. Move the corresponding folder (if any) back to `src/pages/`
3. Update `src/App.jsx` to include the route
4. Test thoroughly to ensure dependencies are intact

## Dependencies

These archived pages may have dependencies on:
- ImgBB API (image uploads)
- MySQL database (metadata storage)
- Ant Design components
- React DnD (drag and drop)
- Konva/React-Konva (canvas rendering)
- html2canvas (image generation)

## Database Tables Used

- `form_sql` - Site and equipment data
- `image_sql` - Image metadata and coordinates

## Testing After Restoration

If restoring, run:
```bash
npm run test:quick    # Quick validation
npm run test:core     # Core functionality
npm run dev           # Manual testing
```

---

**Note**: All archived components were fully functional at the time of archiving. They were removed to simplify the main workflow to 5 core pages.
