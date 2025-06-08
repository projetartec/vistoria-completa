
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, FolderOpen, PlusSquare, ListChecks, CopyPlus, FileText, Printer, Download, Upload, ChevronDown, ChevronUp } from 'lucide-react';

interface ActionButtonsPanelProps {
  onSave: () => void;
  onNewInspection: () => void;
  onNewFloor: () => void;
  onToggleSavedInspections: () => void;
  isSavedInspectionsVisible: boolean;
  onGeneratePdf: () => void;
  onPrint: () => void;
  onExportJson: () => void;
  onTriggerImportJson: () => void;
}

export function ActionButtonsPanel({
  onSave,
  onNewInspection,
  onNewFloor,
  onToggleSavedInspections,
  isSavedInspectionsVisible,
  onGeneratePdf,
  onPrint,
  onExportJson,
  onTriggerImportJson,
}: ActionButtonsPanelProps) {
  const [isActionsContentVisible, setIsActionsContentVisible] = useState(true);

  return (
    <div className="my-8 p-4 bg-card shadow-lg rounded-lg">
      <div
        onClick={() => setIsActionsContentVisible(!isActionsContentVisible)}
        className="flex justify-between items-center cursor-pointer select-none group mb-4"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsActionsContentVisible(!isActionsContentVisible); }}
        aria-expanded={isActionsContentVisible}
        aria-controls="actions-content-panel"
      >
        <h2 className="text-xl font-semibold font-headline text-primary group-hover:text-primary/80 transition-colors">
          Ações
        </h2>
        {isActionsContentVisible ? (
          <ChevronUp className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" />
        ) : (
          <ChevronDown className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" />
        )}
      </div>

      {isActionsContentVisible && (
        <div id="actions-content-panel" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Button onClick={onSave} >
            <Save className="mr-2 h-4 w-4" /> Salvar Vistoria
          </Button>
          <Button
            onClick={onNewFloor}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <CopyPlus className="mr-2 h-4 w-4" /> Novo Andar
          </Button>
          <Button
            onClick={onGeneratePdf}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <FileText className="mr-2 h-4 w-4" /> Relatório PDF
          </Button>
          <Button
            onClick={onPrint}
            variant="secondary"
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimir Vistoria
          </Button>
          <Button
            onClick={onToggleSavedInspections}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <ListChecks className="mr-2 h-4 w-4" /> {isSavedInspectionsVisible ? 'Ocultar Salvas' : 'Ver Salvas'}
          </Button>
           <Button
            onClick={onExportJson}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            <Download className="mr-2 h-4 w-4" /> Exportar JSON
          </Button>
          <Button
            onClick={onTriggerImportJson}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            <Upload className="mr-2 h-4 w-4" /> Importar JSON
          </Button>
          <Button
            onClick={onNewInspection}
            variant="destructive"
            className="md:col-start-4 lg:col-start-auto"
          >
            <PlusSquare className="mr-2 h-4 w-4" /> Nova Vistoria (Limpar Tudo)
          </Button>
        </div>
      )}
    </div>
  );
}
