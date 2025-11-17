# Site Automation Platform - Architecture Diagram

**Last Updated**: October 15, 2025
**Version**: 2.0 (Post-Cleanup)

---

## 📐 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ SiteInfo   │  │ Equipment  │  │ VisualPlan │  │ Devis      │       │
│  │ Page       │→ │ Page       │→ │ Page       │→ │ Page       │       │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │
│         ↓               ↓               ↓               ↓               │
│    React Router (SPA Navigation with Ant Design Tabs)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER (Node.js/Express)                    │
│                         Port: 4001                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Route Middleware                              │   │
│  │  - CORS (cross-origin support)                                   │   │
│  │  - Helmet (security headers)                                     │   │
│  │  - Morgan (request logging)                                      │   │
│  │  - JSON Parser (10MB limit)                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                ↓                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ mainRoutes  │  │ imageRoutes │  │ devisRoutes │  │ migration   │  │
│  │ (core API)  │  │ (/images/*) │  │ (/devis/*)  │  │ Routes      │  │
│  │ /save-page1 │  │ upload      │  │ save-devis  │  │ (/migrate/*) │  │
│  │ /get-page2  │  │ get-sql     │  │ get-devis   │  │             │  │
│  │ /save_page3 │  │ delete      │  │ list-devis  │  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│         ↓                 ↓                 ↓                 ↓          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │           Database Access Layer (DAL) & Adapters                 │  │
│  │  - formSqlAdapter (legacy ↔ normalized transformation)           │  │
│  │  - equipmentDAL (equipment CRUD operations)                      │  │
│  │  - gtbConfigDAL (GTB configuration management)                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                      MYSQL DATABASE (Normalized Schema)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ sites        │  │ equipment_*  │  │ devis        │                 │
│  │ - id         │  │ - aerotherme │  │ - site_name  │                 │
│  │ - site_name  │  │ - climate    │  │ - devis_name │                 │
│  │ - client     │  │ - rooftop    │  │ - equipment  │                 │
│  │ - contact    │  │ - lighting   │  │ - quantities │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ image_sql    │  │ visual_pos   │  │ gtb_config   │                 │
│  │ - image urls │  │ - positions  │  │ - modules    │                 │
│  │ - metadata   │  │ - transforms │  │ - references │                 │
│  │ - delete_url │  │ - page_type  │  │ - counts     │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                      IMGBB API (External Image CDN)                      │
│  - Image upload endpoint                                                 │
│  - Returns: url, delete_url, thumbnail                                   │
│  - Rate limited: 5MB max file size                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Frontend Architecture

```
src/
├── App.jsx                      # Root component with routing
│   └── React Router + Ant Design Tabs
│
├── pages/                       # 🎯 Page-level components (5 pages)
│   ├── SiteInfoPage.jsx         # Page 1: Site basic information
│   ├── EquipmentPage.jsx        # Page 2: Equipment configuration
│   │   └── equipment/           # Page 2 subcomponents
│   │       ├── EditableCard.jsx
│   │       ├── ZoneManagementModal.jsx
│   │       ├── CategoryInputConfig.jsx
│   │       └── constants.js     ✅ Fixed: .jsx → .js
│   ├── VisualPlanPage.jsx       # Page 3: Visual plan editor
│   │   └── VisualPlan/          ✅ Renamed: vtPlan → VisualPlan
│   │       ├── VisualPlanDragArea.jsx
│   │       ├── Icon/
│   │       │   └── VisualPlanLegend.jsx
│   │       ├── imageUtils.js
│   │       └── visualPlanUpload.js
│   ├── DevisPage.jsx            # Page 4: Quote/devis management
│   └── GtbConfigPage.jsx        # Page 5: GTB module configuration
│
├── components/                  # 🧩 Reusable components
│   ├── common/                  # Shared UI components
│   │   ├── ImageCropperModal.jsx
│   │   ├── MultiImageManager.jsx
│   │   ├── MultiImagePlanPage.jsx
│   │   ├── FormCard.jsx
│   │   ├── ActionButtons.jsx
│   │   └── PageHeader.jsx
│   ├── icons/                   # Icon system
│   │   ├── BaseIcon.jsx
│   │   ├── IconFactory.jsx
│   │   ├── IconRegistry.js
│   │   ├── UniversalLegend.jsx
│   │   └── LegacyWrappers/      # 21 icon wrappers
│   └── layout/                  # Layout components
│       ├── PageLayout.jsx
│       ├── layoutConstants.js
│       └── ButtonStyles.js
│
├── api/                         # 📡 API client layer
│   ├── config.js                # API configuration
│   ├── formDataApi.js           # Site & form operations
│   ├── equipmentDataApi.js      # Equipment operations
│   ├── equipmentApiV2.js        # ⚠️ Consolidate with above
│   ├── gtbDataApi.js            # GTB operations
│   ├── visualPlanApi.js         # Visual plan operations
│   ├── imageApi.js              # Image operations
│   ├── optimizedApi.js          # ⚠️ Remove - redundant
│   ├── compatibilityWrapper.js  # ⚠️ Remove - redundant
│   └── smartCompatibilityApi.js # ⚠️ Remove - redundant
│
├── hooks/                       # ⚛️ Custom React hooks
│   ├── useSiteContext.js        # Site context management
│   ├── usePersistedState.js     # LocalStorage persistence
│   ├── useCardManager.js        # Surface plan card state
│   ├── usePageData.js           # Page data fetching
│   └── useOptimizedWorkflow.js  # Optimized data flow
│
├── utils/                       # 🔧 Utility functions
│   ├── siteContext.js           # Site context helpers
│   └── moduleStyles.jsx         # Module styling utilities
│
└── config/                      # ⚙️ Configuration
    ├── app.config.js            # Centralized app config
    └── database.js              # Database connection pool
```

---

## 🗄️ Backend Architecture

```
server.js (451 lines)            # 🎯 Main Express application
├── Middleware Stack
│   ├── CORS
│   ├── Helmet (security)
│   ├── Morgan (logging)
│   ├── JSON parser (10MB limit)
│   └── Error handlers
│
├── Route Registration
│   ├── /images/* → imageRoutes
│   ├── /migrate/* → migrationRoutes
│   ├── /devis/* → devisRoutes
│   └── /* → mainRoutes (core API)
│
└── Direct Endpoints (server.js)
    ├── /save-devis              # Devis CRUD
    ├── /get-devis
    ├── /list-devis
    ├── /delete-devis
    ├── /api/equipment-counts/:site
    ├── /api/visual-positions/*  # Icon positioning
    └── /images/get-delete-url

src/routes/
├── mainRoutes.js                ✅ Renamed: completeParallelEndpoints
│   ├── POST /save-page1         # Site info
│   ├── POST /get-page1
│   ├── POST /list-sites
│   ├── POST /save_page2         # Equipment
│   ├── POST /get-page2
│   ├── POST /save_page3         # GTB config
│   ├── POST /get-page3
│   ├── GET  /form_sql/:site
│   └── PUT  /update-position
│
├── imageRoutes.js (956 lines)
│   ├── POST /images/upload
│   ├── POST /images/save-to-sql
│   ├── POST /images/get-sql-images
│   ├── POST /images/delete-from-sql
│   └── DELETE /images/delete-from-imgbb
│
├── devisRoutes.js (192 lines)
│   └── Additional devis routes (future)
│
├── migrationRoutes.js (78 lines)
│   └── Database migration utilities
│
└── archive/                     ✅ Moved 5 redundant files
    ├── parallelEndpoints.js
    ├── simpleparallelEndpoints.js
    ├── optimizedEndpoints.js
    ├── ultraOptimizedParallelEndpoints.js
    └── parallelImageRoutes.js

database/
├── adapters/                    # Data transformation layer
│   └── formSqlAdapter.js        # Legacy ↔ Normalized conversion
│
├── dal/                         # Data Access Layer
│   ├── equipmentDAL.js          # Equipment CRUD
│   └── gtbConfigDAL.js          # GTB configuration CRUD
│
├── migrations/                  # Database migrations
│   ├── 03_create_normalized_tables.sql
│   ├── 04_migrate_data.sql
│   └── backup_before_migration.sql
│
└── archive/                     # Historical migration files
```

---

## 🔄 Data Flow Diagram

### Page 1: Site Info Flow
```
User Input → SiteInfoPage → formDataApi.saveSiteInfo()
                                    ↓
                            POST /save-page1
                                    ↓
                            mainRoutes handler
                                    ↓
                        INSERT/UPDATE sites table
                                    ↓
                        Response: { message: "success" }
```

### Page 2: Equipment Flow
```
User Config → EquipmentPage → formDataApi.saveEquipment()
                                    ↓
                            POST /save_page2
                                    ↓
                        formSqlAdapter.saveToBothStructures()
                                    ↓
              ┌─────────────────────┴─────────────────────┐
              ↓                                           ↓
    equipment_aerotherme                      equipment_climate
    equipment_rooftop                         equipment_lighting
              └─────────────────────┬─────────────────────┘
                                    ↓
                        Response: { success: true }
```

### Page 3: Visual Plan Flow
```
User Upload → VisualPlanPage → ImageCropperModal
                                    ↓
                            Crop & Generate Grayscale
                                    ↓
                            uploadToImgBB(image)
                                    ↓
                        ImgBB API (external)
                                    ↓
                    Returns: { url, delete_url }
                                    ↓
                            POST /images/save-to-sql
                                    ↓
                    Save metadata to image_sql table
                                    ↓
                User drags icons → positions array
                                    ↓
                POST /api/visual-positions/save
                                    ↓
                Save to visual_positions table
```

### Page 4: Devis Flow
```
User Input → DevisPage → Calculate equipment per zone
                                    ↓
                            POST /save-devis
                                    ↓
                        UPSERT devis table
                            (site, devis_name, equipment_type,
                             zone, existing_count, to_install_count)
                                    ↓
                        Response: { success: true }
```

### Page 5: GTB Config Flow
```
User Selection → GtbConfigPage → Select modules & quantities
                                    ↓
                            POST /save_page3
                                    ↓
                        gtbConfigDAL.saveConfiguration()
                                    ↓
                        Save to gtb_modules table
                        Save to gtb_references table
                                    ↓
                        Response: { success: true }
```

---

## 🗃️ Database Schema (Simplified)

```sql
-- Core site information
sites
├── id (PK)
├── site_name (UNIQUE)
├── client_name
├── address
├── phone_primary
├── phone_secondary
└── email

-- Equipment configurations (per category)
equipment_aerotherme
equipment_climate
equipment_rooftop
equipment_lighting
├── id (PK)
├── site_name (FK → sites)
├── zone_* (JSON or VARCHAR)
├── nb_* (INT - quantities)
├── type_* (VARCHAR)
├── coffret_* (VARCHAR)
└── comments (TEXT)

-- Image metadata
image_sql
├── id (PK)
├── site (FK → sites.site_name)
├── type (VARCHAR: 'vt_plan', 'gtb_plan', etc.)
├── title (VARCHAR)
├── url_viewer (VARCHAR - ImgBB URL)
├── delete_url (VARCHAR - ImgBB delete URL)
├── shapes (JSON - icon positions)
├── card_id (INT - for surface plans)
└── datetime (TIMESTAMP)

-- Icon positions (normalized)
visual_positions
├── id (PK)
├── site_name (FK → sites)
├── page_type (VARCHAR: 'vt_plan', 'gtb_plan')
├── image_id (INT - nullable)
├── element_id (VARCHAR - icon id)
├── pos_x (DECIMAL)
└── pos_y (DECIMAL)

-- GTB configuration
gtb_modules
├── id (PK)
├── site_name (FK → sites)
├── module_type (VARCHAR)
├── quantity (INT)
└── references (JSON array)

-- Devis/quotes
devis
├── id (PK)
├── site_name (FK → sites)
├── devis_name (VARCHAR)
├── equipment_type (VARCHAR)
├── zone_name (VARCHAR)
├── existing_count (INT)
├── to_install_count (INT)
└── UNIQUE KEY (site_name, devis_name, equipment_type, zone_name)
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│ 1. Helmet.js                                                 │
│    - X-Frame-Options: DENY                                   │
│    - X-Content-Type-Options: nosniff                         │
│    - Strict-Transport-Security                               │
│                                                              │
│ 2. CORS Configuration                                        │
│    - Controlled origin access                                │
│    - Credentials handling                                    │
│                                                              │
│ 3. Input Validation                                          │
│    - Site name required & trimmed                            │
│    - File size limits (5MB for images, 10MB for JSON)        │
│    - Type checking on all inputs                             │
│                                                              │
│ 4. SQL Injection Prevention                                  │
│    - Parameterized queries (mysql2 prepared statements)      │
│    - No raw SQL string concatenation                         │
│                                                              │
│ 5. Error Handling                                            │
│    - Try-catch blocks on all routes                          │
│    - Sanitized error messages to client                      │
│    - Detailed server-side logging                            │
│                                                              │
│ 6. Rate Limiting (future)                                    │
│    - express-rate-limit configured but not active            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Performance Characteristics

| Metric | Current | Target |
|--------|---------|--------|
| **Backend Response Time** | ~10-50ms | <100ms |
| **Frontend Load Time** | ~1-2s | <3s |
| **Database Query Time** | ~5-20ms | <50ms |
| **Image Upload Time** | ~2-5s | <10s |
| **Test Suite Time** | 75-85ms | <500ms |
| **Bundle Size** | ~800KB | <1MB |

---

## 🚀 Deployment Architecture (Production)

```
┌──────────────────────────────────────────────────────────────┐
│                        Load Balancer                          │
│                    (nginx or cloud LB)                        │
└──────────────────────┬───────────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            ↓                     ↓
┌───────────────────┐  ┌───────────────────┐
│  Frontend (Vite)  │  │  Backend (Node)   │
│  - Static assets  │  │  - Express API    │
│  - Port: 5177     │  │  - Port: 4001     │
│  - React SPA      │  │  - WebSocket      │
└───────────────────┘  └─────────┬─────────┘
                                 │
                       ┌─────────┴─────────┐
                       ↓                   ↓
              ┌────────────────┐  ┌────────────────┐
              │ MySQL Database │  │ ImgBB CDN      │
              │ - Primary      │  │ - Image storage│
              │ - Replica (RO) │  │ - Global CDN   │
              └────────────────┘  └────────────────┘
```

---

## 🎯 Key Design Patterns

### 1. **Site-Centric Architecture**
Every operation is tied to a `site_name` identifier for data isolation.

### 2. **Progressive Disclosure**
Users move through a logical sequence: Site Info → Equipment → Visual → Devis → GTB.

### 3. **Offline-First**
LocalStorage caching allows continued work during connectivity issues.

### 4. **Adapter Pattern**
`formSqlAdapter` transforms between legacy flat structure and normalized schema.

### 5. **Repository Pattern**
DAL (Data Access Layer) encapsulates database operations.

### 6. **Factory Pattern**
`IconFactory` dynamically creates icon components.

---

**Last Updated**: October 15, 2025
**Version**: 2.0 (Post-Cleanup)
**Status**: Production-Ready (B+ Grade)
