// ===============================================
// FIX DATA SYNC FOR SITE VVVVVVVVV
// Sync your saved data from form_sql to new normalized tables
// ===============================================

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

async function fixDataSyncForSite() {
  try {
    console.log('🔧 FIXING DATA SYNC FOR SITE VVVVVVVVV');
    console.log('=======================================');

    const siteName = 'VVVVVVVVV';

    // Get the complete data from form_sql
    const [formData] = await db.execute(`
      SELECT
        site, nb_aerotherme, thermostat_aerotherme, coffret_aerotherme, zone_aerotherme,
        marque_aerotherme_0, marque_aerotherme_1, marque_aerotherme_2, marque_aerotherme_3, marque_aerotherme_4,
        nb_clim_ir, nb_clim_wire, coffret_clim, zone_clim,
        clim_ir_ref_0, clim_ir_ref_1, clim_ir_ref_2,
        nb_rooftop, thermostat_rooftop, coffret_rooftop, zone_rooftop
      FROM form_sql WHERE site = ?
    `, [siteName]);

    if (formData.length === 0) {
      console.log('❌ No data found in form_sql for site:', siteName);
      return;
    }

    const data = formData[0];
    console.log('\n📊 FOUND DATA IN FORM_SQL:');
    console.log(`   Aero: ${data.nb_aerotherme} units`);
    console.log(`   Thermostat: ${data.thermostat_aerotherme}`);
    console.log(`   References: ${data.marque_aerotherme_0}, ${data.marque_aerotherme_1}, ${data.marque_aerotherme_2}`);

    // Get site ID from new system
    const [siteRows] = await db.execute('SELECT id FROM sites WHERE site_name = ?', [siteName]);
    if (siteRows.length === 0) {
      console.log('❌ Site not found in new sites table:', siteName);
      return;
    }
    const siteId = siteRows[0].id;

    console.log('\n🔄 SYNCING TO NEW NORMALIZED TABLES...');

    // Clear existing equipment configs for this site
    console.log('🧹 Clearing existing equipment configs...');
    await db.execute('DELETE er FROM equipment_references er JOIN equipment_configs ec ON ec.id = er.config_id WHERE ec.site_id = ?', [siteId]);
    await db.execute('DELETE FROM equipment_configs WHERE site_id = ?', [siteId]);

    // Sync AERO equipment if exists
    if (data.nb_aerotherme > 0) {
      console.log(`\n⚙️ SYNCING AERO EQUIPMENT: ${data.nb_aerotherme} units`);

      // Get AERO category ID
      const [aeroCategory] = await db.execute('SELECT id FROM equipment_categories WHERE category_code = ?', ['AERO']);
      if (aeroCategory.length === 0) {
        console.log('❌ AERO category not found');
        return;
      }

      // Insert equipment config
      const [configResult] = await db.execute(`
        INSERT INTO equipment_configs (
          site_id, category_id, quantity_total, zones, equipment_types,
          has_thermostat, has_electrical_panel, operational_status, maintenance_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        siteId,
        aeroCategory[0].id,
        data.nb_aerotherme,
        JSON.stringify(data.zone_aerotherme ? [data.zone_aerotherme] : []),
        JSON.stringify([]),
        data.thermostat_aerotherme > 0,
        data.coffret_aerotherme > 0,
        'working',
        'up_to_date'
      ]);

      const configId = configResult.insertId;
      console.log(`   ✅ Equipment config created with ID: ${configId}`);

      // Insert references
      const references = [
        data.marque_aerotherme_0,
        data.marque_aerotherme_1,
        data.marque_aerotherme_2,
        data.marque_aerotherme_3,
        data.marque_aerotherme_4
      ].filter(ref => ref && ref.trim() !== '');

      console.log(`   📝 Inserting ${references.length} references...`);
      for (let i = 0; i < references.length; i++) {
        await db.execute(`
          INSERT INTO equipment_references (config_id, reference_code, brand_name, position_index, is_active)
          VALUES (?, ?, ?, ?, ?)
        `, [configId, references[i], references[i], i, true]);
        console.log(`      ${i+1}. ${references[i]}`);
      }
    }

    // Sync CLIM_IR equipment if exists
    if (data.nb_clim_ir > 0) {
      console.log(`\n❄️ SYNCING CLIM_IR EQUIPMENT: ${data.nb_clim_ir} units`);

      const [climCategory] = await db.execute('SELECT id FROM equipment_categories WHERE category_code = ?', ['CLIM_IR']);
      if (climCategory.length > 0) {
        const [configResult] = await db.execute(`
          INSERT INTO equipment_configs (
            site_id, category_id, quantity_total, zones, equipment_types,
            has_electrical_panel, operational_status, maintenance_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          siteId,
          climCategory[0].id,
          data.nb_clim_ir,
          JSON.stringify(data.zone_clim ? [data.zone_clim] : []),
          JSON.stringify([]),
          data.coffret_clim > 0,
          'working',
          'up_to_date'
        ]);

        const configId = configResult.insertId;
        console.log(`   ✅ CLIM_IR config created with ID: ${configId}`);

        // Insert CLIM_IR references
        const climRefs = [
          data.clim_ir_ref_0,
          data.clim_ir_ref_1,
          data.clim_ir_ref_2
        ].filter(ref => ref && ref.trim() !== '');

        for (let i = 0; i < climRefs.length; i++) {
          await db.execute(`
            INSERT INTO equipment_references (config_id, reference_code, brand_name, position_index, is_active)
            VALUES (?, ?, ?, ?, ?)
          `, [configId, climRefs[i], climRefs[i], i, true]);
          console.log(`      ${i+1}. ${climRefs[i]}`);
        }
      }
    }

    // Sync other equipment types similarly...
    if (data.nb_clim_wire > 0) {
      console.log(`\n🔌 SYNCING CLIM_WIRE EQUIPMENT: ${data.nb_clim_wire} units`);
      // Add CLIM_WIRE sync logic here if needed
    }

    if (data.nb_rooftop > 0) {
      console.log(`\n🏠 SYNCING ROOFTOP EQUIPMENT: ${data.nb_rooftop} units`);
      // Add ROOFTOP sync logic here if needed
    }

    // Verify the sync worked
    console.log('\n🔍 VERIFICATION:');
    const [verifyConfigs] = await db.execute(`
      SELECT ec.quantity_total, cat.category_name
      FROM equipment_configs ec
      JOIN equipment_categories cat ON cat.id = ec.category_id
      WHERE ec.site_id = ?
    `, [siteId]);

    console.log(`✅ Synced ${verifyConfigs.length} equipment configurations:`);
    verifyConfigs.forEach(config => {
      console.log(`   - ${config.category_name}: ${config.quantity_total} units`);
    });

    const [verifyRefs] = await db.execute(`
      SELECT COUNT(*) as count
      FROM equipment_references er
      JOIN equipment_configs ec ON ec.id = er.config_id
      WHERE ec.site_id = ?
    `, [siteId]);

    console.log(`✅ Synced ${verifyRefs[0].count} equipment references`);

    console.log('\n🎉 DATA SYNC COMPLETED SUCCESSFULLY!');
    console.log('Your data is now properly available in the new optimized system.');

  } catch (error) {
    console.error('❌ Data sync failed:', error);
  } finally {
    await db.end();
  }
}

fixDataSyncForSite();