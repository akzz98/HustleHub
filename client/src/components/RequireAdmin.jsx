import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { buildLoginPath } from '../auth/authRedirect';

function RequireAdmin({ children }) {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={buildLoginPath({ from: `${location.pathname}${location.search}` })}
        replace
      />
    );
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RequireAdmin;
