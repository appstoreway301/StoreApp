import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function AdminStockPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api.get('/admin/stock')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (!data) return <div className="alert alert-error">Failed to load data</div>;

  const { products, sales, salesByDate, stats } = data;
  const outOfStock = products.filter(p => p.stock === 0 && p.active);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5 && p.active);
  const healthy = products.filter(p => p.stock > 5 && p.active);

  // Chart helpers
  const maxOrders = Math.max(...salesByDate.map(d => d.orders), 1);
  const maxRevenue = Math.max(...salesByDate.map(d => d.revenue), 1);

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <Link to="/admin" className="btn-back-circle">&larr; Back</Link>
        <h1>Stock & Sales</h1>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.totalOrders}</span>
          <span className="stat-label">Total Sales</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">${(stats.totalRevenue / 100).toFixed(2)}</span>
          <span className="stat-label">Total Revenue</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.pendingOrders}</span>
          <span className="stat-label">Pending Orders</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalStock}</span>
          <span className="stat-label">Total in Stock</span>
        </div>
        <div className="stat-card stat-danger">
          <span className="stat-value">{stats.outOfStock}</span>
          <span className="stat-label">Out of Stock</span>
        </div>
        <div className="stat-card stat-warning">
          <span className="stat-value">{stats.lowStock}</span>
          <span className="stat-label">Low Stock</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="stock-tabs">
        <button className={`btn ${tab === 'overview' ? 'btn-primary' : ''}`} onClick={() => setTab('overview')}>Stock Overview</button>
        <button className={`btn ${tab === 'sales' ? 'btn-primary' : ''}`} onClick={() => setTab('sales')}>Sales by Product</button>
        <button className={`btn ${tab === 'charts' ? 'btn-primary' : ''}`} onClick={() => setTab('charts')}>Charts</button>
      </div>

      {tab === 'overview' && (
        <>
          {outOfStock.length > 0 && (
            <>
              <h2 className="stock-section-title stock-danger">Out of Stock ({outOfStock.length})</h2>
              <div className="stock-list">
                {outOfStock.map(p => (
                  <div key={p.id} className="stock-row stock-row-danger">
                    <img src={p.image_url || 'https://placehold.co/40x40?text=N/A'} alt={p.name} className="stock-img" />
                    <span className="stock-name">{p.name}</span>
                    <span className="stock-badge badge-out">0 units</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {lowStock.length > 0 && (
            <>
              <h2 className="stock-section-title stock-warning">Low Stock ({lowStock.length})</h2>
              <div className="stock-list">
                {lowStock.map(p => (
                  <div key={p.id} className="stock-row stock-row-warning">
                    <img src={p.image_url || 'https://placehold.co/40x40?text=N/A'} alt={p.name} className="stock-img" />
                    <span className="stock-name">{p.name}</span>
                    <span className="stock-badge badge-low">{p.stock} units</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {healthy.length > 0 && (
            <>
              <h2 className="stock-section-title stock-healthy">In Stock ({healthy.length})</h2>
              <div className="stock-list">
                {healthy.map(p => (
                  <div key={p.id} className="stock-row">
                    <img src={p.image_url || 'https://placehold.co/40x40?text=N/A'} alt={p.name} className="stock-img" />
                    <span className="stock-name">{p.name}</span>
                    <span className="stock-badge badge-ok">{p.stock} units</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {outOfStock.length === 0 && lowStock.length === 0 && healthy.length === 0 && (
            <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>No active products.</p>
          )}
        </>
      )}

      {tab === 'sales' && (
        <>
          <h2>Sales by Product</h2>
          {sales.length === 0 ? (
            <p style={{ color: 'var(--text-light)' }}>No sales yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => (
                    <tr key={s.product_id}>
                      <td><strong>{s.product_name}</strong></td>
                      <td>{s.total_sold}</td>
                      <td>${(s.total_revenue / 100).toFixed(2)}</td>
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
            <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>No sales data in the last 30 days.</p>
          ) : (
            <>
              {/* Orders Chart */}
              <div className="chart-card">
                <h2>Orders per Day <span className="chart-subtitle">(last 30 days)</span></h2>
                <div className="chart">
                  {salesByDate.map(d => (
                    <div key={d.date} className="chart-col">
                      <span className="chart-value">{d.orders}</span>
                      <div className="chart-bar-wrap">
                        <div
                          className="chart-bar chart-bar-primary"
                          style={{ height: `${(d.orders / maxOrders) * 100}%` }}
                        />
                      </div>
                      <span className="chart-label">{formatDate(d.date)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="chart-card">
                <h2>Revenue per Day <span className="chart-subtitle">(last 30 days)</span></h2>
                <div className="chart">
                  {salesByDate.map(d => (
                    <div key={d.date} className="chart-col">
                      <span className="chart-value">${(d.revenue / 100).toFixed(0)}</span>
                      <div className="chart-bar-wrap">
                        <div
                          className="chart-bar chart-bar-success"
                          style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
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
