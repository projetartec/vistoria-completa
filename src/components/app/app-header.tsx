
import Image from 'next/image';

export function AppHeader() {
  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex items-center justify-start space-x-4">
        <div className="flex-shrink-0">
          <Image
            src="https://placehold.co/180x60.png"
            alt="Brazil Extintores Logo"
            width={180}
            height={60}
            data-ai-hint="company logo"
            className="rounded"
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-bold text-primary font-headline">BRAZIL EXTINTORES</h1>
          <p className="text-md sm:text-lg text-muted-foreground font-headline">VISTORIA TÉCNICA</p>
        </div>
      </div>
    </header>
  );
}
