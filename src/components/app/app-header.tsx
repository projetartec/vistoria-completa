
import Image from 'next/image';
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';

interface AppHeaderProps {
  uploadedLogoDataUrl: string | null;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AppHeader({ uploadedLogoDataUrl, onLogoUpload }: AppHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between gap-x-6 gap-y-4">
        {/* Logo Upload and Display Section */}
        <div className="flex flex-col items-center gap-2 order-1 md:order-none">
          {uploadedLogoDataUrl ? (
            <Image
              src={uploadedLogoDataUrl}
              alt="Logo Carregado"
              width={150} 
              height={75} 
              className="max-h-20 w-auto object-contain border rounded-md p-1"
              data-ai-hint="company logo"
            />
          ) : (
            <div 
              className="h-20 w-36 border border-dashed rounded-md flex items-center justify-center text-muted-foreground text-sm"
              data-ai-hint="logo placeholder"
            >
              Nenhum logo
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Carregar Logo
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png, image/jpeg, image/svg+xml, image/webp"
            onChange={onLogoUpload}
            className="hidden"
          />
        </div>

        {/* Company Details Section */}
        <div className="text-center md:text-left order-2 md:order-none">
          <h1 className="text-xl sm:text-2xl font-bold text-primary font-headline mb-2">
            BRAZIL EXTINTORES - SP
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Telefone: (19) 3884-6127 - (19) 9 8183-1813
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            OSORIO MACHADO DE PAIVA, 915
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            PARQUE BOM RETIRO - Cep: 13142-128 - PAULINIA - SP
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            CNPJ: 24.218.850/0001-29 | I.E.: 513096549110
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Registro Inmetro N°: 001459/2018
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            e-mail: comercial@brazilexintores.com.br
          </p>
        </div>
      </div>
    </header>
  );
}

    