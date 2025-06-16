
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { 
  Settings2, 
  Save,
  Eye, 
  EyeOff,
  Building, 
  FileDown, // Still used as a generic download/export icon if needed elsewhere
  Printer, 
  Download, 
  Upload, 
  PlusSquare, 
  FileSpreadsheet, 
  AlertTriangle, 
  ImageIcon, 
  FileText,
  X // For the close icon on the main FAB
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonsPanelProps {
  onSave?: () => void;
  onNewInspection?: () => void;
  onAddNewTower?: () => void;
  onToggleSavedInspections?: () => void;
  isSavedInspectionsVisible?: boolean;
  onPrint?: () => void;
  onExportJson?: () => void;
  onTriggerImportJson?: () => void;
  onGenerateRegisteredItemsReport?: () => void;
  onGenerateNCItemsReport?: () => void;
  onGeneratePdf?: () => void;
  onGeneratePhotoReportPdf?: () => void;
}

export function ActionButtonsPanel({
  onSave,
  onNewInspection,
  onAddNewTower,
  onToggleSavedInspections,
  isSavedInspectionsVisible,
  onPrint,
  onExportJson,
  onTriggerImportJson,
  onGenerateRegisteredItemsReport,
  onGenerateNCItemsReport,
  onGeneratePdf,
  onGeneratePhotoReportPdf,
}: ActionButtonsPanelProps) {
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const handleFabAction = (action: (() => void) | undefined) => {
    if (action) {
      action();
    }
    setIsFabMenuOpen(false);
  };

  const handleReportAction = (reportAction: (() => void) | undefined) => {
    if (reportAction) {
      reportAction();
    }
    setIsFabMenuOpen(false); // Close the main FAB menu when a report is generated
  };

  const fabBaseClasses = "h-12 w-12 rounded-full p-0 shadow-md flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const iconSize = "h-5 w-5"; // For icons inside report dropdown items

  // Base style for items inside the reports dropdown
  const reportItemStyle = "flex items-center gap-2 rounded-lg p-2.5 my-1 text-sm shadow-md border border-input bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer";
  const ncReportItemStyle = "flex items-center gap-2 rounded-lg p-2.5 my-1 text-sm shadow-md border border-orange-300 bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer";
  const accentReportItemStyle = "flex items-center gap-2 rounded-lg p-2.5 my-1 text-sm shadow-md border border-accent text-accent-foreground bg-accent/60 hover:bg-accent/80 cursor-pointer";
  const primaryReportItemStyle = "flex items-center gap-2 rounded-lg p-2.5 my-1 text-sm shadow-md border border-primary/50 bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer";


  return (
    <>
      {isFabMenuOpen && (
        <div 
          className="fixed right-6 bottom-[calc(3.5rem+1rem)] z-40 flex flex-col-reverse items-center space-y-3 space-y-reverse"
          onClick={(e) => e.stopPropagation()} 
        >
          {/* Reports Dropdown FAB Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                title="Gerar Relatórios PDF"
                className={cn(fabBaseClasses, "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300")}
              >
                <FileText className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent 
                align="center" // Align center of content with center of trigger
                side="left" 
                sideOffset={16} // Increased offset
                className="p-2 w-auto bg-background/95 backdrop-blur-sm shadow-xl rounded-xl border space-y-1 min-w-[260px]"
              >
                <DropdownMenuItem onClick={() => handleReportAction(onGenerateRegisteredItemsReport)} className={reportItemStyle}>
                  <FileSpreadsheet className={iconSize} />
                  <span>Itens Cadastrados</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReportAction(onGenerateNCItemsReport)} className={ncReportItemStyle}>
                  <AlertTriangle className={iconSize} />
                  <span>Itens N/C</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReportAction(onGeneratePhotoReportPdf)} className={accentReportItemStyle}>
                  <ImageIcon className={iconSize} />
                  <span>Somente Fotos</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReportAction(onGeneratePdf)} className={primaryReportItemStyle}>
                  <FileText className={iconSize} />
                  <span>Relatório Completo</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>

          {/* Importar JSON */}
          {onTriggerImportJson && (
            <Button
              title="Importar Vistoria de Arquivo JSON"
              onClick={() => handleFabAction(onTriggerImportJson)}
              className={cn(fabBaseClasses, "bg-indigo-500 hover:bg-indigo-600 text-white")}
            >
              <Upload className="h-5 w-5" />
            </Button>
          )}

          {/* Exportar JSON */}
          {onExportJson && (
            <Button
              title="Exportar Vistoria Atual para JSON"
              onClick={() => handleFabAction(onExportJson)}
              className={cn(fabBaseClasses, "bg-purple-500 hover:bg-purple-600 text-white")}
            >
              <Download className="h-5 w-5" />
            </Button>
          )}
          
          {/* Imprimir */}
          {onPrint && (
            <Button
              title="Imprimir Página (Navegador)"
              onClick={() => handleFabAction(onPrint)}
              className={cn(fabBaseClasses, "bg-slate-500 hover:bg-slate-600 text-white")}
            >
              <Printer className="h-5 w-5" />
            </Button>
          )}

          {/* Ver/Ocultar Salvas */}
          {onToggleSavedInspections && (
            <Button
              title={isSavedInspectionsVisible ? "Ocultar Vistorias Salvas" : "Ver Vistorias Salvas"}
              onClick={() => handleFabAction(onToggleSavedInspections)}
              className={cn(fabBaseClasses, "bg-sky-500 hover:bg-sky-600 text-white")}
            >
              {isSavedInspectionsVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
          )}

          {/* Nova Torre */}
          {onAddNewTower && (
            <Button
              title="Adicionar Nova Torre"
              onClick={() => handleFabAction(onAddNewTower)}
              className={cn(fabBaseClasses, "bg-green-500 hover:bg-green-600 text-white")}
            >
              <Building className="h-5 w-5" />
            </Button>
          )}
          
          {/* Nova Vistoria */}
          {onNewInspection && (
            <Button
              title="Nova Vistoria (Limpar Formulário)"
              onClick={() => handleFabAction(onNewInspection)}
              className={cn(fabBaseClasses, "bg-destructive hover:bg-destructive/90 text-destructive-foreground")}
            >
              <PlusSquare className="h-5 w-5" />
            </Button>
          )}

          {/* Salvar Vistoria */}
          {onSave && (
            <Button
              title="Salvar Vistoria"
              onClick={() => handleFabAction(onSave)}
              className={cn(fabBaseClasses, "bg-primary hover:bg-primary/90 text-primary-foreground")}
            >
              <Save className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}

      <Button
        variant="default"
        size="icon"
        className="fixed right-6 bottom-6 z-50 rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        title="Ações da Vistoria"
        onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
        aria-expanded={isFabMenuOpen}
        aria-controls="fab-menu-actions" // Assuming the above div would get this id if needed
      >
        {isFabMenuOpen ? <X className="h-6 w-6" /> : <Settings2 className="h-6 w-6" />}
      </Button>
    </>
  );
}
