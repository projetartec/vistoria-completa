
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex flex-row items-center justify-between gap-x-4 md:gap-x-6">
        {/* Logo Upload and Display Section */}
        <div className="order-1">
          {uploadedLogoDataUrl ? (
            <div
              onClick={triggerFileInput}
              className="cursor-pointer border rounded-md p-1 hover:border-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileInput(); }}
              aria-label="Alterar logo"
              title="Clique para alterar o logo"
            >
              <Image
                src={uploadedLogoDataUrl}
                alt="Logo Carregado"
                width={224}
                height={112}
                className="max-h-28 w-auto object-contain"
                data-ai-hint="company logo"
              />
            </div>
          ) : (
            <div
              onClick={triggerFileInput}
              className="h-28 w-56 border border-dashed rounded-md flex items-center justify-center text-muted-foreground text-sm cursor-pointer hover:border-primary hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              data-ai-hint="logo placeholder"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileInput(); }}
              aria-label="Carregar logo"
              title="Clique para carregar o logo"
            >
              Carregar Logo
            </div>
          )}
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
