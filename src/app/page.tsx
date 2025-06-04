
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
  }, []); // Empty dependency array, runs once on mount


  const handleClientDataChange = useCallback((field: keyof InspectionData, value: string) => {
    setCurrentInspection(prev => {
      if (!prev) return null;
      // Check if the value actually changed to prevent unnecessary re-renders
      if (prev[field] === value) return prev; // Return previous state if no change
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
            return cat; // Return original category if not the target
          }

          // Shallow copy the target category
          let updatedCatData = { ...cat };
          let categoryStructurallyChanged = false;

          switch (update.field) {
            case 'isExpanded':
              if (updatedCatData.isExpanded !== update.value) {
                updatedCatData.isExpanded = update.value;
                categoryStructurallyChanged = true;
              }
              break;
            case 'status': // For special type
              if (updatedCatData.status !== update.value) {
                updatedCatData.status = update.value;
                categoryStructurallyChanged = true;
              }
              break;
            case 'observation': // For special type
              if (updatedCatData.observation !== update.value) {
                updatedCatData.observation = update.value;
                categoryStructurallyChanged = true;
              }
              break;
            case 'showObservation': // For special type
              if (updatedCatData.showObservation !== update.value) {
                updatedCatData.showObservation = update.value;
                categoryStructurallyChanged = true;
              }
              break;
            case 'pressureValue': // For pressure type
              if (updatedCatData.pressureValue !== update.value) {
                updatedCatData.pressureValue = update.value;
                categoryStructurallyChanged = true;
              }
              break;
            case 'pressureUnit': // For pressure type
              if (updatedCatData.pressureUnit !== (update.value as InspectionCategoryState['pressureUnit'])) {
                updatedCatData.pressureUnit = update.value as InspectionCategoryState['pressureUnit'];
                categoryStructurallyChanged = true;
              }
              break;
            case 'subItemStatus':
            case 'subItemObservation':
            case 'subItemShowObservation':
              if (cat.subItems) { // Use original cat.subItems for mapping
                let subItemsArrayChangedInternally = false;
                const newSubItems = cat.subItems.map(sub => {
                  if (sub.id !== update.subItemId) {
                    return sub; // Return original sub-item if not the target
                  }

                  let updatedSubData = { ...sub }; // Shallow copy the target sub-item
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
                    return updatedSubData; // Return new sub-item data if changed
                  }
                  return sub; // Return original sub-item if no change
                });

                if (subItemsArrayChangedInternally) {
                  updatedCatData.subItems = newSubItems; // Assign new array of sub-items
                  categoryStructurallyChanged = true;
                } else {
                  // If no sub-item changed, ensure subItems ref is the original one
                  updatedCatData.subItems = cat.subItems; 
                }
              }
              break;
            default:
              // Should not happen with defined CategoryUpdatePayload types
              break;
          }

          if (categoryStructurallyChanged) {
            inspectionChangedOverall = true;
            return updatedCatData; // Return new category data if changed
          }
          return cat; // Return original category if no structural change
        });

        if (inspectionChangedOverall) {
          return { ...prevInspection, categories: newCategories };
        }
        return prevInspection; // Return previous inspection state if no overall change
      });
    },
    [] // This callback itself is stable
  );


  const handleHosesChange = useCallback((updatedHoses: HoseEntry[]) => {
    setCurrentInspection(prev => {
      if (!prev) return null;
      // Check if hoses actually changed to prevent unnecessary re-renders
      if (prev.hoses === updatedHoses) return prev; // Basic reference check first
      // Deeper check if lengths are different or content differs (can be expensive)
      // For now, assume if updatedHoses is a new array, it's a change.
      return { ...prev, hoses: updatedHoses };
    });
  }, []);

  const handleExtinguishersChange = useCallback((updatedExtinguishers: ExtinguisherEntry[]) => {
     setCurrentInspection(prev => {
      if (!prev) return null;
      if (prev.extinguishers === updatedExtinguishers) return prev;
      return { ...prev, extinguishers: updatedExtinguishers };
    });
  }, []);

  const resetInspectionForm = useCallback(() => {
    setCurrentInspection({
      id: Date.now().toString(), // New ID for new form
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
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = inspectionToSave;
        return updated.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
      return [...prev, inspectionToSave].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    });
    toast({ title: "Vistoria Salva", description: `Vistoria ${inspectionToSave.inspectionNumber} salva com sucesso.` });
  };

  const handleLoadInspection = (inspectionId: string) => {
    const inspectionToLoad = savedInspections.find(insp => insp.id === inspectionId);
    if (inspectionToLoad) {
      // Deep clone when loading to prevent shared references if it's edited then loaded again
      setCurrentInspection(JSON.parse(JSON.stringify(inspectionToLoad)));
      setIsSavedInspectionsVisible(false);
      toast({ title: "Vistoria Carregada", description: `Vistoria ${inspectionToLoad.inspectionNumber} carregada.` });
    }
  };

  const handleDeleteInspection = (inspectionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta vistoria? Esta ação não pode ser desfeita.')) {
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
      <div className="flex justify-center items-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-screen">
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
            className="w-full flex justify-between items-center text-left mb-4 text-xl font-semibold font-headline"
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
    
