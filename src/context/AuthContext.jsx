import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAxiosToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    setAccessToken(null);
    setAxiosToken(null);
    setUser(null);
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      setAccessToken(data.accessToken);
      setAxiosToken(data.accessToken);
      
      // Fetch user profile
      const userRes = await api.get('/auth/me'); // Needs to be implemented in backend
      setUser(userRes.data.user);
    } catch (err) {
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Event listeners for sync across non-React code (e.g. axios interceptor)
    const onRefreshed = (e) => {
      setAccessToken(e.detail);
      setAxiosToken(e.detail);
    };
    const onLogout = () => logout();

    window.addEventListener('token:refreshed', onRefreshed);
    window.addEventListener('auth:logout', onLogout);

    return () => {
      window.removeEventListener('token:refreshed', onRefreshed);
      window.removeEventListener('auth:logout', onLogout);
    };
  }, [restoreSession, logout]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setAxiosToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    setAccessToken(data.accessToken);
    setAxiosToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const value = { user, accessToken, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
