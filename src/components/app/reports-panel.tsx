
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface ReportsPanelProps {
  onGenerateRegisteredItemsReport: () => void;
  onGenerateNCItemsReport: () => void; // Nova prop
}

export function ReportsPanel({ onGenerateRegisteredItemsReport, onGenerateNCItemsReport }: ReportsPanelProps) {
  const [isContentVisible, setIsContentVisible] = useState(true);

  return (
    <div className="my-8 p-4 bg-card shadow-lg rounded-lg">
      <div
        onClick={() => setIsContentVisible(!isContentVisible)}
        className="flex justify-between items-center cursor-pointer select-none group mb-4"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsContentVisible(!isContentVisible); }}
        aria-expanded={isContentVisible}
        aria-controls="reports-content-panel"
      >
        <h2 className="text-xl font-semibold font-headline text-primary group-hover:text-primary/80 transition-colors">
          Relatórios
        </h2>
        {isContentVisible ? (
          <ChevronUp className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" />
        ) : (
          <ChevronDown className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" />
        )}
      </div>

      {isContentVisible && (
        <div id="reports-content-panel" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
           <Button
            onClick={onGenerateRegisteredItemsReport}
            title="Gerar Relatório de Itens Cadastrados"
            size="sm"
            variant="outline"
            className="col-span-1"
          >
            <FileSpreadsheet className="mr-1 h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Itens Cadastrados</span>
            <span className="sm:hidden">Itens Cad.</span>
          </Button>
          <Button
            onClick={onGenerateNCItemsReport} // Novo callback
            title="Gerar Relatório de Itens Não Conformes (N/C)"
            size="sm"
            variant="outline"
            className="col-span-1 border-orange-500 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700"
          >
            <AlertTriangle className="mr-1 h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Itens N/C</span>
            <span className="sm:hidden">N/C</span>
          </Button>
          {/* Outros botões de relatório podem ser adicionados aqui no futuro */}
        </div>
      )}
    </div>
  );
}
