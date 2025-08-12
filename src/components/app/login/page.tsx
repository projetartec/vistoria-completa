
'use client';

import { useState } from 'react';
import { useAuth } from '@/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = () => {
    if (login(username)) {
      toast({
        title: 'Login bem-sucedido',
        description: `Bem-vindo, ${username}!`,
      });
    } else {
      toast({
        title: 'Erro de Login',
        description: 'Nome de usuário inválido.',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Digite seu nome de usuário para acessar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              type="text"
              placeholder="Seu nome"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin}>
            Entrar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
