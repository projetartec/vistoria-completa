
'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { AppHeader } from '@/components/app/app-header';
import { ClientDataForm } from '@/components/app/client-data-form';
import { InspectionCategoryItem } from '@/components/app/inspection-category-item';
import { HoseRegistry } from '@/components/app/hose-registry';
import { ExtinguisherRegistry } from '@/components/app/extinguisher-registry';
import { ActionButtonsPanel } from '@/components/app/action-buttons-panel';
import { SavedInspectionsList } from '@/components/app/saved-inspections-list';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import type { InspectionData, InspectionCategoryState, HoseEntry, ExtinguisherEntry, CategoryUpdatePayload, StatusOption } from '@/lib/types';
import { INITIAL_INSPECTION_DATA } from '@/constants/inspection.config';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateInspectionPdf } from '@/lib/pdfGenerator';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FireCheckPage() {
  const { toast } = useToast();
  const [currentInspection, setCurrentInspection] = useState<InspectionData | null>(null);
  const [savedInspections, setSavedInspections] = useLocalStorage<InspectionData[]>('firecheck-inspections', []);
  const [isChecklistVisible, setIsChecklistVisible] = useState(true);
  const [isSavedInspectionsVisible, setIsSavedInspectionsVisible] = useState(false);

  useEffect(() => {
    // Initialize on the client side to ensure Date.now() is client-specific
    // and to get a deep clone of INITIAL_INSPECTION_DATA
    setCurrentInspection({
      id: Date.now().toString(),
      ...JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA))
    });
  }, []);


  const handleClientDataChange = useCallback((field: keyof InspectionData, value: string) => {
    setCurrentInspection(prev => {
      if (!prev) return null;
      // @ts-ignore
      if (prev[field] === value) return prev;
      // @ts-ignore
      return ({ ...prev, [field]: value });
    });
  }, []);

  const handleCategoryItemUpdate = useCallback(
    (categoryId: string, update: CategoryUpdatePayload) => {
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
              if (cat.subItems) { 
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
                  } else if (update.field === 'subItemObservation' && updatedSubData.observation !== update.value) {
                    updatedSubData.observation = update.value as string;
                    subItemStructurallyChanged = true;
                  } else if (update.field === 'subItemShowObservation' && updatedSubData.showObservation !== update.value) {
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
                } else {
                  updatedCatData.subItems = cat.subItems; 
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

        if (inspectionChangedOverall) {
          return { ...prevInspection, categories: newCategories };
        }
        return prevInspection; 
      });
    },
    [] 
  );


  const handleHosesChange = useCallback((updatedHoses: HoseEntry[]) => {
    setCurrentInspection(prev => {
      if (!prev) return null;
      // Basic reference check first
      if (prev.hoses === updatedHoses) return prev;
      // More thorough check could be JSON.stringify(prev.hoses) === JSON.stringify(updatedHoses)
      // For simplicity, if it's a new array reference and lengths are same, assume it might be the same.
      // This is a common pattern for simple list updates but can be made more robust.
      // For now, if it's a new array, we assume it's a change.
      if (prev.hoses.length === updatedHoses.length && 
          prev.hoses.every((h, i) => h === updatedHoses[i])) { // shallow compare items
        return prev;
      }
      return { ...prev, hoses: updatedHoses };
    });
  }, []);

  const handleExtinguishersChange = useCallback((updatedExtinguishers: ExtinguisherEntry[]) => {
     setCurrentInspection(prev => {
      if (!prev) return null;
      if (prev.extinguishers === updatedExtinguishers) return prev;
       if (prev.extinguishers.length === updatedExtinguishers.length &&
           prev.extinguishers.every((e, i) => e === updatedExtinguishers[i])) {
         return prev;
       }
      return { ...prev, extinguishers: updatedExtinguishers };
    });
  }, []);

  const resetInspectionForm = useCallback(() => {
    setCurrentInspection({
      id: Date.now().toString(), 
      ...JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA))
    });
    toast({ title: "Novo Formulário", description: "Formulário de vistoria reiniciado." });
  }, [toast]);

  const handleSaveInspection = () => {
    if (!currentInspection) return;
    if (!currentInspection.clientCode || !currentInspection.clientLocation) {
      toast({ title: "Erro ao Salvar", description: "Código do Cliente e Local são obrigatórios.", variant: "destructive" });
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
    toast({ title: "Vistoria Salva", description: `Vistoria ${inspectionToSave.inspectionNumber} salva com sucesso.` });
  };

  const handleLoadInspection = (inspectionId: string) => {
    const inspectionToLoad = savedInspections.find(insp => insp.id === inspectionId);
    if (inspectionToLoad) {
      setCurrentInspection(JSON.parse(JSON.stringify(inspectionToLoad)));
      setIsSavedInspectionsVisible(false);
      toast({ title: "Vistoria Carregada", description: `Vistoria ${inspectionToLoad.inspectionNumber} carregada.` });
    }
  };

  const handleDeleteInspection = (inspectionId: string) => {
    // Consider adding a confirmation dialog here using ShadCN's AlertDialog
    // For now, using window.confirm for simplicity
    if (typeof window !== 'undefined' && window.confirm('Tem certeza que deseja excluir esta vistoria? Esta ação não pode ser desfeita.')) {
      setSavedInspections(prev => prev.filter(insp => insp.id !== inspectionId));
      toast({ title: "Vistoria Excluída", description: "A vistoria foi excluída com sucesso.", variant: "destructive" });
      if (currentInspection && currentInspection.id === inspectionId) {
        resetInspectionForm();
      }
    }
  };

  const handleDownloadPdf = async () => {
    if (!currentInspection) return;
    if (!currentInspection.clientCode || !currentInspection.clientLocation) {
      toast({ title: "Erro ao Gerar PDF", description: "Preencha os dados do cliente primeiro.", variant: "destructive" });
      return;
    }
    try {
      await generateInspectionPdf(currentInspection);
      // Toast for PDF generation success can be added in generateInspectionPdf or here
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Erro no PDF", description: "Falha ao gerar o PDF.", variant: "destructive" });
    }
  };

  const toggleSavedInspections = () => {
    setIsSavedInspectionsVisible(!isSavedInspectionsVisible);
  };
  
  if (!currentInspection) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <p className="text-foreground">Carregando dados da vistoria...</p>
        {/* Optionally, add a spinner here */}
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
          onDownloadPdf={handleDownloadPdf}
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
              <HoseRegistry hoses={currentInspection.hoses} onHosesChange={handleHosesChange} />
              <ExtinguisherRegistry extinguishers={currentInspection.extinguishers} onExtinguishersChange={handleExtinguishersChange} />
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
    

    