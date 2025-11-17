# GTB Normalized Database Schema Documentation

**Date:** 2025-10-15
**Status:** ✅ IMPLEMENTED & TESTED
**Purpose:** Replace flat `form_sql` structure with normalized GTB module tables

---

## 📋 Overview

Page 5 (GTB Configuration / **GtbConfigPage**) now uses a **normalized database structure** instead of the legacy `form_sql` table. This provides:

✅ **Better data integrity** - Foreign keys ensure data consistency
✅ **Easier maintenance** - Module types managed in lookup tables
✅ **Scalable design** - Adding new modules doesn't require schema changes
✅ **Audit trail support** - History tracking for GTB changes
✅ **Backward compatibility** - Frontend receives same flat structure

---

## 🗄️ Database Tables

### 1. **gtb_modules** (Main Configuration Table)
Stores GTB module quantities and sensor configuration per site.

```sql
CREATE TABLE gtb_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(100) NOT NULL,           -- FK to sites.site_name
  module_type VARCHAR(100) NOT NULL,         -- e.g., 'clim_ir', 'aeroeau'
  quantity INT DEFAULT 0,                    -- Number of modules
  refs TEXT,                                 -- Comma-separated references

  -- Sensor fields (stored with each module)
  sondes INT DEFAULT NULL,                   -- Temperature sensor count
  sondes_presentes INT DEFAULT NULL,         -- Presence sensor count
  gaz_compteur INT DEFAULT NULL,             -- Gas counter (boolean)
  izit INT DEFAULT NULL,                     -- Izit cabinet (boolean)

  -- Reference fields for sensors
  ref_sondes TEXT,                           -- Temperature sensor refs
  ref_sondes_presentes TEXT,                 -- Presence sensor refs
  ref_gaz_compteur VARCHAR(255),             -- Gas counter ref

  -- Metadata
  module_category VARCHAR(50),               -- 'sensor', 'module', 'accessory'
  display_order INT DEFAULT 0,               -- UI display order
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_site_module (site_name, module_type),
  FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE
);
```

**Example Data:**
```sql
INSERT INTO gtb_modules
(site_name, module_type, quantity, refs, sondes, ref_sondes)
VALUES
('site_test', 'clim_ir', 3, 'Intesis IR,Intesis IR,Intesis IR', 3, 'pi33,pi33,pi33');
```

---

### 2. **gtb_module_references** (Individual Reference Storage)
Stores individual module references for easier querying.

```sql
CREATE TABLE gtb_module_references (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(100) NOT NULL,           -- FK to sites.site_name
  module_type VARCHAR(100) NOT NULL,         -- e.g., 'clim_ir'
  ref_index INT,                             -- 0, 1, 2, ... (position)
  ref_value VARCHAR(255),                    -- e.g., 'Intesis IR'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_site_module_ref (site_name, module_type, ref_index),
  FOREIGN KEY (site_name) REFERENCES sites(site_name) ON DELETE CASCADE
);
```

**Example Data:**
```sql
INSERT INTO gtb_module_references
(site_name, module_type, ref_index, ref_value)
VALUES
('site_test', 'clim_ir', 0, 'Intesis IR'),
('site_test', 'clim_ir', 1, 'Intesis IR'),
('site_test', 'clim_ir', 2, 'Intesis IR');
```

---

### 3. **gtb_module_types** (Lookup Table)
Defines available GTB module types with metadata.

```sql
CREATE TABLE gtb_module_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_type VARCHAR(100) NOT NULL UNIQUE,
  module_category ENUM('sensor', 'module', 'accessory', 'system'),
  display_name_fr VARCHAR(255) NOT NULL,
  display_name_en VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Pre-populated Module Types:**
| module_type | display_name_fr | module_category | display_order |
|-------------|-----------------|-----------------|---------------|
| sondes | Sondes Température | sensor | 10 |
| sondesPresentes | Sondes de Présence | sensor | 20 |
| gazCompteur | Compteur Gaz | accessory | 30 |
| Izit | Coffret Izit | system | 40 |
| aeroeau | Aérotherme Eau | module | 100 |
| aerogaz | Aérotherme Gaz | module | 110 |
| clim_ir | Clim IR | module | 120 |
| clim_filaire_simple | Clim Filaire Simple | module | 130 |
| clim_filaire_groupe | Clim Filaire Groupe | module | 140 |
| rooftop | Rooftop | module | 150 |
| Comptage_Froid | Comptage Froid | module | 200 |
| Comptage_Eclairage | Comptage Éclairage | module | 210 |
| eclairage | Éclairage | module | 220 |

---

### 4. **gtb_modules_history** (Audit Trail - Optional)
Tracks changes to GTB configuration for compliance.

```sql
CREATE TABLE gtb_modules_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  operation ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  site_name VARCHAR(100) NOT NULL,
  module_type VARCHAR(100) NOT NULL,
  old_quantity INT,
  new_quantity INT,
  old_refs TEXT,
  new_refs TEXT,
  changed_by VARCHAR(100)
);
```

---

## 🔌 API Endpoints

### **POST /get-page3** - Retrieve GTB Configuration
**Request:**
```json
{
  "site": "site_name"
}
```

**Response:**
```json
{
  "site": "site_name",
  "sondes": 3,
  "ref_sondes": "pi33,pi33,pi33",
  "sondesPresentes": 3,
  "ref_sondesPresentes": "wt101,wt101,wt101",
  "gazCompteur": 1,
  "Izit": 1,
  "clim_ir": 3,
  "ref_clim_ir": "Intesis IR,Intesis IR,Intesis IR",
  "aeroeau": 2,
  "ref_aeroeau": "Aero1,Aero2"
}
```

---

### **POST /save_page3** - Save GTB Configuration
**Request:**
```json
{
  "site": "site_name",
  "sondes": 3,
  "ref_sondes": "pi33,pi33,pi33",
  "sondesPresentes": 3,
  "ref_sondesPresentes": "wt101,wt101,wt101",
  "gazCompteur": 1,
  "Izit": 1,
  "clim_ir": 3,
  "ref_clim_ir": "Intesis IR,Intesis IR,Intesis IR"
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ GTB configuration saved for site: site_name",
  "details": {
    "site": "site_name",
    "modulesProcessed": 4,
    "referencesProcessed": 9
  }
}
```

---

## 💻 Data Access Layer (DAL)

### **Location:** `database/dal/gtbConfigDAL.js`

### **Key Methods:**

#### 1. `getGtbConfig(siteName)`
Retrieves GTB configuration for a site.

```javascript
const gtbConfig = await gtbConfigDAL.getGtbConfig('site_test');
// Returns: { site: 'site_test', sondes: 3, clim_ir: 3, ... }
```

---

#### 2. `saveGtbConfig(siteName, gtbData)`
Saves GTB configuration (UPSERT logic).

```javascript
const result = await gtbConfigDAL.saveGtbConfig('site_test', {
  sondes: 3,
  ref_sondes: 'pi33,pi33,pi33',
  clim_ir: 3,
  ref_clim_ir: 'Intesis IR,Intesis IR,Intesis IR'
});
// Returns: { site: 'site_test', modulesProcessed: 2, referencesProcessed: 6 }
```

---

#### 3. `getModuleTypes()`
Returns available module types from lookup table.

```javascript
const moduleTypes = await gtbConfigDAL.getModuleTypes();
// Returns: [{ module_type: 'clim_ir', display_name_fr: 'Clim IR', ... }, ...]
```

---

#### 4. `hasGtbConfig(siteName)`
Checks if site has GTB configuration.

```javascript
const hasConfig = await gtbConfigDAL.hasGtbConfig('site_test');
// Returns: true or false
```

---

#### 5. `deleteGtbConfig(siteName)`
Deletes all GTB configuration for a site.

```javascript
const deletedCount = await gtbConfigDAL.deleteGtbConfig('site_test');
// Returns: 13 (number of records deleted)
```

---

## 🔄 Field Mappings (Frontend ↔ Database)

### **Sensor Fields:**
| Frontend Field | Database Column | Type | Example |
|----------------|-----------------|------|---------|
| `sondes` | `sondes` | INT | `3` |
| `ref_sondes` | `ref_sondes` | TEXT | `"pi33,pi33,pi33"` |
| `sondesPresentes` | `sondes_presentes` | INT | `3` |
| `ref_sondesPresentes` | `ref_sondes_presentes` | TEXT | `"wt101,wt101,wt101"` |
| `gazCompteur` | `gaz_compteur` | INT | `1` |
| `Izit` | `izit` | INT | `1` |

### **Module Fields:**
| Frontend Field | Database Column | Type | Example |
|----------------|-----------------|------|---------|
| `clim ir` or `clim_ir` | `clim_ir` | INT | `3` |
| `ref_clim_ir` | `ref_clim_ir` | TEXT | `"Intesis IR,..."` |
| `aeroeau` | `aeroeau` | INT | `2` |
| `ref_aeroeau` | `ref_aeroeau` | TEXT | `"Aero1,Aero2"` |
| `aerogaz` | `aerogaz` | INT | `1` |
| `rooftop` | `rooftop` | INT | `1` |
| `Comptage Froid` | `Comptage_Froid` | INT | `2` |
| `eclairage` | `eclairage` | INT | `1` |

**Note:** Frontend keys with spaces (e.g., `"clim ir"`) are mapped to underscored database columns (`clim_ir`).

---

## 🧪 Testing

### **Test File:** `test/test-gtb-dal.js`

### **Run Tests:**
```bash
node test/test-gtb-dal.js
```

### **Test Coverage:**
✅ Check if site has GTB config
✅ Save GTB configuration
✅ Retrieve GTB configuration
✅ Get module types
✅ Update configuration
✅ Verify update
✅ Delete configuration
✅ Verify deletion

### **Test Results:**
```
🎉 All GTB DAL tests completed!
📊 Modules: 4, References: 9
✅ 8/8 tests passed
```

---

## 📦 Migration Files

### **1. Schema Migration:** `database/migration/05_enhanced_gtb_schema.sql`
- Creates/enhances `gtb_modules` table
- Creates `gtb_module_types` lookup table
- Creates `gtb_module_references` table
- Creates `gtb_modules_history` audit table
- Populates `gtb_module_types` with 13 standard modules
- Creates stored procedures for common operations
- Creates views for easy querying

### **2. Run Migration:**
```bash
docker exec -i mysql-latest-db mysql -uroot -padmin avancement2 < database/migration/05_enhanced_gtb_schema.sql
```

---

## 🚀 Frontend Integration

### **No Changes Required!**

The GTB DAL provides **backward compatibility** by:
1. Accepting flat structure from frontend
2. Converting to normalized format internally
3. Returning flat structure on read

**Example:**
```javascript
// Frontend sends (flat format):
{
  site: "test_site",
  clim_ir: 3,
  ref_clim_ir: "Intesis IR,Intesis IR,Intesis IR"
}

// Backend stores (normalized):
gtb_modules: { site_name: "test_site", module_type: "clim_ir", quantity: 3, ... }
gtb_module_references: [
  { site_name: "test_site", module_type: "clim_ir", ref_index: 0, ref_value: "Intesis IR" },
  { site_name: "test_site", module_type: "clim_ir", ref_index: 1, ref_value: "Intesis IR" },
  { site_name: "test_site", module_type: "clim_ir", ref_index: 2, ref_value: "Intesis IR" }
]

// Backend returns (flat format):
{
  site: "test_site",
  clim_ir: 3,
  ref_clim_ir: "Intesis IR,Intesis IR,Intesis IR"
}
```

---

## 🎯 Benefits

### **Before (form_sql):**
❌ Single flat table with 200+ columns
❌ Hard to add new module types (requires ALTER TABLE)
❌ No referential integrity
❌ Difficult to query specific modules
❌ No audit trail

### **After (Normalized Schema):**
✅ Separate tables with clear relationships
✅ Adding modules = INSERT into lookup table (no schema change)
✅ Foreign keys ensure data consistency
✅ Easy to query modules by type/category
✅ Built-in audit trail support
✅ Scalable for future growth

---

## 📝 Future Enhancements

1. **Multi-Devis Support** - Store multiple GTB configurations per site
2. **Module Templates** - Pre-configured module sets for common building types
3. **Reference Validation** - Check references against manufacturer databases
4. **Cost Calculation** - Auto-calculate GTB system costs based on modules
5. **Visual Module Editor** - Drag-and-drop module configuration UI

---

## 🔗 Related Files

- **DAL:** `database/dal/gtbConfigDAL.js`
- **API Routes:** `src/routes/completeParallelEndpoints.js` (lines 608-660)
- **Migration:** `database/migration/05_enhanced_gtb_schema.sql`
- **Tests:** `test/test-gtb-dal.js`
- **Frontend:** `src/pages/GtbConfigPage.jsx` (unchanged)

---

## ✅ Status: PRODUCTION READY

**Date Completed:** 2025-10-15
**Test Status:** ✅ All tests passing
**Migration Status:** ✅ Schema applied
**Backward Compatibility:** ✅ Maintained

**Ready for deployment! 🚀**
