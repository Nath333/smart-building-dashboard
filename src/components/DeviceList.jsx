import { CheckCircle, XCircle } from 'lucide-react';
import { ICON_SIZES } from '../constants.js';

/**
 * Connected devices list component
 * Displays all connected devices with their connection status
 *
 * @param {Object} props - Component props
 * @param {Array} props.devices - Array of device objects
 * @param {string} props.devices[].id - Unique device identifier
 * @param {string} props.devices[].name - Device name
 * @param {string} props.devices[].type - Device type description
 * @param {boolean} props.devices[].isConnected - Device connection status
 * @returns {JSX.Element} Device list card
 */
export function DeviceList({ devices }) {
  return (
    <div className="device-list-card">
      <h3>Appareils Connectés</h3>
      <div className="device-list">
        {devices.map((device) => (
          <div key={device.id} className="device-item">
            <div className="device-info">
              <div className={`device-status-icon ${device.isConnected ? 'connected' : 'disconnected'}`}>
                {device.isConnected ? (
                  <CheckCircle size={ICON_SIZES.SMALL} aria-hidden="true" />
                ) : (
                  <XCircle size={ICON_SIZES.SMALL} aria-hidden="true" />
                )}
              </div>
              <div className="device-details">
                <p className="device-name">{device.name}</p>
                <p className="device-type">{device.type}</p>
              </div>
            </div>
            <div className="device-last-seen">
              {device.isConnected ? 'Actif' : 'Hors ligne'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
