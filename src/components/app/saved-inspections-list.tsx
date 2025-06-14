
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FullInspectionData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Trash2, Download, UploadCloud, ListChecks } from 'lucide-react'; // Added ListChecks for load

interface SavedInspectionsListProps {
  inspections: FullInspectionData[];
  isLoading: boolean;
  onLoadInspection: (inspectionId: string) => void;
  onDeleteInspection: (inspectionId: string, inspectionLocation?: string) => void;
  onDownloadJson: (inspectionId: string) => void;
}

export function SavedInspectionsList({
  inspections,
  isLoading,
  onLoadInspection,
  onDeleteInspection,
  onDownloadJson,
}: SavedInspectionsListProps) {
  if (isLoading) {
    return (
      <div className="my-6 p-4 bg-card shadow-lg rounded-lg text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-muted-foreground">Carregando vistorias salvas...</p>
      </div>
    );
  }

  if (!inspections || inspections.length === 0) {
    return (
      <div className="my-6 p-4 bg-card shadow-lg rounded-lg text-center">
        <CardTitle className="text-lg font-semibold mb-2">Vistorias Salvas no Navegador</CardTitle>
        <CardDescription>Nenhuma vistoria salva encontrada no armazenamento do navegador.</CardDescription>
      </div>
    );
  }

  return (
    <Card className="my-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold font-headline text-primary">Vistorias Salvas no Navegador</CardTitle>
        <CardDescription>Gerencie as vistorias armazenadas localmente no seu navegador.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full pr-3"> {/* Added pr-3 for scrollbar spacing */}
          <div className="space-y-3">
            {inspections.map((inspection) => (
              <Card key={inspection.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 gap-2 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-grow">
                  <p className="font-semibold text-sm text-foreground truncate" title={inspection.clientInfo.clientLocation || 'Local não especificado'}>
                    {inspection.clientInfo.clientLocation || 'Local não especificado'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nº: {inspection.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Salva em: {format(new Date(inspection.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLoadInspection(inspection.id)}
                    title="Carregar esta vistoria para o formulário"
                    className="h-8 px-2"
                  >
                    <ListChecks className="mr-1 h-3.5 w-3.5" /> <span className="hidden sm:inline">Carregar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownloadJson(inspection.id)}
                    title="Baixar JSON desta vistoria"
                    className="h-8 px-2"
                  >
                    <Download className="mr-1 h-3.5 w-3.5" /> <span className="hidden sm:inline">JSON</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja remover a vistoria Nº ${inspection.id} (${inspection.clientInfo.clientLocation || 'Local não especificado'})? Esta ação não pode ser desfeita.`)) {
                        onDeleteInspection(inspection.id, inspection.clientInfo.clientLocation);
                      }
                    }}
                    className="text-destructive hover:bg-destructive/10 h-8 w-8"
                    title="Remover esta vistoria"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
