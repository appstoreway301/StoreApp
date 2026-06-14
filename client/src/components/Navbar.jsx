import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, Sun, Moon, LogOut, Package, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { resolveImageUrl } from '../utils/imageUrl';
import logoMonogram from '../assets/Frente.png';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Efecto de scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'INICIO' },
    { to: '/products', label: 'PRODUCTOS' },
    { to: '/about', label: 'NOSOTROS' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className={`navbar-custom ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-custom-container">
        {/* Logo con imagen */}
        <Link to="/" className="navbar-custom-logo">
          <img src={logoMonogram} alt="Kong Montoya" className="navbar-custom-logo-img" />
          <span className="navbar-custom-logo-bold">KONG</span>
          <span className="navbar-custom-logo-light">MONTOYA</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar-custom-desktop">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-custom-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {link.label}
              {location.pathname === link.to && <span className="navbar-custom-link-active" />}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="navbar-custom-actions">
          {/* Theme Toggle */}
          <button onClick={toggle} className="navbar-custom-icon-btn" aria-label="Alternar tema">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Cart */}
          <Link to="/cart" className="navbar-custom-cart">
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="navbar-custom-cart-badge">{cartCount}</span>}
          </Link>

          {/* User Menu Desktop */}
          {isAuthenticated ? (
            <div className="navbar-custom-user-dropdown" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="navbar-custom-user-btn"
              >
                {user?.avatar_url ? (
                  <img src={resolveImageUrl(user.avatar_url)} alt={user.name} className="navbar-custom-avatar" />
                ) : (
                  <span className="navbar-custom-avatar-default">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
                <span className="navbar-custom-user-name">{user?.name?.split(' ')[0] || 'Usuario'}</span>
                <ChevronDown size={12} className="navbar-custom-chevron" />
              </button>
              {userMenuOpen && (
                <div className="navbar-custom-dropdown">
                  <div className="navbar-custom-dropdown-header">
                    <p className="navbar-custom-dropdown-name">{user?.name || 'Usuario'}</p>
                    <p className="navbar-custom-dropdown-email">{user?.email}</p>
                  </div>
                  <Link to="/profile" className="navbar-custom-dropdown-item">
                    <User size={14} /> Mi Perfil
                  </Link>
                  <Link to="/orders" className="navbar-custom-dropdown-item">
                    <Package size={14} /> Mis Pedidos
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="navbar-custom-dropdown-item">
                      <span className="navbar-custom-dropdown-icon">⚙️</span> Admin
                    </Link>
                  )}
                  <button onClick={handleLogout} className="navbar-custom-dropdown-item navbar-custom-dropdown-logout">
                    <LogOut size={14} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="navbar-custom-login-btn">
              ENTRAR
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="navbar-custom-mobile-toggle"
            aria-label="Menú"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="navbar-custom-mobile">
          <div className="navbar-custom-mobile-links">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`navbar-custom-mobile-link ${location.pathname === link.to ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="navbar-custom-mobile-divider" />
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="navbar-custom-mobile-link" onClick={() => setMobileOpen(false)}>
                  Mi Perfil
                </Link>
                <Link to="/orders" className="navbar-custom-mobile-link" onClick={() => setMobileOpen(false)}>
                  Mis Pedidos
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="navbar-custom-mobile-link" onClick={() => setMobileOpen(false)}>
                    Administración
                  </Link>
                )}
                <button onClick={handleLogout} className="navbar-custom-mobile-logout">
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link to="/login" className="navbar-custom-mobile-link" onClick={() => setMobileOpen(false)}>
                INICIAR SESIÓN
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}