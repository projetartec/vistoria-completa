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
import type { InspectionData, InspectionCategoryState, HoseEntry, ExtinguisherEntry } from '@/lib/types';
import { INITIAL_INSPECTION_DATA } from '@/constants/inspection.config';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateInspectionPdf } from '@/lib/pdfGenerator'; // Placeholder
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FireCheckPage() {
  const { toast } = useToast();
  const [currentInspection, setCurrentInspection] = useState<InspectionData>({
    id: Date.now().toString(),
    ...JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA)) // Deep copy
  });
  const [savedInspections, setSavedInspections] = useLocalStorage<InspectionData[]>('firecheck-inspections', []);
  const [isChecklistVisible, setIsChecklistVisible] = useState(true);
  const [isSavedInspectionsVisible, setIsSavedInspectionsVisible] = useState(false);

  const handleClientDataChange = useCallback((field: keyof InspectionData, value: string) => {
    setCurrentInspection(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCategoryChange = useCallback((updatedCategory: InspectionCategoryState) => {
    setCurrentInspection(prev => ({
      ...prev,
      categories: prev.categories.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat),
    }));
  }, []);

  const handleHosesChange = useCallback((updatedHoses: HoseEntry[]) => {
    setCurrentInspection(prev => ({ ...prev, hoses: updatedHoses }));
  }, []);

  const handleExtinguishersChange = useCallback((updatedExtinguishers: ExtinguisherEntry[]) => {
    setCurrentInspection(prev => ({ ...prev, extinguishers: updatedExtinguishers }));
  }, []);

  const resetInspectionForm = useCallback(() => {
    setCurrentInspection({
      id: Date.now().toString(),
      ...JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA)) // Deep copy
    });
    toast({ title: "Novo Formulário", description: "Formulário de vistoria reiniciado." });
  }, [toast]);

  const handleSaveInspection = () => {
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
        return updated;
      }
      return [...prev, inspectionToSave];
    });
    toast({ title: "Vistoria Salva", description: `Vistoria ${inspectionToSave.inspectionNumber} salva com sucesso.` });
  };

  const handleLoadInspection = (inspectionId: string) => {
    const inspectionToLoad = savedInspections.find(insp => insp.id === inspectionId);
    if (inspectionToLoad) {
      setCurrentInspection(JSON.parse(JSON.stringify(inspectionToLoad))); // Deep copy to avoid mutation issues
      setIsSavedInspectionsVisible(false);
      toast({ title: "Vistoria Carregada", description: `Vistoria ${inspectionToLoad.inspectionNumber} carregada.` });
    }
  };

  const handleDeleteInspection = (inspectionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta vistoria? Esta ação não pode ser desfeita.')) {
      setSavedInspections(prev => prev.filter(insp => insp.id !== inspectionId));
      toast({ title: "Vistoria Excluída", description: "A vistoria foi excluída com sucesso.", variant: "destructive" });
      if (currentInspection.id === inspectionId) {
        resetInspectionForm();
      }
    }
  };

  const handleDownloadPdf = async () => {
    if (!currentInspection.clientCode || !currentInspection.clientLocation) {
      toast({ title: "Erro ao Gerar PDF", description: "Preencha os dados do cliente primeiro.", variant: "destructive" });
      return;
    }
    try {
      await generateInspectionPdf(currentInspection);
      // The generateInspectionPdf function will show its own confirmation/alert
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Erro no PDF", description: "Falha ao gerar o PDF.", variant: "destructive" });
    }
  };
  
  const toggleSavedInspections = () => {
    setIsSavedInspectionsVisible(!isSavedInspectionsVisible);
  };

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
                  onCategoryChange={handleCategoryChange}
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
