# Devis Implementation Status - 2025-10-15

## ✅ COMPLETED

### 1. Database Schema
- ✅ Rolled back incorrect columns from `image_sql`
- ✅ Added `devis_name` column to `gtb_modules` table
- ✅ Added `devis_name` column to `image_sql` (for linking plans)
- ✅ Created index on `gtb_modules(site_name, devis_name)`

### 2. Backend API
- ✅ Created `/devis` routes (`src/routes/devisRoutes.js`):
  - `GET /devis/list/:siteName` - Get all devis for a site
  - `POST /devis/save` - Save equipment for a zone
  - `GET /devis/installations/:siteName/:devisName` - Get installation data
  - `GET /devis/summary/:siteName/:devisName` - Get aggregated summary
  - `DELETE /devis/delete/:siteName/:devisName` - Delete a devis
  - `POST /devis/create` - Create new empty devis
- ✅ Registered devis routes in `server.js`

### 3. Page 5 (GTB Config) - Frontend
- ✅ Added devis list loading (`GET /devis/list/:siteName`)
- ✅ Added devis installations loading (`GET /devis/installations/:siteName/:devisName`)
- ✅ Updated devis selector UI to use string array
- ✅ Fixed equipment summary table to use `devisInstallations` from API
- ✅ Updated GTB data loading to pass `devis_name` parameter

---

## 🔄 IN PROGRESS / TODO

### 1. GTB Data Access Layer (DAL)
**Status**: Needs Update

The GTB DAL (`database/dal/gtbConfigDAL.js`) currently does NOT filter by `devis_name`. Need to update:

```javascript
// Current: Only filters by site_name
const getGtbConfig = async (siteName) => {
  const [rows] = await db.execute(`
    SELECT * FROM gtb_modules WHERE site_name = ?
  `, [siteName]);
  //...
};

// Needed: Filter by site_name AND devis_name
const getGtbConfig = async (siteName, devisName = 'Devis Principal') => {
  const [rows] = await db.execute(`
    SELECT * FROM gtb_modules
    WHERE site_name = ? AND devis_name = ?
  `, [siteName, devisName]);
  //...
};
```

**Files to Update**:
- `database/dal/gtbConfigDAL.js`
  - `getGtbConfig(siteName, devisName)`
  - `saveGtbConfig(siteName, devisName, gtbData)`
  - All other methods to include `devis_name`

- `src/routes/completeParallelEndpoints.js`
  - Update `/get-page3` to pass `devis_name` to DAL
  - Update `/save_page3` to pass `devis_name` to DAL

### 2. Page 6 (GTB Plan) - Display Devis Data
**Status**: Not Started

**What's Needed**:
1. Display current devis name
2. Load and show installation quantities from `devis` table
3. Link saved plan to devis (save `devis_name` in `image_sql`)

**Implementation**:
```jsx
// Add to PlanPageBase.jsx or GtbPlanPage.jsx
const [currentDevis, setCurrentDevis] = useState('');
const [installations, setInstallations] = useState([]);

useEffect(() => {
  // Load devis_name from saved GTB plan image
  loadPlanDevisLink(siteName, 'GTB').then(imageData => {
    if (imageData.devis_name) {
      setCurrentDevis(imageData.devis_name);
      // Load installations for this devis
      loadInstallations(siteName, imageData.devis_name).then(setInstallations);
    }
  });
}, [siteName]);

// UI: Show devis info
<Card>
  <Title level={5}>Devis: {currentDevis}</Title>
  <Space wrap>
    {installations.map(item => (
      <Tag key={item.equipment_type} color="blue">
        {item.equipment_type}: {item.to_install_count} unités
      </Tag>
    ))}
  </Space>
</Card>
```

### 3. Page 4 (Surface Plan) - Devis Integration
**Status**: Not Started

**What's Needed**:
1. Add devis selector UI
2. When saving polygon/zone, also save equipment to `devis` table
3. UI for assigning equipment per zone

**Implementation**:
```jsx
// Add to SurfacePlanPage.jsx
const [currentDevis, setCurrentDevis] = useState('Devis Principal');
const [devisList, setDevisList] = useState([]);

// Load devis list
useEffect(() => {
  axios.get(`${API_BASE_URL}/devis/list/${siteName}`)
    .then(res => setDevisList(res.data));
}, [siteName]);

// When saving zone:
const saveZone = async (zoneData) => {
  // Save polygon to image_sql (existing)
  await savePolygon(zoneData);

  // NEW: Save equipment to devis table
  await axios.post(`${API_BASE_URL}/devis/save`, {
    site_name: siteName,
    devis_name: currentDevis,
    zone_name: zoneData.name,
    equipment_type: zoneData.equipmentType,  // From form
    existing_count: zoneData.existing,        // From form
    to_install_count: zoneData.toInstall      // From form
  });
};
```

---

## 🧪 TESTING CHECKLIST

### Database
- [x] Verify `gtb_modules.devis_name` column exists
- [x] Verify `image_sql.devis_name` column exists
- [ ] Test UPSERT queries work correctly

### Backend API
- [ ] Test `GET /devis/list/:siteName`
- [ ] Test `GET /devis/installations/:siteName/:devisName`
- [ ] Test `POST /devis/save`
- [ ] Test `GET /devis/summary/:siteName/:devisName`

### Page 5 (GTB Config)
- [ ] Test devis list loads correctly
- [ ] Test devis selector switches between devis
- [ ] Test equipment summary table shows correct data
- [ ] Test GTB form saves with correct `devis_name`
- [ ] Test GTB form loads data for selected devis

### Page 6 (GTB Plan)
- [ ] Test devis name displays correctly
- [ ] Test installation quantities load and display
- [ ] Test plan saves with `devis_name` link

### Page 4 (Surface Plan)
- [ ] Test devis selector appears
- [ ] Test zone equipment saves to devis table
- [ ] Test multiple devis isolation

---

## 📋 PRIORITY ORDER

1. **HIGH**: Update GTB DAL to filter by `devis_name`
2. **HIGH**: Test Page 5 save/load with devis
3. **MEDIUM**: Implement Page 6 devis display
4. **LOW**: Implement Page 4 devis integration (can be done later)

---

## 🚀 QUICK START FOR TESTING

1. **Start servers**:
   ```bash
   npm run server  # Backend on port 4001
   npm run dev     # Frontend on port 5177
   ```

2. **Test sequence**:
   - Create a site in Page 1
   - Add equipment in Page 2
   - Go to Page 5 (GTB Config)
   - Select "Devis Principal"
   - Configure modules
   - Save
   - Verify data saved to `gtb_modules` with `devis_name`

3. **Check SQL**:
   ```sql
   SELECT site_name, devis_name, module_type, quantity
   FROM gtb_modules
   WHERE site_name = 'YOUR_SITE';
   ```

---

**Current Status**: 70% Complete
**Next Step**: Update GTB DAL to filter by devis_name
**Blockers**: None
