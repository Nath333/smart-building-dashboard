# Test Suite Documentation

## Overview

Optimized test suite for comprehensive API testing with focus on performance, maintainability, and clear organization.

## Test Structure

```
test/
├── api/                    # Core API test files
│   ├── test-quick.js      # Fast smoke tests (< 5 seconds)
│   ├── test-core.js       # Essential functionality tests
│   └── test-advanced.js   # Comprehensive test suite with analytics
├── runners/               # Interactive test runners
│   ├── test-runner.js     # Interactive test menu
│   └── debug-test.js      # Debug and troubleshooting
└── utils/                 # Shared test utilities
    └── test-helpers.js    # Common functions and data
```

## Available Test Commands

### Quick Development Testing
```bash
npm run test:quick
```
- **Purpose**: Fast smoke tests during development
- **Duration**: < 5 seconds
- **Coverage**: Server connectivity, basic CRUD operations
- **Use when**: Making quick changes and need immediate feedback

### Core Functionality Testing  
```bash
npm test
# or
npm run test:core
```
- **Purpose**: Essential functionality verification
- **Duration**: 10-30 seconds
- **Coverage**: All 6 pages, critical endpoints, validation
- **Use when**: Before commits, after major changes

### Advanced Comprehensive Testing
```bash
npm run test:advanced
```
- **Purpose**: Full system validation with analytics
- **Duration**: 1-3 minutes
- **Coverage**: Security, performance, integration, edge cases
- **Use when**: Before releases, troubleshooting issues

### Interactive Testing
```bash
npm run test:interactive
```
- **Purpose**: Menu-driven testing with options
- **Features**: Test selection, custom parameters
- **Use when**: Need specific test scenarios

## Test Levels Explained

### 🚀 Quick Tests (test-quick.js)
- Server health check
- Basic site operations
- Essential endpoint validation
- **Exit code**: 0 if all pass, 1 if any fail

### ⚙️ Core Tests (test-core.js) 
- Complete workflow testing
- Input validation
- Error handling
- Data persistence verification
- **Exit code**: 0 if 100% pass, 1 if any fail

### 🔬 Advanced Tests (test-advanced.js)
- Security testing (SQL injection, XSS)
- Performance benchmarking
- Concurrent operation testing
- Integration workflow validation
- Detailed analytics and reporting
- **Reports**: Saves to `advanced-test-report.json`

## Test Data Management

All test files use unique site names with timestamps to avoid conflicts:
- Quick: `quick_[timestamp]`
- Core: `core_test_[timestamp]`  
- Advanced: `advanced_test_[timestamp]`

## Understanding Test Results

### Success Indicators
- ✅ Green checkmarks = Tests passed
- 📊 Success rate displayed at end
- Exit code 0 = All tests successful

### Failure Indicators
- ❌ Red X = Test failed with error message
- Response times shown for performance analysis
- Exit code 1 = Some tests failed

### Performance Metrics
- Response times in milliseconds
- Average response time calculated
- Slow tests identified (> 1000ms)

## Best Practices

1. **Development Workflow**:
   ```bash
   npm run test:quick    # After small changes
   npm test             # Before commits
   npm run test:advanced # Before releases
   ```

2. **Debugging Issues**:
   - Use `npm run test:debug` for detailed troubleshooting
   - Check server logs in parallel terminal
   - Review generated test reports for specifics

3. **Adding New Tests**:
   - Add quick validation to `test-quick.js`
   - Add core functionality to `test-core.js` 
   - Add comprehensive scenarios to `test-advanced.js`
   - Use shared utilities from `test-helpers.js`

## Dependencies

- **axios**: HTTP client for API calls
- **dotenv**: Environment variable loading
- **form-data**: Multipart form handling (advanced tests)
- **chalk**: Terminal colors (interactive tests)
- **ora**: Loading spinners (interactive tests)

## Environment Setup

Required environment variables:
```env
IMGBB_API_KEY=your_key_here  # Optional, for image upload tests
```

## Troubleshooting

### Common Issues

1. **Server not running**:
   ```bash
   npm run server  # Start server first
   ```

2. **Database connection failed**:
   - Check MySQL is running
   - Verify database credentials in `.env`

3. **Tests timeout**:
   - Increase timeout in test files
   - Check server performance
   - Review database query performance

4. **Permission errors**:
   - Ensure test files are executable
   - Check file system permissions

### Getting Help

- Check test output for specific error messages
- Review generated JSON reports for detailed analysis
- Use debug mode for verbose logging
- Examine server logs for backend issues