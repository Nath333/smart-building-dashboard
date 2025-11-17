@echo off
echo ================================================
echo Running Migration 05: Add etat_vetuste and localisation fields
echo ================================================
echo.

REM MySQL connection details
set MYSQL_USER=root
set MYSQL_PASS=Naveed@2019
set MYSQL_DB=projet_gtb
set MIGRATION_FILE=05_add_etat_vetuste_localisation.sql

echo Connecting to MySQL database: %MYSQL_DB%
echo Running migration file: %MIGRATION_FILE%
echo.

REM Run the migration
mysql -u %MYSQL_USER% -p%MYSQL_PASS% %MYSQL_DB% < %MIGRATION_FILE%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo Migration completed successfully!
    echo ================================================
    echo.
    echo New fields added:
    echo   - etat_vetuste (ENUM: green, yellow, red^)
    echo   - localisation (VARCHAR 255^)
    echo   - localisation_comptage (VARCHAR 255^)
    echo.
    echo Tables updated:
    echo   - equipment_aerotherme
    echo   - equipment_climate
    echo   - equipment_rooftop
    echo   - equipment_lighting
    echo.
) else (
    echo.
    echo ================================================
    echo Migration FAILED!
    echo ================================================
    echo Please check the error messages above.
    echo.
)

pause
