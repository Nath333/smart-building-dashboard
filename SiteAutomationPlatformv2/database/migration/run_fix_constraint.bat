@echo off
echo =====================================================
echo FIX GTB_MODULES CONSTRAINT - Windows Batch Runner
echo =====================================================
echo.
echo This script will fix the UNIQUE constraint in gtb_modules table
echo to support multiple devis per site.
echo.
pause

echo Running SQL migration...
mysql -h 127.0.0.1 -u root -padmin avancement < fix_gtb_modules_constraint.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS: Database constraint fixed!
    echo You can now save GTB configurations for multiple devis.
) else (
    echo.
    echo ❌ ERROR: Migration failed. Error code: %ERRORLEVEL%
    echo Please check your MySQL credentials and try again.
)

echo.
pause
