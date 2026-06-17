import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-original">
      {/* Marquee Banner */}
      <div className="footer-marquee">
        <div className="footer-marquee-content">
          {Array(8).fill(null).map((_, i) => (
            <span key={i} className="footer-marquee-text">
              STAY HUNGRY · LA PELEA NUNCA TERMINA · KONG MONTOYA ·
            </span>
          ))}
        </div>
      </div>

      <div className="footer-original-container">
        <div className="footer-original-grid">
          {/* Brand Column */}
          <div className="footer-original-brand">
            <Link to="/" className="footer-original-logo">
              <span className="footer-original-logo-bold">KONG</span>
              <span className="footer-original-logo-light">MONTOYA</span>
            </Link>
            <p className="footer-original-tagline">
              Streetwear para los que pelean. Cada prenda es un round ganado.
            </p>
          </div>

          {/* Explorar */}
          <div className="footer-original-col">
            <h4>Explorar</h4>
            <ul>
              <li><Link to="/products">Tienda</Link></li>
              <li><Link to="/products?category=tshirts">Camisetas</Link></li>
              <li><Link to="/products?category=hoodies">Hoodies</Link></li>
              <li><Link to="/products?category=accessories">Accesorios</Link></li>
            </ul>
          </div>

          {/* Soporte */}
          <div className="footer-original-col">
            <h4>Soporte</h4>
            <ul>
              <li><Link to="/orders">Mis Pedidos</Link></li>
              <li><span>Envíos</span></li>
              <li><span>Devoluciones</span></li>
              <li><span>FAQ</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-original-col">
            <h4>Legal</h4>
            <ul>
              <li><span>Privacidad</span></li>
              <li><span>Términos</span></li>
              <li><span>Cookies</span></li>
            </ul>
          </div>

          {/* Redes */}
          <div className="footer-original-col">
            <h4>Redes</h4>
            <ul>
              <li><a href="https://www.instagram.com/kongmontoya_store/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="https://www.tiktok.com/@kongmontoya_store444/" target="_blank" rel="noopener noreferrer">TikTok</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer">Twitter / X</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-original-bottom">
          <p>© {currentYear} KONG MONTOYA. TODOS LOS DERECHOS RESERVADOS.</p>
          <p>STAY HUNGRY. LA PELEA NUNCA TERMINA.</p>
        </div>
      </div>
    </footer>
  );
}