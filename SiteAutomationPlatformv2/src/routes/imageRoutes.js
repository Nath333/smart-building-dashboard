import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import FormData from 'form-data';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js'; // ✅ Use centralized database configuration

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config(); // ✅ Load env first

const router = express.Router(); // ✅ Define router first
router.use(express.json()); // ✅ Attach JSON middleware to router

const upload = multer({
  dest: path.join(__dirname, '../../uploads/'),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB for base64 overhead
});

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
let lastImage = null;

// ✅ Database connection is now imported from centralized config
// No need to create pool here - it's managed in src/config/database.js

function _isValidHttpUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function getNextSiteNumber() {
  const [rows] = await db.execute(`
    SELECT MAX(CAST(SUBSTRING(title, 5) AS UNSIGNED)) AS maxSite
    FROM image_sql
    WHERE title LIKE 'site%' AND LENGTH(title) > 4
  `);
  return (rows[0]?.maxSite || 0) + 1;
}





async function saveImageToDB(imageData) {
  const sql = `
  INSERT INTO image_sql (site, type, zone_name, title, url_viewer, url_thumb, url_medium, delete_url, datetime)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const values = [
  imageData.site || null,
  imageData.type || null,
  imageData.zone_name || null, // 👈 new zone field
  imageData.title || null,
  imageData.url || null,
  imageData.thumb?.url || null,
  imageData.medium?.url || null,
  imageData.delete_url || null,
  new Date(),
];

  await db.execute(sql, values);
}



// Routes
router.get('/', (req, res) => {
  res.send(`
    <h2>ImgBB Interface</h2>
    <form action="/images/upload-multiple" method="post" enctype="multipart/form-data">
      <input type="file" name="images" multiple required /><br><br>
      <button type="submit">Upload Multiple</button>
    </form>
    ${lastImage ? `<hr><h4>Last Image</h4><img src="${lastImage.url}" style="max-width:300px;" />` : ''}
  `);
});





router.post('/delete-imgbb', async (req, res) => {
  const { delete_url } = req.body;
  console.log('🧪 ImgBB delete request:', delete_url);

  if (!delete_url || typeof delete_url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid delete_url' });
  }

  try {
    // Extract imageId and hash from the delete_url
    const parts = delete_url.split('/');
    if (parts.length < 2) throw new Error('Invalid delete_url format');
    const imageId = parts[parts.length - 2];
    const imageHash = parts[parts.length - 1];

    console.log('🔍 Extracted imageId:', imageId, 'imageHash:', imageHash);

    const form = new FormData();
    form.append('pathname', `/${imageId}/${imageHash}`);
    form.append('action', 'delete');
    form.append('delete', 'image');
    form.append('from', 'resource');
    form.append('deleting[id]', imageId);
    form.append('deleting[hash]', imageHash);

    const response = await fetch('https://ibb.co/json', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
      }
    });

    const result = await response.json();
    console.log('📡 ImgBB deletion response:', result);

    if (result.success && result.success.message?.includes('deleted')) {
      console.log('✅ ImgBB deletion successful');
      res.json({ 
        data: { message: '✅ Image successfully deleted from ImgBB' }
      });
    } else if (result.error && result.error.message?.includes('not found')) {
      // Image already deleted or doesn't exist
      console.log('ℹ️ Image already deleted or never existed on ImgBB');
      res.json({ 
        data: { message: '✅ Image already deleted or never existed on ImgBB' }
      });
    } else {
      console.warn('⚠️ ImgBB deletion response unclear:', result);
      // Still treat as success to avoid blocking user workflow
      res.json({ 
        data: { message: '⚠️ ImgBB deletion status unclear, but proceeding' }
      });
    }
  } catch (err) {
    console.error('❌ Error during ImgBB deletion:', err);
    // Don't fail completely - treat network errors as successful deletions
    res.json({ 
      data: { message: '⚠️ ImgBB deletion failed due to network error, but treating as success' }
    });
  }
});



router.post('/delete-sql', async (req, res) => {
  const { delete_url } = req.body;
  console.log('🧪 SQL delete request:', delete_url);

  if (!delete_url || typeof delete_url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid delete_url' });
  }

  try {
    const [existing] = await db.execute(
      'SELECT * FROM image_sql WHERE delete_url = ?',
      [delete_url]
    );
    console.log('🔍 SQL match found:', existing);

    const [sqlResult] = await db.execute(
      'DELETE FROM image_sql WHERE delete_url = ?',
      [delete_url]
    );
    console.log('🧹 SQL DELETE result:', sqlResult);

    res.json({
      data: {
        message: 'Image deleted from SQL',
        deletedFromSQL: sqlResult.affectedRows,
      }
    });
  } catch (err) {
    console.error('❌ Error during SQL deletion:', err);
    res.status(500).json({ error: 'Server error during SQL deletion' });
  }
});

// ✅ NEW: Delete all images (grayscale + annotated) by image_id
router.post('/delete-sql-by-image-id', async (req, res) => {
  const { site, image_id, title } = req.body;
  console.log('🧪 SQL delete by image_id request:', { site, image_id, title });

  if (!site || !image_id) {
    return res.status(400).json({ error: 'Missing required fields: site and image_id' });
  }

  try {
    // Build query with optional title filter
    let query = 'DELETE FROM image_sql WHERE site = ? AND image_id = ?';
    let params = [site, image_id];

    if (title) {
      query += ' AND title = ?';
      params.push(title);
    }

    const [sqlResult] = await db.execute(query, params);
    console.log(`🧹 SQL DELETE by image_id result: ${sqlResult.affectedRows} rows deleted`);

    res.json({
      success: true,
      message: `Deleted ${sqlResult.affectedRows} image(s) with image_id: ${image_id}`,
      deletedCount: sqlResult.affectedRows
    });
  } catch (err) {
    console.error('❌ Error during SQL deletion by image_id:', err);
    res.status(500).json({ error: 'Server error during SQL deletion' });
  }
});





// Upload image to ImgBB only
router.post('/upload-imgbb', (req, res, next) => {
  console.log('🚀 POST /upload-imgbb - Request received');
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large', details: 'File must be under 10MB' });
      }
      return res.status(400).json({ error: 'File upload error', details: err.message });
    }
    console.log('✅ Multer processed file successfully');
    next();
  });
}, async (req, res) => {
  console.log('\n🔍 === ImgBB Upload Request Started ===');
  console.log('📥 Request body:', req.body);
  console.log('📎 File received:', req.file ? {
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  } : 'NO FILE');

  if (!req.file) {
    console.error('❌ ERROR: No file in request');
    return res.status(400).json({ error: 'No image uploaded' });
  }

  // Validate file exists
  try {
    const fileExists = await fs.access(req.file.path).then(() => true).catch(() => false);
    if (!fileExists) {
      console.error('❌ ERROR: File does not exist at path:', req.file.path);
      return res.status(500).json({ error: 'Uploaded file not found on server' });
    }
    console.log('✅ File exists on disk');
  } catch (err) {
    console.error('❌ ERROR: File access check failed:', err);
    return res.status(500).json({ error: 'File system error' });
  }

  try {
    console.log('📖 Reading file as base64...');
    let imageBase64 = await fs.readFile(req.file.path, 'base64');
    console.log(`✅ File read successfully (${imageBase64.length} chars)`);
    console.log('🔍 Raw first 50 chars:', imageBase64.substring(0, 50));

    // Decode base64 to check if it contains a data URI
    const decoded = Buffer.from(imageBase64, 'base64').toString('utf8', 0, 50);
    console.log('🔍 Decoded first 50 chars:', decoded);

    // If the decoded content starts with "data:image", it means the base64 contains an encoded data URI
    // We need to decode it, remove the data URI prefix, and re-encode
    if (decoded.startsWith('data:image')) {
      console.log('⚠️ Detected base64-encoded data URI, cleaning...');
      const fullDecoded = Buffer.from(imageBase64, 'base64').toString('utf8');
      const base64Match = fullDecoded.match(/^data:image\/\w+;base64,(.+)$/);
      if (base64Match) {
        imageBase64 = base64Match[1];
        console.log('✅ Extracted pure base64, new length:', imageBase64.length);
      }
    }

    console.log('🗑️ Cleaning up uploaded file...');
    await fs.unlink(req.file.path);
    console.log('✅ Temporary file deleted');

    const title = req.body.title || 'photo_materiel';
    console.log('📝 Using title:', title);

    // Check API key
    if (!IMGBB_API_KEY || IMGBB_API_KEY === 'undefined') {
      console.error('❌ ERROR: IMGBB_API_KEY is not set!');
      return res.status(500).json({ error: 'ImgBB API key not configured' });
    }
    console.log('🔑 API key present:', IMGBB_API_KEY.substring(0, 8) + '...');

    const formData = new URLSearchParams();
    formData.append('image', imageBase64);
    formData.append('name', title);

    const uploadUrl = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
    console.log('🌐 Sending request to ImgBB...');
    console.log('📏 Final base64 length:', imageBase64.length);
    console.log('🔍 Final first 50 chars:', imageBase64.substring(0, 50));

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('📡 ImgBB Response Status:', response.status, response.statusText);

    const result = await response.json();
    console.log('📦 ImgBB Response Body:', JSON.stringify(result, null, 2));

    if (!result.success) {
      console.error('❌ ImgBB upload failed!');
      console.error('❌ Error details:', result.error || result);
      return res.status(500).json({
        error: 'Upload to ImgBB failed',
        details: result.error || result,
        imgbbStatus: response.status
      });
    }

    const { url, delete_url } = result.data;
    console.log('✅ Upload successful!');
    console.log('   URL:', url);
    console.log('   Delete URL:', delete_url);
    console.log('🔍 === ImgBB Upload Request Completed ===\n');

    res.json({ url, delete_url });
  } catch (err) {
    console.error('❌ === CRITICAL ERROR in ImgBB Upload ===');
    console.error('❌ Error type:', err.constructor.name);
    console.error('❌ Error message:', err.message);
    console.error('❌ Error stack:', err.stack);

    // Check for specific error types
    if (err.code === 'ENOENT') {
      console.error('❌ File not found error - check file path');
      return res.status(500).json({
        error: 'File not found',
        details: err.message,
        path: req.file?.path
      });
    } else if (err.code === 'EACCES') {
      console.error('❌ Permission denied - check file/directory permissions');
      return res.status(500).json({
        error: 'Permission denied',
        details: err.message
      });
    } else if (err.name === 'FetchError') {
      console.error('❌ Network error - ImgBB may be unreachable');
      return res.status(500).json({
        error: 'Network error contacting ImgBB',
        details: err.message
      });
    }

    console.error('🔍 === End Error Details ===\n');

    res.status(500).json({
      error: 'Server error during ImgBB upload',
      details: err.message,
      type: err.constructor.name
    });
  }
});

/* 
router.post('/upload-sql', async (req, res) => {
  const { site, type, title, url_viewer, delete_url } = req.body;

  if (!site || !type || !url_viewer || !delete_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log('📝 Inserting image into SQL:', { site, type, url_viewer });

    const [result] = await db.execute(
      `INSERT INTO image_sql (site, type, title, url_viewer, delete_url)
       VALUES (?, ?, ?, ?, ?)`,
      [site, type, title, url_viewer, delete_url]
    );

    console.log('✅ SQL insert result:', result);

    res.json({ message: 'Saved to SQL', insertId: result.insertId });
  } catch (err) {
    console.error('❌ SQL insert error:', err);
    res.status(500).json({ error: 'Server error saving to SQL' });
  }
});

 */

router.post('/upload-sql', async (req, res) => {
  console.log('\n🔍 === SQL Image Upload Request Started ===');
  console.log('📥 Full request body:', JSON.stringify(req.body, null, 2));

  const {
    image_id, site, type, zone_name, title, comments, url_viewer, delete_url,
    shapes, url_thumb, url_medium,
    card_id, x, y, label, image_url, module_type,
    width, height,
    crop_transform_x, crop_transform_y,
    crop_transform_width, crop_transform_height,
    devis_name
  } = req.body;

  console.log('🔑 Key fields:', {
    site: site || 'MISSING',
    type: type || 'MISSING',
    zone_name: zone_name || 'NULL',
    title: title || 'MISSING',
    url_viewer: url_viewer ? (url_viewer.substring(0, 50) + '...') : 'MISSING',
    delete_url: delete_url ? 'present' : 'MISSING'
  });

  if (!site || !type || !url_viewer || !delete_url) {
    console.error('❌ Validation failed - missing required fields');
    return res.status(400).json({
      error: 'Missing required fields',
      received: { site, type, url_viewer: !!url_viewer, delete_url: !!delete_url }
    });
  }

  try {
    console.log('✅ Validation passed - proceeding with SQL upsert');

    // Step 1: If image_id exists, delete old entries for this image_id + type combination
    if (image_id) {
      const [deleteResult] = await db.execute(
        `DELETE FROM image_sql WHERE image_id = ? AND site = ? AND type = ?`,
        [image_id, site, type]
      );
      if (deleteResult.affectedRows > 0) {
        console.log(`🗑️ Deleted ${deleteResult.affectedRows} old ${type} image(s) for image_id: ${image_id}`);
      }
    }

    // Step 2: Insert new entry - using only fields that exist in image_sql table
    const [result] = await db.execute(
      `INSERT INTO image_sql (
        image_id, site, type, zone_name, title, url_viewer, delete_url,
        shapes, url_thumb, url_medium, datetime,
        card_id, x, y, label, image_url, comments, module_type,
        width, height,
        crop_transform_x, crop_transform_y,
        crop_transform_width, crop_transform_height,
        devis_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        image_id ?? null,
        site,
        type,
        zone_name ?? null,
        title ?? null,
        url_viewer,
        delete_url,
        JSON.stringify(shapes || []),
        url_thumb ?? null,
        url_medium ?? null,
        new Date(), // datetime
        card_id ?? null,
        x ?? null,
        y ?? null,
        label ?? null,
        image_url ?? url_viewer, // Use image_url if provided, otherwise url_viewer
        comments ?? null,
        module_type ?? null,
        width ?? null,
        height ?? null,
        crop_transform_x ?? null,
        crop_transform_y ?? null,
        crop_transform_width ?? null,
        crop_transform_height ?? null,
        devis_name ?? null
      ]
    );

    console.log('📊 Inserted with values:', {
      image_id: image_id ?? 'NULL',
      site,
      type,
      zone_name: zone_name ?? 'NULL',
      title: title ?? 'NULL',
      url_viewer: url_viewer ? '✅' : '❌',
      delete_url: delete_url ? '✅' : '❌'
    });

    console.log('✅ SQL upsert successful!');
    console.log('   Insert ID:', result.insertId);
    console.log('   Affected rows:', result.affectedRows);
    console.log('🔍 === SQL Image Upload Request Completed ===\n');

    res.json({ message: 'Saved to SQL', insertId: result.insertId });
  } catch (err) {
    console.error('❌ === CRITICAL ERROR in SQL Upload ===');
    console.error('❌ Error type:', err.constructor.name);
    console.error('❌ Error message:', err.message);
    console.error('❌ Error code:', err.code);
    console.error('❌ SQL state:', err.sqlState);
    console.error('❌ SQL message:', err.sqlMessage);
    console.error('❌ Error stack:', err.stack);

    // Log the problematic data
    console.error('❌ Attempted to insert:', {
      site, type, zone_name, title,
      url_length: url_viewer?.length,
      delete_url_length: delete_url?.length
    });

    console.error('🔍 === End Error Details ===\n');

    res.status(500).json({
      error: 'Server error saving to SQL',
      details: err.message,
      sqlMessage: err.sqlMessage,
      sqlCode: err.code
    });
  }
});





























router.post('/upload', upload.single('image'), async (req, res) => {
  console.log('Received upload request');
  if (!req.file) {
    console.error('❌ No file received');
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    const imageBase64 = await fs.readFile(req.file.path, 'base64');
    await fs.unlink(req.file.path);
    console.log('✅ File converted to base64 and deleted locally');

    const title = `photo_materiel`;
    const formData = new URLSearchParams();
    formData.append('image', imageBase64);
    formData.append('name', title);
const site = req.body.site || 'unknown';
const type = req.body.type || 'unknown';

    const uploadUrl = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
    const response = await fetch(uploadUrl, { method: 'POST', body: formData });
    const result = await response.json();
    console.log('📡 ImgBB response:', result);

    if (!result.success) throw new Error('Upload failed to ImgBB');

    lastImage = result.data;
await saveImageToDB({
  site,
  type, // 👈 include type here
  title,
  url: lastImage.url,
  thumb: { url: lastImage.thumb?.url },
  medium: { url: lastImage.medium?.url },
  delete_url: lastImage.delete_url,
});


    res.json({
  url: lastImage.url,
  delete_url: lastImage.delete_url,
});

  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'Upload failed', detail: err.message });
  }
});


router.post('/upload-multiple', upload.array('images', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).send("No images uploaded.");

  try {
    const startSiteNumber = await getNextSiteNumber();
    let currentSiteNumber = startSiteNumber;

    for (const file of req.files) {
      const imageBase64 = await fs.readFile(file.path, 'base64');
      await fs.unlink(file.path);

      const title = `site${currentSiteNumber++}`;
      const formData = new URLSearchParams();
      formData.append('image', imageBase64);
      formData.append('name', title);

      const uploadUrl = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!result.success) throw new Error("Upload failed");

      await saveImageToDB({
        title,
        url: result.data.url,
        thumb: { url: result.data.thumb?.url },
        medium: { url: result.data.medium?.url },
        delete_url: result.data.delete_url,
      });
    }

    res.send(`<p>Uploaded ${req.files.length} image(s) starting from site${startSiteNumber}</p><a href="/">Back</a>`);
  } catch {
    res.status(500).send("Upload failed");
  }
});




router.get('/images', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM image_sql ORDER BY datetime DESC LIMIT 20');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

router.post('/delete', async (req, res) => {
  console.log('🧪 Incoming request body:', req.body);

  const { delete_url } = req.body;

  if (!delete_url || typeof delete_url !== 'string') {
    console.warn('⚠️ Invalid or missing delete_url:', delete_url);
    return res.status(400).json({ error: 'Missing or invalid delete_url' });
  }

  try {
    console.log('🔗 Attempting to delete from ImgBB using URL:', delete_url);

    const imgBBResponse = await fetch(delete_url);

    if (!imgBBResponse.ok) {
      console.error('❌ ImgBB deletion failed. Status:', imgBBResponse.status);
      throw new Error('Failed to delete image on ImgBB');
    }

    console.log('✅ ImgBB deletion succeeded');

    console.log('🗂️ Attempting SQL DELETE for delete_url:', delete_url);
    const [sqlResult] = await db.execute(
      'DELETE FROM image_sql WHERE delete_url = ?',
      [delete_url]
    );

    console.log('🧹 SQL DELETE result:', sqlResult);

    res.json({
      message: 'Image deleted successfully',
      deletedFromSQL: sqlResult.affectedRows,
    });
  } catch (err) {
    console.error('❌ Server error during deletion:', err);
    res.status(500).json({ error: 'Server error during deletion' });
  }
});


// POST /images/upload-sql-vt
router.post('/upload-sql-vt', async (req, res) => {
  try {
    const { site, background_image_url, cards } = req.body;

    if (!site || !background_image_url || !Array.isArray(cards)) {
      return res.status(400).json({ error: 'Missing site, image URL, or cards array' });
    }

    const fixedTitle = 'photo_vt'; // fixed title
    const fixedType = 'VT'; // fixed title

    const insertQueries = cards.map(card => {
      const {
        id,
        x,
        y,
        label,
        imageUrl,
        comments,
        moduleType,
        width,
        height
      } = card; // intentionally not destructuring `title`

      return db.execute(
        `INSERT INTO image_sql (
          site, title,type, url_viewer, card_id, x, y, label, image_url, comments,
          module_type, width, height, datetime
        ) VALUES (?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          site,
          fixedTitle,
          fixedType,
          background_image_url,
          id || null,
          x ?? null,
          y ?? null,
          label || '',
          imageUrl || '',
          comments || '',
          moduleType || '',
          width ?? null,
          height ?? null,
          new Date()
        ]
      );
    });

    await Promise.all(insertQueries);
    res.json({ success: true, message: `${cards.length} cards saved for site: ${site}` });
  } catch (err) {
    console.error('❌ Error in /upload-sql-vt:', err);
    res.status(500).json({ error: 'Server error while saving cards and image' });
  }
});


router.post('/upload-sql-vt2', async (req, res) => {
  try {
    const {
      site,
      type,           // 'grayscale' or 'annotated'
      title = 'VT',
      url_viewer,
      delete_url,
      shapes = [],
    } = req.body;

    if (!site || !type || !url_viewer || !delete_url) {
      return res.status(400).json({ error: 'Missing required fields: site, type, url_viewer, or delete_url' });
    }

    const shapesJson = JSON.stringify(shapes);
    const datetime = new Date();

    console.log('📝 Saving to SQL:', {
      site,
      type,
      title,
      url_viewer,
      delete_url,
      shapes,
      datetime,
    });

    await db.execute(
      `INSERT INTO image_sql (
        site,
        type,
        title,
        url_viewer,
        delete_url,
        shapes,
        datetime
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [site, type, title, url_viewer, delete_url, shapesJson, datetime]
    );

    res.json({ success: true, message: `${type} image saved to SQL.` });
  } catch (err) {
    console.error('❌ SQL insert failed:', err);
    res.status(500).json({ error: 'Failed to save image metadata' });
  }
});

router.post('/delete-sql-vt2', async (req, res) => {
  try {
    const { site, title = 'VT' } = req.body;

    if (!site) {
      return res.status(400).json({ error: 'Missing site' });
    }

    console.log(`🔍 Searching for grayscale + annotated entries in SQL for site: ${site}, title: ${title}`);

    const [rows] = await db.execute(
      `SELECT type, delete_url FROM image_sql WHERE site = ? AND title = ?`,
      [site, title]
    );

    if (rows.length === 0) {
      console.warn('⚠️ No entries found in SQL.');
      return res.status(404).json({ error: 'No entries found for this site and title' });
    }

    const deleteFromImgBB = async (deleteUrl) => {
      try {
        const response = await fetch(deleteUrl, { method: 'GET' });
        return response.ok;
      } catch (err) {
        console.error('❌ Failed to delete from ImgBB:', err);
        return false;
      }
    };

    const deletionResults = await Promise.all(
      rows.map(async ({ type, delete_url }) => {
        if (!delete_url) return { type, success: false, reason: 'No delete_url' };

        const deleted = await deleteFromImgBB(delete_url);
        if (deleted) {
          console.log(`✅ Deleted ${type} from ImgBB`);
        } else {
          console.warn(`⚠️ Failed to delete ${type} from ImgBB`);
        }
        return { type, success: deleted };
      })
    );

    const [sqlResult] = await db.execute(
      `DELETE FROM image_sql WHERE site = ? AND title = ?`,
      [site, title]
    );

    res.json({
      success: true,
      deletedFromSQL: sqlResult.affectedRows,
      imgBBResults: deletionResults,
      message: 'Deleted grayscale and annotated images from ImgBB and SQL',
    });
  } catch (err) {
    console.error('❌ Error during /delete-sql-vt2:', err);
    res.status(500).json({ error: 'Internal server error during deletion' });
  }
});

router.post('/upload-sql-surface', async (req, res) => {
  try {
    const { cards } = req.body;

    if (!Array.isArray(cards)) {
      return res.status(400).json({ error: 'Invalid data format. Expected cards array.' });
    }

    console.log('📥 Received cards:', cards);

    // First, delete existing surface cards for this site to avoid duplicates
    if (cards.length > 0) {
      const site = cards[0].site;
      console.log('🗑️ Deleting existing surface cards for site:', site);
      await db.execute(
        'DELETE FROM image_sql WHERE site = ? AND title = ? AND type = ?',
        [site, 'surface', 'annotated']
      );
    }

    // Then insert new cards
    for (const card of cards) {
      const {
        site,
        title = 'surface',
        type, // should be 'annotated' 
        url_viewer,
        delete_url,
        shapes,
        datetime,
        card_id,
      } = card;

      if (!site || !type || !url_viewer || !delete_url) continue;

      // Handle shapes - it might already be a string from frontend
      const shapesJson = typeof shapes === 'string' ? shapes : JSON.stringify(shapes || []);

      console.log('🔍 About to insert with values:', {
        site, title, type, url_viewer, delete_url, shapesJson, datetime, card_id
      });

      await db.execute(
        `INSERT INTO image_sql (
          site, title, type,
          url_viewer, delete_url,
          shapes, datetime, card_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          site,
          title,
          type,
          url_viewer,
          delete_url,
          shapesJson,
          datetime ? new Date(datetime) : new Date(),
          card_id,
        ]
      );
    }

    res.json({ success: true, message: `${cards.length} cards saved (existing ones replaced).` });
  } catch (err) {
    console.error('❌ Error saving cards:', err);
    res.status(500).json({ error: 'Failed to save cards' });
  }
});

router.post('/delete-sql-surface', async (req, res) => {
  const { grayscale_delete_url, annotated_delete_url, site, title } = req.body;

  if (!grayscale_delete_url || !annotated_delete_url || !site || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const deleteFromImgBB = async (deleteUrl) => {
    try {
      const parts = deleteUrl.split('/');
      const imageId = parts[parts.length - 2];
      const imageHash = parts[parts.length - 1];

      const form = new FormData();
      form.append('pathname', `/${imageId}/${imageHash}`);
      form.append('action', 'delete');
      form.append('delete', 'image');
      form.append('from', 'resource');
      form.append('deleting[id]', imageId);
      form.append('deleting[hash]', imageHash);

      const response = await fetch('https://ibb.co/json', {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      });

      const result = await response.json();
      return result?.success;
    } catch (err) {
      console.error('❌ ImgBB deletion failed:', err);
      return false;
    }
  };

  try {
    const grayDeleted = await deleteFromImgBB(grayscale_delete_url);
    const annotatedDeleted = await deleteFromImgBB(annotated_delete_url);

    const [sqlResult] = await db.execute(
      `DELETE FROM image_sql WHERE site = ? AND title = ? AND type IN (?, ?)`,
      [site, title, 'grayscale', 'annotated']
    );

    res.json({
      success: true,
      deletedFromSQL: sqlResult.affectedRows,
      deletedFromImgBB: {
        grayscale: grayDeleted,
        annotated: annotatedDeleted,
      },
    });
  } catch (err) {
    console.error('❌ Error during full surface deletion:', err);
    res.status(500).json({ error: 'Server error during deletion' });
  }
});




router.post('/get-sql-images', async (req, res) => {
  const { site, title, zone_name } = req.body;
  // Include both regular types and comptage types
  const types = [
    'clim', 'aero', 'rooftop', 'eclairage',
    'clim_comptage', 'aero_comptage', 'rooftop_comptage', 'eclairage_comptage',
    'grayscale', 'annotated', 'surface', 'gtb_plan'
  ];

  console.log(`📥 Requête reçue pour les images SQL avec site: ${site}${title ? `, title: ${title}` : ''}${zone_name ? `, zone: ${zone_name}` : ''}`);

  try {
    let query, params;

    if (zone_name) {
      // Filter by site, type, and zone
      const placeholders = types.map(() => '?').join(', ');
      if (title) {
        query = `SELECT * FROM image_sql WHERE site = ? AND title = ? AND zone_name = ? AND type IN (${placeholders})`;
        params = [site, title, zone_name, ...types];
      } else {
        query = `SELECT * FROM image_sql WHERE site = ? AND zone_name = ? AND type IN (${placeholders})`;
        params = [site, zone_name, ...types];
      }
    } else if (title) {
      // Filter by both site and title (backward compatible)
      const placeholders = types.map(() => '?').join(', ');
      query = `SELECT * FROM image_sql WHERE site = ? AND title = ? AND type IN (${placeholders})`;
      params = [site, title, ...types];
    } else {
      // Filter by site only (backward compatibility)
      const placeholders = types.map(() => '?').join(', ');
      query = `SELECT * FROM image_sql WHERE site = ? AND type IN (${placeholders})`;
      params = [site, ...types];
    }

    const [results] = await db.execute(query, params);

    console.log(`✅ Images SQL trouvées pour site "${site}"${title ? ` avec title "${title}"` : ''}${zone_name ? ` zone "${zone_name}"` : ''} (${results.length} résultats)`);
    res.json(results);
  } catch (error) {
    console.error('❌ Erreur SQL lors de la récupération des images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/get-delete-url', async (req, res) => {
  try {
    const { site, title } = req.body;

    if (!site) {
      return res.status(400).json({ error: 'Missing site parameter' });
    }

    let query, params;
    
    if (title) {
      console.log(`🔍 Fetching delete URLs for site: ${site}, title: ${title}`);
      query = 'SELECT delete_url FROM image_sql WHERE site = ? AND title = ? AND delete_url IS NOT NULL';
      params = [site, title];
    } else {
      console.log(`🔍 Fetching all delete URLs for site: ${site}`);
      query = 'SELECT delete_url FROM image_sql WHERE site = ? AND delete_url IS NOT NULL';
      params = [site];
    }

    const [results] = await db.execute(query, params);
    const delete_urls = results.map(row => row.delete_url);
    
    console.log(`✅ Found ${delete_urls.length} delete URLs for site: ${site}${title ? ` with title: ${title}` : ''}`);
    res.json({ delete_urls });
  } catch (error) {
    console.error('❌ Error fetching delete URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});





// POST /images/update-shapes - Update shapes field for an existing image
router.post('/update-shapes', async (req, res) => {
  try {
    const { site, title, type, shapes, image_id } = req.body;

    if (!site || !title || !type || shapes === undefined) {
      return res.status(400).json({ error: 'Missing required fields: site, title, type, or shapes' });
    }

    console.log('📝 Updating shapes for:', { site, title, type, image_id });

    // Update the shapes field in image_sql
    const [result] = await db.execute(
      `UPDATE image_sql
       SET shapes = ?
       WHERE site = ? AND title = ? AND type = ? ${image_id ? 'AND image_id = ?' : ''}`,
      image_id ? [shapes, site, title, type, image_id] : [shapes, site, title, type]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    console.log(`✅ Updated shapes for ${site} / ${title} / ${type}${image_id ? ` / ${image_id}` : ''}`);
    res.json({ success: true, message: 'Shapes updated successfully' });
  } catch (err) {
    console.error('❌ Error updating shapes:', err);
    res.status(500).json({ error: 'Failed to update shapes' });
  }
});

export default router;
