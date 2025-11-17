@echo off
REM =====================================================
REM Database Migration Execution Script
REM Database: avancement2
REM =====================================================

echo.
echo ========================================
echo   Database Migration - avancement2
echo ========================================
echo.

REM Step 0: Navigate to migration directory
cd /d "c:\Users\natha\Desktop\New folder (3)\SiteAutomationPlatform\database\migration"

echo [INFO] Current directory: %CD%
echo.

REM Step 1: Backup existing database
echo [STEP 1] Creating backup...
echo You will be prompted for MySQL root password
echo.

mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS avancement2_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%;"
mysqldump -u root -p avancement2 > backup_before_migration_%date:~-4,4%%date:~-7,2%%date:~-10,2%.sql

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backup failed! Aborting migration.
    pause
    exit /b 1
)

echo [SUCCESS] Backup created: backup_before_migration_%date:~-4,4%%date:~-7,2%%date:~-10,2%.sql
echo.

REM Step 2: Create normalized tables
echo [STEP 2] Creating normalized tables...
echo You will be prompted for MySQL root password
echo.

mysql -u root -p avancement2 < 01_create_normalized_tables.sql

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Table creation failed! Check error messages above.
    echo [INFO] You can restore from backup if needed.
    pause
    exit /b 1
)

echo [SUCCESS] Normalized tables created successfully
echo.

REM Step 3: Migrate data
echo [STEP 3] Migrating data from form_sql to normalized tables...
echo You will be prompted for MySQL root password
echo.

mysql -u root -p avancement2 < 02_migrate_data.sql

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Data migration failed! Check error messages above.
    echo [INFO] You can restore from backup if needed.
    pause
    exit /b 1
)

echo [SUCCESS] Data migrated successfully
echo.

REM Step 4: Verify migration
echo [STEP 4] Verifying migration...
echo.

mysql -u root -p avancement2 -e "SELECT COUNT(*) as sites_count FROM sites; SELECT COUNT(*) as aero_count FROM equipment_aerotherme; SELECT COUNT(*) as rooftop_count FROM equipment_rooftop;"

if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Verification query failed, but migration may have succeeded.
    echo [INFO] Please verify manually.
)

echo.
echo ========================================
echo   Migration Complete!
echo ========================================
echo.
echo [NEXT STEPS]
echo 1. Review the output above for any errors
echo 2. Run backend adapter setup (see API_MIGRATION.md)
echo 3. Test your application thoroughly
echo 4. Keep backup file safe until testing is complete
echo.
echo Backup location: backup_before_migration_%date:~-4,4%%date:~-7,2%%date:~-10,2%.sql
echo.

pause
