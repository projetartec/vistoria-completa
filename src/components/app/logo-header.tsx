
import Image from 'next/image';
import type React from 'react';

export function LogoHeader() {
  return (
    <header className="py-4 flex justify-center items-center bg-card shadow-sm mb-6">
      <Image
        src="/brazil-extintores-logo.png"
        alt="Brazil Extintores Logo"
        width={180} // Adjust width as needed
        height={60} // Adjust height as needed
        priority
      />
    </header>
  );
}
