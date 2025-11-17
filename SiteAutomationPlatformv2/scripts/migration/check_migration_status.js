// CHECK WHAT ACTUALLY GOT MIGRATED
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

async function checkMigrationStatus() {
  try {
    console.log('🔍 CHECKING MIGRATION STATUS');
    console.log('============================');

    // Check what's in each table
    const [sites] = await db.execute('SELECT COUNT(*) as count FROM sites');
    const [equipment] = await db.execute('SELECT COUNT(*) as count FROM equipment_configs');
    const [gtb] = await db.execute('SELECT COUNT(*) as count FROM gtb_site_config');
    const [categories] = await db.execute('SELECT COUNT(*) as count FROM equipment_categories');

    console.log(`📊 CURRENT COUNTS:`);
    console.log(`  - Sites: ${sites[0].count}`);
    console.log(`  - Equipment Configs: ${equipment[0].count}`);
    console.log(`  - GTB Configs: ${gtb[0].count}`);
    console.log(`  - Equipment Categories: ${categories[0].count}`);

    // Check if testgtb exists in sites
    const [testgtbSite] = await db.execute('SELECT * FROM sites WHERE site_name = ?', ['testgtb']);
    console.log(`\n🎯 TESTGTB IN SITES TABLE:`);
    if (testgtbSite.length > 0) {
      console.log(`  ✅ Found testgtb: ID ${testgtbSite[0].id}, Client: ${testgtbSite[0].client_name}`);
    } else {
      console.log(`  ❌ testgtb NOT found in sites table`);
    }

    // Check if testgtb has GTB data
    const [testgtbGTB] = await db.execute(`
      SELECT g.* FROM gtb_site_config g
      JOIN sites s ON s.id = g.site_id
      WHERE s.site_name = ?
    `, ['testgtb']);

    console.log(`\n🏗️ TESTGTB GTB DATA:`);
    if (testgtbGTB.length > 0) {
      const data = testgtbGTB[0];
      console.log(`  ✅ Found GTB config:`);
      console.log(`    - Sondes: ${data.sondes}`);
      console.log(`    - GazCompteur: ${data.gazCompteur}`);
      console.log(`    - Modules: ${data.modules}`);
      console.log(`    - Aeroeau: ${data.aeroeau}`);
      console.log(`    - Aerogaz: ${data.aerogaz}`);
      console.log(`    - Eclairage: ${data.eclairage}`);
    } else {
      console.log(`  ❌ No GTB config found for testgtb`);
    }

    // Check if testgtb has equipment data
    const [testgtbEquip] = await db.execute(`
      SELECT ec.*, cat.category_name
      FROM equipment_configs ec
      JOIN sites s ON s.id = ec.site_id
      JOIN equipment_categories cat ON cat.id = ec.category_id
      WHERE s.site_name = ?
    `, ['testgtb']);

    console.log(`\n🔧 TESTGTB EQUIPMENT DATA:`);
    if (testgtbEquip.length > 0) {
      console.log(`  ✅ Found ${testgtbEquip.length} equipment configs:`);
      testgtbEquip.forEach(eq => {
        console.log(`    - ${eq.category_name}: ${eq.quantity_total} units`);
      });
    } else {
      console.log(`  ❌ No equipment configs found for testgtb`);
    }

    // Show what sites DO have data
    const [sitesWithGTB] = await db.execute(`
      SELECT s.site_name, g.sondes, g.gazCompteur, g.aeroeau, g.aerogaz, g.eclairage
      FROM gtb_site_config g
      JOIN sites s ON s.id = g.site_id
      ORDER BY s.site_name
    `);

    console.log(`\n📋 ALL SITES WITH GTB DATA:`);
    if (sitesWithGTB.length > 0) {
      sitesWithGTB.forEach(site => {
        console.log(`  - ${site.site_name}: sondes:${site.sondes}, gaz:${site.gazCompteur}, aero:${site.aeroeau}/${site.aerogaz}, eclairage:${site.eclairage}`);
      });
    } else {
      console.log(`  ❌ No sites have GTB data in parallel schema`);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await db.end();
  }
}

checkMigrationStatus();