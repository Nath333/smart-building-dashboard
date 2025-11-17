import { Wifi, WifiOff } from 'lucide-react';
import type { BuildingStatus } from '../types';

interface StatusIndicatorProps {
  status: BuildingStatus;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const lastUpdatedStr = new Date(status.lastUpdated).toLocaleTimeString();

  return (
    <div className={`status-card ${status.isOnline ? 'online' : 'offline'}`}>
      <div className="status-icon">
        {status.isOnline ? <Wifi size={32} /> : <WifiOff size={32} />}
      </div>
      <div className="status-info">
        <h3>{status.isOnline ? 'Online' : 'Offline'}</h3>
        <p className="status-subtitle">
          {status.isOnline ? 'All systems operational' : 'Connection lost'}
        </p>
        <p className="last-updated">Last updated: {lastUpdatedStr}</p>
      </div>
    </div>
  );
}
