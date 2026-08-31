// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isAdmin = user?.position === 'admin';

  const setAuthCookie = (name, value, hours = 24) => {
    const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  };

  const getAuthCookie = (name) => {
    const matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return matches ? decodeURIComponent(matches[1]) : null;
  };

  const eraseAuthCookie = (name) => {
    document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=Lax`;
  };

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const isJwtExpired = payload.exp * 1000 < Date.now();

      const loginTime = localStorage.getItem('login_time');
      const is24hPassed = loginTime ? (Date.now() - Number(loginTime) > 24 * 60 * 60 * 1000) : false;
      const cookieExists = Boolean(getAuthCookie('auth_token'));

      return isJwtExpired || is24hPassed || !cookieExists;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData && !isTokenExpired(token)) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);

        try {
          const response = await authAPI.getProfile();
          const profileUser = response.data?.user || response.data?.data;
          if (profileUser) {
            setUser(profileUser);
            localStorage.setItem('user', JSON.stringify(profileUser));
          }
        } catch (err) {
          console.error('Profile verification failed:', err);
        }
      } else if (token && isTokenExpired(token)) {
        logout();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user: userData } = response.data;

      if (!token || !userData) {
        return { success: false, message: 'Invalid server response' };
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('login_time', Date.now().toString());
      setAuthCookie('auth_token', token, 24);

      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('login_time');
    eraseAuthCookie('auth_token');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
