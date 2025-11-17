# Critical Bugs Report

**Date**: October 15, 2025
**Status**: 🔴 **BLOCKING** - Tests failing (60% pass rate)
**Severity**: HIGH - Database schema mismatch

---

## 🚨 Bug #1: Database Migration Not Applied

### Symptoms
- Test failures: 2/5 tests failing (Equipment & Image endpoints)
- Error: `Unknown column 'nb_contacts_aerotherme' in 'field list'`
- HTTP 500 responses from `/save_page2` endpoint

### Root Cause
**Database tables are missing required columns** from the normalized schema migration.

The application code expects columns from the normalized schema (defined in `database/migration/03_create_additional_normalized_tables.sql`) but the database still has old schema or missing tables.

### Expected Schema (from migration file)
```sql
CREATE TABLE equipment_aerotherme (
    id INT PRIMARY KEY AUTO_INCREMENT,
    site_name VARCHAR(100) NOT NULL,
    zone_aerotherme VARCHAR(255),
    nb_aerotherme INT,
    thermostat_aerotherme VARCHAR(255),
    nb_contacts_aerotherme INT,  -- ⚠️ THIS COLUMN IS MISSING
    coffret_aerotherme VARCHAR(255),
    ...
)
```

### Current Database State
**Unknown** - Migration not applied or partially applied.

### Impact
- ❌ Equipment configuration (Page 2) completely broken
- ❌ Cannot save aerotherme data
- ❌ Quick tests failing (60% pass rate)
- ❌ Production deployment blocked

---

## 🔧 Fix Instructions

### Option A: Run Full Migration (Recommended)
```bash
# 1. Backup existing data
mysql -u root -p avancement < database/migration/backup_before_migration.sql

# 2. Apply normalized schema
mysql -u root -p avancement < database/migration/03_create_additional_normalized_tables.sql

# 3. Migrate existing data (if any)
mysql -u root -p avancement < database/migration/04_migrate_data_to_normalized_tables.sql

# 4. Verify
npm run test:quick
```

### Option B: Quick Fix (Single Column)
**⚠️ NOT RECOMMENDED** - This is a band-aid, full migration needed eventually.

```sql
-- Add missing column to existing table
ALTER TABLE equipment_aerotherme
ADD COLUMN nb_contacts_aerotherme INT AFTER thermostat_aerotherme;

-- May need to add other missing columns too
```

### Option C: Fresh Database Setup
```bash
# 1. Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS avancement; CREATE DATABASE avancement;"

# 2. Run complete schema
mysql -u root -p avancement < database/migration/03_create_additional_normalized_tables.sql

# 3. Test
npm run test:quick
```

---

## 🔍 How to Verify Fix

### Step 1: Check if tables exist
```bash
mysql -u root -p avancement -e "SHOW TABLES LIKE 'equipment_%';"
```

Expected output:
```
equipment_aerotherme
equipment_climate
equipment_rooftop
equipment_lighting
```

### Step 2: Check column exists
```bash
mysql -u root -p avancement -e "DESCRIBE equipment_aerotherme;" | grep nb_contacts
```

Expected output:
```
nb_contacts_aerotherme | int | YES | | NULL |
```

### Step 3: Run tests
```bash
npm run test:quick
```

Expected output:
```
📊 5/5 passed (100%)
🎯 All systems operational!
```

---

## 📋 Related Issues

### Potential Bug #2: Duplicate Image Endpoint
**File**: `src/routes/imageRoutes.js`
**Issue**: Two identical `/upload-sql` endpoints (lines 268 and 295)

```javascript
// Line 268
router.post('/upload-sql', async (req, res) => { ... });

// Line 295 - DUPLICATE!
router.post('/upload-sql', async (req, res) => { ... });
```

**Impact**: LOW - Express uses first matching route, but causes confusion
**Fix**: Remove duplicate endpoint (line 295)

---

## 🎯 Action Items

### Immediate (Today)
1. [ ] Apply database migration: `03_create_additional_normalized_tables.sql`
2. [ ] Verify all tests pass: `npm run test:quick`
3. [ ] Document database setup in README.md

### Short-term (This Week)
1. [ ] Remove duplicate `/upload-sql` endpoint in imageRoutes.js
2. [ ] Add database schema validation to test suite
3. [ ] Create database setup script for new developers

### Long-term
1. [ ] Add database migration tracking (e.g., knex.js or migrate)
2. [ ] Automated schema validation on server startup
3. [ ] CI/CD pipeline to catch schema mismatches

---

## 🚫 What NOT to Do

❌ **Don't ignore this** - It blocks production deployment
❌ **Don't manually patch** - Run full migration for consistency
❌ **Don't commit with failing tests** - Fix database first
❌ **Don't deploy** - This is a critical blocker

---

## 📞 Need Help?

1. Check migration documentation: `database/migration/README.md`
2. Review schema: `database/migration/03_create_additional_normalized_tables.sql`
3. See API migration guide: `database/migration/API_MIGRATION.md`

---

**Priority**: 🔴 **CRITICAL - FIX IMMEDIATELY**
**Blocking**: Yes - Production deployment, all equipment features
**Last Updated**: October 15, 2025

---

## 🚨 Bug #2: Undefined 'transform' Variable (Page 3 Crash)

### Symptoms
- Page 3 (Visual Plan) crashes on load
- Error: `Uncaught ReferenceError: transform is not defined`
- Location: `VisualPlanDragArea.jsx:495` and multiple other lines

### Root Cause
Variable `transform` was used but never defined after recent refactoring.

### Fix Applied ✅
Added default transform object:
\`\`\`javascript
// VisualPlanDragArea.jsx line 105
const transform = { x: 0, y: 0 };
\`\`\`

### Status
✅ **FIXED** - October 15, 2025

---

## 📊 Summary

| Bug | Page | Status | Severity | Fix Time |
|-----|------|--------|----------|----------|
| #1 - Database schema | Page 2 | 🔴 OPEN | CRITICAL | 5 min |
| #2 - Undefined transform | Page 3 | ✅ FIXED | CRITICAL | 1 min |

**Next Action**: Apply database migration to fix Bug #1
