import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, notificationService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ayush_token') || null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const logout = useCallback(() => {
    localStorage.removeItem('ayush_token');
    setToken(null);
    setUser(null);
    setNotifications([]);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const list = await notificationService.getAll();
      setNotifications(list);
    } catch (err) {
      console.warn("Could not fetch notifications:", err);
    }
  }, []);

  // Load user profile on initial mount if token exists
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          fetchNotifications();
        } catch (err) {
          console.error("Token verification failed, logging out:", err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token, fetchNotifications, logout]);

  const login = async (email, password, role) => {
    const data = await authService.login({ email, password, role });
    localStorage.setItem('ayush_token', data.token);
    setToken(data.token);
    setUser(data.user);
    fetchNotifications();
    return data.user;
  };

  const register = async (formData) => {
    const data = await authService.register(formData);
    localStorage.setItem('ayush_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  // 1-Click quick login switcher for demo / evaluation
  const quickLogin = async (role) => {
    let email = "student@ayush.gov.in";
    let password = "ayush123";

    if (role === "industry") {
      email = "recruiter@dabur.com";
      password = "ayush123";
    } else if (role === "admin") {
      email = "admin@ayush.gov.in";
      password = "admin123";
    }

    return await login(email, password, role);
  };

  const markNotificationRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const updateUser = (updated) => {
    setUser(prev => ({ ...prev, ...updated }));
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      quickLogin,
      logout,
      updateUser,
      notifications,
      unreadNotificationsCount,
      refreshNotifications: fetchNotifications,
      markNotificationRead
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Separate hook export
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
