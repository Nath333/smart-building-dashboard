import { useState, useEffect } from 'react';
import { Building2, RefreshCw } from 'lucide-react';
import { StatusIndicator } from './components/StatusIndicator';
import { EnergyChart } from './components/EnergyChart';
import { TemperatureChart } from './components/TemperatureChart';
import { EnvironmentalMetrics } from './components/EnvironmentalMetrics';
import { DeviceList } from './components/DeviceList';
import { BuildingDataService } from './services/buildingDataService';
import type { BuildingData } from './types';
import './App.css';

function App() {
  const [buildingData, setBuildingData] = useState<BuildingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await BuildingDataService.fetchBuildingData();
      setBuildingData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch building data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !buildingData) {
    return (
      <div className="loading-container">
        <RefreshCw className="loading-spinner" size={48} />
        <p>Chargement des données du bâtiment...</p>
      </div>
    );
  }

  if (!buildingData) {
    return (
      <div className="error-container">
        <p>Échec du chargement des données du bâtiment</p>
        <button onClick={fetchData} className="retry-button">
          Réessayer
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
