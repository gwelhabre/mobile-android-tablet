import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { login as apiLogin, register as apiRegister, LoginPayload, RegisterPayload } from '../api/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('currentUser');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.warn('Auth bootstrap error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await apiLogin(payload);
    await AsyncStorage.setItem('authToken', data.token);
    await AsyncStorage.setItem('currentUser', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await apiRegister(payload);
    await AsyncStorage.setItem('authToken', data.token);
    await AsyncStorage.setItem('currentUser', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('currentUser');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
