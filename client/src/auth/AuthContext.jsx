import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile, setUnauthorizedHandler } from '../api/http';
import { redirectToLogin } from './authRedirect';
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
  const [profile, setProfile] = useState(null);

  const login = useCallback((token) => {
    setToken(token);
    setSession(buildSession(token));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setSession(buildSession(null));
    setProfile(null);
  }, []);

  // Clear a dead JWT and send the person back to Sign in with where they were.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      const from = `${window.location.pathname}${window.location.search}`;
      clearToken();
      setSession(buildSession(null));
      setProfile(null);
      redirectToLogin({ from, reason: 'expired' });
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (!session.token) {
      setProfile(null);
      return undefined;
    }

    let cancelled = false;

    getProfile()
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session.token]);

  const value = useMemo(
    () => ({
      ...session,
      profile,
      name: profile?.name ?? null,
      isAuthenticated: Boolean(session.token),
      login,
      logout,
    }),
    [session, profile, login, logout]
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
