# GTB Complete Data Structure Analysis

**Date**: 2025-10-16
**Status**: 🚨 CRITICAL - Izit cabinet mapping missing

---

## 📊 COMPLETE Frontend Data Structure

### What the Frontend Actually Sends:

```javascript
{
  // ===== MODULES =====
  modules: ["clim_filaire_simple", "aeroeau", "rooftop"],

  clim_filaire_simple: 4,  // Quantity
  aeroeau: 2,              // Quantity
  rooftop: 1,              // Quantity

  // ===== SENSORS =====
  sondes: 4,               // Quantity of temperature sensors
  sondesPresentes: 1,      // Quantity of presence sensors

  // ===== GAS METER =====
  gazCompteur: "oui",      // "oui" or "non" (not a quantity!)

  // ===== IZIT CABINETS (CRITICAL - DIFFERENT PATTERN!) =====
  Izit: [
    "coffret gtb(asp/do12/routeur/ug65)",  // Selected cabinet TYPE (not quantity!)
    "coffret gtb(asb/routeur/ug65)",
    "isma"
  ],

  // ===== ALL REFERENCES =====
  refs: {
    // Module refs (count = module quantity)
    clim_filaire_simple: ["aidoo pro", "aidoo pro", "aidoo pro", "aidoo pro"],
    aeroeau: ["cs do12", "cs do12"],
    rooftop: ["modbus do12"],

    // Sensor refs (count = sensor quantity)
    sondes: ["pi33", "pi33", "pi33", "pi33"],
    sondesPresentes: ["wt101"],

    // Gas meter ref (single item if "oui")
    gazCompteur: ["gaz 34325"],

    // Izit refs (count = number of selected cabinet types)
    // ⚠️ ORDER MATTERS - refs[0] belongs to Izit[0], refs[1] belongs to Izit[1]
    Izit: ["234543FRR", "3434", "55"]
  }
}
```

---

## 🔴 THE CRITICAL IZIT PROBLEM

### How Izit is Different:

**Normal modules** (quantity-based):
```javascript
clim_filaire_simple: 4  // Quantity
refs.clim_filaire_simple: ["aidoo pro", "aidoo pro", "aidoo pro", "aidoo pro"]
// Each ref is the SAME for the same module type
```

**Izit cabinets** (type-based):
```javascript
Izit: ["coffret gtb(asp/do12/routeur/ug65)", "isma"]  // Array of TYPES (not quantity!)
refs.Izit: ["234543FRR", "55"]
// Each ref corresponds to a DIFFERENT cabinet type
// refs[0] = "234543FRR" belongs to "coffret gtb(asp/do12/routeur/ug65)"
// refs[1] = "55" belongs to "isma"
```

### Current Schema Problem:

**gtb_modules** stores:
```sql
izit: 2  -- Only the COUNT
```

**When loading back**:
```javascript
// Current DAL line 94-96:
if (typeof izitValue === 'number') {
  refs.Izit = Array(izitValue).fill('');  // Creates ["", ""]
}
```

❌ **WE LOSE THE CABINET TYPES!**

We know there are 2 cabinets, but we don't know:
- Which cabinet types were selected
- Which reference belongs to which cabinet

---

## ✅ OPTIMAL SOLUTION: JSON-Based Storage

### New Schema Design

#### **gtb_modules** (Modules ONLY)
```sql
CREATE TABLE gtb_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(100) NOT NULL,
  devis_name VARCHAR(100) NOT NULL DEFAULT 'Devis Principal',
  module_type VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  references JSON,  -- ✅ NEW: Store refs as JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_module (site_name, devis_name, module_type),
  FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE
);
```

**Example data**:
```sql
INSERT INTO gtb_modules (site_name, devis_name, module_type, quantity, references)
VALUES (
  'Site ABC',
  'Devis Principal',
  'clim_filaire_simple',
  4,
  '["aidoo pro", "aidoo pro", "aidoo pro", "aidoo pro"]'
);
```

---

#### **gtb_sensors** (Sensors + Special Items)
```sql
CREATE TABLE gtb_sensors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(100) NOT NULL,
  devis_name VARCHAR(100) NOT NULL DEFAULT 'Devis Principal',

  -- Temperature sensors
  sondes_count INT DEFAULT 0,
  sondes_refs JSON,  -- ["pi33", "pi33", "pi33", "pi33"]

  -- Presence sensors
  sondes_presentes_count INT DEFAULT 0,
  sondes_presentes_refs JSON,  -- ["wt101"]

  -- Gas meter
  gaz_compteur BOOLEAN DEFAULT FALSE,
  gaz_compteur_ref VARCHAR(100),  -- Single ref: "gaz 34325"

  -- ✅ Izit cabinets (PRESERVE TYPE-TO-REF MAPPING)
  izit_cabinets JSON,  -- {"coffret gtb(asp/do12/routeur/ug65)": "234543FRR", "isma": "55"}

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_sensors (site_name, devis_name),
  FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE
);
```

**Example data**:
```sql
INSERT INTO gtb_sensors (
  site_name,
  devis_name,
  sondes_count,
  sondes_refs,
  sondes_presentes_count,
  sondes_presentes_refs,
  gaz_compteur,
  gaz_compteur_ref,
  izit_cabinets
)
VALUES (
  'Site ABC',
  'Devis Principal',
  4,
  '["pi33", "pi33", "pi33", "pi33"]',
  1,
  '["wt101"]',
  TRUE,
  'gaz 34325',
  '{"coffret gtb(asp/do12/routeur/ug65)": "234543FRR", "isma": "55"}'
);
```

---

## 🔄 Complete Data Flow (JSON-Based)

### SAVE Operation

```javascript
async saveGtbConfig(siteName, devisName, gtbData) {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1️⃣ Save modules with JSON refs
    for (const moduleType of gtbData.modules || []) {
      const quantity = gtbData[moduleType] || 0;
      const refs = gtbData.refs?.[moduleType] || [];

      await connection.execute(
        `INSERT INTO gtb_modules
         (site_name, devis_name, module_type, quantity, references)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           quantity = VALUES(quantity),
           references = VALUES(references)`,
        [siteName, devisName, moduleType, quantity, JSON.stringify(refs)]
      );
    }

    // 2️⃣ Save sensors with JSON refs
    const izitCabinets = {};
    if (Array.isArray(gtbData.Izit)) {
      gtbData.Izit.forEach((cabinetType, index) => {
        const ref = gtbData.refs?.Izit?.[index] || '';
        izitCabinets[cabinetType] = ref;
      });
    }

    await connection.execute(
      `INSERT INTO gtb_sensors
       (site_name, devis_name,
        sondes_count, sondes_refs,
        sondes_presentes_count, sondes_presentes_refs,
        gaz_compteur, gaz_compteur_ref,
        izit_cabinets)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         sondes_count = VALUES(sondes_count),
         sondes_refs = VALUES(sondes_refs),
         sondes_presentes_count = VALUES(sondes_presentes_count),
         sondes_presentes_refs = VALUES(sondes_presentes_refs),
         gaz_compteur = VALUES(gaz_compteur),
         gaz_compteur_ref = VALUES(gaz_compteur_ref),
         izit_cabinets = VALUES(izit_cabinets)`,
      [
        siteName,
        devisName,
        gtbData.sondes || 0,
        JSON.stringify(gtbData.refs?.sondes || []),
        gtbData.sondesPresentes || 0,
        JSON.stringify(gtbData.refs?.sondesPresentes || []),
        gtbData.gazCompteur === 'oui' ? 1 : 0,
        gtbData.refs?.gazCompteur?.[0] || null,
        JSON.stringify(izitCabinets)
      ]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

---

### FETCH Operation

```javascript
async getGtbConfig(siteName, devisName) {
  // 1️⃣ Get modules
  const [moduleRows] = await db.execute(
    'SELECT module_type, quantity, references FROM gtb_modules WHERE site_name = ? AND devis_name = ?',
    [siteName, devisName]
  );

  // 2️⃣ Get sensors
  const [sensorRows] = await db.execute(
    `SELECT sondes_count, sondes_refs,
            sondes_presentes_count, sondes_presentes_refs,
            gaz_compteur, gaz_compteur_ref,
            izit_cabinets
     FROM gtb_sensors
     WHERE site_name = ? AND devis_name = ?`,
    [siteName, devisName]
  );

  // 3️⃣ Transform to frontend format
  const flatData = {
    modules: [],
    refs: {}
  };

  // Process modules
  moduleRows.forEach(row => {
    flatData.modules.push(row.module_type);
    flatData[row.module_type] = row.quantity;
    flatData.refs[row.module_type] = JSON.parse(row.references || '[]');
  });

  // Process sensors
  if (sensorRows.length > 0) {
    const sensors = sensorRows[0];

    flatData.sondes = sensors.sondes_count;
    flatData.sondesPresentes = sensors.sondes_presentes_count;
    flatData.gazCompteur = sensors.gaz_compteur ? 'oui' : 'non';

    flatData.refs.sondes = JSON.parse(sensors.sondes_refs || '[]');
    flatData.refs.sondesPresentes = JSON.parse(sensors.sondes_presentes_refs || '[]');

    if (sensors.gaz_compteur_ref) {
      flatData.refs.gazCompteur = [sensors.gaz_compteur_ref];
    }

    // ✅ Reconstruct Izit cabinet types and refs
    const izitCabinets = JSON.parse(sensors.izit_cabinets || '{}');
    flatData.Izit = Object.keys(izitCabinets);  // Array of cabinet types
    flatData.refs.Izit = Object.values(izitCabinets);  // Array of refs (same order)
  }

  return flatData;
}
```

---

## 📊 Comparison: Relational vs JSON

### Relational Approach (gtb_module_references table)

**Pros**:
- Normalized (follows 3NF)
- Easy to query individual refs
- Can add indexes

**Cons**:
- ❌ Can't preserve Izit cabinet-to-ref mapping without extra columns
- ❌ Requires JOIN queries
- ❌ More complex DAL code
- ❌ More database writes (one INSERT per ref)

---

### JSON Approach (JSON columns)

**Pros**:
- ✅ Preserves exact frontend structure
- ✅ Izit cabinet mapping preserved perfectly
- ✅ Simpler DAL code (no JOINs)
- ✅ Fewer database writes (one INSERT per module/sensor group)
- ✅ MySQL 5.7+ has native JSON support with indexing

**Cons**:
- Slightly less normalized
- Need to parse JSON in queries (but MySQL handles this efficiently)

---

## 🎯 RECOMMENDATION

**Use JSON columns for ALL references**

Why:
1. ✅ Solves the Izit mapping problem completely
2. ✅ Frontend data structure matches database storage exactly
3. ✅ Simpler code (no reference table management)
4. ✅ Better performance (fewer writes, no JOINs)
5. ✅ MySQL JSON functions are mature and efficient

---

## 📋 Example Database State

### After saving this config:
```javascript
{
  modules: ["clim_filaire_simple"],
  clim_filaire_simple: 4,
  sondes: 4,
  sondesPresentes: 1,
  gazCompteur: "oui",
  Izit: ["coffret gtb(asp/do12/routeur/ug65)", "isma"],
  refs: {
    clim_filaire_simple: ["aidoo pro", "aidoo pro", "aidoo pro", "aidoo pro"],
    sondes: ["pi33", "pi33", "pi33", "pi33"],
    sondesPresentes: ["wt101"],
    gazCompteur: ["gaz 34325"],
    Izit: ["234543FRR", "55"]
  }
}
```

### **gtb_modules** table:
```
id | site_name | devis_name       | module_type          | quantity | references
---|-----------|------------------|----------------------|----------|----------------------------------
1  | Site ABC  | Devis Principal  | clim_filaire_simple  | 4        | ["aidoo pro","aidoo pro","aidoo pro","aidoo pro"]
```

### **gtb_sensors** table:
```
id | site_name | devis_name       | sondes_count | sondes_refs                      | sondes_presentes_count | sondes_presentes_refs | gaz_compteur | gaz_compteur_ref | izit_cabinets
---|-----------|------------------|--------------|----------------------------------|------------------------|----------------------|--------------|------------------|----------------------------------
1  | Site ABC  | Devis Principal  | 4            | ["pi33","pi33","pi33","pi33"]    | 1                      | ["wt101"]             | 1            | gaz 34325        | {"coffret gtb(asp/do12/routeur/ug65)":"234543FRR","isma":"55"}
```

---

## ✅ BENEFITS

1. **Complete Data Integrity**: Izit cabinet types and refs perfectly preserved
2. **Devis Isolation**: Each devis has completely independent data
3. **No Redundancy**: References stored once, in one place
4. **Simple Queries**: No JOINs needed
5. **Performance**: Fewer writes, faster reads
6. **Maintainability**: Database structure matches frontend structure

---

**Conclusion**: JSON-based storage is the OPTIMAL solution for GTB data.

**Next**: Create improved migration script + DAL with JSON support.
