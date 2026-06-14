import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/send-verification', { email });
      setSuccess(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el correo de verificación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <h1>Crear cuenta</h1>
      <p>Ingresa tu correo para comenzar. Te enviaremos un enlace de verificación.</p>
      
      <form onSubmit={handleSubmit} className="register-form">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <label>Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
        />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar correo de verificación'}
        </button>
      </form>
      
      <p className="register-alt">
        ¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </div>
  );
}