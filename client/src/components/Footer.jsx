import { Link } from 'react-router-dom';
import logoMonogram from '../assets/Frente.png';
import gorilaImg from '../assets/gorila.png';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">

          {/* Columna 1 - Logo y eslogan */}
          <div className="footer-col">
            <div className="footer-logo">
              <img src={logoMonogram} alt="Kong Montoya" className="footer-logo-img" />
              <span>KONG MONTOYA</span>
            </div>
            <p className="footer-phrase">STAY HUNGRY. LA PELEA NUNCA TERMINA.</p>
          </div>

          {/* Columna 2 - EXPLORAR */}
          <div className="footer-col">
            <h4>EXPLORAR</h4>
            <ul>
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="#products">Productos</Link></li>
              <li><Link to="/about">Sobre Nosotros</Link></li>
              <li><Link to="/contact">Contacto</Link></li>
            </ul>
          </div>

          {/* Columna 3 - SOPORTE */}
          <div className="footer-col">
            <h4>SOPORTE</h4>
            <ul>
              <li><Link to="/faq">Preguntas Frecuentes</Link></li>
              <li><Link to="/shipping">Envíos</Link></li>
              <li><Link to="/returns">Devoluciones</Link></li>
              <li><Link to="/size-guide">Guía de Tallas</Link></li>
            </ul>
          </div>

          {/* Columna 4 - LEGAL */}
          <div className="footer-col">
            <h4>LEGAL</h4>
            <ul>
              <li><Link to="/privacy">Política de Privacidad</Link></li>
              <li><Link to="/terms">Términos y Condiciones</Link></li>
              <li><Link to="/cookies">Política de Cookies</Link></li>
            </ul>
          </div>

          {/* Columna 5 - SÍGUENOS */}
          <div className="footer-col">
            <h4>SÍGUENOS</h4>
            <ul className="footer-social">
              <li><a href="https://www.instagram.com/kongmontoya_store/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer">Twitter / X</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer">TikTok</a></li>
              <li><a href="#" target="_blank" rel="noopener noreferrer">YouTube</a></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Kong Montoya. Todos los derechos reservados.</p>
          <p className="footer-made">Hecho en Sonora, México 🇲🇽</p>
        </div>
      </div>
    </footer>
  );
}
