# GTB Plan Devis and Installation Quantities - Implementation Summary

## Date: 2025-10-15

## Overview
Added the ability to rename a devis (quote/project) and track installation quantities for equipment on **Page 6 (GTB Plan)**.

## What Was Changed

### 1. Database Schema (✅ Ready to Apply)
**File**: `database/migration/06_add_devis_installation_fields.sql`

Added to `image_sql` table:
- `devis_name` VARCHAR(255) - Quote/Project name
- `install_qty_aero` INT - Aerotherme units to install
- `install_qty_clim_ir` INT - Clim IR units to install
- `install_qty_clim_wire` INT - Clim filaire units to install
- `install_qty_rooftop` INT - Rooftop units to install
- `install_qty_eclairage` INT - Eclairage units to install
- `last_modified` DATETIME - Last modification timestamp

**To Apply Migration**:
```bash
# Option 1: Using MySQL CLI
mysql -u root -p bms < "database/migration/06_add_devis_installation_fields.sql"

# Option 2: Copy/paste SQL directly in MySQL Workbench or HeidiSQL
```

### 2. Frontend Changes (✅ Complete)

#### **PlanPageBase.jsx** (Used by GTB Plan Page)
- Added state management for devis name and installation quantities
- Added UI card with:
  - Editable devis name field with inline editing
  - Installation quantities display with tags
  - Last modified timestamp
  - "Modifier les quantités" button with prompt dialog
- Updated `loadSavedData()` to load devis data from SQL
- Updated `handleSubmit()` to save devis data to SQL

#### **commonUploadUtils.js**
- Updated `saveImageMetadataToSQL()` function signature to accept new fields:
  - `devis_name`
  - `install_qty_aero`, `install_qty_clim_ir`, `install_qty_clim_wire`
  - `install_qty_rooftop`, `install_qty_eclairage`

### 3. Backend Changes (✅ Complete)

#### **imageRoutes.js** (`POST /images/upload-sql`)
- Updated to accept new fields from request body
- Updated SQL INSERT statement to include 6 new columns
- Proper null handling with `?? null` and `?? 0` operators

## How It Works

### User Workflow on Page 6 (GTB Plan):

1. **View/Edit Devis Name**:
   - Click "Modifier" next to "Nom du devis"
   - Enter the project/quote name
   - Click "OK" to save (saved when plan is saved)

2. **Set Installation Quantities**:
   - Click "Modifier les quantités"
   - Enter quantities for each equipment type via prompts
   - Quantities displayed as colored tags

3. **Save the Plan**:
   - Click "Sauvegarder le plan GTB"
   - Devis name and quantities are saved to SQL with the plan image

4. **Auto-Load on Revisit**:
   - When returning to the page, devis name and quantities are restored from SQL
   - Last modified date is automatically tracked

### Display Example:
```
┌─────────────────────────────────────────────────────────────┐
│ Nom du devis: Projet ABC Industries     [Modifier]          │
│ Dernière modification: 15/10/2025                           │
├─────────────────────────────────────────────────────────────┤
│ À installer:                                                 │
│ [Aero: 3 unités] [Clim IR: 5 unités] [Rooftop: 2 unités]  │
│ [Modifier les quantités]                                    │
└─────────────────────────────────────────────────────────────┘
```

## Files Modified

### Database
- ✅ `database/migration/06_add_devis_installation_fields.sql` (NEW)

### Frontend
- ✅ `src/components/common/PlanPageBase.jsx` (MODIFIED)
- ✅ `src/utils/commonUploadUtils.js` (MODIFIED)

### Backend
- ✅ `src/routes/imageRoutes.js` (MODIFIED)

## Testing Steps

1. **Apply Database Migration**:
   ```bash
   mysql -u root -p bms < "database/migration/06_add_devis_installation_fields.sql"
   ```

2. **Restart Backend Server**:
   ```bash
   npm run server
   ```

3. **Test on Page 6 (GTB Plan)**:
   - Navigate to Page 6
   - Click "Modifier" next to "Nom du devis"
   - Enter a test name like "Projet Test GTB"
   - Click "Modifier les quantités"
   - Enter test quantities (e.g., 3 Aero, 5 Clim IR)
   - Save the GTB plan
   - Refresh the page
   - Verify devis name and quantities are restored

4. **Verify SQL Data**:
   ```sql
   SELECT site, title, devis_name, install_qty_aero, install_qty_clim_ir,
          install_qty_clim_wire, install_qty_rooftop, install_qty_eclairage,
          last_modified
   FROM image_sql
   WHERE title = 'GTB' AND type = 'grayscale';
   ```

## Notes

- ✅ Works for both VT Plan (Page 3) and GTB Plan (Page 6) since they share PlanPageBase component
- ✅ Data is persisted per site in the `image_sql` table
- ✅ Backward compatible - existing plans without devis data will show "Non défini"
- ✅ Quantities default to 0 if not set
- ⚠️ Current UI uses browser `prompt()` dialogs - can be enhanced with modal forms later

## Future Enhancements (Optional)

1. Replace prompt dialogs with a proper modal form
2. Add validation for quantity inputs (min: 0, max: 999)
3. Add ability to add custom equipment types
4. Export devis summary as PDF
5. Copy devis data between sites

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs for SQL errors
3. Verify database migration was applied successfully
4. Ensure backend is running on port 4001

---

**Status**: ✅ Implementation Complete - Ready for Testing
**Migration Required**: Yes - Run SQL migration before testing
