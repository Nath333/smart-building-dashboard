// Simple test script to write to avancement2 field in sites table
import db from './src/config/database.js';

async function testAvancement2() {
  try {
    console.log('🧪 Starting avancement2 test...');

    // Step 1: Check if column exists and add if needed
    console.log('🔍 Checking if avancement2 column exists...');
    try {
      const [columns] = await db.execute(
        `SHOW COLUMNS FROM sites LIKE 'avancement2'`
      );

      if (columns.length === 0) {
        console.log('➕ Adding avancement2 column...');
        await db.execute(
          `ALTER TABLE sites ADD COLUMN avancement2 TEXT`
        );
        console.log('✅ Column added successfully!');
      } else {
        console.log('✅ Column already exists');
      }
    } catch (error) {
      console.error('❌ Error checking/adding column:', error.message);
      throw error;
    }

    // Test data
    const testSite = 'Test Site ' + Date.now();
    const testAvancement = JSON.stringify({
      page1: true,
      page2: true,
      page3: false,
      page4: false,
      page5: false,
      page6: false,
      lastUpdated: new Date().toISOString()
    });

    // Insert test record
    console.log('📝 Inserting test site with avancement2 data...');
    const [insertResult] = await db.execute(
      `INSERT INTO sites (site_name, client_name, address, avancement2)
       VALUES (?, ?, ?, ?)`,
      [testSite, 'Test Client', '123 Test Street', testAvancement]
    );

    console.log('✅ Insert successful! ID:', insertResult.insertId);

    // Read back the data
    console.log('📖 Reading back the data...');
    const [rows] = await db.execute(
      'SELECT site_name, client_name, address, avancement2 FROM sites WHERE site_name = ?',
      [testSite]
    );

    if (rows.length > 0) {
      console.log('✅ Data retrieved successfully:');
      console.log('Site Name:', rows[0].site_name);
      console.log('Client Name:', rows[0].client_name);
      console.log('Avancement2:', rows[0].avancement2);

      // Parse and display JSON
      if (rows[0].avancement2) {
        const avancementData = JSON.parse(rows[0].avancement2);
        console.log('📊 Parsed Avancement Data:', avancementData);
      }
    }

    // Update the avancement2 field
    console.log('🔄 Updating avancement2 data...');
    const updatedAvancement = JSON.stringify({
      page1: true,
      page2: true,
      page3: true,
      page4: true,
      page5: false,
      page6: false,
      lastUpdated: new Date().toISOString()
    });

    await db.execute(
      'UPDATE sites SET avancement2 = ? WHERE site_name = ?',
      [updatedAvancement, testSite]
    );

    // Read updated data
    const [updatedRows] = await db.execute(
      'SELECT avancement2 FROM sites WHERE site_name = ?',
      [testSite]
    );

    console.log('✅ Update successful!');
    console.log('📊 Updated Avancement:', JSON.parse(updatedRows[0].avancement2));

    console.log('\n🎉 Test completed successfully!');
    console.log('Note: Test data remains in database for inspection.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testAvancement2();
