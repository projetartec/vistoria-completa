'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInAnonymously, onAuthStateChanged, updateProfile, signOut, type User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';


const ALLOWED_USERS = ['Alexandre', 'Hiago', 'Clodoaldo'];

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const auth = getAuth(app);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // User is considered valid only if they have an allowed display name.
      if (firebaseUser?.displayName && ALLOWED_USERS.map(u => u.toLowerCase()).includes(firebaseUser.displayName.toLowerCase())) {
        setUser(firebaseUser);
      } else {
        // Any other case (not logged in, anonymous without a display name, wrong display name),
        // we treat them as logged out. If they have a session, it will be cleaned up on next login attempt.
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username: string): Promise<boolean> => {
    const normalizedUsername = username.trim();
    const foundUser = ALLOWED_USERS.find(u => u.toLowerCase() === normalizedUsername.toLowerCase());

    if (!foundUser) {
      return false; // Let UI handle "invalid user" message
    }

    try {
      // Firebase automatically handles existing anonymous sessions.
      const userCredential = await signInAnonymously(auth);
      await updateProfile(userCredential.user, { displayName: foundUser });
      // The `onAuthStateChanged` listener will now handle setting the user state correctly.
      return true;
    } catch (error) {
      console.error("Firebase login error:", error);
      toast({
        title: 'Erro de Conexão',
        description: 'Não foi possível conectar ao serviço de autenticação. Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
      // Re-throw so the UI knows an error happened
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will set user to null
      router.push('/login');
    } catch (error) {
      console.error("Firebase logout error:", error);
       toast({
          title: 'Erro ao Sair',
          description: 'Não foi possível desconectar do serviço de autenticação.',
          variant: 'destructive',
        });
    }
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
