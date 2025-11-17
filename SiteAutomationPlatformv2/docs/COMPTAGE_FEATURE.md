# Comptage (Metering) Feature Documentation

## Overview
The Comptage feature tracks individual metering devices across different equipment categories (Aerotherme, Climate, Lighting, Rooftop). Each comptage record stores detailed information about the meter type, connection, power consumption, condition, and location.

## Database Tables

### Schema
Four normalized tables store comptage data:

1. **equipment_comptage_aerotherme**
2. **equipment_comptage_climate**
3. **equipment_comptage_lighting**
4. **equipment_comptage_rooftop**

### Table Structure
All tables share the same schema:

```sql
CREATE TABLE equipment_comptage_[category] (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    zone VARCHAR(100) DEFAULT NULL COMMENT 'Localisation/zone of the comptage',
    nb INT DEFAULT 1 COMMENT 'Number of comptages',
    type VARCHAR(100) DEFAULT NULL COMMENT 'Type de comptage',
    connection_type VARCHAR(100) DEFAULT NULL COMMENT 'Type de connexion',
    puissance DECIMAL(10,2) DEFAULT NULL COMMENT 'Puissance totale in Watts',
    commentaire TEXT DEFAULT NULL,
    etat_vetuste VARCHAR(50) DEFAULT NULL COMMENT 'État de vétusté (condition)',
    localisation VARCHAR(255) DEFAULT NULL COMMENT 'Specific location',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_site_zone (site_name, zone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT | Auto-incrementing primary key |
| `site_name` | VARCHAR(255) | Site identifier (links to sites table) |
| `zone` | VARCHAR(100) | Equipment zone/area |
| `nb` | INT | Sequential number of this comptage |
| `type` | VARCHAR(100) | Type of comptage (energie, eau, gaz, electricite, autre) |
| `connection_type` | VARCHAR(100) | Connection method (modbus, mbus, impulsion, etc.) |
| `puissance` | DECIMAL(10,2) | Total power in Watts |
| `commentaire` | TEXT | Optional comments |
| `etat_vetuste` | VARCHAR(50) | Condition state (neuf, bon, moyen, mauvais, obsolete) |
| `localisation` | VARCHAR(255) | Specific location description |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## API Endpoints

### Base URL
`http://localhost:4001`

### 1. Save Comptage Data
**Endpoint:** `POST /save-comptage`

**Description:** Saves comptage data for a specific category. Replaces all existing records for the site/category.

**Request Body:**
```json
{
  "site": "site_name",
  "category": "aerotherme",  // aerotherme | climate | lighting | rooftop
  "comptageData": [
    {
      "zone": "surface_de_vente",
      "nb": 1,
      "type": "energie",
      "connection_type": "modbus",
      "puissance": 1500,
      "commentaire": "Comptage principal",
      "etat_vetuste": "bon",
      "localisation": "Bureau principal"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Saved 1 comptage records"
}
```

### 2. Get Comptage Data
**Endpoint:** `POST /get-comptage`

**Description:** Retrieves comptage data for a site. Can fetch specific category or all categories.

**Request Body (Specific Category):**
```json
{
  "site": "site_name",
  "category": "aerotherme"
}
```

**Request Body (All Categories):**
```json
{
  "site": "site_name"
}
```

**Response (Specific Category):**
```json
[
  {
    "id": 1,
    "site_name": "site_name",
    "zone": "surface_de_vente",
    "nb": 1,
    "type": "energie",
    "connection_type": "modbus",
    "puissance": 1500,
    "commentaire": "Comptage principal",
    "etat_vetuste": "bon",
    "localisation": "Bureau principal",
    "created_at": "2025-10-16T12:00:00.000Z",
    "updated_at": "2025-10-16T12:00:00.000Z"
  }
]
```

**Response (All Categories):**
```json
{
  "aerotherme": [...],
  "climate": [...],
  "lighting": [...],
  "rooftop": [...]
}
```

### 3. Update Comptage Record
**Endpoint:** `PUT /update-comptage/:category/:id`

**Description:** Updates a specific comptage record.

**URL Parameters:**
- `category`: Equipment category (aerotherme, climate, lighting, rooftop)
- `id`: Record ID

**Request Body:**
```json
{
  "puissance": 2000,
  "commentaire": "Updated power consumption"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comptage record updated"
}
```

### 4. Delete Comptage Record
**Endpoint:** `DELETE /delete-comptage/:category/:id`

**Description:** Deletes a specific comptage record.

**URL Parameters:**
- `category`: Equipment category
- `id`: Record ID

**Response:**
```json
{
  "success": true,
  "message": "Comptage record deleted"
}
```

## Data Access Layer (DAL)

### File Location
`database/dal/comptageDAL.js`

### Methods

#### saveComptageData(siteName, category, comptageData)
Saves comptage data for a specific site and category. Deletes existing records first.

**Parameters:**
- `siteName` (string): Site identifier
- `category` (string): Equipment category
- `comptageData` (array): Array of comptage records

**Returns:** Promise with success/failure status

#### getComptageData(siteName, category)
Gets all comptage records for a site/category.

**Parameters:**
- `siteName` (string): Site identifier
- `category` (string): Equipment category

**Returns:** Promise with array of comptage records

#### getAllComptageData(siteName)
Gets all comptage data for a site across all categories.

**Parameters:**
- `siteName` (string): Site identifier

**Returns:** Promise with object containing data grouped by category

#### updateComptageRecord(category, id, updateData)
Updates a single comptage record.

**Parameters:**
- `category` (string): Equipment category
- `id` (number): Record ID
- `updateData` (object): Fields to update

**Returns:** Promise with success/failure status

#### deleteComptageRecord(category, id)
Deletes a single comptage record.

**Parameters:**
- `category` (string): Equipment category
- `id` (number): Record ID

**Returns:** Promise with success/failure status

## Frontend Integration

### UI Component
**File:** `src/pages/equipment/ComptageCard.jsx`

### Usage Example
```jsx
import ComptageCard from './ComptageCard';

function EquipmentPage() {
  return (
    <div>
      <ComptageCard category="aerotherme" siteName={currentSite} />
      <ComptageCard category="climate" siteName={currentSite} />
      <ComptageCard category="lighting" siteName={currentSite} />
      <ComptageCard category="rooftop" siteName={currentSite} />
    </div>
  );
}
```

### Component Features
- Displays form for localisation and état de vétusté
- Dynamic comptage count with add/remove buttons
- Individual cards for each comptage with:
  - Type selector
  - Connection type selector
  - Power input (Watts)
  - Comment field
- Save button to persist all data
- Auto-loads existing data on mount

### State Management
- Uses Ant Design Form hooks
- Maintains local state for comptage list
- Syncs with backend on save
- Auto-populates from SQL on component mount

## Testing

### Running Tests
```bash
# Start the backend server
npm run server

# In a new terminal, run comptage tests
node test/api/test-comptage.js
```

### Test Coverage
1. ✅ Save comptage data
2. ✅ Get comptage data (specific category)
3. ✅ Get all comptage data
4. ✅ Update comptage record
5. ✅ Delete comptage record
6. ✅ Save multiple categories

## Migration Steps

### 1. Create Database Tables
```bash
# Using Docker MySQL
docker exec -i <mysql_container_id> mysql -uroot -padmin avancement2 < database/migration/05_create_comptage_tables.sql

# Or connect to MySQL directly
mysql -uroot -padmin avancement2 < database/migration/05_create_comptage_tables.sql
```

### 2. Verify Tables
```sql
SHOW TABLES LIKE 'equipment_comptage%';
-- Should show:
-- equipment_comptage_aerotherme
-- equipment_comptage_climate
-- equipment_comptage_lighting
-- equipment_comptage_rooftop

DESCRIBE equipment_comptage_aerotherme;
```

### 3. Restart Backend Server
```bash
# Stop current server (Ctrl+C)
npm run server
```

### 4. Test API Endpoints
```bash
# Test health endpoint
curl -X GET http://localhost:4001/test

# Test save comptage
curl -X POST http://localhost:4001/save-comptage \
  -H "Content-Type: application/json" \
  -d '{"site":"test","category":"aerotherme","comptageData":[...]}'
```

## Data Flow

### Save Flow
```
User Input (ComptageCard)
  ↓
Form Validation
  ↓
POST /save-comptage
  ↓
comptageDAL.saveComptageData()
  ↓
DELETE existing records
  ↓
INSERT new records
  ↓
Success response
  ↓
UI confirmation message
```

### Load Flow
```
Component Mount
  ↓
POST /get-comptage
  ↓
comptageDAL.getComptageData()
  ↓
Query SQL table
  ↓
Return comptage records
  ↓
Populate form fields
  ↓
Display comptage cards
```

## Best Practices

### Backend
1. ✅ Always validate `site` and `category` parameters
2. ✅ Use transactions for batch operations
3. ✅ Include proper error handling and logging
4. ✅ Return meaningful error messages
5. ✅ Use indexed queries (site_name, zone)

### Frontend
1. ✅ Validate all form inputs before submission
2. ✅ Show loading states during API calls
3. ✅ Display success/error messages to users
4. ✅ Handle empty states gracefully
5. ✅ Auto-save on blur for better UX

### Database
1. ✅ Use proper data types (DECIMAL for power, TEXT for comments)
2. ✅ Add indexes for frequently queried fields
3. ✅ Use timestamps for audit trails
4. ✅ Maintain referential integrity with site_name
5. ✅ Use transactions for multi-record operations

## Troubleshooting

### Issue: API endpoints return 404
**Solution:** Restart the backend server to load new routes
```bash
npm run server
```

### Issue: Tables don't exist
**Solution:** Run the migration script
```bash
docker exec -i <mysql_container_id> mysql -uroot -padmin avancement2 < database/migration/05_create_comptage_tables.sql
```

### Issue: Data not saving
**Solution:** Check backend logs and verify site exists in sites table
```sql
SELECT * FROM sites WHERE site_name = 'your_site';
```

### Issue: Frontend component not loading data
**Solution:** Verify API_BASE_URL is correct and server is running
```javascript
console.log('API_BASE_URL:', API_BASE_URL);
```

## Future Enhancements

### Planned Features
1. 📊 CSV export for comptage data
2. 📈 Power consumption analytics
3. 🔔 Alerts for meter anomalies
4. 📱 Mobile-optimized comptage entry
5. 🔄 Bulk import/export functionality
6. 📅 Scheduled meter reading reminders
7. 🏷️ Custom meter categorization
8. 📊 Power consumption reports

### Performance Optimizations
1. Add pagination for large comptage lists
2. Implement caching for frequently accessed data
3. Optimize SQL queries with better indexing
4. Add batch update endpoints
5. Implement lazy loading for comptage cards

---

**Last Updated:** 2025-10-16
**Version:** 1.0
**Author:** Site Automation Platform Team
