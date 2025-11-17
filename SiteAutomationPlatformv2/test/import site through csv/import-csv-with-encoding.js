// Script to import CSV data directly into sites table with CORRECT ENCODING
import mysql from 'mysql2/promise';
import fs from 'fs';

// Database configuration
const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'admin',
  database: 'avancement2',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Simple CSV parser
function parseCSV(content) {
  const lines = content.split('\n');
  return lines.map(line => {
    return line.split(',').map(cell => cell.trim());
  });
}

async function importCSVToSites() {
  try {
    console.log('🧪 Starting CSV import to sites table...');

    // Read CSV file with LATIN1 encoding (ISO-8859-1) for proper French character support
    const csvPath = './site.csv';
    console.log('📖 Reading CSV file:', csvPath);
    console.log('📝 Using latin1 encoding for proper character handling (é, è, à, etc.)');
    const fileContent = fs.readFileSync(csvPath, 'latin1');

    // Parse CSV
    const records = parseCSV(fileContent);
    console.log(`✅ Found ${records.length} rows in CSV`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Process each row (skip header at index 0)
    for (let i = 1; i < records.length; i++) {
      const row = records[i];

      // Map CSV columns to sites table fields
      const ColA = row[0] || '';  // Column A → site_name
      const ColB = row[1] || '';  // Column B → client_name
      const ColD = row[3] || '';  // Column D → address
      const ColE = row[4] || '';  // Column E → phone_primary
      const ColG = row[6] || '';  // Column G → email

      // Skip if site name is empty
      if (!ColA.trim()) {
        skippedCount++;
        continue;
      }

      // Show mapping for first few rows to verify encoding
      if (i <= 3) {
        console.log(`\n📝 Row ${i} mapping:`);
        console.log(`   A → site_name: "${ColA}"`);
        console.log(`   B → client_name: "${ColB}"`);
        console.log(`   D → address: "${ColD}"`);
        console.log(`   E → phone_primary: "${ColE}"`);
        console.log(`   G → email: "${ColG}"`);
      }

      try {
        // Insert into sites table
        await db.execute(
          `INSERT INTO sites (site_name, client_name, address, phone_primary, email)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           client_name = VALUES(client_name),
           address = VALUES(address),
           phone_primary = VALUES(phone_primary),
           email = VALUES(email)`,
          [ColA, ColB, ColD, ColE, ColG]
        );

        if (i <= 3 || i % 20 === 0) {
          console.log(`✅ Row ${i}: "${ColA}"`);
        }
        successCount++;

      } catch (error) {
        console.error(`❌ Row ${i}: Failed "${ColA}"`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Success: ${successCount} rows`);
    console.log(`   ❌ Errors: ${errorCount} rows`);
    console.log(`   ⚠️  Skipped: ${skippedCount} rows`);

    // Verify the data with special characters
    console.log('\n📖 Verifying data with special characters...');
    const [siteRows] = await db.execute(
      `SELECT * FROM sites WHERE site_name LIKE '%é%' OR site_name LIKE '%è%' OR site_name LIKE '%à%' LIMIT 3`
    );

    if (siteRows.length > 0) {
      console.log('✅ Sample data with French characters:');
      siteRows.forEach(row => {
        console.log(`   - ${row.site_name} (${row.client_name})`);
      });
    }

    console.log('\n🎉 Import completed with correct encoding!');

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await db.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the import
importCSVToSites();
