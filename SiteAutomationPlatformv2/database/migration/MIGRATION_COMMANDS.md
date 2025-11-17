# Migration Commands - Quick Reference

## Database: `avancement2`

## Option 1: Automated Script (Recommended)

Simply double-click this file:
```
00_run_migration.bat
```

Or run from command prompt:
```bash
cd "c:\Users\natha\Desktop\New folder (3)\SiteAutomationPlatform\database\migration"
00_run_migration.bat
```

---

## Option 2: Manual Step-by-Step Commands

### Step 0: Navigate to Project Directory
```bash
cd "c:\Users\natha\Desktop\New folder (3)\SiteAutomationPlatform"
```

### Step 1: Backup Database (CRITICAL - DO NOT SKIP)
```bash
mysqldump -u root -p avancement2 > database/migration/backup_before_migration.sql
```
*Enter your MySQL root password when prompted*

### Step 2: Create Normalized Tables
```bash
mysql -u root -p avancement2 < database/migration/01_create_normalized_tables.sql
```
*Enter your MySQL root password when prompted*

### Step 3: Migrate Data
```bash
mysql -u root -p avancement2 < database/migration/02_migrate_data.sql
```
*Enter your MySQL root password when prompted*

### Step 4: Verify Migration
```bash
mysql -u root -p avancement2
```

Then run these queries:
```sql
-- Check row counts
SELECT COUNT(*) as sites_count FROM sites;
SELECT COUNT(*) as form_sql_count FROM form_sql;

-- Verify aerotherme data migrated
SELECT site, nb_aerotherme FROM equipment_aerotherme LIMIT 5;

-- Verify brands migrated
SELECT site, brand_index, brand_name FROM aerotherme_brands LIMIT 10;

-- Verify climate data
SELECT site, nb_clim_ir, nb_clim_wire FROM equipment_climate LIMIT 5;

-- Verify GTB modules
SELECT site, module_type, quantity FROM gtb_modules LIMIT 10;

-- Exit MySQL
exit;
```

---

## Rollback (If Something Goes Wrong)

### Restore from backup:
```bash
mysql -u root -p avancement2 < database/migration/backup_before_migration.sql
```

### Drop new tables (if needed):
```bash
mysql -u root -p avancement2
```

Then run:
```sql
DROP TABLE IF EXISTS visual_positions;
DROP TABLE IF EXISTS gtb_module_references;
DROP TABLE IF EXISTS gtb_modules;
DROP TABLE IF EXISTS equipment_lighting;
DROP TABLE IF EXISTS climate_references;
DROP TABLE IF EXISTS equipment_climate;
DROP TABLE IF EXISTS rooftop_brands;
DROP TABLE IF EXISTS equipment_rooftop;
DROP TABLE IF EXISTS aerotherme_brands;
DROP TABLE IF EXISTS equipment_aerotherme;
DROP TABLE IF EXISTS sites;

exit;
```

---

## Troubleshooting

### Issue: "Access denied for user 'root'"
**Solution**: Make sure you're entering the correct MySQL root password (likely: `admin` based on your config)

### Issue: "ERROR 1005: Can't create table (errno: 150)"
**Solution**: Foreign key constraint issue. Make sure you run the scripts in order:
1. First: `01_create_normalized_tables.sql`
2. Then: `02_migrate_data.sql`

### Issue: "Table 'form_sql' doesn't exist"
**Solution**: Make sure you're running the migration against the correct database (`avancement2`)

### Issue: Data looks wrong after migration
**Solution**:
1. Don't panic
2. Restore from backup
3. Review migration logs
4. Contact support with error messages

---

## After Migration Success

1. ✅ Keep backup file safe
2. ✅ Test application thoroughly
3. ✅ Read `API_MIGRATION.md` for backend code changes
4. ✅ Run test suite: `npm run test:advanced`
5. ✅ After 1 week of successful operation, you can archive old `form_sql`:
   ```sql
   RENAME TABLE form_sql TO form_sql_archive_2025;
   ```

---

## Quick Status Check

To see all your tables:
```bash
mysql -u root -p avancement2 -e "SHOW TABLES;"
```

Expected output should include:
- sites
- equipment_aerotherme
- aerotherme_brands
- equipment_rooftop
- rooftop_brands
- equipment_climate
- climate_references
- equipment_lighting
- gtb_modules
- gtb_module_references
- visual_positions
- image_sql (existing)
- form_sql (existing)
