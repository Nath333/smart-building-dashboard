# 🔄 Server Restart Required

## Issue
The GTB endpoints (`/get-page3`, `/save_page3`) were updated but the server needs to be restarted to load the new code.

## Error Symptoms
```
POST http://localhost:4001/get-page3 404 (Not Found)
Cannot POST /get-page3
```

## Solution

### 1. Stop the Current Server
Press `Ctrl+C` in the terminal where `npm run server` is running.

### 2. Restart the Server
```bash
npm run server
```

### 3. Verify Server Started
You should see:
```
✅ Database connected: avancement2 @ 127.0.0.1
Server listening at http://localhost:4001
```

### 4. Test the Endpoints
```bash
# Test GTB endpoint
curl -X POST http://localhost:4001/get-page3 \
  -H "Content-Type: application/json" \
  -d "{\"site\":\"test\"}"

# Should return: {"site":"test"} (not 404)
```

## What Changed
- ✅ `/get-page3` now uses `gtbConfigDAL.getGtbConfig()`
- ✅ `/save_page3` now uses `gtbConfigDAL.saveGtbConfig()`
- ✅ GTB data stored in normalized tables (`gtb_modules`, `gtb_module_references`)
- ✅ Backward compatible - frontend doesn't need changes

## Verification Checklist
- [ ] Server restarted successfully
- [ ] No errors in server console
- [ ] `/get-page3` returns data (not 404)
- [ ] `/devis/list/:siteName` returns devis list
- [ ] `/devis/installations/:siteName/:devisName` returns installations
- [ ] Page 5 loads without errors
- [ ] Can save GTB configuration

## If Issues Persist

### Check Server Logs
Look for these startup messages:
```
✅ Database connected: avancement2 @ 127.0.0.1
🔍 Using database from config: avancement2
Server listening at http://localhost:4001
```

### Verify Routes Loaded
When you restart, you should see the DAL import:
```javascript
import gtbConfigDAL from '../../database/dal/gtbConfigDAL.js';
```

### Test DAL Directly
```bash
node test/test-gtb-dal.js
# Should show: 🎉 All GTB DAL tests completed!
```

## Common Issues

### Issue: "Cannot find module 'gtbConfigDAL'"
**Solution:** Make sure file exists at:
```
database/dal/gtbConfigDAL.js
```

### Issue: "Foreign key constraint fails"
**Solution:** Run migration:
```bash
docker exec -i mysql-latest-db mysql -uroot -padmin avancement2 < database/migration/05_enhanced_gtb_schema.sql
```

### Issue: Routes still not working
**Solution:** Check [server.js:627](server.js:627) has:
```javascript
app.use('/', completeParallelEndpoints);
```

## Quick Test Script

Save as `test-server.bat`:
```batch
@echo off
echo Testing GTB endpoints...
curl -X POST http://localhost:4001/get-page3 -H "Content-Type: application/json" -d "{\"site\":\"test\"}"
echo.
echo.
echo Testing devis list...
curl http://localhost:4001/devis/list/test
echo.
echo.
echo Done!
pause
```

Run: `test-server.bat`

---

## ✅ After Restart

Your Page 5 (GtbConfigPage) should now:
1. Load existing GTB configuration from normalized tables
2. Display module counts and references correctly
3. Save changes to `gtb_modules` and `gtb_module_references`
4. Show devis list dropdown
5. Display installation counts per devis

---

**Last Updated:** 2025-10-15
**Related Documentation:** [docs/GTB_NORMALIZED_SCHEMA.md](docs/GTB_NORMALIZED_SCHEMA.md)
