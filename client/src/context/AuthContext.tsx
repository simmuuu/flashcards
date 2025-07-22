import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import api from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      // Check if user explicitly logged in (not auto-login)
      const token = localStorage.getItem('token');
      const autoLogin = localStorage.getItem('autoLogin');

      if (token && autoLogin === 'true') {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await api.get<User>('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error('Error loading user', err);
          localStorage.removeItem('token');
          localStorage.removeItem('autoLogin');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post<{ token: string }>('/auth/login', { email, password });
      const token = res.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('autoLogin', 'true'); // Enable auto-login for manual login
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const userRes = await api.get<User>('/auth/me');
      setUser(userRes.data);
      return true;
    } catch (err) {
      console.error('Login failed', err);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post<{ token: string }>('/auth/register', { name, email, password });
      const token = res.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('autoLogin', 'true'); // Enable auto-login for registration
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const userRes = await api.get<User>('/auth/me');
      setUser(userRes.data);
      return true;
    } catch (err) {
      console.error('Registration failed', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('autoLogin');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
