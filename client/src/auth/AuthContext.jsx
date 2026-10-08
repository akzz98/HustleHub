import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setUnauthorizedHandler } from '../api/http';
import {
  clearToken,
  getToken,
  readTokenPayload,
  setToken,
} from './tokenStorage';

const AuthContext = createContext(null);

function buildSession(token) {
  if (!token) {
    return { token: null, userId: null, role: null };
  }

  const payload = readTokenPayload(token);
  return {
    token,
    userId: payload?.sub ?? null,
    role: payload?.role ?? null,
  };
}

function AuthProvider({ children }) {
  const [session, setSession] = useState(() => buildSession(getToken()));

  const login = useCallback((token) => {
    setToken(token);
    setSession(buildSession(token));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setSession(buildSession(null));
  }, []);

  // Clear a dead JWT from sessionStorage when a protected API call returns 401.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearToken();
      setSession(buildSession(null));
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      isAuthenticated: Boolean(session.token),
      login,
      logout,
    }),
    [session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };
