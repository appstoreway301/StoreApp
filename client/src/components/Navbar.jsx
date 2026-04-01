import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import logoMonogram from '../assets/Frente.png';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  async function handleLogout() {
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

        <div className="navbar-links">
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
              <Link to="/profile" className="navbar-user-link">Hi, {user.name}</Link>
              <button onClick={handleLogout} className="btn btn-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
