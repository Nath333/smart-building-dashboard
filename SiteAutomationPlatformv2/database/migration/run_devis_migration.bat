@echo off
echo Creating devis table...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p123456 mydatabase < create_devis_table.sql
if %errorlevel% == 0 (
    echo Success: devis table created
) else (
    echo Error: Failed to create devis table
)
pause
