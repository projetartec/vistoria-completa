
import Image from 'next/image';

export function AppHeader() {
  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex items-center justify-between">
        {/* Text content on the left */}
        <div className="flex items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary font-headline">BRAZIL EXTINTORES</h1>
            <p className="text-md sm:text-lg text-muted-foreground font-headline">VISTORIA TÉCNICA</p>
          </div>
        </div>

        {/* Logo on the right */}
        <div className="ml-4 flex-shrink-0">
          <Image
            src="/brazil-extintores-logo.png" // Next.js automatically serves from 'public' folder
            alt="Brazil Extintores Logo"
            width={160} // Adjust width as needed
            height={55} // Adjust height to maintain aspect ratio or desired size
            priority // Prioritizes loading of the logo
            className="object-contain" // Ensures the image scales nicely within the bounds
            onError={(e) => console.error('Erro ao carregar o logo:', e.target.id, e.target.src)}
          />
        </div>
      </div>
    </header>
  );
}
