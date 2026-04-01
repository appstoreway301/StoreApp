import { Link } from 'react-router-dom';
import logoMonogram from '../assets/Frente.png';
import gorilaImg from '../assets/gorila.png';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="footer-logos">
            <img src={logoMonogram} alt="KM" className="footer-monogram" />
            <img src={gorilaImg} alt="Kong Montoya" className="footer-gorila" />
          </div>
          <p className="footer-tagline">Streetwear with attitude.</p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Shop</h4>
            <Link to="/">All Products</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">My Orders</Link>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/profile">Profile</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Kong Montoya. All rights reserved.</p>
      </div>
    </footer>
  );
}
