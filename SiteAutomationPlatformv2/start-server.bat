@echo off
echo ========================================
echo Starting Site Automation Platform Server
echo ========================================
echo.

echo [1/3] Checking database setup...
echo Running devis table creation...
mysql -u root -pnatFLK5.5 automation < database\migration\create_devis_table.sql 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Could not create devis table. It may already exist.
) else (
    echo SUCCESS: Devis table ready.
)

echo.
echo [2/3] Applying devis_name column migration...
mysql -u root -pnatFLK5.5 automation < database\migration\add_devis_name_column.sql 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Could not add devis_name column. It may already exist.
) else (
    echo SUCCESS: Devis table updated.
)

echo.
echo [3/3] Starting Express server on port 4001...
echo.
npm run server
