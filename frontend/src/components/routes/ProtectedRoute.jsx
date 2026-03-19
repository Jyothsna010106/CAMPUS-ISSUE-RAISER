import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import RouteLoader from './RouteLoader';

export default function ProtectedRoute({ children }) {
  const { authReady, user } = useAuth();

  if (!authReady) {
    return <RouteLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
