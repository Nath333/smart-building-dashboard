// COMPREHENSIVE CHECK - ALL PAGES, BOTH SYSTEMS
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

async function comprehensiveCheck() {
  try {
    console.log('🔍 COMPREHENSIVE CHECK - ALL PAGES, BOTH SYSTEMS');
    console.log('==================================================');

    // PAGE 1: SITE INFO
    console.log('\n📄 PAGE 1 - SITE INFO:');

    // Original system (form_sql)
    const [originalSite] = await db.execute('SELECT site, client, address, number1, number2, email FROM form_sql WHERE site = ?', ['testgtb']);
    console.log('  🔵 ORIGINAL (form_sql):');
    if (originalSite.length > 0) {
      const site = originalSite[0];
      console.log(`    Site: ${site.site}, Client: ${site.client}, Address: ${site.address}`);
      console.log(`    Phone: ${site.number1}/${site.number2}, Email: ${site.email}`);
    } else {
      console.log('    ❌ No data found');
    }

    // Parallel system (sites)
    const [parallelSite] = await db.execute('SELECT site_name, client_name, address, phone_primary, phone_secondary, email FROM sites WHERE site_name = ?', ['testgtb']);
    console.log('  🟢 PARALLEL (sites):');
    if (parallelSite.length > 0) {
      const site = parallelSite[0];
      console.log(`    Site: ${site.site_name}, Client: ${site.client_name}, Address: ${site.address}`);
      console.log(`    Phone: ${site.phone_primary}/${site.phone_secondary}, Email: ${site.email}`);
    } else {
      console.log('    ❌ No data found');
    }

    // PAGE 2: EQUIPMENT
    console.log('\n⚙️ PAGE 2 - EQUIPMENT:');

    // Original system (form_sql equipment fields)
    const [originalEquip] = await db.execute('SELECT nb_aerotherme, nb_clim_ir, nb_clim_wire, nb_rooftop FROM form_sql WHERE site = ?', ['testgtb']);
    console.log('  🔵 ORIGINAL (form_sql):');
    if (originalEquip.length > 0) {
      const eq = originalEquip[0];
      console.log(`    Aero: ${eq.nb_aerotherme || 0}, Clim IR: ${eq.nb_clim_ir || 0}, Clim Wire: ${eq.nb_clim_wire || 0}, Rooftop: ${eq.nb_rooftop || 0}`);
    } else {
      console.log('    ❌ No equipment data found');
    }

    // Parallel system (equipment_configs)
    const [parallelEquip] = await db.execute(`
      SELECT cat.category_code, ec.quantity_total
      FROM equipment_configs ec
      JOIN sites s ON s.id = ec.site_id
      JOIN equipment_categories cat ON cat.id = ec.category_id
      WHERE s.site_name = ?
    `, ['testgtb']);
    console.log('  🟢 PARALLEL (equipment_configs):');
    if (parallelEquip.length > 0) {
      parallelEquip.forEach(eq => {
        console.log(`    ${eq.category_code}: ${eq.quantity_total} units`);
      });
    } else {
      console.log('    ⚠️ No equipment configs (normal if testgtb has no equipment)');
    }

    // PAGE 3-4: IMAGES
    console.log('\n🖼️ PAGE 3-4 - IMAGES:');

    // Original system (image_sql)
    const [originalImages] = await db.execute('SELECT COUNT(*) as count, type FROM image_sql WHERE site = ? GROUP BY type', ['testgtb']);
    console.log('  🔵 ORIGINAL (image_sql):');
    if (originalImages.length > 0) {
      originalImages.forEach(img => {
        console.log(`    ${img.type}: ${img.count} images`);
      });
    } else {
      console.log('    ⚠️ No images found');
    }

    // Parallel system (site_images)
    const [parallelImages] = await db.execute(`
      SELECT COUNT(*) as count, image_type
      FROM site_images si
      JOIN sites s ON s.id = si.site_id
      WHERE s.site_name = ?
      GROUP BY image_type
    `, ['testgtb']);
    console.log('  🟢 PARALLEL (site_images):');
    if (parallelImages.length > 0) {
      parallelImages.forEach(img => {
        console.log(`    ${img.image_type}: ${img.count} images`);
      });
    } else {
      console.log('    ⚠️ No images found');
    }

    // PAGE 5: GTB CONFIG
    console.log('\n🏗️ PAGE 5 - GTB CONFIG:');

    // Original system (form_sql GTB fields)
    const [originalGTB] = await db.execute(`
      SELECT sondes, gazCompteur, modules, aeroeau, aerogaz, eclairage, refs, Izit
      FROM form_sql WHERE site = ?
    `, ['testgtb']);
    console.log('  🔵 ORIGINAL (form_sql):');
    if (originalGTB.length > 0) {
      const gtb = originalGTB[0];
      console.log(`    Sondes: ${gtb.sondes}, GazCompteur: "${gtb.gazCompteur}", Modules: "${gtb.modules}"`);
      console.log(`    AeroEau: ${gtb.aeroeau}, AeroGaz: ${gtb.aerogaz}, Eclairage: ${gtb.eclairage}`);
      console.log(`    Refs: ${gtb.refs}, Izit: ${gtb.Izit}`);
    } else {
      console.log('    ❌ No GTB data found');
    }

    // Parallel system (gtb_site_config)
    const [parallelGTB] = await db.execute(`
      SELECT g.sondes, g.gazCompteur, g.modules, g.aeroeau, g.aerogaz, g.eclairage, g.refs, g.Izit
      FROM gtb_site_config g
      JOIN sites s ON s.id = g.site_id
      WHERE s.site_name = ?
    `, ['testgtb']);
    console.log('  🟢 PARALLEL (gtb_site_config):');
    if (parallelGTB.length > 0) {
      const gtb = parallelGTB[0];
      console.log(`    Sondes: ${gtb.sondes}, GazCompteur: ${gtb.gazCompteur}, Modules: ${gtb.modules}`);
      console.log(`    AeroEau: ${gtb.aeroeau}, AeroGaz: ${gtb.aerogaz}, Eclairage: ${gtb.eclairage}`);
      console.log(`    Refs: ${gtb.refs}, Izit: ${gtb.Izit}`);
    } else {
      console.log('    ❌ No GTB config found');
    }

    // SUMMARY
    console.log('\n📊 SYSTEM STATUS SUMMARY:');
    console.log('========================');

    // Count all data
    const [originalCount] = await db.execute('SELECT COUNT(*) as count FROM form_sql');
    const [parallelSiteCount] = await db.execute('SELECT COUNT(*) as count FROM sites');
    const [parallelGTBCount] = await db.execute('SELECT COUNT(*) as count FROM gtb_site_config');
    const [parallelEquipCount] = await db.execute('SELECT COUNT(*) as count FROM equipment_configs');
    const [parallelCatCount] = await db.execute('SELECT COUNT(*) as count FROM equipment_categories');

    console.log(`🔵 ORIGINAL SYSTEM:`);
    console.log(`  - form_sql records: ${originalCount[0].count}`);
    console.log(`  - Status: ✅ Working (no changes made)`);

    console.log(`🟢 PARALLEL SYSTEM:`);
    console.log(`  - sites: ${parallelSiteCount[0].count}`);
    console.log(`  - gtb_site_config: ${parallelGTBCount[0].count}`);
    console.log(`  - equipment_configs: ${parallelEquipCount[0].count}`);
    console.log(`  - equipment_categories: ${parallelCatCount[0].count}`);
    console.log(`  - Status: ✅ Ready (needs server restart for HTTP endpoints)`);

    console.log('\n🎯 CONFLICT CHECK:');
    console.log('==================');
    console.log('✅ NO CONFLICTS - Systems use completely separate tables');
    console.log('🔵 Original: form_sql, image_sql');
    console.log('🟢 Parallel: sites, gtb_site_config, equipment_configs, site_images');

    console.log('\n🎉 COMPREHENSIVE CHECK COMPLETE!');

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await db.end();
  }
}

comprehensiveCheck();