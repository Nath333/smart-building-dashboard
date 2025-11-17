# API Test Suite Documentation

## Overview
This test suite provides comprehensive testing for all API endpoints, SQL operations, and ImgBB integration in the application.

## Test Files

### 1. `test-api.js`
Main test file containing all test implementations:
- **Page 1 CRUD Tests**: Site information create, read, update operations
- **Page 2 Operations**: Equipment data management
- **Page 3 GTB Tests**: Building automation configuration
- **Image Operations**: SQL storage and retrieval of image metadata
- **ImgBB Integration**: Upload and delete operations
- **Delete Operations**: Cleanup tests for all data types
- **Error Handling**: Validation and error response tests
- **Concurrent Requests**: Performance testing
- **Data Integrity**: Security and consistency validation

### 2. `test-runner.js`
Interactive test runner with menu-driven interface:
- Automatic server status checking
- Server start/stop management
- Category-based test selection
- Test report generation

## Prerequisites

1. **Environment Variables** (.env file):
```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=admin
DB_NAME=avancement
IMGBB_API_KEY=your_imgbb_api_key
PORT=4001
```

2. **Database Setup**:
- MySQL/MariaDB running
- Database `avancement` created
- Tables `form_sql` and `image_sql` created with proper schema

3. **Dependencies**:
```bash
npm install axios chalk ora inquirer form-data
```

## Running Tests

### Method 1: Direct Execution
```bash
# Run all tests
node test-api.js

# With custom server URL
API_URL=http://localhost:4001 node test-api.js
```

### Method 2: Interactive Runner
```bash
# Interactive menu with server management
node test-runner.js
```

### Method 3: NPM Scripts
Add to package.json:
```json
{
  "scripts": {
    "test": "node test-api.js",
    "test:interactive": "node test-runner.js",
    "test:server": "concurrently \"npm run server\" \"npm run test\"",
    "test:clean": "node test-api.js && rm -f test-image.svg test-report.json"
  }
}
```

Then run:
```bash
npm test
npm run test:interactive
npm run test:server
```

## Test Categories

### 1. CRUD Operations
- Page 1: Site information (save, get, list)
- Page 2: Equipment data (save, get, update)
- Page 3: GTB configuration (save, get)
- Position updates

### 2. Image Operations
- Upload metadata to SQL
- Retrieve images by site
- VT image handling with shapes
- Surface cards with polygons
- Batch operations

### 3. ImgBB Integration
- Image upload to ImgBB
- Delete from ImgBB
- Multiple image handling
- Error recovery

### 4. Error Handling
- Invalid site handling
- Missing required fields
- Non-existent data
- Malformed requests
- SQL injection prevention

### 5. Performance Tests
- Concurrent request handling
- Mixed operation load testing
- Response time measurement
- Connection pool testing

### 6. Data Integrity
- Update persistence
- Field preservation
- Transaction consistency
- Security validation

## Test Output

### Console Output
```
============================================================
🚀 COMPREHENSIVE API TEST SUITE
============================================================
📍 Server: http://localhost:4001
🔧 Test Site: test_site_1234567890
📅 Started: 2024-01-15 10:30:00
============================================================

📋 PAGE 1 - Site Information CRUD Tests
============================================================
✅ Save Page 1 data
✅ Get Page 1 data
  📄 Retrieved data: {"site":"test_site_1234567890","client":"Test Client"...
✅ List sites includes test site
  📄 Total sites found: 15
✅ Invalid request handling (no site)

📋 PAGE 2 - Site Equipment Tests
============================================================
✅ Save Page 2 equipment data
  📄 Affected rows: 1
✅ Get Page 2 equipment data
  📄 Retrieved equipment fields: 85
✅ Partial update of equipment data
```

### Test Report (test-report.json)
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "server": "http://localhost:4001",
  "categories": ["crud", "images", "errors", "performance", "integrity"],
  "results": {
    "passed": 45,
    "failed": 2,
    "duration": "15.3s"
  }
}
```

## Test Data Cleanup

The test suite creates temporary data with timestamps to avoid conflicts:
- Site names: `test_site_${timestamp}`
- Image titles: `test_upload_${timestamp}`

Cleanup is automatic, but you can manually clean test data:
```sql
DELETE FROM form_sql WHERE site LIKE 'test_site_%';
DELETE FROM image_sql WHERE site LIKE 'test_site_%';
```

## Troubleshooting

### Common Issues

1. **Server not running**:
```bash
# Start server manually
npm run server
# Or use interactive runner
node test-runner.js
```

2. **Database connection failed**:
- Check MySQL is running
- Verify credentials in .env
- Ensure database exists

3. **ImgBB tests skipped**:
- Add IMGBB_API_KEY to .env file
- Verify API key is valid

4. **Port already in use**:
```bash
# Find process using port 4001
lsof -i :4001  # Unix/Mac
netstat -ano | findstr :4001  # Windows

# Kill process or change port in .env
PORT=4002
```

## Extending Tests

### Adding New Test Cases

1. Add test function to `tests` object in test-api.js:
```javascript
async testCustomFeature() {
  logSection('CUSTOM FEATURE Tests');
  
  try {
    logTest('Testing custom endpoint', false);
    const response = await api.post('/custom-endpoint', data);
    if (response.status === 200) {
      logTest('Custom endpoint works', true);
    }
  } catch (error) {
    logError(error);
  }
}
```

2. Add to test execution list:
```javascript
const testFunctions = [
  // ... existing tests
  'testCustomFeature',
];
```

### Custom Test Categories

Modify `testCategories` in test-runner.js:
```javascript
const testCategories = {
  all: 'Run all tests',
  custom: 'Custom feature tests',
  // ... other categories
};
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: API Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: admin
          MYSQL_DATABASE: avancement
        ports:
          - 3306:3306
    
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - run: npm install
    - run: npm run server &
    - run: sleep 5
    - run: npm test
```

## Best Practices

1. **Run tests in isolation**: Use unique test data identifiers
2. **Clean up after tests**: Remove test data to avoid pollution
3. **Test edge cases**: Include invalid data and error scenarios
4. **Monitor performance**: Track response times for degradation
5. **Document failures**: Include context in error messages
6. **Use transactions**: Rollback test data when possible
7. **Mock external services**: Use test accounts for ImgBB
8. **Version test data**: Include schema version in tests

## Support

For issues or questions:
1. Check server logs: `npm run server`
2. Enable debug mode: `DEBUG=* node test-api.js`
3. Review test output carefully for specific error messages
4. Verify all prerequisites are met
5. Check database connectivity and permissions