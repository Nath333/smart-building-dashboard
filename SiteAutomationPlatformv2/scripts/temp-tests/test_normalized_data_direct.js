// DIRECT TEST OF NORMALIZED SCHEMA DATA
// This bypasses server issues and tests the data directly

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'admin',
  database: process.env.DB_NAME || 'avancement',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

async function testNormalizedData() {
  try {
    console.log('🧪 TESTING NORMALIZED SCHEMA DATA DIRECTLY');
    console.log('==========================================');

    // Test 1: Equipment Categories
    console.log('\n1️⃣ EQUIPMENT CATEGORIES:');
    const [categories] = await db.execute('SELECT category_code, category_name FROM equipment_categories WHERE is_active = TRUE ORDER BY category_code');
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(cat => console.log(`  - ${cat.category_code}: ${cat.category_name}`));

    // Test 2: Sites
    console.log('\n2️⃣ SITES IN NORMALIZED SCHEMA:');
    const [sites] = await db.execute('SELECT site_name, client_name FROM sites ORDER BY site_name');
    console.log(`Found ${sites.length} sites:`);
    sites.forEach(site => console.log(`  - ${site.site_name} (${site.client_name || 'No client'})`));

    // Test 3: testgtb Equipment Configs
    console.log('\n3️⃣ TESTGTB EQUIPMENT DATA:');
    const [equipment] = await db.execute(`
      SELECT
        cat.category_code,
        cat.category_name,
        ec.quantity_total,
        ec.has_thermostat,
        ec.has_electrical_panel,
        ec.operational_status,
        ec.legacy_id
      FROM equipment_configs ec
      JOIN sites s ON s.id = ec.site_id
      JOIN equipment_categories cat ON cat.id = ec.category_id
      WHERE s.site_name = 'testgtb'
    `);

    if (equipment.length > 0) {
      console.log(`Found ${equipment.length} equipment configs for testgtb:`);
      equipment.forEach(eq => {
        console.log(`  - ${eq.category_name}: ${eq.quantity_total} units, Status: ${eq.operational_status}`);
        console.log(`    Thermostat: ${eq.has_thermostat}, Panel: ${eq.has_electrical_panel}, Legacy ID: ${eq.legacy_id}`);
      });
    } else {
      console.log('  No equipment configs found for testgtb');
    }

    // Test 4: testgtb GTB Data
    console.log('\n4️⃣ TESTGTB GTB DATA:');
    const [gtb] = await db.execute(`
      SELECT
        g.sondes, g.gazCompteur, g.modules, g.aeroeau, g.aerogaz, g.eclairage
      FROM gtb_site_config g
      JOIN sites s ON s.id = g.site_id
      WHERE s.site_name = 'testgtb'
    `);

    if (gtb.length > 0) {
      console.log('Found GTB config for testgtb:');
      const data = gtb[0];
      console.log(`  - Sondes: ${data.sondes}`);
      console.log(`  - Gaz Compteur: ${data.gazCompteur}`);
      console.log(`  - Modules: ${data.modules}`);
      console.log(`  - Aero Eau: ${data.aeroeau}`);
      console.log(`  - Aero Gaz: ${data.aerogaz}`);
      console.log(`  - Eclairage: ${data.eclairage}`);
    } else {
      console.log('  No GTB config found for testgtb');
    }

    console.log('\n✅ NORMALIZED SCHEMA TEST COMPLETE');
    console.log('==========================================');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.end();
  }
}

testNormalizedData();