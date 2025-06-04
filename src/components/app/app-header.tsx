
import Image from 'next/image';

export function AppHeader() {
  return (
    <header className="bg-card p-4 shadow-md rounded-lg mb-6">
      <div className="container mx-auto flex flex-col items-center justify-center">
        {/* This div will group the logo and text, and then this group will be centered */}
        <div className="flex items-center space-x-4">
          <Image
            src="/brazil-extintores-logo.png" // This path expects the image to be at public/brazil-extintores-logo.png
            alt="Brazil Extintores Logo"
            width={180} 
            height={60}  
            priority    
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
