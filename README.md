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
- **React 19** with **TypeScript** for type-safe development
- **Vite** for fast build tooling and hot module replacement
- **Recharts** for interactive data visualizations
- **Lucide React** for modern icon components
- **CSS3** with custom properties for theming

### Backend
- **Node.js** with **Express** for REST API
- **TypeScript** for type safety across the stack
- **CORS** enabled for cross-origin requests

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd smart-building-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
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
├── shared/                  # Shared code between frontend & backend
│   ├── types.ts             # TypeScript type definitions
│   └── config.ts            # Shared configuration constants
├── src/                     # Frontend source code
│   ├── components/          # React components
│   │   ├── StatusIndicator.tsx
│   │   ├── EnergyChart.tsx
│   │   ├── TemperatureChart.tsx
│   │   ├── EnvironmentalMetrics.tsx
│   │   └── DeviceList.tsx
│   ├── services/            # Frontend API client
│   │   └── buildingDataService.ts
│   ├── types/               # Re-exports from shared types
│   │   └── index.ts
│   ├── App.tsx              # Main application component
│   ├── App.css              # Application styles
│   └── main.tsx             # Application entry point
├── backend/                 # Backend source code
│   ├── server.ts            # Express server setup
│   ├── routes/              # API routes
│   │   └── building.ts      # Building data endpoints
│   ├── services/            # Backend business logic
│   │   └── buildingDataService.ts
│   ├── utils/               # Backend utilities
│   │   ├── logger.ts        # Logging system
│   │   └── validators.ts    # Request validation
│   └── tsconfig.json        # Backend TypeScript config
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment variables template
├── package.json
└── README.md
```

## Architecture

This application follows a **full-stack architecture** with a clear separation between frontend and backend:

### Shared Layer
- **Single Source of Truth**: Types and configuration defined once, used everywhere
- **Type Safety**: Full TypeScript coverage across the entire stack
- **No Duplication**: Eliminates inconsistencies between frontend and backend

### Frontend (React + Vite)
- Handles UI rendering and user interactions
- Fetches data from the backend REST API
- Auto-refreshes every 30 seconds
- Runs on `http://localhost:5173`

### Backend (Node.js + Express)
- Provides REST API endpoints for building data
- Generates realistic mock data (ready to be replaced with real sensors/databases)
- Handles CORS for frontend communication
- Professional logging and request validation
- Runs on `http://localhost:3001`

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
- `npm run dev` - Start frontend development server only
- `npm run dev:backend` - Start backend server with auto-reload
- `npm run dev:fullstack` - Start both frontend and backend concurrently

### Production
- `npm run build` - Build frontend for production
- `npm run build:backend` - Compile backend TypeScript to JavaScript
- `npm run start:backend` - Start production backend server
- `npm run preview` - Preview frontend production build

### Code Quality
- `npm run lint` - Run ESLint

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

Change auto-refresh interval in `src/App.tsx`:

```typescript
// Auto-refresh every 30 seconds (30000ms)
const interval = setInterval(fetchData, 30000);
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
