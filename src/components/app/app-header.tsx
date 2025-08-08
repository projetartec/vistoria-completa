
import React from 'react';
import Image from 'next/image';

export function AppHeader() {
  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex flex-col items-center justify-center gap-4 text-center">
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

        {/* Company Name Section */}
        <div>
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-primary font-headline">
            BRAZIL EXTINTORES - SP
          </h1>
        </div>
      </div>
    </header>
  );
}
