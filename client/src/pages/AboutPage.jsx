import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Shield, Zap, Target, Heart, Trophy } from 'lucide-react';

// Importa tus imágenes
import AboutImage from '../assets/AboutUs/About.png';
import HeroImage from '../assets/AboutUs/Hero.png';

const values = [
  {
    icon: Flame,
    title: 'DISCIPLINA',
    text: 'No hay atajos. Cada prenda es el resultado de horas de trabajo meticuloso, igual que cada round es el resultado de meses de entrenamiento.',
  },
  {
    icon: Shield,
    title: 'RESISTENCIA',
    text: 'Materiales premium que aguantan como tú aguantas. No conocemos la palabra "rendirse" ni en la vida ni en la calidad.',
  },
  {
    icon: Target,
    title: 'PRECISIÓN',
    text: 'Cada corte, cada costura, cada detalle está calculado. Como un jab perfecto, no desperdiciamos ni un movimiento.',
  },
  {
    icon: Heart,
    title: 'PASIÓN',
    text: 'Esto no es un negocio, es una misión. Vestir a los que se niegan a quedarse en la lona, a los que siempre se levantan.',
  },
  {
    icon: Trophy,
    title: 'VICTORIA',
    text: 'No se trata de ganar peleas, se trata de ganar cada día. Kong Montoya es la armadura para tu batalla diaria.',
  },
  {
    icon: Zap,
    title: 'ENERGÍA',
    text: 'Cuando te pones una pieza Kong, sientes esa chispa que te empuja a dar un round más.',
  },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero Section - NACIDOS EN EL RING */}
      <section className="about-hero">
        <div className="about-hero-image">
          <img src={AboutImage} alt="Kong Montoya" />
          <div className="about-hero-overlay"></div>
        </div>
        <div className="about-hero-content">
          <span className="about-hero-badge">NUESTRA HISTORIA</span>
          <h1 className="about-hero-title">
            NACIDOS
            <br />
            <span>EN EL RING</span>
          </h1>
        </div>
      </section>

      {/* Story Section - EL ORIGEN */}
      <section className="about-story">
        <div className="about-story-container">
          <div className="about-story-text">
            <span className="about-story-badge">EL ORIGEN</span>
            <h2 className="about-story-title">
              LA PELEA
              <br />
              <span>NUNCA TERMINA</span>
            </h2>
            <div className="about-story-description">
              <p>
                Kong Montoya nació en un gimnasio de boxeo. No en una oficina de marketing, 
                no en un estudio de diseño. En un lugar donde el sudor es moneda y los golpes 
                son lecciones.
              </p>
              <p>
                Entendimos que el boxeo no es solo un deporte—es una filosofía de vida. La disciplina 
                de levantarte temprano, la resistencia de aguantar, la humildad de saber 
                que siempre puedes mejorar.
              </p>
              <p>
                Cada pieza que creamos lleva esa filosofía cosida en cada fibra. No fabricamos 
                ropa para verse bien. Fabricamos armaduras para vivir mejor.
              </p>
            </div>
          </div>
          <div className="about-story-image">
            <div className="about-story-image-wrapper">
              <img src={HeroImage} alt="El Ring" />
            </div>
            <div className="about-story-image-border"></div>
          </div>
        </div>
      </section>

      {/* Values Section - NUESTROS VALORES */}
      <section className="about-values">
        <div className="about-values-container">
          <div className="about-values-header">
            <span className="about-values-badge">FILOSOFÍA</span>
            <h2 className="about-values-title">
              NUESTROS <span>VALORES</span>
            </h2>
          </div>
          <div className="about-values-grid">
            {values.map((v, i) => (
              <div key={i} className="about-value-card">
                <div className="about-value-icon">
                  <v.icon size={20} />
                </div>
                <h3 className="about-value-title">{v.title}</h3>
                <p className="about-value-text">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - LISTO PARA EL ROUND? */}
      <section className="about-cta">
        <div className="about-cta-container">
          <h2 className="about-cta-title">
            ¿LISTO PARA
            <br />
            <span>EL ROUND?</span>
          </h2>
          <p className="about-cta-text">
            Cada prenda Kong Montoya es una declaración de intenciones. 
            No es ropa, es actitud.
          </p>
          <Link to="/products" className="about-cta-btn">
            EXPLORAR COLECCIÓN
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}