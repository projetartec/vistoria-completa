
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppHeader } from '@/components/app/app-header';
import { ClientDataForm } from '@/components/app/client-data-form';
import { InspectionCategoryItem } from '@/components/app/inspection-category-item';
import { ActionButtonsPanel } from '@/components/app/action-buttons-panel';
import { SavedInspectionsList } from '@/components/app/saved-inspections-list';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import type { InspectionData, CategoryUpdatePayload, StatusOption, InspectionCategoryState } from '@/lib/types';
import { INITIAL_INSPECTION_DATA } from '@/constants/inspection.config';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FireCheckPage() {
  const { toast } = useToast();
  const [currentInspection, setCurrentInspection] = useState<InspectionData | null>(null);

  const initialSavedInspections = useMemo(() => [], []);
  const [savedInspections, setSavedInspections] = useLocalStorage<InspectionData[]>('firecheck-inspections-v2', initialSavedInspections);

  const [isChecklistVisible, setIsChecklistVisible] = useState(true);
  const [isSavedInspectionsVisible, setIsSavedInspectionsVisible] = useState(false);

  useEffect(() => {
    setCurrentInspection({
      id: Date.now().toString(),
      ...JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA)) 
    });
  }, []);

  const handleClientDataChange = useCallback((field: keyof Omit<InspectionData, 'categories' | 'id' | 'timestamp'>, value: string) => {
    setCurrentInspection(prev => {
      if (!prev || prev[field] === value) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const handleCategoryItemUpdate = useCallback((categoryId: string, update: CategoryUpdatePayload) => {
    setCurrentInspection(prevInspection => {
      if (!prevInspection) return null;

      let inspectionChangedOverall = false;

      const newCategories = prevInspection.categories.map(cat => {
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
                if (sub.id !== update.subItemId) {
                  return sub;
                }
                
                let updatedSubData = { ...sub };
                let subItemStructurallyChanged = false;

                if (update.field === 'subItemStatus' && updatedSubData.status !== (update.value as StatusOption)) {
                  updatedSubData.status = update.value as StatusOption;
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
          default:
            break;
        }
        
        if (categoryStructurallyChanged) {
          inspectionChangedOverall = true;
          return updatedCatData; 
        }
        return cat; 
      });
      
      let actualCategoryDataChanged = false;
      if (prevInspection.categories.length !== newCategories.length) {
        actualCategoryDataChanged = true;
      } else {
        for (let i = 0; i < prevInspection.categories.length; i++) {
          if (prevInspection.categories[i] !== newCategories[i]) {
            actualCategoryDataChanged = true;
            break;
          }
        }
      }

      if (inspectionChangedOverall || actualCategoryDataChanged) {
        return { ...prevInspection, categories: newCategories };
      }
      
      return prevInspection; 
    });
  }, []); 


  const resetInspectionForm = useCallback(() => {
    setCurrentInspection({
      id: Date.now().toString(),
      ...JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA))
    });
    toast({ title: "Novo Formulário", description: "Formulário de vistoria reiniciado." });
  }, [toast]);

  const handleNewFloorInspection = useCallback(() => {
    if (!currentInspection) {
      // If there's no current inspection, just start a new one
      resetInspectionForm();
      toast({
        title: "Novo Formulário Iniciado",
        description: "Preencha todos os dados para o novo andar.",
      });
      return;
    }

    const newFloorInspectionData: InspectionData = {
      id: Date.now().toString(), // New unique ID for the new floor inspection
      clientCode: currentInspection.clientCode, // Keep client code
      clientLocation: currentInspection.clientLocation, // Keep client location
      floor: '', // Clear floor for the user to input the new one
      inspectionNumber: '', // Will be regenerated by ClientDataForm based on clientCode
      categories: JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA.categories)), // Reset checklist
      timestamp: undefined // This inspection is not saved yet
    };
    setCurrentInspection(newFloorInspectionData);
    toast({
      title: "Formulário para Novo Andar",
      description: "Preencha o novo ANDAR. Dados do cliente foram mantidos. Checklist reiniciado.",
    });
  }, [currentInspection, resetInspectionForm, toast]);

  const handleSaveInspection = () => {
    if (!currentInspection) return;
    if (!currentInspection.clientCode || !currentInspection.clientLocation) {
      toast({ title: "Erro ao Salvar", description: "CÓDIGO DO CLIENTE e LOCAL são obrigatórios.", variant: "destructive" });
      return;
    }

    const now = Date.now();
    const inspectionToSave = { ...currentInspection, timestamp: now };

    setSavedInspections(prev => {
      const existingIndex = prev.findIndex(insp => insp.id === inspectionToSave.id);
      let newSavedInspections;
      if (existingIndex > -1) {
        newSavedInspections = [...prev];
        newSavedInspections[existingIndex] = inspectionToSave;
      } else {
        newSavedInspections = [...prev, inspectionToSave];
      }
      return newSavedInspections.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    });
    toast({ title: "Vistoria Salva", description: `Vistoria ${inspectionToSave.inspectionNumber || 'sem número'} salva com sucesso.` });
  };

  const handleLoadInspection = (inspectionId: string) => {
    const inspectionToLoad = savedInspections.find(insp => insp.id === inspectionId);
    if (inspectionToLoad) {
      setCurrentInspection(JSON.parse(JSON.stringify(inspectionToLoad))); 
      setIsSavedInspectionsVisible(false); 
      toast({ title: "Vistoria Carregada", description: `Vistoria ${inspectionToLoad.inspectionNumber || 'sem número'} carregada.` });
    }
  };

  const handleDeleteInspection = (inspectionId: string) => {
    if (typeof window !== 'undefined' && window.confirm('Tem certeza que deseja excluir esta vistoria? Esta ação não pode ser desfeita.')) {
      setSavedInspections(prev => prev.filter(insp => insp.id !== inspectionId));
      toast({ title: "Vistoria Excluída", description: "A vistoria foi excluída com sucesso.", variant: "destructive" });
      if (currentInspection && currentInspection.id === inspectionId) {
        resetInspectionForm(); 
      }
    }
  };

  const toggleSavedInspections = () => {
    setIsSavedInspectionsVisible(!isSavedInspectionsVisible);
  };

  if (!currentInspection) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <p className="text-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <AppHeader />

        <ClientDataForm
          inspectionData={currentInspection}
          onFieldChange={handleClientDataChange}
        />

        <ActionButtonsPanel
          onSave={handleSaveInspection}
          onNewInspection={resetInspectionForm}
          onNewFloor={handleNewFloorInspection} // Pass the new handler
          onToggleSavedInspections={toggleSavedInspections}
          isSavedInspectionsVisible={isSavedInspectionsVisible}
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

          {isChecklistVisible && (
            <>
              {currentInspection.categories.map(category => (
                <InspectionCategoryItem
                  key={category.id}
                  category={category}
                  onCategoryItemUpdate={handleCategoryItemUpdate}
                />
              ))}
            </>
          )}
        </div>

        <footer className="text-center text-sm text-muted-foreground mt-12 pb-8">
          FireCheck Brazil &copy; {new Date().getFullYear()} - BRAZIL EXTINTORES
        </footer>
      </div>
    </ScrollArea>
  );
}
