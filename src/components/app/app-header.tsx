
import Image from 'next/image';

export function AppHeader() {
  const logoPath = "/brazil-extintores-logo.png"; // Caminho relativo à pasta 'public'

  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Tentativa de carregar com Next/Image */}
          <div className="w-[150px] h-[78px] relative"> {/* Container com dimensões para ajudar no layout */}
            <Image
              src={logoPath}
              alt="Brazil Extintores Logo (Next/Image)"
              fill
              style={{ objectFit: 'contain' }} // ou 'cover', 'fill', etc. conforme necessário
              className="rounded"
              priority // Ajuda a priorizar o carregamento do LCP
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                console.error('Erro ao carregar logo com Next/Image:', logoPath, e.currentTarget.src);
              }}
            />
          </div>
          
          <div className="ml-4">
            <h1 className="text-xl sm:text-2xl font-bold text-primary font-headline">BRAZIL EXTINTORES</h1>
            <p className="text-md sm:text-lg text-muted-foreground font-headline">VISTORIA TÉCNICA</p>
          </div>
        </div>
        
        {/* Diagnóstico adicional com tag <img> HTML padrão */}
        <div className="ml-auto diagnostics" style={{ display: 'none' /* Oculte se não quiser que apareça sempre */ }}>
           <p className="mt-2 text-xs text-muted-foreground">Diagnóstico:</p>
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img 
             src={logoPath} 
             alt="Logo (HTML img tag check)" 
             width="75" // Menor para diagnóstico
             className="rounded border"
           />
           <p className="mt-1 text-xs text-muted-foreground">
             Caminho esperado: <code>public{logoPath}</code>
           </p>
        </div>
      </div>
    </header>
  );
}
