'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  loginWithRoblox: () => void;
  logout: () => Promise<void>;
  checkRobloxAuth: () => Promise<void>;
  checkSession: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
    setUser(null);
  };

  const checkRobloxAuth = async () => {
    try {
      const response = await fetch('/api/auth/roblox/user');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          // Convert Roblox user to our User format
          const robloxUser: User = {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email || '',
            avatar: data.user.avatar || `https://www.roblox.com/headshot-thumbnail/image?userId=${data.user.id}&width=150&height=150&format=png`,
            joinDate: new Date().toISOString().split('T')[0],
            bio: 'Roblox user',
            tradePosts: [],
          };
          setUser(robloxUser);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking Roblox auth:', error);
    }
    
    // Fallback to session check
    await checkSession();
  };

  useEffect(() => {
    // Check for Roblox OAuth user first, then session
    const initAuth = async () => {
      setIsLoading(true);
      await checkRobloxAuth();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const loginWithRoblox = () => {
    try {
      // Redirect to Roblox OAuth authorization
      window.location.href = '/api/auth/roblox?action=authorize';
    } catch (error) {
      console.error('Error initiating Roblox OAuth:', error);
      // Fallback: try using window.location.replace
      window.location.replace('/api/auth/roblox?action=authorize');
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Delete Roblox session
      await fetch('/api/auth/roblox/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error logging out from Roblox:', error);
    }
    
    try {
      // Delete database session
      await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error deleting session:', error);
    }
    
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithRoblox, logout, checkRobloxAuth, checkSession, isLoading }}>
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

