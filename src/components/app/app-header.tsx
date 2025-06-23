
import React from 'react';

// No props are needed anymore as the logo is no longer customizable.
interface AppHeaderProps {}

export function AppHeader({}: AppHeaderProps) {
  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      {/* Centering the company details since the logo upload is removed */}
      <div className="container mx-auto flex flex-row items-center justify-center gap-x-4 md:gap-x-6">
        {/* Company Details Section */}
        <div className="text-center">
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
