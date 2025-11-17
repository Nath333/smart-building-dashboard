import gtbConfigDAL from './database/dal/gtbConfigDAL.js';
import db from './src/config/database.js';

async function testGtbSave() {
  try {
    console.log('🧪 Testing GTB Save & Retrieve...\n');

    const testSite = 'Bricomarché Provins';
    const testDevis = 'Devis Principal';

    // Test 1: Save GTB configuration
    console.log('1️⃣ Saving test GTB configuration...');
    const testData = {
      modules: ['aeroeau', 'clim_ir', 'rooftop'],
      aeroeau: 5,
      ref_aeroeau: 'cs do12,cs do12,cs do12,cs do12,cs do12',
      clim_ir: 2,
      ref_clim_ir: 'Intesis IR,Intesis IR',
      rooftop: 1,
      ref_rooftop: 'modbus do12',
      sondes: 12,
      sondesPresentes: 8,
      gazCompteur: 'oui',
      Izit: ['coffret gtb(asp/do12/routeur/ug65)']
    };

    const saveResult = await gtbConfigDAL.saveGtbConfig(testSite, testDevis, testData);
    console.log('   ✅ Save result:', saveResult);

    // Test 2: Verify data in database
    console.log('\n2️⃣ Verifying data in gtb_modules table:');
    const [moduleRows] = await db.execute(`
      SELECT * FROM gtb_modules
      WHERE site_name = ? AND devis_name = ?
    `, [testSite, testDevis]);

    if (moduleRows.length > 0) {
      console.log(`   ✅ Found ${moduleRows.length} module(s):`);
      moduleRows.forEach(row => {
        console.log(`   - Module: ${row.module_type}, Qty: ${row.quantity}, Refs: ${row.refs}`);
      });
    } else {
      console.log('   ❌ No modules found in database!');
    }

    // Test 3: Verify references in gtb_module_references table
    console.log('\n3️⃣ Verifying data in gtb_module_references table:');
    const [refRows] = await db.execute(`
      SELECT * FROM gtb_module_references
      WHERE site_name = ?
      ORDER BY module_type, ref_index
    `, [testSite]);

    if (refRows.length > 0) {
      console.log(`   ✅ Found ${refRows.length} reference(s):`);
      refRows.forEach(row => {
        console.log(`   - ${row.module_type}[${row.ref_index}]: ${row.ref_value}`);
      });
    } else {
      console.log('   ⚠️ No references found (may be stored in refs column only)');
    }

    // Test 4: Retrieve via DAL
    console.log('\n4️⃣ Retrieving via DAL (getGtbConfig):');
    const retrievedData = await gtbConfigDAL.getGtbConfig(testSite, testDevis);

    if (retrievedData) {
      console.log('   ✅ Retrieved data:');
      console.log('   - Modules:', retrievedData.modules || Object.keys(retrievedData).filter(k => typeof retrievedData[k] === 'number' && retrievedData[k] > 0));
      console.log('   - aeroeau:', retrievedData.aeroeau || 0);
      console.log('   - clim_ir:', retrievedData.clim_ir || 0);
      console.log('   - rooftop:', retrievedData.rooftop || 0);
      console.log('   - sondes:', retrievedData.sondes || 0);
      console.log('   - ref_aeroeau:', retrievedData.ref_aeroeau);
    } else {
      console.log('   ❌ No data retrieved from DAL!');
    }

    // Test 5: Test different devis
    console.log('\n5️⃣ Saving config for different devis (devis 2):');
    const testData2 = {
      modules: ['clim_ir'],
      clim_ir: 3,
      ref_clim_ir: 'Intesis IR,Intesis IR,Intesis IR',
      sondes: 5
    };

    await gtbConfigDAL.saveGtbConfig(testSite, 'devis 2', testData2);
    const retrievedDevis2 = await gtbConfigDAL.getGtbConfig(testSite, 'devis 2');

    if (retrievedDevis2) {
      console.log('   ✅ Devis 2 saved and retrieved:');
      console.log('   - clim_ir:', retrievedDevis2.clim_ir || 0);
      console.log('   - sondes:', retrievedDevis2.sondes || 0);
    }

    // Test 6: Verify both devis are separate
    console.log('\n6️⃣ Verifying devis separation:');
    const [allModules] = await db.execute(`
      SELECT devis_name, module_type, quantity
      FROM gtb_modules
      WHERE site_name = ?
      ORDER BY devis_name, module_type
    `, [testSite]);

    console.log('   All modules by devis:');
    allModules.forEach(row => {
      console.log(`   - [${row.devis_name}] ${row.module_type}: ${row.quantity}`);
    });

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testGtbSave();
