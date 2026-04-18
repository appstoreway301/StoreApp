import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  function fetchShipments() {
    setLoading(true);
    api.get('/shipping/admin/shipments')
      .then(({ data }) => setShipments(data.shipments || []))
      .catch(() => setShipments([]))
      .finally(() => setLoading(false));
  }

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  async function handleRetry(id) {
    setActionLoading(id);
    try {
      await api.post(`/shipping/admin/shipments/${id}/retry`);
      fetchShipments();
    } catch {
      alert('Retry failed. Check server logs.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(id) {
    if (!confirm('Cancel this shipment?')) return;
    setActionLoading(id);
    try {
      await api.post(`/shipping/admin/shipments/${id}/cancel`);
      fetchShipments();
    } catch {
      alert('Cancel failed.');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <Link to="/admin" className="btn-back-circle">&larr; Back</Link>
        <h1>Shipments</h1>
      </div>

      {shipments.length === 0 ? (
        <p style={{ color: 'var(--text-light)' }}>No shipments yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Carrier</th>
                <th>Tracking #</th>
                <th>Status</th>
                <th>Destination</th>
                <th>Order Total</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map(s => (
                <tr key={s.id}>
                  <td>#{s.order_id}</td>
                  <td style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.82rem' }}>
                    {s.carrier}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    {s.tracking_number || '—'}
                  </td>
                  <td>
                    <span className={`shipment-status shipment-status-${s.status}`}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {s.shipping_name}, {s.shipping_city}, {s.shipping_country}
                  </td>
                  <td>{formatPrice(s.total_cents)}</td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="admin-actions">
                      {s.status === 'error' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleRetry(s.id)}
                          disabled={actionLoading === s.id}
                        >
                          {actionLoading === s.id ? '...' : 'Retry'}
                        </button>
                      )}
                      {(s.status === 'generated' || s.status === 'in_transit') && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleCancel(s.id)}
                          disabled={actionLoading === s.id}
                        >
                          {actionLoading === s.id ? '...' : 'Cancel'}
                        </button>
                      )}
                      {s.label_url && (
                        <a href={s.label_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                          Label
                        </a>
                      )}
                      {s.track_url && (
                        <a href={s.track_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                          Track
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
