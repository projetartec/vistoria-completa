
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const ALLOWED_USERS = ['Alexandre', 'Hiago', 'Clodoaldo'];

interface AuthContextType {
  user: string | null;
  loading: boolean;
  login: (username: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('firecheck_user');
      if (storedUser && ALLOWED_USERS.map(u => u.toLowerCase()).includes(storedUser.toLowerCase())) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (username: string): boolean => {
    const normalizedUsername = username.trim();
    const foundUser = ALLOWED_USERS.find(u => u.toLowerCase() === normalizedUsername.toLowerCase());

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('firecheck_user', foundUser);
      router.push('/');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('firecheck_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
