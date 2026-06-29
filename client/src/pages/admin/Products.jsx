import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Pencil, Trash2, Image, X, ChevronDown, ChevronUp,
  Search, Package, DollarSign, Tag, Eye, EyeOff, Upload,
  AlertCircle, CheckCircle, RefreshCw, Star, Ruler, Palette,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/client';
import ProductVariants from './ProductVariants';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  stock: '',
  weight_kg: '1.00',
  category_ids: [],
  featured: false, // 👈 SOLO featured, sin size_ids ni color_ids
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allSizes, setAllSizes] = useState([]);
  const [allColors, setAllColors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [galleryProductId, setGalleryProductId] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');
  const [showVariants, setShowVariants] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Categorías
  const [catName, setCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');

  // Tallas
  const [sizeName, setSizeName] = useState('');
  const [editingSizeId, setEditingSizeId] = useState(null);
  const [editSizeName, setEditSizeName] = useState('');

  // Colores
  const [colorName, setColorName] = useState('');
  const [editingColorId, setEditingColorId] = useState(null);
  const [editColorName, setEditColorName] = useState('');

  // Secciones
  const [open, setOpen] = useState({
    addProduct: false,
    products: true,
    categories: true,
    sizes: true,
    colors: true,
  });
  const toggleSection = key => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    Promise.all([
      loadProducts(),
      loadCategories(),
      loadSizes(),
      loadColors()
    ]).finally(() => setLoading(false));
  }, []);

  async function loadProducts() {
    try {
      const { data } = await api.get('/admin/products');
      setProducts(data.products);
    } catch {
      setError('Error al cargar productos');
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

  async function loadSizes() {
    try {
      const { data } = await api.get('/admin/sizes');
      setAllSizes(data.sizes);
    } catch {
      // ignore
    }
  }

  async function loadColors() {
    try {
      const { data } = await api.get('/admin/colors');
      setAllColors(data.colors);
    } catch {
      // ignore
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
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
      setError(err.response?.data?.error || 'Error al subir la imagen');
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
      featured: product.featured || false,
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(prev => ({ ...prev, addProduct: false }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const priceCents = Math.round(parseFloat(form.price) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      setError('Ingresa un precio válido');
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
      featured: form.featured,
    };

    try {
      if (editingId) {
        await api.put(`/admin/products/${editingId}`, body);
        setSuccess('✅ Producto actualizado');
      } else {
        await api.post('/admin/products', body);
        setSuccess('✅ Producto creado');
      }
      setForm(emptyForm);
      setEditingId(null);
      setOpen(prev => ({ ...prev, addProduct: false }));
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setSuccess('✅ Producto eliminado');
      if (galleryProductId === id) setGalleryProductId(null);
      loadProducts();
    } catch {
      setError('Error al eliminar');
    }
  }

  async function handleReactivate(id) {
    try {
      await api.put(`/admin/products/${id}`, { active: 1 });
      setSuccess('✅ Producto reactivado');
      loadProducts();
    } catch {
      setError('Error al reactivar');
    }
  }

  // ==================== GALERÍA ====================
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
      setSuccess('✅ Imagen agregada');
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir imagen');
    } finally {
      setGalleryUploading(false);
    }
  }

  async function handleGalleryUrlAdd() {
    const url = prompt('Pega la URL de la imagen:');
    if (!url) return;
    try {
      const { data } = await api.post(`/admin/products/${galleryProductId}/images`, {
        image_url: url,
      });
      setGalleryImages(data.images);
      setSuccess('✅ Imagen agregada');
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar imagen');
    }
  }

  async function handleRemoveGalleryImage(imageId) {
    try {
      await api.delete(`/admin/images/${imageId}`);
      setGalleryImages(prev => prev.filter(img => img.id !== imageId));
      setSuccess('✅ Imagen eliminada');
      loadProducts();
    } catch {
      setError('Error al eliminar imagen');
    }
  }

  // ==================== CATEGORÍAS ====================
  async function handleCreateCategory(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!catName.trim()) return;
    try {
      await api.post('/admin/categories', { name: catName.trim() });
      setCatName('');
      setSuccess('✅ Categoría creada');
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear categoría');
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
      setSuccess('✅ Categoría actualizada');
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar categoría');
    }
  }

  async function handleDeleteCategory(id) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/categories/${id}`);
      setSuccess('✅ Categoría eliminada');
      loadCategories();
      loadProducts();
    } catch {
      setError('Error al eliminar categoría');
    }
  }

  // ==================== TALLAS ====================
  async function handleCreateSize(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!sizeName.trim()) return;
    try {
      await api.post('/admin/sizes', { name: sizeName.trim() });
      setSizeName('');
      setSuccess('✅ Talla creada');
      loadSizes();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear talla');
    }
  }

  async function handleUpdateSize(id) {
    setError('');
    setSuccess('');
    if (!editSizeName.trim()) return;
    try {
      await api.put(`/admin/sizes/${id}`, { name: editSizeName.trim() });
      setEditingSizeId(null);
      setEditSizeName('');
      setSuccess('✅ Talla actualizada');
      loadSizes();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar talla');
    }
  }

  async function handleDeleteSize(id) {
    if (!confirm('¿Eliminar esta talla?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/sizes/${id}`);
      setSuccess('✅ Talla eliminada');
      loadSizes();
      loadProducts();
    } catch {
      setError('Error al eliminar talla');
    }
  }

  // ==================== COLORES ====================
  async function handleCreateColor(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!colorName.trim()) return;
    try {
      await api.post('/admin/colors', { name: colorName.trim() });
      setColorName('');
      setSuccess('✅ Color creado');
      loadColors();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear color');
    }
  }

  async function handleUpdateColor(id) {
    setError('');
    setSuccess('');
    if (!editColorName.trim()) return;
    try {
      await api.put(`/admin/colors/${id}`, { name: editColorName.trim() });
      setEditingColorId(null);
      setEditColorName('');
      setSuccess('✅ Color actualizado');
      loadColors();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar color');
    }
  }

  async function handleDeleteColor(id) {
    if (!confirm('¿Eliminar este color?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/colors/${id}`);
      setSuccess('✅ Color eliminado');
      loadColors();
      loadProducts();
    } catch {
      setError('Error al eliminar color');
    }
  }

  // ==================== FILTROS ====================
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && p.active) ||
      (filterStatus === 'inactive' && !p.active);
    const matchesFeatured = filterFeatured === 'all' ||
      (filterFeatured === 'featured' && p.featured) ||
      (filterFeatured === 'not-featured' && !p.featured);
    return matchesSearch && matchesStatus && matchesFeatured;
  });

  // ==================== ESTADÍSTICAS ====================
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.active).length;
  const inactiveProducts = products.filter(p => !p.active).length;
  const lowStockProducts = products.filter(p => p.stock <= 5 && p.active).length;
  const featuredProducts = products.filter(p => p.featured).length;

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-[var(--text-light)] text-sm">Cargando productos...</p>
        </div>
      </div>
    );
  }

  const galleryProduct = products.find(p => p.id === galleryProductId);

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[var(--accent)] rounded-full" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-[var(--text)]">
              Productos
            </h1>
            <span className="text-sm text-[var(--text-light)] bg-[var(--card-bg)] px-3 py-1 rounded-full border border-[var(--border)]">
              {totalProducts}
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm mt-1 ml-4">
            Gestiona el catálogo de productos de KONG MONTOYA
          </p>
        </div>
        <button 
          onClick={() => {
            if (open.addProduct) {
              setEditingId(null);
              setForm(emptyForm);
              setOpen(prev => ({ ...prev, addProduct: false }));
            } else {
              setEditingId(null);
              setForm(emptyForm);
              setOpen(prev => ({ ...prev, addProduct: true }));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(232,93,4,0.3)]"
        >
          <Plus size={18} />
          {open.addProduct ? 'Cerrar Formulario' : 'Nuevo Producto'}
        </button>
      </div>

      {/* ===== ESTADÍSTICAS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <span className="block text-2xl font-black text-[var(--text)]">{totalProducts}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Total</span>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <span className="block text-2xl font-black text-[#10b981]">{activeProducts}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Activos</span>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <span className="block text-2xl font-black text-[#ef4444]">{inactiveProducts}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Inactivos</span>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <span className="block text-2xl font-black text-[#f59e0b]">{lowStockProducts}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Stock Bajo</span>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <span className="block text-2xl font-black text-[#8b5cf6]">{featuredProducts}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">⭐ Destacados</span>
        </div>
      </div>

      {/* ===== MENSAJES ===== */}
      {error && (
        <div className="bg-red-500/10 text-[var(--danger)] border border-red-500/20 rounded-xl p-3 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 rounded-xl p-3 text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* ===== FORMULARIO AGREGAR/EDITAR ===== */}
      {open.addProduct && (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black uppercase tracking-tight text-[var(--text)]">
              {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button 
              onClick={cancelEdit}
              className="text-[var(--text-light)] hover:text-[var(--text)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                  Nombre del Producto *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
                  placeholder="Ej: Camisa Kong"
                />
              </div>

              {/* Precio y Stock */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                  Precio ($) *
                </label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.price}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                  Stock *
                </label>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
                  placeholder="0"
                />
              </div>

              {/* Peso */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                  Peso (kg)
                </label>
                <input
                  name="weight_kg"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.weight_kg}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
                  placeholder="1.00"
                />
              </div>

              {/* ⭐ PIEZA DESTACADA */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                  Destacado
                </label>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, featured: !prev.featured }))}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all duration-300 ${
                    form.featured 
                      ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b] shadow-lg shadow-[#f59e0b]/20' 
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-light)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <Star 
                    size={22} 
                    className={`transition-all duration-300 ${
                      form.featured ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[var(--text-light)]'
                    }`}
                  />
                  <span className="text-sm font-bold">
                    {form.featured ? '⭐ Destacado' : '☆ Marcar como destacado'}
                  </span>
                </button>
                <p className="text-[10px] text-[var(--text-light)] mt-1 ml-1">
                  Los productos destacados aparecen en la sección principal de la tienda
                </p>
              </div>

              {/* CATEGORÍAS */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                  Categorías
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl min-h-[44px]">
                  {allCategories.length === 0 && (
                    <span className="text-xs text-[var(--text-light)]">No hay categorías</span>
                  )}
                  {allCategories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all ${
                        form.category_ids.includes(cat.id)
                          ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                          : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text)]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Imagen Principal */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                  Imagen Principal
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="px-5 py-2.5 bg-[var(--bg)] border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Subir Imagen
                      </>
                    )}
                  </label>
                  <span className="text-sm text-[var(--text-light)] font-medium px-1">o</span>
                  <input
                    name="image_url"
                    value={form.image_url}
                    onChange={handleChange}
                    placeholder="Pega la URL de la imagen..."
                    className="flex-1 w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
                  />
                </div>
                {form.image_url && (
                  <div className="mt-3 flex items-center gap-4 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
                    <img 
                      src={form.image_url} 
                      alt="Vista previa" 
                      className="w-16 h-16 object-cover rounded-lg border border-[var(--border)]"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-[var(--text-secondary)]">Vista previa</p>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                        className="text-xs text-[var(--danger)] hover:underline font-semibold"
                      >
                        Eliminar imagen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)] mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none placeholder:text-[var(--text-light)]"
                  placeholder="Describe el producto..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
              <button 
                type="submit" 
                className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all hover:-translate-y-0.5"
              >
                {editingId ? 'Actualizar Producto' : 'Crear Producto'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  className="px-6 py-2.5 border border-[var(--border)] hover:border-[var(--text)] text-[var(--text-secondary)] hover:text-[var(--text)] font-semibold text-sm rounded-xl transition-all"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ===== BÚSQUEDA Y FILTROS ===== */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-light)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <select
          value={filterFeatured}
          onChange={(e) => setFilterFeatured(e.target.value)}
          className="px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        >
          <option value="all">⭐ Todos</option>
          <option value="featured">⭐ Solo Destacados</option>
          <option value="not-featured">Sin Destacar</option>
        </select>
        <button 
          onClick={loadProducts}
          className="px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {/* ===== TABLA DE PRODUCTOS ===== */}
      {open.products && (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-[var(--shadow-sm)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Imagen</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Nombre</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Categorías</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Tallas</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Colores</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Precio</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Stock</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Destacado</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Estado</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--text-light)]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-[var(--text-secondary)]">
                      <Package size={32} className="mx-auto mb-2 text-[var(--text-light)]" />
                      <p className="text-sm">No se encontraron productos</p>
                      <p className="text-xs text-[var(--text-light)]">Prueba con otros filtros o agrega un nuevo producto</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => (
                    <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--bg)]/50 transition-colors">
                      <td className="px-4 py-3">
                        <img 
                          src={p.image_url || 'https://placehold.co/40x40?text=No+Img'} 
                          alt={p.name} 
                          className="w-10 h-10 object-cover rounded-lg bg-[var(--bg)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-[var(--text)]">{p.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(p.categories || []).map(c => (
                            <span key={c.id} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[var(--text-secondary)]">
                              {c.name}
                            </span>
                          ))}
                          {(!p.categories || p.categories.length === 0) && (
                            <span className="text-xs text-[var(--text-light)]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(p.sizes || []).map(s => (
                            <span key={s.id} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[var(--text-secondary)]">
                              {s.name}
                            </span>
                          ))}
                          {(!p.sizes || p.sizes.length === 0) && (
                            <span className="text-xs text-[var(--text-light)]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(p.colors || []).map(c => (
                            <span key={c.id} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[var(--text-secondary)]">
                              {c.name}
                            </span>
                          ))}
                          {(!p.colors || p.colors.length === 0) && (
                            <span className="text-xs text-[var(--text-light)]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-[var(--text)]">
                          ${(p.price_cents / 100).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${
                          p.stock === 0 ? 'text-[#ef4444]' : 
                          p.stock <= 5 ? 'text-[#f59e0b]' : 
                          'text-[#10b981]'
                        }`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.featured ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">
                            <Star size={12} className="fill-[#f59e0b]" />
                            Destacado
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-light)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          p.active 
                            ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' 
                            : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20'
                        }`}>
                          {p.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openGallery(p)} 
                            className="p-1.5 rounded-lg text-[var(--text-light)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                            title="Galería"
                          >
                            <Image size={16} />
                          </button>
                          <button 
                            onClick={() => startEdit(p)} 
                            className="p-1.5 rounded-lg text-[var(--text-light)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setShowVariants(true);
                            }} 
                            className="p-1.5 rounded-lg text-[var(--text-light)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                            title="Gestionar Stock"
                          >
                            <Package size={16} />
                          </button>
                          {p.active ? (
                            <button 
                              onClick={() => handleDelete(p.id)} 
                              className="p-1.5 rounded-lg text-[var(--text-light)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleReactivate(p.id)} 
                              className="p-1.5 rounded-lg text-[var(--text-light)] hover:text-[#10b981] hover:bg-[#10b981]/10 transition-all"
                              title="Reactivar"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--text-light)] flex justify-between">
            <span>{filteredProducts.length} de {products.length} productos</span>
            <span>Mostrando {filteredProducts.length} productos</span>
          </div>
        </div>
      )}

      {/* ===== CATEGORÍAS ===== */}
      {open.categories && (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)]">
          <button 
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-3">
              <Tag size={18} className="text-[var(--accent)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text)]">
                Categorías
              </h3>
              <span className="text-xs text-[var(--text-light)] bg-[var(--bg)] px-2.5 py-0.5 rounded-full">
                {allCategories.length}
              </span>
            </div>
            {open.categories ? <ChevronUp size={18} className="text-[var(--text-light)]" /> : <ChevronDown size={18} className="text-[var(--text-light)]" />}
          </button>

          {open.categories && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-4">
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  placeholder="Nueva categoría..."
                  className="flex-1 px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
                />
                <button type="submit" className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all">
                  Agregar
                </button>
              </form>

              <div className="flex flex-wrap gap-2">
                {allCategories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-1.5">
                    {editingCatId === cat.id ? (
                      <>
                        <input
                          value={editCatName}
                          onChange={e => setEditCatName(e.target.value)}
                          className="px-2 py-0.5 bg-[var(--card-bg)] border border-[var(--accent)] rounded text-sm text-[var(--text)] focus:outline-none"
                          autoFocus
                          onKeyDown={e => e.key === 'Enter' && handleUpdateCategory(cat.id)}
                        />
                        <button 
                          onClick={() => handleUpdateCategory(cat.id)}
                          className="text-[#10b981] hover:text-[#059669] text-xs font-bold"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={() => setEditingCatId(null)}
                          className="text-[var(--text-light)] hover:text-[var(--text)] text-xs font-bold"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-[var(--text)]">{cat.name}</span>
                        <button 
                          onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }}
                          className="text-[var(--text-light)] hover:text-[var(--accent)] transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-[var(--text-light)] hover:text-[var(--danger)] transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {allCategories.length === 0 && (
                  <span className="text-sm text-[var(--text-light)]">No hay categorías aún</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== TALLAS ===== */}
      {open.sizes && (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)]">
          <button 
            onClick={() => toggleSection('sizes')}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-3">
              <Ruler size={18} className="text-[var(--accent)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text)]">
                Tallas
              </h3>
              <span className="text-xs text-[var(--text-light)] bg-[var(--bg)] px-2.5 py-0.5 rounded-full">
                {allSizes.length}
              </span>
            </div>
            {open.sizes ? <ChevronUp size={18} className="text-[var(--text-light)]" /> : <ChevronDown size={18} className="text-[var(--text-light)]" />}
          </button>

          {open.sizes && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-4">
              <form onSubmit={handleCreateSize} className="flex gap-2">
                <input
                  value={sizeName}
                  onChange={e => setSizeName(e.target.value)}
                  placeholder="Nueva talla (ej: S, M, L, XL)..."
                  className="flex-1 px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
                />
                <button type="submit" className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all">
                  Agregar
                </button>
              </form>

              <div className="flex flex-wrap gap-2">
                {allSizes.map(size => (
                  <div key={size.id} className="flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-1.5">
                    {editingSizeId === size.id ? (
                      <>
                        <input
                          value={editSizeName}
                          onChange={e => setEditSizeName(e.target.value)}
                          className="px-2 py-0.5 bg-[var(--card-bg)] border border-[var(--accent)] rounded text-sm text-[var(--text)] focus:outline-none"
                          autoFocus
                          onKeyDown={e => e.key === 'Enter' && handleUpdateSize(size.id)}
                        />
                        <button 
                          onClick={() => handleUpdateSize(size.id)}
                          className="text-[#10b981] hover:text-[#059669] text-xs font-bold"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={() => setEditingSizeId(null)}
                          className="text-[var(--text-light)] hover:text-[var(--text)] text-xs font-bold"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-[var(--text)]">{size.name}</span>
                        <button 
                          onClick={() => { setEditingSizeId(size.id); setEditSizeName(size.name); }}
                          className="text-[var(--text-light)] hover:text-[var(--accent)] transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSize(size.id)}
                          className="text-[var(--text-light)] hover:text-[var(--danger)] transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {allSizes.length === 0 && (
                  <span className="text-sm text-[var(--text-light)]">No hay tallas aún</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== COLORES ===== */}
      {open.colors && (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)]">
          <button 
            onClick={() => toggleSection('colors')}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-3">
              <Palette size={18} className="text-[var(--accent)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text)]">
                Colores
              </h3>
              <span className="text-xs text-[var(--text-light)] bg-[var(--bg)] px-2.5 py-0.5 rounded-full">
                {allColors.length}
              </span>
            </div>
            {open.colors ? <ChevronUp size={18} className="text-[var(--text-light)]" /> : <ChevronDown size={18} className="text-[var(--text-light)]" />}
          </button>

          {open.colors && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-4">
              <form onSubmit={handleCreateColor} className="flex gap-2">
                <input
                  value={colorName}
                  onChange={e => setColorName(e.target.value)}
                  placeholder="Nuevo color (ej: Negro, Blanco, Rojo)..."
                  className="flex-1 px-4 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-light)]"
                />
                <button type="submit" className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl transition-all">
                  Agregar
                </button>
              </form>

              <div className="flex flex-wrap gap-2">
                {allColors.map(color => (
                  <div key={color.id} className="flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-1.5">
                    {editingColorId === color.id ? (
                      <>
                        <input
                          value={editColorName}
                          onChange={e => setEditColorName(e.target.value)}
                          className="px-2 py-0.5 bg-[var(--card-bg)] border border-[var(--accent)] rounded text-sm text-[var(--text)] focus:outline-none"
                          autoFocus
                          onKeyDown={e => e.key === 'Enter' && handleUpdateColor(color.id)}
                        />
                        <button 
                          onClick={() => handleUpdateColor(color.id)}
                          className="text-[#10b981] hover:text-[#059669] text-xs font-bold"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={() => setEditingColorId(null)}
                          className="text-[var(--text-light)] hover:text-[var(--text)] text-xs font-bold"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-[var(--text)]">{color.name}</span>
                        <button 
                          onClick={() => { setEditingColorId(color.id); setEditColorName(color.name); }}
                          className="text-[var(--text-light)] hover:text-[var(--accent)] transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteColor(color.id)}
                          className="text-[var(--text-light)] hover:text-[var(--danger)] transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {allColors.length === 0 && (
                  <span className="text-sm text-[var(--text-light)]">No hay colores aún</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL DE GALERÍA ===== */}
      {galleryProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={closeGallery}>
          <div className="bg-[var(--card-bg)] rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text)]">
                Galería: {galleryProduct.name}
              </h3>
              <button onClick={closeGallery} className="text-[var(--text-light)] hover:text-[var(--text)] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleGalleryUpload}
                className="hidden"
                id="gallery-upload"
              />
              <label
                htmlFor="gallery-upload"
                className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm rounded-xl cursor-pointer transition-all flex items-center gap-2"
              >
                <Upload size={16} />
                {galleryUploading ? 'Subiendo...' : 'Subir Imagen'}
              </label>
              <button 
                onClick={handleGalleryUrlAdd}
                className="px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all"
              >
                Agregar URL
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {galleryImages.length === 0 && (
                <div className="col-span-full text-center py-8 text-[var(--text-light)]">
                  <Image size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sin imágenes en la galería</p>
                </div>
              )}
              {galleryImages.map(img => (
                <div key={img.id} className="relative group">
                  <img 
                    src={img.image_url} 
                    alt="" 
                    className="w-full aspect-square object-cover rounded-xl border border-[var(--border)]"
                  />
                  <button
                    onClick={() => handleRemoveGalleryImage(img.id)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DE STOCK ===== */}
      {showVariants && (
        <ProductVariants
          productId={selectedProductId}
          productName={products.find(p => p.id === selectedProductId)?.name}
          onClose={() => {
            setShowVariants(false);
            setSelectedProductId(null);
            loadProducts();
          }}
        />
      )}
    </div>
  );
}