@echo off
echo ============================================
echo Testing GTB Endpoints
echo ============================================
echo.

echo 1. Testing /get-page3...
curl -X POST http://localhost:4001/get-page3 -H "Content-Type: application/json" -d "{\"site\":\"test\"}"
echo.
echo.

echo 2. Testing /devis/list/test...
curl http://localhost:4001/devis/list/test
echo.
echo.

echo 3. Testing /devis/installations/test/Devis Principal...
curl "http://localhost:4001/devis/installations/test/Devis%%20Principal"
echo.
echo.

echo ============================================
echo Tests Complete!
echo ============================================
echo.
echo If you see 404 errors, restart the server with:
echo    npm run server
echo.
pause
