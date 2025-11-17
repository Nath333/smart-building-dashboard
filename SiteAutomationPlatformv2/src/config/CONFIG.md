# Configuration Directory

This directory contains all centralized configuration for the Site Automation Platform.

## 📁 Files

### [app.config.js](./app.config.js)
**Primary configuration file** - Single source of truth for:
- API endpoints and base URLs
- Image upload settings
- Storage configuration
- Feature flags
- Environment detection

## 🚀 Quick Start

### 1. Import Configuration
```javascript
// Using path alias (recommended)
import { API_BASE_URL, APP_CONFIG } from '@config/app.config';

// Or relative path
import { API_BASE_URL } from '../config/app.config';
import { API_BASE_URL } from '../../config/app.config';
```

### 2. Use in Your Code
```javascript
// API calls
const response = await fetch(`${API_BASE_URL}/endpoint`);

// Access config values
const { imgbb, api, app } = APP_CONFIG;
```

### 3. Available Exports

```javascript
export const API_BASE_URL = 'http://localhost:4001';
export const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export const APP_CONFIG = {
  api: {
    baseUrl: 'http://localhost:4001',
    timeout: 30000
  },
  imgbb: {
    apiKey: IMGBB_API_KEY,
    uploadUrl: 'https://api.imgbb.com/1/upload'
  },
  app: {
    name: 'Site Automation Platform',
    version: '1.0.0',
    environment: import.meta.env.MODE
  }
};
```

## 📋 Migration Guide

### ✅ What Changed

We've centralized all API configuration into a single source of truth: `src/config/app.config.js`

### Before (Hardcoded URLs)
```javascript
const response = await fetch('http://localhost:4001/endpoint');
const imgbbKey = 'hardcoded-key-here';
```

### After (Centralized Config)
```javascript
import { API_BASE_URL, IMGBB_API_KEY } from '@config/app.config';

const response = await fetch(`${API_BASE_URL}/endpoint`);
// imgbbKey automatically loaded from environment
```

### Migration Checklist

- [x] ~~`src/api/apiConfig.js`~~ → Removed (deprecated)
- [x] All imports updated to use `@config/app.config`
- [x] Hardcoded URLs replaced with `API_BASE_URL`
- [x] Environment variables loaded via `import.meta.env`

### Files Updated

The following files now use centralized config:
- `src/api/formDataApi.js`
- `src/api/imageApi.js`
- `src/pages/equipment/uploadUtils.js`
- `src/routes/imageRoutes.js`
- All page components

## 🔧 Configuration Options

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_IMGBB_API_KEY=your_imgbb_api_key_here
VITE_API_BASE_URL=http://localhost:4001
```

### Path Aliases

The project uses Vite path aliases (configured in `vite.config.js`):

```javascript
'@config': '/src/config',
'@api': '/src/api',
'@components': '/src/components',
'@pages': '/src/pages',
'@utils': '/src/utils'
```

## 📚 Best Practices

1. **Always use path aliases** for imports (cleaner, refactor-safe)
2. **Never hardcode URLs** - always import from config
3. **Use environment variables** for sensitive data (API keys)
4. **Keep config centralized** - one source of truth

## 🚨 Important Notes

- **Port Configuration**: Backend runs on port **4001** (not 3001)
- **Environment Detection**: Uses `import.meta.env.MODE` (Vite standard)
- **ImgBB Key**: Must be set in `.env` file for image uploads to work

---

**Last Updated:** October 14, 2025
**Migration Status:** ✅ Complete
