// FIX EQUIPMENT MIGRATION - POPULATE equipment_configs and equipment_references
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

async function fixEquipmentMigration() {
  try {
    console.log('🔧 FIXING EQUIPMENT MIGRATION');
    console.log('==============================');

    // Get all sites with actual equipment data
    const [sitesWithEquipment] = await db.execute(`
      SELECT
        site,
        nb_aerotherme, zone_aerotherme, type_aerotherme, thermostat_aerotherme, coffret_aerotherme,
        nb_clim_ir, nb_clim_wire, zone_clim, type_clim, coffret_clim,
        nb_rooftop, zone_rooftop, type_rooftop, thermostat_rooftop, coffret_rooftop,
        marque_aerotherme_0, marque_aerotherme_1, marque_aerotherme_2,
        clim_ir_ref_0, clim_ir_ref_1, clim_ir_ref_2
      FROM form_sql
      WHERE (nb_aerotherme > 0 OR nb_clim_ir > 0 OR nb_clim_wire > 0 OR nb_rooftop > 0)
    `);

    console.log(`Found ${sitesWithEquipment.length} sites with equipment data:`);
    sitesWithEquipment.forEach(site => {
      console.log(`  - ${site.site}: aero=${site.nb_aerotherme || 0}, clim_ir=${site.nb_clim_ir || 0}, clim_wire=${site.nb_clim_wire || 0}, rooftop=${site.nb_rooftop || 0}`);
    });

    if (sitesWithEquipment.length === 0) {
      console.log('⚠️ No sites have equipment data to migrate');
      console.log('This is normal if your sites only have GTB data (like testgtb)');
      return;
    }

    // Migrate each site's equipment data
    for (const siteData of sitesWithEquipment) {
      console.log(`\n🔧 Migrating equipment for: ${siteData.site}`);

      // Get site ID from parallel schema
      const [siteRows] = await db.execute('SELECT id FROM sites WHERE site_name = ?', [siteData.site]);
      if (siteRows.length === 0) {
        console.log(`  ❌ Site ${siteData.site} not found in sites table`);
        continue;
      }
      const siteId = siteRows[0].id;

      // Migrate AERO equipment
      if (siteData.nb_aerotherme > 0) {
        const [aeroCategory] = await db.execute('SELECT id FROM equipment_categories WHERE category_code = ?', ['AERO']);
        if (aeroCategory.length > 0) {
          await db.execute(`
            INSERT INTO equipment_configs (
              site_id, category_id, quantity_total, zones, equipment_types,
              has_thermostat, has_electrical_panel, operational_status, maintenance_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              quantity_total = VALUES(quantity_total),
              zones = VALUES(zones),
              equipment_types = VALUES(equipment_types),
              has_thermostat = VALUES(has_thermostat),
              has_electrical_panel = VALUES(has_electrical_panel)
          `, [
            siteId, aeroCategory[0].id, siteData.nb_aerotherme,
            JSON.stringify(siteData.zone_aerotherme ? [siteData.zone_aerotherme] : []),
            JSON.stringify(siteData.type_aerotherme ? [siteData.type_aerotherme] : []),
            siteData.thermostat_aerotherme > 0,
            siteData.coffret_aerotherme > 0,
            'working', 'up_to_date'
          ]);

          console.log(`    ✅ Added AERO: ${siteData.nb_aerotherme} units`);

          // Add references for AERO
          const [configRows] = await db.execute(`
            SELECT id FROM equipment_configs
            WHERE site_id = ? AND category_id = ?
          `, [siteId, aeroCategory[0].id]);

          if (configRows.length > 0) {
            const configId = configRows[0].id;

            // Add marque references
            for (let i = 0; i < 3; i++) {
              const marqueField = `marque_aerotherme_${i}`;
              if (siteData[marqueField]) {
                await db.execute(`
                  INSERT INTO equipment_references (config_id, reference_code, brand_name, position_index, is_active)
                  VALUES (?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    reference_code = VALUES(reference_code),
                    brand_name = VALUES(brand_name)
                `, [configId, siteData[marqueField], siteData[marqueField], i, true]);

                console.log(`      📝 Added reference: ${siteData[marqueField]}`);
              }
            }
          }
        }
      }

      // Migrate CLIM_IR equipment
      if (siteData.nb_clim_ir > 0) {
        const [climCategory] = await db.execute('SELECT id FROM equipment_categories WHERE category_code = ?', ['CLIM_IR']);
        if (climCategory.length > 0) {
          await db.execute(`
            INSERT INTO equipment_configs (
              site_id, category_id, quantity_total, zones, equipment_types,
              has_electrical_panel, operational_status, maintenance_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              quantity_total = VALUES(quantity_total),
              zones = VALUES(zones),
              equipment_types = VALUES(equipment_types),
              has_electrical_panel = VALUES(has_electrical_panel)
          `, [
            siteId, climCategory[0].id, siteData.nb_clim_ir,
            JSON.stringify(siteData.zone_clim ? [siteData.zone_clim] : []),
            JSON.stringify(siteData.type_clim ? [siteData.type_clim] : []),
            siteData.coffret_clim > 0,
            'working', 'up_to_date'
          ]);

          console.log(`    ✅ Added CLIM_IR: ${siteData.nb_clim_ir} units`);
        }
      }

      // Migrate ROOFTOP equipment
      if (siteData.nb_rooftop > 0) {
        const [rooftopCategory] = await db.execute('SELECT id FROM equipment_categories WHERE category_code = ?', ['ROOFTOP']);
        if (rooftopCategory.length > 0) {
          await db.execute(`
            INSERT INTO equipment_configs (
              site_id, category_id, quantity_total, zones, equipment_types,
              has_thermostat, has_electrical_panel, operational_status, maintenance_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              quantity_total = VALUES(quantity_total),
              zones = VALUES(zones),
              equipment_types = VALUES(equipment_types),
              has_thermostat = VALUES(has_thermostat),
              has_electrical_panel = VALUES(has_electrical_panel)
          `, [
            siteId, rooftopCategory[0].id, siteData.nb_rooftop,
            JSON.stringify(siteData.zone_rooftop ? [siteData.zone_rooftop] : []),
            JSON.stringify(siteData.type_rooftop ? [siteData.type_rooftop] : []),
            siteData.thermostat_rooftop > 0,
            siteData.coffret_rooftop > 0,
            'working', 'up_to_date'
          ]);

          console.log(`    ✅ Added ROOFTOP: ${siteData.nb_rooftop} units`);
        }
      }
    }

    // Final verification
    console.log('\n📊 FINAL EQUIPMENT COUNT:');
    const [finalCount] = await db.execute('SELECT COUNT(*) as count FROM equipment_configs');
    const [finalRefCount] = await db.execute('SELECT COUNT(*) as count FROM equipment_references');

    console.log(`✅ Equipment configs: ${finalCount[0].count}`);
    console.log(`✅ Equipment references: ${finalRefCount[0].count}`);

    if (finalCount[0].count > 0) {
      // Show what got migrated
      const [migrated] = await db.execute(`
        SELECT s.site_name, cat.category_name, ec.quantity_total
        FROM equipment_configs ec
        JOIN sites s ON s.id = ec.site_id
        JOIN equipment_categories cat ON cat.id = ec.category_id
        ORDER BY s.site_name, cat.category_name
      `);

      console.log('\n📋 MIGRATED EQUIPMENT:');
      migrated.forEach(eq => {
        console.log(`  - ${eq.site_name}: ${eq.category_name} (${eq.quantity_total} units)`);
      });
    }

  } catch (error) {
    console.error('❌ Equipment migration failed:', error);
  } finally {
    await db.end();
  }
}

fixEquipmentMigration();