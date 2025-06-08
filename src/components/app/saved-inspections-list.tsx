
import type React from 'react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit3, Trash2, Search, Hash, Copy, Edit2 } from 'lucide-react';
import type { FullInspectionData } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SavedInspectionsListProps {
  savedInspections: FullInspectionData[];
  onLoadInspection: (fullInspectionId: string) => void;
  onDeleteInspection: (fullInspectionId: string) => void;
  onDeleteMultipleInspections: (fullInspectionIds: string[]) => void;
  onDuplicateInspection: (fullInspectionId: string) => void;
  onRenameInspection: (oldId: string, newId: string) => void;
}

export function SavedInspectionsList({
  savedInspections,
  onLoadInspection,
  onDeleteInspection,
  onDeleteMultipleInspections,
  onDuplicateInspection,
  onRenameInspection,
}: SavedInspectionsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToDelete, setSelectedToDelete] = useState<string[]>([]);
  const [renamingInspection, setRenamingInspection] = useState<FullInspectionData | null>(null);
  const [newInspectionIdInput, setNewInspectionIdInput] = useState('');

  const filteredInspections = savedInspections
    .filter(inspection =>
      (inspection.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inspection.clientInfo.clientLocation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inspection.clientInfo.clientCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const handleToggleSelection = (inspectionId: string) => {
    setSelectedToDelete((prevSelected) =>
      prevSelected.includes(inspectionId)
        ? prevSelected.filter((id) => id !== inspectionId)
        : [...prevSelected, inspectionId]
    );
  };

  const handleDeleteSelectedClick = () => {
    if (selectedToDelete.length === 0) {
      console.warn("SavedInspectionsList: Botão 'Excluir Selecionadas' clicado, mas nenhuma vistoria está selecionada.");
      return;
    }
    if (typeof window !== 'undefined' && window.confirm(`Tem certeza que deseja excluir ${selectedToDelete.length} vistoria(s) selecionada(s)? Esta ação é irreversível.`)) {
      onDeleteMultipleInspections(selectedToDelete);
      setSelectedToDelete([]);
    }
  };

  const openRenameDialog = useCallback((inspection: FullInspectionData) => {
    setRenamingInspection(inspection);
    setNewInspectionIdInput(inspection.id);
  }, []);

  const closeRenameDialog = useCallback(() => {
    setRenamingInspection(null);
    setNewInspectionIdInput('');
  }, []);

  const handleRenameConfirm = useCallback(() => {
    if (renamingInspection && newInspectionIdInput.trim()) {
      onRenameInspection(renamingInspection.id, newInspectionIdInput.trim());
    }
    closeRenameDialog();
  }, [renamingInspection, newInspectionIdInput, onRenameInspection, closeRenameDialog]);


  return (
    <>
      <Card className="mt-6 mb-6 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="font-headline text-xl">Vistorias Salvas</CardTitle>
            {selectedToDelete.length > 0 && (
              <Button onClick={handleDeleteSelectedClick} variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir Selecionadas ({selectedToDelete.length})
              </Button>
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
                      checked={selectedToDelete.includes(inspection.id)}
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
                       <Button onClick={() => openRenameDialog(inspection)} size="sm" variant="outline">
                        <Edit2 className="mr-2 h-4 w-4" /> Renomear
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

      {renamingInspection && (
        <AlertDialog open={!!renamingInspection} onOpenChange={(isOpen) => !isOpen && closeRenameDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Renomear Vistoria</AlertDialogTitle>
              <AlertDialogDescription>
                Insira o novo Número da Vistoria (ID) para "{renamingInspection.id}".
                Este ID deve ser único.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="new-inspection-id" className="mb-2 block">Novo Número da Vistoria (ID)</Label>
              <Input
                id="new-inspection-id"
                value={newInspectionIdInput}
                onChange={(e) => setNewInspectionIdInput(e.target.value)}
                placeholder="Ex: VIST-001-XYZ"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeRenameDialog}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRenameConfirm} disabled={!newInspectionIdInput.trim()}>Salvar Alterações</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
