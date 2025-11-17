// Quick test script to verify ImgBB API is working
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

console.log('🔑 API Key:', IMGBB_API_KEY ? 'Found' : 'Missing');
console.log('🔑 First 8 chars:', IMGBB_API_KEY?.substring(0, 8));

// Create a simple test image (1x1 red pixel PNG)
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

const formData = new URLSearchParams();
formData.append('image', testImageBase64);
formData.append('name', 'test_image');

const uploadUrl = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`;

console.log('\n🌐 Testing ImgBB API...');
console.log('📡 URL:', uploadUrl);

try {
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  console.log('📊 Response Status:', response.status, response.statusText);

  const result = await response.json();
  console.log('📦 Response:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n✅ ImgBB API is working!');
    console.log('🖼️ Image URL:', result.data.url);
  } else {
    console.log('\n❌ ImgBB API failed!');
    console.log('Error:', result.error);
  }
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
}
