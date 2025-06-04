
import Image from 'next/image';

export function AppHeader() {
  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex items-center justify-start"> {/* Changed justify-between to justify-start */}
        {/* Text content on the left */}
        <div className="flex items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary font-headline">BRAZIL EXTINTORES</h1>
            <p className="text-md sm:text-lg text-muted-foreground font-headline">VISTORIA TÉCNICA</p>
          </div>
        </div>

        {/* Logo was here, now removed */}
      </div>
    </header>
  );
}
