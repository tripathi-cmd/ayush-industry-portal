import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, notificationService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const list = await notificationService.getAll();
      setNotifications(list);
    } catch {
      // Ignore if unauthenticated
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network error on logout
    }
    setUser(null);
    setNotifications([]);
  }, []);

  // Check current session from HttpOnly cookie on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const profile = await authService.getMe();
        setUser(profile);
        fetchNotifications();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, [fetchNotifications]);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    setUser(data.user);
    fetchNotifications();
    return data.user;
  };

  const register = async (formData) => {
    const data = await authService.register(formData);
    setUser(data.user);
    fetchNotifications();
    return data.user;
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
      loading,
      login,
      register,
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
