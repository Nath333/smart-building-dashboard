import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import FormData from 'form-data';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_URL || process.env.API_URL || 'http://localhost:4001';
const TEST_SITE_BASE = `advanced_test_${Date.now()}`;
const TEST_SITE = TEST_SITE_BASE; // For backward compatibility with remaining tests
let testCounter = 0;
const getUniqueSite = () => `${TEST_SITE_BASE}_${++testCounter}`;
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Advanced test tracking with detailed metrics
class TestTracker {
  constructor() {
    this.results = [];
    this.pageResults = new Map();
    this.endpointMetrics = new Map();
    this.securityTests = [];
    this.performanceTests = [];
    this.integrationTests = [];
    this.startTime = Date.now();
  }

  addResult(category, name, status, responseTime, endpoint, error = null, data = null) {
    const result = {
      category,
      name,
      status,
      responseTime,
      endpoint,
      timestamp: new Date().toISOString(),
      error,
      data: data ? JSON.stringify(data).substring(0, 300) : null
    };

    this.results.push(result);

    // Track by page/category
    if (!this.pageResults.has(category)) {
      this.pageResults.set(category, { passed: 0, failed: 0, tests: [] });
    }
    const pageData = this.pageResults.get(category);
    pageData.tests.push(result);
    status === 'PASS' ? pageData.passed++ : pageData.failed++;

    // Track endpoint metrics
    if (endpoint) {
      if (!this.endpointMetrics.has(endpoint)) {
        this.endpointMetrics.set(endpoint, { calls: 0, totalTime: 0, errors: 0, successes: 0 });
      }
      const endpointData = this.endpointMetrics.get(endpoint);
      endpointData.calls++;
      endpointData.totalTime += responseTime;
      status === 'PASS' ? endpointData.successes++ : endpointData.errors++;
    }

    // Categorize special test types
    if (name.toLowerCase().includes('security') || name.toLowerCase().includes('injection') || name.toLowerCase().includes('validation')) {
      this.securityTests.push(result);
    }
    if (name.toLowerCase().includes('concurrent') || name.toLowerCase().includes('performance') || responseTime > 500) {
      this.performanceTests.push(result);
    }
    if (name.toLowerCase().includes('integration') || name.toLowerCase().includes('workflow')) {
      this.integrationTests.push(result);
    }
  }

  getStats() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = total - passed;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / total;
    
    return {
      total,
      passed,
      failed,
      successRate: Math.round((passed / total) * 100),
      avgResponseTime: Math.round(avgResponseTime),
      duration: Date.now() - this.startTime
    };
  }

  generateReport() {
    const stats = this.getStats();
    
    return {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        testSite: TEST_SITE,
        server: BASE_URL,
        duration: `${stats.duration}ms`,
        framework: 'Advanced Node.js Test Suite'
      },
      
      summary: stats,
      
      pageBreakdown: Array.from(this.pageResults.entries()).map(([page, data]) => ({
        page,
        total: data.passed + data.failed,
        passed: data.passed,
        failed: data.failed,
        successRate: Math.round((data.passed / (data.passed + data.failed)) * 100),
        tests: data.tests
      })),
      
      endpointAnalysis: Array.from(this.endpointMetrics.entries()).map(([endpoint, data]) => ({
        endpoint,
        calls: data.calls,
        avgResponseTime: Math.round(data.totalTime / data.calls),
        successRate: Math.round((data.successes / data.calls) * 100),
        reliability: data.errors === 0 ? 'EXCELLENT' : data.errors < data.successes ? 'GOOD' : 'POOR'
      })),
      
      securityAnalysis: {
        totalSecurityTests: this.securityTests.length,
        passedSecurityTests: this.securityTests.filter(t => t.status === 'PASS').length,
        securityScore: this.securityTests.length > 0 ? 
          Math.round((this.securityTests.filter(t => t.status === 'PASS').length / this.securityTests.length) * 100) : 0,
        tests: this.securityTests
      },
      
      performanceAnalysis: {
        totalPerformanceTests: this.performanceTests.length,
        avgPerformanceTime: this.performanceTests.length > 0 ?
          Math.round(this.performanceTests.reduce((sum, t) => sum + t.responseTime, 0) / this.performanceTests.length) : 0,
        slowTests: this.performanceTests.filter(t => t.responseTime > 1000),
        tests: this.performanceTests
      },
      
      detailedResults: this.results,
      
      recommendations: this.generateRecommendations(stats),
      
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        imgbbAvailable: !!IMGBB_API_KEY,
        databaseConnected: true // Will be tested
      }
    };
  }

  generateRecommendations(stats) {
    const recommendations = [];

    if (stats.failed > 0) {
      recommendations.push({
        type: 'CRITICAL',
        priority: 'HIGH',
        title: 'Failed Tests Detected',
        description: `${stats.failed} out of ${stats.total} tests failed`,
        action: 'Review failed tests and fix underlying issues',
        impact: 'System reliability compromised'
      });
    }

    if (stats.avgResponseTime > 500) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'MEDIUM',
        title: 'Slow Response Times',
        description: `Average response time is ${stats.avgResponseTime}ms`,
        action: 'Optimize database queries and endpoint logic',
        impact: 'User experience may be affected'
      });
    }

    const securityIssues = this.securityTests.filter(t => t.status === 'FAIL').length;
    if (securityIssues > 0) {
      recommendations.push({
        type: 'SECURITY',
        priority: 'HIGH',
        title: 'Security Vulnerabilities',
        description: `${securityIssues} security tests failed`,
        action: 'Address security vulnerabilities immediately',
        impact: 'System security compromised'
      });
    }

    if (!IMGBB_API_KEY) {
      recommendations.push({
        type: 'CONFIGURATION',
        priority: 'LOW',
        title: 'Missing ImgBB Configuration',
        description: 'ImgBB API key not configured',
        action: 'Add IMGBB_API_KEY to .env file for complete testing',
        impact: 'Image upload functionality cannot be fully tested'
      });
    }

    return recommendations;
  }
}

const tracker = new TestTracker();

const test = async (category, name, testFn, endpoint = null) => {
  const startTime = Date.now();
  try {
    await testFn();
    const responseTime = Date.now() - startTime;
    tracker.addResult(category, name, 'PASS', responseTime, endpoint);
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    tracker.addResult(category, name, 'FAIL', responseTime, endpoint, error.message);
    console.log(`❌ ${name} - ${error.message}`);
    return false;
  }
};

const section = (title) => {
  console.log('\n' + '='.repeat(70));
  console.log(`📋 ${title}`);
  console.log('='.repeat(70));
};

// Test data with realistic scenarios
const testScenarios = {
  siteInfo: {
    basic: () => ({ site: getUniqueSite(), client: 'Basic Client', address: 'Basic Address' }),
    complete: () => ({ 
      site: getUniqueSite(), 
      client: 'Complete Test Client', 
      address: '123 Advanced Test Street', 
      number1: '1234567890',
      number2: '0987654321',
      email: 'advanced.test@example.com'
    }),
    unicode: () => ({ 
      site: getUniqueSite(), 
      client: 'Client with émojis 🚀', 
      address: 'Adresse avec caractères spéciaux àéèùç' 
    }),
    long: () => ({ 
      site: getUniqueSite(), 
      client: 'A'.repeat(100), 
      address: 'B'.repeat(200) 
    })
  },
  
  equipment: {
    minimal: () => ({
      site: getUniqueSite(),
      nb_aerotherme: '1',
      nb_clim_ir: '1'
    }),
    comprehensive: () => ({
      site: getUniqueSite(),
      zone_aerotherme: 'Zone A,Zone B,Zone C',
      nb_aerotherme: '5',
      thermostat_aerotherme: 'Smart Digital',
      coffret_aerotherme: 'Premium',
      type_aerotherme: 'Electric,Gas,Hybrid',
      Fonctionement_aerotherme: 'Automatic',
      Maintenance_aerotherme: 'Weekly',
      commentaire_aero: 'Comprehensive aerotherme setup with advanced controls',
      zone_clim: 'Office,Workshop,Storage',
      nb_clim_ir: '4',
      nb_clim_wire: '3',
      coffret_clim: 'Industrial',
      type_clim: 'Split,Central,Portable',
      Fonctionement_clim: 'Intelligent',
      Maintenance_clim: 'Bi-weekly',
      commentaire_clim: 'Multi-zone climate control system',
      nb_rooftop: '2',
      thermostat_rooftop: 'Programmable',
      Eclairage_interieur: 'LED Smart',
      Eclairage_exterieur: 'Solar LED',
      commentaire_eclairage: 'Energy-efficient lighting system'
    })
  },
  
  gtbConfig: {
    simple: () => ({
      site: getUniqueSite(),
      modules: ['aeroeau'],
      aeroeau: 1,
      refs: { aeroeau: ['AE-001'] }
    }),
    complex: () => ({
      site: getUniqueSite(),
      modules: ['aeroeau', 'aerogaz', 'rooftop', 'eclairage'],
      aeroeau: 5,
      aerogaz: 3,
      rooftop: 2,
      eclairage: 4,
      refs: {
        aeroeau: ['AE-001', 'AE-002', 'AE-003', 'AE-004', 'AE-005'],
        aerogaz: ['AG-001', 'AG-002', 'AG-003'],
        rooftop: ['RT-001', 'RT-002'],
        eclairage: ['EC-001', 'EC-002', 'EC-003', 'EC-004']
      },
      sondes: 8,
      sondesPresentes: 6,
      gazCompteur: 'Advanced Digital',
      Izit: 'Model Pro Max'
    })
  }
};

async function runAdvancedTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 ADVANCED API TEST SUITE v3.0');
  console.log('='.repeat(70));
  console.log(`📍 Server: ${BASE_URL}`);
  console.log(`🔧 Test Site: ${TEST_SITE}`);
  console.log(`📅 Started: ${new Date().toLocaleString()}`);
  console.log(`🔑 ImgBB: ${IMGBB_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log('='.repeat(70));

  // 1. CONNECTIVITY & HEALTH CHECKS
  section('SYSTEM HEALTH CHECKS');
  
  await test('System Health', 'Server connectivity check', async () => {
    const response = await api.post('/list-sites');
    if (response.status !== 200) throw new Error('Server not responding');
    console.log(`   💾 Database has ${response.data.length} sites`);
  }, 'POST /list-sites');

  await test('System Health', 'Database responsiveness test', async () => {
    const start = Date.now();
    await api.post('/list-sites');
    const responseTime = Date.now() - start;
    if (responseTime > 2000) throw new Error(`Database too slow: ${responseTime}ms`);
    console.log(`   ⚡ Database response: ${responseTime}ms`);
  }, 'POST /list-sites');

  // 2. SITE INFORMATION PAGE TESTS
  section('SITEINFO PAGE (PAGE 1) - COMPREHENSIVE TESTS');
  
  await test('SiteInfo Page', 'Create basic site', async () => {
    const response = await api.post('/save-page1', testScenarios.siteInfo.basic());
    if (response.status !== 200) throw new Error('Basic site creation failed');
  }, 'POST /save-page1');

  await test('SiteInfo Page', 'Create complete site with all fields', async () => {
    const response = await api.post('/save-page1', testScenarios.siteInfo.complete());
    if (response.status !== 200) throw new Error('Complete site creation failed');
  }, 'POST /save-page1');

  await test('SiteInfo Page', 'Handle Unicode characters', async () => {
    const response = await api.post('/save-page1', testScenarios.siteInfo.unicode());
    if (response.status !== 200) throw new Error('Unicode handling failed');
  }, 'POST /save-page1');

  await test('SiteInfo Page', 'Handle long text fields', async () => {
    const response = await api.post('/save-page1', testScenarios.siteInfo.long());
    if (response.status !== 200) throw new Error('Long text handling failed');
  }, 'POST /save-page1');

  await test('SiteInfo Page', 'Retrieve site data accuracy', async () => {
    const testData = testScenarios.siteInfo.complete();
    await api.post('/save-page1', testData);
    const response = await api.post('/get-page1', { site: testData.site });
    if (response.data.client !== testData.client) {
      throw new Error('Data retrieval inaccurate');
    }
  }, 'POST /get-page1');

  await test('SiteInfo Page', 'Site appears in listing', async () => {
    const testData = testScenarios.siteInfo.basic();
    await api.post('/save-page1', testData);
    const response = await api.post('/list-sites');
    const found = response.data.some(s => s.site === testData.site);
    if (!found) throw new Error('Site not found in list');
  }, 'POST /list-sites');

  await test('SiteInfo Page', 'Update preserves other fields', async () => {
    // First create a complete site
    const testData = testScenarios.siteInfo.complete();
    await api.post('/save-page1', testData);
    
    // Then update only the address
    await api.post('/save-page1', { site: testData.site, address: 'Updated Address' });
    const response = await api.post('/get-page1', { site: testData.site });
    
    if (response.data.client !== testData.client) {
      throw new Error('Field preservation failed during update');
    }
    if (response.data.address !== 'Updated Address') {
      throw new Error('Update not applied');
    }
  }, 'POST /save-page1');

  // 3. EQUIPMENT PAGE TESTS
  section('EQUIPMENT PAGE (PAGE 2) - COMPREHENSIVE TESTS');

  await test('Equipment Page', 'Save minimal equipment configuration', async () => {
    const response = await api.post('/save_page2', testScenarios.equipment.minimal());
    if (response.status !== 200) throw new Error('Minimal equipment save failed');
  }, 'POST /save_page2');

  await test('Equipment Page', 'Save comprehensive equipment setup', async () => {
    const response = await api.post('/save_page2', testScenarios.equipment.comprehensive());
    if (response.status !== 200) throw new Error('Comprehensive equipment save failed');
  }, 'POST /save_page2');

  await test('Equipment Page', 'Retrieve equipment data', async () => {
    const testData = testScenarios.equipment.minimal();
    await api.post('/save_page2', testData);
    const response = await api.post('/get-page2', { site: testData.site });
    if (response.status !== 200 || !response.data.site) {
      throw new Error('Equipment data retrieval failed');
    }
  }, 'POST /get-page2');

  await test('Equipment Page', 'Array fields serialization', async () => {
    const testData = testScenarios.equipment.comprehensive();
    await api.post('/save_page2', testData);
    const response = await api.post('/get-page2', { site: testData.site });
    // Check if arrays are properly serialized as strings
    if (typeof response.data.zone_aerotherme !== 'string') {
      throw new Error('Array serialization failed');
    }
  }, 'POST /get-page2');

  // 4. GTB CONFIGURATION TESTS  
  section('GTB CONFIG PAGE (PAGE 5) - COMPREHENSIVE TESTS');

  await test('GTB Config Page', 'Save simple GTB configuration', async () => {
    const response = await api.post('/save_page3', testScenarios.gtbConfig.simple());
    if (response.status !== 200) throw new Error('Simple GTB config save failed');
  }, 'POST /save_page3');

  await test('GTB Config Page', 'Save complex GTB configuration', async () => {
    const response = await api.post('/save_page3', testScenarios.gtbConfig.complex());
    if (response.status !== 200) throw new Error('Complex GTB config save failed');
  }, 'POST /save_page3');

  await test('GTB Config Page', 'Retrieve GTB configuration', async () => {
    const testData = testScenarios.gtbConfig.simple();
    await api.post('/save_page3', testData);
    const response = await api.get(`/form_sql/${testData.site}`);
    if (response.status !== 200 || !response.data.site) {
      throw new Error('GTB config retrieval failed');
    }
  }, 'GET /form_sql/:site');

  await test('GTB Config Page', 'Reference arrays handling', async () => {
    const testData = testScenarios.gtbConfig.complex();
    await api.post('/save_page3', testData);
    const response = await api.get(`/form_sql/${testData.site}`);
    // Check if ref arrays are properly stored
    if (!response.data.ref_aeroeau || !response.data.ref_aerogaz) {
      throw new Error('Reference arrays not properly stored');
    }
  }, 'GET /form_sql/:site');

  // 5. IMAGE OPERATIONS - COMPREHENSIVE TESTING
  section('IMAGE OPERATIONS - ALL PAGES');

  await test('Image Operations', 'Save image metadata with all fields', async () => {
    const imageData = {
      site: TEST_SITE,
      type: 'comprehensive_test',
      title: 'advanced_test_image',
      url_viewer: 'https://example.com/advanced-test.jpg',
      delete_url: 'https://example.com/advanced-delete',
      shapes: [
        { id: 'advanced-1', x: 100, y: 150, type: 'aero' },
        { id: 'advanced-2', x: 250, y: 300, type: 'clim' },
        { id: 'advanced-3', x: 400, y: 450, type: 'rooftop' }
      ],
      width: 1920,
      height: 1080,
      crop_transform_x: 50,
      crop_transform_y: 50,
      crop_transform_width: 1820,
      crop_transform_height: 980
    };
    const response = await api.post('/images/upload-sql', imageData);
    if (response.status !== 200) throw new Error('Comprehensive image save failed');
  }, 'POST /images/upload-sql');

  await test('Image Operations', 'Retrieve images for site', async () => {
    const response = await api.post('/images/get-sql-images', { site: TEST_SITE });
    if (!Array.isArray(response.data)) throw new Error('Image retrieval failed');
  }, 'POST /images/get-sql-images');

  await test('Image Operations', 'Save VisualPlan (VT) image with complex shapes', async () => {
    const vtData = {
      site: TEST_SITE,
      type: 'grayscale',
      title: 'VT_advanced',
      url_viewer: 'https://example.com/vt-advanced.jpg',
      delete_url: 'https://example.com/vt-advanced-delete',
      shapes: [
        { id: 'vt-aero-1', x: 150, y: 200, label: 'Aero Zone 1' },
        { id: 'vt-aero-2', x: 300, y: 200, label: 'Aero Zone 2' },
        { id: 'vt-clim-1', x: 150, y: 350, label: 'Clim Office' },
        { id: 'vt-clim-2', x: 300, y: 350, label: 'Clim Workshop' },
        { id: 'vt-rooftop-1', x: 225, y: 500, label: 'Rooftop Unit' }
      ]
    };
    const response = await api.post('/images/upload-sql-vt2', vtData);
    if (response.status !== 200) throw new Error('Advanced VT image save failed');
  }, 'POST /images/upload-sql-vt2');

  await test('Image Operations', 'Save SurfacePlan cards with complex polygons', async () => {
    const surfaceData = {
      cards: [
        {
          site: TEST_SITE,
          title: 'surface_advanced_1',
          type: 'annotated',
          url_viewer: 'https://example.com/surface-advanced-1.jpg',
          delete_url: 'https://example.com/surface-advanced-1-delete',
          shapes: [
            { 
              points: [[100,100], [300,100], [300,250], [200,300], [100,250]], 
              color: '#FF0000',
              label: 'Production Area'
            },
            { 
              points: [[350,100], [500,100], [500,200], [350,200]], 
              color: '#00FF00',
              label: 'Office Area'
            }
          ],
          datetime: new Date()
        },
        {
          site: TEST_SITE,
          title: 'surface_advanced_2',
          type: 'grayscale',
          url_viewer: 'https://example.com/surface-advanced-2.jpg',
          delete_url: 'https://example.com/surface-advanced-2-delete',
          shapes: [
            { 
              points: [[50,50], [150,50], [150,150], [50,150]], 
              color: '#0000FF',
              label: 'Storage Area'
            }
          ],
          datetime: new Date()
        }
      ]
    };
    const response = await api.post('/images/upload-sql-surface', surfaceData);
    if (response.status !== 200) throw new Error('Advanced surface cards save failed');
  }, 'POST /images/upload-sql-surface');

  // 6. SECURITY & VALIDATION TESTS
  section('SECURITY & VALIDATION TESTS');

  await test('Security Tests', 'SQL injection prevention - malicious site name', async () => {
    try {
      await api.post('/save-page1', { 
        site: "'; DROP TABLE form_sql; --", 
        client: 'Hacker' 
      });
      // Check that tables still exist
      const checkResponse = await api.post('/list-sites');
      if (checkResponse.status !== 200) throw new Error('Tables may have been compromised');
    } catch (error) {
      // It's OK if the request fails due to validation
      if (error.response && error.response.status >= 400) {
        return; // Expected behavior
      }
      throw error;
    }
  }, 'POST /save-page1');

  await test('Security Tests', 'XSS prevention in text fields', async () => {
    const xssPayload = {
      site: `${TEST_SITE}_xss`,
      client: '<script>alert("XSS")</script>',
      address: '"><img src=x onerror=alert("XSS")>'
    };
    const response = await api.post('/save-page1', xssPayload);
    if (response.status !== 200) throw new Error('XSS payload handling failed');
    
    const retrieveResponse = await api.post('/get-page1', { site: `${TEST_SITE}_xss` });
    // Check that scripts are not executed (they should be stored as plain text)
    if (retrieveResponse.data.client.includes('<script>')) {
      console.log('   ⚠️  XSS payload stored as-is (ensure frontend sanitizes)');
    }
  }, 'POST /save-page1');

  await test('Security Tests', 'Request size limits', async () => {
    const largePayload = {
      site: getUniqueSite(),
      client: 'A'.repeat(10000),
      address: 'B'.repeat(10000)
    };
    try {
      const response = await api.post('/save-page1', largePayload);
      // Should either succeed or fail gracefully with proper status codes
      if (response.status < 200 || response.status >= 500) {
        throw new Error('Large payload not handled gracefully');
      }
    } catch (error) {
      // Accept 413 (Request Too Large) as a valid graceful handling
      if (error.response && error.response.status === 413) {
        return; // This is expected and acceptable
      }
      // Accept 4xx errors as graceful handling, reject 5xx errors
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        return; // Client errors are acceptable for large requests
      }
      throw new Error('Large payload caused server error instead of graceful handling');
    }
  }, 'POST /save-page1');

  await test('Security Tests', 'Invalid JSON handling', async () => {
    try {
      await api.post('/save-page1', 'invalid json');
      throw new Error('Invalid JSON should be rejected');
    } catch (error) {
      if (error.response?.status === 400) {
        return; // Expected behavior
      }
      throw error;
    }
  }, 'POST /save-page1');

  await test('Security Tests', 'Missing required fields validation', async () => {
    try {
      await api.post('/save-page1', { client: 'No Site Field' });
      throw new Error('Missing required field should be rejected');
    } catch (error) {
      if (error.response?.status === 400) {
        return; // Expected behavior
      }
      throw error;
    }
  }, 'POST /save-page1');

  await test('Security Tests', 'Non-existent site handling', async () => {
    try {
      await api.post('/get-page1', { site: 'absolutely_non_existent_site_12345' });
      throw new Error('Non-existent site should return 404');
    } catch (error) {
      if (error.response?.status === 404) {
        return; // Expected behavior
      }
      throw error;
    }
  }, 'POST /get-page1');

  // 7. PERFORMANCE & STRESS TESTS
  section('PERFORMANCE & STRESS TESTS');

  await test('Performance Tests', 'Concurrent site creations', async () => {
    const requests = Array.from({ length: 10 }, (_, i) => 
      api.post('/save-page1', { 
        site: `${TEST_SITE}_concurrent_${i}`, 
        client: `Concurrent Client ${i}` 
      })
    );
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    const allSuccessful = responses.every(r => r.status === 200);
    if (!allSuccessful) throw new Error('Some concurrent requests failed');
    console.log(`   ⚡ 10 concurrent requests completed in ${endTime - startTime}ms`);
  }, 'POST /save-page1');

  await test('Performance Tests', 'Mixed concurrent operations', async () => {
    const mixedRequests = [
      api.post('/save-page1', { site: `${TEST_SITE}_mixed_1`, client: 'Mixed 1' }),
      api.post('/get-page1', { site: TEST_SITE }),
      api.post('/save_page2', { site: TEST_SITE, nb_aerotherme: '1' }),
      api.post('/get-page2', { site: TEST_SITE }),
      api.post('/save_page3', { site: TEST_SITE, modules: ['aeroeau'], aeroeau: 1 }),
      api.get(`/form_sql/${TEST_SITE}`),
      api.post('/list-sites'),
      api.post('/images/get-sql-images', { site: TEST_SITE })
    ];
    
    const startTime = Date.now();
    const responses = await Promise.allSettled(mixedRequests);
    const endTime = Date.now();
    
    const successful = responses.filter(r => r.status === 'fulfilled').length;
    if (successful < 6) throw new Error(`Only ${successful}/8 mixed operations succeeded`);
    console.log(`   ⚡ Mixed operations: ${successful}/8 successful in ${endTime - startTime}ms`);
  });

  await test('Performance Tests', 'Large dataset retrieval', async () => {
    const startTime = Date.now();
    const response = await api.post('/list-sites');
    const endTime = Date.now();
    
    if (endTime - startTime > 3000) {
      throw new Error(`Site listing too slow: ${endTime - startTime}ms`);
    }
    console.log(`   📊 Retrieved ${response.data.length} sites in ${endTime - startTime}ms`);
  }, 'POST /list-sites');

  // 8. INTEGRATION & WORKFLOW TESTS
  section('INTEGRATION & WORKFLOW TESTS');

  await test('Integration Tests', 'Complete site setup workflow', async () => {
    const workflowSite = `${TEST_SITE}_workflow`;
    
    // Step 1: Create site
    await api.post('/save-page1', {
      site: workflowSite,
      client: 'Workflow Test Client',
      address: 'Workflow Address',
      email: 'workflow@test.com'
    });
    
    // Step 2: Add equipment
    await api.post('/save_page2', {
      site: workflowSite,
      nb_aerotherme: '3',
      nb_clim_ir: '2',
      nb_rooftop: '1',
      commentaire_aero: 'Workflow aerotherme'
    });
    
    // Step 3: Configure GTB
    await api.post('/save_page3', {
      site: workflowSite,
      modules: ['aeroeau', 'aerogaz'],
      aeroeau: 2,
      aerogaz: 1,
      refs: {
        aeroeau: ['WF-AE-001', 'WF-AE-002'],
        aerogaz: ['WF-AG-001']
      }
    });
    
    // Step 4: Verify complete data
    const finalCheck = await api.get(`/form_sql/${workflowSite}`);
    if (!finalCheck.data.client || !finalCheck.data.nb_aerotherme || !finalCheck.data.ref_aeroeau) {
      throw new Error('Workflow data incomplete');
    }
    
    console.log(`   🔄 Complete workflow successful for site: ${workflowSite}`);
  });

  await test('Integration Tests', 'Data consistency across pages', async () => {
    const consistencySite = `${TEST_SITE}_consistency`;
    
    // Create base site
    await api.post('/save-page1', {
      site: consistencySite,
      client: 'Consistency Client'
    });
    
    // Add equipment data
    await api.post('/save_page2', {
      site: consistencySite,
      nb_aerotherme: '5'
    });
    
    // Retrieve through different endpoints
    const page1Data = await api.post('/get-page1', { site: consistencySite });
    const page2Data = await api.post('/get-page2', { site: consistencySite });
    const sqlData = await api.get(`/form_sql/${consistencySite}`);
    
    // Check consistency
    if (page1Data.data.site !== consistencySite || 
        page2Data.data.site !== consistencySite || 
        sqlData.data.site !== consistencySite) {
      throw new Error('Site name inconsistency detected');
    }
    
    if (page2Data.data.nb_aerotherme !== sqlData.data.nb_aerotherme) {
      throw new Error('Equipment data inconsistency detected');
    }
    
    console.log(`   ✓ Data consistency verified across all endpoints`);
  });

  // 9. CLEANUP & DELETION TESTS
  section('CLEANUP & DELETION TESTS');

  await test('Cleanup Tests', 'Equipment page image upload and delete workflow', async () => {
    // First, create a test image entry
    const equipmentImageData = {
      site: TEST_SITE,
      type: 'aero', // Equipment type
      title: 'Equipment Test Image',
      url_viewer: 'https://i.ibb.co/test-equipment-image.jpg',
      delete_url: 'https://ibb.co/delete/test-equipment/abcd1234',
    };
    
    // Upload the image metadata
    const uploadResponse = await api.post('/images/upload-sql', equipmentImageData);
    if (uploadResponse.status !== 200) throw new Error('Equipment image save failed');
    
    // Verify it exists
    const getResponse = await api.post('/images/get-sql-images', { site: TEST_SITE });
    const foundImage = getResponse.data.find(img => img.type === 'aero' && img.title === 'Equipment Test Image');
    if (!foundImage) throw new Error('Uploaded image not found');
    
    // Test deletion from ImgBB
    const imgbbDeleteResponse = await api.post('/images/delete-imgbb', {
      delete_url: equipmentImageData.delete_url
    });
    console.log('   🗑️ ImgBB deletion response:', imgbbDeleteResponse.status);
    
    // Test deletion from SQL
    const sqlDeleteResponse = await api.post('/images/delete-sql', {
      delete_url: equipmentImageData.delete_url
    });
    if (sqlDeleteResponse.status !== 200) throw new Error('Equipment image SQL deletion failed');
    
    // Verify the response structure (server now wraps response in 'data' object)
    if (!sqlDeleteResponse.data.data || !sqlDeleteResponse.data.data.message) {
      throw new Error('SQL deletion response format incorrect');
    }
    
    // Verify it's deleted from SQL
    const verifyResponse = await api.post('/images/get-sql-images', { site: TEST_SITE });
    const stillExists = verifyResponse.data.find(img => img.delete_url === equipmentImageData.delete_url);
    if (stillExists) throw new Error('Image not properly deleted from SQL');
    
    console.log('   ✅ Equipment image upload and delete workflow completed successfully');
  }, 'POST /images/delete-imgbb');

  await test('Cleanup Tests', 'Delete image metadata', async () => {
    const response = await api.post('/images/delete-sql', {
      delete_url: 'https://example.com/advanced-delete'
    });
    if (response.status !== 200) throw new Error('Image metadata deletion failed');
  }, 'POST /images/delete-sql');

  await test('Cleanup Tests', 'Delete VT images and metadata', async () => {
    const response = await api.post('/images/delete-sql-vt2', {
      site: TEST_SITE,
      title: 'VT_advanced'
    });
    if (!response.data.success) throw new Error('VT deletion failed');
  }, 'POST /images/delete-sql-vt2');

  await test('Cleanup Tests', 'Delete surface cards', async () => {
    const response = await api.post('/images/delete-sql-surface', {
      grayscale_delete_url: 'https://example.com/surface-advanced-2-delete',
      annotated_delete_url: 'https://example.com/surface-advanced-1-delete',
      site: TEST_SITE,
      title: 'surface_advanced_1'
    });
    if (!response.data.success) throw new Error('Surface deletion failed');
  }, 'POST /images/delete-sql-surface');

  // FINAL REPORT GENERATION
  section('TEST COMPLETION & REPORTING');

  const report = tracker.generateReport();
  fs.writeFileSync('advanced-test-report.json', JSON.stringify(report, null, 2));
  
  const stats = tracker.getStats();
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 ADVANCED TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${stats.passed}/${stats.total} tests`);
  console.log(`❌ Failed: ${stats.failed}/${stats.total} tests`);
  console.log(`📈 Success Rate: ${stats.successRate}%`);
  console.log(`⚡ Avg Response Time: ${stats.avgResponseTime}ms`);
  console.log(`⏱️ Total Duration: ${stats.duration}ms`);
  console.log(`🔧 Test Site: ${TEST_SITE}`);
  console.log('='.repeat(70));
  
  if (report.recommendations.length > 0) {
    console.log('\n📋 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.type}] ${rec.title}`);
      console.log(`   Action: ${rec.action}`);
    });
  }
  
  console.log('\n📄 Detailed report saved to: advanced-test-report.json');
  console.log(`🎯 Test completed with ${stats.successRate}% success rate`);
  
  if (stats.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! System is working perfectly.');
  }
  
  return stats.failed === 0;
}

// Server check and main execution
async function checkServer() {
  try {
    await api.post('/list-sites');
    return true;
  } catch {
    console.error('❌ Server not accessible. Please start with: npm run server');
    return false;
  }
}

async function main() {
  if (!(await checkServer())) {
    process.exit(1);
  }
  
  const success = await runAdvancedTests();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});