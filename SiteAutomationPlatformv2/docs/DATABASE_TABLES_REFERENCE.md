# Database Tables Reference - Quick Guide

## 🚨 CRITICAL RULES

1. **NEVER use `form_sql` table** - It is deprecated
2. **Page 2 = equipmentDAL** → Equipment tables
3. **Page 5 = gtbConfigDAL** → GTB tables
4. **Always use DAL (Data Access Layer)** - Never write raw SQL

---

## Tables by Page

### Page 1 - Site Information
**Table**: `sites`
```sql
- id (INT, PRIMARY KEY)
- site_name (VARCHAR, UNIQUE)
- client_name (VARCHAR)
- address (VARCHAR)
- phone_primary (VARCHAR)
- phone_secondary (VARCHAR)
- email (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

### Page 2 - Equipment (ZONE-AWARE)

**⚠️ MUST USE**: `database/dal/equipmentDAL.js`

#### Equipment Tables:

**`equipment_aerotherme`** - Aerotherme equipment
```sql
- site_name (VARCHAR, FK → sites.site_name)
- zone_aerotherme (VARCHAR) ← ZONE FIELD
- nb_aerotherme (INT)
- thermostat_aerotherme (VARCHAR)
- nb_contacts_aerotherme (INT)
- coffret_aerotherme (VARCHAR)
- coffret_horloge_aerotherme (VARCHAR)
- type_aerotherme (VARCHAR)
- fonctionement_aerotherme (TEXT)
- maintenance_aerotherme (TEXT)
- commentaire_aero (TEXT)
- td_aerotherme (VARCHAR)
```

**`aerotherme_references`** - Brand references
```sql
- site_name (VARCHAR, FK)
- zone_aerotherme (VARCHAR)
- brand_index (INT)
- brand_name (VARCHAR)
```

**`equipment_climate`** - Climate control
```sql
- site_name (VARCHAR, FK)
- zone_clim (VARCHAR) ← ZONE FIELD
- nb_clim_ir (INT)
- nb_clim_wire (INT)
- coffret_clim (VARCHAR)
- type_clim (VARCHAR)
- fonctionement_clim (TEXT)
- maintenance_clim (TEXT)
- nb_telecommande_clim_smartwire (INT)
- nb_telecommande_clim_wire (INT)
- commentaire_clim (TEXT)
- td_clim (VARCHAR)
```

**`climate_references`** - Climate references
```sql
- site_name (VARCHAR, FK)
- ref_type (ENUM: 'clim_ir', 'clim_wire')
- ref_index (INT)
- ref_value (VARCHAR)
```

**`equipment_rooftop`** - Rooftop equipment
```sql
- site_name (VARCHAR, FK)
- zone_rooftop (VARCHAR) ← ZONE FIELD
- zone_rooftop_1, zone_rooftop_2, zone_rooftop_3, zone_rooftop_4 (VARCHAR)
- nb_rooftop (INT)
- thermostat_rooftop (VARCHAR)
- telecomande_modbus_rooftop (VARCHAR)
- coffret_rooftop (VARCHAR)
- type_rooftop, type_rooftop_1, type_rooftop_2, type_rooftop_3 (VARCHAR)
- fonctionement_rooftop (TEXT)
- maintenance_rooftop (TEXT)
- commentaire_rooftop (TEXT)
```

**`rooftop_references`** - Rooftop brand references
```sql
- site_name (VARCHAR, FK)
- brand_index (INT)
- brand_name (VARCHAR)
```

**`equipment_lighting`** - Lighting (NO ZONES)
```sql
- site_name (VARCHAR, FK)
- eclairage_interieur (VARCHAR)
- eclairage_contacteur (VARCHAR)
- eclairage_exterieur (VARCHAR)
- eclairage_horloge (VARCHAR)
- commentaire_eclairage (TEXT)
```

#### Page 2 Code Pattern:
```javascript
// ✅ CORRECT
import equipmentDAL from '../../database/dal/equipmentDAL.js';

// Fetch (returns zone-suffixed fields)
const aeroData = await equipmentDAL.getAerothermeData(siteName);
// Returns: { nb_aerotherme_surface_de_vente: 3, nb_aerotherme_bureau: 2, ... }

const climData = await equipmentDAL.getClimateData(siteName);
const rooftopData = await equipmentDAL.getRooftopData(siteName);
const lightingData = await equipmentDAL.getLightingData(siteName);

// Save (accepts zone-suffixed fields)
await equipmentDAL.saveEquipmentData(siteName, zoneData);

// ❌ WRONG - Never write direct SQL
const [rows] = await db.execute('SELECT * FROM equipment_aerotherme WHERE site_name = ?', [siteName]);
```

---

### Page 5 - GTB Configuration (DEVIS-AWARE)

**⚠️ MUST USE**: `database/dal/gtbConfigDAL.js`

#### GTB Tables:

**`gtb_modules`** - Module configuration
```sql
- site_name (VARCHAR, FK → sites.site_name)
- devis_name (VARCHAR) ← DEVIS FIELD
- module_type (VARCHAR)
- quantity (INT)
- refs (TEXT) - Comma-separated references
- sondes (INT)
- sondes_presentes (INT)
- gaz_compteur (INT)
- izit (INT)
```

**`gtb_module_references`** - Individual module references
```sql
- site_name (VARCHAR, FK)
- module_type (VARCHAR)
- ref_index (INT)
- ref_value (VARCHAR)
```

**`gtb_module_types`** - Module type definitions (lookup table)
```sql
- id (INT, PRIMARY KEY)
- module_key (VARCHAR, UNIQUE)
- module_label (VARCHAR)
```

#### Page 5 Code Pattern:
```javascript
// ✅ CORRECT
import gtbConfigDAL from '../../database/dal/gtbConfigDAL.js';

// Save GTB configuration
await gtbConfigDAL.saveGtbConfig(siteName, devisName, gtbData);

// Fetch GTB configuration
const gtbConfig = await gtbConfigDAL.getGtbConfig(siteName, devisName);

// ❌ WRONG - Never write direct SQL
const [rows] = await db.execute('SELECT * FROM gtb_modules WHERE site_name = ?', [siteName]);
```

---

### All Pages - Images & Visual Plans

**Table**: `image_sql`
```sql
- id (INT, PRIMARY KEY)
- site (VARCHAR)
- type (VARCHAR) - 'vt_plan', 'gtb_plan', 'surface_plan', etc.
- zone_name (VARCHAR) - For zone-specific images
- title (VARCHAR)
- url_viewer (VARCHAR) - ImgBB URL
- delete_url (VARCHAR) - ImgBB delete URL
- shapes (JSON) - Icon positions: [{"id":"aero-1","x":150,"y":100}, ...]
- width, height (INT)
- crop_transform_x, crop_transform_y, crop_transform_width, crop_transform_height (DECIMAL)
- datetime (TIMESTAMP)
```

---

## Zone-Aware Data Flow

### Backend (equipmentDAL):
1. Reads from equipment tables: `zone_aerotherme='surface_de_vente', nb_aerotherme=3`
2. Transforms to zone-suffixed format: `nb_aerotherme_surface_de_vente: 3`
3. Returns to frontend

### Frontend (EquipmentPage):
1. Receives zone-suffixed data: `{ nb_aerotherme_surface_de_vente: 3, nb_aerotherme_bureau: 2 }`
2. `groupDataByZones()` detects zone suffixes
3. Creates cards: `"Aero::surface_de_vente"`, `"Aero::bureau"`
4. Displays zone names: "Surface de vente", "Bureau" (not "Général")

---

## Available Zones

```javascript
const AVAILABLE_ZONES = [
  'surface_de_vente',   // Surface de vente
  'galerie_marchande',  // Galerie marchande
  'reserve',            // Réserve
  'bureau',             // Bureau
  'entrepot',           // Entrepôt
  'parking',            // Parking
  'autre'               // Autre
];
```

---

## Common Mistakes to Avoid

❌ **NEVER DO THIS:**
```javascript
// Writing direct SQL for equipment data
const [rows] = await db.execute('SELECT * FROM equipment_aerotherme WHERE site_name = ?', [siteName]);

// Using form_sql table
const [rows] = await db.execute('SELECT * FROM form_sql WHERE site = ?', [siteName]);

// Mixing equipment and GTB tables
const [rows] = await db.execute('SELECT * FROM equipment_aerotherme JOIN gtb_modules ON ...');
```

✅ **ALWAYS DO THIS:**
```javascript
// Use the appropriate DAL
import equipmentDAL from '../../database/dal/equipmentDAL.js';
import gtbConfigDAL from '../../database/dal/gtbConfigDAL.js';

// Page 2 - Equipment
const aeroData = await equipmentDAL.getAerothermeData(siteName);

// Page 5 - GTB
const gtbConfig = await gtbConfigDAL.getGtbConfig(siteName, devisName);
```

---

## Summary Table

| Page | DAL Module | Tables Used | Key Feature |
|------|-----------|-------------|-------------|
| Page 1 | Direct SQL | `sites` | Basic site info |
| Page 2 | `equipmentDAL.js` | `equipment_aerotherme`, `equipment_climate`, `equipment_rooftop`, `equipment_lighting`, brands/refs tables | **Zone-aware** (multiple zones per site) |
| Page 5 | `gtbConfigDAL.js` | `gtb_modules`, `gtb_module_references`, `gtb_module_types` | **Devis-aware** (multiple devis per site) |
| All Pages | Direct SQL | `image_sql` | Image metadata & positions |

---

**Last Updated**: 2025-10-15
**Critical Fix**: Removed `form_sql` dependency, implemented zone-aware equipment data via equipmentDAL
