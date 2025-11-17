import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Shared test utilities and helpers
 */

export const createApiClient = (baseURL = process.env.API_URL || 'http://localhost:4001', timeout = 10000) => {
  return axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout,
  });
};

export const generateTestSite = (prefix = 'test') => {
  return `${prefix}_${Date.now()}`;
};

export const sampleSiteData = (siteName) => ({
  site: siteName,
  client: 'Test Client Corp',
  address: '123 Test Avenue, Test City',
  number1: '555-0123',
  number2: '555-0124',
  email: 'test@example.com',
  zone_aerotherme: 'Zone A',
  nb_aerotherme: 2
});

export const sampleEquipmentData = (siteName) => ({
  site: siteName,
  nb_aerotherme: 3,
  zone_aerotherme: 'Production Floor',
  thermostat_aerotherme: 'Digital',
  coffret_aerotherme: 'IP65',
  nb_clim_ir: 2,
  nb_clim_wire: 1,
  zone_clim: 'Office Area',
  nb_rooftop: 1,
  zone_rooftop: 'Roof Zone'
});

export const sampleGtbData = (siteName) => ({
  site: siteName,
  modules: ['aerogaz', 'sondes'],
  aerogaz: 2,
  sondes: 3,
  refs: ['REF001', 'REF002'],
  sondesPresentes: ['TEMP001', 'TEMP002', 'HUM001']
});

export const sampleImageData = (siteName) => ({
  site: siteName,
  type: 'vt',
  title: 'Test VT Plan',
  url_viewer: 'https://i.ibb.co/test/viewer.jpg',
  url_thumb: 'https://i.ibb.co/test/thumb.jpg',
  delete_url: 'https://i.ibb.co/test/delete',
  shapes: [
    { "id": "aero-1", "x": 100, "y": 150 },
    { "id": "aero-2", "x": 200, "y": 150 },
    { "id": "clim-1", "x": 150, "y": 200 }
  ]
});

export class TestRunner {
  constructor(name = 'Test Runner') {
    this.name = name;
    this.results = [];
    this.startTime = Date.now();
  }

  async test(testName, testFunction) {
    const testStart = Date.now();
    try {
      await testFunction();
      const duration = Date.now() - testStart;
      this.results.push({
        name: testName,
        status: 'PASS',
        duration,
        error: null
      });
      console.log(`✅ ${testName} (${duration}ms)`);
      return true;
    } catch (error) {
      const duration = Date.now() - testStart;
      this.results.push({
        name: testName,
        status: 'FAIL',
        duration,
        error: error.message
      });
      console.log(`❌ ${testName} - ${error.message} (${duration}ms)`);
      return false;
    }
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = total - passed;
    const totalDuration = Date.now() - this.startTime;
    const avgDuration = total > 0 ? 
      Math.round(this.results.reduce((sum, r) => sum + r.duration, 0) / total) : 0;

    return {
      total,
      passed,
      failed,
      successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      totalDuration,
      avgDuration
    };
  }

  printSummary() {
    const summary = this.getSummary();
    console.log('\n' + '='.repeat(50));
    console.log(`📊 ${this.name.toUpperCase()} SUMMARY`);
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${summary.passed}/${summary.total} tests`);
    console.log(`📈 Success Rate: ${summary.successRate}%`);
    console.log(`⚡ Avg Response: ${summary.avgDuration}ms`);
    console.log(`⏱️ Total Duration: ${summary.totalDuration}ms`);
    
    if (summary.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   • ${r.name}: ${r.error}`));
    }
    
    console.log('='.repeat(50));
    return summary;
  }
}

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const validateResponse = (response, expectedStatus = 200) => {
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
  }
  return response;
};

export const validateData = (data, requiredFields = []) => {
  if (!data) throw new Error('No data received');
  
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  return data;
};

// Security test helpers
export const sqlInjectionPayloads = [
  "'; DROP TABLE users; --",
  "' OR '1'='1",
  "'; SELECT * FROM form_sql; --",
  "admin'--",
  "' UNION SELECT NULL--"
];

export const xssPayloads = [
  "<script>alert('xss')</script>",
  "javascript:alert('xss')",
  "<img src='x' onerror='alert(1)'>",
  "';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//",
  "\"><script>alert('xss')</script>"
];

export default {
  createApiClient,
  generateTestSite,
  sampleSiteData,
  sampleEquipmentData,
  sampleGtbData,
  sampleImageData,
  TestRunner,
  delay,
  validateResponse,
  validateData,
  sqlInjectionPayloads,
  xssPayloads
};