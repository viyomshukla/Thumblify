import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { authAPI, userAPI } from '../utils/api';

interface User {
  _id: string;
  name: string;
  email: string;
  credits: number;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authAPI.verify();
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    await authAPI.login({ email, password });
    await checkAuth();
  };

  const register = async (name: string, email: string, password: string) => {
    await authAPI.register({ name, email, password });
    await checkAuth();
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const updateCredits = async () => {
    if (user) {
      try {
        const response = await userAPI.getCredits();
        setUser({ ...user, credits: response.data.credits, plan: response.data.plan });
      } catch (error) {
        console.error('Failed to update credits:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateCredits,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};