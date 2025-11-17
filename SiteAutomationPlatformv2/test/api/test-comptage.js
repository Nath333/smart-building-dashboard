// Test script for comptage API endpoints
// Run with: node test/api/test-comptage.js

import axios from 'axios';

const API_BASE_URL = 'http://localhost:4001';
const TEST_SITE = 'test_comptage_site';

// Test data
const testComptageData = [
  {
    zone: 'surface_de_vente',
    nb: 1,
    type: 'energie',
    connection_type: 'modbus',
    puissance: 1500,
    commentaire: 'Comptage principal',
    etat_vetuste: 'bon',
    localisation: 'Bureau principal'
  },
  {
    zone: 'surface_de_vente',
    nb: 2,
    type: 'electricite',
    connection_type: 'impulsion',
    puissance: 3000,
    commentaire: 'Comptage secondaire',
    etat_vetuste: 'bon',
    localisation: 'Bureau principal'
  }
];

async function runTests() {
  console.log('🧪 Testing Comptage API Endpoints\n');

  try {
    // Test 1: Save comptage data
    console.log('1️⃣ Testing POST /save-comptage');
    const saveResponse = await axios.post(`${API_BASE_URL}/save-comptage`, {
      site: TEST_SITE,
      category: 'aerotherme',
      comptageData: testComptageData
    });
    console.log('✅ Save successful:', saveResponse.data);
    console.log('');

    // Test 2: Get comptage data for specific category
    console.log('2️⃣ Testing POST /get-comptage (specific category)');
    const getResponse = await axios.post(`${API_BASE_URL}/get-comptage`, {
      site: TEST_SITE,
      category: 'aerotherme'
    });
    console.log('✅ Retrieved comptage data:', getResponse.data);
    console.log('');

    // Test 3: Get all comptage data
    console.log('3️⃣ Testing POST /get-comptage (all categories)');
    const getAllResponse = await axios.post(`${API_BASE_URL}/get-comptage`, {
      site: TEST_SITE
    });
    console.log('✅ Retrieved all comptage data:', getAllResponse.data);
    console.log('');

    // Test 4: Update a comptage record
    if (getResponse.data && getResponse.data.length > 0) {
      const recordId = getResponse.data[0].id;
      console.log(`4️⃣ Testing PUT /update-comptage/aerotherme/${recordId}`);
      const updateResponse = await axios.put(
        `${API_BASE_URL}/update-comptage/aerotherme/${recordId}`,
        { puissance: 2000, commentaire: 'Updated via API test' }
      );
      console.log('✅ Update successful:', updateResponse.data);
      console.log('');
    }

    // Test 5: Delete a comptage record
    if (getResponse.data && getResponse.data.length > 1) {
      const recordId = getResponse.data[1].id;
      console.log(`5️⃣ Testing DELETE /delete-comptage/aerotherme/${recordId}`);
      const deleteResponse = await axios.delete(
        `${API_BASE_URL}/delete-comptage/aerotherme/${recordId}`
      );
      console.log('✅ Delete successful:', deleteResponse.data);
      console.log('');
    }

    // Test 6: Save comptage for multiple categories
    console.log('6️⃣ Testing multiple categories');
    const categories = ['climate', 'lighting', 'rooftop'];
    for (const category of categories) {
      const response = await axios.post(`${API_BASE_URL}/save-comptage`, {
        site: TEST_SITE,
        category,
        comptageData: [{
          zone: 'bureau',
          nb: 1,
          type: 'energie',
          connection_type: 'modbus',
          puissance: 1000,
          commentaire: `Test ${category}`,
          etat_vetuste: 'bon',
          localisation: 'Test location'
        }]
      });
      console.log(`✅ ${category}: ${response.data.message}`);
    }

    console.log('\n🎉 All comptage API tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
