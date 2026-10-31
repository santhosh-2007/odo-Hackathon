import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('brightloop_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('brightloop_token'));
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem('brightloop_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          const freshUser = response.data.user;
          setUser(freshUser);
          localStorage.setItem('brightloop_user', JSON.stringify(freshUser));
        }
      } catch (err) {
        console.error('Session expired or invalid:', err);
        localStorage.removeItem('brightloop_token');
        localStorage.removeItem('brightloop_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    verifyAuth();
  }, []);

  const login = useCallback(async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('brightloop_token', newToken);
      localStorage.setItem('brightloop_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }
    throw new Error(res.data.message || 'Login failed.');
  }, []);

  const register = useCallback(async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('brightloop_token', newToken);
      localStorage.setItem('brightloop_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }
    throw new Error(res.data.message || 'Registration failed.');
  }, []);

  const oauthLogin = useCallback(async (payload) => {
    const res = await api.post('/auth/oauth-login', payload);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('brightloop_token', newToken);
      localStorage.setItem('brightloop_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }
    throw new Error(res.data.message || 'OAuth authentication failed.');
  }, []);

  const googleLogin = useCallback(async (payload) => {
    const res = await api.post('/auth/google', payload);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('brightloop_token', newToken);
      localStorage.setItem('brightloop_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }
    throw new Error(res.data.message || 'Google authentication failed.');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('brightloop_token');
    localStorage.removeItem('brightloop_user');
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('brightloop_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        oauthLogin,
        googleLogin,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
