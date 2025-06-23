
import React, { useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Upload, Trash2 } from 'lucide-react';
import type { ClientInfo } from '@/lib/types';

interface AppHeaderProps {
  clientInfoData: ClientInfo;
  onClientInfoChange: (field: keyof ClientInfo, value: string | null) => void;
}

export function AppHeader({ clientInfoData, onClientInfoChange }: AppHeaderProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onClientInfoChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerLogoUpload = () => {
    logoInputRef.current?.click();
  };

  const removeLogo = () => {
    onClientInfoChange('logoUrl', null);
  };
  
  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo and Upload Section */}
        <div className="flex flex-col items-center gap-2">
          <input
            type="file"
            ref={logoInputRef}
            onChange={handleLogoUpload}
            accept="image/*"
            className="hidden"
          />
           {clientInfoData.logoUrl ? (
            <div className="relative group">
              <Image
                src={clientInfoData.logoUrl}
                alt="Company Logo"
                width={150}
                height={150}
                className="object-contain h-24 w-auto rounded-md border p-1 cursor-pointer"
                onClick={triggerLogoUpload}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLogo();
                }}
                title="Remover Logo"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="h-24 w-40 flex items-center justify-center border-2 border-dashed rounded-md bg-muted/50 hover:bg-muted/75 transition-colors cursor-pointer"
              onClick={triggerLogoUpload}
            >
              <div className="text-center text-muted-foreground">
                <Upload className="mx-auto h-6 w-6 mb-1"/>
                <span className="text-sm">Carregar Logo</span>
              </div>
            </div>
          )}
        </div>

        {/* Company Details Section */}
        <div className="text-center md:text-left">
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-primary font-headline mb-2">
            BRAZIL EXTINTORES - SP
          </h1>
          <p className="text-xs text-muted-foreground">
            Telefone: (19) 3884-6127 - (19) 9 8183-1813
          </p>
          <p className="text-xs text-muted-foreground">
            OSORIO MACHADO DE PAIVA, 915
          </p>
          <p className="text-xs text-muted-foreground">
            PARQUE BOM RETIRO - Cep: 13142-128 - PAULINIA - SP
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            CNPJ: 24.218.850/0001-29 | I.E.: 513096549110
          </p>
          <p className="text-xs text-muted-foreground">
            Registro Inmetro N°: 001459/2018
          </p>
          <p className="text-xs text-muted-foreground">
            e-mail: comercial@brazilexintores.com.br
          </p>
        </div>
      </div>
    </header>
  );
}
