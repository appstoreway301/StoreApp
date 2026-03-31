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
      setError(err.response?.data?.error || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Create Account</h1>
      <p>Enter your email to get started. We'll send you a verification link.</p>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Sending...' : 'Send Verification Email'}
        </button>
      </form>
      <p className="auth-alt">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
