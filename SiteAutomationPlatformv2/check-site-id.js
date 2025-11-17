// Check which site ID has the comptage data
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'admin',
  database: process.env.DB_NAME || 'avancement2'
});

async function check() {
  const [sites] = await db.execute(
    'SELECT id, site_name FROM sites WHERE site_name LIKE "%Chatillon%"'
  );

  console.log('\n📋 Sites with Chatillon:');
  sites.forEach(s => {
    console.log(`   ID: ${s.id}, Name: "${s.site_name}"`);
  });

  // Check which one has the comptage data
  for (const site of sites) {
    const [comptage] = await db.execute(
      'SELECT COUNT(*) as count FROM equipment_comptage_lighting WHERE site_name = ?',
      [site.site_name]
    );
    const [lighting] = await db.execute(
      'SELECT COUNT(*) as count FROM equipment_lighting WHERE site_name = ?',
      [site.site_name]
    );
    console.log(`   ID ${site.id}: ${comptage[0].count} comptage, ${lighting[0].count} lighting`);
  }

  await db.end();
}

check();
