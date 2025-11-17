// Delete the duplicate site with garbled encoding
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'admin',
  database: process.env.DB_NAME || 'avancement2'
});

async function fix() {
  try {
    console.log('\n🔧 Fixing duplicate site...\n');

    // Delete the garbled site (ID 1592)
    const [result] = await db.execute(
      'DELETE FROM sites WHERE id = ?',
      [1592]
    );

    console.log(`✅ Deleted site ID 1592 (garbled encoding)`);
    console.log(`   Rows affected: ${result.affectedRows}`);

    // Verify only one remains
    const [sites] = await db.execute(
      'SELECT id, site_name FROM sites WHERE site_name LIKE "%Chatillon%"'
    );

    console.log(`\n📋 Remaining sites:`);
    sites.forEach(s => {
      console.log(`   ID: ${s.id}, Name: "${s.site_name}"`);
    });

    await db.end();
    console.log('\n✅ Done\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fix();
