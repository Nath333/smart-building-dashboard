import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Essential API Test Suite - Only the most critical tests
 * Designed to run quickly and never hang
 */

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:4001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000, // Short timeout to prevent hanging
});

const TEST_SITE = `essential_test_${Date.now()}`;

console.log('🔧 ESSENTIAL API TEST SUITE');
console.log('='.repeat(40));
console.log(`📍 Server: process.env.API_URL || 'http://localhost:4001'`);
console.log(`🧪 Test Site: ${TEST_SITE}`);
console.log('='.repeat(40));

let passed = 0;
let total = 0;

const test = async (name, testFn) => {
  total++;
  const start = Date.now();
  try {
    await testFn();
    const time = Date.now() - start;
    console.log(`✅ ${name} (${time}ms)`);
    passed++;
  } catch (error) {
    const time = Date.now() - start;
    console.log(`❌ ${name} - ${error.message} (${time}ms)`);
  }
};

const startTime = Date.now();

try {
  // Test 1: Server Health
  await test('Server is responding', async () => {
    const res = await api.post('/list-sites');
    if (res.status !== 200) throw new Error('Server not responding');
  });

  // Test 2: Site Creation
  await test('Create site', async () => {
    const res = await api.post('/save-page1', {
      site: TEST_SITE,
      client: 'Essential Test',
      address: '123 Test St'
    });
    if (res.status !== 200) throw new Error('Site creation failed');
  });

  // Test 3: Site Retrieval
  await test('Retrieve site', async () => {
    const res = await api.post('/get-page1', { site: TEST_SITE });
    if (res.status !== 200 || !res.data?.site) throw new Error('Site retrieval failed');
  });

  // Test 4: Equipment Basic
  await test('Equipment endpoint', async () => {
    const res = await api.post('/save_page2', {
      site: TEST_SITE,
      nb_aerotherme: 1
    });
    if (res.status !== 200) throw new Error('Equipment save failed');
  });

  // Test 5: Image Basic
  await test('Image metadata', async () => {
    const res = await api.post('/images/upload-sql', {
      site: TEST_SITE,
      type: 'test',
      title: 'Essential Test',
      url_viewer: 'https://example.com/test.jpg',
      delete_url: 'https://example.com/delete'
    });
    if (res.status !== 200) throw new Error('Image metadata failed');
  });

} catch (error) {
  console.log(`🚨 Test suite error: ${error.message}`);
}

const duration = Date.now() - startTime;
const successRate = Math.round((passed / total) * 100);

console.log('='.repeat(40));
console.log(`📊 RESULTS: ${passed}/${total} passed (${successRate}%)`);
console.log(`⏱️ Duration: ${duration}ms`);

if (successRate === 100) {
  console.log('🎯 All essential tests passed!');
} else {
  console.log('⚠️  Some tests failed');
}

process.exit(successRate === 100 ? 0 : 1);