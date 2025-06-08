
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
          <Button onClick={onSave} title="Salvar Vistoria" size="sm">
            <Save className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Salvar Vistoria</span>
          </Button>
          <Button
            onClick={onNewFloor}
            className="bg-green-500 hover:bg-green-600 text-white"
            title="Novo Andar"
            size="sm"
          >
            <CopyPlus className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Novo Andar</span>
          </Button>
          <Button
            onClick={onGeneratePdf}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            title="Gerar Relatório PDF"
            size="sm"
          >
            <FileText className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Relatório PDF</span>
          </Button>
          <Button
            onClick={onPrint}
            variant="secondary"
            title="Imprimir Vistoria"
            size="sm"
          >
            <Printer className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Imprimir Vistoria</span>
          </Button>
          <Button
            onClick={onToggleSavedInspections}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
            title={isSavedInspectionsVisible ? 'Ocultar Vistorias Salvas' : 'Ver Vistorias Salvas'}
            size="sm"
          >
            <ListChecks className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">{isSavedInspectionsVisible ? 'Ocultar Salvas' : 'Ver Salvas'}</span>
          </Button>
           <Button
            onClick={onExportJson}
            className="bg-teal-500 hover:bg-teal-600 text-white"
            title="Exportar Vistoria para JSON"
            size="sm"
          >
            <Download className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Exportar JSON</span>
          </Button>
          <Button
            onClick={onTriggerImportJson}
            className="bg-teal-500 hover:bg-teal-600 text-white"
            title="Importar Vistoria de JSON"
            size="sm"
          >
            <Upload className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Importar JSON</span>
          </Button>
          <Button
            onClick={onNewInspection}
            variant="destructive"
            className="md:col-start-4 lg:col-start-auto"
            title="Nova Vistoria (Limpar Formulário Atual)"
            size="sm"
          >
            <PlusSquare className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Nova Vistoria (Limpar Tudo)</span>
          </Button>
        </div>
      )}
    </div>
  );
}
