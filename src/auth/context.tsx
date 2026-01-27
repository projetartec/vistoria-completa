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
      if (firebaseUser) {
        // Check if display name is one of the allowed users
        if (firebaseUser.displayName && ALLOWED_USERS.map(u => u.toLowerCase()).includes(firebaseUser.displayName.toLowerCase())) {
          setUser(firebaseUser);
        } else if (!firebaseUser.displayName) {
          // This can happen on the first anonymous sign-in before updateProfile completes.
          // We don't log them out immediately, the login function will handle the user object.
        }
        else {
          // This case can happen if an anonymous user exists but without a valid displayName
          // or if the list of allowed users changes. We log them out.
          signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username: string): Promise<boolean> => {
    const normalizedUsername = username.trim();
    const foundUser = ALLOWED_USERS.find(u => u.toLowerCase() === normalizedUsername.toLowerCase());

    if (foundUser) {
      try {
        setLoading(true);
        const userCredential = await signInAnonymously(auth);
        await updateProfile(userCredential.user, { displayName: foundUser });
        
        // The onAuthStateChanged listener will eventually pick this up,
        // but we can set the user manually to speed up UI changes and routing.
        await userCredential.user.reload();
        const updatedUser = auth.currentUser;
        setUser(updatedUser); 

        router.push('/');
        return true;
      } catch (error) {
        console.error("Firebase login error:", error);
        toast({
          title: 'Erro de Login no Firebase',
          description: 'Não foi possível conectar ao serviço de autenticação.',
          variant: 'destructive',
        });
        setLoading(false);
        return false;
      }
    }
    return false;
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
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
