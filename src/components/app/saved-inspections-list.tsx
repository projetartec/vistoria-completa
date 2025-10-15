
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { InspectionSummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Trash2, Download, HardDriveDownload, Server } from 'lucide-react';

interface SavedInspectionsListProps {
  inspections: InspectionSummary[];
  isLoading: boolean;
  onLoadInspection: (inspectionId: string) => void;
  onDeleteInspection: (inspectionId: string, inspectionLocation?: string) => void;
  onDownloadJson: (inspectionId: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function SavedInspectionsList({
  inspections,
  isLoading,
  onLoadInspection,
  onDeleteInspection,
  onDownloadJson,
  onOpenChange,
}: SavedInspectionsListProps) {
  const handleLoadAndClose = (inspectionId: string) => {
    onLoadInspection(inspectionId);
    onOpenChange(false);
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-6 w-6 text-primary" />
            Vistorias Salvas na Nuvem
          </DialogTitle>
          <DialogDescription>
            Selecione uma vistoria para carregar, gerenciar ou gerar um relatório. As vistorias são sincronizadas na nuvem.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden -mx-6 px-6">
          <ScrollArea className="h-full pr-4 -mr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : inspections.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-center">Nenhuma vistoria salva na nuvem encontrada.<br/>Salve uma vistoria para vê-la aqui.</p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                {inspections.map((inspection) => (
                  <Card
                    key={inspection.id}
                    className="flex flex-col sm:flex-row sm:items-center p-3 gap-2 shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
                  >
                    <div className="flex-grow cursor-pointer" onClick={() => handleLoadAndClose(inspection.id)}>
                      <p className="font-semibold text-sm text-foreground truncate" title={inspection.clientInfo.clientLocation || 'Local não especificado'}>
                        {inspection.clientInfo.clientLocation || 'Local não especificado'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Nº: {inspection.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Salva em: {format(new Date(inspection.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {inspection.owner || 'Desconhecido'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                       <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleLoadAndClose(inspection.id)}
                        className="text-muted-foreground hover:text-primary h-8 w-8"
                        title="Carregar Vistoria"
                      >
                        <HardDriveDownload className="h-4 w-4" />
                      </Button>
                       <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDownloadJson(inspection.id)}
                        className="text-muted-foreground hover:text-primary h-8 w-8"
                        title="Baixar JSON desta vistoria"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja remover a vistoria Nº ${inspection.id} (${inspection.clientInfo.clientLocation || 'Local não especificado'}) da nuvem? Esta ação não pode ser desfeita.`)) {
                            onDeleteInspection(inspection.id, inspection.clientInfo.clientLocation);
                          }
                        }}
                        className="text-destructive hover:bg-destructive/10 h-8 w-8"
                        title="Remover esta vistoria da nuvem"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
