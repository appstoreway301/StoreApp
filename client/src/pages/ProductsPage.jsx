import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import api from '../api/client';

const CATEGORIES = [
  { value: 'all', label: 'TODAS' },
  { value: 'camisetas', label: 'CAMISETAS' },
  { value: 'hoodies', label: 'HOODIES' },
  { value: 'gorras', label: 'GORRAS' },
  { value: 'pantalones', label: 'PANTALONES' },
  { value: 'accesorios', label: 'ACCESORIOS' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'MÁS RECIENTES' },
  { value: 'price-asc', label: 'PRECIO: MENOR A MAYOR' },
  { value: 'price-desc', label: 'PRECIO: MAYOR A MENOR' },
  { value: 'name', label: 'NOMBRE A-Z' },
];

export default function ProductsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialCat = urlParams.get('cat') || 'all';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCat);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/products')
      .then(({ data }) => {
        setProducts(data.products || []);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...products];

    if (category !== 'all') {
      result = result.filter(p => p.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.price_cents || 0) - (a.price_cents || 0));
        break;
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      default:
        break;
    }

    return result;
  }, [products, category, search, sort]);

  return (
    <div className="products-page">
      <div className="products-page-container">
        {/* Header */}
        <div className="products-header">
          <span className="products-badge">COLECCIÓN</span>
          <h1 className="products-title">TIENDA</h1>
          <p className="products-count">
            {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>

        {/* Filters Bar */}
        <div className="products-filters-bar">
          {/* Search */}
          <div className="products-search">
            <Search size={16} className="products-search-icon" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="products-search-input"
            />
            {search && (
              <button onClick={() => setSearch('')} className="products-search-clear">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Tabs (Desktop) */}
          <div className="products-categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`products-category-btn ${category === cat.value ? 'active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Mobile Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="products-filters-mobile-btn"
          >
            <SlidersHorizontal size={16} />
            FILTROS
          </button>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="products-sort"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Mobile Filters Panel */}
        {showFilters && (
          <div className="products-filters-mobile-panel">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setShowFilters(false); }}
                className={`products-mobile-category-btn ${category === cat.value ? 'active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="products-grid products-grid-loading">
            {Array(8).fill(null).map((_, i) => (
              <div key={i} className="product-skeleton">
                <div className="product-skeleton-image"></div>
                <div className="product-skeleton-title"></div>
                <div className="product-skeleton-price"></div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="products-grid">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="products-empty">
            <div className="products-empty-icon">🥊</div>
            <h3>No hay productos</h3>
            <p>{search ? 'Intenta con otra búsqueda' : 'Próximamente nuevas piezas'}</p>
          </div>
        )}
      </div>
    </div>
  );
}