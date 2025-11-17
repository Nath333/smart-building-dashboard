@echo off
REM Simple Docker migration script
REM Run this from the migration directory

echo ========================================
echo Docker MySQL Migration Runner
echo ========================================
echo.

REM Configuration - UPDATE THESE VALUES
set CONTAINER_NAME=mysql-container
set DB_NAME=automation_site_db
set DB_USER=root
set DB_PASS=rootpassword

echo Container: %CONTAINER_NAME%
echo Database: %DB_NAME%
echo.
echo Running migration 08...
echo.

REM Execute migration using docker exec
docker exec -i %CONTAINER_NAME% mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% < 08_add_localisation_etat_vetuste.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Migration completed.
    echo ========================================
    echo.
    echo Checking if columns were added...
    docker exec %CONTAINER_NAME% mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e "DESCRIBE equipment_aerotherme;"
) else (
    echo.
    echo ========================================
    echo ERROR: Migration failed!
    echo ========================================
    echo.
    echo Common issues:
    echo - Container not running: docker ps
    echo - Wrong container name: Update CONTAINER_NAME variable
    echo - Wrong database name: Update DB_NAME variable
    echo - Wrong password: Update DB_PASS variable
)

echo.
pause
