import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:4001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const TEST_SITE = `delete_test_${Date.now()}`;

async function testDeleteFunctionality() {
  console.log('🧪 Testing delete functionality for EquipmentPage');
  console.log(`🔧 Test site: ${TEST_SITE}`);
  
  try {
    // Step 1: Create test image metadata
    console.log('📝 Step 1: Creating test image metadata...');
    const imageData = {
      site: TEST_SITE,
      type: 'aero',
      title: 'Delete Test Image',
      url_viewer: 'https://i.ibb.co/test-delete-image.jpg',
      delete_url: 'https://ibb.co/delete/test-delete/xyz789',
    };
    
    const uploadResponse = await api.post('/images/upload-sql', imageData);
    console.log('✅ Upload response:', uploadResponse.status);
    
    // Step 2: Verify image exists
    console.log('🔍 Step 2: Verifying image exists...');
    const getResponse = await api.post('/images/get-sql-images', { site: TEST_SITE });
    const foundImage = getResponse.data.find(img => img.delete_url === imageData.delete_url);
    if (!foundImage) {
      throw new Error('Image not found after upload');
    }
    console.log('✅ Image found in database');
    
    // Step 3: Test ImgBB deletion
    console.log('🗑️ Step 3: Testing ImgBB deletion...');
    const imgbbDeleteResponse = await api.post('/images/delete-imgbb', {
      delete_url: imageData.delete_url
    });
    console.log('✅ ImgBB delete response:', imgbbDeleteResponse.status, imgbbDeleteResponse.data?.message);
    
    // Step 4: Test SQL deletion
    console.log('🗂️ Step 4: Testing SQL deletion...');
    const sqlDeleteResponse = await api.post('/images/delete-sql', {
      delete_url: imageData.delete_url
    });
    console.log('✅ SQL delete response:', sqlDeleteResponse.status, sqlDeleteResponse.data?.message);
    
    // Step 5: Verify deletion
    console.log('✅ Step 5: Verifying deletion...');
    const verifyResponse = await api.post('/images/get-sql-images', { site: TEST_SITE });
    const stillExists = verifyResponse.data.find(img => img.delete_url === imageData.delete_url);
    
    if (stillExists) {
      throw new Error('Image still exists after deletion');
    }
    
    console.log('🎉 All delete operations completed successfully!');
    console.log('✅ Delete functionality is working correctly');
    return true;
    
  } catch (error) {
    console.error('❌ Delete test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the test
testDeleteFunctionality().then(success => {
  process.exit(success ? 0 : 1);
});