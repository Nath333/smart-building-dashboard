# Database Normalization Migration Guide

## Overview
This migration restructures the monolithic `form_sql` table into 11 normalized tables for better maintainability, performance, and data integrity.

## Benefits of Normalized Structure

### 1. **Easier Data Management**
- **Before**: 130+ columns in one table
- **After**: Logical grouping across 11 tables
- **Result**: Faster queries, easier to understand structure

### 2. **Better Performance**
- Smaller table sizes → faster scans
- Targeted indexes → optimized queries
- Reduced data redundancy

### 3. **Improved Maintainability**
- Clear separation of concerns (Site info vs Equipment vs GTB modules)
- Easier to add new equipment types without schema changes
- Better support for foreign key constraints

### 4. **Data Integrity**
- Foreign key constraints ensure referential integrity
- No orphaned data (CASCADE DELETE)
- Duplicate prevention via UNIQUE constraints

## New Database Schema

### Core Tables

#### 1. **sites** (Page 1 - Basic Info)
```sql
id, site, client, address, number1, number2, email, submitted_at, updated_at
```
- **Purpose**: Core site identification and contact information
- **Key**: `site` (unique)

#### 2. **equipment_aerotherme** (Page 2)
```sql
id, site, zone_aerotherme, nb_aerotherme, thermostat_aerotherme,
nb_contacts_aerotherme, coffret_aerotherme, type_aerotherme, ...
```
- **Purpose**: Aerotherme equipment configuration
- **Relations**: Foreign key → sites.site

#### 3. **aerotherme_brands**
```sql
id, site, brand_index (0-9), brand_name
```
- **Purpose**: Aerotherme brand references (replaces marque_aerotherme_0 to _9)
- **Relations**: Foreign key → sites.site

#### 4. **equipment_rooftop** (Page 2)
```sql
id, site, zone_rooftop, nb_rooftop, thermostat_rooftop,
type_rooftop_1, type_rooftop_2, ...
```
- **Purpose**: Rooftop equipment configuration
- **Relations**: Foreign key → sites.site

#### 5. **rooftop_brands**
```sql
id, site, brand_index (0-9), brand_name
```
- **Purpose**: Rooftop brand references
- **Relations**: Foreign key → sites.site

#### 6. **equipment_climate** (Page 2)
```sql
id, site, zone_clim, nb_clim_ir, nb_clim_wire, coffret_clim,
type_clim, commentaire_clim, ...
```
- **Purpose**: Climate control equipment
- **Relations**: Foreign key → sites.site

#### 7. **climate_references**
```sql
id, site, ref_type ('clim_ir' | 'clim_wire'), ref_index (0-9), ref_value
```
- **Purpose**: Climate control references (replaces clim_ir_ref_0 to _9, clim_wire_ref_0 to _9)
- **Relations**: Foreign key → sites.site

#### 8. **equipment_lighting** (Page 2)
```sql
id, site, eclairage_interieur, eclairage_contacteur,
eclairage_exterieur, eclairage_horloge, commentaire_eclairage
```
- **Purpose**: Lighting equipment configuration
- **Relations**: Foreign key → sites.site

#### 9. **gtb_modules** (Page 5)
```sql
id, site, module_type, quantity, refs, sondes,
sondes_presentes, gaz_compteur, izit
```
- **Purpose**: GTB module quantities and configurations
- **Relations**: Foreign key → sites.site

#### 10. **gtb_module_references**
```sql
id, site, module_type, ref_index, ref_value
```
- **Purpose**: GTB module reference arrays
- **Relations**: Foreign key → sites.site

#### 11. **visual_positions** (Page 3, Page 6)
```sql
id, site, page_type ('vt_plan' | 'gtb_plan'), element_id, pos_x, pos_y
```
- **Purpose**: Draggable icon/module positions
- **Relations**: Foreign key → sites.site

### Existing Table (No Changes)
- **image_sql**: Already well-structured for image metadata

## Migration Steps

### Phase 1: Backup (CRITICAL)
```bash
# Backup existing database
mysqldump -u root -p your_database > backup_before_migration.sql
```

### Phase 2: Create New Tables
```bash
mysql -u root -p your_database < 01_create_normalized_tables.sql
```

### Phase 3: Migrate Data
```bash
mysql -u root -p your_database < 02_migrate_data.sql
```

### Phase 4: Verify Data Integrity
```sql
-- Check row counts match
SELECT COUNT(*) FROM sites;
SELECT COUNT(*) FROM form_sql;

-- Verify foreign keys work
SELECT s.site, COUNT(e.id) as aero_count
FROM sites s
LEFT JOIN equipment_aerotherme e ON s.site = e.site
GROUP BY s.site;

-- Check brands migrated correctly
SELECT site, COUNT(*) as brand_count
FROM aerotherme_brands
GROUP BY site;
```

### Phase 5: Update Backend API (Code Changes Required)
See `API_MIGRATION.md` for detailed endpoint changes.

### Phase 6: Test Thoroughly
```bash
npm run test:advanced
```

### Phase 7: Archive Old Table (After Verification)
```sql
-- Rename instead of drop (keep for rollback)
RENAME TABLE form_sql TO form_sql_archive_2025;
```

## Rollback Plan

If issues occur:
```sql
-- Restore from backup
mysql -u root -p your_database < backup_before_migration.sql

-- Or use archived table
RENAME TABLE form_sql_archive_2025 TO form_sql;
DROP TABLE sites, equipment_aerotherme, aerotherme_brands,
           equipment_rooftop, rooftop_brands, equipment_climate,
           climate_references, equipment_lighting, gtb_modules,
           gtb_module_references, visual_positions;
```

## Query Examples (Before vs After)

### Before (form_sql)
```sql
-- Get all aerotherme data for a site
SELECT zone_aerotherme, nb_aerotherme, marque_aerotherme_0,
       marque_aerotherme_1, ... marque_aerotherme_9
FROM form_sql
WHERE site = 'site_name';
```

### After (Normalized)
```sql
-- Get aerotherme data with brands
SELECT
    e.*,
    GROUP_CONCAT(b.brand_name ORDER BY b.brand_index) as brands
FROM equipment_aerotherme e
LEFT JOIN aerotherme_brands b ON e.site = b.site
WHERE e.site = 'site_name'
GROUP BY e.id;
```

### Before (form_sql)
```sql
-- Get all equipment for a site
SELECT zone_aerotherme, nb_aerotherme, nb_clim_ir, nb_rooftop, ...
FROM form_sql
WHERE site = 'site_name';
```

### After (Normalized)
```sql
-- Get comprehensive site overview
SELECT
    s.site,
    s.client,
    a.nb_aerotherme,
    r.nb_rooftop,
    c.nb_clim_ir,
    c.nb_clim_wire,
    l.eclairage_interieur
FROM sites s
LEFT JOIN equipment_aerotherme a ON s.site = a.site
LEFT JOIN equipment_rooftop r ON s.site = r.site
LEFT JOIN equipment_climate c ON s.site = c.site
LEFT JOIN equipment_lighting l ON s.site = l.site
WHERE s.site = 'site_name';
```

## Performance Improvements

### Index Strategy
```sql
-- All foreign keys automatically indexed
-- Additional composite indexes for common queries
CREATE INDEX idx_site_module ON gtb_modules(site, module_type);
CREATE INDEX idx_site_ref ON climate_references(site, ref_type);
```

### Query Optimization
- **Targeted SELECT**: Only fetch needed tables
- **Efficient JOINs**: Small tables with proper indexes
- **Reduced Data Transfer**: No need to fetch 130+ columns when you only need 5

## Maintenance Benefits

### Adding New Equipment Types
**Before**: Add 20+ new columns to form_sql
```sql
ALTER TABLE form_sql ADD COLUMN new_equipment_field VARCHAR(255);
-- Repeat 20 times...
```

**After**: Insert new row in equipment table
```sql
INSERT INTO gtb_modules (site, module_type, quantity)
VALUES ('site_name', 'new_module_type', 5);
```

### Data Cleanup
**Before**: Manual NULL cleanup across 130 columns
**After**: CASCADE DELETE handles related data automatically
```sql
DELETE FROM sites WHERE site = 'old_site';
-- All related equipment, brands, modules automatically deleted
```

## Migration Checklist

- [ ] Backup existing database
- [ ] Run `01_create_normalized_tables.sql`
- [ ] Run `02_migrate_data.sql`
- [ ] Verify data integrity (row counts, foreign keys)
- [ ] Update backend API endpoints (see API_MIGRATION.md)
- [ ] Update frontend API calls
- [ ] Run full test suite
- [ ] Test all pages (1-6) with real data
- [ ] Monitor performance
- [ ] Archive old `form_sql` table
- [ ] Update documentation

## Support

If you encounter issues:
1. Check migration logs
2. Verify foreign key constraints
3. Review data integrity queries
4. Restore from backup if needed
5. Contact development team

## Next Steps

After successful migration:
1. Read `API_MIGRATION.md` for backend changes
2. Update frontend components
3. Add new indexes for custom queries
4. Consider adding views for complex joins
5. Implement API optimization strategies
