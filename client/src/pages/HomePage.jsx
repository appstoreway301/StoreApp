import { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    api.get('/products/categories')
      .then(({ data }) => setCategories(data.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = categoryId ? `?category=${categoryId}` : '';
    api.get(`/products${params}`)
      .then(({ data }) => setProducts(data.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categoryId]);

  const filtered = useMemo(() => {
    let result = [...products];

    const min = minPrice ? parseFloat(minPrice) * 100 : null;
    const max = maxPrice ? parseFloat(maxPrice) * 100 : null;
    if (min !== null) result = result.filter(p => p.price_cents >= min);
    if (max !== null) result = result.filter(p => p.price_cents <= max);

    if (sortBy === 'price-asc') result.sort((a, b) => a.price_cents - b.price_cents);
    if (sortBy === 'price-desc') result.sort((a, b) => b.price_cents - a.price_cents);

    return result;
  }, [products, minPrice, maxPrice, sortBy]);

  return (
    <div>
      <h1>Products</h1>
      <div className="category-filters">
        <button
          className={`btn ${!categoryId ? 'btn-primary' : ''}`}
          onClick={() => setCategoryId('')}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`btn ${categoryId === cat.id ? 'btn-primary' : ''}`}
            onClick={() => setCategoryId(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="price-filters">
        <div className="price-range">
          <label>Min $</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
          />
        </div>
        <div className="price-range">
          <label>Max $</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Any"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
          />
        </div>
        <div className="price-range">
          <label>Sort by</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="">Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
        {(minPrice || maxPrice || sortBy) && (
          <button className="btn btn-sm" onClick={() => { setMinPrice(''); setMaxPrice(''); setSortBy(''); }}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : filtered.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="product-grid">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
);
}

