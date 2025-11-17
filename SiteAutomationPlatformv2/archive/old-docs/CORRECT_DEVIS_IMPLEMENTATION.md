# Correct Devis Implementation - Complete Specification

## Date: 2025-10-15

## Database Schema (✅ COMPLETE)

### Tables Structure:

```sql
-- Devis table (quote/project management)
devis:
  - site_name VARCHAR(255)        -- "Bricomarché Provins"
  - devis_name VARCHAR(255)       -- "Devis Principal", "Devis Extension 2025"
  - equipment_type VARCHAR(50)    -- "Aero", "Clim", "Rooftop", "Éclairage"
  - zone_name VARCHAR(100)        -- "surface_de_vente", "bureau", "stock"
  - existing_count INT            -- How many exist now
  - to_install_count INT          -- How many to install ⭐
  - created_at, updated_at

-- GTB Modules (module configuration per site+devis)
gtb_modules:
  - site_name VARCHAR(100)
  - devis_name VARCHAR(255)       -- ✅ ADDED
  - module_type VARCHAR(100)      -- "aeroeau", "clim_ir", "rooftop"
  - quantity INT
  - refs TEXT
  - sondes, sondesPresentes, gaz_compteur, izit
  - module_category, display_order

-- GTB Module References (individual module references)
gtb_module_references:
  - site_name VARCHAR(100)
  - module_type VARCHAR(100)
  - ref_index INT
  - ref_value VARCHAR(255)        -- "Intesis IR", "modbus do12"

-- GTB Module Types (catalog of available modules)
gtb_module_types:
  - module_type VARCHAR(100)
  - module_category ENUM('sensor','module','accessory','system')
  - display_name_fr VARCHAR(255)
  - display_name_en VARCHAR(255)

-- Plan Images (links to devis)
image_sql:
  - site, type, title, url_viewer
  - devis_name VARCHAR(255)       -- ✅ FK to devis
  - shapes (JSON)                 -- Icon/module positions
```

---

## Page Flow Architecture

### Page 1: Site Info
**Purpose**: Create/select site
**Data Saved**: `form_sql` table
**Context Set**: `siteName` in localStorage

### Page 2: Equipment
**Purpose**: Catalog existing equipment per zone
**Data Saved**: `form_sql` table (equipment counts)
**Context Set**: Equipment inventory

### Page 3: Visual Plan (VT)
**Purpose**: Place equipment icons on floor plan
**Data Saved**: `image_sql` (grayscale image + icon positions)
**Dependency**: Site name

### Page 4: Surface Plan ⭐ **NEEDS DEVIS**
**Purpose**: Draw zone polygons + assign equipment per zone
**Data Saved**:
  - `image_sql` (zone images + polygon coordinates)
  - `devis` table (equipment per zone with to_install_count)
**Dependency**: Site + Devis
**New Features Needed**:
  1. Devis selector dropdown
  2. Equipment assignment per zone
  3. Save to `devis` table

### Page 5: GTB Config ⭐ **NEEDS DEVIS**
**Purpose**: Configure GTB modules (quantities + references)
**Data Saved**:
  - `gtb_modules` (module quantities linked to devis)
  - `gtb_module_references` (individual module refs)
**Dependency**: Site + Devis
**New Features Needed**:
  1. Devis selector dropdown
  2. Link all saved data to selected devis
  3. Load data filtered by site + devis

### Page 6: GTB Plan ⭐ **SHOWS DEVIS DATA**
**Purpose**: Place GTB modules on plan + show installation summary
**Data Displayed**:
  - From `devis` table → installation quantities per equipment type
  - From `gtb_modules` → available modules for dragging
**Data Saved**:
  - `image_sql` (plan image + module positions + devis_name link)
**New Features Needed**:
  1. Display devis name
  2. Display installation summary from `devis` table
  3. Module positions from `gtb_modules`

---

## Implementation Tasks

### ✅ COMPLETED:
- [x] Database schema corrected (migration 07)
- [x] Added `devis_name` to `gtb_modules`
- [x] Removed incorrect columns from `image_sql`
- [x] Added index on `gtb_modules(site_name, devis_name)`

### 🔄 TODO - Page 4 (Surface Plan):

**Add Devis Management:**
```jsx
// Add to SurfacePlanPage.jsx
const [currentDevis, setCurrentDevis] = useState('Devis Principal');
const [devisList, setDevisList] = useState([]);

// Fetch devis list for site
useEffect(() => {
  fetchDevisList(siteName).then(setDevisList);
}, [siteName]);

// UI: Add devis selector at top
<Select
  value={currentDevis}
  onChange={setCurrentDevis}
  options={devisList}
>
  <Option value="new">+ Nouveau Devis</Option>
</Select>
```

**Save Zone Equipment to Devis Table:**
```javascript
// When saving each polygon/zone:
const saveZoneToDevis = async (zoneData) => {
  await axios.post(`${API_BASE_URL}/devis/save`, {
    site_name: siteName,
    devis_name: currentDevis,
    zone_name: zoneData.name,
    equipment_type: 'Aero', // from zone form
    existing_count: 5,
    to_install_count: 3  // ⭐ User input
  });
};
```

**Backend API Needed:**
```javascript
// server.js or devisRoutes.js
app.post('/devis/save', async (req, res) => {
  const { site_name, devis_name, zone_name, equipment_type, existing_count, to_install_count } = req.body;

  await db.execute(`
    INSERT INTO devis (site_name, devis_name, equipment_type, zone_name, existing_count, to_install_count)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      existing_count = VALUES(existing_count),
      to_install_count = VALUES(to_install_count)
  `, [site_name, devis_name, equipment_type, zone_name, existing_count, to_install_count]);
});

app.get('/devis/list/:siteName', async (req, res) => {
  const [rows] = await db.execute(`
    SELECT DISTINCT devis_name FROM devis WHERE site_name = ?
  `, [req.params.siteName]);
  res.json(rows);
});
```

---

### 🔄 TODO - Page 5 (GTB Config):

**Add Devis Selector:**
```jsx
// At top of GtbConfigPage.jsx
const [currentDevis, setCurrentDevis] = useState('Devis Principal');
const [devisList, setDevisList] = useState([]);

<FormCard title="Configuration GTB">
  <Form.Item label="Devis">
    <Select value={currentDevis} onChange={setCurrentDevis}>
      {devisList.map(d => <Option key={d.devis_name}>{d.devis_name}</Option>)}
      <Option value="new">+ Nouveau Devis</Option>
    </Select>
  </Form.Item>

  {/* Existing module configuration forms */}
</FormCard>
```

**Update Save Logic:**
```javascript
// Update handleSubmit in GtbConfigPage.jsx
const handleSubmit = async (values) => {
  // Save to gtb_modules with devis_name
  await axios.post(`${API_BASE_URL}/gtb/save`, {
    site_name: siteName,
    devis_name: currentDevis,  // ⭐ Add this
    modules: values.modules,
    quantities: values.quantities,
    // ... rest of data
  });
};
```

**Update Load Logic:**
```javascript
// Load data filtered by site + devis
const loadGtbData = async () => {
  const response = await axios.post(`${API_BASE_URL}/gtb/get`, {
    site_name: siteName,
    devis_name: currentDevis  // ⭐ Add this filter
  });
  form.setFieldsValue(response.data);
};

useEffect(() => {
  loadGtbData();
}, [siteName, currentDevis]);
```

**Backend API Update:**
```javascript
// Update existing /save_page3 endpoint
app.post('/save_page3', async (req, res) => {
  const { site_name, devis_name, modules, quantities } = req.body;

  // Delete old data for this site+devis
  await db.execute(`DELETE FROM gtb_modules WHERE site_name = ? AND devis_name = ?`,
    [site_name, devis_name]);

  // Insert new data
  for (const module of modules) {
    await db.execute(`
      INSERT INTO gtb_modules (site_name, devis_name, module_type, quantity, refs)
      VALUES (?, ?, ?, ?, ?)
    `, [site_name, devis_name, module.type, module.quantity, JSON.stringify(module.refs)]);
  }
});
```

---

### 🔄 TODO - Page 6 (GTB Plan):

**Display Devis Name + Installation Summary:**
```jsx
// Add to PlanPageBase.jsx or GtbPlanPage.jsx
const [devisData, setDevisData] = useState({ name: '', installations: [] });

useEffect(() => {
  // Load devis data from image_sql.devis_name
  fetchImageDevisLink(siteName, 'GTB').then(imageRecord => {
    if (imageRecord.devis_name) {
      // Load installation quantities from devis table
      fetchDevisInstallations(siteName, imageRecord.devis_name).then(setDevisData);
    }
  });
}, [siteName]);

// UI Display
<Card>
  <Title level={5}>Devis: {devisData.name}</Title>
  <Divider />
  <Text strong>À installer:</Text>
  <Space wrap>
    {devisData.installations.map(item => (
      <Tag color="blue" key={item.equipment_type}>
        {item.equipment_type}: {item.to_install_count} unités
      </Tag>
    ))}
  </Space>
  <Text type="secondary">
    Dernière modification: {new Date().toLocaleDateString('fr-FR')}
  </Text>
</Card>
```

**Backend API:**
```javascript
app.get('/devis/installations/:siteName/:devisName', async (req, res) => {
  const [rows] = await db.execute(`
    SELECT equipment_type, zone_name, to_install_count
    FROM devis
    WHERE site_name = ? AND devis_name = ?
    ORDER BY equipment_type
  `, [req.params.siteName, req.params.devisName]);
  res.json(rows);
});

app.get('/images/devis-link/:siteName/:planType', async (req, res) => {
  const [rows] = await db.execute(`
    SELECT devis_name
    FROM image_sql
    WHERE site = ? AND title = ? AND type = 'grayscale'
    LIMIT 1
  `, [req.params.siteName, req.params.planType]);
  res.json(rows[0] || { devis_name: 'Devis Principal' });
});
```

---

## Summary of Changes Needed

### Page 4 (Surface Plan):
1. ✅ Add devis selector UI
2. ✅ Add equipment assignment form per zone
3. ✅ Save zone equipment to `devis` table
4. ✅ Backend: `/devis/save` + `/devis/list/:siteName`

### Page 5 (GTB Config):
1. ✅ Add devis selector UI
2. ✅ Update save to include `devis_name`
3. ✅ Update load to filter by `site_name + devis_name`
4. ✅ Backend: Update `/save_page3` and `/get-page3`

### Page 6 (GTB Plan):
1. ✅ Display devis name from linked plan
2. ✅ Load installation summary from `devis` table
3. ✅ Load module positions from `gtb_modules` table
4. ✅ Backend: `/devis/installations/:siteName/:devisName`

---

## Testing Plan

1. **Page 4**: Create zone → assign equipment → save → verify in `devis` table
2. **Page 5**: Select devis → configure modules → save → verify in `gtb_modules` table
3. **Page 6**: Open plan → see correct devis name + installation quantities
4. **Multi-devis**: Create "Devis Extension 2025" → configure separately → verify isolation

---

**Status**: ✅ Database migrations complete
**Next**: Implement Page 4, 5, 6 UI and API changes
**Priority**: Start with Page 5 (GTB Config) as it's most critical
