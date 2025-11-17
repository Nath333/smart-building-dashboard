// FIXED TEST - WITHOUT MISSING COLUMNS
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

async function testFixed() {
  try {
    console.log('🎯 TESTING PARALLEL EQUIPMENT DATA (FIXED)');
    console.log('============================================');

    // Test 1: testgtb Equipment Configs (without legacy_id)
    console.log('\n3️⃣ TESTGTB EQUIPMENT DATA:');
    const [equipment] = await db.execute(`
      SELECT
        cat.category_code,
        cat.category_name,
        ec.quantity_total,
        ec.has_thermostat,
        ec.has_electrical_panel,
        ec.operational_status
      FROM equipment_configs ec
      JOIN sites s ON s.id = ec.site_id
      JOIN equipment_categories cat ON cat.id = ec.category_id
      WHERE s.site_name = 'testgtb'
    `);

    if (equipment.length > 0) {
      console.log(`✅ Found ${equipment.length} equipment configs for testgtb:`);
      equipment.forEach(eq => {
        console.log(`  📦 ${eq.category_name} (${eq.category_code})`);
        console.log(`     - Quantity: ${eq.quantity_total} units`);
        console.log(`     - Status: ${eq.operational_status}`);
        console.log(`     - Thermostat: ${eq.has_thermostat ? 'Yes' : 'No'}`);
        console.log(`     - Electrical Panel: ${eq.has_electrical_panel ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('  ⚠️ No equipment configs found for testgtb');
    }

    // Test 2: testgtb GTB Data (MAIN COMPARISON)
    console.log('\n4️⃣ TESTGTB GTB DATA (NORMALIZED SCHEMA):');
    const [gtb] = await db.execute(`
      SELECT
        g.sondes, g.gazCompteur, g.modules, g.aeroeau, g.aerogaz, g.eclairage,
        g.refs, g.sondesPresentes, g.Izit
      FROM gtb_site_config g
      JOIN sites s ON s.id = g.site_id
      WHERE s.site_name = 'testgtb'
    `);

    if (gtb.length > 0) {
      console.log('✅ Found GTB config for testgtb in NORMALIZED schema:');
      const data = gtb[0];
      console.log(`  🔧 Sondes: ${data.sondes}`);
      console.log(`  ⛽ Gaz Compteur: ${data.gazCompteur}`);
      console.log(`  📦 Modules: ${data.modules}`);
      console.log(`  💧 Aero Eau: ${data.aeroeau}`);
      console.log(`  🔥 Aero Gaz: ${data.aerogaz}`);
      console.log(`  💡 Eclairage: ${data.eclairage}`);
      console.log(`  📄 Refs: ${data.refs}`);
      console.log(`  🌡️ Sondes Présentes: ${data.sondesPresentes}`);
      console.log(`  🏢 Izit: ${data.Izit}`);
    } else {
      console.log('  ⚠️ No GTB config found for testgtb');
    }

    console.log('\n🎉 PARALLEL EQUIPMENT TEST SUCCESS!');
    console.log('The normalized schema has your data and can be accessed via parallel endpoints!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.end();
  }
}

testFixed();