import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const EMPTY_FORM = {
  name: '', address: '', city: '', state: '', zip: '', country: 'MX', phone: '',
};

const inputStyle = {
  padding: '0.6rem',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  fontSize: '1rem',
  background: 'var(--card-bg)',
  color: 'var(--text)',
  width: '100%',
};

function CollapsibleSection({ title, open, onToggle, children }) {
  return (
    <div className="accordion-section">
      <button type="button" className="accordion-toggle" onClick={onToggle} aria-expanded={open}>
        <span>{title}</span>
        <span className={`accordion-chevron ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  );
}

function StockRow({ item, onSave }) {
  const rowClass = item.quantity === 0
    ? 'stock-row stock-row-danger'
    : item.quantity <= 5
      ? 'stock-row stock-row-warning'
      : 'stock-row';
  const badgeClass = item.quantity === 0
    ? 'badge-out'
    : item.quantity <= 5
      ? 'badge-low'
      : 'badge-ok';
  return (
    <div className={rowClass}>
      <img
        src={item.image_url || 'https://placehold.co/40x40?text=N/A'}
        alt={item.name}
        className="stock-img"
      />
      <span className="stock-name">{item.name}</span>
      <span className={`stock-badge ${badgeClass}`}>{item.quantity} units</span>
      <input
        key={`${item.product_id}-${item.quantity}`}
        type="number"
        min="0"
        defaultValue={item.quantity}
        style={{ ...inputStyle, width: '90px', textAlign: 'center' }}
        onKeyDown={e => e.key === 'Enter' && onSave(item.product_id, e.target.value)}
        onBlur={e => {
          if (parseInt(e.target.value, 10) !== item.quantity) {
            onSave(item.product_id, e.target.value);
          }
        }}
      />
    </div>
  );
}

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Stock gestionado por sucursal expandida
  const [stockBranchId, setStockBranchId] = useState(null);
  const [stock, setStock] = useState([]);
  const [stockStats, setStockStats] = useState(null);

  // Secciones desplegables (acordeón)
  const [open, setOpen] = useState({ addBranch: true, branches: true });
  const toggleSection = key => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    loadBranches();
  }, []);

  async function loadBranches() {
    try {
      const { data } = await api.get('/admin/branches');
      setBranches(data.branches);
    } catch {
      setError('Failed to load branches');
    }
  }

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name.trim()) {
      setError('Branch name is required');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/admin/branches/${editingId}`, form);
        setSuccess('Branch updated');
      } else {
        await api.post('/admin/branches', form);
        setSuccess('Branch created');
      }
      resetForm();
      loadBranches();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save branch');
    }
  }

  function startEdit(branch) {
    setEditingId(branch.id);
    setForm({
      name: branch.name,
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      zip: branch.zip || '',
      country: branch.country || 'MX',
      phone: branch.phone || '',
    });
    setOpen(prev => ({ ...prev, addBranch: true }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!confirm('Delete this branch? Its stock records will also be removed.')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/branches/${id}`);
      setSuccess('Branch deleted');
      if (stockBranchId === id) setStockBranchId(null);
      loadBranches();
    } catch {
      setError('Failed to delete branch');
    }
  }

  async function toggleStock(branchId) {
    if (stockBranchId === branchId) {
      setStockBranchId(null);
      setStock([]);
      setStockStats(null);
      return;
    }
    try {
      const { data } = await api.get(`/admin/branches/${branchId}/stock`);
      setStock(data.stock);
      setStockStats(data.stats);
      setStockBranchId(branchId);
    } catch {
      setError('Failed to load branch stock');
    }
  }

  async function saveStock(branchId, productId, quantity) {
    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty < 0) return;
    try {
      const { data } = await api.put(`/admin/branches/${branchId}/stock`, {
        product_id: productId,
        quantity: qty,
      });
      setStock(data.stock);
      setStockStats(data.stats);
      setSuccess('Stock updated');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update stock');
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <Link to="/admin" className="btn-back-circle">&larr; Back</Link>
        <h1>Branch Management</h1>
      </div>

      <CollapsibleSection
        title={editingId ? 'Edit Branch' : 'Add New Branch'}
        open={open.addBranch}
        onToggle={() => toggleSection('addBranch')}
      >
        <div className="admin-form-card">
        <form onSubmit={handleSubmit} className="admin-form">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Branch name *</label>
              <input style={inputStyle} value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Sucursal Centro" required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Street address</label>
              <input style={inputStyle} value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Av. Reforma 123" />
            </div>
            <div>
              <label>City</label>
              <input style={inputStyle} value={form.city} onChange={e => setField('city', e.target.value)} placeholder="Hermosillo" />
            </div>
            <div>
              <label>State</label>
              <input style={inputStyle} value={form.state} onChange={e => setField('state', e.target.value)} placeholder="Sonora" />
            </div>
            <div>
              <label>ZIP</label>
              <input style={inputStyle} value={form.zip} onChange={e => setField('zip', e.target.value)} placeholder="83000" />
            </div>
            <div>
              <label>Country</label>
              <input style={inputStyle} value={form.country} onChange={e => setField('country', e.target.value)} placeholder="MX" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Phone</label>
              <input style={inputStyle} value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+52 662 000 0000" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Add Branch'}</button>
            {editingId && <button type="button" className="btn" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={`Branches (${branches.length})`}
        open={open.branches}
        onToggle={() => toggleSection('branches')}
      >
      <div className="categories-list">
        {branches.map(branch => (
          <div key={branch.id} className="admin-form-card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {branch.name}{' '}
                  {!branch.active && <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>(inactive)</span>}
                </h3>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {[branch.address, branch.city, branch.state, branch.zip, branch.country].filter(Boolean).join(', ') || 'No address set'}
                  {branch.phone && <><br />Tel: {branch.phone}</>}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-sm" onClick={() => toggleStock(branch.id)}>
                  {stockBranchId === branch.id ? 'Hide Stock' : 'Manage Stock'}
                </button>
                <button className="btn btn-sm" onClick={() => startEdit(branch)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(branch.id)}>Delete</button>
              </div>
            </div>

            {stockBranchId === branch.id && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <h4 style={{ marginTop: 0 }}>Inventory at {branch.name}</h4>

                {stockStats && (
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="stat-value">{stockStats.totalProducts}</span>
                      <span className="stat-label">Products</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-value">{stockStats.totalStock}</span>
                      <span className="stat-label">Total in Stock</span>
                    </div>
                    <div className="stat-card stat-danger">
                      <span className="stat-value">{stockStats.outOfStock}</span>
                      <span className="stat-label">Out of Stock</span>
                    </div>
                    <div className="stat-card stat-warning">
                      <span className="stat-value">{stockStats.lowStock}</span>
                      <span className="stat-label">Low Stock</span>
                    </div>
                  </div>
                )}

                {stock.length === 0 ? (
                  <p style={{ color: 'var(--text-light)' }}>No active products available.</p>
                ) : (() => {
                  const outOfStock = stock.filter(i => i.quantity === 0);
                  const lowStock = stock.filter(i => i.quantity > 0 && i.quantity <= 5);
                  const healthy = stock.filter(i => i.quantity > 5);
                  const onSave = (pid, q) => saveStock(branch.id, pid, q);
                  return (
                    <>
                      {outOfStock.length > 0 && (
                        <>
                          <h4 className="stock-section-title stock-danger">Out of Stock ({outOfStock.length})</h4>
                          <div className="stock-list">
                            {outOfStock.map(i => <StockRow key={i.product_id} item={i} onSave={onSave} />)}
                          </div>
                        </>
                      )}
                      {lowStock.length > 0 && (
                        <>
                          <h4 className="stock-section-title stock-warning">Low Stock ({lowStock.length})</h4>
                          <div className="stock-list">
                            {lowStock.map(i => <StockRow key={i.product_id} item={i} onSave={onSave} />)}
                          </div>
                        </>
                      )}
                      {healthy.length > 0 && (
                        <>
                          <h4 className="stock-section-title stock-healthy">In Stock ({healthy.length})</h4>
                          <div className="stock-list">
                            {healthy.map(i => <StockRow key={i.product_id} item={i} onSave={onSave} />)}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}

                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: 0, marginTop: '1rem' }}>
                  Tip: edit a quantity and press Enter or click away to save.
                </p>
              </div>
            )}
          </div>
        ))}
        {branches.length === 0 && <p style={{ color: 'var(--text-light)' }}>No branches yet.</p>}
      </div>
      </CollapsibleSection>
    </div>
  );
}
