import fetch from 'node-fetch';

/**
 * Simple test to delete a specific ImgBB URL using existing API endpoint
 * URL to test: https://ibb.co/DgMKZ1v4/4b42dc1f6258420babd8b0bc2d37d427
 */

const TEST_DELETE_URL = 'https://ibb.co/DgMKZ1v4/4b42dc1f6258420babd8b0bc2d37d427';
const BACKEND_URL = `${process.env.API_URL || 'http://localhost:4001'}/images/delete-imgbb`;

async function testImgBBDelete() {
  console.log('🧪 Testing ImgBB deletion for URL:', TEST_DELETE_URL);
  console.log('Using backend endpoint:', BACKEND_URL);
  
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        delete_url: TEST_DELETE_URL
      })
    });

    const result = await response.json();
    
    console.log('📡 Response status:', response.status);
    console.log('📥 Response data:', result);
    
    if (response.ok) {
      console.log('✅ Delete request completed successfully');
    } else {
      console.log('❌ Delete request failed');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error during delete test:', error);
    throw error;
  }
}

// Run the test
testImgBBDelete()
  .then(() => console.log('🏁 Test completed'))
  .catch(err => console.error('💥 Test failed:', err));