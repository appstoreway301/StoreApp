import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import logoMonogram from '../assets/Frente.png';
import { resolveImageUrl } from '../utils/imageUrl';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Evitar scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Efecto de scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animación del badge del carrito
  useEffect(() => {
    if (cartCount > 0) {
      const badge = document.querySelector('.cart-badge');
      if (badge) {
        badge.classList.add('pulse');
        setTimeout(() => badge.classList.remove('pulse'), 500);
      }
    }
  }, [cartCount]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/');
  }

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <img src={logoMonogram} alt="Kong Montoya" className="navbar-logo" />
          <span>Kong Montoya</span>
        </Link>

        {/* Links de escritorio */}
        <div className="navbar-links navbar-desktop">
          <button className="theme-toggle" onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'}>
            {dark ? '☀️' : '🌙'}
          </button>
          <Link to="/">Productos</Link>
          <Link to="/cart" className="cart-link">
            Carrito {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/orders">Mis Pedidos</Link>
              {user.role === 'admin' && <Link to="/admin">Admin</Link>}

              <div className="user-dropdown">
                <div className="navbar-user-link">
                  {user.avatar_url ? (
                    <img src={resolveImageUrl(user.avatar_url)} alt={user.name} className="navbar-avatar" />
                  ) : (
                    <span className="navbar-avatar navbar-avatar-default">{user.name.charAt(0).toUpperCase()}</span>
                  )}
                  <span>{user.name}</span>
                </div>
                <div className="dropdown-menu">
                  <Link to="/profile">👤 Mi Perfil</Link>
                  <Link to="/orders">📦 Mis Pedidos</Link>
                  {user.role === 'admin' && <Link to="/admin">⚙️ Admin</Link>}
                  <button onClick={handleLogout} className="dropdown-item">🚪 Cerrar Sesión</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login">Iniciar Sesión</Link>
              <Link to="/register">Registrarse</Link>
            </>
          )}
        </div>

        {/* Mobile: carrito + hamburguesa */}
        <div className="navbar-mobile-actions">
          <Link to="/cart" className="cart-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          <button className={`hamburger ${menuOpen ? 'hamburger-open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Overlay del menú móvil */}
      {menuOpen && <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />}

      {/* Menú móvil */}
      <div className={`mobile-menu ${menuOpen ? 'mobile-menu-open' : ''}`}>
        {/* Header con logo y botón cerrar */}
        <div className="mobile-menu-header">
          <div className="mobile-menu-header-brand">
            <img src={logoMonogram} alt="Kong Montoya" className="mobile-menu-logo" />
            <span>Kong Montoya</span>
          </div>
          <button 
            className="mobile-menu-close" 
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Perfil del usuario (solo si está autenticado) */}
        {isAuthenticated && (
          <div className="mobile-menu-user">
            {user.avatar_url ? (
              <img src={resolveImageUrl(user.avatar_url)} alt={user.name} className="mobile-menu-avatar" />
            ) : (
              <div className="mobile-menu-avatar-default">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="mobile-menu-user-info">
              <div className="mobile-menu-name">{user.name}</div>
              <div className="mobile-menu-role">{user.role === 'admin' ? 'Admin' : 'Cliente'}</div>
            </div>
          </div>
        )}

        {/* Links principales */}
        <div className="mobile-menu-links">
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <span className="mobile-menu-icon">🏠</span>
            <span>Productos</span>
          </Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)}>
            <span className="mobile-menu-icon">🛒</span>
            <span>Carrito</span>
            {cartCount > 0 && <span className="mobile-menu-badge">{cartCount}</span>}
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/orders" onClick={() => setMenuOpen(false)}>
                <span className="mobile-menu-icon">📦</span>
                <span>Mis Pedidos</span>
              </Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                <span className="mobile-menu-icon">👤</span>
                <span>Mi Perfil</span>
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}>
                  <span className="mobile-menu-icon">⚙️</span>
                  <span>Admin</span>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                <span className="mobile-menu-icon">🔐</span>
                <span>Iniciar Sesión</span>
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>
                <span className="mobile-menu-icon">📝</span>
                <span>Registrarse</span>
              </Link>
            </>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="mobile-menu-footer">
          <button className="mobile-menu-theme-toggle" onClick={toggle}>
            <span className="mobile-menu-icon">{dark ? '☀️' : '🌙'}</span>
            <span>{dark ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          {isAuthenticated && (
            <button onClick={handleLogout} className="mobile-menu-logout">
              <span className="mobile-menu-icon">🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}