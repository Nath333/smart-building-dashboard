import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Quick API Test - Fast development smoke tests
 * Runs essential checks in under 5 seconds
 */

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:4001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000, // Faster timeout for quick tests
});

const TEST_SITE = `quick_${Date.now()}`;

console.log('⚡ QUICK API TEST - Development Smoke Tests');
console.log('='.repeat(45));

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
  // 1. Server UP?
  await test('Server responding', async () => {
    const res = await api.post('/list-sites');
    if (res.status !== 200) throw new Error('Server down');
  });

  // 2. Can create site?
  await test('Site creation works', async () => {
    const res = await api.post('/save-page1', {
      site: TEST_SITE,
      client: 'Quick Test'
    });
    if (res.status !== 200) throw new Error('Site creation failed');
  });

  // 3. Can read site?
  await test('Site retrieval works', async () => {
    const res = await api.post('/get-page1', { site: TEST_SITE });
    if (res.status !== 200 || !res.data?.site) throw new Error('Site retrieval failed');
  });

  // 4. Equipment endpoint working?
  await test('Equipment endpoint basic', async () => {
    const res = await api.post('/save_page2', {
      site: TEST_SITE,
      nb_aerotherme: 1
    });
    if (res.status !== 200) throw new Error('Equipment endpoint failed');
  });

  // 5. Images endpoint working?
  await test('Image metadata basic', async () => {
    const res = await api.post('/images/upload-sql', {
      site: TEST_SITE,
      type: 'test',
      title: 'Quick Test',
      url_viewer: 'https://example.com/quick-test.jpg',
      delete_url: 'https://example.com/delete-quick'
    });
    if (res.status !== 200) throw new Error('Image endpoint failed');
  });

} catch (error) {
  console.log(`🚨 Quick test crashed: ${error.message}`);
}

const duration = Date.now() - startTime;
const rate = Math.round((passed / total) * 100);

console.log('='.repeat(45));
console.log(`📊 ${passed}/${total} passed (${rate}%) in ${duration}ms`);

if (rate === 100) {
  console.log('🎯 All systems operational!');
} else {
  console.log('⚠️  Some issues detected - run full test suite');
}

process.exit(rate === 100 ? 0 : 1);