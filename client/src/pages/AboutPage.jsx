// client/src/pages/AboutPage.jsx
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Target, Heart, Clock, Star, Award } from 'lucide-react';

// Importa tus imágenes
import AboutImage from '../assets/AboutUs/About.png';
import HeroImage from '../assets/AboutUs/Hero.png';

const values = [
  {
    icon: Clock,
    title: 'PACIENCIA',
    text: 'Las cosas buenas tardan en llegar. Como en el boxeo, no se gana en el primer round, se construye round a round, golpe a golpe, hasta que la victoria es inevitable.',
  },
  {
    icon: Star,
    title: 'FE',
    text: 'Nunca la pierdas, nunca sabes cuándo va a llegar tu oportunidad. La fe mueve montañas y también mueve la industria. Creer es el primer paso para crear.',
  },
  {
    icon: Award,
    title: 'DISCIPLINA',
    text: 'No hay campeones sin disciplina. Cada día es una oportunidad para mejorar, para entrenar, para ser mejor que ayer. La constancia es el verdadero poder.',
  },
  {
    icon: Shield,
    title: 'RESISTENCIA',
    text: 'Aguantamos como tú aguantas. No conocemos la palabra "rendirse" ni en la vida ni en la calidad. Cada prenda está hecha para durar, como tú.',
  },
  {
    icon: Target,
    title: 'PRECISIÓN',
    text: 'Cada corte, cada costura, cada detalle está calculado al milímetro. Como un jab perfecto, no desperdiciamos ni un movimiento, ni un hilo.',
  },
  {
    icon: Heart,
    title: 'PASIÓN',
    text: 'Esto no es un negocio, es una misión. Vestir a los que se niegan a quedarse en la lona, a los que siempre se levantan, a los que luchan cada día.',
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
            {/* 👇 TODOS LOS PÁRRAFOS JUSTIFICADOS */}
            <div className="about-story-description">
              <p className="about-text-justify">
                Kong Montoya nació en un gimnasio de boxeo. No en una oficina de marketing, 
                no en un estudio de diseño. En un lugar donde el sudor es moneda y los golpes 
                son lecciones.
              </p>
              <p className="about-text-justify">
                Entendimos que el boxeo no es solo un deporte—es una filosofía de vida. La disciplina 
                de levantarte temprano, la resistencia de aguantar, la humildad de saber 
                que siempre puedes mejorar.
              </p>
              <p className="about-text-justify">
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
            {/* 👇 SUBTÍTULO JUSTIFICADO */}
            <p className="about-values-subtitle about-text-justify">
              Los principios que nos guían y definen quiénes somos
            </p>
          </div>
          <div className="about-values-grid">
            {values.map((v, i) => (
              <div key={i} className="about-value-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="about-value-icon">
                  <v.icon size={20} />
                </div>
                <h3 className="about-value-title">{v.title}</h3>
                {/* 👇 TEXTO DEL VALOR JUSTIFICADO */}
                <p className="about-value-text about-text-justify">{v.text}</p>
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
          {/* 👇 TEXTO DE CTA JUSTIFICADO */}
          <p className="about-cta-text about-text-justify">
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