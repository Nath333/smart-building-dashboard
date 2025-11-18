import { CheckCircle, XCircle } from 'lucide-react';

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
                  <CheckCircle size={20} />
                ) : (
                  <XCircle size={20} />
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
