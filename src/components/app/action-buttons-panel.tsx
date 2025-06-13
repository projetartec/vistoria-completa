
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Save, PlusSquare, ListChecks, CopyPlus, Printer, Download, Upload, ChevronDown, ChevronUp, FileDown, FileSpreadsheet, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';

interface ActionButtonsPanelProps {
  onSave: () => void;
  onNewInspection: () => void;
  onNewFloor: () => void;
  onToggleSavedInspections: () => void;
  isSavedInspectionsVisible: boolean;
  onPrint: () => void;
  onExportJson: () => void;
  onTriggerImportJson: () => void;
  onGenerateRegisteredItemsReport: () => void;
  onGenerateNCItemsReport: () => void;
  onGeneratePdf: () => void;
  onGeneratePhotoReportPdf: () => void; // New prop
}

export function ActionButtonsPanel({
  onSave,
  onNewInspection,
  onNewFloor,
  onToggleSavedInspections,
  isSavedInspectionsVisible,
  onPrint,
  onExportJson,
  onTriggerImportJson,
  onGenerateRegisteredItemsReport,
  onGenerateNCItemsReport,
  onGeneratePdf,
  onGeneratePhotoReportPdf, // New prop
}: ActionButtonsPanelProps) {
  const [isActionsContentVisible, setIsActionsContentVisible] = useState(false);

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
        <div id="actions-content-panel" className="grid grid-cols-4 gap-2 sm:gap-4">
          <Button onClick={onSave} title="Salvar Vistoria" size="sm">
            <Save className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Salvar</span>
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
            onClick={onPrint}
            variant="secondary"
            title="Imprimir Vistoria"
            size="sm"
          >
            <Printer className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Imprimir</span>
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
            title="Nova Vistoria (Limpar Formulário Atual)"
            size="sm"
          >
            <PlusSquare className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Nova Vistoria</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" title="Baixar Relatório" className="border-primary text-primary hover:bg-primary/10">
                <FileDown className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Baixar Relatório</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Tipos de Relatório PDF</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onGenerateRegisteredItemsReport}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                <span>Itens Cadastrados</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onGenerateNCItemsReport} className="text-orange-600 focus:text-orange-700 focus:bg-orange-500/10">
                <AlertTriangle className="mr-2 h-4 w-4" />
                <span>Itens N/C</span>
              </DropdownMenuItem>
               <DropdownMenuItem onClick={onGeneratePhotoReportPdf}>
                <ImageIcon className="mr-2 h-4 w-4" />
                <span>Somente Fotos</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onGeneratePdf}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Relatório Completo</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      )}
    </div>
  );
}
