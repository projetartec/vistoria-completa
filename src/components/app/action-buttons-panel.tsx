
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
  Save, 
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
  Database, 
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

  return (
    <div className="fixed bottom-6 right-6 z-50">
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
          <DropdownMenuContent align="end" sideOffset={10} className={cn("w-auto min-w-[56px]", !isMobile && "w-64")}>
            <DropdownMenuLabel className={cn(isMobile && "hidden")}>Ações da Vistoria</DropdownMenuLabel>
            {!isMobile && <DropdownMenuSeparator />}

            <DropdownMenuItem onClick={onSave} className="cursor-pointer">
              <Database className={cn("h-4 w-4", !isMobile && "mr-2")} />
              {!isMobile && <span>Salvar Vistoria</span>}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onToggleSavedInspections} className="cursor-pointer">
              {isSavedInspectionsVisible ? 
                <EyeOff className={cn("h-4 w-4", !isMobile && "mr-2")} /> : 
                <Eye className={cn("h-4 w-4", !isMobile && "mr-2")} />
              }
              {!isMobile && <span>{isSavedInspectionsVisible ? "Ocultar Salvas" : "Ver Salvas"}</span>}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onAddNewTower} className="cursor-pointer">
              <Building className={cn("h-4 w-4", !isMobile && "mr-2")} />
              {!isMobile && <span>Nova Torre</span>}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FileDown className={cn("h-4 w-4", !isMobile && "mr-2")} />
                {!isMobile && <span>Baixar Relatório PDF</span>}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className={cn("w-auto min-w-[56px]", !isMobile && "w-56")}>
                  <DropdownMenuLabel className={cn(isMobile && "hidden")}>Tipos de Relatório PDF</DropdownMenuLabel>
                  {!isMobile && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={onGenerateRegisteredItemsReport} className="cursor-pointer">
                    <FileSpreadsheet className={cn("h-4 w-4", !isMobile && "mr-2")} />
                    {!isMobile && <span>Itens Cadastrados</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGenerateNCItemsReport} className="cursor-pointer text-orange-600 focus:text-orange-700">
                    <AlertTriangle className={cn("h-4 w-4", !isMobile && "mr-2")} />
                    {!isMobile && <span>Itens N/C</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGeneratePhotoReportPdf} className="cursor-pointer">
                    <ImageIcon className={cn("h-4 w-4", !isMobile && "mr-2")} />
                    {!isMobile && <span>Somente Fotos</span>}
                  </DropdownMenuItem>
                  {!isMobile && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={onGeneratePdf} className="cursor-pointer">
                    <FileText className={cn("h-4 w-4", !isMobile && "mr-2")} />
                    {!isMobile && <span>Relatório Completo</span>}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            
            <DropdownMenuItem onClick={onPrint} className="cursor-pointer">
              <Printer className={cn("h-4 w-4", !isMobile && "mr-2")} />
              {!isMobile && <span>Imprimir (Navegador)</span>}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onExportJson} className="cursor-pointer">
              <Download className={cn("h-4 w-4", !isMobile && "mr-2")} />
              {!isMobile && <span>Exportar JSON</span>}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onTriggerImportJson} className="cursor-pointer">
              <Upload className={cn("h-4 w-4", !isMobile && "mr-2")} />
              {!isMobile && <span>Importar JSON</span>}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onNewInspection} className="cursor-pointer text-destructive focus:text-destructive">
              <PlusSquare className={cn("h-4 w-4", !isMobile && "mr-2")} />
              {!isMobile && <span>Nova Vistoria (Limpar)</span>}
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </div>
  );
}
