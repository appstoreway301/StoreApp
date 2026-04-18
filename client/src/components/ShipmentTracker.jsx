import { useState, useEffect } from 'react';
import api from '../api/client';

export default function ShipmentTracker({ orderId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/shipping/track/${orderId}`)
      .then(({ data }) => setData(data))
      .catch(err => setError(err.response?.data?.error || ''))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Loading tracking...</p>;
  if (error || !data?.shipment) return null;

  const { shipment, events } = data;

  return (
    <div className="shipment-tracker">
      <div className="shipment-header">
        <div className="shipment-info-row">
          <span className="shipment-label">Carrier</span>
          <span className="shipment-value">{shipment.carrier?.toUpperCase()}</span>
        </div>
        {shipment.service && (
          <div className="shipment-info-row">
            <span className="shipment-label">Service</span>
            <span className="shipment-value">{shipment.service}</span>
          </div>
        )}
        <div className="shipment-info-row">
          <span className="shipment-label">Status</span>
          <span className={`shipment-status shipment-status-${shipment.status}`}>
            {shipment.status}
          </span>
        </div>
        {shipment.tracking_number && (
          <div className="shipment-info-row">
            <span className="shipment-label">Tracking #</span>
            <span className="shipment-value" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {shipment.tracking_number}
            </span>
          </div>
        )}
        {shipment.track_url && (
          <div className="shipment-info-row">
            <a href={shipment.track_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
              Track on carrier site
            </a>
          </div>
        )}
        {shipment.label_url && (
          <div className="shipment-info-row">
            <a href={shipment.label_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
              Download label (PDF)
            </a>
          </div>
        )}
      </div>

      {events && events.length > 0 && (
        <div className="tracking-events">
          <h5 style={{ fontSize: '0.82rem', marginBottom: '0.5rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Tracking History
          </h5>
          <div className="events-timeline">
            {events.map((event, i) => (
              <div key={i} className="timeline-event">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <span className="timeline-status">{event.status || event.description || 'Update'}</span>
                  {event.location && <span className="timeline-location">{event.location}</span>}
                  {event.date && (
                    <span className="timeline-date">
                      {new Date(event.date).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {shipment.status === 'error' && shipment.error_message && (
        <div className="alert alert-error" style={{ marginTop: '0.75rem', fontSize: '0.82rem' }}>
          Shipping label generation failed: {shipment.error_message}
        </div>
      )}
    </div>
  );
}
