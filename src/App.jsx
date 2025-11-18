import { useState, useEffect } from 'react';
import { Building2, RefreshCw } from 'lucide-react';
import { StatusIndicator } from './components/StatusIndicator.jsx';
import { EnergyChart } from './components/EnergyChart.jsx';
import { TemperatureChart } from './components/TemperatureChart.jsx';
import { EnvironmentalMetrics } from './components/EnvironmentalMetrics.jsx';
import { DeviceList } from './components/DeviceList.jsx';
import { BuildingDataService } from './services/buildingDataService.js';
import './App.css';

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
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !buildingData) {
    return (
      <div className="loading-container">
        <RefreshCw className="loading-spinner" size={48} />
        <p>Chargement des données du bâtiment...</p>
      </div>
    );
  }

  if (!buildingData || error) {
    return (
      <div className="error-container">
        <p>Échec du chargement des données du bâtiment</p>
        {error && <p className="error-message">{error}</p>}
        <button onClick={fetchData} className="retry-button" disabled={loading}>
          {loading ? 'Chargement...' : 'Réessayer'}
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <Building2 size={32} />
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
        >
          <RefreshCw size={20} className={loading ? 'spinning' : ''} />
          <span>Actualiser</span>
        </button>
      </header>

      <main className="dashboard">
        <section className="status-section">
          <StatusIndicator status={buildingData.status} />
        </section>

        <section className="charts-section">
          <EnergyChart
            data={buildingData.energy.historical}
            realTime={buildingData.energy.realTime}
          />
          <TemperatureChart data={buildingData.temperature} />
        </section>

        <section className="metrics-section">
          <h2>Métriques Environnementales</h2>
          <EnvironmentalMetrics data={buildingData.environmental} />
        </section>

        <section className="devices-section">
          <DeviceList devices={buildingData.devices} />
        </section>
      </main>

      <footer className="app-footer">
        <p>Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}</p>
      </footer>
    </div>
  );
}

export default App;
