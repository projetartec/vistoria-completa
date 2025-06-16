
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  Image as ImageIcon, 
  Building, 
  Eye, 
  EyeOff,
  ChevronRight
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

  const iconStyle = "h-5 w-5"; // Consistent icon size

  // Base style for pill-shaped floating buttons inside the dropdown
  const pillItemBaseStyle = "cursor-pointer h-10 px-3 py-1.5 rounded-full border shadow-md my-1 flex items-center gap-2 text-sm font-medium";

  // Style for default pill items
  const defaultPillStyle = cn(pillItemBaseStyle, "bg-card border-input hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground");
  
  // Style for destructive pill items
  const destructivePillStyle = cn(pillItemBaseStyle, "bg-destructive border-destructive/80 text-destructive-foreground hover:bg-destructive/90 focus:bg-destructive/90");

  // Style for NC report pill item
  const ncReportPillStyle = cn(pillItemBaseStyle, "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 focus:bg-orange-100");


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
            className={cn("p-2 w-auto bg-background/95 backdrop-blur-sm shadow-xl rounded-xl border", isMobile ? "min-w-[60px]" : "min-w-[280px]")}
          >
            {!isMobile && <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground">AÇÕES DA VISTORIA</DropdownMenuLabel>}
            
            <DropdownMenuItem onClick={onSave} className={defaultPillStyle}>
              <Database className={iconStyle} />
              {!isMobile && <span>Salvar Vistoria</span>}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onToggleSavedInspections} className={defaultPillStyle}>
              {isSavedInspectionsVisible ? 
                <EyeOff className={iconStyle} /> : 
                <Eye className={iconStyle} />
              }
              {!isMobile && <span>{isSavedInspectionsVisible ? "Ocultar Salvas" : "Ver Salvas"}</span>}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onAddNewTower} className={defaultPillStyle}>
              <Building className={iconStyle} />
              {!isMobile && <span>Nova Torre</span>}
            </DropdownMenuItem>
            
            {!isMobile && <DropdownMenuSeparator className="-mx-1 my-1" />}

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className={cn(defaultPillStyle, "justify-between w-full")}>
                <div className="flex items-center gap-2"> {/* Group icon and text */}
                  <FileDown className={iconStyle} />
                  {(!isMobile) && <span>Baixar PDF</span>}
                  {(isMobile) && <span>PDFs</span>}
                </div>
                {/* Chevron is automatically added by DropdownMenuSubTrigger and placed with ml-auto on desktop */}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className={cn("p-2 w-auto bg-background/95 backdrop-blur-sm shadow-lg rounded-lg border", isMobile ? "min-w-[230px]" : "min-w-[230px]")}>
                  {(!isMobile || isMobile) && <DropdownMenuLabel className={cn("px-2 py-1.5 text-xs text-muted-foreground", isMobile && "text-center")}>RELATÓRIOS PDF</DropdownMenuLabel>}
                  <DropdownMenuItem onClick={onGenerateRegisteredItemsReport} className={defaultPillStyle}>
                    <FileSpreadsheet className={cn(iconStyle, (isMobile || !isMobile) && "mr-0")} /> {/* Adjusted margin for consistency */}
                    <span>Itens Cadastrados</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGenerateNCItemsReport} className={ncReportPillStyle}>
                    <AlertTriangle className={cn(iconStyle, (isMobile || !isMobile) && "mr-0")} />
                    <span>Itens N/C</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGeneratePhotoReportPdf} className={defaultPillStyle}>
                    <ImageIcon className={cn(iconStyle, (isMobile || !isMobile) && "mr-0")} />
                    <span>Somente Fotos</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="-mx-1 my-1" />
                  <DropdownMenuItem onClick={onGeneratePdf} className={cn(defaultPillStyle, "bg-primary/20 border-primary/50 text-primary hover:bg-primary/30 focus:bg-primary/30")}>
                    <FileText className={cn(iconStyle, (isMobile || !isMobile) && "mr-0")} />
                    <span>Relatório Completo</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            
            <DropdownMenuItem onClick={onPrint} className={defaultPillStyle}>
              <Printer className={iconStyle} />
              {!isMobile && <span>Imprimir</span>}
            </DropdownMenuItem>

            {!isMobile && <DropdownMenuSeparator className="-mx-1 my-1" />}

            <DropdownMenuItem onClick={onExportJson} className={defaultPillStyle}>
              <Download className={iconStyle} />
              {!isMobile && <span>Exportar JSON</span>}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onTriggerImportJson} className={defaultPillStyle}>
              <Upload className={iconStyle} />
              {!isMobile && <span>Importar JSON</span>}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="-mx-1 my-1" />

            <DropdownMenuItem onClick={onNewInspection} className={destructivePillStyle}>
              <PlusSquare className={iconStyle} />
              {!isMobile && <span>Nova Vistoria</span>}
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </div>
  );
}
