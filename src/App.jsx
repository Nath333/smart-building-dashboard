import { useState, useEffect } from 'react';
import { Building2, RefreshCw } from 'lucide-react';
import { StatusIndicator } from './components/StatusIndicator.jsx';
import { EnergyChart } from './components/EnergyChart.jsx';
import { TemperatureChart } from './components/TemperatureChart.jsx';
import { EnvironmentalMetrics } from './components/EnvironmentalMetrics.jsx';
import { DeviceList } from './components/DeviceList.jsx';
import { BuildingDataService } from './services/buildingDataService.js';
import { AUTO_REFRESH, ICON_SIZES, LOCALE } from './constants.js';
import './App.css';

/**
 * Main application component for the Smart Building Dashboard
 *
 * Displays real-time building metrics including:
 * - Connection status
 * - Energy consumption (real-time and historical)
 * - Temperature trends (indoor/outdoor)
 * - Environmental metrics (humidity, CO2, air quality)
 * - Connected devices status
 *
 * Features:
 * - Auto-refresh every 30 seconds
 * - Error handling with retry functionality
 * - Loading states
 * - Accessibility support (ARIA labels, semantic HTML)
 * - Automatic fallback to mock data when backend unavailable
 *
 * @returns {JSX.Element} The main dashboard interface
 */
function App() {
  const [buildingData, setBuildingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await BuildingDataService.fetchBuildingData();
      setBuildingData(data);
      setLastRefresh(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Failed to fetch building data:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, AUTO_REFRESH.INTERVAL);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !buildingData) {
    return (
      <div className="loading-container" role="status" aria-live="polite">
        <RefreshCw className="loading-spinner" size={ICON_SIZES.XLARGE} aria-hidden="true" />
        <p>Chargement des données du bâtiment...</p>
      </div>
    );
  }

  if (!buildingData || error) {
    return (
      <div className="error-container" role="alert">
        <p>Échec du chargement des données du bâtiment</p>
        {error && <p className="error-message">{error}</p>}
        <button
          onClick={fetchData}
          className="retry-button"
          disabled={loading}
          aria-label="Réessayer le chargement des données"
        >
          {loading ? 'Chargement...' : 'Réessayer'}
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <Building2 size={ICON_SIZES.LARGE} aria-hidden="true" />
          <div>
            <h1>Tableau de Bord du Bâtiment Intelligent</h1>
            <p className="subtitle">Surveillance et analyse en temps réel</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="refresh-button"
          disabled={loading}
          title="Actualiser les données"
          aria-label="Actualiser les données du tableau de bord"
        >
          <RefreshCw size={ICON_SIZES.SMALL} className={loading ? 'spinning' : ''} />
          <span>Actualiser</span>
        </button>
      </header>

      <main className="dashboard">
        <section className="status-section" aria-label="État de connexion du bâtiment">
          <StatusIndicator status={buildingData.status} />
        </section>

        <section className="charts-section" aria-label="Graphiques de consommation">
          <EnergyChart
            data={buildingData.energy.historical}
            realTime={buildingData.energy.realTime}
          />
          <TemperatureChart data={buildingData.temperature} />
        </section>

        <section className="metrics-section" aria-labelledby="environmental-heading">
          <h2 id="environmental-heading">Métriques Environnementales</h2>
          <EnvironmentalMetrics data={buildingData.environmental} />
        </section>

        <section className="devices-section" aria-label="Liste des appareils connectés">
          <DeviceList devices={buildingData.devices} />
        </section>
      </main>

      <footer className="app-footer" role="contentinfo">
        <p>
          <time dateTime={lastRefresh.toISOString()}>
            Dernière mise à jour : {lastRefresh.toLocaleTimeString(LOCALE.LANGUAGE)}
          </time>
        </p>
      </footer>
    </div>
  );
}

export default App;
