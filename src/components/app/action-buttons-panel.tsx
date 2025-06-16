
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator, // Kept for potential future use, but not used with current FAB item layout
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { 
  Settings2, 
  Database, 
  PlusSquare, 
  Printer, 
  Download, 
  Upload, 
  FileDown, 
  FileSpreadsheet, 
  AlertTriangle, 
  FileText, 
  ImageIcon, 
  Building, 
  Eye, 
  EyeOff,
  Save // Added Save icon from example
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

  const fabItemIconSize = "h-6 w-6"; // Slightly larger icons for larger buttons

  // Base style for circular FAB-like items inside the dropdown
  const circularFabItemStyle = "h-12 w-12 rounded-full p-0 shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform hover:scale-105 active:scale-95";

  // Specific styles for different actions
  const primaryFabStyle = cn(circularFabItemStyle, "bg-primary text-primary-foreground hover:bg-primary/90");
  const secondaryFabStyle = cn(circularFabItemStyle, "bg-secondary text-secondary-foreground hover:bg-secondary/80");
  const destructiveFabStyle = cn(circularFabItemStyle, "bg-destructive text-destructive-foreground hover:bg-destructive/90");
  const ncReportFabStyle = cn(circularFabItemStyle, "bg-orange-500 text-white hover:bg-orange-600"); // Using a direct orange for N/C report
  const accentFabStyle = cn(circularFabItemStyle, "bg-accent text-accent-foreground hover:bg-accent/90");
  const mutedFabStyle = cn(circularFabItemStyle, "bg-muted text-muted-foreground hover:bg-muted/90");


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
            className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
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
            className="p-4 w-auto max-w-xs bg-background/95 backdrop-blur-sm shadow-xl rounded-xl border flex flex-wrap justify-center gap-3"
          >
            {/* Action Items as Circular FABs */}
            <DropdownMenuItem onClick={onSave} className={primaryFabStyle} title="Salvar Vistoria">
              <Save className={fabItemIconSize} />
              <span className="sr-only">Salvar Vistoria</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onToggleSavedInspections} className={secondaryFabStyle} title={isSavedInspectionsVisible ? "Ocultar Salvas" : "Ver Salvas"}>
              {isSavedInspectionsVisible ? <EyeOff className={fabItemIconSize} /> : <Eye className={fabItemIconSize} />}
              <span className="sr-only">{isSavedInspectionsVisible ? "Ocultar Salvas" : "Ver Salvas"}</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={onAddNewTower} className={primaryFabStyle} title="Nova Torre">
              <Building className={fabItemIconSize} />
              <span className="sr-only">Nova Torre</span>
            </DropdownMenuItem>
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className={cn(secondaryFabStyle, "focus:bg-secondary/90 data-[state=open]:bg-secondary/90")} title="Baixar Relatórios PDF">
                <FileDown className={fabItemIconSize} />
                <span className="sr-only">Baixar Relatórios PDF</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="p-3 w-auto max-w-xs bg-background/95 backdrop-blur-sm shadow-lg rounded-lg border flex flex-wrap justify-center gap-2">
                  <DropdownMenuItem onClick={onGenerateRegisteredItemsReport} className={secondaryFabStyle} title="Relatório de Itens Cadastrados">
                    <FileSpreadsheet className={fabItemIconSize} />
                    <span className="sr-only">Relatório de Itens Cadastrados</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGenerateNCItemsReport} className={ncReportFabStyle} title="Relatório de Itens N/C">
                    <AlertTriangle className={fabItemIconSize} />
                    <span className="sr-only">Relatório de Itens N/C</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGeneratePhotoReportPdf} className={accentFabStyle} title="Relatório Somente Fotos">
                    <ImageIcon className={fabItemIconSize} />
                    <span className="sr-only">Relatório Somente Fotos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGeneratePdf} className={primaryFabStyle} title="Relatório Completo">
                    <FileText className={fabItemIconSize} />
                    <span className="sr-only">Relatório Completo</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            
            <DropdownMenuItem onClick={onPrint} className={mutedFabStyle} title="Imprimir">
              <Printer className={fabItemIconSize} />
              <span className="sr-only">Imprimir</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onExportJson} className={secondaryFabStyle} title="Exportar JSON">
              <Download className={fabItemIconSize} />
              <span className="sr-only">Exportar JSON</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onTriggerImportJson} className={secondaryFabStyle} title="Importar JSON">
              <Upload className={fabItemIconSize} />
              <span className="sr-only">Importar JSON</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={onNewInspection} className={destructiveFabStyle} title="Nova Vistoria">
              <PlusSquare className={fabItemIconSize} />
              <span className="sr-only">Nova Vistoria</span>
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </div>
  );
}
