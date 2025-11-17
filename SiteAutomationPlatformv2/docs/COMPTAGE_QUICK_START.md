# Comptage Feature - Quick Start Guide

## 🚀 What's Been Implemented

### ✅ Database Layer
- **4 new tables created:**
  - `equipment_comptage_aerotherme`
  - `equipment_comptage_climate`
  - `equipment_comptage_lighting`
  - `equipment_comptage_rooftop`

- **Table fields:**
  - `id`, `site_name`, `zone`, `nb`
  - `type`, `connection_type`, `puissance`
  - `commentaire`, `etat_vetuste`, `localisation`
  - `created_at`, `updated_at`

### ✅ Backend API (4 Endpoints)
1. **POST /save-comptage** - Save comptage data
2. **POST /get-comptage** - Get comptage data
3. **PUT /update-comptage/:category/:id** - Update record
4. **DELETE /delete-comptage/:category/:id** - Delete record

### ✅ Data Access Layer
- **File:** `database/dal/comptageDAL.js`
- **Methods:**
  - `saveComptageData()`
  - `getComptageData()`
  - `getAllComptageData()`
  - `updateComptageRecord()`
  - `deleteComptageRecord()`

### ✅ Frontend Component
- **File:** `src/pages/equipment/ComptageCard.jsx`
- **Features:**
  - Localisation selector
  - État de vétusté selector
  - Dynamic comptage count
  - Individual comptage cards
  - Save/delete functionality

## 📝 How to Use

### Step 1: Verify Database Tables
```bash
docker exec -i <mysql_container> mysql -uroot -padmin avancement2 -e "SHOW TABLES LIKE 'equipment_comptage%';"
```

**Expected Output:**
```
equipment_comptage_aerotherme
equipment_comptage_climate
equipment_comptage_lighting
equipment_comptage_rooftop
```

### Step 2: Restart Backend Server
```bash
# Stop current server (Ctrl+C if running)
npm run server
```

**Server should show:**
```
🚀 Server running on http://localhost:4001
```

### Step 3: Test API Endpoints
```bash
# Run the test suite
node test/api/test-comptage.js
```

**Expected Output:**
```
🧪 Testing Comptage API Endpoints

1️⃣ Testing POST /save-comptage
✅ Save successful
2️⃣ Testing POST /get-comptage (specific category)
✅ Retrieved comptage data
...
🎉 All comptage API tests passed!
```

### Step 4: Integrate in Frontend (Optional)

If you want to display comptage UI in Page 2:

```jsx
// In src/pages/equipment/EquipmentPage.jsx
import ComptageCard from './ComptageCard';

// Add inside your render:
<ComptageCard category="aerotherme" siteName={siteName} />
<ComptageCard category="climate" siteName={siteName} />
<ComptageCard category="lighting" siteName={siteName} />
<ComptageCard category="rooftop" siteName={siteName} />
```

## 🔧 API Usage Examples

### Save Comptage Data
```bash
curl -X POST http://localhost:4001/save-comptage \
  -H "Content-Type: application/json" \
  -d '{
    "site": "my_site",
    "category": "aerotherme",
    "comptageData": [
      {
        "zone": "surface_de_vente",
        "nb": 1,
        "type": "energie",
        "connection_type": "modbus",
        "puissance": 1500,
        "commentaire": "Comptage principal",
        "etat_vetuste": "bon",
        "localisation": "Bureau"
      }
    ]
  }'
```

### Get Comptage Data
```bash
curl -X POST http://localhost:4001/get-comptage \
  -H "Content-Type: application/json" \
  -d '{
    "site": "my_site",
    "category": "aerotherme"
  }'
```

### Update Comptage
```bash
curl -X PUT http://localhost:4001/update-comptage/aerotherme/1 \
  -H "Content-Type: application/json" \
  -d '{
    "puissance": 2000,
    "commentaire": "Updated power"
  }'
```

### Delete Comptage
```bash
curl -X DELETE http://localhost:4001/delete-comptage/aerotherme/1
```

## 📊 Data Structure

### Comptage Types
- `energie` - Énergie
- `eau` - Eau
- `gaz` - Gaz
- `electricite` - Électricité
- `autre` - Autre

### Connection Types
- `modbus` - Modbus
- `mbus` - M-Bus
- `impulsion` - Impulsion
- `analogique` - Analogique
- `numerique` - Numérique
- `autre` - Autre

### État de Vétusté
- `neuf` - Neuf
- `bon` - Bon état
- `moyen` - État moyen
- `mauvais` - Mauvais état
- `obsolete` - Obsolète

### Zones/Localisations
- `surface_de_vente` - Surface de vente
- `bureau` - Bureau
- `reserve` - Réserve
- `vestiaire` - Vestiaire
- `exterieur` - Extérieur
- `autre` - Autre

## ⚠️ Important Notes

1. **Server Restart Required:** The new routes won't work until you restart the backend server
2. **Database Connection:** Ensure MySQL is running via Docker Desktop
3. **Site Must Exist:** The site must exist in the `sites` table before saving comptage data
4. **Category Validation:** Only 4 valid categories: `aerotherme`, `climate`, `lighting`, `rooftop`

## 🐛 Troubleshooting

### Problem: "Cannot POST /save-comptage"
**Solution:** Restart the server - new routes need to be loaded
```bash
npm run server
```

### Problem: Tables don't exist
**Solution:** Run the migration script
```bash
docker exec -i <container_id> mysql -uroot -padmin avancement2 < database/migration/05_create_comptage_tables.sql
```

### Problem: Test script fails
**Solution:** Check if server is running on port 4001
```bash
netstat -an | findstr :4001
```

## 📚 Full Documentation

For complete documentation, see:
- [COMPTAGE_FEATURE.md](./COMPTAGE_FEATURE.md) - Full technical documentation
- [DATABASE_TABLES_REFERENCE.md](./DATABASE_TABLES_REFERENCE.md) - Database schema reference

## ✅ Verification Checklist

Before using the comptage feature, verify:

- [ ] Database tables created successfully
- [ ] Backend server restarted
- [ ] Test script passes all tests
- [ ] API endpoints return valid responses
- [ ] Frontend component displays correctly (if integrated)

---

**Implementation Date:** 2025-10-16
**Status:** ✅ Complete and Ready to Use
**Database:** avancement2 (Docker MySQL)
**Backend Port:** 4001
