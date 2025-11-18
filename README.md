# Smart Building Dashboard

A modern, responsive dashboard for monitoring and managing smart building metrics in real-time.

## Features

- **Real-time Connection Status**: Monitor building connectivity (online/offline)
- **Energy Consumption Tracking**: View current and historical energy usage with interactive charts
- **Temperature Monitoring**: Track indoor and outdoor temperatures over the week
- **Environmental Metrics**: Monitor humidity, CO₂ levels, and overall air quality
- **Device Management**: View status of connected devices (HVAC, lighting, security, etc.)
- **Auto-refresh**: Dashboard updates every 30 seconds automatically
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

### Frontend
- **React 19** with modern **JavaScript (ES2020+)**
- **Vite** for fast build tooling and hot module replacement
- **Recharts** for interactive data visualizations
- **Lucide React** for modern icon components
- **CSS3** with custom properties for theming
- **Mock data fallback** for frontend-only demos (GitHub Pages)

### Backend (Optional)
- **Node.js** with **Express** for REST API
- **JavaScript (ES Modules)** with JSDoc for documentation
- **CORS** enabled for cross-origin requests

### Deployment
- **GitHub Actions** for automatic deployment
- **GitHub Pages** for hosting frontend demo
- **Automatic fallback** to mock data when backend unavailable

## Getting Started

### Quick Start (View Live Demo)

**👉 Live Demo**: https://Nath333.github.io/smart-building-dashboard/

The live demo uses mock data - perfect for exploring features without backend setup!

### Local Development

#### Prerequisites

- Node.js 18+ and npm

#### Option 1: Frontend Only (Mock Data)

Perfect for testing UI without backend setup:

```bash
# Install dependencies
npm install

# Start frontend development server
npm run dev
```

Open `http://localhost:5173` - automatically uses mock data!

#### Option 2: Full-Stack Development (With Backend)

For real API integration:

1. Clone the repository:
```bash
git clone https://github.com/Nath333/smart-building-dashboard.git
cd smart-building-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (optional):
```bash
cp .env.example .env
# Edit .env if needed - defaults work fine!
```

4. Start both frontend and backend servers:
```bash
npm run dev:fullstack
```

Or run them separately:
```bash
# Terminal 1 - Backend server
npm run dev:backend

# Terminal 2 - Frontend development server
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

The backend API will be running on `http://localhost:3001`

## Project Structure

```
smart-building-dashboard/
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions deployment workflow
├── shared/                  # Shared code between frontend & backend
│   ├── types.js             # JSDoc type definitions
│   └── config.js            # Shared configuration constants
├── src/                     # Frontend source code
│   ├── components/          # React components
│   │   ├── StatusIndicator.jsx
│   │   ├── EnergyChart.jsx
│   │   ├── TemperatureChart.jsx
│   │   ├── EnvironmentalMetrics.jsx
│   │   └── DeviceList.jsx
│   ├── services/            # Frontend services
│   │   ├── buildingDataService.js  # API client
│   │   └── mockDataService.js      # Mock data generator
│   ├── App.jsx              # Main application component
│   ├── App.css              # Application styles
│   └── main.jsx             # Application entry point
├── backend/                 # Backend source code (optional)
│   ├── server.js            # Express server setup
│   ├── routes/              # API routes
│   │   └── building.js      # Building data endpoints
│   ├── services/            # Backend business logic
│   │   └── buildingDataService.js
│   └── utils/               # Backend utilities
│       ├── logger.js        # Logging system
│       └── validators.js    # Request validation
├── public/
│   └── .nojekyll            # GitHub Pages configuration
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment variables template
├── package.json
├── vite.config.js           # Vite configuration
└── README.md
```

## Architecture

This application follows a **modern full-stack architecture** with intelligent fallback support:

### Shared Layer
- **Single Source of Truth**: Configuration defined once, used everywhere
- **JSDoc Documentation**: Clear type hints for better DX
- **No Duplication**: Eliminates inconsistencies between frontend and backend

### Frontend (React + Vite)
- Handles UI rendering and user interactions
- **Smart Data Source**: Tries backend API first, falls back to mock data
- Auto-refreshes every 30 seconds
- Runs on `http://localhost:5173` (dev) or GitHub Pages (prod)
- **Works standalone** without backend (perfect for demos!)

### Backend (Node.js + Express) - Optional
- Provides REST API endpoints for building data
- Generates realistic mock data (ready to be replaced with real sensors/databases)
- Handles CORS for frontend communication
- Professional logging and request validation
- Runs on `http://localhost:3001`

### Deployment Architecture
- **GitHub Actions**: Automated build and deployment
- **GitHub Pages**: Hosts frontend static files
- **Mock Data Fallback**: App works without backend
- **Environment Detection**: Automatically adapts to available resources

### API Endpoints

The backend provides the following REST API endpoints:

- `GET /api/building/data` - Complete building data (all metrics)
- `GET /api/building/status` - Building connection status
- `GET /api/building/energy/current` - Real-time energy consumption
- `GET /api/building/energy/history` - Historical energy data (24 hours)
- `GET /api/building/temperature/week` - Weekly temperature data
- `GET /api/building/environmental/current` - Current environmental metrics
- `GET /api/building/devices` - Connected devices status
- `PATCH /api/building/devices/:id` - Update device status

### Integrating Real Data Sources

To connect to actual building sensors or databases, modify `backend/services/buildingDataService.ts`:

```typescript
// Example: Connect to a real IoT platform or database
static async getBuildingData(): Promise<BuildingData> {
  const response = await fetch('https://your-iot-platform.com/api/data');
  return response.json();
}
```

## Available Scripts

### Development
- `npm run dev` - Start frontend dev server (auto-uses mock data if no backend)
- `npm run dev:backend` - Start backend server
- `npm run dev:fullstack` - Start both frontend and backend concurrently

### Production & Deployment
- `npm run build` - Build frontend for production
- `npm run start:backend` - Start backend server (production)
- `npm run preview` - Preview frontend production build locally

### Code Quality
- `npm run lint` - Run ESLint

## Deployment to GitHub Pages

The app automatically deploys to GitHub Pages when you push to `main` or any `claude/*` branch!

### Setup (One-Time)

1. Go to your GitHub repository settings
2. Navigate to **Pages** in the left sidebar
3. Under **Source**, select **GitHub Actions**
4. That's it! The workflow will handle everything else

### How It Works

1. **Push Code**: Push to `main` or `claude/*` branch
2. **GitHub Actions**: Automatically builds the app
3. **Deploy**: Publishes to GitHub Pages
4. **Live**: Available at `https://Nath333.github.io/smart-building-dashboard/`

### Branch Organization

- **`main`**: Production-ready code, deploys to GitHub Pages
- **`claude/javascript-gh-pages-*`**: Feature branch with all latest improvements
- **Workflow**: Merge feature branches to `main` via Pull Requests

### Manual Deployment Trigger

You can manually trigger deployment from the GitHub Actions tab if needed.

## Customization

### Color Theme

Edit CSS custom properties in `src/App.css`:

```css
:root {
  --primary-color: #2563eb;
  --success-color: #22c55e;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  /* ... more colors */
}
```

### Refresh Interval

Change auto-refresh interval in `src/App.jsx`:

```javascript
// Auto-refresh every 30 seconds (30000ms)
const interval = setInterval(fetchData, 30000);
```

### Mock Data Configuration

Customize mock data generation in `src/services/mockDataService.js`:

```javascript
// Adjust data ranges, patterns, or add new metrics
export class MockDataService {
  static generateMockData() {
    // Your custom data generation logic
  }
}
```

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Historical data date range selection
- [ ] Export data to CSV/PDF
- [ ] Real-time WebSocket updates
- [ ] Alert notifications for threshold violations
- [ ] Device control interface
- [ ] Multi-building support
- [ ] Dark mode toggle
- [ ] Customizable dashboard layouts

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
