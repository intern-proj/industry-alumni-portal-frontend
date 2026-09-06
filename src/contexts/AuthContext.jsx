import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    async function validateSession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        const roles = Array.isArray(res.data?.roles) && res.data.roles.length > 0
          ? res.data.roles
          : (res.data?.role ? [res.data.role] : []);
        const role = res.data?.role || (roles.length > 0 ? roles[0] : null);
        const resolvedId = res.data?.username || res.data?.userId || res.data?.id;
        const userData = {
          ...res.data,
          id: resolvedId,
          userId: resolvedId,
          username: res.data?.username || resolvedId,
          role: role,
          roles: roles,
          email: res.data?.email,
          userType: res.data?.userType,
        };
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      } catch {
        // Token invalid — clear session
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    }
    validateSession();
  }, [token]);

  const login = useCallback(async (identifier, password) => {
    const res = await api.post('/auth/login', { username: identifier, password });
    
    // If backend indicates OTP verification is required (Staff & Industry Partners)
    if (res.data?.requiresOtp) {
      return {
        requiresOtp: true,
        sessionToken: res.data.sessionToken,
        username: res.data.username,
        message: res.data.message,
      };
    }

    // Direct login (Students)
    const jwt = res.data?.accessToken || res.data?.token;
    if (jwt) {
      localStorage.setItem('auth_token', jwt);
      setToken(jwt);

      const payload = decodeJwtPayload(jwt);
      const roles = Array.isArray(res.data?.roles) && res.data.roles.length > 0
        ? res.data.roles
        : (Array.isArray(payload?.roles) && payload.roles.length > 0
            ? payload.roles
            : (res.data?.role ? [res.data.role] : (payload?.role ? [payload.role] : [])));
      const role = res.data?.role || payload?.role || (roles.length > 0 ? roles[0] : null);
      const userData = {
        id: payload?.userId || payload?.sub || res.data?.userId,
        username: payload?.username || payload?.sub || res.data?.username,
        role: role,
        roles: roles,
        email: payload?.email || res.data?.email,
        userType: payload?.userType || res.data?.userType,
      };
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return userData;
    }
    return res.data;
  }, []);

  const adminLogin = useCallback(async (username, password) => {
    const res = await api.post('/auth/admin/login', { username, password });
    return res.data;
  }, []);

  const staffLogin = useCallback(async (username, password) => {
    const res = await api.post('/auth/admin/login', { username, password });
    return res.data;
  }, []);

  const verifyOtp = useCallback(async (sessionToken, otpCode) => {
    const res = await api.post('/auth/verify-otp', {
      sessionToken,
      tempToken: sessionToken,
      otpCode,
    });
    const jwt = res.data?.accessToken || res.data?.token;
    if (jwt) {
      localStorage.setItem('auth_token', jwt);
      setToken(jwt);

      const payload = decodeJwtPayload(jwt);
      const roles = Array.isArray(res.data?.roles) && res.data.roles.length > 0
        ? res.data.roles
        : (Array.isArray(payload?.roles) && payload.roles.length > 0
            ? payload.roles
            : (res.data?.role ? [res.data.role] : (payload?.role ? [payload.role] : [])));
      const role = res.data?.role || payload?.role || (roles.length > 0 ? roles[0] : null);
      const userData = {
        id: payload?.userId || payload?.sub || res.data?.userId,
        username: payload?.username || payload?.sub || res.data?.username,
        role: role,
        roles: roles,
        email: payload?.email || res.data?.email,
        userType: payload?.userType || res.data?.userType,
      };
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return userData;
    }
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  }, []);

  const hasRole = useCallback(
    (role) => {
      if (!user) return false;
      if (user.role === role) return true;
      if (Array.isArray(user.roles) && user.roles.includes(role)) return true;
      return false;
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (...roles) => {
      if (!user) return false;
      if (user.role && roles.includes(user.role)) return true;
      if (Array.isArray(user.roles) && roles.some((r) => user.roles.includes(r))) return true;
      return false;
    },
    [user]
  );

  const updateUser = useCallback((userData) => {
    setUser((prev) => {
      const updated = typeof userData === 'function' ? userData(prev) : { ...prev, ...userData };
      localStorage.setItem('auth_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    adminLogin,
    staffLogin,
    verifyOtp,
    logout,
    hasRole,
    hasAnyRole,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
