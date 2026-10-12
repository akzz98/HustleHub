import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildLoginPath, setAuthRedirectHandler } from '../auth/authRedirect';

// Lives inside the router so session-expiry redirects can navigate with query params.
function AuthRedirectBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    setAuthRedirectHandler(({ from, reason } = {}) => {
      navigate(buildLoginPath({ from, reason }), { replace: true });
    });
    return () => setAuthRedirectHandler(null);
  }, [navigate]);

  return null;
}

export default AuthRedirectBridge;
