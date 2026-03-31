import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  if (!isAuthenticated || user?.role !== 'admin') return <Navigate to="/" />;

  return children;
}
