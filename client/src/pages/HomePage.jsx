import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Shield, Zap } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import api from '../api/client';
import HeroPrincipal from '../assets/AboutUs/HeroPrincipal.png';
import AboutImage from '../assets/AboutUs/About.png';

// ==========================================================================
// SECCIÓN 1: Hero
// ==========================================================================
function HeroSection() {
  return (
    <section className="home-hero">
      <div className="home-hero-bg">
        <img src={HeroPrincipal} alt="Kong Montoya" className="home-hero-bg-img" />
        <div className="home-hero-overlay"></div>
      </div>

      <div className="home-hero-text-bg">
        <span>KONG</span>
      </div>

      <div className="home-hero-content">
        <div className="home-hero-text">
          <div className="home-hero-badge">
            <span>STREETWEAR DE COMBATE</span>
          </div>

          <h1 className="home-hero-title">
            STAY
            <br />
            <span>HUNGRY</span>
          </h1>

          <p className="home-hero-subtitle">
            La pelea nunca termina. Cada prenda lleva la disciplina, el sudor y la ambición de los que no se rinden.
          </p>

          <div className="home-hero-buttons">
            <Link to="/products" className="home-hero-btn-primary">
              VER COLECCIÓN
              <ArrowRight size={16} />
            </Link>
            <Link to="/about" className="home-hero-btn-secondary">
              NUESTRA HISTORIA
            </Link>
          </div>

          <div className="home-hero-stats">
            <div className="home-hero-stat">
              <div className="home-hero-stat-value">100%</div>
              <div className="home-hero-stat-label">ALGODÓN PREMIUM</div>
            </div>
            <div className="home-hero-stat">
              <div className="home-hero-stat-value">24H</div>
              <div className="home-hero-stat-label">ENVÍO EXPRESS</div>
            </div>
            <div className="home-hero-stat">
              <div className="home-hero-stat-value">🥊</div>
              <div className="home-hero-stat-label">HECHO CON GARRA</div>
            </div>
          </div>
        </div>
      </div>

      <div className="home-hero-divider"></div>
    </section>
  );
}

// ==========================================================================
// SECCIÓN 2: Marquee Banner
// ==========================================================================
function MarqueeBanner() {
  return (
    <div className="home-marquee">
      <div className="home-marquee-content">
        {Array(10).fill(null).map((_, i) => (
          <span key={i} className="home-marquee-text">
            ENVÍO GRATIS +$999 · STAY HUNGRY · NUEVA COLECCIÓN · LA PELEA NUNCA TERMINA ·
          </span>
        ))}
      </div>
    </div>
  );
}

// ==========================================================================
// SECCIÓN 3: Productos Destacados (AHORA USA /products/featured)
// ==========================================================================
function FeaturedProducts({ products, isLoading }) {
  return (
    <section className="home-featured">
      <div className="home-featured-container">
        <div className="home-featured-header">
          <div>
            <span className="home-featured-badge">⭐ SELECCIÓN</span>
            <h2 className="home-featured-title">
              PIEZAS <span>DESTACADAS</span>
            </h2>
          </div>
          <Link to="/products" className="home-featured-link">
            VER TODO
            <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="home-featured-grid">
            {Array(4).fill(null).map((_, i) => (
              <div key={i} className="home-featured-skeleton">
                <div className="home-featured-skeleton-image"></div>
                <div className="home-featured-skeleton-title"></div>
                <div className="home-featured-skeleton-price"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="home-featured-grid">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="home-featured-empty">
            <p>Próximamente nuevas piezas destacadas</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ==========================================================================
// SECCIÓN 4: About / Quiénes Somos
// ==========================================================================
const VALUES = [
  {
    icon: Flame,
    title: 'GARRA',
    description: 'Cada pieza nace del fuego interior. No fabricamos ropa, forjamos armaduras para la vida diaria.'
  },
  {
    icon: Shield,
    title: 'RESISTENCIA',
    description: 'Materiales premium que aguantan cada round. Algodón de 300gsm que no conoce la rendición.'
  },
  {
    icon: Zap,
    title: 'ACTITUD',
    description: 'No es lo que llevas, es cómo lo llevas. Kong Montoya es para los que se levantan después de cada golpe.'
  },
];

function AboutSection() {
  return (
    <section className="home-about">
      <div className="home-about-container">
        <div className="home-about-image">
          <div className="home-about-image-wrapper">
            <img src={AboutImage} alt="Kong Montoya - El Ring" />
          </div>
          <div className="home-about-image-border"></div>
        </div>

        <div className="home-about-text">
          <span className="home-about-badge">QUIÉNES SOMOS</span>
          <h2 className="home-about-title">
            NACIDOS<br /><span>EN EL RING</span>
          </h2>
          <p className="home-about-description">
            Kong Montoya no es solo una marca de ropa. Es un movimiento para los que entienden que
            la vida es una pelea constante. Cada prenda lleva impresa la filosofía del boxeo:
            disciplina, sacrificio y la voluntad inquebrantable de ganar.
          </p>

          <div className="home-about-values">
            {VALUES.map((v, i) => (
              <div key={i} className="home-about-value">
                <div className="home-about-value-icon">
                  <v.icon size={20} />
                </div>
                <div>
                  <h4>{v.title}</h4>
                  <p>{v.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Link to="/about" className="home-about-link">
            CONOCE NUESTRA HISTORIA
          </Link>
        </div>
      </div>
    </section>
  );
}

// ==========================================================================
// COMPONENTE PRINCIPAL: HomePage
// ==========================================================================
export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // 👈 AHORA usa /products/featured para obtener solo los destacados
    api.get('/products/featured?limit=8')
      .then(({ data }) => {
        setFeaturedProducts(data.products || []);
      })
      .catch(() => {
        setFeaturedProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <HeroSection />
      <MarqueeBanner />
      <FeaturedProducts products={featuredProducts} isLoading={loading} />
      <AboutSection />
    </div>
  );
}