@echo off
echo ================================================
echo Running Migration 05: Add etat_vetuste and localisation fields
echo ================================================
echo.

REM Find the MySQL container name
echo Finding MySQL container...
for /f "tokens=*" %%i in ('docker ps --filter "ancestor=mysql" --format "{{.Names}}"') do set CONTAINER_NAME=%%i

if "%CONTAINER_NAME%"=="" (
    echo ERROR: MySQL container not found!
    echo Please make sure Docker Desktop is running and MySQL container is started.
    pause
    exit /b 1
)

echo Found MySQL container: %CONTAINER_NAME%
echo.

REM Copy migration file to container
echo Copying migration file to container...
docker cp 05_add_etat_vetuste_localisation.sql %CONTAINER_NAME%:/tmp/migration.sql

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to copy migration file to container
    pause
    exit /b 1
)

REM Execute migration
echo Running migration...
docker exec -i %CONTAINER_NAME% mysql -uroot -pNaveed@2019 projet_gtb < 05_add_etat_vetuste_localisation.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo Migration completed successfully!
    echo ================================================
    echo.
    echo New fields added to all equipment tables:
    echo   - etat_vetuste (green/yellow/red)
    echo   - localisation
    echo   - localisation_comptage
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
