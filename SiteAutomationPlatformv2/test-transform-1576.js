// Test transformToLegacyFormat with the correct site ID
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import equipmentDAL from './database/dal/equipmentDAL.js';
import comptageDAL from './database/dal/comptageDAL.js';

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'admin',
  database: process.env.DB_NAME || 'avancement2'
});

async function test() {
  try {
    const siteId = 1576;

    const [siteRows] = await db.execute('SELECT * FROM sites WHERE id = ?', [siteId]);
    if (siteRows.length === 0) {
      console.log('Site not found');
      return;
    }

    const site = siteRows[0];
    const siteName = site.site_name;

    console.log(`\n🎯 Testing site ID ${siteId}: "${siteName}"\n`);

    // Get equipment data
    const [aeroData, climData, rooftopData, lightingData] = await Promise.all([
      equipmentDAL.getAerothermeData(siteName),
      equipmentDAL.getClimateData(siteName),
      equipmentDAL.getRooftopData(siteName),
      equipmentDAL.getLightingData(siteName)
    ]);

    console.log('📊 Equipment data:');
    console.log(`   Aero fields: ${Object.keys(aeroData).length}`);
    console.log(`   Clim fields: ${Object.keys(climData).length}`);
    console.log(`   Rooftop fields: ${Object.keys(rooftopData).length}`);
    console.log(`   Lighting fields: ${Object.keys(lightingData).length}`);

    // Get comptage data
    const comptageData = await comptageDAL.getAllComptageData(siteName);
    console.log('\n📊 Comptage data:');
    console.log(`   Aerotherme: ${comptageData.aerotherme?.length || 0}`);
    console.log(`   Climate: ${comptageData.climate?.length || 0}`);
    console.log(`   Lighting: ${comptageData.lighting?.length || 0}`);
    console.log(`   Rooftop: ${comptageData.rooftop?.length || 0}`);

    if (comptageData.lighting && comptageData.lighting.length > 0) {
      console.log('\n💡 Lighting comptage records:');
      comptageData.lighting.forEach((rec, idx) => {
        console.log(`   [${idx}] Selection: ${rec.selection_comptage}, Zone: ${rec.zone}, Type: ${rec.type}`);
      });
    }

    await db.end();
    console.log('\n✅ Test complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
