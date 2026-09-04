import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authService.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          console.error('Failed to validate token on load:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    const response = await authService.login(username, password);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      const userRes = await authService.getCurrentUser();
      setUser(userRes.data);
      return { success: true, requiresOtp: false };
    } else if (response.data.sessionToken || response.data.tempToken) {
      // Logic for OTP
      return { success: true, requiresOtp: true, sessionToken: response.data.sessionToken || response.data.tempToken };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
