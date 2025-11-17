// Test script to debug equipment data fetching
import equipmentDAL from './database/dal/equipmentDAL.js';

const siteName = 'Bricomarché Provins';

console.log('🧪 Testing equipmentDAL methods for:', siteName);
console.log('═'.repeat(80));

try {
  console.log('\n1️⃣ Testing getAerothermeData...');
  const aeroData = await equipmentDAL.getAerothermeData(siteName);
  console.log('✅ Aerotherme data keys:', Object.keys(aeroData));
  console.log('📦 Sample data:', Object.fromEntries(Object.entries(aeroData).slice(0, 5)));

  console.log('\n2️⃣ Testing getClimateData...');
  const climData = await equipmentDAL.getClimateData(siteName);
  console.log('✅ Climate data keys:', Object.keys(climData));
  console.log('📦 Sample data:', Object.fromEntries(Object.entries(climData).slice(0, 5)));

  console.log('\n3️⃣ Testing getRooftopData...');
  const rooftopData = await equipmentDAL.getRooftopData(siteName);
  console.log('✅ Rooftop data keys:', Object.keys(rooftopData));
  console.log('📦 Sample data:', Object.fromEntries(Object.entries(rooftopData).slice(0, 5)));

  console.log('\n4️⃣ Testing getLightingData...');
  const lightingData = await equipmentDAL.getLightingData(siteName);
  console.log('✅ Lighting data keys:', Object.keys(lightingData));
  console.log('📦 Sample data:', lightingData);

  console.log('\n✅ All tests completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Test failed:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
