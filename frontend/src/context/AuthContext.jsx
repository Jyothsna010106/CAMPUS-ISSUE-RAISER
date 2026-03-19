import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { me } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setAuthReady(true);
      return null;
    }

    try {
      const response = await me();
      setUser(response.data);
      return response.data;
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setAuthReady(true);
    }
  }, [token]);

  useEffect(() => {
    setAuthReady(false);
    refreshUser();
  }, [refreshUser]);

  const setSession = (nextToken) => {
    localStorage.setItem('token', nextToken);
    setToken(nextToken);
  };

  const clearSession = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({
    token,
    user,
    authReady,
    isAuthenticated: Boolean(token && user),
    setSession,
    clearSession,
    refreshUser,
  }), [token, user, authReady, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
