
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
  Settings2, // Main FAB icon
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
          <DropdownMenuContent align="end" sideOffset={10} className="w-64">
            <DropdownMenuLabel>Ações da Vistoria</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onSave} className="cursor-pointer">
              <Database className="mr-2 h-4 w-4" />
              <span>Salvar Vistoria</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onToggleSavedInspections} className="cursor-pointer">
              {isSavedInspectionsVisible ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              <span>{isSavedInspectionsVisible ? "Ocultar Salvas" : "Ver Salvas"}</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onAddNewTower} className="cursor-pointer">
              <Building className="mr-2 h-4 w-4" />
              <span>Nova Torre</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FileDown className="mr-2 h-4 w-4" />
                <span>Baixar Relatório PDF</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-56">
                  <DropdownMenuLabel>Tipos de Relatório PDF</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onGenerateRegisteredItemsReport} className="cursor-pointer">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    <span>Itens Cadastrados</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGenerateNCItemsReport} className="cursor-pointer text-orange-600 focus:text-orange-700">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    <span>Itens N/C</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGeneratePhotoReportPdf} className="cursor-pointer">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    <span>Somente Fotos</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onGeneratePdf} className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Relatório Completo</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            
            <DropdownMenuItem onClick={onPrint} className="cursor-pointer">
              <Printer className="mr-2 h-4 w-4" />
              <span>Imprimir (Navegador)</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onExportJson} className="cursor-pointer">
              <Download className="mr-2 h-4 w-4" />
              <span>Exportar JSON</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onTriggerImportJson} className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              <span>Importar JSON</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onNewInspection} className="cursor-pointer text-destructive focus:text-destructive">
              <PlusSquare className="mr-2 h-4 w-4" />
              <span>Nova Vistoria (Limpar)</span>
            </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </div>
  );
}
