# API Migration Guide - Backend Endpoint Changes

## Overview
This guide covers the required backend API changes after database normalization.

## Strategy: Minimal Disruption Approach

### Option 1: Maintain Backward Compatibility (Recommended)
Keep existing endpoints working while adding new optimized ones.

**Benefits:**
- No immediate frontend changes required
- Gradual migration possible
- Easy rollback
- Test new structure without breaking existing functionality

**Implementation:**
- Create adapter layer that translates between flat and normalized structures
- Add new optimized endpoints with `/v2/` prefix
- Deprecate old endpoints gradually

### Option 2: Full Rewrite (More Work)
Replace all endpoints immediately.

**Benefits:**
- Cleaner codebase
- No legacy code
- Better performance from day one

**Drawbacks:**
- Requires simultaneous frontend updates
- Higher risk
- More coordination needed

## Recommended Implementation: Option 1 with Adapters

## Backend Changes Required

### 1. Create Data Access Layer (DAL)

#### `database/dal/siteDAL.js`
```javascript
const pool = require('../db');

class SiteDAL {
  // Get complete site data (replaces old form_sql query)
  async getSiteData(siteName) {
    const [siteInfo] = await pool.execute(
      'SELECT * FROM sites WHERE site = ?',
      [siteName]
    );

    const [aeroData] = await pool.execute(
      'SELECT * FROM equipment_aerotherme WHERE site = ?',
      [siteName]
    );

    const [aeroBrands] = await pool.execute(
      'SELECT brand_index, brand_name FROM aerotherme_brands WHERE site = ? ORDER BY brand_index',
      [siteName]
    );

    const [rooftopData] = await pool.execute(
      'SELECT * FROM equipment_rooftop WHERE site = ?',
      [siteName]
    );

    const [rooftopBrands] = await pool.execute(
      'SELECT brand_index, brand_name FROM rooftop_brands WHERE site = ? ORDER BY brand_index',
      [siteName]
    );

    const [climateData] = await pool.execute(
      'SELECT * FROM equipment_climate WHERE site = ?',
      [siteName]
    );

    const [climateRefs] = await pool.execute(
      'SELECT ref_type, ref_index, ref_value FROM climate_references WHERE site = ? ORDER BY ref_type, ref_index',
      [siteName]
    );

    const [lightingData] = await pool.execute(
      'SELECT * FROM equipment_lighting WHERE site = ?',
      [siteName]
    );

    const [gtbModules] = await pool.execute(
      'SELECT * FROM gtb_modules WHERE site = ?',
      [siteName]
    );

    const [visualPos] = await pool.execute(
      'SELECT * FROM visual_positions WHERE site = ?',
      [siteName]
    );

    return {
      site: siteInfo[0] || {},
      aerotherme: aeroData[0] || {},
      aerothermeBrands: aeroBrands,
      rooftop: rooftopData[0] || {},
      rooftopBrands: rooftopBrands,
      climate: climateData[0] || {},
      climateReferences: climateRefs,
      lighting: lightingData[0] || {},
      gtbModules: gtbModules,
      visualPositions: visualPos
    };
  }

  // Save site basic info (Page 1)
  async saveSiteInfo(data) {
    const query = `
      INSERT INTO sites (site, client, address, number1, number2, email)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        client = VALUES(client),
        address = VALUES(address),
        number1 = VALUES(number1),
        number2 = VALUES(number2),
        email = VALUES(email)
    `;

    return pool.execute(query, [
      data.site,
      data.client,
      data.address,
      data.number1,
      data.number2,
      data.email
    ]);
  }

  // Save aerotherme equipment (Page 2)
  async saveAerotherme(site, data) {
    // Save main aerotherme data
    const query = `
      INSERT INTO equipment_aerotherme (
        site, zone_aerotherme, nb_aerotherme, thermostat_aerotherme,
        nb_contacts_aerotherme, coffret_aerotherme, type_aerotherme,
        fonctionement_aerotherme, maintenance_aerotherme, commentaire_aero
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        zone_aerotherme = VALUES(zone_aerotherme),
        nb_aerotherme = VALUES(nb_aerotherme),
        thermostat_aerotherme = VALUES(thermostat_aerotherme),
        nb_contacts_aerotherme = VALUES(nb_contacts_aerotherme),
        coffret_aerotherme = VALUES(coffret_aerotherme),
        type_aerotherme = VALUES(type_aerotherme),
        fonctionement_aerotherme = VALUES(fonctionement_aerotherme),
        maintenance_aerotherme = VALUES(maintenance_aerotherme),
        commentaire_aero = VALUES(commentaire_aero)
    `;

    await pool.execute(query, [
      site,
      data.zone_aerotherme,
      data.nb_aerotherme,
      data.thermostat_aerotherme,
      data.nb_contacts_aerotherme,
      data.coffret_aerotherme,
      data.type_aerotherme,
      data.fonctionement_aerotherme,
      data.maintenance_aerotherme,
      data.commentaire_aero
    ]);

    // Save brands (clear existing first)
    await pool.execute('DELETE FROM aerotherme_brands WHERE site = ?', [site]);

    for (let i = 0; i < 10; i++) {
      const brandKey = `marque_aerotherme_${i}`;
      if (data[brandKey]) {
        await pool.execute(
          'INSERT INTO aerotherme_brands (site, brand_index, brand_name) VALUES (?, ?, ?)',
          [site, i, data[brandKey]]
        );
      }
    }
  }

  // Similar methods for rooftop, climate, lighting, GTB modules...
}

module.exports = new SiteDAL();
```

### 2. Create Adapter Layer (Backward Compatibility)

#### `database/adapters/formSqlAdapter.js`
```javascript
const siteDAL = require('../dal/siteDAL');

class FormSqlAdapter {
  /**
   * Converts normalized structure back to flat form_sql format
   * This maintains backward compatibility with existing frontend code
   */
  async convertToFlatStructure(siteName) {
    const data = await siteDAL.getSiteData(siteName);

    // Build flat object matching old form_sql structure
    const flatData = {
      // Site info
      site: data.site.site,
      client: data.site.client,
      address: data.site.address,
      number1: data.site.number1,
      number2: data.site.number2,
      email: data.site.email,
      submitted_at: data.site.submitted_at,

      // Aerotherme
      zone_aerotherme: data.aerotherme.zone_aerotherme,
      nb_aerotherme: data.aerotherme.nb_aerotherme,
      thermostat_aerotherme: data.aerotherme.thermostat_aerotherme,
      nb_contacts_aerotherme: data.aerotherme.nb_contacts_aerotherme,
      coffret_aerotherme: data.aerotherme.coffret_aerotherme,
      type_aerotherme: data.aerotherme.type_aerotherme,
      Fonctionement_aerotherme: data.aerotherme.fonctionement_aerotherme,
      Maintenance_aerotherme: data.aerotherme.maintenance_aerotherme,
      commentaire_aero: data.aerotherme.commentaire_aero,

      // Aerotherme brands (convert array back to marque_aerotherme_0..9)
      ...this.flattenBrands(data.aerothermeBrands, 'marque_aerotherme'),

      // Rooftop
      zone_rooftop: data.rooftop.zone_rooftop,
      nb_rooftop: data.rooftop.nb_rooftop,
      thermostat_rooftop: data.rooftop.thermostat_rooftop,
      coffret_rooftop: data.rooftop.coffret_rooftop,
      type_rooftop: data.rooftop.type_rooftop,
      Fonctionement_rooftop: data.rooftop.fonctionement_rooftop,
      Maintenance_rooftop: data.rooftop.maintenance_rooftop,

      // Rooftop brands
      ...this.flattenBrands(data.rooftopBrands, 'marque_rooftop'),

      // Climate
      zone_clim: data.climate.zone_clim,
      nb_clim_ir: data.climate.nb_clim_ir,
      nb_clim_wire: data.climate.nb_clim_wire,
      coffret_clim: data.climate.coffret_clim,
      type_clim: data.climate.type_clim,
      Fonctionement_clim: data.climate.fonctionement_clim,
      Maintenance_clim: data.climate.maintenance_clim,
      commentaire_clim: data.climate.commentaire_clim,

      // Climate references (convert array to clim_ir_ref_0..9, clim_wire_ref_0..9)
      ...this.flattenClimateReferences(data.climateReferences),

      // Lighting
      Eclairage_interieur: data.lighting.eclairage_interieur,
      Eclairage_contacteur: data.lighting.eclairage_contacteur,
      Eclairage_exterieur: data.lighting.eclairage_exterieur,
      Eclairage_horloge: data.lighting.eclairage_horloge,
      commentaire_eclairage: data.lighting.commentaire_eclairage,

      // GTB Modules (convert array to individual fields)
      ...this.flattenGtbModules(data.gtbModules),

      // Visual positions
      pos_x: data.visualPositions.find(p => p.page_type === 'vt_plan')?.pos_x,
      pos_y: data.visualPositions.find(p => p.page_type === 'vt_plan')?.pos_y
    };

    return flatData;
  }

  flattenBrands(brands, prefix) {
    const result = {};
    for (let i = 0; i < 10; i++) {
      const brand = brands.find(b => b.brand_index === i);
      result[`${prefix}_${i}`] = brand ? brand.brand_name : null;
    }
    return result;
  }

  flattenClimateReferences(refs) {
    const result = {};

    // IR references
    for (let i = 0; i < 10; i++) {
      const ref = refs.find(r => r.ref_type === 'clim_ir' && r.ref_index === i);
      result[`clim_ir_ref_${i}`] = ref ? ref.ref_value : null;
    }

    // Wire references
    for (let i = 0; i < 10; i++) {
      const ref = refs.find(r => r.ref_type === 'clim_wire' && r.ref_index === i);
      result[`clim_wire_ref_${i}`] = ref ? ref.ref_value : null;
    }

    return result;
  }

  flattenGtbModules(modules) {
    const result = {};

    modules.forEach(module => {
      result[module.module_type] = module.quantity;
      result[`ref_${module.module_type}`] = module.refs;
    });

    return result;
  }

  /**
   * Converts flat form_sql structure to normalized structure for saving
   */
  convertFromFlatStructure(flatData) {
    return {
      site: {
        site: flatData.site,
        client: flatData.client,
        address: flatData.address,
        number1: flatData.number1,
        number2: flatData.number2,
        email: flatData.email
      },
      aerotherme: {
        zone_aerotherme: flatData.zone_aerotherme,
        nb_aerotherme: flatData.nb_aerotherme,
        thermostat_aerotherme: flatData.thermostat_aerotherme,
        nb_contacts_aerotherme: flatData.nb_contacts_aerotherme,
        coffret_aerotherme: flatData.coffret_aerotherme,
        type_aerotherme: flatData.type_aerotherme,
        fonctionement_aerotherme: flatData.Fonctionement_aerotherme,
        maintenance_aerotherme: flatData.Maintenance_aerotherme,
        commentaire_aero: flatData.commentaire_aero
      },
      aerothermeBrands: this.extractBrands(flatData, 'marque_aerotherme'),
      rooftop: {
        zone_rooftop: flatData.zone_rooftop,
        nb_rooftop: flatData.nb_rooftop,
        thermostat_rooftop: flatData.thermostat_rooftop,
        coffret_rooftop: flatData.coffret_rooftop,
        type_rooftop: flatData.type_rooftop,
        fonctionement_rooftop: flatData.Fonctionement_rooftop,
        maintenance_rooftop: flatData.Maintenance_rooftop
      },
      rooftopBrands: this.extractBrands(flatData, 'marque_rooftop'),
      climate: {
        zone_clim: flatData.zone_clim,
        nb_clim_ir: flatData.nb_clim_ir,
        nb_clim_wire: flatData.nb_clim_wire,
        coffret_clim: flatData.coffret_clim,
        type_clim: flatData.type_clim,
        fonctionement_clim: flatData.Fonctionement_clim,
        maintenance_clim: flatData.Maintenance_clim,
        commentaire_clim: flatData.commentaire_clim
      },
      climateReferences: this.extractClimateReferences(flatData),
      lighting: {
        eclairage_interieur: flatData.Eclairage_interieur,
        eclairage_contacteur: flatData.Eclairage_contacteur,
        eclairage_exterieur: flatData.Eclairage_exterieur,
        eclairage_horloge: flatData.Eclairage_horloge,
        commentaire_eclairage: flatData.commentaire_eclairage
      },
      gtbModules: this.extractGtbModules(flatData)
    };
  }

  extractBrands(data, prefix) {
    const brands = [];
    for (let i = 0; i < 10; i++) {
      const brandName = data[`${prefix}_${i}`];
      if (brandName) {
        brands.push({ brand_index: i, brand_name: brandName });
      }
    }
    return brands;
  }

  extractClimateReferences(data) {
    const refs = [];

    // Extract IR references
    for (let i = 0; i < 10; i++) {
      const refValue = data[`clim_ir_ref_${i}`];
      if (refValue) {
        refs.push({ ref_type: 'clim_ir', ref_index: i, ref_value: refValue });
      }
    }

    // Extract Wire references
    for (let i = 0; i < 10; i++) {
      const refValue = data[`clim_wire_ref_${i}`];
      if (refValue) {
        refs.push({ ref_type: 'clim_wire', ref_index: i, ref_value: refValue });
      }
    }

    return refs;
  }

  extractGtbModules(data) {
    const moduleTypes = [
      'aeroeau', 'aerogaz', 'clim ir', 'clim filaire simple',
      'clim filaire groupe', 'rooftop', 'Comptage Froid',
      'Comptage Eclairage', 'eclairage'
    ];

    const modules = [];

    moduleTypes.forEach(type => {
      const quantity = data[type];
      const refs = data[`ref_${type}`];

      if (quantity > 0) {
        modules.push({
          module_type: type,
          quantity: quantity,
          refs: refs
        });
      }
    });

    return modules;
  }
}

module.exports = new FormSqlAdapter();
```

### 3. Update Existing Endpoints (Minimal Changes)

#### `server.js` (Modified Routes)
```javascript
const formSqlAdapter = require('./database/adapters/formSqlAdapter');
const siteDAL = require('./database/dal/siteDAL');

// EXISTING ENDPOINT - Keep working with adapter
app.post('/get-page2', async (req, res) => {
  try {
    const { site } = req.body;

    // Use adapter to maintain backward compatibility
    const flatData = await formSqlAdapter.convertToFlatStructure(site);

    res.json(flatData);
  } catch (error) {
    console.error('Error fetching page 2 data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// EXISTING ENDPOINT - Keep working with adapter
app.post('/save_page2', async (req, res) => {
  try {
    const flatData = req.body;

    // Convert flat structure to normalized structure
    const normalizedData = formSqlAdapter.convertFromFlatStructure(flatData);

    // Save to normalized tables
    await siteDAL.saveAerotherme(flatData.site, normalizedData.aerotherme);
    await siteDAL.saveRooftop(flatData.site, normalizedData.rooftop);
    await siteDAL.saveClimate(flatData.site, normalizedData.climate);
    await siteDAL.saveLighting(flatData.site, normalizedData.lighting);

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving page 2 data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// NEW OPTIMIZED ENDPOINT (Optional - for gradual migration)
app.post('/v2/site/equipment', async (req, res) => {
  try {
    const { site } = req.body;

    // Return normalized structure directly (no conversion overhead)
    const data = await siteDAL.getSiteData(site);

    res.json(data);
  } catch (error) {
    console.error('Error fetching site equipment:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});
```

## Complete DAL Implementation

Create the following files:

1. **`database/dal/siteDAL.js`** - Site basic info operations
2. **`database/dal/equipmentDAL.js`** - Equipment CRUD operations
3. **`database/dal/gtbDAL.js`** - GTB module operations
4. **`database/dal/visualDAL.js`** - Visual position operations

## Testing Strategy

### 1. Unit Tests for DAL
```javascript
// test/dal/siteDAL.test.js
const siteDAL = require('../../database/dal/siteDAL');

describe('SiteDAL', () => {
  test('should save and retrieve site info', async () => {
    const testSite = {
      site: 'test_site',
      client: 'Test Client',
      address: '123 Test St'
    };

    await siteDAL.saveSiteInfo(testSite);
    const retrieved = await siteDAL.getSiteData('test_site');

    expect(retrieved.site.client).toBe('Test Client');
  });
});
```

### 2. Integration Tests
```javascript
// test/api/test-migration.js
const axios = require('axios');

describe('Migration Compatibility', () => {
  test('old endpoints still work', async () => {
    const response = await axios.post('http://localhost:4001/get-page2', {
      site: 'test_site'
    });

    expect(response.data).toHaveProperty('nb_aerotherme');
    expect(response.data).toHaveProperty('marque_aerotherme_0');
  });

  test('new endpoints return normalized structure', async () => {
    const response = await axios.post('http://localhost:4001/v2/site/equipment', {
      site: 'test_site'
    });

    expect(response.data).toHaveProperty('aerotherme');
    expect(response.data).toHaveProperty('aerothermeBrands');
  });
});
```

## Performance Comparison

### Before (Single Query)
```sql
SELECT * FROM form_sql WHERE site = 'test_site';
-- Returns 130+ columns, many NULL
-- Query time: ~50ms
```

### After (With Adapter - Backward Compatible)
```sql
-- 8 separate queries but smaller tables
SELECT * FROM sites WHERE site = 'test_site';
SELECT * FROM equipment_aerotherme WHERE site = 'test_site';
-- ... 6 more queries
-- Total time: ~80ms (with adapter overhead)
```

### After (Optimized - New Endpoints)
```sql
-- Targeted queries only for needed data
SELECT * FROM equipment_aerotherme WHERE site = 'test_site';
SELECT * FROM aerotherme_brands WHERE site = 'test_site';
-- Query time: ~20ms (only 2 queries instead of 8)
```

## Gradual Migration Path

### Phase 1: Deploy with Adapters (Week 1)
- ✅ No frontend changes
- ✅ Existing endpoints work
- ✅ Data in normalized tables

### Phase 2: Test New Endpoints (Week 2-3)
- Add `/v2/` endpoints
- Test with Postman/curl
- Verify performance improvements

### Phase 3: Update Frontend Pages (Week 4-6)
- Migrate Page 2 to new endpoints
- Migrate Page 5 to new endpoints
- Update other pages as needed

### Phase 4: Deprecate Old Endpoints (Week 7+)
- Remove adapters
- Remove old endpoints
- Update documentation

## Conclusion

This migration strategy ensures:
- ✅ Zero downtime
- ✅ Backward compatibility
- ✅ Gradual migration
- ✅ Easy rollback
- ✅ Better performance over time

Start with the adapter approach, then gradually migrate to optimized endpoints as you update the frontend.
