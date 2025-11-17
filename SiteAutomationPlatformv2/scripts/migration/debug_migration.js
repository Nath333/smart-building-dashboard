// DEBUG WHY MIGRATION FAILED
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

async function debugMigration() {
  try {
    console.log('🔍 DEBUGGING MIGRATION FAILURE');
    console.log('==============================');

    // Check original testgtb data
    const [originalData] = await db.execute('SELECT * FROM form_sql WHERE site = ?', ['testgtb']);

    if (originalData.length === 0) {
      console.log('❌ No data found in form_sql for testgtb');
      return;
    }

    const data = originalData[0];
    console.log('📊 ORIGINAL TESTGTB DATA IN FORM_SQL:');
    console.log(`  - sondes: ${data.sondes}`);
    console.log(`  - gazCompteur: ${data.gazCompteur}`);
    console.log(`  - modules: ${data.modules}`);
    console.log(`  - aeroeau: ${data.aeroeau}`);
    console.log(`  - aerogaz: ${data.aerogaz}`);
    console.log(`  - eclairage: ${data.eclairage}`);
    console.log(`  - nb_aerotherme: ${data.nb_aerotherme}`);
    console.log(`  - nb_clim_ir: ${data.nb_clim_ir}`);
    console.log(`  - nb_rooftop: ${data.nb_rooftop}`);

    // Check if testgtb site exists in normalized schema
    const [siteCheck] = await db.execute('SELECT id FROM sites WHERE site_name = ?', ['testgtb']);
    if (siteCheck.length === 0) {
      console.log('❌ testgtb site not found in sites table');
      return;
    }

    const siteId = siteCheck[0].id;
    console.log(`✅ testgtb site found with ID: ${siteId}`);

    // Test manual GTB insertion
    console.log('\n🧪 TESTING MANUAL GTB INSERTION:');

    // Check if GTB data qualifies for migration
    const hasGTBData = data.sondes || data.gazCompteur || data.modules || data.aeroeau > 0 || data.aerogaz > 0 || data.eclairage > 0;
    console.log(`GTB data qualification: ${hasGTBData ? 'YES' : 'NO'}`);

    if (hasGTBData) {
      try {
        // Convert gazCompteur "oui" -> 1
        const gazCompteurValue = (data.gazCompteur === 'oui' || data.gazCompteur === '1') ? 1 : 0;
        const sondesValue = data.sondes || 0;
        const modulesCount = data.modules ? (data.modules.split(',').length) : 0;

        console.log(`Converted values:`);
        console.log(`  - sondes: ${sondesValue}`);
        console.log(`  - gazCompteur: "${data.gazCompteur}" -> ${gazCompteurValue}`);
        console.log(`  - modules: "${data.modules}" -> count: ${modulesCount}`);

        // Try to insert GTB data manually
        await db.execute(`
          INSERT INTO gtb_site_config (
            site_id, refs, sondes, sondesPresentes, gazCompteur, Izit, modules,
            aeroeau, aerogaz, clim_filaire_simple, clim_filaire_groupe,
            Comptage_Froid, Comptage_Eclairage, eclairage
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            sondes = VALUES(sondes),
            gazCompteur = VALUES(gazCompteur),
            modules = VALUES(modules),
            aeroeau = VALUES(aeroeau),
            aerogaz = VALUES(aerogaz),
            eclairage = VALUES(eclairage)
        `, [
          siteId, 0, sondesValue, 0, gazCompteurValue, 0, modulesCount,
          data.aeroeau || 0, data.aerogaz || 0, 0, 0, 0, 0, data.eclairage || 0
        ]);

        console.log('✅ Manual GTB insertion successful!');

        // Verify it worked
        const [verifyGTB] = await db.execute('SELECT * FROM gtb_site_config WHERE site_id = ?', [siteId]);
        if (verifyGTB.length > 0) {
          const gtb = verifyGTB[0];
          console.log('✅ Verification - GTB data now in parallel schema:');
          console.log(`  - sondes: ${gtb.sondes}`);
          console.log(`  - gazCompteur: ${gtb.gazCompteur}`);
          console.log(`  - modules: ${gtb.modules}`);
          console.log(`  - aeroeau: ${gtb.aeroeau}`);
          console.log(`  - aerogaz: ${gtb.aerogaz}`);
          console.log(`  - eclairage: ${gtb.eclairage}`);
        }

      } catch (insertError) {
        console.error('❌ Manual GTB insertion failed:', insertError);
      }
    }

    // Test equipment insertion if there's equipment data
    if (data.nb_aerotherme > 0 || data.nb_clim_ir > 0 || data.nb_rooftop > 0) {
      console.log('\n🔧 TESTING EQUIPMENT INSERTION:');

      // Check if AERO category exists
      const [aeroCategory] = await db.execute('SELECT id FROM equipment_categories WHERE category_code = ?', ['AERO']);

      if (aeroCategory.length > 0 && data.nb_aerotherme > 0) {
        try {
          await db.execute(`
            INSERT INTO equipment_configs (
              site_id, category_id, quantity_total, zones, equipment_types,
              has_thermostat, has_electrical_panel, has_timer,
              operational_status, maintenance_status, comments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              quantity_total = VALUES(quantity_total)
          `, [
            siteId, aeroCategory[0].id, data.nb_aerotherme,
            JSON.stringify([]), JSON.stringify([]),
            false, false, false, 'unknown', 'unknown', 'Migrated from form_sql'
          ]);

          console.log(`✅ Added AERO equipment: ${data.nb_aerotherme} units`);
        } catch (equipError) {
          console.error('❌ Equipment insertion failed:', equipError);
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await db.end();
  }
}

debugMigration();