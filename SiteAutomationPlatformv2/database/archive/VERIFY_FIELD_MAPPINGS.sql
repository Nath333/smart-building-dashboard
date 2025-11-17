-- ===============================================
-- VERIFY FIELD MAPPINGS BETWEEN OLD AND NEW SCHEMAS
-- Check that all field mappings are correct
-- ===============================================

-- 1️⃣ CHECK SITE FIELD MAPPINGS
SELECT 'Site Field Mapping Verification:' as info;

-- Show old schema fields (form_sql)
SELECT 'OLD SCHEMA (form_sql):' as schema_type;
SELECT
    site as 'OLD: site',
    client as 'OLD: client',
    address as 'OLD: address',
    number1 as 'OLD: number1',
    number2 as 'OLD: number2',
    email as 'OLD: email'
FROM form_sql
WHERE site = 'testgtb'
LIMIT 1;

-- Show new schema fields (sites)
SELECT 'NEW SCHEMA (sites):' as schema_type;
SELECT
    site_name as 'NEW: site_name → site',
    client_name as 'NEW: client_name → client',
    address as 'NEW: address → address',
    phone_primary as 'NEW: phone_primary → number1',
    phone_secondary as 'NEW: phone_secondary → number2',
    email as 'NEW: email → email'
FROM sites
WHERE site_name = 'testgtb'
LIMIT 1;

-- 2️⃣ FIELD MAPPING REFERENCE
SELECT 'Field Mapping Reference:' as info;
SELECT
    'form_sql.site' as old_field,
    'sites.site_name' as new_field,
    'Mapped in API as: site' as api_response
UNION ALL SELECT 'form_sql.client', 'sites.client_name', 'Mapped in API as: client'
UNION ALL SELECT 'form_sql.address', 'sites.address', 'Mapped in API as: address'
UNION ALL SELECT 'form_sql.number1', 'sites.phone_primary', 'Mapped in API as: number1'
UNION ALL SELECT 'form_sql.number2', 'sites.phone_secondary', 'Mapped in API as: number2'
UNION ALL SELECT 'form_sql.email', 'sites.email', 'Mapped in API as: email';

-- 3️⃣ COUNT VERIFICATION
SELECT 'Count Verification:' as info;
SELECT
    'form_sql sites' as source,
    COUNT(DISTINCT site) as count
FROM form_sql
WHERE site IS NOT NULL AND site != ''
UNION ALL
SELECT
    'sites table' as source,
    COUNT(*) as count
FROM sites;

-- 4️⃣ SPECIFIC DATA COMPARISON
SELECT 'Data Comparison for testgtb:' as info;

-- Old schema data
SELECT
    'OLD' as source,
    site,
    client,
    address,
    number1,
    number2,
    email
FROM form_sql
WHERE site = 'testgtb'
UNION ALL
-- New schema data (with correct mapping)
SELECT
    'NEW' as source,
    site_name as site,
    client_name as client,
    address,
    phone_primary as number1,
    phone_secondary as number2,
    email
FROM sites
WHERE site_name = 'testgtb';

-- 5️⃣ CHECK IF DATA IS MISSING
SELECT 'Missing Sites Analysis:' as info;

-- Sites in form_sql but NOT in sites table
SELECT
    'Missing in NEW schema:' as status,
    f.site
FROM form_sql f
LEFT JOIN sites s ON s.site_name = f.site
WHERE s.site_name IS NULL
AND f.site IS NOT NULL
AND f.site != ''
GROUP BY f.site;

-- Sites in sites table but NOT in form_sql
SELECT
    'Missing in OLD schema:' as status,
    s.site_name as site
FROM sites s
LEFT JOIN form_sql f ON f.site = s.site_name
WHERE f.site IS NULL;

-- 6️⃣ ALL SITES COMPARISON
SELECT 'Complete Site List Comparison:' as info;

SELECT
    'form_sql' as source,
    site as site_name,
    client as client_info
FROM form_sql
WHERE site IS NOT NULL AND site != ''
GROUP BY site
UNION ALL
SELECT
    'sites' as source,
    site_name,
    client_name as client_info
FROM sites
ORDER BY site_name;