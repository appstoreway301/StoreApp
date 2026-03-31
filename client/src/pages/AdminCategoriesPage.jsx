import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data.categories);
    } catch {
      setError('Failed to load categories');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) return;
    try {
      await api.post('/admin/categories', { name: name.trim() });
      setName('');
      setSuccess('Category created');
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create category');
    }
  }

  async function handleUpdate(id) {
    setError('');
    setSuccess('');
    if (!editName.trim()) return;
    try {
      await api.put(`/admin/categories/${id}`, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
      setSuccess('Category updated');
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update category');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this category? It will be unlinked from all products.')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/categories/${id}`);
      setSuccess('Category deleted');
      loadCategories();
    } catch {
      setError('Failed to delete category');
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <Link to="/admin" className="btn-back-circle">&larr; Back</Link>
        <h1>Category Management</h1>
      </div>

      <div className="admin-form-card">
        <h2>Add New Category</h2>
        <form onSubmit={handleCreate} className="admin-form">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Category name..."
              required
              style={{ flex: 1, padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '1rem' }}
            />
            <button type="submit" className="btn btn-primary">Add</button>
          </div>
        </form>
      </div>

      <h2>Categories ({categories.length})</h2>
      <div className="categories-list">
        {categories.map(cat => (
          <div key={cat.id} className="category-row">
            {editingId === cat.id ? (
              <>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="category-edit-input"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)}
                />
                <button className="btn btn-sm btn-primary" onClick={() => handleUpdate(cat.id)}>Save</button>
                <button className="btn btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span className="category-name">{cat.name}</span>
                <button className="btn btn-sm" onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cat.id)}>Delete</button>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && <p style={{ color: 'var(--text-light)' }}>No categories yet.</p>}
      </div>
    </div>
  );
}
