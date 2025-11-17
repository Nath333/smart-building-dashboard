# Page 2 Equipment Image System - Complete Guide

## 📋 Overview

Page 2 (Equipment Page) supports **zone-aware image uploads and retrieval**. Each equipment card can have multiple images associated with a specific zone (e.g., `surface_de_vente`, `bureau`, `reserve`).

---

## 🏗️ Architecture

### Database Schema (`image_sql` table)

```sql
CREATE TABLE image_sql (
  id INT PRIMARY KEY AUTO_INCREMENT,
  image_id VARCHAR(255),
  site VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,              -- Equipment type: Aero, Clim, Rooftop, Eclairage
  zone_name VARCHAR(255),                   -- 🔑 Zone identifier (e.g., surface_de_vente, bureau)
  title VARCHAR(255),
  url_viewer TEXT,
  delete_url TEXT,
  shapes JSON,
  datetime TIMESTAMP,
  -- ... other fields
);
```

**Key Points:**
- `type` = Equipment category (Aero, Clim, Rooftop, Eclairage)
- `zone_name` = Zone identifier (can be NULL for legacy/general images)
- Images are filtered by: `site` + `type` + `zone_name`

---

## 📂 Data Flow

### 1️⃣ **Upload Flow** (EditableCard.jsx)

```javascript
// User uploads an image in Page 2
handleUpload = async ({ file, onSuccess, onError }) => {
  // 1. Extract zone from cardKey
  const { type: category, zone: zoneName } = parseCardKey(cardKey);

  // 2. Build title with zone
  const titleString = zoneName
    ? `${siteName}_${category}_${zoneName}_Vt`
    : `${siteName}_${category}_Vt`;

  // 3. Upload to ImgBB
  const { url, delete_url } = await uploadImageToImgBB(file, siteName, category, titleString);

  // 4. Save to SQL with zone_name
  await saveImageToSQL({
    url,
    delete_url,
    site: siteName,
    type: category,
    zone_name: zoneName || null,  // 🔑 Zone saved here
    title: titleString
  });

  // 5. Update local state
  onChange((prev) => ({
    ...prev,
    images: [...prev.images, { url, delete_url, title: titleString }]
  }));
};
```

**Backend API:** `POST /images/upload-sql`

```javascript
// imageRoutes.js
router.post('/upload-sql', async (req, res) => {
  const { site, type, zone_name, title, url_viewer, delete_url } = req.body;

  await db.execute(
    `INSERT INTO image_sql (site, type, zone_name, title, url_viewer, delete_url, datetime)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [site, type, zone_name || null, title, url_viewer, delete_url, new Date()]
  );
});
```

---

### 2️⃣ **Fetch Flow** (EquipmentPage.jsx)

```javascript
// On page load or site change
useEffect(() => {
  // Fetch ALL images for this site
  const images = await fetchSqlImages2(siteName);

  // Group equipment data by zones
  const grouped = groupDataByZones(formData, ['Aero', 'Clim', 'Rooftop', 'Eclairage']);

  // Filter images for each card based on type + zone
  Object.keys(grouped).forEach(cardKey => {
    const { type, zone } = parseCardKey(cardKey);

    const imagesForCard = images.filter(img => {
      const typeMatches = img.type?.toLowerCase() === type.toLowerCase();
      const zoneMatches = zone
        ? img.zone_name === zone      // Exact zone match
        : !img.zone_name;              // NULL zone for legacy cards

      return typeMatches && zoneMatches;
    });

    grouped[cardKey].images = imagesForCard;
  });
}, [siteName]);
```

**Backend API:** `POST /images/get-sql-images`

```javascript
// imageRoutes.js
router.post('/get-sql-images', async (req, res) => {
  const { site, zone_name } = req.body;
  const types = ['clim', 'aero', 'rooftop', 'eclairage'];

  let query, params;

  if (zone_name) {
    // Filter by site + zone
    query = `SELECT * FROM image_sql
             WHERE site = ? AND zone_name = ? AND type IN (?, ?, ?, ?)`;
    params = [site, zone_name, ...types];
  } else {
    // Filter by site only (backward compatible)
    query = `SELECT * FROM image_sql
             WHERE site = ? AND type IN (?, ?, ?, ?)`;
    params = [site, ...types];
  }

  const [results] = await db.execute(query, params);
  res.json(results);
});
```

---

### 3️⃣ **Delete Flow** (EditableCard.jsx)

```javascript
handleRemoveImage = async (index) => {
  const imageToDelete = images[index];

  // 1. Delete from ImgBB
  await deleteImageFromImgBB(imageToDelete.delete_url);

  // 2. Delete from SQL (by delete_url)
  await deleteImageFromSQL(imageToDelete.delete_url);

  // 3. Update local state
  const updatedImages = images.filter((_, i) => i !== index);
  onChange((prev) => ({ ...prev, images: updatedImages }));
};
```

**Backend APIs:**
- `POST /images/delete-imgbb` - Deletes from ImgBB cloud storage
- `POST /images/delete-sql` - Deletes SQL metadata by `delete_url`

---

## 🔍 Zone-Based Card System

### Card Key Format

```javascript
// Card keys encode type and zone: "Type::Zone"
"Aero::surface_de_vente"
"Clim::bureau"
"Rooftop::reserve"
"Eclairage"  // No zone (legacy)
```

### Parsing Card Keys

```javascript
// zoneUtils.js
export function parseCardKey(key) {
  const parts = key.split('::');
  return {
    type: parts[0],           // e.g., "Aero"
    zone: parts[1] || null    // e.g., "surface_de_vente" or null
  };
}

export function createCardKey(type, zone) {
  return zone ? `${type}::${zone}` : type;
}
```

### Zone-Aware Grouping

```javascript
// zoneUtils.js
export function groupDataByZones(formData, categories) {
  const grouped = {};

  categories.forEach(category => {
    // Extract zone-suffixed fields (e.g., nb_aerotherme_surface_de_vente)
    const zoneFields = extractZoneFields(formData, category);

    if (zoneFields.length === 0) {
      // No zones found - create general card
      grouped[category] = { data: {}, status: {}, images: [] };
    } else {
      // Create card for each zone
      zoneFields.forEach(({ zone, fields }) => {
        const cardKey = createCardKey(category, zone);
        grouped[cardKey] = {
          data: fields,
          status: {},
          images: []
        };
      });
    }
  });

  return grouped;
}
```

---

## 📊 Current Database State Analysis

Based on your provided data:

```sql
-- Equipment images (rows 1, 3, 4, 5)
1   | Bricomarché Provins | Aero | NULL              | ...  -- ⚠️ Missing zone
3   | Bricomarché Provins | Aero | surface_de_vente  | ...  -- ✅ Correct
4   | Bricomarché Provins | Clim | bureau            | ...  -- ✅ Correct
5   | Bricomarché Provins | Clim | surface_de_vente  | ...  -- ✅ Correct

-- VT Plan images (rows 47, 49, 50, 53)
47  | Bricomarché Provins | grayscale | NULL | VT | ...  -- ✅ Page 3 image
49  | Bricomarché Provins | annotated | NULL | VT | ...  -- ✅ Page 3 image
```

### ⚠️ Issue: Row 1 Missing Zone

**Problem:** Row 1 has `type = 'Aero'` but `zone_name = NULL`

**Impact:**
- This image will only appear on equipment cards with **no zone** (legacy mode)
- It will NOT appear on zone-specific cards like `Aero::surface_de_vente`

**Solutions:**

**Option A: Add zone to Row 1**
```sql
UPDATE image_sql
SET zone_name = 'surface_de_vente'
WHERE id = 1;
```

**Option B: Delete Row 1 (if it's a duplicate)**
```sql
DELETE FROM image_sql WHERE id = 1;
```

**Option C: Keep it as a general image**
- If you want general Aero images that appear on ALL Aero cards regardless of zone, keep `zone_name = NULL`
- Update frontend filtering logic to include NULL zone images

---

## ✅ Recommended Best Practices

### 1. **Always Specify Zones for New Uploads**
```javascript
// ✅ GOOD - Zone specified
await saveImageToSQL({
  site: 'Site A',
  type: 'Aero',
  zone_name: 'surface_de_vente',  // 🔑 Always include zone
  title: 'Site A_Aero_surface_de_vente_Vt',
  url_viewer: '...',
  delete_url: '...'
});

// ❌ BAD - Missing zone
await saveImageToSQL({
  site: 'Site A',
  type: 'Aero',
  zone_name: null,  // Missing zone creates orphan images
  ...
});
```

### 2. **Naming Convention**
```javascript
// Format: {site}_{type}_{zone}_Vt
'Bricomarché Provins_Aero_surface_de_vente_Vt'
'Bricomarché Provins_Clim_bureau_Vt'
'Bricomarché Provins_Rooftop_reserve_Vt'
```

### 3. **Filtering Logic**
```javascript
// Always use exact matching
const typeMatches = img.type?.toLowerCase() === type.toLowerCase();
const zoneMatches = zone ? img.zone_name === zone : !img.zone_name;

// ✅ This ensures:
// - Zone-specific images only appear on their designated cards
// - Legacy images (NULL zone) only appear on general cards
```

### 4. **Migration Strategy for Existing Data**

If you have existing images without zones:

```sql
-- Step 1: Identify images missing zones
SELECT id, site, type, title, zone_name
FROM image_sql
WHERE type IN ('Aero', 'Clim', 'Rooftop', 'Eclairage')
  AND zone_name IS NULL;

-- Step 2: Update based on title (if title contains zone)
UPDATE image_sql
SET zone_name = 'surface_de_vente'
WHERE title LIKE '%_surface_de_vente_%' AND zone_name IS NULL;

UPDATE image_sql
SET zone_name = 'bureau'
WHERE title LIKE '%_bureau_%' AND zone_name IS NULL;

-- Step 3: Delete orphaned images (if no zone can be inferred)
DELETE FROM image_sql
WHERE type IN ('Aero', 'Clim', 'Rooftop', 'Eclairage')
  AND zone_name IS NULL;
```

---

## 🧪 Testing Zone-Based Images

### Manual Test Procedure

1. **Open Page 2 in browser:** http://localhost:5173/page2

2. **Create zone cards:**
   - Click "Ajouter une zone"
   - Select type: "Aero"
   - Select zone: "surface_de_vente"
   - Save

3. **Upload image:**
   - Navigate to the "Aero - surface_de_vente" card
   - Click "Ajouter des images"
   - Upload a test image

4. **Verify in database:**
```sql
SELECT id, site, type, zone_name, title, url_viewer
FROM image_sql
WHERE site = 'Your Site Name'
ORDER BY datetime DESC
LIMIT 5;
```

Expected result:
```
id | site           | type | zone_name         | title
---+----------------+------+-------------------+--------------------------------
X  | Your Site Name | Aero | surface_de_vente  | Your Site Name_Aero_surface...
```

5. **Test filtering:**
   - Create another zone card: "Aero - bureau"
   - Upload a different image
   - Verify each card shows only its zone-specific images

---

## 🐛 Troubleshooting

### Issue: Images not showing on cards

**Diagnosis:**
```sql
-- Check if images exist
SELECT id, site, type, zone_name, title
FROM image_sql
WHERE site = 'YourSiteName';

-- Check for mismatched zones
SELECT DISTINCT zone_name
FROM image_sql
WHERE type = 'Aero';
```

**Common Causes:**
1. **Zone mismatch:** Image has `zone_name = 'bureau'` but card expects `'surface_de_vente'`
2. **Type mismatch:** Image has `type = 'aero'` (lowercase) but card expects `'Aero'` (capitalized)
3. **NULL zone:** Image has `zone_name = NULL` but card has a zone specified

**Fix:**
```sql
-- Update zone
UPDATE image_sql SET zone_name = 'correct_zone' WHERE id = X;

-- Update type (ensure consistent capitalization)
UPDATE image_sql SET type = 'Aero' WHERE type = 'aero';
```

### Issue: Duplicate images

**Diagnosis:**
```sql
-- Find duplicates
SELECT site, type, zone_name, title, COUNT(*) as count
FROM image_sql
GROUP BY site, type, zone_name, title
HAVING count > 1;
```

**Fix:**
```sql
-- Keep only the most recent
DELETE t1 FROM image_sql t1
INNER JOIN image_sql t2
WHERE t1.id < t2.id
  AND t1.site = t2.site
  AND t1.type = t2.type
  AND t1.zone_name = t2.zone_name;
```

---

## 📚 Related Files

### Frontend
- `/src/pages/EquipmentPage.jsx` - Main page component
- `/src/pages/equipment/EditableCard.jsx` - Image upload/display
- `/src/pages/equipment/zoneUtils.js` - Zone parsing utilities
- `/src/api/imageApi.js` - Image API calls

### Backend
- `/src/routes/imageRoutes.js` - Image upload/fetch/delete endpoints
- `/src/config/database.js` - Database connection

### Tests
- `/test/api/test-page2-images.js` - Zone-based image tests

---

## 🎯 Summary

✅ **What Works:**
- Zone-aware image uploads
- Zone-based filtering on fetch
- Automatic zone detection from card keys
- Backward compatibility with legacy images (NULL zones)

⚠️ **What Needs Attention:**
- Row 1 in your database (missing zone)
- Consistent capitalization (Aero vs aero)
- Clear distinction between equipment images (Page 2) and VT plan images (Page 3)

🔧 **Recommended Actions:**
1. Update Row 1 to have a zone or delete it
2. Test zone filtering with multiple cards
3. Document zone naming standards for your team
4. Run cleanup SQL to fix any orphaned images

---

**Last Updated:** 2025-10-16
**Status:** ✅ System Working - Minor data cleanup needed
