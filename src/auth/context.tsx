
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const ALLOWED_USERS = ['Alexandre', 'Hiago', 'Clodoaldo'];

interface User {
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let storedUser: User | null = null;
    try {
      const storedUserJson = localStorage.getItem('firecheck_user');
      if (storedUserJson) {
        // This try-catch block specifically handles JSON parsing errors.
        try {
            storedUser = JSON.parse(storedUserJson) as User;
        } catch (e) {
            console.error("Failed to parse user from localStorage:", e);
            localStorage.removeItem('firecheck_user'); // Clear corrupted data
        }
      }

      if (storedUser && typeof storedUser.name === 'string' && ALLOWED_USERS.map(u => u.toLowerCase()).includes(storedUser.name.toLowerCase())) {
        setUser(storedUser);
      } else {
        // Clear invalid or missing user from storage
        if (storedUser) { // only remove if it was invalid, not if it was absent
          localStorage.removeItem('firecheck_user');
        }
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
      const userObject: User = { name: foundUser };
      setUser(userObject);
      try {
        localStorage.setItem('firecheck_user', JSON.stringify(userObject));
      } catch (error) {
        console.error("Could not save user to localStorage:", error);
      }
      router.push('/');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('firecheck_user');
    } catch (error) {
        console.error("Could not remove user from localStorage:", error);
    }
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
