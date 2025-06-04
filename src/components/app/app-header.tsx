import Image from 'next/image';

export function AppHeader() {
  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Image
            src="https://placehold.co/120x60.png"
            alt="Brazil Extintores Logo"
            width={120}
            height={60}
            data-ai-hint="company logo"
            className="rounded"
          />
          <div>
            <h1 className="text-2xl font-bold text-primary font-headline">BRAZIL EXTINTORES</h1>
            <p className="text-lg text-muted-foreground font-headline">VISTORIA TÉCNICA</p>
          </div>
        </div>
      </div>
    </header>
  );
}
