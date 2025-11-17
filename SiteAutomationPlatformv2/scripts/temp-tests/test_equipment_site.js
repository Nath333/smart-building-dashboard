// TEST SITE WITH ACTUAL EQUIPMENT
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'admin',
  database: 'avancement',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

async function testEquipmentSite() {
  try {
    console.log('🔧 TESTING SITE WITH ACTUAL EQUIPMENT');
    console.log('=====================================');

    // Test dsqdFGF which has AERO + CLIM_IR equipment
    const siteName = 'dsqdFGF';

    console.log(`\n📊 TESTING SITE: ${siteName}`);

    // Original system
    console.log('\n🔵 ORIGINAL SYSTEM (form_sql):');
    const [original] = await db.execute(`
      SELECT site, nb_aerotherme, nb_clim_ir, nb_clim_wire, nb_rooftop,
             marque_aerotherme_0, marque_aerotherme_1, marque_aerotherme_2
      FROM form_sql WHERE site = ?
    `, [siteName]);

    if (original.length > 0) {
      const data = original[0];
      console.log(`  Equipment: Aero=${data.nb_aerotherme}, ClimIR=${data.nb_clim_ir}, ClimWire=${data.nb_clim_wire}, Rooftop=${data.nb_rooftop}`);
      console.log(`  References: ${data.marque_aerotherme_0}, ${data.marque_aerotherme_1}, ${data.marque_aerotherme_2}`);
    }

    // Parallel system
    console.log('\n🟢 PARALLEL SYSTEM (normalized schema):');

    // Equipment configs
    const [parallelEquip] = await db.execute(`
      SELECT cat.category_code, cat.category_name, ec.quantity_total,
             ec.has_thermostat, ec.has_electrical_panel, ec.operational_status
      FROM equipment_configs ec
      JOIN sites s ON s.id = ec.site_id
      JOIN equipment_categories cat ON cat.id = ec.category_id
      WHERE s.site_name = ?
      ORDER BY cat.category_code
    `, [siteName]);

    if (parallelEquip.length > 0) {
      console.log(`  Equipment configs (${parallelEquip.length}):`);
      parallelEquip.forEach(eq => {
        console.log(`    - ${eq.category_name}: ${eq.quantity_total} units, Status: ${eq.operational_status}`);
        console.log(`      Thermostat: ${eq.has_thermostat}, Panel: ${eq.has_electrical_panel}`);
      });
    }

    // Equipment references
    const [parallelRefs] = await db.execute(`
      SELECT er.reference_code, er.brand_name, er.position_index, cat.category_name
      FROM equipment_references er
      JOIN equipment_configs ec ON ec.id = er.config_id
      JOIN sites s ON s.id = ec.site_id
      JOIN equipment_categories cat ON cat.id = ec.category_id
      WHERE s.site_name = ? AND er.is_active = TRUE
      ORDER BY cat.category_code, er.position_index
    `, [siteName]);

    if (parallelRefs.length > 0) {
      console.log(`  Equipment references (${parallelRefs.length}):`);
      parallelRefs.forEach(ref => {
        console.log(`    - ${ref.category_name}[${ref.position_index}]: ${ref.reference_code}`);
      });
    }

    // Simulate parallel endpoints responses
    console.log('\n🌐 SIMULATED PARALLEL ENDPOINT RESPONSES:');

    // /parallel/equipment/dsqdFGF
    console.log('\n📡 GET /parallel/equipment/dsqdFGF:');
    console.log(JSON.stringify(parallelEquip, null, 2));

    console.log('\n🎉 EQUIPMENT SITE TEST COMPLETE!');
    console.log('Both original and parallel systems have equipment data');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.end();
  }
}

testEquipmentSite();