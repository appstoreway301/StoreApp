import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, XCircle, ExternalLink, FileText } from 'lucide-react';
import api from '../../api/client';

export default function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchShipments();
  }, []);

  function fetchShipments() {
    setLoading(true);
    setError('');
    api.get('/shipping/admin/shipments')
      .then(({ data }) => setShipments(data.shipments || []))
      .catch(() => {
        setError('Failed to load shipments');
        setShipments([]);
      })
      .finally(() => setLoading(false));
  }

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getStatusColor(status) {
    const colors = {
      'pending': '#f59e0b',
      'generated': '#3b82f6',
      'in_transit': '#8b5cf6',
      'delivered': '#10b981',
      'error': '#ef4444',
      'cancelled': '#6b7280',
    };
    return colors[status] || '#6b7280';
  }

  function getStatusLabel(status) {
    const labels = {
      'pending': 'Pendiente',
      'generated': 'Generado',
      'in_transit': 'En tránsito',
      'delivered': 'Entregado',
      'error': 'Error',
      'cancelled': 'Cancelado',
    };
    return labels[status] || status;
  }

  async function handleRetry(id) {
    setActionLoading(id);
    setError('');
    setSuccess('');
    try {
      await api.post(`/shipping/admin/shipments/${id}/retry`);
      setSuccess('Label retry initiated');
      fetchShipments();
    } catch (err) {
      setError(err.response?.data?.error || 'Retry failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(id) {
    if (!confirm('¿Cancelar este envío?')) return;
    setActionLoading(id);
    setError('');
    setSuccess('');
    try {
      await api.post(`/shipping/admin/shipments/${id}/cancel`);
      setSuccess('Shipment cancelled');
      fetchShipments();
    } catch (err) {
      setError(err.response?.data?.error || 'Cancel failed');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando envíos...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Envíos</h1>
        <button className="btn btn-primary" onClick={fetchShipments}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {shipments.length === 0 ? (
        <p style={{ color: 'var(--text-light)' }}>No hay envíos aún.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Transportista</th>
                <th>Tracking #</th>
                <th>Estado</th>
                <th>Destino</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map(s => (
                <tr key={s.id}>
                  <td>
                    <Link to={`/orders/${s.order_id}`} style={{ color: 'var(--accent)' }}>
                      #{s.order_id}
                    </Link>
                  </td>
                  <td style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.82rem' }}>
                    {s.carrier}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    {s.tracking_number || '—'}
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        background: `${getStatusColor(s.status)}20`,
                        color: getStatusColor(s.status),
                      }}
                    >
                      {getStatusLabel(s.status)}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {s.shipping_city}, {s.shipping_country}
                  </td>
                  <td>{formatPrice(s.total_cents)}</td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {formatDate(s.created_at)}
                  </td>
                  <td>
                    <div className="admin-actions" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {s.status === 'error' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleRetry(s.id)}
                          disabled={actionLoading === s.id}
                        >
                          {actionLoading === s.id ? '...' : 'Reintentar'}
                        </button>
                      )}
                      {(s.status === 'generated' || s.status === 'in_transit') && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleCancel(s.id)}
                          disabled={actionLoading === s.id}
                        >
                          {actionLoading === s.id ? '...' : 'Cancelar'}
                        </button>
                      )}
                      {s.label_url && (
                        <a
                          href={s.label_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm"
                          title="Descargar etiqueta"
                        >
                          <FileText size={14} />
                        </a>
                      )}
                      {s.track_url && (
                        <a
                          href={s.track_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm"
                          title="Rastrear"
                        >
                          <ExternalLink size={14} />
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