
import Image from 'next/image';

export function AppHeader() {
  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex flex-col items-center justify-center space-y-2">
        {/* Logo removed from here */}
        <div className="flex flex-col text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-primary font-headline">BRAZIL EXTINTORES</h1>
          <p className="text-md sm:text-lg text-muted-foreground font-headline">VISTORIA TÉCNICA</p>
        </div>
      </div>
    </header>
  );
}
