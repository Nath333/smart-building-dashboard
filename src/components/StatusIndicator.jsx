import { Wifi, WifiOff } from 'lucide-react';
import { ICON_SIZES, LOCALE } from '../constants.js';

/**
 * Connection status indicator component
 * Displays online/offline status with icon and last update time
 *
 * @param {Object} props - Component props
 * @param {Object} props.status - Connection status data
 * @param {boolean} props.status.isOnline - Whether the system is online
 * @param {string} props.status.lastUpdated - ISO timestamp of last update
 * @returns {JSX.Element} Status indicator card
 */
export function StatusIndicator({ status }) {
  const lastUpdatedStr = new Date(status.lastUpdated).toLocaleTimeString(LOCALE.LANGUAGE);

  return (
    <div className={`status-card ${status.isOnline ? 'online' : 'offline'}`}>
      <div className="status-icon">
        {status.isOnline ? <Wifi size={ICON_SIZES.LARGE} aria-hidden="true" /> : <WifiOff size={ICON_SIZES.LARGE} aria-hidden="true" />}
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
