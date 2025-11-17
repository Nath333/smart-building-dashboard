import { Wifi, WifiOff } from 'lucide-react';
import type { BuildingStatus } from '../types';

interface StatusIndicatorProps {
  status: BuildingStatus;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const lastUpdatedStr = new Date(status.lastUpdated).toLocaleTimeString('fr-FR');

  return (
    <div className={`status-card ${status.isOnline ? 'online' : 'offline'}`}>
      <div className="status-icon">
        {status.isOnline ? <Wifi size={32} /> : <WifiOff size={32} />}
      </div>
      <div className="status-info">
        <h3>{status.isOnline ? 'En ligne' : 'Hors ligne'}</h3>
        <p className="status-subtitle">
          {status.isOnline ? 'Tous les systèmes opérationnels' : 'Connexion perdue'}
        </p>
        <p className="last-updated">Dernière mise à jour : {lastUpdatedStr}</p>
      </div>
    </div>
  );
}
