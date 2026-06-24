import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';
import api from '../../api/client';

export default function Stock() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api.get('/admin/stock')
      .then(({ data }) => setData(data))
      .catch(() => setError('Failed to load stock data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos de stock...</p>
      </div>
    );
  }

  if (error || !data) {
    return <div className="alert alert-error">{error || 'Failed to load data'}</div>;
  }

  const { products, sales, salesByDate, stats } = data;
  const outOfStock = products.filter(p => p.stock === 0 && p.active);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5 && p.active);
  const healthy = products.filter(p => p.stock > 5 && p.active);

  // Chart helpers
  const maxOrders = Math.max(...salesByDate.map(d => d.orders), 1);
  const maxRevenue = Math.max(...salesByDate.map(d => d.revenue), 1);

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  }

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Stock & Ventas</h1>
        <button className="btn btn-primary" onClick={() => setTab('overview')}>
          <BarChart3 size={16} /> Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.totalOrders}</span>
          <span className="stat-label">Total Ventas</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatPrice(stats.totalRevenue)}</span>
          <span className="stat-label">Ingresos Totales</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.pendingOrders}</span>
          <span className="stat-label">Pedidos Pendientes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalStock}</span>
          <span className="stat-label">Total en Stock</span>
        </div>
        <div className="stat-card stat-danger">
          <span className="stat-value">{stats.outOfStock}</span>
          <span className="stat-label">Agotados</span>
        </div>
        <div className="stat-card stat-warning">
          <span className="stat-value">{stats.lowStock}</span>
          <span className="stat-label">Stock Bajo</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="stock-tabs">
        <button
          className={`btn ${tab === 'overview' ? 'btn-primary' : ''}`}
          onClick={() => setTab('overview')}
        >
          Resumen de Stock
        </button>
        <button
          className={`btn ${tab === 'sales' ? 'btn-primary' : ''}`}
          onClick={() => setTab('sales')}
        >
          Ventas por Producto
        </button>
        <button
          className={`btn ${tab === 'charts' ? 'btn-primary' : ''}`}
          onClick={() => setTab('charts')}
        >
          Gráficas
        </button>
      </div>

      {tab === 'overview' && (
        <>
          {outOfStock.length > 0 && (
            <>
              <h2 className="stock-section-title stock-danger">
                Agotados ({outOfStock.length})
              </h2>
              <div className="stock-list">
                {outOfStock.map(p => (
                  <div key={p.id} className="stock-row stock-row-danger">
                    <img
                      src={p.image_url || 'https://placehold.co/40x40?text=N/A'}
                      alt={p.name}
                      className="stock-img"
                    />
                    <span className="stock-name">{p.name}</span>
                    <span className="stock-badge badge-out">0 unidades</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {lowStock.length > 0 && (
            <>
              <h2 className="stock-section-title stock-warning">
                Stock Bajo ({lowStock.length})
              </h2>
              <div className="stock-list">
                {lowStock.map(p => (
                  <div key={p.id} className="stock-row stock-row-warning">
                    <img
                      src={p.image_url || 'https://placehold.co/40x40?text=N/A'}
                      alt={p.name}
                      className="stock-img"
                    />
                    <span className="stock-name">{p.name}</span>
                    <span className="stock-badge badge-low">{p.stock} unidades</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {healthy.length > 0 && (
            <>
              <h2 className="stock-section-title stock-healthy">
                En Stock ({healthy.length})
              </h2>
              <div className="stock-list">
                {healthy.map(p => (
                  <div key={p.id} className="stock-row">
                    <img
                      src={p.image_url || 'https://placehold.co/40x40?text=N/A'}
                      alt={p.name}
                      className="stock-img"
                    />
                    <span className="stock-name">{p.name}</span>
                    <span className="stock-badge badge-ok">{p.stock} unidades</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {outOfStock.length === 0 && lowStock.length === 0 && healthy.length === 0 && (
            <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>
              No hay productos activos.
            </p>
          )}
        </>
      )}

      {tab === 'sales' && (
        <>
          <h2>Ventas por Producto</h2>
          {sales.length === 0 ? (
            <p style={{ color: 'var(--text-light)' }}>No hay ventas aún.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Unidades Vendidas</th>
                    <th>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => (
                    <tr key={s.product_id}>
                      <td><strong>{s.product_name}</strong></td>
                      <td>{s.total_sold}</td>
                      <td>{formatPrice(s.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'charts' && (
        <>
          {salesByDate.length === 0 ? (
            <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>
              No hay datos de ventas en los últimos 30 días.
            </p>
          ) : (
            <>
              {/* Orders Chart */}
              <div className="chart-card">
                <h2>
                  Pedidos por Día{' '}
                  <span className="chart-subtitle">(últimos 30 días)</span>
                </h2>
                <div className="chart">
                  {salesByDate.map(d => (
                    <div key={d.date} className="chart-col">
                      <span className="chart-value">{d.orders}</span>
                      <div className="chart-bar-wrap">
                        <div
                          className="chart-bar chart-bar-primary"
                          style={{
                            height: `${(d.orders / maxOrders) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="chart-label">{formatDate(d.date)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="chart-card">
                <h2>
                  Ingresos por Día{' '}
                  <span className="chart-subtitle">(últimos 30 días)</span>
                </h2>
                <div className="chart">
                  {salesByDate.map(d => (
                    <div key={d.date} className="chart-col">
                      <span className="chart-value">{formatPrice(d.revenue)}</span>
                      <div className="chart-bar-wrap">
                        <div
                          className="chart-bar chart-bar-success"
                          style={{
                            height: `${(d.revenue / maxRevenue) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="chart-label">{formatDate(d.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}