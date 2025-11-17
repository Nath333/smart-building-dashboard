// =====================================================
// GTB DAL Test Script
// Tests the new GTB configuration system
// =====================================================

import gtbConfigDAL from '../database/dal/gtbConfigDAL.js';

const TEST_SITE = 'test_gtb_site';

async function testGtbDAL() {
  console.log('🧪 Testing GTB Configuration DAL\n');

  try {
    // Test 1: Check if site has GTB config (should be false initially)
    console.log('📋 Test 1: Check if site has GTB config');
    const hasConfig = await gtbConfigDAL.hasGtbConfig(TEST_SITE);
    console.log(`   Result: ${hasConfig ? '✅ Has config' : 'ℹ️ No config found'}\n`);

    // Test 2: Save GTB configuration
    console.log('💾 Test 2: Save GTB configuration');
    const testData = {
      // Sensor data
      sondes: 3,
      ref_sondes: 'pi33,pi33,pi33',
      sondesPresentes: 3,
      ref_sondesPresentes: 'wt101,wt101,wt101',
      gazCompteur: 1,
      Izit: 1,

      // Module data
      clim_ir: 3,
      ref_clim_ir: 'Intesis IR,Intesis IR,Intesis IR',
      aeroeau: 2,
      ref_aeroeau: 'Aero1,Aero2',
      rooftop: 1,
      ref_rooftop: 'RoofTop1'
    };

    const saveResult = await gtbConfigDAL.saveGtbConfig(TEST_SITE, testData);
    console.log('   ✅ Saved successfully');
    console.log(`   📊 Modules: ${saveResult.modulesProcessed}, References: ${saveResult.referencesProcessed}\n`);

    // Test 3: Retrieve GTB configuration
    console.log('📥 Test 3: Retrieve GTB configuration');
    const retrievedData = await gtbConfigDAL.getGtbConfig(TEST_SITE);

    if (retrievedData) {
      console.log('   ✅ Retrieved successfully');
      console.log('   📊 Data summary:');
      console.log(`      - Sondes: ${retrievedData.sondes || 0}`);
      console.log(`      - Sondes Presentes: ${retrievedData.sondesPresentes || 0}`);
      console.log(`      - Clim IR: ${retrievedData.clim_ir || 0}`);
      console.log(`      - Aeroeau: ${retrievedData.aeroeau || 0}`);
      console.log(`      - Rooftop: ${retrievedData.rooftop || 0}`);
      console.log(`      - Gas Compteur: ${retrievedData.gazCompteur || 0}`);
      console.log(`      - Izit: ${retrievedData.Izit || 0}\n`);
    } else {
      console.log('   ❌ No data retrieved\n');
    }

    // Test 4: Get module types
    console.log('📋 Test 4: Get module types');
    const moduleTypes = await gtbConfigDAL.getModuleTypes();
    console.log(`   ✅ Found ${moduleTypes.length} module types`);
    moduleTypes.slice(0, 5).forEach(type => {
      console.log(`      - ${type.display_name_fr} (${type.module_type})`);
    });
    console.log('');

    // Test 5: Update configuration
    console.log('🔄 Test 5: Update configuration');
    const updatedData = {
      ...testData,
      clim_ir: 5, // Increase count
      ref_clim_ir: 'Intesis IR,Intesis IR,Intesis IR,Intesis IR,Intesis IR',
      aerogaz: 1, // Add new module
      ref_aerogaz: 'Gaz1'
    };

    const updateResult = await gtbConfigDAL.saveGtbConfig(TEST_SITE, updatedData);
    console.log('   ✅ Updated successfully');
    console.log(`   📊 Modules: ${updateResult.modulesProcessed}, References: ${updateResult.referencesProcessed}\n`);

    // Test 6: Verify update
    console.log('✔️ Test 6: Verify update');
    const verifyData = await gtbConfigDAL.getGtbConfig(TEST_SITE);
    console.log(`   Clim IR count: ${verifyData.clim_ir} (expected 5)`);
    console.log(`   Aerogaz count: ${verifyData.aerogaz} (expected 1)`);
    console.log('');

    // Test 7: Delete configuration
    console.log('🗑️ Test 7: Delete configuration');
    const deleteCount = await gtbConfigDAL.deleteGtbConfig(TEST_SITE);
    console.log(`   ✅ Deleted ${deleteCount} records\n`);

    // Test 8: Verify deletion
    console.log('✔️ Test 8: Verify deletion');
    const afterDelete = await gtbConfigDAL.getGtbConfig(TEST_SITE);
    console.log(`   Result: ${afterDelete ? '❌ Data still exists' : '✅ Data deleted successfully'}\n`);

    console.log('🎉 All GTB DAL tests completed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }

  process.exit(0);
}

// Run tests
testGtbDAL();
