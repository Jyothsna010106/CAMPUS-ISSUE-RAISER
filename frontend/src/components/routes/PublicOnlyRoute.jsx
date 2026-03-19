import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import RouteLoader from './RouteLoader';

export default function PublicOnlyRoute({ children }) {
  const { authReady, user } = useAuth();

  if (!authReady) {
    return <RouteLoader />;
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace />;
  }

  return children;
}
