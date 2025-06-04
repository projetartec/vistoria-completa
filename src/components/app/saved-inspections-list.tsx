
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Edit3, Trash2, Search } from 'lucide-react'; // Removed Eye, EyeOff
import type { InspectionData } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SavedInspectionsListProps {
  savedInspections: InspectionData[];
  onLoadInspection: (inspectionId: string) => void;
  onDeleteInspection: (inspectionId: string) => void;
}

export function SavedInspectionsList({ savedInspections, onLoadInspection, onDeleteInspection }: SavedInspectionsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  // const [visibleDetails, setVisibleDetails] = useState<Record<string, boolean>>({}); // Removed as details are now in AccordionContent

  // const toggleDetails = (id: string) => { // Removed
  //   setVisibleDetails(prev => ({ ...prev, [id]: !prev[id] }));
  // };

  const filteredInspections = savedInspections
    .filter(inspection =>
      (inspection.inspectionNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inspection.clientLocation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inspection.clientCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Sort by newest first

  return (
    <Card className="mt-6 mb-6 shadow-lg"> {/* Added mb-6 for spacing */}
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
          <Accordion type="multiple" className="w-full space-y-2"> {/* Added space-y-2 for better separation */}
            {filteredInspections.map((inspection) => (
              <AccordionItem value={inspection.id} key={inspection.id} className="border bg-card rounded-md shadow-sm">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/10 rounded-t-md">
                  <div className="flex justify-between items-center w-full">
                    <div className="text-left">
                      <p className="font-medium text-primary">{inspection.inspectionNumber || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{inspection.clientLocation || 'Local não informado'} - {inspection.floor || 'Andar não informado'}</p>
                      {inspection.timestamp && (
                         <p className="text-xs text-muted-foreground">
                           Salvo em: {format(new Date(inspection.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                         </p>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 space-y-3 border-t"> {/* Added pt-2 */}
                  <CardDescription>
                    Código Cliente: {inspection.clientCode || 'N/A'} <br />
                    Total Categorias: {inspection.categories.length}
                    {/* Details about hoses/extinguishers removed as they are part of categories now */}
                  </CardDescription>
                   <div className="flex space-x-2 mt-2">
                    <Button onClick={() => onLoadInspection(inspection.id)} size="sm" variant="outline">
                      <Edit3 className="mr-2 h-4 w-4" /> Carregar
                    </Button>
                    <Button variant="destructive" onClick={() => onDeleteInspection(inspection.id)} size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
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
