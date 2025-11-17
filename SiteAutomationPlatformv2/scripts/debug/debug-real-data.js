import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'admin',
  database: process.env.DB_NAME || 'avancement',
});

const api = axios.create({
  baseURL: 'http://localhost:4001',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

console.log('🔍 Debugging Real Data Title Filtering');
console.log('====================================');

async function debugRealData() {
  try {
    // Step 1: Get all sites to find one with data
    console.log('📝 Step 1: Finding sites with image data...');
    const [sites] = await db.execute(`
      SELECT DISTINCT site 
      FROM image_sql 
      WHERE site IS NOT NULL AND site != '' 
      ORDER BY site 
      LIMIT 5
    `);
    
    if (sites.length === 0) {
      console.log('❌ No sites found with image data');
      return;
    }
    
    console.log(`   Found ${sites.length} sites with data:`);
    sites.forEach((row, i) => console.log(`   ${i+1}. "${row.site}"`));
    
    const testSite = sites[0].site;
    console.log(`\\n🎯 Using site: "${testSite}"`);
    
    // Step 2: See all images for this site
    console.log('\\n📝 Step 2: All images in database for this site...');
    const [allImages] = await db.execute(`
      SELECT id, site, title, type, url_viewer 
      FROM image_sql 
      WHERE site = ? 
      ORDER BY id DESC 
      LIMIT 10
    `, [testSite]);
    
    console.log(`   Found ${allImages.length} images in database:`);
    allImages.forEach((img, i) => {
      console.log(`   ${i+1}. id=${img.id}, title="${img.title}", type="${img.type}"`);
    });
    
    // Step 3: Test API without title filter
    console.log('\\n📝 Step 3: Testing API without title filter...');
    const apiAllResponse = await api.post('/images/get-sql-images', { 
      site: testSite 
    });
    console.log(`   API returned ${apiAllResponse.data.length} images:`);
    apiAllResponse.data.slice(0, 5).forEach((img, i) => {
      console.log(`   ${i+1}. id=${img.id}, title="${img.title}", type="${img.type}"`);
    });
    
    // Step 4: Test API with title="surface" filter
    console.log('\\n📝 Step 4: Testing API with title="surface" filter...');
    const apiSurfaceResponse = await api.post('/images/get-sql-images', { 
      site: testSite,
      title: 'surface'
    });
    console.log(`   API returned ${apiSurfaceResponse.data.length} images:`);
    apiSurfaceResponse.data.forEach((img, i) => {
      console.log(`   ${i+1}. id=${img.id}, title="${img.title}", type="${img.type}"`);
    });
    
    // Step 5: Check if there are actually any surface images
    console.log('\\n📝 Step 5: Direct SQL check for surface images...');
    const [surfaceImages] = await db.execute(`
      SELECT id, site, title, type 
      FROM image_sql 
      WHERE site = ? AND title = 'surface'
      LIMIT 5
    `, [testSite]);
    console.log(`   Database has ${surfaceImages.length} surface images:`);
    surfaceImages.forEach((img, i) => {
      console.log(`   ${i+1}. id=${img.id}, title="${img.title}", type="${img.type}"`);
    });
    
    // Analysis
    console.log('\\n📊 Analysis:');
    const apiWorking = apiSurfaceResponse.data.length === surfaceImages.length;
    console.log(`   API filtering matches SQL: ${apiWorking ? '✅' : '❌'}`);
    console.log(`   Database surface count: ${surfaceImages.length}`);
    console.log(`   API surface count: ${apiSurfaceResponse.data.length}`);
    
    if (!apiWorking) {
      console.log('\\n❌ API filtering is NOT working correctly!');
    } else {
      console.log('\\n✅ API filtering appears to be working');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    process.exit(0);
  }
}

debugRealData();