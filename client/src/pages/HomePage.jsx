import { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import ParticleBackground from '../components/ParticleBackground';
import gorilaImg from '../assets/gorila.png';
import logoMonogram from '../assets/Frente.png';
import ImagenFrontal from '../assets/gorila.png';

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
      {/* HERO SECTION - STAY HUNGRY */}
      <section className="hero-new">
        <div className="hero-new-container">
          <div className="hero-new-image">
            <img 
              src={ImagenFrontal} 
              alt="Stay Hungry" 
              className="hero-new-img"
            />
          </div>
          <div className="hero-new-content">
            <div className="hero-new-text">
              <h1 className="hero-new-title">STAY<br />HUNGRY</h1>
              <p className="hero-new-subtitle">
                Never settle. Never follow.<br />
                For those who create, not imitate.
              </p>
              <div className="hero-new-buttons">
                <a href="#products" className="hero-new-btn hero-new-btn-primary">
                  SHOP NOW
                </a>
                <a href="#products" className="hero-new-btn hero-new-btn-secondary">
                  EXPLORE
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== QUIÉNES SOMOS - DISEÑO HORIZONTAL CON MÁS INFORMACIÓN ==================== */}
      <section className="about-horizontal">
        <div className="about-horizontal-container">
          <h2 className="about-horizontal-title">QUIÉNES SOMOS</h2>
          
          <p className="about-horizontal-intro">
            <strong>Kong Montoya</strong> nace del ring. De la historia real de un boxeador que 
            aprendió a levantarse más veces de las que cayó. No es solo ropa, es una extensión 
            de tu actitud — para quienes no siguen tendencias, las crean.
          </p>

          <div className="about-horizontal-grid">
            {/* Tarjeta 1 - NACIDA DEL RING */}
            <div className="about-horizontal-card">
              <div className="about-horizontal-icon">🥊</div>
              <h3>NACIDA DEL RING</h3>
              <p>Esta marca surge de la historia real de un boxeador que aprendió a levantarse más veces de las que cayó.</p>
              <div className="about-horizontal-detail">
                <span>Disciplina</span>
                <span>Constancia</span>
                <span>Lucha</span>
              </div>
            </div>

            {/* Tarjeta 2 - FORJA TU CARÁCTER */}
            <div className="about-horizontal-card">
              <div className="about-horizontal-icon">⚡</div>
              <h3>FORJA TU CARÁCTER</h3>
              <p>No es ropa para aparentar fortaleza. Es para quienes la están construyendo día a día. Para los que creen en el sacrificio.</p>
              <div className="about-horizontal-detail">
                <span>Sacrificio</span>
                <span>Ambición</span>
                <span>Corazón</span>
              </div>
            </div>

            {/* Tarjeta 3 - LA PELEA NUNCA TERMINA */}
            <div className="about-horizontal-card">
              <div className="about-horizontal-icon">👊</div>
              <h3>LA PELEA NUNCA TERMINA</h3>
              <p>Diseñada para quienes enfrentan sus combates en el gimnasio, en el trabajo o en la vida. STAY HUNGRY.</p>
              <div className="about-horizontal-detail">
                <span>Resistencia</span>
                <span>Libertad</span>
                <span>Pasión</span>
              </div>
            </div>
          </div>

          {/* Cita inspiracional adicional */}
          <div className="about-horizontal-footer">
            <p>"No se trata solo de entrenar el cuerpo, sino de forjar el carácter."</p>
            <span>— KONG MONTOYA</span>
          </div>
        </div>
      </section>

      {/* PRODUCTS SECTION */}
      <div id="products" className="products-section">
        <ParticleBackground />
        <div className="products-section-inner">
          <h2 className="section-title">Products</h2>
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
      </div>
    </div>
  );
}