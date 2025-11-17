// ✅ Import necessary packages
import express from 'express';         // Web framework
import cors from 'cors';               // Enables Cross-Origin Resource Sharing
import helmet from 'helmet';           // Adds basic security headers
import morgan from 'morgan';           // HTTP request logger
import dotenv from 'dotenv';           // Loads environment variables from .env file
import imageRoutes from './src/routes/imageRoutes.js'; // Custom routes for image handling
import migrationRoutes from './src/routes/migrationRoutes.js'; // Database migration routes
import mainRoutes from './src/routes/mainRoutes.js'; // Main API routes (site, equipment, GTB)
import devisRoutes from './src/routes/devisRoutes.js'; // Devis/quote management routes
import db from './src/config/database.js'; // ✅ Centralized database configuration

// ✅ Load environment variables
dotenv.config();

// ✅ Initialize Express app
const app = express();

// ✅ Middleware setup
app.use(cors());                               // Enable CORS for all routes
app.use(helmet());                             // Secure HTTP headers
app.use(morgan('dev'));                        // Log requests in 'dev' format

// Enhanced JSON parser with size limits and error handling
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    // Add request size tracking
    req.rawSize = buf.length;
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  verify: (req, res, buf) => {
    // Add request size tracking for URL-encoded
    req.rawSize = buf.length;
  }
}));

// Request size validation middleware
app.use((req, res, next) => {
  // Log large requests
  if (req.rawSize && req.rawSize > 5 * 1024 * 1024) { // 5MB
    console.warn(`⚠️ Large request: ${req.rawSize} bytes to ${req.path}`);
  }
  next();
});

// Global error handler for JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ JSON parsing error:', err.message);
    return res.status(400).json({
      error: 'Invalid JSON format',
      details: 'Request body contains malformed JSON'
    });
  }

  if (err.type === 'entity.too.large') {
    console.error('❌ Request too large:', err.message);
    return res.status(413).json({
      error: 'Request too large',
      details: 'Request size exceeds the allowed limit'
    });
  }

  next(err);
});

// ✅ Database connection is now imported from centralized config
// No need to create pool here - it's managed in src/config/database.js

// ⚠️ NOTE: Core site/equipment routes (save-page1, get-page1, save_page2, get-page2, list-sites)
// are now handled by mainRoutes.js to avoid duplication


// =====================================================
// PAGE 4 (Devis) - Save and Get Devis Data
// =====================================================

app.post('/save-devis', async (req, res) => {
  const { site, devisName = 'Devis Principal', devisData } = req.body;

  if (!site || typeof site !== 'string' || !site.trim()) {
    return res.status(400).json({ error: 'Le champ "site" est requis' });
  }

  if (!devisName || typeof devisName !== 'string' || !devisName.trim()) {
    return res.status(400).json({ error: 'Le nom du devis est requis' });
  }

  if (!devisData || typeof devisData !== 'object') {
    return res.status(400).json({ error: 'Les données de devis sont requises' });
  }

  console.log(`💾 [POST] /save-devis for site "${site}" - devis "${devisName}"`);

  try {
    // Insert/Update each equipment zone entry
    for (const [key, value] of Object.entries(devisData)) {
      // Parse key format: "Type::zone"
      const [equipmentType, zoneName] = key.split('::');

      if (!equipmentType || !zoneName) {
        console.warn(`⚠️ Skipping invalid key format: ${key}`);
        continue;
      }

      const { toInstall = 0, existing = 0 } = value;

      // UPSERT: Insert or update if exists
      await db.execute(
        `INSERT INTO devis (site_name, devis_name, equipment_type, zone_name, existing_count, to_install_count)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           existing_count = VALUES(existing_count),
           to_install_count = VALUES(to_install_count),
           updated_at = CURRENT_TIMESTAMP`,
        [site.trim(), devisName.trim(), equipmentType, zoneName, existing, toInstall]
      );
    }

    console.log(`✅ Saved devis "${devisName}" for site "${site}"`);
    res.status(200).json({
      message: 'Devis enregistré avec succès',
      success: true,
      devisName: devisName.trim()
    });
  } catch (err) {
    console.error('❌ Error saving devis:', err);
    res.status(500).json({
      error: 'Échec de l\'enregistrement du devis',
      details: err.message
    });
  }
});

app.post('/get-devis', async (req, res) => {
  const { site, devisName = 'Devis Principal' } = req.body;

  if (!site || typeof site !== 'string' || !site.trim()) {
    return res.status(400).json({ error: 'Invalid or missing site' });
  }

  console.log(`📥 [POST] /get-devis for site "${site}" - devis "${devisName}"`);

  try {
    const [rows] = await db.execute(
      'SELECT equipment_type, zone_name, existing_count, to_install_count FROM devis WHERE site_name = ? AND devis_name = ?',
      [site.trim(), devisName.trim()]
    );

    if (rows.length === 0) {
      console.log(`ℹ️ No devis data found for site "${site}" - devis "${devisName}"`);
      return res.json({ devisData: {} });
    }

    // Convert rows to devisData object with "Type::zone" keys
    const devisData = {};
    rows.forEach(row => {
      const key = `${row.equipment_type}::${row.zone_name}`;
      devisData[key] = {
        toInstall: row.to_install_count,
        existing: row.existing_count,
        zone: row.zone_name,
      };
    });

    console.log(`✅ Retrieved devis "${devisName}" for site "${site}" (${rows.length} entries)`);
    res.json({ devisData });
  } catch (err) {
    console.error('❌ Error fetching devis:', err);
    res.status(500).json({
      error: 'Échec de la récupération du devis',
      details: err.message
    });
  }
});

// List all devis for a site
app.post('/list-devis', async (req, res) => {
  const { site } = req.body;

  if (!site || typeof site !== 'string' || !site.trim()) {
    return res.status(400).json({ error: 'Invalid or missing site' });
  }

  console.log(`📋 [POST] /list-devis for site "${site}"`);

  try {
    const [rows] = await db.execute(
      `SELECT DISTINCT devis_name,
              COUNT(*) as equipment_count,
              SUM(to_install_count) as total_to_install,
              MAX(updated_at) as last_updated
       FROM devis
       WHERE site_name = ?
       GROUP BY devis_name
       ORDER BY last_updated DESC`,
      [site.trim()]
    );

    console.log(`✅ Found ${rows.length} devis for site "${site}"`);
    res.json({ devisList: rows });
  } catch (err) {
    console.error('❌ Error listing devis:', err);
    res.status(500).json({
      error: 'Échec de la récupération de la liste des devis',
      details: err.message
    });
  }
});

// Delete a devis
app.post('/delete-devis', async (req, res) => {
  const { site, devisName } = req.body;

  if (!site || typeof site !== 'string' || !site.trim()) {
    return res.status(400).json({ error: 'Invalid or missing site' });
  }

  if (!devisName || typeof devisName !== 'string' || !devisName.trim()) {
    return res.status(400).json({ error: 'Le nom du devis est requis' });
  }

  console.log(`🗑️ [POST] /delete-devis - site "${site}" - devis "${devisName}"`);

  try {
    const [result] = await db.execute(
      'DELETE FROM devis WHERE site_name = ? AND devis_name = ?',
      [site.trim(), devisName.trim()]
    );

    if (result.affectedRows === 0) {
      console.log(`⚠️ No rows affected - devis may not exist or already deleted`);
      return res.json({
        message: 'Devis supprimé avec succès',
        success: true,
        deletedCount: 0
      });
    }

    console.log(`✅ Deleted devis "${devisName}" for site "${site}" (${result.affectedRows} rows)`);
    res.json({
      message: 'Devis supprimé avec succès',
      success: true,
      deletedCount: result.affectedRows
    });
  } catch (err) {
    console.error('❌ Error deleting devis:', err);
    res.status(500).json({
      error: 'Échec de la suppression du devis',
      details: err.message
    });
  }
});

// Delete specific equipment entry from devis
app.post('/delete-devis-equipment', async (req, res) => {
  const { site, devisName, equipmentType, zoneName } = req.body;

  if (!site || !devisName || !equipmentType || !zoneName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log(`🗑️ [POST] /delete-devis-equipment - site "${site}" - devis "${devisName}" - ${equipmentType}::${zoneName}`);

  try {
    const [result] = await db.execute(
      'DELETE FROM devis WHERE site_name = ? AND devis_name = ? AND equipment_type = ? AND zone_name = ?',
      [site.trim(), devisName.trim(), equipmentType, zoneName]
    );

    console.log(`✅ Deleted equipment entry (${result.affectedRows} rows)`);
    res.json({
      message: 'Equipment entry deleted',
      success: true,
      deletedCount: result.affectedRows
    });
  } catch (err) {
    console.error('❌ Error deleting equipment entry:', err);
    res.status(500).json({
      error: 'Failed to delete equipment entry',
      details: err.message
    });
  }
});


// =====================================================
// PAGE 3 (Visual Plan) - Equipment Counts API
// =====================================================

// Get equipment counts for Page 3 icon generation
app.get('/api/equipment-counts/:siteName', async (req, res) => {
  const { siteName } = req.params;

  console.log(`📊 [GET] /api/equipment-counts/${siteName}`);

  try {
    // Fetch equipment counts from normalized tables
    const [aeroRows] = await db.execute(
      'SELECT zone_aerotherme, nb_aerotherme FROM equipment_aerotherme WHERE site_name = ?',
      [siteName]
    );

    const [climRows] = await db.execute(
      'SELECT zone_clim, nb_clim_ir, nb_clim_wire FROM equipment_climate WHERE site_name = ?',
      [siteName]
    );

    const [rooftopRows] = await db.execute(
      'SELECT zone_rooftop, nb_rooftop FROM equipment_rooftop WHERE site_name = ?',
      [siteName]
    );

    // Fetch lighting counts (count rows per zone - each row is one lighting unit)
    const [lightingRows] = await db.execute(
      'SELECT zone_eclairage, COUNT(*) as count FROM equipment_lighting WHERE site_name = ? GROUP BY zone_eclairage',
      [siteName]
    );

    // Fetch comptage counts from all 4 comptage tables
    const [comptageAero] = await db.execute(
      'SELECT zone, COUNT(*) as count FROM equipment_comptage_aerotherme WHERE site_name = ? GROUP BY zone',
      [siteName]
    );

    const [comptageClim] = await db.execute(
      'SELECT zone, COUNT(*) as count FROM equipment_comptage_climate WHERE site_name = ? GROUP BY zone',
      [siteName]
    );

    const [comptageRooftop] = await db.execute(
      'SELECT zone, COUNT(*) as count FROM equipment_comptage_rooftop WHERE site_name = ? GROUP BY zone',
      [siteName]
    );

    const [comptageLighting] = await db.execute(
      'SELECT zone, COUNT(*) as count FROM equipment_comptage_lighting WHERE site_name = ? GROUP BY zone',
      [siteName]
    );

    // Format response for Page 3 (includes equipment + comptage)
    const counts = {
      aerotherme: aeroRows.map(row => ({
        zone: row.zone_aerotherme,
        count: row.nb_aerotherme || 0
      })),
      clim_ir: climRows.map(row => ({
        zone: row.zone_clim,
        count: row.nb_clim_ir || 0
      })),
      clim_wire: climRows.map(row => ({
        zone: row.zone_clim,
        count: row.nb_clim_wire || 0
      })),
      rooftop: rooftopRows.map(row => ({
        zone: row.zone_rooftop,
        count: row.nb_rooftop || 0
      })),
      lighting: lightingRows.map(row => ({
        zone: row.zone_eclairage,
        count: row.count || 0
      })),
      comptage_aerotherme: comptageAero.map(row => ({
        zone: row.zone,
        count: row.count || 0
      })),
      comptage_climate: comptageClim.map(row => ({
        zone: row.zone,
        count: row.count || 0
      })),
      comptage_rooftop: comptageRooftop.map(row => ({
        zone: row.zone,
        count: row.count || 0
      })),
      comptage_lighting: comptageLighting.map(row => ({
        zone: row.zone,
        count: row.count || 0
      }))
    };

    console.log(`✅ Equipment + Comptage counts for ${siteName}:`, counts);
    res.json(counts);
  } catch (err) {
    console.error('❌ Error fetching equipment counts:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Save icon positions to visual_positions table
app.post('/api/visual-positions/save', async (req, res) => {
  const { siteName, pageType, positions, imageId } = req.body;

  console.log(`💾 [POST] /api/visual-positions/save for ${siteName} (${pageType}) - imageId: ${imageId || 'null'}`);

  if (!siteName || !pageType || !Array.isArray(positions)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Delete existing positions for this site, page type, and image
    if (imageId) {
      await db.execute(
        'DELETE FROM visual_positions WHERE site_name = ? AND page_type = ? AND image_id = ?',
        [siteName, pageType, imageId]
      );
    } else {
      await db.execute(
        'DELETE FROM visual_positions WHERE site_name = ? AND page_type = ? AND image_id IS NULL',
        [siteName, pageType]
      );
    }

    // Insert new positions
    if (positions.length > 0) {
      const values = positions.map(p => [siteName, pageType, imageId || null, p.id, p.x, p.y]);
      await db.query(
        'INSERT INTO visual_positions (site_name, page_type, image_id, element_id, pos_x, pos_y) VALUES ?',
        [values]
      );
    }

    console.log(`✅ Saved ${positions.length} positions for ${siteName} (image: ${imageId || 'default'})`);
    res.json({ success: true, count: positions.length });
  } catch (err) {
    console.error('❌ Error saving visual positions:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get icon positions from visual_positions table (with imageId)
app.get('/api/visual-positions/:siteName/:pageType/:imageId', async (req, res) => {
  const { siteName, pageType, imageId } = req.params;

  console.log(`📥 [GET] /api/visual-positions/${siteName}/${pageType}/${imageId}`);

  try {
    const [rows] = await db.execute(
      'SELECT element_id, pos_x, pos_y FROM visual_positions WHERE site_name = ? AND page_type = ? AND image_id = ?',
      [siteName, pageType, imageId]
    );

    const positions = rows.map(row => ({
      id: row.element_id,
      x: parseFloat(row.pos_x),
      y: parseFloat(row.pos_y)
    }));

    console.log(`✅ Retrieved ${positions.length} positions for ${siteName} (image: ${imageId})`);
    res.json(positions);
  } catch (err) {
    console.error('❌ Error fetching visual positions:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get icon positions from visual_positions table (default/no imageId)
app.get('/api/visual-positions/:siteName/:pageType', async (req, res) => {
  const { siteName, pageType } = req.params;

  console.log(`📥 [GET] /api/visual-positions/${siteName}/${pageType} (default)`);

  try {
    const [rows] = await db.execute(
      'SELECT element_id, pos_x, pos_y FROM visual_positions WHERE site_name = ? AND page_type = ? AND image_id IS NULL',
      [siteName, pageType]
    );

    const positions = rows.map(row => ({
      id: row.element_id,
      x: parseFloat(row.pos_x),
      y: parseFloat(row.pos_y)
    }));

    console.log(`✅ Retrieved ${positions.length} positions for ${siteName} (default)`);
    res.json(positions);
  } catch (err) {
    console.error('❌ Error fetching visual positions:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// =====================================================
// IMAGE MANAGEMENT APIs
// =====================================================

app.post('/images/get-delete-url', async (req, res) => {
  try {
    const { site, title } = req.body;

    if (!site || !title) {
      return res.status(400).json({ error: 'Missing site or title' });
    }

    const query = `
      SELECT delete_url FROM image_sql
      WHERE site = ? AND title = ?
      ORDER BY id DESC
    `;

    const [rows] = await db.execute(query, [site, title]);

    if (rows.length > 0) {
      const deleteUrls = rows.map(row => row.delete_url).filter(Boolean);
      console.log(`✅ Found ${deleteUrls.length} delete_urls`);
      res.json({ delete_urls: deleteUrls });
    } else {
      res.status(404).json({ message: 'No delete_urls found' });
    }
  } catch (err) {
    console.error('❌ SQL Error in get-delete-url:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// ROUTE REGISTRATION
// =====================================================
app.use('/images', imageRoutes); // Image upload/management
app.use('/migrate', migrationRoutes); // Database migration utilities
app.use('/devis', devisRoutes); // Quote/devis management
app.use('/', mainRoutes); // Main API routes (site, equipment, GTB, visual positions)

// =====================================================
// SERVER START
// =====================================================
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
