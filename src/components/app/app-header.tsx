
export function AppHeader() {
  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Logo removido conforme solicitado */}
          <div className="ml-0"> {/* Ajustado ml-0 pois não há mais logo à esquerda */}
            <h1 className="text-xl sm:text-2xl font-bold text-primary font-headline">BRAZIL EXTINTORES</h1>
            <p className="text-md sm:text-lg text-muted-foreground font-headline">VISTORIA TÉCNICA</p>
          </div>
        </div>
      </div>
    </header>
  );
}
