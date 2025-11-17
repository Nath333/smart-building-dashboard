// Test script to verify comptage data fetching
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'admin',
  database: process.env.DB_NAME || 'avancement2',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testComptage() {
  try {
    console.log('\n🔍 Testing comptage data fetch...\n');

    // Test 1: Check all sites in sites table
    const [sites] = await db.execute('SELECT site_name FROM sites WHERE site_name LIKE "%Chatillon%" ORDER BY site_name');
    console.log('📋 Sites matching "Chatillon":', sites.length);
    sites.forEach(s => console.log(`   - "${s.site_name}"`));

    // Test 2: Check comptage_lighting records
    console.log('\n📊 Checking equipment_comptage_lighting table:');
    const [comptage] = await db.execute('SELECT * FROM equipment_comptage_lighting WHERE site_name LIKE "%Chatillon%"');
    console.log(`   Found ${comptage.length} records`);
    comptage.forEach(c => {
      console.log(`   - ID: ${c.id}, Site: "${c.site_name}", Zone: ${c.zone}, Selection: ${c.selection_comptage}`);
    });

    // Test 3: Try exact match
    if (sites.length > 0) {
      const exactSiteName = sites[0].site_name;
      console.log(`\n🎯 Testing with exact site name: "${exactSiteName}"`);

      const [exactComptage] = await db.execute(
        'SELECT * FROM equipment_comptage_lighting WHERE site_name = ?',
        [exactSiteName]
      );
      console.log(`   Found ${exactComptage.length} comptage records for this exact site`);

      // Test 4: Check equipment_lighting
      const [lighting] = await db.execute(
        'SELECT * FROM equipment_lighting WHERE site_name = ?',
        [exactSiteName]
      );
      console.log(`   Found ${lighting.length} lighting equipment records`);
    }

    // Test 5: Check if there's an encoding mismatch
    console.log('\n🔤 Checking for encoding mismatches:');
    const [allComptage] = await db.execute('SELECT DISTINCT site_name FROM equipment_comptage_lighting');
    const [allSites] = await db.execute('SELECT DISTINCT site_name FROM sites');

    const comptageNames = new Set(allComptage.map(r => r.site_name));
    const siteNames = new Set(allSites.map(r => r.site_name));

    const orphanedComptage = [...comptageNames].filter(name => !siteNames.has(name));
    if (orphanedComptage.length > 0) {
      console.log('   ⚠️  Comptage records with no matching site:');
      orphanedComptage.forEach(name => console.log(`      - "${name}"`));
    } else {
      console.log('   ✅ All comptage records have matching sites');
    }

    await db.end();
    console.log('\n✅ Test complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testComptage();
