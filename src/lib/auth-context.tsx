'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from './api/client';
import { signalRService } from './api/signalr';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  totalXP: number;
  level: number;
  socialBattery: number;
  mood?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token and user data on mount
    const initializeAuth = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const userData = apiClient.getUserData();
          if (userData) {
            setUser(userData);
            // Start SignalR connection
            await signalRService.start();
          } else {
            // Token exists but no user data, try to fetch user
            const currentUser = await apiClient.getCurrentUser();
            setUser(currentUser);
            await signalRService.start();
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear invalid auth data
        apiClient.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup on unmount
    return () => {
      signalRService.destroy();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login(email, password);
      setUser(response.user);
      
      // Start SignalR connection
      await signalRService.start();
      
      // Set up SignalR event handlers
      signalRService.onEvent('onUserStatusUpdated', (data) => {
        if (data.userId === user?.id) {
          setUser(prev => prev ? { ...prev, socialBattery: data.socialBattery, mood: data.mood } : null);
        }
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true);
      const response = await apiClient.register(email, password, name);
      setUser(response.user);
      
      // Start SignalR connection
      await signalRService.start();
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    signalRService.destroy();
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const updatedUser = await apiClient.updateCurrentUser(data);
      setUser(updatedUser);
      
      // Update status via SignalR if social battery or mood changed
      if (data.socialBattery !== undefined || data.mood !== undefined) {
        await signalRService.updateUserStatus(
          data.socialBattery ?? user?.socialBattery ?? 50,
          data.mood ?? user?.mood
        );
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}