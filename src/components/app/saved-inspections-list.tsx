
import type React from 'react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit3, Trash2, Search, Hash, Copy, Edit2, Download } from 'lucide-react'; // Added Download icon
import type { FullInspectionData } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SavedInspectionsListProps {
  savedInspections: FullInspectionData[];
  onLoadInspection: (fullInspectionId: string) => void;
  onDeleteInspection: (fullInspectionId: string) => void;
  onDeleteMultipleInspections: (fullInspectionIds: string[]) => void;
  onDuplicateInspection: (fullInspectionId: string) => void;
  onUpdateClientLocation: (inspectionId: string, newClientLocation: string) => void;
  onDownloadSelected: (inspectionIds: string[]) => void; // New prop
}

export function SavedInspectionsList({
  savedInspections,
  onLoadInspection,
  onDeleteInspection,
  onDeleteMultipleInspections,
  onDuplicateInspection,
  onUpdateClientLocation,
  onDownloadSelected, // New prop
}: SavedInspectionsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInspections, setSelectedInspections] = useState<string[]>([]); // Renamed for clarity
  const [editingClientLocationForInspection, setEditingClientLocationForInspection] = useState<FullInspectionData | null>(null);
  const [newClientLocationInput, setNewClientLocationInput] = useState('');

  const filteredInspections = savedInspections
    .filter(inspection =>
      (inspection.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inspection.clientInfo.clientLocation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inspection.clientInfo.clientCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const handleToggleSelection = (inspectionId: string) => {
    setSelectedInspections((prevSelected) =>
      prevSelected.includes(inspectionId)
        ? prevSelected.filter((id) => id !== inspectionId)
        : [...prevSelected, inspectionId]
    );
  };

  const handleDeleteSelectedClick = () => {
    if (selectedInspections.length === 0) {
      // This case should ideally be prevented by disabling the button
      return;
    }
    if (typeof window !== 'undefined' && window.confirm(`Tem certeza que deseja excluir ${selectedInspections.length} vistoria(s) selecionada(s)? Esta ação é irreversível.`)) {
      onDeleteMultipleInspections(selectedInspections);
      setSelectedInspections([]);
    }
  };

  const handleDownloadSelectedClick = () => {
    if (selectedInspections.length === 0) {
      // This case should ideally be prevented by disabling the button
      return;
    }
    onDownloadSelected(selectedInspections);
  };

  const openEditClientLocationDialog = useCallback((inspection: FullInspectionData) => {
    setEditingClientLocationForInspection(inspection);
    setNewClientLocationInput(inspection.clientInfo.clientLocation);
  }, []);

  const closeEditClientLocationDialog = useCallback(() => {
    setEditingClientLocationForInspection(null);
    setNewClientLocationInput('');
  }, []);

  const handleEditClientLocationConfirm = useCallback(() => {
    if (editingClientLocationForInspection && newClientLocationInput.trim()) {
      onUpdateClientLocation(editingClientLocationForInspection.id, newClientLocationInput.trim());
    }
    closeEditClientLocationDialog();
  }, [editingClientLocationForInspection, newClientLocationInput, onUpdateClientLocation, closeEditClientLocationDialog]);


  return (
    <>
      <Card className="mt-6 mb-6 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
            <CardTitle className="font-headline text-xl">Vistorias Salvas</CardTitle>
            {selectedInspections.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleDownloadSelectedClick} variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-500/10">
                  <Download className="mr-2 h-4 w-4" /> Baixar Selecionadas ({selectedInspections.length})
                </Button>
                <Button onClick={handleDeleteSelectedClick} variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir Selecionadas ({selectedInspections.length})
                </Button>
              </div>
            )}
          </div>
          <div className="relative">
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
              {filteredInspections.map((inspection) => (
                <AccordionItem value={inspection.id} key={inspection.id} className="border bg-card rounded-md shadow-sm">
                  <div className="flex items-center px-4 py-1 hover:bg-accent/10 rounded-t-md">
                    <Checkbox
                      id={`select-inspection-${inspection.id}`}
                      checked={selectedInspections.includes(inspection.id)}
                      onCheckedChange={() => handleToggleSelection(inspection.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Selecionar vistoria ${inspection.id}`}
                      className="mr-3 h-5 w-5 shrink-0"
                    />
                    <AccordionTrigger className="flex-1 py-2 hover:no-underline">
                      <div className="flex justify-between items-center w-full">
                        <div className="text-left">
                          <p className="font-medium text-primary flex items-center">
                            <Hash className="h-4 w-4 mr-1 text-muted-foreground" />
                            {inspection.id || 'N/A'}
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
                  </div>
                  <AccordionContent className="px-4 pb-4 pt-2 space-y-3 border-t">
                    <CardDescription>
                      Código Cliente: {inspection.clientInfo.clientCode || 'N/A'} <br />
                      Total de Andares: {inspection.floors.length}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button onClick={() => onLoadInspection(inspection.id)} size="sm" variant="outline">
                        <Edit3 className="mr-2 h-4 w-4" /> Carregar
                      </Button>
                       <Button onClick={() => openEditClientLocationDialog(inspection)} size="sm" variant="outline">
                        <Edit2 className="mr-2 h-4 w-4" /> Editar Cliente
                      </Button>
                      <Button onClick={() => onDuplicateInspection(inspection.id)} size="sm" variant="secondary">
                        <Copy className="mr-2 h-4 w-4" /> Duplicar
                      </Button>
                      <Button variant="destructive" onClick={() => {
                        if (window.confirm(`Tem certeza que deseja excluir a vistoria Nº ${inspection.id}? Esta ação é irreversível.`)) {
                            onDeleteInspection(inspection.id);
                        }
                      }} size="sm">
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

      {editingClientLocationForInspection && (
        <AlertDialog open={!!editingClientLocationForInspection} onOpenChange={(isOpen) => !isOpen && closeEditClientLocationDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Editar Nome do Cliente (Local)</AlertDialogTitle>
              <AlertDialogDescription>
                Insira o novo Nome do Cliente (Local) para a vistoria Nº "{editingClientLocationForInspection.id}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="new-client-location" className="mb-2 block">Novo Nome do Cliente (Local)</Label>
              <Input
                id="new-client-location"
                value={newClientLocationInput}
                onChange={(e) => setNewClientLocationInput(e.target.value)}
                placeholder="Ex: Condomínio XPTO"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeEditClientLocationDialog}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleEditClientLocationConfirm} disabled={!newClientLocationInput.trim()}>Salvar Alterações</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
