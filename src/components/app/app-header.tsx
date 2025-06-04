
import Image from 'next/image';

export function AppHeader() {
  const logoPath = "/brazil-extintores-logo.png";
  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <p className="text-xs text-muted-foreground">Tentando carregar Next/Image:</p>
            <Image
              src={logoPath}
              alt="Brazil Extintores Logo (Next/Image)"
              width={150}
              height={78}
              className="rounded"
              priority
              onError={(e) => console.error('Next/Image Error:', e.target.id, e.target.src, e.target.srcset)}
            />
            <p className="mt-2 text-xs text-muted-foreground">Tentando carregar HTML img tag:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={logoPath} 
              alt="Brazil Extintores Logo (HTML img)" 
              width="150" 
              className="rounded"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Caminho esperado do logo: <code>public{logoPath}</code>
            </p>
          </div>
          <div className="ml-4">
            <h1 className="text-xl sm:text-2xl font-bold text-primary font-headline">BRAZIL EXTINTORES</h1>
            <p className="text-md sm:text-lg text-muted-foreground font-headline">VISTORIA TÉCNICA</p>
          </div>
        </div>
      </div>
    </header>
  );
}
