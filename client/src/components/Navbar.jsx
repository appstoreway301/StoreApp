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

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <img src={logoMonogram} alt="Kong Montoya" className="navbar-logo" />
          <span>Kong Montoya</span>
        </Link>

        {/* Desktop links */}
        <div className="navbar-links navbar-desktop">
          <button className="theme-toggle" onClick={toggle} title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? '\u2600' : '\u263E'}
          </button>
          <Link to="/">Products</Link>
          <Link to="/cart" className="cart-link">
            Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/orders">My Orders</Link>
              {user.role === 'admin' && <Link to="/admin">Admin</Link>}
              <Link to="/profile" className="navbar-user-link">
                {user.avatar_url ? (
                  <img src={resolveImageUrl(user.avatar_url)} alt={user.name} className="navbar-avatar" />
                ) : (
                  <span className="navbar-avatar navbar-avatar-default">{user.name.charAt(0).toUpperCase()}</span>
                )}
                {user.name}
              </Link>
              <button onClick={handleLogout} className="btn btn-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="navbar-mobile-actions">
          <Link to="/cart" className="cart-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          <button className={`hamburger ${menuOpen ? 'hamburger-open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {menuOpen && <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />}

      {/* Mobile drawer */}
      <div className={`mobile-menu ${menuOpen ? 'mobile-menu-open' : ''}`}>
        {isAuthenticated && (
          <div className="mobile-menu-user">
            {user.avatar_url ? (
              <img src={resolveImageUrl(user.avatar_url)} alt={user.name} className="mobile-menu-avatar" />
            ) : (
              <span className="mobile-menu-avatar mobile-menu-avatar-default">{user.name.charAt(0).toUpperCase()}</span>
            )}
            <div>
              <div className="mobile-menu-name">{user.name}</div>
              <div className="mobile-menu-role">{user.role === 'admin' ? 'Admin' : 'Customer'}</div>
            </div>
          </div>
        )}

        <div className="mobile-menu-links">
          <Link to="/">Products</Link>
          <Link to="/cart">Cart {cartCount > 0 && `(${cartCount})`}</Link>
          {isAuthenticated ? (
            <>
              <Link to="/orders">My Orders</Link>
              <Link to="/profile">Profile</Link>
              {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>

        <div className="mobile-menu-footer">
          <button className="theme-toggle" onClick={toggle} title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? '\u2600' : '\u263E'}
          </button>
          {isAuthenticated && (
            <button onClick={handleLogout} className="btn btn-sm">Logout</button>
          )}
        </div>
      </div>
    </nav>
  );
}
