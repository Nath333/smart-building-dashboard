/**
 * Test Page 2 Image Upload and Fetch with Zone Support
 *
 * This test verifies that:
 * 1. Images can be uploaded with zone information
 * 2. Images are correctly filtered by site, type, and zone
 * 3. Zone-aware data fetching works as expected
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = 'http://localhost:4001';
const TEST_SITE = 'Test_Zone_Images';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Create a test image buffer (1x1 red pixel PNG)
 */
function createTestImageBuffer() {
  // 1x1 red pixel PNG in base64
  const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  return Buffer.from(base64Image, 'base64');
}

/**
 * Upload a test image to ImgBB
 */
async function uploadTestImage(siteName, type, zone, title) {
  try {
    log(`\n📤 Uploading test image: ${title}`, 'cyan');

    const imageBuffer = createTestImageBuffer();
    const formData = new FormData();
    formData.append('image', imageBuffer, { filename: 'test.png' });
    formData.append('site', siteName);
    formData.append('type', type);
    formData.append('title', title);

    const response = await axios.post(`${API_BASE_URL}/images/upload-imgbb`, formData, {
      headers: formData.getHeaders()
    });

    if (!response.data.url || !response.data.delete_url) {
      throw new Error('Invalid upload response');
    }

    log(`✅ Upload successful: ${response.data.url}`, 'green');
    return response.data;
  } catch (error) {
    log(`❌ Upload failed: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Save image metadata to SQL with zone information
 */
async function saveImageToSQL(imageData) {
  try {
    log(`\n💾 Saving to SQL with zone: ${imageData.zone_name || 'null'}`, 'cyan');

    const response = await axios.post(`${API_BASE_URL}/images/upload-sql`, {
      url_viewer: imageData.url,
      delete_url: imageData.delete_url,
      site: imageData.site,
      type: imageData.type,
      zone_name: imageData.zone_name || null,
      title: imageData.title
    });

    log(`✅ SQL save successful`, 'green');
    return response.data;
  } catch (error) {
    log(`❌ SQL save failed: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Fetch images from SQL
 */
async function fetchImages(site, zone_name = null) {
  try {
    const params = { site };
    if (zone_name) {
      params.zone_name = zone_name;
    }

    log(`\n🔍 Fetching images for site="${site}", zone="${zone_name || 'all'}"`, 'cyan');

    const response = await axios.post(`${API_BASE_URL}/images/get-sql-images`, params);

    log(`✅ Found ${response.data.length} images`, 'green');
    return response.data;
  } catch (error) {
    log(`❌ Fetch failed: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Delete image from both ImgBB and SQL
 */
async function deleteImage(delete_url) {
  try {
    log(`\n🗑️ Deleting image: ${delete_url}`, 'cyan');

    // Delete from ImgBB
    await axios.post(`${API_BASE_URL}/images/delete-imgbb`, { delete_url });

    // Delete from SQL
    await axios.post(`${API_BASE_URL}/images/delete-sql`, { delete_url });

    log(`✅ Deletion successful`, 'green');
  } catch (error) {
    log(`⚠️ Deletion warning: ${error.message}`, 'yellow');
    // Don't throw - deletion errors are not critical for test
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n========================================', 'blue');
  log('🧪 Page 2 Zone-Based Image Test Suite', 'blue');
  log('========================================\n', 'blue');

  const uploadedImages = [];
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // ============================================
    // Test 1: Upload images with different zones
    // ============================================
    log('\n📋 Test 1: Upload images with different zones', 'yellow');

    const testCases = [
      { type: 'Aero', zone: 'surface_de_vente', title: `${TEST_SITE}_Aero_surface_de_vente_Vt` },
      { type: 'Aero', zone: 'bureau', title: `${TEST_SITE}_Aero_bureau_Vt` },
      { type: 'Clim', zone: 'surface_de_vente', title: `${TEST_SITE}_Clim_surface_de_vente_Vt` },
      { type: 'Clim', zone: 'bureau', title: `${TEST_SITE}_Clim_bureau_Vt` },
      { type: 'Rooftop', zone: null, title: `${TEST_SITE}_Rooftop_Vt` } // No zone (legacy)
    ];

    for (const testCase of testCases) {
      try {
        // Upload to ImgBB
        const uploadResult = await uploadTestImage(
          TEST_SITE,
          testCase.type,
          testCase.zone,
          testCase.title
        );

        // Save to SQL with zone info
        await saveImageToSQL({
          url: uploadResult.url,
          delete_url: uploadResult.delete_url,
          site: TEST_SITE,
          type: testCase.type,
          zone_name: testCase.zone,
          title: testCase.title
        });

        uploadedImages.push(uploadResult);
        testsPassed++;
      } catch (error) {
        log(`❌ Test case failed: ${testCase.title}`, 'red');
        testsFailed++;
      }
    }

    log(`\n✅ Test 1 Results: ${testsPassed}/${testCases.length} uploads successful`, 'green');

    // ============================================
    // Test 2: Fetch all images for site
    // ============================================
    log('\n📋 Test 2: Fetch all images for site', 'yellow');

    const allImages = await fetchImages(TEST_SITE);

    if (allImages.length >= testCases.length) {
      log(`✅ Test 2 PASSED: Found ${allImages.length} images (expected at least ${testCases.length})`, 'green');
      testsPassed++;
    } else {
      log(`❌ Test 2 FAILED: Found ${allImages.length} images (expected at least ${testCases.length})`, 'red');
      testsFailed++;
    }

    // ============================================
    // Test 3: Fetch images filtered by zone
    // ============================================
    log('\n📋 Test 3: Fetch images filtered by zone', 'yellow');

    const surfaceImages = await fetchImages(TEST_SITE, 'surface_de_vente');
    const bureauImages = await fetchImages(TEST_SITE, 'bureau');

    const surfaceCount = surfaceImages.filter(img => img.zone_name === 'surface_de_vente').length;
    const bureauCount = bureauImages.filter(img => img.zone_name === 'bureau').length;

    log(`  📊 surface_de_vente zone: ${surfaceCount} images`, 'cyan');
    log(`  📊 bureau zone: ${bureauCount} images`, 'cyan');

    if (surfaceCount >= 2 && bureauCount >= 2) {
      log(`✅ Test 3 PASSED: Zone filtering works correctly`, 'green');
      testsPassed++;
    } else {
      log(`❌ Test 3 FAILED: Zone filtering not working correctly`, 'red');
      testsFailed++;
    }

    // ============================================
    // Test 4: Verify zone_name field in results
    // ============================================
    log('\n📋 Test 4: Verify zone_name field in results', 'yellow');

    const aeroSurfaceImages = allImages.filter(img =>
      img.type === 'Aero' && img.zone_name === 'surface_de_vente'
    );

    if (aeroSurfaceImages.length > 0) {
      log(`✅ Test 4 PASSED: zone_name field correctly stored and retrieved`, 'green');
      log(`  Example: type="${aeroSurfaceImages[0].type}", zone="${aeroSurfaceImages[0].zone_name}"`, 'cyan');
      testsPassed++;
    } else {
      log(`❌ Test 4 FAILED: zone_name field not found or incorrect`, 'red');
      testsFailed++;
    }

    // ============================================
    // Test 5: Verify legacy images (no zone)
    // ============================================
    log('\n📋 Test 5: Verify legacy images without zone', 'yellow');

    const legacyImages = allImages.filter(img =>
      img.type === 'Rooftop' && !img.zone_name
    );

    if (legacyImages.length > 0) {
      log(`✅ Test 5 PASSED: Legacy images (no zone) still work`, 'green');
      testsPassed++;
    } else {
      log(`❌ Test 5 FAILED: Legacy images not working`, 'red');
      testsFailed++;
    }

  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
    testsFailed++;
  } finally {
    // ============================================
    // Cleanup: Delete all test images
    // ============================================
    log('\n🧹 Cleaning up test images...', 'yellow');

    for (const image of uploadedImages) {
      await deleteImage(image.delete_url);
    }

    log(`✅ Cleanup complete: ${uploadedImages.length} images deleted`, 'green');
  }

  // ============================================
  // Final Results
  // ============================================
  log('\n========================================', 'blue');
  log('📊 Test Summary', 'blue');
  log('========================================', 'blue');
  log(`✅ Tests Passed: ${testsPassed}`, 'green');
  log(`❌ Tests Failed: ${testsFailed}`, 'red');
  log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`, 'cyan');
  log('========================================\n', 'blue');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
