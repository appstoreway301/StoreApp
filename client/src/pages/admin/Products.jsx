import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Image, X, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api/client';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  stock: '',
  weight_kg: '1.00',
  category_ids: [],
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [galleryProductId, setGalleryProductId] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryUploading, setGalleryUploading] = useState(false);

  // Categorías
  const [catName, setCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');

  // Secciones desplegables
  const [open, setOpen] = useState({
    addProduct: true,
    products: true,
    addCategory: false,
    categories: false,
  });
  const toggleSection = key => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    Promise.all([loadProducts(), loadCategories()]).finally(() => setLoading(false));
  }, []);

  async function loadProducts() {
    try {
      const { data } = await api.get('/admin/products');
      setProducts(data.products);
    } catch {
      setError('Failed to load products');
    }
  }

  async function loadCategories() {
    try {
      const { data } = await api.get('/admin/categories');
      setAllCategories(data.categories);
    } catch {
      // ignore
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleCategory(catId) {
    setForm(prev => {
      const ids = prev.category_ids.includes(catId)
        ? prev.category_ids.filter(id => id !== catId)
        : [...prev.category_ids, catId];
      return { ...prev, category_ids: ids };
    });
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(prev => ({ ...prev, image_url: data.image_url }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  function startEdit(product) {
    setEditingId(product.id);
    setOpen(prev => ({ ...prev, addProduct: true }));
    setForm({
      name: product.name,
      description: product.description || '',
      price: (product.price_cents / 100).toFixed(2),
      image_url: product.image_url || '',
      stock: String(product.stock),
      weight_kg: String(product.weight_kg || '1.00'),
      category_ids: (product.categories || []).map(c => c.id),
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const priceCents = Math.round(parseFloat(form.price) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      setError('Enter a valid price');
      return;
    }

    const body = {
      name: form.name,
      description: form.description,
      price_cents: priceCents,
      image_url: form.image_url,
      stock: parseInt(form.stock) || 0,
      weight_kg: parseFloat(form.weight_kg) || 1.0,
      category_ids: form.category_ids,
    };

    try {
      if (editingId) {
        await api.put(`/admin/products/${editingId}`, body);
        setSuccess('Product updated');
      } else {
        await api.post('/admin/products', body);
        setSuccess('Product created');
      }
      setForm(emptyForm);
      setEditingId(null);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to remove this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setSuccess('Product removed');
      if (galleryProductId === id) setGalleryProductId(null);
      loadProducts();
    } catch {
      setError('Failed to remove product');
    }
  }

  async function handleReactivate(id) {
    try {
      await api.put(`/admin/products/${id}`, { active: 1 });
      setSuccess('Product reactivated');
      loadProducts();
    } catch {
      setError('Failed to reactivate product');
    }
  }

  // Gallery
  function openGallery(product) {
    setGalleryProductId(product.id);
    setGalleryImages(product.images || []);
    setError('');
    setSuccess('');
  }

  function closeGallery() {
    setGalleryProductId(null);
    setGalleryImages([]);
  }

  async function handleGalleryUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setGalleryUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data: uploadData } = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { data } = await api.post(`/admin/products/${galleryProductId}/images`, {
        image_url: uploadData.image_url,
      });
      setGalleryImages(data.images);
      setSuccess('Image added');
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setGalleryUploading(false);
    }
  }

  async function handleGalleryUrlAdd() {
    const url = prompt('Paste image URL:');
    if (!url) return;
    try {
      const { data } = await api.post(`/admin/products/${galleryProductId}/images`, {
        image_url: url,
      });
      setGalleryImages(data.images);
      setSuccess('Image added');
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add image');
    }
  }

  async function handleRemoveGalleryImage(imageId) {
    try {
      await api.delete(`/admin/images/${imageId}`);
      setGalleryImages(prev => prev.filter(img => img.id !== imageId));
      setSuccess('Image removed');
      loadProducts();
    } catch {
      setError('Failed to remove image');
    }
  }

  // Categories
  async function handleCreateCategory(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!catName.trim()) return;
    try {
      await api.post('/admin/categories', { name: catName.trim() });
      setCatName('');
      setSuccess('Category created');
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create category');
    }
  }

  async function handleUpdateCategory(id) {
    setError('');
    setSuccess('');
    if (!editCatName.trim()) return;
    try {
      await api.put(`/admin/categories/${id}`, { name: editCatName.trim() });
      setEditingCatId(null);
      setEditCatName('');
      setSuccess('Category updated');
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update category');
    }
  }

  async function handleDeleteCategory(id) {
    if (!confirm('Delete this category? It will be unlinked from all products.')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/categories/${id}`);
      setSuccess('Category deleted');
      loadCategories();
      loadProducts();
    } catch {
      setError('Failed to delete category');
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  const galleryProduct = products.find(p => p.id === galleryProductId);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Product Management</h1>
        <button className="btn btn-primary" onClick={() => setOpen(prev => ({ ...prev, addProduct: true }))}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Gallery Modal */}
      {galleryProduct && (
        <div className="modal-overlay" onClick={closeGallery}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Gallery: {galleryProduct.name}</h2>
              <button className="btn btn-sm" onClick={closeGallery}>Close</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <div className="gallery-actions">
              <input type="file" accept="image/*" onChange={handleGalleryUpload} className="file-input" id="gallery-upload" />
              <label htmlFor="gallery-upload" className="btn btn-primary file-label">
                {galleryUploading ? 'Uploading...' : 'Upload Image'}
              </label>
              <button className="btn" onClick={handleGalleryUrlAdd}>Add from URL</button>
            </div>
            <div className="gallery-grid">
              {galleryImages.length === 0 && <p className="gallery-empty">No gallery images yet.</p>}
              {galleryImages.map(img => (
                <div key={img.id} className="gallery-item">
                  <img src={img.image_url} alt="" />
                  <button className="gallery-remove btn btn-sm btn-danger" onClick={() => handleRemoveGalleryImage(img.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Form */}
      {open.addProduct && (
        <div className="admin-form-card">
          <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            {!galleryProduct && error && <div className="alert alert-error">{error}</div>}
            {!galleryProduct && success && <div className="alert alert-success">{success}</div>}

            <div className="admin-form-grid">
              <div className="form-group">
                <label>Name</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Price ($)</label>
                <input name="price" type="number" step="0.01" min="0.01" value={form.price} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input name="weight_kg" type="number" step="0.01" min="0.01" value={form.weight_kg} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Categories</label>
                <div className="tags-selector">
                  {allCategories.length === 0 && <span className="tags-empty">No categories. Create some in Category Management.</span>}
                  {allCategories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`tag ${form.category_ids.includes(cat.id) ? 'tag-selected' : ''}`}
                      onClick={() => toggleCategory(cat.id)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group full-width">
                <label>Main Image</label>
                <div className="image-upload-area">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input" id="image-upload" />
                  <label htmlFor="image-upload" className="btn file-label">
                    {uploading ? 'Uploading...' : 'Choose Image'}
                  </label>
                  <span className="image-or">or</span>
                  <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="Paste image URL..." className="url-input" />
                </div>
                {form.image_url && (
                  <div className="image-preview">
                    <img src={form.image_url} alt="Preview" />
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}>Remove</button>
                  </div>
                )}
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
              </div>
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                {editingId ? 'Save Changes' : 'Add Product'}
              </button>
              {editingId && <button type="button" className="btn" onClick={cancelEdit}>Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      {open.products && (
        <div>
          <h2>Products ({products.length})</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Categories</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Gallery</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className={!p.active ? 'inactive-row' : ''}>
                    <td>
                      <img src={p.image_url || 'https://placehold.co/50x50?text=No+Img'} alt={p.name} className="admin-product-img" />
                    </td>
                    <td><strong>{p.name}</strong></td>
                    <td>
                      <div className="tags-display">
                        {(p.categories || []).map(c => (
                          <span key={c.id} className="tag tag-small">{c.name}</span>
                        ))}
                        {(!p.categories || p.categories.length === 0) && <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>—</span>}
                      </div>
                    </td>
                    <td>${(p.price_cents / 100).toFixed(2)}</td>
                    <td>{p.stock}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => openGallery(p)}>
                        {(p.images?.length || 0)} imgs
                      </button>
                    </td>
                    <td>
                      <span className={`status-badge ${p.active ? 'badge-active' : 'badge-inactive'}`}>
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="admin-actions">
                      <button className="btn btn-sm" onClick={() => startEdit(p)}>Edit</button>
                      {p.active ? (
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Remove</button>
                      ) : (
                        <button className="btn btn-sm btn-success" onClick={() => handleReactivate(p.id)}>Reactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories Section */}
      <div className="admin-categories-section">
        <h3>Categories</h3>
        <div className="admin-categories-add">
          <form onSubmit={handleCreateCategory} className="admin-form">
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                value={catName}
                onChange={e => setCatName(e.target.value)}
                placeholder="Category name..."
                required
                style={{ flex: 1, padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '1rem', background: 'var(--card-bg)', color: 'var(--text)' }}
              />
              <button type="submit" className="btn btn-primary">Add</button>
            </div>
          </form>
        </div>
        <div className="categories-list">
          {allCategories.map(cat => (
            <div key={cat.id} className="category-row">
              {editingCatId === cat.id ? (
                <>
                  <input
                    value={editCatName}
                    onChange={e => setEditCatName(e.target.value)}
                    className="category-edit-input"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleUpdateCategory(cat.id)}
                  />
                  <button className="btn btn-sm btn-primary" onClick={() => handleUpdateCategory(cat.id)}>Save</button>
                  <button className="btn btn-sm" onClick={() => setEditingCatId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span className="category-name">{cat.name}</span>
                  <button className="btn btn-sm" onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteCategory(cat.id)}>Delete</button>
                </>
              )}
            </div>
          ))}
          {allCategories.length === 0 && <p style={{ color: 'var(--text-light)' }}>No categories yet.</p>}
        </div>
      </div>
    </div>
  );
}