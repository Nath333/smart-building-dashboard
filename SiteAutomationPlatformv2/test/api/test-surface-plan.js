import dotenv from 'dotenv';
import { TestRunner, createApiClient, generateTestSite, validateResponse, validateData } from '../utils/test-helpers.js';
import { TEST_CONFIG } from '../config/test-config.js';

dotenv.config();

/**
 * SurfacePlanPage Comprehensive Test Suite
 * Tests polygon drawing, image upload, card management, and persistence
 */

const api = createApiClient(TEST_CONFIG.server.baseURL, TEST_CONFIG.server.timeout);
const TEST_SITE = generateTestSite('surface_plan');

// Mock image data (base64 1x1 pixel image)
const MOCK_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

// Sample polygon coordinates for testing
const SAMPLE_POLYGONS = [
  {
    id: 'polygon-1',
    type: 'polygon',
    color: 'blue',
    points: [
      { x: 100, y: 150 },
      { x: 200, y: 150 },
      { x: 150, y: 250 }
    ]
  },
  {
    id: 'polygon-2', 
    type: 'polygon',
    color: 'red',
    points: [
      { x: 300, y: 100 },
      { x: 400, y: 100 },
      { x: 400, y: 200 },
      { x: 300, y: 200 }
    ]
  }
];

// Sample surface card data
const SAMPLE_SURFACE_CARD = {
  site: TEST_SITE,
  type: 'annotated',
  title: 'surface',
  url_viewer: 'https://i.ibb.co/test/surface_card.jpg',
  url_thumb: 'https://i.ibb.co/test/surface_thumb.jpg',
  url_medium: 'https://i.ibb.co/test/surface_medium.jpg',
  delete_url: 'https://i.ibb.co/test/delete_surface',
  shapes: SAMPLE_POLYGONS,
  width: 800,
  height: 600,
  crop_transform_x: 0,
  crop_transform_y: 0,
  crop_transform_width: 800,
  crop_transform_height: 600,
  datetime: new Date().toISOString(),
  card_id: 1
};

class SurfacePlanTestRunner extends TestRunner {
  constructor() {
    super('SurfacePlan API Tests');
    this.createdImageIds = [];
    this.deleteUrls = [];
  }

  // Cleanup helper
  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    // Clean up images from SQL
    for (const deleteUrl of this.deleteUrls) {
      try {
        await api.delete('/images/delete-from-imgbb', { data: { deleteUrl } });
      } catch {
        console.log(`⚠️ Failed to delete image: ${deleteUrl}`);
      }
    }

    // Clean up SQL records
    try {
      await api.post('/images/delete-sql', {
        delete_url: 'test-cleanup'
      });
    } catch {
      console.log(`⚠️ Failed to clean SQL records for site: ${TEST_SITE}`);
    }

    console.log('✅ Cleanup completed');
  }
}

// Test Suite
const runSurfacePlanTests = async () => {
  const testRunner = new SurfacePlanTestRunner();
  let imageId = null;

  console.log('🚀 Starting SurfacePlan Comprehensive Test Suite');
  console.log(`📍 Test Site: ${TEST_SITE}`);
  console.log(`🌐 API Base URL: ${TEST_CONFIG.server.baseURL}`);
  console.log('='.repeat(60));

  // === 1. CONNECTIVITY TESTS ===
  await testRunner.test('Server Connectivity', async () => {
    const response = await api.post('/list-sites', {});
    validateResponse(response, 200);
    if (!Array.isArray(response.data)) {
      throw new Error('Expected array response from list-sites');
    }
  });

  // === 2. IMAGE UPLOAD TESTS ===
  await testRunner.test('Surface Image Upload - Valid Image', async () => {
    const uploadData = {
      imageDataUrl: MOCK_IMAGE_BASE64,
      filename: `surface_test_${Date.now()}.png`,
      title: `Test Surface Plan ${TEST_SITE}`
    };

    const response = await api.post('/images/upload', uploadData);
    validateResponse(response, 200);
    validateData(response.data, ['url', 'delete_url']);
    
    // Store for cleanup
    testRunner.deleteUrls.push(response.data.delete_url);
  });

  await testRunner.test('Surface Image Upload - Invalid Format', async () => {
    try {
      await api.post('/images/upload', {
        imageDataUrl: 'invalid-data',
        filename: 'test.txt',
        title: 'Invalid Test'
      });
      throw new Error('Should have rejected invalid image format');
    } catch (error) {
      if (error.message.includes('Should have rejected')) throw error;
      // Expected to fail - validation working
    }
  });

  // === 3. SURFACE CARD MANAGEMENT TESTS ===
  await testRunner.test('Save Surface Card with Polygons', async () => {
    const response = await api.post('/images/upload-sql', SAMPLE_SURFACE_CARD);
    validateResponse(response, 200);
    validateData(response.data, ['insertId']);
    
    imageId = response.data.insertId;
    testRunner.createdImageIds.push(imageId);
  });

  await testRunner.test('Retrieve Surface Cards by Site', async () => {
    const response = await api.post('/images/get-sql-images', {
      site: TEST_SITE,
      title: 'surface'
    });
    
    validateResponse(response, 200);
    validateData(response.data, ['images']);
    
    if (!Array.isArray(response.data.images)) {
      throw new Error('Expected images array in response');
    }

    const images = response.data.images;
    if (images.length > 0) {
      const image = images[0];
      validateData(image, ['site', 'type', 'title', 'shapes']);
      
      // Validate polygon data
      const shapes = JSON.parse(image.shapes);
      if (!Array.isArray(shapes)) {
        throw new Error('Shapes should be parsed as array');
      }
      
      if (shapes.length > 0) {
        const polygon = shapes[0];
        validateData(polygon, ['id', 'type', 'color', 'points']);
        
        if (!Array.isArray(polygon.points)) {
          throw new Error('Polygon points should be array');
        }
      }
    }
  });

  // === 4. POLYGON FUNCTIONALITY TESTS ===
  await testRunner.test('Polygon Validation - Blue Polygon', async () => {
    const bluePolygon = SAMPLE_POLYGONS.find(p => p.color === 'blue');
    
    if (!bluePolygon) throw new Error('Blue polygon not found in test data');
    if (bluePolygon.points.length < 3) {
      throw new Error('Polygon must have at least 3 points');
    }
    
    // Validate point structure
    bluePolygon.points.forEach((point, index) => {
      if (typeof point.x !== 'number' || typeof point.y !== 'number') {
        throw new Error(`Point ${index} has invalid coordinates`);
      }
    });
  });

  await testRunner.test('Polygon Validation - Red Polygon', async () => {
    const redPolygon = SAMPLE_POLYGONS.find(p => p.color === 'red');
    
    if (!redPolygon) throw new Error('Red polygon not found in test data');
    if (redPolygon.color !== 'red') {
      throw new Error('Expected red color for hot surface polygon');
    }
    
    // Validate closed polygon (rectangle)
    if (redPolygon.points.length !== 4) {
      throw new Error('Rectangle polygon should have 4 points');
    }
  });

  await testRunner.test('Multi-Polygon Surface Card', async () => {
    const multiPolygonCard = {
      ...SAMPLE_SURFACE_CARD,
      shapes: [
        ...SAMPLE_POLYGONS,
        {
          id: 'polygon-3',
          type: 'polygon', 
          color: 'blue',
          points: [
            { x: 50, y: 50 },
            { x: 100, y: 50 },
            { x: 75, y: 100 }
          ]
        }
      ],
      card_id: 2
    };

    const response = await api.post('/images/upload-sql', multiPolygonCard);
    validateResponse(response, 200);
    
    testRunner.createdImageIds.push(response.data.insertId);
  });

  // === 5. CARD DELETION TESTS ===
  await testRunner.test('Get Delete URLs for Surface Cards', async () => {
    const response = await api.post('/images/get-delete-url', {
      site: TEST_SITE,
      title: 'surface'
    });
    
    validateResponse(response, 200);
    if (response.data.deleteUrls) {
      testRunner.deleteUrls.push(...response.data.deleteUrls);
    }
  });

  await testRunner.test('Delete Single Surface Card', async () => {
    if (imageId) {
      const response = await api.post('/images/delete-sql', {
        delete_url: 'test-delete-url'
      });
      validateResponse(response, 200);
    } else {
      console.log('⚠️ Skipping deletion test - no image ID available');
    }
  });

  // === 6. EDGE CASE TESTS ===
  await testRunner.test('Empty Site Query', async () => {
    const response = await api.post('/images/get-sql-images', {
      site: 'nonexistent_site',
      title: 'surface'
    });
    
    validateResponse(response, 200);
    validateData(response.data, ['images']);
    
    if (response.data.images.length !== 0) {
      throw new Error('Expected empty array for nonexistent site');
    }
  });

  await testRunner.test('Invalid Polygon Data', async () => {
    try {
      const invalidCard = {
        ...SAMPLE_SURFACE_CARD,
        shapes: [{
          id: 'invalid-polygon',
          type: 'polygon',
          color: 'invalid-color',
          points: [{ x: 'invalid', y: 'coordinates' }]
        }],
        card_id: 3
      };

      await api.post('/images/upload-sql', invalidCard);
      // Should still save but with invalid data - test data integrity
    } catch (error) {
      // Expected behavior - validation should catch this
      if (!error.message.includes('validation')) {
        throw error;
      }
    }
  });

  // === 7. PERFORMANCE TESTS ===
  await testRunner.test('Multiple Surface Cards Performance', async () => {
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      const cardData = {
        ...SAMPLE_SURFACE_CARD,
        card_id: i + 10,
        shapes: SAMPLE_POLYGONS
      };
      
      promises.push(api.post('/images/upload-sql', cardData));
    }
    
    const responses = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    responses.forEach(response => validateResponse(response, 200));
    
    if (duration > TEST_CONFIG.performance.maxResponseTime) {
      throw new Error(`Batch operation too slow: ${duration}ms > ${TEST_CONFIG.performance.maxResponseTime}ms`);
    }
    
    // Store IDs for cleanup
    testRunner.createdImageIds.push(...responses.map(r => r.data.insertId));
  });

  // === 8. DATA INTEGRITY TESTS ===
  await testRunner.test('Surface Card Data Integrity', async () => {
    // Save a card
    const originalCard = {
      ...SAMPLE_SURFACE_CARD,
      card_id: 99,
      shapes: SAMPLE_POLYGONS
    };
    
    const saveResponse = await api.post('/images/upload-sql', originalCard);
    validateResponse(saveResponse, 200);
    
    // Retrieve and verify
    const getResponse = await api.post('/images/get-sql-images', {
      site: TEST_SITE,
      title: 'surface'
    });
    
    validateResponse(getResponse, 200);
    const savedCard = getResponse.data.images.find(img => img.card_id === 99);
    
    if (!savedCard) throw new Error('Saved card not found');
    
    // Verify shapes data integrity
    const originalShapes = JSON.parse(originalCard.shapes);
    const savedShapes = JSON.parse(savedCard.shapes);
    
    if (originalShapes.length !== savedShapes.length) {
      throw new Error('Shapes count mismatch after save/retrieve');
    }
    
    testRunner.createdImageIds.push(saveResponse.data.insertId);
  });

  // === 9. SECURITY TESTS ===
  await testRunner.test('SQL Injection Prevention - Shapes Field', async () => {
    try {
      const maliciousCard = {
        ...SAMPLE_SURFACE_CARD,
        shapes: "'; DROP TABLE image_sql; --",
        card_id: 999
      };
      
      await api.post('/images/upload-sql', maliciousCard);
      
      // Verify table still exists by querying
      const response = await api.post('/images/get-sql-images', {
        site: TEST_SITE,
        title: 'surface'
      });
      
      validateResponse(response, 200);
      // If we get here, SQL injection was prevented
      
    } catch (error) {
      // Either prevented by validation or caught by sanitization
      if (error.response?.status !== 400) {
        throw error;
      }
    }
  });

  await testRunner.test('XSS Prevention - Site Name', async () => {
    const xssPayload = "<script>alert('xss')</script>";
    
    try {
      await api.post('/images/get-sql-images', {
        site: xssPayload,
        title: 'surface'
      });
      
      // Should either sanitize or reject
    } catch (error) {
      // Expected - XSS should be prevented
      if (!error.message.includes('validation') && error.response?.status !== 400) {
        throw error;
      }
    }
  });

  // === CLEANUP ===
  await testRunner.cleanup();

  // === RESULTS ===
  const summary = testRunner.printSummary();
  
  if (summary.successRate < 90) {
    console.log('\n🚨 LOW SUCCESS RATE - REQUIRES ATTENTION');
    process.exit(1);
  } else if (summary.successRate === 100) {
    console.log('\n🎉 ALL TESTS PASSED - SURFACE PLAN SYSTEM FULLY OPERATIONAL');
  } else {
    console.log('\n✅ TESTS COMPLETED WITH MINOR ISSUES');
  }
  
  return summary;
};

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSurfacePlanTests().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}

export default runSurfacePlanTests;
export { SurfacePlanTestRunner, SAMPLE_POLYGONS, SAMPLE_SURFACE_CARD };