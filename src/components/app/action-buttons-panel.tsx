
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger, // Added missing import
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { 
  Settings2, 
  Save,
  Eye, 
  EyeOff,
  Building, 
  FileDown, 
  Printer, 
  Download, 
  Upload, 
  PlusSquare, 
  FileSpreadsheet, 
  AlertTriangle, 
  ImageIcon, 
  FileText 
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ActionButtonsPanelProps {
  onSave: () => void;
  onNewInspection: () => void;
  onAddNewTower: () => void;
  onToggleSavedInspections: () => void;
  isSavedInspectionsVisible: boolean;
  onPrint: () => void;
  onExportJson: () => void;
  onTriggerImportJson: () => void;
  onGenerateRegisteredItemsReport: () => void;
  onGenerateNCItemsReport: () => void;
  onGeneratePdf: () => void;
  onGeneratePhotoReportPdf: () => void;
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
  const isMobile = useIsMobile();

  const iconSize = "h-5 w-5"; 

  const listItemBaseStyle = "flex items-center gap-2 rounded-lg p-2.5 my-1 shadow-md border transition-all duration-150 ease-in-out hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background";

  const defaultListItemStyle = cn(listItemBaseStyle, "bg-card text-card-foreground border-input hover:bg-accent hover:text-accent-foreground");
  const primaryListItemStyle = cn(listItemBaseStyle, "bg-primary/20 text-primary border-primary/50 hover:bg-primary/30");
  const destructiveListItemStyle = cn(listItemBaseStyle, "bg-destructive text-destructive-foreground border-destructive/70 hover:bg-destructive/90");
  const ncReportListItemStyle = cn(listItemBaseStyle, "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200");
  const accentListItemStyle = cn(listItemBaseStyle, "bg-accent/60 text-accent-foreground border-accent/50 hover:bg-accent/80");


  return (
    <div className={cn(
        "fixed right-6 z-50",
        isMobile ? "bottom-[5.5rem]" : "bottom-6" 
      )}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            title="Ações da Vistoria"
          >
            <Settings2 className="h-6 w-6" />
            <span className="sr-only">Abrir Menu de Ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent 
            align="end" 
            sideOffset={10} 
            className="p-2 w-auto bg-background/95 backdrop-blur-sm shadow-xl rounded-xl border space-y-1"
          >
            <DropdownMenuItem onClick={onSave} className={defaultListItemStyle} title="Salvar Vistoria">
              <Save className={iconSize} />
              {!isMobile && <span>Salvar Vistoria</span>}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onToggleSavedInspections} className={defaultListItemStyle} title={isSavedInspectionsVisible ? "Ocultar Salvas" : "Ver Salvas"}>
              {isSavedInspectionsVisible ? <EyeOff className={iconSize} /> : <Eye className={iconSize} />}
              {!isMobile && <span>{isSavedInspectionsVisible ? "Ocultar Salvas" : "Ver Salvas"}</span>}
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={onAddNewTower} className={defaultListItemStyle} title="Nova Torre">
              <Building className={iconSize} />
              {!isMobile && <span>Nova Torre</span>}
            </DropdownMenuItem>
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className={cn(defaultListItemStyle, "justify-between")} title="Baixar Relatórios PDF">
                <div className="flex items-center gap-2">
                  <FileDown className={iconSize} />
                  {(isMobile) ? <span>PDFs</span> : <span>Baixar PDF</span>}
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="p-2 w-auto bg-background/95 backdrop-blur-sm shadow-lg rounded-lg border space-y-1">
                  <DropdownMenuItem onClick={onGenerateRegisteredItemsReport} className={defaultListItemStyle} title="Relatório de Itens Cadastrados">
                    <FileSpreadsheet className={iconSize} />
                    <span>Itens Cadastrados</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGenerateNCItemsReport} className={ncReportListItemStyle} title="Relatório de Itens N/C">
                    <AlertTriangle className={iconSize} />
                    <span>Itens N/C</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGeneratePhotoReportPdf} className={accentListItemStyle} title="Relatório Somente Fotos">
                    <ImageIcon className={iconSize} />
                    <span>Somente Fotos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGeneratePdf} className={primaryListItemStyle} title="Relatório Completo">
                    <FileText className={iconSize} />
                    <span>Relatório Completo</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            
            <DropdownMenuItem onClick={onPrint} className={defaultListItemStyle} title="Imprimir">
              <Printer className={iconSize} />
              {!isMobile && <span>Imprimir</span>}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onExportJson} className={defaultListItemStyle} title="Exportar JSON">
              <Download className={iconSize} />
              {!isMobile && <span>Exportar JSON</span>}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onTriggerImportJson} className={defaultListItemStyle} title="Importar JSON">
              <Upload className={iconSize} />
              {!isMobile && <span>Importar JSON</span>}
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={onNewInspection} className={destructiveListItemStyle} title="Nova Vistoria">
              <PlusSquare className={iconSize} />
              {!isMobile && <span>Nova Vistoria</span>}
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </div>
  );
}
