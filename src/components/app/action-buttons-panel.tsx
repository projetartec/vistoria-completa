
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { 
  Settings2, 
  Save,
  Eye, 
  EyeOff,
  Building, 
  FileText, 
  Printer, 
  Download, 
  Upload, 
  PlusSquare, 
  FileSpreadsheet, 
  AlertTriangle, 
  ImageIcon, 
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ActionButtonsPanelProps {
  onSave?: () => void;
  isSaveDisabled?: boolean;
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
  isSaveDisabled,
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
  const isMobile = useIsMobile();

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
    // setIsFabMenuOpen(false); // Keep main FAB menu open when a report is generated from sub-menu
  };
  
  const fabBaseClasses = "h-12 w-12 rounded-full p-0 shadow-lg flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  const iconSize = "h-5 w-5";

  const reportItemStyle = "flex items-center gap-2 rounded-lg p-2.5 my-1 text-sm shadow-md border border-input bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer";
  const ncReportItemStyle = "flex items-center gap-2 rounded-lg p-2.5 my-1 text-sm shadow-md border border-orange-300 bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer";
  const accentReportItemStyle = "flex items-center gap-2 rounded-lg p-2.5 my-1 text-sm shadow-md border border-accent text-accent-foreground bg-accent/60 hover:bg-accent/80 cursor-pointer";
  const primaryReportItemStyle = "flex items-center gap-2 rounded-lg p-2.5 my-1 text-sm shadow-md border border-primary/50 bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer";


  return (
    <>
      {isFabMenuOpen && (
        <div 
          className={cn(
            "fixed right-6 z-40 flex flex-col-reverse items-center space-y-3 space-y-reverse",
            isMobile 
              ? "bottom-[calc(theme(spacing.6)_+_theme(spacing.14)_+0.75rem_+_theme(spacing.14)_+1rem)]" // Base (92px) + Main FAB height (56px) + gap (16px) = 164px
              : "bottom-[calc(theme(spacing.6)_+_theme(spacing.14)_+1rem)]" // Base (24px) + Main FAB height (56px) + gap (16px) = 96px
          )}
          onClick={(e) => e.stopPropagation()} 
        >
          {/* Reports Dropdown FAB Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                title="Gerar Relatórios PDF"
                className={cn(fabBaseClasses, "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300")}
              >
                <FileText className={iconSize} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent 
                align="center"
                side="left" 
                sideOffset={16}
                className="p-2 w-auto bg-background/95 backdrop-blur-sm shadow-xl rounded-xl border space-y-1 min-w-[260px]"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground px-2 pt-1 pb-0.5">RELATÓRIOS PDF</DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
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

          {onTriggerImportJson && (
            <Button
              title="Importar Vistoria de Arquivo JSON"
              onClick={() => handleFabAction(onTriggerImportJson)}
              className={cn(fabBaseClasses, "bg-indigo-500 hover:bg-indigo-600 text-white")}
            >
              <Upload className={iconSize} />
            </Button>
          )}

          {onExportJson && (
            <Button
              title="Exportar Vistoria Atual para JSON"
              onClick={() => handleFabAction(onExportJson)}
              className={cn(fabBaseClasses, "bg-purple-500 hover:bg-purple-600 text-white")}
            >
              <Download className={iconSize} />
            </Button>
          )}
          
          {onPrint && (
            <Button
              title="Imprimir Página (Navegador)"
              onClick={() => handleFabAction(onPrint)}
              className={cn(fabBaseClasses, "bg-teal-500 hover:bg-teal-600 text-white")}
            >
              <Printer className={iconSize} />
            </Button>
          )}

          {onToggleSavedInspections && (
            <Button
              title={isSavedInspectionsVisible ? "Ocultar Vistorias Salvas" : "Ver Vistorias Salvas"}
              onClick={() => handleFabAction(onToggleSavedInspections)}
              className={cn(fabBaseClasses, "bg-sky-500 hover:bg-sky-600 text-white")}
            >
              {isSavedInspectionsVisible ? <EyeOff className={iconSize} /> : <Eye className={iconSize} />}
            </Button>
          )}
          
          {!isMobile && onAddNewTower && ( // Show Add New Tower in main FAB only on desktop
            <Button
              title="Adicionar Nova Torre"
              onClick={() => handleFabAction(onAddNewTower)}
              className={cn(fabBaseClasses, "bg-green-500 hover:bg-green-600 text-white")}
            >
              <Building className={iconSize} />
            </Button>
          )}
          
          {onNewInspection && (
            <Button
              title="Nova Vistoria (Limpar Formulário)"
              onClick={() => handleFabAction(onNewInspection)}
              className={cn(fabBaseClasses, "bg-yellow-500 hover:bg-yellow-600 text-white")}
            >
              <PlusSquare className={iconSize} />
            </Button>
          )}

          {onSave && (
            <Button
              title="Salvar Vistoria na Nuvem"
              onClick={() => handleFabAction(onSave)}
              className={cn(fabBaseClasses, "bg-primary hover:bg-primary/90 text-primary-foreground")}
              disabled={isSaveDisabled}
            >
              <Save className={iconSize} />
            </Button>
          )}
        </div>
      )}

      <Button
        variant="default"
        size="icon"
        className={cn(
          "fixed right-6 z-50 rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground",
          isMobile ? "bottom-[calc(theme(spacing.6)_+_theme(spacing.14)_+0.75rem)]" : "bottom-6" // 92px from bottom on mobile, 24px on desktop
        )}
        title="Ações da Vistoria"
        onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
        aria-expanded={isFabMenuOpen}
        aria-controls="fab-menu-actions"
      >
        {isFabMenuOpen ? <X className="h-6 w-6" /> : <Settings2 className="h-6 w-6" />}
      </Button>
    </>
  );
}
