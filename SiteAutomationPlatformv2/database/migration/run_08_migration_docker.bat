@echo off
REM Run migration 08 inside Docker MySQL container
REM Make sure Docker Desktop is running and MySQL container is up

echo ========================================
echo Running Migration 08 (Docker)
echo Adding localisation and etat_vetuste fields
echo ========================================
echo.

REM Find the MySQL container name
echo Looking for MySQL container...
for /f "tokens=*" %%i in ('docker ps --filter "ancestor=mysql" --format "{{.Names}}"') do set CONTAINER_NAME=%%i

if "%CONTAINER_NAME%"=="" (
    echo ERROR: No running MySQL container found!
    echo Please start your Docker MySQL container first.
    echo.
    pause
    exit /b 1
)

echo Found MySQL container: %CONTAINER_NAME%
echo.

REM Database configuration (update if different)
set DB_NAME=automation_site_db
set DB_USER=root
set DB_PASS=rootpassword

echo Executing migration...
echo.

REM Copy SQL file to container and execute
docker cp 08_add_localisation_etat_vetuste.sql %CONTAINER_NAME%:/tmp/migration.sql
docker exec -i %CONTAINER_NAME% mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% < 08_add_localisation_etat_vetuste.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
    echo.
    echo Verifying changes...
    docker exec -i %CONTAINER_NAME% mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e "SHOW COLUMNS FROM equipment_aerotherme LIKE 'localisation_aerotherme';"
    docker exec -i %CONTAINER_NAME% mysql -u%DB_USER% -p%DB_PASS% %DB_NAME% -e "SHOW COLUMNS FROM equipment_aerotherme LIKE 'etat_vetuste_aerotherme';"
) else (
    echo.
    echo ========================================
    echo ERROR: Migration failed!
    echo Check the error messages above.
    echo ========================================
)

echo.
pause
