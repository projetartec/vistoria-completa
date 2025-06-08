
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
      <div className="container mx-auto flex flex-row items-center justify-between gap-x-4 md:gap-x-6">
        {/* Logo Upload and Display Section */}
        <div className="flex items-center gap-3 order-1">
          {uploadedLogoDataUrl ? (
            <Image
              src={uploadedLogoDataUrl}
              alt="Logo Carregado"
              width={224} 
              height={112} 
              className="max-h-28 w-auto object-contain border rounded-md p-1" 
              data-ai-hint="company logo"
            />
          ) : (
            <div
              className="h-28 w-56 border border-dashed rounded-md flex items-center justify-center text-muted-foreground text-sm" 
              data-ai-hint="logo placeholder"
            >
              Nenhum logo
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8" 
            title="Carregar Logo"
          >
            <UploadCloud className="h-4 w-4" />
            <span className="sr-only">Carregar Logo</span>
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
        <div className="text-left order-2">
          <h1 className="text-lg sm:text-xl font-bold text-primary font-headline mb-2">
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
