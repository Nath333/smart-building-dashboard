# GTB Architecture - Complete Improvement Plan

**Date**: 2025-10-16
**Status**: 🚨 CRITICAL ISSUES IDENTIFIED - REDESIGN REQUIRED

---

## 🔴 CRITICAL PROBLEMS IN CURRENT SYSTEM

### Problem 1: **DOUBLE STORAGE REDUNDANCY**
References are stored in TWO places simultaneously:

1. **`gtb_modules.refs`** column - Comma-separated string: `"Intesis IR,Intesis IR,Intesis IR"`
2. **`gtb_module_references`** table - Individual rows for each reference

**File**: [gtbConfigDAL.js:186-234](../database/dal/gtbConfigDAL.js#L186)

```javascript
// Line 186-208: Saves refs as comma-separated string
await connection.execute(
  `INSERT INTO gtb_modules (..., refs, ...)
   VALUES (?, ?, ?, ?, ?, ...)`,  // refs = "cs do12,cs do12,cs do12"
  [siteName, devisName, dbKey, quantity, refsString, ...]
);

// Line 221-234: ALSO saves each ref individually
for (let i = 0; i < refs.length; i++) {
  await connection.execute(
    `INSERT INTO gtb_module_references
     (site_name, module_type, ref_index, ref_value)
     VALUES (?, ?, ?, ?)`,
    [siteName, dbKey, i, refs[i]]  // Same refs stored again
  );
}
```

**Impact**:
- Database bloat (same data stored twice)
- Update anomalies (updating one storage location but not the other)
- Performance overhead (double writes)
- Maintenance nightmare (must keep both in sync)

---

### Problem 2: **REFERENCES NOT DEVIS-AWARE**

The `gtb_module_references` table has NO `devis_name` column:

```sql
CREATE TABLE gtb_module_references (
  site_name VARCHAR(100),
  module_type VARCHAR(100),
  ref_index INT,
  ref_value VARCHAR(255)
  -- ❌ MISSING: devis_name column
);
```

**Current Behavior** (Line 175):
```javascript
// Deletes ALL references for the site (across ALL devis)
await connection.execute(
  'DELETE FROM gtb_module_references WHERE site_name = ?',
  [siteName]
);
```

**Impact**:
- Site "ABC" has "Devis 1" with clim_ir → "Intesis IR"
- Site "ABC" has "Devis 2" with clim_ir → "Aidoo Pro"
- **Saving Devis 2 OVERWRITES Devis 1's references!**
- References are shared across all devis (NOT isolated per devis)

---

### Problem 3: **SENSOR DATA DUPLICATION**

Sensor fields (`sondes`, `sondes_presentes`, `gaz_compteur`, `izit`) are duplicated in EVERY module row:

**Example Database State**:
```
site_name | devis_name | module_type | sondes | sondes_presentes | gaz_compteur | izit
----------|------------|-------------|--------|------------------|--------------|-----
Site ABC  | Devis 1    | aeroeau     | 10     | 5                | 1            | 2
Site ABC  | Devis 1    | clim_ir     | 10     | 5                | 1            | 2    ← Same sensors!
Site ABC  | Devis 1    | rooftop     | 10     | 5                | 1            | 2    ← Same sensors!
```

**Impact**:
- If you have 8 module types, sensors are stored 8 times
- Storage waste: 10 MB of sensor data → 80 MB
- Update complexity: Must update all rows when changing sensor count

---

### Problem 4: **FRONTEND RECEIVES UNUSED DATA**

When fetching GTB config, the DAL queries `gtb_module_references` but **the refs column is ALSO populated in gtb_modules**:

**Fetch Query** (Line 31-38):
```javascript
SELECT module_type, quantity, refs,  // ← refs column fetched
       sondes, sondes_presentes, gaz_compteur, izit
FROM gtb_modules
WHERE site_name = ? AND devis_name = ?
```

**Then ALSO Queries** (Line 46-52):
```javascript
SELECT module_type, ref_index, ref_value
FROM gtb_module_references
WHERE site_name = ?
```

**The Code Uses `gtb_module_references` Data** (Line 55):
```javascript
const flatData = this._convertToFlatStructure(moduleRows, refRows);
// refRows comes from gtb_module_references, NOT gtb_modules.refs
```

**Impact**:
- `gtb_modules.refs` column is populated but NEVER USED during fetch
- Wasted query bandwidth
- Confusion about which data source is authoritative

---

## ✅ PROPOSED IMPROVED ARCHITECTURE

### Design Principle: **Single Source of Truth**

**Decision**: Use `gtb_module_references` table as the ONLY storage for references.

### New Schema Design

#### 1. **`gtb_modules`** - Simplified (Remove redundant columns)
```sql
CREATE TABLE gtb_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(100) NOT NULL,
  devis_name VARCHAR(100) NOT NULL DEFAULT 'Devis Principal',
  module_type VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_module (site_name, devis_name, module_type),
  FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE
);
```

**Changes**:
- ❌ **REMOVED**: `refs` column (use gtb_module_references instead)
- ❌ **REMOVED**: `sondes`, `sondes_presentes`, `gaz_compteur`, `izit` (move to separate table)
- ✅ **KEPT**: `site_name`, `devis_name`, `module_type`, `quantity`

---

#### 2. **`gtb_module_references`** - Add devis awareness
```sql
CREATE TABLE gtb_module_references (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(100) NOT NULL,
  devis_name VARCHAR(100) NOT NULL DEFAULT 'Devis Principal',  -- ✅ NEW
  module_type VARCHAR(100) NOT NULL,
  ref_index INT NOT NULL,
  ref_value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_ref (site_name, devis_name, module_type, ref_index),  -- ✅ UPDATED
  FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE
);
```

**Changes**:
- ✅ **ADDED**: `devis_name` column (devis-aware references)
- ✅ **UPDATED**: Unique constraint includes `devis_name`

---

#### 3. **`gtb_sensors`** - NEW TABLE (Sensor data isolation)
```sql
CREATE TABLE gtb_sensors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(100) NOT NULL,
  devis_name VARCHAR(100) NOT NULL DEFAULT 'Devis Principal',

  -- Temperature sensors
  sondes_count INT DEFAULT 0,
  sondes_refs TEXT,  -- JSON array: ["pi33", "pi33", "pi33"]

  -- Presence sensors
  sondes_presentes_count INT DEFAULT 0,
  sondes_presentes_refs TEXT,  -- JSON array: ["wt101", "wt101"]

  -- Gas meter
  gaz_compteur BOOLEAN DEFAULT FALSE,
  gaz_compteur_ref VARCHAR(100),

  -- Cabinets
  izit_count INT DEFAULT 0,
  izit_types TEXT,  -- JSON array: ["coffret gtb(asp/do12/routeur/ug65)", "isma"]

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_sensors (site_name, devis_name),
  FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE
);
```

**Benefits**:
- ✅ Sensors stored ONCE per site+devis (not duplicated per module)
- ✅ Clean separation of concerns
- ✅ Easy to query: "Show me all sensors for Devis 1"

---

## 🔄 IMPROVED DATA FLOW

### Save Operation (New Design)

```javascript
async saveGtbConfig(siteName, devisName, gtbData) {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1️⃣ DELETE old data (devis-specific)
    await connection.execute(
      'DELETE FROM gtb_modules WHERE site_name = ? AND devis_name = ?',
      [siteName, devisName]
    );
    await connection.execute(
      'DELETE FROM gtb_module_references WHERE site_name = ? AND devis_name = ?',
      [siteName, devisName]
    );
    await connection.execute(
      'DELETE FROM gtb_sensors WHERE site_name = ? AND devis_name = ?',
      [siteName, devisName]
    );

    // 2️⃣ SAVE modules (quantity only, NO refs column)
    for (const [moduleType, quantity] of Object.entries(gtbData.modules)) {
      if (quantity > 0) {
        await connection.execute(
          `INSERT INTO gtb_modules (site_name, devis_name, module_type, quantity)
           VALUES (?, ?, ?, ?)`,
          [siteName, devisName, moduleType, quantity]
        );

        // 3️⃣ SAVE references (devis-aware)
        const refs = gtbData.refs?.[moduleType] || [];
        for (let i = 0; i < refs.length; i++) {
          await connection.execute(
            `INSERT INTO gtb_module_references
             (site_name, devis_name, module_type, ref_index, ref_value)
             VALUES (?, ?, ?, ?, ?)`,
            [siteName, devisName, moduleType, i, refs[i]]
          );
        }
      }
    }

    // 4️⃣ SAVE sensors (ONCE, not per module)
    await connection.execute(
      `INSERT INTO gtb_sensors
       (site_name, devis_name,
        sondes_count, sondes_refs,
        sondes_presentes_count, sondes_presentes_refs,
        gaz_compteur, gaz_compteur_ref,
        izit_count, izit_types)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        siteName, devisName,
        gtbData.sondes || 0,
        JSON.stringify(gtbData.refs?.sondes || []),
        gtbData.sondesPresentes || 0,
        JSON.stringify(gtbData.refs?.sondesPresentes || []),
        gtbData.gazCompteur === 'oui' ? 1 : 0,
        gtbData.refs?.gazCompteur?.[0] || null,
        Array.isArray(gtbData.Izit) ? gtbData.Izit.length : 0,
        JSON.stringify(gtbData.Izit || [])
      ]
    );

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

---

### Fetch Operation (New Design)

```javascript
async getGtbConfig(siteName, devisName) {
  try {
    // 1️⃣ GET modules
    const [moduleRows] = await db.execute(
      'SELECT module_type, quantity FROM gtb_modules WHERE site_name = ? AND devis_name = ?',
      [siteName, devisName]
    );

    // 2️⃣ GET references (devis-aware)
    const [refRows] = await db.execute(
      `SELECT module_type, ref_index, ref_value
       FROM gtb_module_references
       WHERE site_name = ? AND devis_name = ?
       ORDER BY module_type, ref_index`,
      [siteName, devisName]
    );

    // 3️⃣ GET sensors
    const [sensorRows] = await db.execute(
      `SELECT sondes_count, sondes_refs,
              sondes_presentes_count, sondes_presentes_refs,
              gaz_compteur, gaz_compteur_ref,
              izit_count, izit_types
       FROM gtb_sensors
       WHERE site_name = ? AND devis_name = ?`,
      [siteName, devisName]
    );

    // 4️⃣ TRANSFORM to frontend format
    const flatData = {
      modules: moduleRows.map(r => r.module_type),
      refs: {}
    };

    // Group references by module type
    refRows.forEach(r => {
      if (!flatData.refs[r.module_type]) {
        flatData.refs[r.module_type] = [];
      }
      flatData.refs[r.module_type][r.ref_index] = r.ref_value;
    });

    // Add module quantities
    moduleRows.forEach(r => {
      flatData[r.module_type] = r.quantity;
    });

    // Add sensor data
    if (sensorRows.length > 0) {
      const sensors = sensorRows[0];
      flatData.sondes = sensors.sondes_count;
      flatData.sondesPresentes = sensors.sondes_presentes_count;
      flatData.gazCompteur = sensors.gaz_compteur ? 'oui' : 'non';
      flatData.Izit = JSON.parse(sensors.izit_types || '[]');

      flatData.refs.sondes = JSON.parse(sensors.sondes_refs || '[]');
      flatData.refs.sondesPresentes = JSON.parse(sensors.sondes_presentes_refs || '[]');
      if (sensors.gaz_compteur_ref) {
        flatData.refs.gazCompteur = [sensors.gaz_compteur_ref];
      }
    }

    return flatData;
  } catch (error) {
    console.error('Error fetching GTB config:', error);
    throw error;
  }
}
```

---

## 📊 COMPARISON: OLD vs NEW

### Storage Efficiency

**OLD SYSTEM** (Site with 5 modules, 10 sensors, 3 refs per module):
```
gtb_modules:           5 rows × (10 columns + refs string)    = ~500 bytes
gtb_module_references: 15 rows (3 refs × 5 modules)           = ~750 bytes
Sensor duplication:    5 rows × 4 sensor fields               = ~200 bytes
TOTAL:                                                         = ~1,450 bytes
```

**NEW SYSTEM** (Same data):
```
gtb_modules:           5 rows × 4 columns (NO refs, NO sensors) = ~200 bytes
gtb_module_references: 15 rows (devis-aware)                    = ~750 bytes
gtb_sensors:           1 row (sensors stored ONCE)              = ~150 bytes
TOTAL:                                                           = ~1,100 bytes
```

**Savings**: ~24% reduction in storage + cleaner schema

---

### Query Performance

**OLD SYSTEM** (Fetch GTB config):
```sql
-- Query 1: Get modules + refs string (unused)
SELECT module_type, quantity, refs, sondes, sondes_presentes, ... FROM gtb_modules

-- Query 2: Get individual refs (actually used)
SELECT module_type, ref_index, ref_value FROM gtb_module_references

-- Result: Fetches refs TWICE (once as string, once as rows)
```

**NEW SYSTEM** (Fetch GTB config):
```sql
-- Query 1: Get modules (quantity only)
SELECT module_type, quantity FROM gtb_modules

-- Query 2: Get references (devis-aware)
SELECT module_type, ref_index, ref_value FROM gtb_module_references
WHERE site_name = ? AND devis_name = ?

-- Query 3: Get sensors (once, not duplicated)
SELECT * FROM gtb_sensors WHERE site_name = ? AND devis_name = ?

-- Result: Clean separation, no redundancy
```

---

## 🎯 MIGRATION STRATEGY

### Phase 1: Add New Columns (Non-Breaking)
```sql
-- Add devis_name to gtb_module_references
ALTER TABLE gtb_module_references
ADD COLUMN devis_name VARCHAR(100) DEFAULT 'Devis Principal' AFTER site_name;

-- Create gtb_sensors table
CREATE TABLE gtb_sensors (...);
```

### Phase 2: Data Migration Script
```sql
-- Migrate sensor data from gtb_modules to gtb_sensors
INSERT INTO gtb_sensors (site_name, devis_name, sondes_count, sondes_presentes_count, ...)
SELECT DISTINCT site_name, devis_name, sondes, sondes_presentes, ...
FROM gtb_modules;

-- Update gtb_module_references to include devis_name
UPDATE gtb_module_references gmr
JOIN gtb_modules gm ON gmr.site_name = gm.site_name AND gmr.module_type = gm.module_type
SET gmr.devis_name = gm.devis_name;
```

### Phase 3: Update DAL Code
- Update `gtbConfigDAL.js` with new save/fetch logic
- Remove redundant `refs` column handling
- Add `gtb_sensors` table operations

### Phase 4: Cleanup (After Testing)
```sql
-- Remove redundant columns from gtb_modules
ALTER TABLE gtb_modules
DROP COLUMN refs,
DROP COLUMN sondes,
DROP COLUMN sondes_presentes,
DROP COLUMN gaz_compteur,
DROP COLUMN izit,
DROP COLUMN ref_sondes,
DROP COLUMN ref_sondes_presentes,
DROP COLUMN ref_gaz_compteur;
```

---

## ✅ BENEFITS OF NEW ARCHITECTURE

### 1. **Data Integrity**
- ✅ Single source of truth for references (no sync issues)
- ✅ Devis-specific references (no cross-contamination)
- ✅ Sensors stored once (no duplication)

### 2. **Maintainability**
- ✅ Clear schema design (easier to understand)
- ✅ Simpler queries (no redundant joins)
- ✅ Easier debugging (one place to check)

### 3. **Performance**
- ✅ 24% storage reduction
- ✅ Fewer write operations (no double storage)
- ✅ Cleaner query plans (no unused columns)

### 4. **Scalability**
- ✅ Supports unlimited devis per site
- ✅ Independent reference management per devis
- ✅ Easy to add new module types

---

## 🚀 IMPLEMENTATION CHECKLIST

- [ ] Review and approve new schema design
- [ ] Create migration SQL scripts
- [ ] Backup current `gtb_modules` and `gtb_module_references` data
- [ ] Run Phase 1 migrations (add columns, create tables)
- [ ] Run Phase 2 migrations (data transfer)
- [ ] Update `gtbConfigDAL.js` with new logic
- [ ] Test save operation with new schema
- [ ] Test fetch operation with new schema
- [ ] Verify devis isolation (Devis 1 ≠ Devis 2)
- [ ] Run integration tests (Page 5 end-to-end)
- [ ] Phase 4 cleanup (remove old columns)
- [ ] Update documentation

---

**Conclusion**: The current GTB architecture has **critical redundancy and isolation issues**. The proposed redesign eliminates double storage, adds proper devis awareness, and improves overall data integrity.

**Recommendation**: Implement this redesign to prevent data corruption and improve system performance.

---

**Author**: Claude Code
**Review Status**: ⚠️ REQUIRES APPROVAL BEFORE IMPLEMENTATION
**Impact**: HIGH (schema changes + DAL rewrite)
