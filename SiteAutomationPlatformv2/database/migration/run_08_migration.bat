@echo off
REM Run migration 08 - Add localisation and etat_vetuste fields
REM Make sure MySQL is running before executing this script

echo ========================================
echo Running Migration 08
echo Adding localisation and etat_vetuste fields
echo ========================================
echo.

REM Update these values to match your MySQL configuration
set DB_USER=root
set DB_PASS=
set DB_NAME=automation_site_db
set DB_HOST=localhost
set DB_PORT=3306

echo Connecting to database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo User: %DB_USER%
echo.

REM Run the migration
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% %DB_NAME% < 08_add_localisation_etat_vetuste.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERROR: Migration failed!
    echo Check the error messages above.
    echo ========================================
)

echo.
pause
