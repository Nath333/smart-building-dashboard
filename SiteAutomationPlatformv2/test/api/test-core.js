import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Core API Test Suite - Essential functionality testing
 * Focuses on critical endpoints that must always work
 */

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:4001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const TEST_SITE = `core_test_${Date.now()}`;

class CoreTestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async test(name, testFn) {
    const startTime = Date.now();
    try {
      await testFn();
      const responseTime = Date.now() - startTime;
      this.results.push({ name, status: 'PASS', responseTime });
      console.log(`✅ ${name} (${responseTime}ms)`);
      return true;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.results.push({ 
        name, 
        status: 'FAIL', 
        responseTime,
        error: error.message 
      });
      console.log(`❌ ${name} - ${error.message} (${responseTime}ms)`);
      return false;
    }
  }

  getSummary() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const total = this.results.length;
    const duration = Date.now() - this.startTime;
    const avgResponseTime = Math.round(
      this.results.reduce((sum, r) => sum + r.responseTime, 0) / total
    );

    return {
      total,
      passed,
      failed: total - passed,
      successRate: Math.round((passed / total) * 100),
      avgResponseTime,
      duration
    };
  }
}

async function runCoreTests() {
  const runner = new CoreTestRunner();
  
  console.log('🔧 CORE API TEST SUITE');
  console.log('='.repeat(50));
  console.log(`📍 Server: process.env.API_URL || 'http://localhost:4001'`);
  console.log(`🧪 Test Site: ${TEST_SITE}`);
  console.log('='.repeat(50));

  // Test 1: Server Connectivity
  await runner.test('Server connectivity', async () => {
    const response = await api.post('/list-sites');
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });

  // Test 2: Site Creation (Page 1)
  await runner.test('Site creation', async () => {
    const siteData = {
      site: TEST_SITE,
      client: 'Test Client',
      address: '123 Test Street',
      number1: '555-1234',
      email: 'test@example.com'
    };
    
    const response = await api.post('/save-page1', siteData);
    if (response.status !== 200) throw new Error(`Failed to create site: ${response.status}`);
  });

  // Test 3: Site Retrieval
  await runner.test('Site data retrieval', async () => {
    const response = await api.post('/get-page1', { site: TEST_SITE });
    if (response.status !== 200) throw new Error(`Failed to retrieve site: ${response.status}`);
    if (!response.data || !response.data.site) {
      throw new Error('No site data returned');
    }
  });

  // Test 4: Equipment Save (Page 2)
  await runner.test('Equipment configuration', async () => {
    const equipmentData = {
      site: TEST_SITE,
      nb_aerotherme: 2,
      zone_aerotherme: 'Zone A',
      coffret_aerotherme: 'Standard'
    };
    
    const response = await api.post('/save_page2', equipmentData);
    if (response.status !== 200) throw new Error(`Equipment save failed: ${response.status}`);
  });

  // Test 5: GTB Configuration (Page 5)
  await runner.test('GTB configuration', async () => {
    const gtbData = {
      site: TEST_SITE,
      modules: ['aerogaz', 'sondes'],
      aerogaz: 1,
      sondes: 2,
      refs: ['REF001'],
      sondesPresentes: ['TEMP001', 'TEMP002']
    };
    
    const response = await api.post('/save_page3', gtbData);
    if (response.status !== 200) throw new Error(`GTB save failed: ${response.status}`);
  });

  // Test 6: Image Metadata Operations
  await runner.test('Image metadata handling', async () => {
    const imageData = {
      site: TEST_SITE,
      type: 'vt',
      title: 'Test Image',
      url_viewer: 'https://example.com/test.jpg',
      delete_url: 'https://example.com/test-delete',
      shapes: [{"id":"test-1","x":100,"y":100}]
    };
    
    const response = await api.post('/images/upload-sql', imageData);
    if (response.status !== 200) throw new Error(`Image metadata failed: ${response.status}`);
  });

  // Test 7: Basic API Response Format
  await runner.test('API response validation', async () => {
    const response = await api.post('/list-sites');
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!Array.isArray(response.data)) throw new Error('Expected array response from list-sites');
  });

  // Test 8: Site Listing
  await runner.test('Site listing functionality', async () => {
    const response = await api.post('/list-sites');
    if (response.status !== 200) throw new Error(`List sites failed: ${response.status}`);
    
    const sites = response.data;
    const testSiteExists = sites.some(s => s.site === TEST_SITE);
    if (!testSiteExists) throw new Error('Created test site not found in listing');
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  const summary = runner.getSummary();
  console.log('📊 CORE TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${summary.passed}/${summary.total} tests`);
  console.log(`📈 Success Rate: ${summary.successRate}%`);
  console.log(`⚡ Avg Response Time: ${summary.avgResponseTime}ms`);
  console.log(`⏱️ Total Duration: ${summary.duration}ms`);

  if (summary.successRate < 100) {
    console.log('\n❌ FAILED TESTS:');
    runner.results
      .filter(r => r.status === 'FAIL')
      .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  }

  console.log('='.repeat(50));
  
  // Exit with appropriate code
  process.exit(summary.successRate === 100 ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCoreTests().catch(error => {
    console.error('🚨 Test suite crashed:', error.message);
    process.exit(1);
  });
}

export default runCoreTests;