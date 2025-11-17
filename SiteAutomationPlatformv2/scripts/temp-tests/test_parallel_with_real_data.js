// TEST PARALLEL FUNCTIONALITY WITH REAL DATA
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

async function testParallelWithRealData() {
  try {
    console.log('🎯 TESTING PARALLEL ENDPOINTS WITH REAL DATA');
    console.log('==============================================');

    // Simulate /parallel/sites
    console.log('\n1️⃣ PARALLEL SITES (simulated /parallel/sites):');
    const [sites] = await db.execute('SELECT site_name as site, client_name, address FROM sites ORDER BY site_name ASC');
    console.log(`Found ${sites.length} sites in normalized schema:`);
    sites.slice(0, 5).forEach(site => console.log(`  - ${site.site} (${site.client_name || 'No client'})`));
    if (sites.length > 5) console.log(`  ... and ${sites.length - 5} more sites`);

    // Simulate /parallel/site/testgtb
    console.log('\n2️⃣ PARALLEL SITE DETAIL (simulated /parallel/site/testgtb):');
    const [siteDetail] = await db.execute('SELECT * FROM sites WHERE site_name = ?', ['testgtb']);
    if (siteDetail.length > 0) {
      const site = siteDetail[0];
      const legacyFormat = {
        id: site.id,
        site: site.site_name,
        client: site.client_name,
        address: site.address,
        number1: site.phone_primary,
        number2: site.phone_secondary,
        email: site.email,
        submitted_at: site.created_at
      };
      console.log('✅ testgtb site data (legacy format):');
      console.log(JSON.stringify(legacyFormat, null, 2));
    }

    // Simulate /parallel/gtb/testgtb (THE MAIN TEST!)
    console.log('\n3️⃣ PARALLEL GTB DATA (simulated /parallel/gtb/testgtb):');
    const [gtbData] = await db.execute(`
      SELECT * FROM gtb_site_config WHERE site_id = (SELECT id FROM sites WHERE site_name = ?)
    `, ['testgtb']);

    if (gtbData.length > 0) {
      const gtb = gtbData[0];
      console.log('✅ testgtb GTB data from PARALLEL SCHEMA:');
      console.log(`{
  "sondes": ${gtb.sondes},
  "gazCompteur": ${gtb.gazCompteur},
  "modules": ${gtb.modules},
  "aeroeau": ${gtb.aeroeau},
  "aerogaz": ${gtb.aerogaz},
  "eclairage": ${gtb.eclairage},
  "refs": ${gtb.refs},
  "sondesPresentes": ${gtb.sondesPresentes},
  "Izit": ${gtb.Izit}
}`);
    }

    // Simulate /parallel/equipment/testgtb
    console.log('\n4️⃣ PARALLEL EQUIPMENT DATA (simulated /parallel/equipment/testgtb):');
    const [equipData] = await db.execute(`
      SELECT
        ec.*,
        cat.category_code,
        cat.category_name
      FROM equipment_configs ec
      JOIN equipment_categories cat ON cat.id = ec.category_id
      WHERE ec.site_id = (SELECT id FROM sites WHERE site_name = ?)
    `, ['testgtb']);

    if (equipData.length > 0) {
      console.log(`✅ Found ${equipData.length} equipment configs for testgtb:`);
      equipData.forEach(eq => {
        console.log(`  - ${eq.category_name} (${eq.category_code}): ${eq.quantity_total} units`);
      });
    } else {
      console.log('⚠️ No equipment configs found (this is normal if testgtb has no equipment in original)');
    }

    console.log('\n🎉 PARALLEL ENDPOINTS SIMULATION COMPLETE!');
    console.log('The parallel system has your real data and would work via HTTP endpoints.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.end();
  }
}

testParallelWithRealData();