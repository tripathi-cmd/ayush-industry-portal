import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="ayush-spinner"></div>
        <p>Verifying Ministry of Ayush Credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to user's authorized dashboard
    if (user.role === 'student') return <Navigate to="/student" replace />;
    if (user.role === 'industry') return <Navigate to="/industry" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  return children;
}
