
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppHeader } from '@/components/app/app-header';
import { ClientDataForm } from '@/components/app/client-data-form';
import { InspectionCategoryItem } from '@/components/app/inspection-category-item';
import { ActionButtonsPanel } from '@/components/app/action-buttons-panel';
import { SavedInspectionsList } from '@/components/app/saved-inspections-list';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import type { InspectionData, CategoryUpdatePayload, ClientInfo, StatusOption, InspectionCategoryState, CategoryOverallStatus, RegisteredExtinguisher } from '@/lib/types';
import { INITIAL_INSPECTION_DATA } from '@/constants/inspection.config';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateInspectionPdf } from '@/lib/pdfGenerator';
import { ChevronDown, ChevronUp, Trash2, Eye, EyeOff } from 'lucide-react';

const createNewFloorEntry = (): InspectionData => {
  const newId = (typeof window !== 'undefined')
    ? Date.now().toString() + Math.random().toString(36).substring(2, 15)
    : 'server-temp-id-' + Math.random().toString(36).substring(2,9);

  return {
    id: newId,
    ...JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA)),
    floor: '',
    timestamp: undefined,
  };
};


const getCategoryOverallStatus = (category: InspectionCategoryState): CategoryOverallStatus => {
  if (category.type === 'standard' && category.subItems) {
    if (category.subItems.length === 0) {
      return 'all-items-selected';
    }
    const allSelected = category.subItems.every(subItem => {
      if (subItem.isRegistry) { // For registry subitems, consider it "selected" if there's at least one extinguisher or if it's just present (can be adjusted)
        return (subItem.registeredExtinguishers && subItem.registeredExtinguishers.length > 0) || subItem.status !== undefined; // Or simply true if registry items don't have a status in the same way
      }
      return subItem.status !== undefined;
    });
    return allSelected ? 'all-items-selected' : 'some-items-pending';
  } else if (category.type === 'special' || category.type === 'pressure') {
    return category.status !== undefined ? 'all-items-selected' : 'some-items-pending';
  }
  return 'some-items-pending';
};


export default function FireCheckPage() {
  const { toast } = useToast();

  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientLocation: '',
    clientCode: '',
    inspectionNumber: '',
    inspectionDate: new Date().toISOString().split('T')[0],
  });

  const [activeFloorsData, setActiveFloorsData] = useState<InspectionData[]>([]);
  const [isClientInitialized, setIsClientInitialized] = useState(false);

  const initialSavedInspections = useMemo(() => [], []);
  const [savedInspections, setSavedInspections] = useLocalStorage<InspectionData[]>('firecheck-inspections-v2', initialSavedInspections);

  const [isChecklistVisible, setIsChecklistVisible] = useState(true);
  const [isSavedInspectionsVisible, setIsSavedInspectionsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveFloorsData(prevData => {
        if (prevData.length === 0) {
          return [createNewFloorEntry()];
        }
        return prevData;
      });
      setIsClientInitialized(true);
    }
  }, []);

  const handleClientInfoChange = useCallback((field: keyof ClientInfo, value: string) => {
    setClientInfo(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'clientCode') {
        newState.inspectionNumber = value ? `${value}-01` : '';
      }
      return newState;
    });
  }, []);

  const handleFloorSpecificFieldChange = useCallback((floorIndex: number, field: keyof Pick<InspectionData, 'floor'>, value: string) => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map((floor, index) =>
        index === floorIndex ? { ...floor, [field]: value } : floor
      )
    );
  }, []);

  const handleCategoryItemUpdateForFloor = useCallback((floorIndex: number, categoryId: string, update: CategoryUpdatePayload) => {
    setActiveFloorsData(prevFloors => {
      return prevFloors.map((currentFloorData, index) => {
        if (index !== floorIndex) {
          return currentFloorData;
        }
        let inspectionChangedOverall = false;
        const newCategories = currentFloorData.categories.map(cat => {
          if (cat.id !== categoryId) {
            return cat;
          }
          let updatedCatData = { ...cat };
          let categoryStructurallyChanged = false;

          switch (update.field) {
            case 'isExpanded':
              updatedCatData.isExpanded = update.value; categoryStructurallyChanged = true; break;
            case 'status':
              updatedCatData.status = update.value; categoryStructurallyChanged = true; break;
            case 'observation':
              updatedCatData.observation = update.value; categoryStructurallyChanged = true; break;
            case 'showObservation':
              updatedCatData.showObservation = update.value; categoryStructurallyChanged = true; break;
            case 'pressureValue':
              updatedCatData.pressureValue = update.value; categoryStructurallyChanged = true; break;
            case 'pressureUnit':
              updatedCatData.pressureUnit = update.value as InspectionCategoryState['pressureUnit']; categoryStructurallyChanged = true; break;
            case 'subItemStatus':
            case 'subItemObservation':
            case 'subItemShowObservation':
              if (cat.subItems && update.subItemId) {
                updatedCatData.subItems = cat.subItems.map(sub => {
                  if (sub.id !== update.subItemId) return sub;
                  let changed = false;
                  if (update.field === 'subItemStatus' && sub.status !== (update.value as StatusOption | undefined)) { sub.status = update.value as StatusOption | undefined; changed = true; }
                  else if (update.field === 'subItemObservation' && sub.observation !== (update.value as string)) { sub.observation = update.value as string; changed = true; }
                  else if (update.field === 'subItemShowObservation' && sub.showObservation !== (update.value as boolean)) { sub.showObservation = update.value as boolean; changed = true; }
                  if (changed) categoryStructurallyChanged = true;
                  return sub;
                });
              }
              break;
            case 'addRegisteredExtinguisher':
              if (cat.subItems && update.subItemId) {
                updatedCatData.subItems = cat.subItems.map(sub => {
                  if (sub.id !== update.subItemId || !sub.isRegistry) return sub;
                  const newExtinguisher: RegisteredExtinguisher = {
                    ...update.value,
                    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                  };
                  sub.registeredExtinguishers = [...(sub.registeredExtinguishers || []), newExtinguisher];
                  categoryStructurallyChanged = true;
                  return sub;
                });
              }
              break;
            case 'removeRegisteredExtinguisher':
              if (cat.subItems && update.subItemId) {
                updatedCatData.subItems = cat.subItems.map(sub => {
                  if (sub.id !== update.subItemId || !sub.isRegistry || !sub.registeredExtinguishers) return sub;
                  sub.registeredExtinguishers = sub.registeredExtinguishers.filter(ext => ext.id !== update.extinguisherId);
                  categoryStructurallyChanged = true;
                  return sub;
                });
              }
              break;
            default: break;
          }
          if (categoryStructurallyChanged) inspectionChangedOverall = true;
          return updatedCatData;
        });

        if (inspectionChangedOverall) {
          return { ...currentFloorData, categories: newCategories };
        }
        return currentFloorData;
      });
    });
  }, []);


  const resetInspectionForm = useCallback(() => {
    setClientInfo({
      clientLocation: '',
      clientCode: '',
      inspectionNumber: '',
      inspectionDate: new Date().toISOString().split('T')[0],
    });
    setActiveFloorsData([createNewFloorEntry()]);
    toast({ title: "Novo Formulário", description: "Formulário de vistoria reiniciado." });
  }, [toast]);

  const handleNewFloorInspection = useCallback(() => {
    setActiveFloorsData(prev => [...prev, createNewFloorEntry()]);
    toast({
      title: "Novo Andar Adicionado",
      description: "Um novo formulário de andar foi adicionado abaixo. Preencha os detalhes.",
    });
  }, [toast]);

  const handleRemoveFloor = useCallback((floorIndex: number) => {
    if (activeFloorsData.length <= 1) {
      toast({ title: "Ação Inválida", description: "Deve haver pelo menos um andar.", variant: "destructive" });
      return;
    }
    if (typeof window !== 'undefined' && window.confirm(`Tem certeza que deseja remover este formulário de andar? As informações não salvas serão perdidas.`)) {
      setActiveFloorsData(prev => prev.filter((_, index) => index !== floorIndex));
      toast({ title: "Andar Removido", description: "O formulário do andar foi removido.", variant: "default" });
    }
  }, [activeFloorsData.length, toast]);


  const handleSaveInspection = () => {
    if (!clientInfo.clientCode || !clientInfo.clientLocation) {
      toast({ title: "Erro ao Salvar", description: "CÓDIGO DO CLIENTE e LOCAL são obrigatórios.", variant: "destructive" });
      return;
    }
    if (!clientInfo.inspectionDate) {
      toast({ title: "Erro ao Salvar", description: "DATA DA VISTORIA é obrigatória.", variant: "destructive" });
      return;
    }

    let floorsSavedCount = 0;
    const inspectionsToUpdateInStorage: InspectionData[] = [];

    activeFloorsData.forEach(floorData => {
      if (!floorData.floor) {
        return;
      }

      const now = Date.now();
      const inspectionToSave: InspectionData = {
        ...floorData,
        clientLocation: clientInfo.clientLocation,
        clientCode: clientInfo.clientCode,
        inspectionNumber: clientInfo.inspectionNumber || `${clientInfo.clientCode}-01`,
        inspectionDate: clientInfo.inspectionDate,
        timestamp: now,
      };
      inspectionsToUpdateInStorage.push(inspectionToSave);
      floorsSavedCount++;
    });

    if (floorsSavedCount === 0 && activeFloorsData.some(f => !f.floor)) {
         toast({ title: "Atenção ao Salvar", description: "Preencha o nome do ANDAR para cada seção antes de salvar.", variant: "destructive" });
         return;
    }

    if (floorsSavedCount === 0 && activeFloorsData.every(f => f.floor)) {
         toast({ title: "Nada para Salvar", description: "Nenhum andar com nome preenchido para salvar.", variant: "default" });
         return;
    }

    setSavedInspections(prevSaved => {
      let newSavedList = [...prevSaved];
      inspectionsToUpdateInStorage.forEach(inspectionToSave => {
        const existingIndex = newSavedList.findIndex(insp => insp.id === inspectionToSave.id);
        if (existingIndex > -1) {
          newSavedList[existingIndex] = inspectionToSave;
        } else {
          newSavedList.push(inspectionToSave);
        }
      });
      return newSavedList.sort((a, b) => {
        const tsCompare = (b.timestamp || 0) - (a.timestamp || 0);
        if (tsCompare !== 0) return tsCompare;
        return (a.inspectionNumber || "").localeCompare(b.inspectionNumber || "");
      });
    });

    if (floorsSavedCount > 0) {
      toast({ title: "Vistorias Salvas", description: `${floorsSavedCount} andar(es) da vistoria ${clientInfo.inspectionNumber || 'sem número'} salvos com sucesso.` });
    }
  };

  const handleLoadInspection = (inspectionId: string) => {
    const inspectionToLoad = savedInspections.find(insp => insp.id === inspectionId);
    if (inspectionToLoad) {
      setClientInfo({
        clientLocation: inspectionToLoad.clientLocation,
        clientCode: inspectionToLoad.clientCode,
        inspectionNumber: inspectionToLoad.inspectionNumber,
        inspectionDate: inspectionToLoad.inspectionDate || new Date().toISOString().split('T')[0],
      });

      let loadedFloorData = { ...JSON.parse(JSON.stringify(inspectionToLoad))};
      if (typeof window !== 'undefined' && (!loadedFloorData.id || typeof loadedFloorData.id !== 'string' || loadedFloorData.id.startsWith('server-temp-id-'))) {
         loadedFloorData.id = Date.now().toString() + Math.random().toString(36).substring(2, 15);
      }

      setActiveFloorsData([loadedFloorData]);
      setIsSavedInspectionsVisible(false);
      setIsChecklistVisible(true);
      toast({ title: "Vistoria Carregada", description: `Vistoria ${inspectionToLoad.inspectionNumber || 'sem número'} (Andar: ${inspectionToLoad.floor || 'N/I'}) carregada.` });
    }
  };

  const handleDeleteInspection = (inspectionId: string) => {
    if (typeof window !== 'undefined' && window.confirm('Tem certeza que deseja excluir esta vistoria salva? Esta ação não pode ser desfeita.')) {
      setSavedInspections(prev => prev.filter(insp => insp.id !== inspectionId));
      toast({ title: "Vistoria Excluída", description: "A vistoria salva foi excluída com sucesso.", variant: "destructive" });

      setActiveFloorsData(prevActive => {
        const wasActive = prevActive.some(af => af.id === inspectionId);
        if (wasActive) {
          const newActive = prevActive.filter(af => af.id !== inspectionId);
          return newActive.length > 0 ? newActive : [createNewFloorEntry()];
        }
        return prevActive;
      });
    }
  };

  const handleGeneratePdf = useCallback(() => {
    if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionDate) {
      toast({ title: "Dados Incompletos", description: "CÓDIGO DO CLIENTE, LOCAL e DATA DA VISTORIA são obrigatórios para gerar o PDF.", variant: "destructive" });
      return;
    }
    const floorsToPrint = activeFloorsData.filter(floor => floor.floor);
    if (floorsToPrint.length === 0) {
        toast({ title: "Nenhum Andar", description: "Adicione e nomeie pelo menos um andar para gerar o PDF.", variant: "destructive" });
        return;
    }
    generateInspectionPdf(clientInfo, floorsToPrint);
  }, [clientInfo, activeFloorsData, toast]);

  const handlePrintPage = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  const toggleSavedInspections = () => {
    setIsSavedInspectionsVisible(!isSavedInspectionsVisible);
  };

  const handleCollapseAll = useCallback(() => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map(floor => ({
        ...floor,
        categories: floor.categories.map(cat => ({ ...cat, isExpanded: false })),
      }))
    );
    toast({ title: "Checklist Recolhido", description: "Todos os itens do checklist foram recolhidos." });
  }, [toast]);

  const handleExpandAll = useCallback(() => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map(floor => ({
        ...floor,
        categories: floor.categories.map(cat => ({ ...cat, isExpanded: true })),
      }))
    );
    toast({ title: "Checklist Expandido", description: "Todos os itens do checklist foram expandidos." });
  }, [toast]);


  if (!isClientInitialized) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <p className="text-foreground">Carregando formulário...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <AppHeader />

        <ClientDataForm
          clientInfoData={clientInfo}
          onClientInfoChange={handleClientInfoChange}
        />

        <div className="my-6 p-4 bg-card shadow-lg rounded-lg">
          <Button
            onClick={() => setIsChecklistVisible(!isChecklistVisible)}
            variant="ghost"
            className="w-full flex justify-between items-center text-left mb-2 text-xl font-semibold font-headline text-primary hover:bg-accent/10"
          >
            Checklist da Vistoria
            {isChecklistVisible ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
          </Button>

          {isChecklistVisible && (
            <>
              <div className="flex space-x-2 mb-4">
                <Button onClick={handleExpandAll} variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" /> Mostrar Todos os Itens
                </Button>
                <Button onClick={handleCollapseAll} variant="outline" size="sm">
                  <EyeOff className="mr-2 h-4 w-4" /> Esconder Todos os Itens
                </Button>
              </div>

              {activeFloorsData.map((floorData, floorIndex) => (
                <Card key={floorData.id} className="mb-6 shadow-md overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`floorName-${floorData.id}`} className="text-lg font-medium">
                        ANDAR (Formulário {floorIndex + 1})
                      </Label>
                      {activeFloorsData.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFloor(floorIndex)}
                          className="text-destructive hover:bg-destructive/10"
                          title="Remover este andar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                    <Input
                      id={`floorName-${floorData.id}`}
                      value={floorData.floor}
                      onChange={(e) => handleFloorSpecificFieldChange(floorIndex, 'floor', e.target.value)}
                      placeholder="Ex: Térreo, 1A, Subsolo"
                      className="mt-1"
                    />

                    {floorData.categories.map(category => {
                      const overallStatus = getCategoryOverallStatus(category);
                      return (
                        <InspectionCategoryItem
                          key={`${floorData.id}-${category.id}`}
                          category={category}
                          overallStatus={overallStatus}
                          onCategoryItemUpdate={(categoryId, update) => handleCategoryItemUpdateForFloor(floorIndex, categoryId, update)}
                        />
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        <ActionButtonsPanel
          onSave={handleSaveInspection}
          onNewInspection={resetInspectionForm}
          onNewFloor={handleNewFloorInspection}
          onToggleSavedInspections={toggleSavedInspections}
          isSavedInspectionsVisible={isSavedInspectionsVisible}
          onGeneratePdf={handleGeneratePdf}
          onPrint={handlePrintPage}
        />

        {isSavedInspectionsVisible && (
          <SavedInspectionsList
            savedInspections={savedInspections}
            onLoadInspection={handleLoadInspection}
            onDeleteInspection={handleDeleteInspection}
          />
        )}

        <footer className="text-center text-sm text-muted-foreground mt-12 pb-8">
          FireCheck Brazil &copy; {new Date().getFullYear()} - BRAZIL EXTINTORES
        </footer>
      </div>
    </ScrollArea>
  );
}
