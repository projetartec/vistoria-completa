
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
import { Save, PlusSquare, Printer, Download, Upload, ChevronDown, ChevronUp, FileDown, FileSpreadsheet, AlertTriangle, FileText, Image as ImageIcon, Building, Database, Eye, EyeOff } from 'lucide-react';

interface ActionButtonsPanelProps {
  onSave: () => void; // Will now save to IndexedDB
  onNewInspection: () => void;
  onAddNewTower: () => void;
  onToggleSavedInspections: () => void; // Re-added
  isSavedInspectionsVisible: boolean; // Re-added
  onPrint: () => void;
  onExportJson: () => void; 
  onTriggerImportJson: () => void; 
  // onLoadFromFileSystem removed as primary load mechanism replaced by IndexedDB list
  onGenerateRegisteredItemsReport: () => void;
  onGenerateNCItemsReport: () => void;
  onGeneratePdf: () => void;
  onGeneratePhotoReportPdf: () => void;
}

export function ActionButtonsPanel({
  onSave,
  onNewInspection,
  onAddNewTower,
  onToggleSavedInspections, // Re-added
  isSavedInspectionsVisible, // Re-added
  onPrint,
  onExportJson,
  onTriggerImportJson,
  onGenerateRegisteredItemsReport,
  onGenerateNCItemsReport,
  onGeneratePdf,
  onGeneratePhotoReportPdf,
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
        <div id="actions-content-panel" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
          <Button onClick={onSave} title="Salvar Vistoria no Navegador (IndexedDB)" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
            <Database className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Salvar Vistoria</span>
          </Button>
          <Button
            onClick={onToggleSavedInspections}
            variant="outline"
            title={isSavedInspectionsVisible ? "Ocultar Vistorias Salvas" : "Ver Vistorias Salvas (Navegador)"}
            size="sm"
          >
            {isSavedInspectionsVisible ? <EyeOff className="mr-1 h-4 w-4 sm:mr-2" /> : <Eye className="mr-1 h-4 w-4 sm:mr-2" />}
             <span className="hidden sm:inline">{isSavedInspectionsVisible ? "Ocultar Salvas" : "Ver Salvas"}</span>
          </Button>
           <Button
            onClick={onAddNewTower} 
            className="bg-indigo-500 hover:bg-indigo-600 text-white" // Changed color for variety
            title="Nova Torre" 
            size="sm"
          >
            <Building className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Nova Torre</span> 
          </Button>
           <Button
            onClick={onPrint}
            variant="secondary"
            title="Imprimir Vistoria (via navegador)"
            size="sm"
          >
            <Printer className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Imprimir</span>
          </Button>
           <Button
            onClick={onExportJson}
            className="bg-teal-500 hover:bg-teal-600 text-white"
            title="Exportar Vistoria Atual para JSON (download)"
            size="sm"
          >
            <Download className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Exportar JSON</span>
          </Button>
          <Button
            onClick={onTriggerImportJson}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            title="Importar Vistoria de JSON (via seletor de arquivo)"
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
              <Button variant="outline" size="sm" title="Baixar Relatório PDF (via navegador)" className="border-primary text-primary hover:bg-primary/10">
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
    
