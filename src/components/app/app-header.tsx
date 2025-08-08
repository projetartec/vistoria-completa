
import React from 'react';
import Image from 'next/image';

export function AppHeader() {
  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/LOGO-BRAZIL-FUNDOTRANSP.png"
            alt="Brazil Extintores Logo"
            width={150}
            height={150}
            className="object-contain h-24 w-auto"
            priority
          />
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

    

    