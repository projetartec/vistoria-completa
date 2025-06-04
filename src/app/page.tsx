
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
import type { InspectionData, CategoryUpdatePayload, ClientInfo, StatusOption, InspectionCategoryState } from '@/lib/types';
import { INITIAL_INSPECTION_DATA } from '@/constants/inspection.config';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const createNewFloorEntry = (): InspectionData => {
  // INITIAL_INSPECTION_DATA already has clientCode, clientLocation, inspectionNumber as empty strings.
  // These will be effectively overridden by global clientInfo when saving or can be ignored if not used directly from floor entry.
  return {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 15), // More robust unique ID
    ...JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA)), // Deep clone categories and other defaults
    floor: '', // Ensure floor is empty for a new entry
    timestamp: undefined, // No timestamp until saved
  };
};


export default function FireCheckPage() {
  const { toast } = useToast();

  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientLocation: '',
    clientCode: '',
    inspectionNumber: ''
  });

  const [activeFloorsData, setActiveFloorsData] = useState<InspectionData[]>([createNewFloorEntry()]);
  
  const initialSavedInspections = useMemo(() => [], []);
  const [savedInspections, setSavedInspections] = useLocalStorage<InspectionData[]>('firecheck-inspections-v2', initialSavedInspections);

  const [isChecklistVisible, setIsChecklistVisible] = useState(true); // For the main checklist toggle
  const [isSavedInspectionsVisible, setIsSavedInspectionsVisible] = useState(false);

  const handleClientInfoChange = useCallback((field: keyof ClientInfo, value: string) => {
    setClientInfo(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'clientCode') {
        newState.inspectionNumber = value ? `${value}-01` : ''; // Simplified inspection number generation
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

        // Logic from old handleCategoryItemUpdate, adapted for a single floor's categories
        let inspectionChangedOverall = false;
        const newCategories = currentFloorData.categories.map(cat => {
          if (cat.id !== categoryId) {
            return cat;
          }
          let updatedCatData = { ...cat };
          let categoryStructurallyChanged = false;
          switch (update.field) {
            case 'isExpanded':
              if (updatedCatData.isExpanded !== update.value) {
                updatedCatData.isExpanded = update.value;
                categoryStructurallyChanged = true;
              }
              break;
            case 'status':
              if (updatedCatData.status !== update.value) {
                updatedCatData.status = update.value;
                categoryStructurallyChanged = true;
              }
              break;
            case 'observation':
              if (updatedCatData.observation !== update.value) {
                updatedCatData.observation = update.value;
                categoryStructurallyChanged = true;
              }
              break;
            case 'showObservation':
               if (updatedCatData.showObservation !== update.value) {
                updatedCatData.showObservation = update.value;
                categoryStructurallyChanged = true;
              }
              break;
            case 'pressureValue':
              if (updatedCatData.pressureValue !== update.value) {
                updatedCatData.pressureValue = update.value;
                categoryStructurallyChanged = true;
              }
              break;
            case 'pressureUnit':
              if (updatedCatData.pressureUnit !== (update.value as InspectionCategoryState['pressureUnit'])) {
                updatedCatData.pressureUnit = update.value as InspectionCategoryState['pressureUnit'];
                categoryStructurallyChanged = true;
              }
              break;
            case 'subItemStatus':
            case 'subItemObservation':
            case 'subItemShowObservation':
              if (cat.subItems && update.subItemId) {
                let subItemsArrayChangedInternally = false;
                const newSubItems = cat.subItems.map(sub => {
                  if (sub.id !== update.subItemId) return sub;
                  let updatedSubData = { ...sub };
                  let subItemStructurallyChanged = false;
                  if (update.field === 'subItemStatus' && updatedSubData.status !== (update.value as StatusOption | undefined)) {
                    updatedSubData.status = update.value as StatusOption | undefined;
                    subItemStructurallyChanged = true;
                  } else if (update.field === 'subItemObservation' && updatedSubData.observation !== (update.value as string)) {
                    updatedSubData.observation = update.value as string;
                    subItemStructurallyChanged = true;
                  } else if (update.field === 'subItemShowObservation' && updatedSubData.showObservation !== (update.value as boolean)) {
                    updatedSubData.showObservation = update.value as boolean;
                    subItemStructurallyChanged = true;
                  }
                  if (subItemStructurallyChanged) {
                    subItemsArrayChangedInternally = true;
                    return updatedSubData;
                  }
                  return sub;
                });
                if (subItemsArrayChangedInternally) {
                  updatedCatData.subItems = newSubItems;
                  categoryStructurallyChanged = true;
                }
              }
              break;
            default: break;
          }
          if (categoryStructurallyChanged) {
            inspectionChangedOverall = true;
            return updatedCatData;
          }
          return cat;
        });

        if (inspectionChangedOverall || currentFloorData.categories.length !== newCategories.length || !currentFloorData.categories.every((val, idx) => val === newCategories[idx])) {
          return { ...currentFloorData, categories: newCategories };
        }
        return currentFloorData;
      });
    });
  }, []);

  const resetInspectionForm = useCallback(() => {
    setClientInfo({ clientLocation: '', clientCode: '', inspectionNumber: '' });
    setActiveFloorsData([createNewFloorEntry()]);
    toast({ title: "Novo Formulário", description: "Formulário de vistoria reiniciado." });
  }, [toast]);

  const handleNewFloorInspection = useCallback(() => {
    // No longer saves previous floor implicitly here. Saving is explicit via "Salvar Vistoria".
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

    let floorsSavedCount = 0;
    const inspectionsToUpdateInStorage: InspectionData[] = [];

    activeFloorsData.forEach(floorData => {
      if (!floorData.floor) {
        // Optionally, prompt or skip saving this floor
        console.warn(`Andar ${floorData.id} sem nome, não será salvo individualmente agora.`);
        return; // Skip saving this floor if its name is empty
      }

      const now = Date.now();
      const inspectionToSave: InspectionData = {
        ...floorData, // Contains id, categories, floor
        clientLocation: clientInfo.clientLocation,
        clientCode: clientInfo.clientCode,
        inspectionNumber: clientInfo.inspectionNumber || `${clientInfo.clientCode}-01`, // Ensure inspection number
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
      return newSavedList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
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
      });
      // Deep clone to avoid state mutation issues if inspectionToLoad is directly from localStorage state
      const loadedFloorData = JSON.parse(JSON.stringify(inspectionToLoad));
      setActiveFloorsData([loadedFloorData]); 
      setIsSavedInspectionsVisible(false);
      toast({ title: "Vistoria Carregada", description: `Vistoria ${inspectionToLoad.inspectionNumber || 'sem número'} (Andar: ${inspectionToLoad.floor || 'N/I'}) carregada.` });
    }
  };

  const handleDeleteInspection = (inspectionId: string) => {
    if (typeof window !== 'undefined' && window.confirm('Tem certeza que deseja excluir esta vistoria salva? Esta ação não pode ser desfeita.')) {
      setSavedInspections(prev => prev.filter(insp => insp.id !== inspectionId));
      toast({ title: "Vistoria Excluída", description: "A vistoria salva foi excluída com sucesso.", variant: "destructive" });
      
      // If the deleted inspection was one of the active floors, remove it from activeFloorsData
      setActiveFloorsData(prevActive => {
        const newActive = prevActive.filter(af => af.id !== inspectionId);
        // If all active floors are removed (e.g. if only one was active and it was deleted), reset to a new single entry
        return newActive.length > 0 ? newActive : [createNewFloorEntry()];
      });
    }
  };

  const toggleSavedInspections = () => {
    setIsSavedInspectionsVisible(!isSavedInspectionsVisible);
  };
  
  if (activeFloorsData.length === 0 && !clientInfo.clientCode) { // Initial state before useEffect might run fully
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

        {isSavedInspectionsVisible && (
          <SavedInspectionsList
            savedInspections={savedInspections}
            onLoadInspection={handleLoadInspection}
            onDeleteInspection={handleDeleteInspection}
          />
        )}

        <div className="my-6 p-4 bg-card shadow-lg rounded-lg">
          <Button
            onClick={() => setIsChecklistVisible(!isChecklistVisible)}
            variant="ghost"
            className="w-full flex justify-between items-center text-left mb-4 text-xl font-semibold font-headline text-primary hover:bg-accent/10"
          >
            Checklist da Vistoria
            {isChecklistVisible ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
          </Button>

          {isChecklistVisible && activeFloorsData.map((floorData, floorIndex) => (
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
                
                {floorData.categories.map(category => (
                  <InspectionCategoryItem
                    key={`${floorData.id}-${category.id}`} // Ensure unique key across floors for categories
                    category={category}
                    onCategoryItemUpdate={(categoryId, update) => handleCategoryItemUpdateForFloor(floorIndex, categoryId, update)}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
        
        <ActionButtonsPanel
          onSave={handleSaveInspection}
          onNewInspection={resetInspectionForm}
          onNewFloor={handleNewFloorInspection}
          onToggleSavedInspections={toggleSavedInspections}
          isSavedInspectionsVisible={isSavedInspectionsVisible}
        />

        <footer className="text-center text-sm text-muted-foreground mt-12 pb-8">
          FireCheck Brazil &copy; {new Date().getFullYear()} - BRAZIL EXTINTORES
        </footer>
      </div>
    </ScrollArea>
  );
}
