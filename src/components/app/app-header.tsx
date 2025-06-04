
import Image from 'next/image';

export function AppHeader() {
  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex flex-col items-center justify-center">
        <div className="flex items-center space-x-4">
          <Image 
            src="/brazil-extintores-logo.png" 
            alt="Brazil Extintores Logo" 
            width={180} // Ajuste a largura conforme necessário
            height={60} // Ajuste a altura conforme necessário
            priority // Carregar a imagem com prioridade, pois está no LCP
          />
          <div className="flex flex-col text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-primary font-headline">BRAZIL EXTINTORES</h1>
            <p className="text-md sm:text-lg text-muted-foreground font-headline">VISTORIA TÉCNICA</p>
          </div>
        </div>
      </div>
    </header>
  );
}
