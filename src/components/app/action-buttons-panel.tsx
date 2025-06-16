
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
  EyeOff 
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

  const itemBaseStyle = "cursor-pointer p-2 border rounded-md shadow-sm my-1 flex items-center";
  const iconBaseStyle = "h-5 w-5"; 

  return (
    <div className={cn(
        "fixed right-6 z-50",
        isMobile ? "bottom-[5.5rem]" : "bottom-6" // 1.5rem (lower FAB bottom) + 3.5rem (lower FAB height) + 0.5rem (spacing) = 5.5rem
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
            className={cn("p-1 w-auto", isMobile ? "min-w-[58px]" : "min-w-[260px]")}
          >
            {!isMobile && <DropdownMenuLabel className="px-2 py-1.5">Ações da Vistoria</DropdownMenuLabel>}
            {!isMobile && <DropdownMenuSeparator className="-mx-1 my-1" />}

            <DropdownMenuItem onClick={onSave} className={cn(itemBaseStyle)}>
              <Database className={cn(iconBaseStyle, !isMobile && "mr-2")} />
              {!isMobile && <span>Salvar Vistoria</span>}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onToggleSavedInspections} className={cn(itemBaseStyle)}>
              {isSavedInspectionsVisible ? 
                <EyeOff className={cn(iconBaseStyle, !isMobile && "mr-2")} /> : 
                <Eye className={cn(iconBaseStyle, !isMobile && "mr-2")} />
              }
              {!isMobile && <span>{isSavedInspectionsVisible ? "Ocultar Salvas" : "Ver Salvas"}</span>}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onAddNewTower} className={cn(itemBaseStyle)}>
              <Building className={cn(iconBaseStyle, !isMobile && "mr-2")} />
              {!isMobile && <span>Nova Torre</span>}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="-mx-1 my-1" />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className={cn(itemBaseStyle, "justify-between")}>
                <div className="flex items-center">
                  <FileDown className={cn(iconBaseStyle, !isMobile && "mr-2")} />
                  {/* Text "Baixar Relatório PDF" removed from here, but names of sub-items remain */}
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className={cn("p-1 w-auto", isMobile ? "min-w-[220px]" : "min-w-[220px]")}>
                  {(!isMobile || isMobile /* Keep label on mobile for this sub-menu */) && <DropdownMenuLabel className="px-2 py-1.5">Tipos de Relatório PDF</DropdownMenuLabel>}
                  {(!isMobile || isMobile) && <DropdownMenuSeparator className="-mx-1 my-1" />}
                  <DropdownMenuItem onClick={onGenerateRegisteredItemsReport} className={cn(itemBaseStyle)}>
                    <FileSpreadsheet className={cn(iconBaseStyle, "mr-2")} />
                    <span>Itens Cadastrados</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGenerateNCItemsReport} className={cn(itemBaseStyle, "text-orange-600 hover:text-orange-700 focus:text-orange-700 hover:bg-orange-500/10 focus:bg-orange-500/10 border-orange-500/50")}>
                    <AlertTriangle className={cn(iconBaseStyle, "mr-2")} />
                    <span>Itens N/C</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGeneratePhotoReportPdf} className={cn(itemBaseStyle)}>
                    <ImageIcon className={cn(iconBaseStyle, "mr-2")} />
                    <span>Somente Fotos</span>
                  </DropdownMenuItem>
                  {(!isMobile || isMobile) && <DropdownMenuSeparator className="-mx-1 my-1" />}
                  <DropdownMenuItem onClick={onGeneratePdf} className={cn(itemBaseStyle)}>
                    <FileText className={cn(iconBaseStyle, "mr-2")} />
                    <span>Relatório Completo</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            
            <DropdownMenuItem onClick={onPrint} className={cn(itemBaseStyle)}>
              <Printer className={cn(iconBaseStyle, !isMobile && "mr-2")} />
              {!isMobile && <span>Imprimir (Navegador)</span>}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="-mx-1 my-1" />

            <DropdownMenuItem onClick={onExportJson} className={cn(itemBaseStyle)}>
              <Download className={cn(iconBaseStyle, !isMobile && "mr-2")} />
              {!isMobile && <span>Exportar JSON</span>}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onTriggerImportJson} className={cn(itemBaseStyle)}>
              <Upload className={cn(iconBaseStyle, !isMobile && "mr-2")} />
              {!isMobile && <span>Importar JSON</span>}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="-mx-1 my-1" />

            <DropdownMenuItem onClick={onNewInspection} className={cn(itemBaseStyle, "text-destructive hover:bg-destructive/10 focus:bg-destructive/10 border-destructive/50 hover:text-destructive focus:text-destructive")}>
              <PlusSquare className={cn(iconBaseStyle, !isMobile && "mr-2")} />
              {!isMobile && <span>Nova Vistoria (Limpar)</span>}
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </div>
  );
}

    