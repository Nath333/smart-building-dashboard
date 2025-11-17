# État de Vétusté & Localisation Feature - Implementation Guide

**Date:** October 16, 2025
**Feature:** Add equipment condition state (État de vétusté) and location tracking to Page 2

---

## 🎯 Feature Overview

This feature adds three new fields to **every equipment card** in Page 2:

1. **État de vétusté** - Visual color-coded condition selector (green/yellow/red)
2. **Localisation** - General equipment location (text input)
3. **Localisation du comptage** - Metering location (text input)

### Visual Design

The **État de vétusté** selector displays three radio options:
- 🟢 **Green** - "Bon état" (Good condition)
- 🟡 **Yellow** - "État moyen" (Average condition)
- 🔴 **Red** - "Mauvais état" (Poor condition)

Each option has:
- Color-coded circle icon
- Background highlighting when selected
- Clean, professional styling with Ant Design components

---

## 📋 Implementation Summary

### Files Created

1. **`src/pages/equipment/EtatVetusteSelector.jsx`**
   - Reusable component for condition state selection
   - Color-coded radio buttons with visual feedback
   - Supports all three states: green, yellow, red

2. **`database/migration/05_add_etat_vetuste_localisation.sql`**
   - SQL migration to add 3 new columns to 4 tables
   - ENUM type for etat_vetuste (green/yellow/red)
   - VARCHAR(255) for localisation fields

3. **`database/migration/run_05_migration_docker.bat`**
   - Automated migration script for Docker MySQL
   - Detects MySQL container automatically
   - Copies and executes migration

---

## 🗄️ Database Changes

### Tables Modified

All equipment tables now have these **3 additional columns**:

```sql
-- equipment_aerotherme
-- equipment_climate
-- equipment_rooftop
-- equipment_lighting

ALTER TABLE <table_name>
ADD COLUMN etat_vetuste ENUM('green', 'yellow', 'red') DEFAULT NULL,
ADD COLUMN localisation VARCHAR(255) DEFAULT NULL,
ADD COLUMN localisation_comptage VARCHAR(255) DEFAULT NULL;
```

### Field Naming Convention

Fields are **zone-suffixed** for proper DAL handling:

| Equipment Type | Etat Field | Localisation Field | Comptage Field |
|----------------|-----------|-------------------|----------------|
| Aerotherme | `etat_vetuste_aerotherme` | `localisation_aerotherme` | `localisation_comptage_aerotherme` |
| Climate | `etat_vetuste_clim` | `localisation_clim` | `localisation_comptage_clim` |
| Rooftop | `etat_vetuste_rooftop` | `localisation_rooftop` | `localisation_comptage_rooftop` |
| Lighting | `etat_vetuste_eclairage` | `localisation_eclairage` | `localisation_comptage_eclairage` |

---

## 🔧 Code Changes

### 1. Database Access Layer (DAL)

**File:** `database/dal/equipmentDAL.js`

**Changes for ALL equipment types:**
- Added new fields to `fieldMap` (GET operations)
- Added new fields to `baseFields` array (POST operations)
- Updated INSERT queries with 3 new columns
- Updated parameter bindings for zone-aware data

**Example (Aerotherme):**
```javascript
const fieldMap = {
  // ... existing fields
  etat_vetuste: 'etat_vetuste_aerotherme',
  localisation: 'localisation_aerotherme',
  localisation_comptage: 'localisation_comptage_aerotherme'
};

const baseFields = [
  // ... existing fields
  'etat_vetuste_aerotherme',
  'localisation_aerotherme',
  'localisation_comptage_aerotherme'
];
```

### 2. Frontend UI Configuration

**File:** `src/pages/equipment/categoryInputConfig.jsx`

**Changes for ALL categories (Aero, Rooftop, Clim, Eclairage):**

```jsx
// Import the new component
import EtatVetusteSelector from './EtatVetusteSelector';

// Added after brand/reference inputs, before fonctionement fields:
<EtatVetusteSelector
  value={categoryData['etat_vetuste_<type>']}
  onChange={(val) => handleCategoryDataChange('etat_vetuste_<type>', val)}
/>

{textInput('Localisation', 'localisation_<type>')}
{textInput('Localisation du comptage', 'localisation_comptage_<type>')}
```

---

## 🚀 Installation Steps

### Step 1: Run Database Migration

**Option A: Using Docker (Recommended)**

```bash
cd database/migration
run_05_migration_docker.bat
```

**Option B: Direct MySQL**

```bash
mysql -u root -pNaveed@2019 projet_gtb < 05_add_etat_vetuste_localisation.sql
```

### Step 2: Restart Backend Server

```bash
npm run server
```

The equipmentDAL changes will be active immediately.

### Step 3: Restart Frontend

```bash
npm run dev
```

Navigate to Page 2 to see the new fields.

---

## 🧪 Testing Checklist

### Visual Testing

- [ ] État de vétusté selector appears on all equipment cards
- [ ] Color-coded options (green/yellow/red) render correctly
- [ ] Selected state highlights with background color
- [ ] Localisation input field appears
- [ ] Localisation du comptage input field appears

### Functional Testing

1. **Data Entry**
   - [ ] Select green état → verify selection highlights
   - [ ] Enter text in "Localisation" field
   - [ ] Enter text in "Localisation du comptage" field

2. **Save & Reload**
   - [ ] Fill all three fields for Aero equipment
   - [ ] Click "Enregistrer" (Save)
   - [ ] Refresh page
   - [ ] Verify all three fields restored correctly

3. **Multi-Zone Testing**
   - [ ] Create equipment in multiple zones
   - [ ] Each zone should save its own état/localisation independently
   - [ ] Verify zone-suffixed data in database

4. **All Equipment Types**
   - [ ] Test Aerotherme (Aero)
   - [ ] Test Climate (Clim)
   - [ ] Test Rooftop
   - [ ] Test Lighting (Eclairage)

### Database Verification

```sql
-- Check if columns exist
DESCRIBE equipment_aerotherme;
DESCRIBE equipment_climate;
DESCRIBE equipment_rooftop;
DESCRIBE equipment_lighting;

-- Verify data saved correctly
SELECT site_name, zone_aerotherme, etat_vetuste, localisation, localisation_comptage
FROM equipment_aerotherme
WHERE site_name = 'YOUR_TEST_SITE';
```

---

## 📊 Data Flow

### Save Flow (Frontend → Database)

```
User selects green état
  ↓
categoryData['etat_vetuste_aerotherme'] = 'green'
  ↓
handleSubmit() → submitForm2()
  ↓
POST /save_page2 { ..., etat_vetuste_aerotherme_surface_de_vente: 'green' }
  ↓
equipmentDAL.saveAerothermeData()
  ↓
INSERT INTO equipment_aerotherme (..., etat_vetuste, localisation, localisation_comptage)
VALUES (..., 'green', 'Zone A', 'TGBT')
```

### Load Flow (Database → Frontend)

```
GET /get-page2 { site: 'TestSite' }
  ↓
equipmentDAL.getAerothermeData('TestSite')
  ↓
SELECT * FROM equipment_aerotherme WHERE site_name = 'TestSite'
  ↓
flattenZoneRows() → { etat_vetuste_surface_de_vente: 'green', ... }
  ↓
groupDataByZones() → creates zone-specific cards
  ↓
EditableCard renders with pre-filled etat_vetuste selector
```

---

## 🎨 UI Screenshots (Expected Behavior)

### État de Vétusté Selector

**Unselected State:**
```
○ 🟢 Bon état
○ 🟡 État moyen
○ 🔴 Mauvais état
```

**Green Selected:**
```
● 🟢 Bon état          ← Highlighted with light green background
○ 🟡 État moyen
○ 🔴 Mauvais état
```

---

## 🐛 Troubleshooting

### Issue: Migration fails with "column already exists"

**Solution:** Columns already added. This is safe to ignore, or drop them manually first:
```sql
ALTER TABLE equipment_aerotherme
  DROP COLUMN etat_vetuste,
  DROP COLUMN localisation,
  DROP COLUMN localisation_comptage;
-- Repeat for other tables, then re-run migration
```

### Issue: Fields don't appear in UI

**Checklist:**
1. ✅ Migration ran successfully?
2. ✅ Backend server restarted?
3. ✅ Frontend dev server restarted?
4. ✅ Browser cache cleared (Ctrl+Shift+R)?

### Issue: Data not saving

**Debug Steps:**
1. Open browser DevTools → Network tab
2. Submit form and check POST `/save_page2` payload
3. Verify field names match expected format (e.g., `etat_vetuste_aerotherme_surface_de_vente`)
4. Check backend logs for SQL errors
5. Verify equipmentDAL.js changes applied correctly

---

## 📚 Related Files

### Frontend
- `src/pages/equipment/EtatVetusteSelector.jsx` - Component
- `src/pages/equipment/categoryInputConfig.jsx` - Form configuration
- `src/pages/equipment/EditableCard.jsx` - Card rendering (no changes needed)
- `src/pages/EquipmentPage.jsx` - Page logic (no changes needed)

### Backend
- `database/dal/equipmentDAL.js` - Data access layer
- `database/migration/05_add_etat_vetuste_localisation.sql` - Migration SQL
- `src/routes/mainRoutes.js` - API endpoints (no changes needed)

### Database
- `equipment_aerotherme` table
- `equipment_climate` table
- `equipment_rooftop` table
- `equipment_lighting` table

---

## ✅ Completion Checklist

- [x] Database migration script created
- [x] Docker migration runner created
- [x] equipmentDAL.js updated for all 4 equipment types
- [x] EtatVetusteSelector component created
- [x] categoryInputConfig.jsx updated for all 4 categories
- [x] Field naming follows zone-suffix convention
- [ ] **Migration executed** (You need to run this!)
- [ ] **Testing completed**
- [ ] Feature deployed to production

---

## 🎉 Success Criteria

The feature is complete when:

1. ✅ All 4 equipment types display the 3 new fields
2. ✅ État de vétusté selector has proper color coding
3. ✅ Data saves to database correctly
4. ✅ Data loads from database and populates fields
5. ✅ Zone-aware functionality works (multiple zones per site)
6. ✅ No console errors or warnings

---

## 📝 Next Steps (Optional Enhancements)

Future improvements you could consider:

1. **Analytics Dashboard**
   - Count equipment by état de vétusté (how many green/yellow/red?)
   - Show aging equipment alerts

2. **Bulk Update**
   - Set état for all equipment in a zone at once

3. **Export to PDF**
   - Include état de vétusté in PDF reports with color coding

4. **Filtering**
   - Filter equipment list by condition state
   - "Show only red état equipment"

5. **Notifications**
   - Alert when equipment marked as "red" (poor condition)

---

**Need Help?** Check the main CLAUDE.md documentation or review the test results in `/test/api/` directory.
