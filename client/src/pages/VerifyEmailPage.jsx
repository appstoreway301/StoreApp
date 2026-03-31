import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.message);
        // Redirect to complete registration with the token
        setTimeout(() => {
          navigate(`/complete-registration?token=${token}&email=${encodeURIComponent(data.email)}`);
        }, 1500);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed');
      });
  }, [searchParams, navigate]);

  return (
    <div className="auth-page">
      <h1>Email Verification</h1>
      {status === 'verifying' && <p>Verifying your email...</p>}
      {status === 'success' && (
        <>
          <div className="alert alert-success">{message}</div>
          <p>Redirecting to complete your registration...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="alert alert-error">{message}</div>
          <Link to="/register">Try again</Link>
        </>
      )}
    </div>
  );
}
