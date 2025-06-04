
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Edit3, Trash2, Search, Hash } from 'lucide-react';
import type { FullInspectionData } from '@/lib/types'; // Changed from InspectionData
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SavedInspectionsListProps {
  savedInspections: FullInspectionData[]; // Changed to FullInspectionData[]
  onLoadInspection: (fullInspectionId: string) => void; // ID is now of FullInspectionData
  onDeleteInspection: (fullInspectionId: string) => void; // ID is now of FullInspectionData
}

export function SavedInspectionsList({ savedInspections, onLoadInspection, onDeleteInspection }: SavedInspectionsListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInspections = savedInspections
    .filter(inspection => // Filter based on FullInspectionData structure
      (inspection.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || // inspection.id is inspectionNumber
      (inspection.clientInfo.clientLocation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inspection.clientInfo.clientCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return (
    <Card className="mt-6 mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Vistorias Salvas</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por Nº Vistoria, Local ou Código Cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredInspections.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhuma vistoria salva encontrada.</p>
        ) : (
          <Accordion type="multiple" className="w-full space-y-2">
            {filteredInspections.map((inspection) => ( // inspection is FullInspectionData
              <AccordionItem value={inspection.id} key={inspection.id} className="border bg-card rounded-md shadow-sm">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/10 rounded-t-md">
                  <div className="flex justify-between items-center w-full">
                    <div className="text-left">
                      <p className="font-medium text-primary flex items-center">
                        <Hash className="h-4 w-4 mr-1 text-muted-foreground" /> 
                        {inspection.id || 'N/A'} {/* inspection.id is inspectionNumber */}
                      </p>
                      <p className="text-sm text-muted-foreground">{inspection.clientInfo.clientLocation || 'Local não informado'}</p>
                      <p className="text-xs text-muted-foreground">
                        Andares: {inspection.floors.length} 
                        {inspection.clientInfo.inspectionDate && ` | Data Vistoria: ${format(new Date(inspection.clientInfo.inspectionDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}`}
                      </p>
                      {inspection.timestamp && (
                         <p className="text-xs text-muted-foreground">
                           Salvo em: {format(new Date(inspection.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                         </p>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 space-y-3 border-t">
                  <CardDescription>
                    Código Cliente: {inspection.clientInfo.clientCode || 'N/A'} <br />
                    Total de Andares: {inspection.floors.length}
                  </CardDescription>
                   <div className="flex space-x-2 mt-2">
                    <Button onClick={() => onLoadInspection(inspection.id)} size="sm" variant="outline">
                      <Edit3 className="mr-2 h-4 w-4" /> Carregar Vistoria
                    </Button>
                    <Button variant="destructive" onClick={() => onDeleteInspection(inspection.id)} size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir Vistoria
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
