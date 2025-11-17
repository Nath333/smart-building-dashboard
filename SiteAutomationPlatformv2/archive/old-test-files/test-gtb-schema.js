import db from './src/config/database.js';

async function testGtbSchema() {
  try {
    console.log('🔍 Testing GTB Schema...\n');

    // Test 1: Check gtb_modules table structure
    console.log('1️⃣ Checking gtb_modules table structure:');
    const [columns] = await db.execute(`
      SHOW COLUMNS FROM gtb_modules
    `);

    console.log('   Columns found:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });

    const hasDevisName = columns.some(col => col.Field === 'devis_name');
    console.log(`\n   ✅ devis_name column exists: ${hasDevisName ? 'YES' : 'NO'}\n`);

    // Test 2: Check gtb_module_references table
    console.log('2️⃣ Checking gtb_module_references table structure:');
    const [refColumns] = await db.execute(`
      SHOW COLUMNS FROM gtb_module_references
    `);

    console.log('   Columns found:');
    refColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });

    // Test 3: Check devis table
    console.log('\n3️⃣ Checking devis table structure:');
    const [devisColumns] = await db.execute(`
      SHOW COLUMNS FROM devis
    `);

    console.log('   Columns found:');
    devisColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });

    // Test 4: Sample data check
    console.log('\n4️⃣ Sample data in gtb_modules:');
    const [gtbData] = await db.execute(`
      SELECT site_name, devis_name, module_type, quantity
      FROM gtb_modules
      LIMIT 5
    `);

    if (gtbData.length > 0) {
      console.log('   Found data:');
      gtbData.forEach(row => {
        console.log(`   - Site: ${row.site_name}, Devis: ${row.devis_name || 'NULL'}, Module: ${row.module_type}, Qty: ${row.quantity}`);
      });
    } else {
      console.log('   ⚠️ No data found in gtb_modules table');
    }

    // Test 5: Sample data in devis table
    console.log('\n5️⃣ Sample data in devis table:');
    const [devisData] = await db.execute(`
      SELECT site_name, devis_name, equipment_type, zone_name, to_install_count
      FROM devis
      LIMIT 5
    `);

    if (devisData.length > 0) {
      console.log('   Found data:');
      devisData.forEach(row => {
        console.log(`   - Site: ${row.site_name}, Devis: ${row.devis_name}, Equipment: ${row.equipment_type}, Zone: ${row.zone_name}, Install: ${row.to_install_count}`);
      });
    } else {
      console.log('   ⚠️ No data found in devis table');
    }

    console.log('\n✅ Schema test complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing schema:', error);
    process.exit(1);
  }
}

testGtbSchema();
