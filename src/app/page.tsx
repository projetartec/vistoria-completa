
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import type { FullInspectionData, InspectionData, CategoryUpdatePayload, ClientInfo, StatusOption, InspectionCategoryState, CategoryOverallStatus, RegisteredExtinguisher, RegisteredHose } from '@/lib/types';
import { INITIAL_INSPECTION_DATA } from '@/constants/inspection.config';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateInspectionPdf } from '@/lib/pdfGenerator';
import { ChevronDown, ChevronUp, Trash2, Eye, EyeOff } from 'lucide-react';

const createNewFloorEntry = (): InspectionData => {
  const newId = (typeof window !== 'undefined')
    ? `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`
    : `server-temp-id-${Math.random().toString(36).substring(2,9)}`;

  return {
    id: newId,
    ...JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA)),
    floor: '',
    categories: JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA.categories)),
  };
};

const getCategoryOverallStatus = (category: InspectionCategoryState): CategoryOverallStatus => {
  if (category.type === 'standard' && category.subItems) {
    const relevantSubItems = category.subItems.filter(subItem => !subItem.isRegistry);
    if (relevantSubItems.length === 0) {
      return 'all-items-selected';
    }
    const allSelected = relevantSubItems.every(subItem => subItem.status !== undefined);
    return allSelected ? 'all-items-selected' : 'some-items-pending';
  } else if (category.type === 'special' || category.type === 'pressure') {
    return category.status !== undefined ? 'all-items-selected' : 'some-items-pending';
  }
  return 'some-items-pending';
};

const calculateNextInspectionNumber = (
  clientCode: string,
  clientLocation: string
): string => {
  const trimmedClientCode = clientCode.trim();
  const trimmedClientLocation = clientLocation.trim();

  if (!trimmedClientCode || !trimmedClientLocation) {
    return '';
  }

  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return randomNumber.toString();
};


export default function FireCheckPage() {
  const { toast } = useToast();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [blockAutoSaveOnce, setBlockAutoSaveOnce] = useState(false);

  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientLocation: '',
    clientCode: '',
    inspectionNumber: '',
    inspectionDate: new Date().toISOString().split('T')[0],
  });

  const [activeFloorsData, setActiveFloorsData] = useState<InspectionData[]>([]);
  const [isClientInitialized, setIsClientInitialized] = useState(false);

  const initialSavedFullInspections = useMemo(() => [], []);
  const [savedInspections, setSavedInspections] = useLocalStorage<FullInspectionData[]>('firecheck-full-inspections-v2', initialSavedFullInspections);

  const [savedLocations, setSavedLocations] = useLocalStorage<string[]>('firecheck-saved-locations-v1', []);
  // Removed newLocationInput state
  // const [newLocationInput, setNewLocationInput] = useState('');


  const [isChecklistVisible, setIsChecklistVisible] = useState(true);
  const [isSavedInspectionsVisible, setIsSavedInspectionsVisible] = useState(false);
  const [uploadedLogoDataUrl, setUploadedLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  }, []);

  useEffect(() => {
    setActiveFloorsData([createNewFloorEntry()]);
    setIsClientInitialized(true);
  }, []);

  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedLogoDataUrl(reader.result as string);
        toast({ title: "Logo Carregado", description: "O logo foi carregado com sucesso." });
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);


  const handleClientInfoChange = useCallback((field: keyof ClientInfo, value: string) => {
    setClientInfo(prevClientInfo => {
      const newClientInfoState = { ...prevClientInfo, [field]: value };
      
      if (field === 'clientCode' || field === 'clientLocation') {
        newClientInfoState.inspectionNumber = calculateNextInspectionNumber(
          newClientInfoState.clientCode,
          newClientInfoState.clientLocation
        );
      }
      return newClientInfoState;
    });
  }, []);

  // Removed handleAddNewLocation function
  /*
  const handleAddNewLocation = useCallback(() => {
    const trimmedLocation = newLocationInput.trim();
    if (!trimmedLocation) {
      toast({ title: "Erro", description: "O nome do local não pode ser vazio.", variant: "destructive" });
      return;
    }
    if (savedLocations.some(loc => loc.toLowerCase() === trimmedLocation.toLowerCase())) {
      toast({ title: "Local Existente", description: "Este local já está cadastrado.", variant: "destructive" });
      return;
    }
    setSavedLocations(prevLocations => [...prevLocations, trimmedLocation].sort((a, b) => a.localeCompare(b)));
    setNewLocationInput('');
    toast({ title: "Local Adicionado", description: `"${trimmedLocation}" foi adicionado à lista de locais.` });
  }, [newLocationInput, savedLocations, setSavedLocations, toast]);
  */


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
                  const newSubItemState = { ...sub };

                  if (update.field === 'subItemStatus' && newSubItemState.status !== (update.value as StatusOption | undefined)) { 
                    newSubItemState.status = update.value as StatusOption | undefined; 
                    changed = true; 
                  } else if (update.field === 'subItemObservation' && newSubItemState.observation !== (update.value as string)) { 
                    newSubItemState.observation = update.value as string; 
                    changed = true; 
                  } else if (update.field === 'subItemShowObservation' && newSubItemState.showObservation !== (update.value as boolean)) { 
                    newSubItemState.showObservation = update.value as boolean; 
                    changed = true; 
                  }
                  
                  if (changed) categoryStructurallyChanged = true;
                  return changed ? newSubItemState : sub;
                });
              }
              break;
            case 'addRegisteredExtinguisher':
              if (cat.subItems && update.subItemId) {
                updatedCatData.subItems = cat.subItems.map(sub => {
                  if (sub.id !== update.subItemId || !sub.isRegistry) return sub;
                  const newExtinguisher: RegisteredExtinguisher = {
                    ...update.value,
                    id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 11)}`,
                  };
                  const newExtinguishersArray = [...(sub.registeredExtinguishers || []), newExtinguisher];
                  categoryStructurallyChanged = true;
                   if (typeof window !== 'undefined') {
                     console.log('[ADD EXT]', JSON.stringify(newExtinguisher), 'Current items in array for this subitem:', newExtinguishersArray.length, 'Existing items before add:', (sub.registeredExtinguishers || []).length);
                  }
                  return { ...sub, registeredExtinguishers: newExtinguishersArray };
                });
              }
              break;
            case 'removeRegisteredExtinguisher':
              if (cat.subItems && update.subItemId && update.extinguisherId) {
                updatedCatData.subItems = cat.subItems.map(sub => {
                  if (sub.id !== update.subItemId || !sub.isRegistry || !sub.registeredExtinguishers) return sub;
                  const newExtinguishersArray = sub.registeredExtinguishers.filter(ext => ext.id !== update.extinguisherId);
                  categoryStructurallyChanged = true;
                  return { ...sub, registeredExtinguishers: newExtinguishersArray };
                });
              }
              break;
            case 'addRegisteredHose':
              if (cat.subItems && update.subItemId) {
                updatedCatData.subItems = cat.subItems.map(sub => {
                  if (sub.id !== update.subItemId || !sub.isRegistry) return sub;
                  const newHose: RegisteredHose = {
                    ...update.value,
                     id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 11)}`,
                  };
                  const newHosesArray = [...(sub.registeredHoses || []), newHose];
                  categoryStructurallyChanged = true;
                  return { ...sub, registeredHoses: newHosesArray };
                });
              }
              break;
            case 'removeRegisteredHose':
              if (cat.subItems && update.subItemId && update.hoseId) {
                updatedCatData.subItems = cat.subItems.map(sub => {
                  if (sub.id !== update.subItemId || !sub.isRegistry || !sub.registeredHoses) return sub;
                  const newHosesArray = sub.registeredHoses.filter(hose => hose.id !== update.hoseId);
                  categoryStructurallyChanged = true;
                  return { ...sub, registeredHoses: newHosesArray };
                });
              }
              break;
            case 'markAllSubItemsNA':
              if (cat.subItems && cat.type === 'standard') {
                let atLeastOneSubItemChanged = false;
                updatedCatData.subItems = cat.subItems.map(sub => {
                  if (!sub.isRegistry && sub.status !== 'N/A') {
                    atLeastOneSubItemChanged = true;
                    return { ...sub, status: 'N/A' as StatusOption, showObservation: false, observation: '' };
                  }
                  return sub;
                });
                if (atLeastOneSubItemChanged) categoryStructurallyChanged = true;
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
    const defaultInspectionDate = new Date().toISOString().split('T')[0];
    const defaultClientInfo: ClientInfo = {
      clientLocation: '',
      clientCode: '',
      inspectionNumber: '', 
      inspectionDate: defaultInspectionDate,
    };
    setClientInfo(defaultClientInfo); 
    setActiveFloorsData([createNewFloorEntry()]);
    setBlockAutoSaveOnce(true); 
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


  const handleSaveInspection = useCallback((isAutoSave = false) => {
    if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionNumber) {
      if (!isAutoSave) {
        toast({ title: "Erro ao Salvar", description: "CÓDIGO DO CLIENTE, LOCAL e NÚMERO DA VISTORIA são obrigatórios.", variant: "destructive" });
      } else {
        console.log("Auto-save: Client info/Inspection Number incomplete, not saving.");
      }
      return;
    }
     if (!clientInfo.inspectionDate) {
      if (!isAutoSave) {
        toast({ title: "Erro ao Salvar", description: "DATA DA VISTORIA é obrigatória.", variant: "destructive" });
      } else {
        console.log("Auto-save: Inspection date missing, not saving.");
      }
      return;
    }

    const namedFloors = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    if (namedFloors.length === 0) {
      if (!isAutoSave) {
        toast({ title: "Nenhum Andar Nomeado", description: "Adicione e nomeie pelo menos um andar para salvar a vistoria.", variant: "destructive" });
      } else {
        console.log("Auto-save: No named floors, not saving.");
      }
      return;
    }

    const fullInspectionToSave: FullInspectionData = {
      id: clientInfo.inspectionNumber, 
      clientInfo: { ...clientInfo },
      floors: namedFloors.map(floor => ({
        id: floor.id,
        floor: floor.floor,
        categories: JSON.parse(JSON.stringify(floor.categories))
      })),
      timestamp: Date.now(),
      uploadedLogoDataUrl: uploadedLogoDataUrl
    };

    setSavedInspections(prevSaved => {
      let newSavedList = [...prevSaved];
      const existingIndex = newSavedList.findIndex(insp => insp.id === fullInspectionToSave.id);
      if (existingIndex > -1) {
        newSavedList[existingIndex] = fullInspectionToSave;
      } else {
        newSavedList.push(fullInspectionToSave);
      }
      return newSavedList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    });

    if (isAutoSave) {
      console.log(`Auto-save: Vistoria ${fullInspectionToSave.id} atualizada.`);
    } else {
      toast({
        title: "Vistoria Salva",
        description: `A vistoria ${fullInspectionToSave.id} com ${fullInspectionToSave.floors.length} andar(es) foi salva com sucesso.`
      });
    }
  }, [clientInfo, activeFloorsData, setSavedInspections, toast, uploadedLogoDataUrl]);


  useEffect(() => {
    if (blockAutoSaveOnce) {
      setBlockAutoSaveOnce(false); 
      return;
    }

    if (isClientInitialized) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        console.log('Attempting auto-save...');
        handleSaveInspection(true); 
      }, 2500); 
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [clientInfo, activeFloorsData, isClientInitialized, handleSaveInspection, blockAutoSaveOnce, uploadedLogoDataUrl]);


  const handleLoadInspection = (fullInspectionId: string) => {
    const inspectionToLoad = savedInspections.find(insp => insp.id === fullInspectionId);
    if (inspectionToLoad) {
      setBlockAutoSaveOnce(true); 
      setClientInfo({ ...inspectionToLoad.clientInfo }); 
      setUploadedLogoDataUrl(inspectionToLoad.uploadedLogoDataUrl || null);

      const sanitizedFloors = inspectionToLoad.floors.map(floor => ({
        ...floor,
        id: (floor.id && typeof floor.id === 'string' && !floor.id.startsWith('server-temp-id-'))
            ? floor.id
            : `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
        categories: floor.categories.map(cat => ({
          ...cat,
          subItems: cat.subItems ? cat.subItems.map(sub => ({
            ...sub,
            registeredExtinguishers: sub.registeredExtinguishers ? sub.registeredExtinguishers.map(ext => ({
              ...ext,
              id: (ext.id && typeof ext.id === 'string' && !ext.id.includes('NaN') && !ext.id.startsWith('server-temp-id-'))
                  ? ext.id
                  : `${Date.now().toString()}-${Math.random().toString(36).substring(2, 10)}-ext`
            })) : [],
            registeredHoses: sub.registeredHoses ? sub.registeredHoses.map(hose => ({
              ...hose,
              id: (hose.id && typeof hose.id === 'string' && !hose.id.includes('NaN') && !hose.id.startsWith('server-temp-id-'))
                  ? hose.id
                  : `${Date.now().toString()}-${Math.random().toString(36).substring(2, 10)}-hose`
            })) : []
          })) : []
        }))
      }));
      
      setActiveFloorsData(sanitizedFloors);
      setIsSavedInspectionsVisible(false);
      setIsChecklistVisible(true);
      toast({ title: "Vistoria Carregada", description: `Vistoria ${inspectionToLoad.id} carregada.` });
    }
  };

  const handleDeleteInspection = useCallback((fullInspectionId: string) => {
    if (typeof window !== 'undefined' && window.confirm('Tem certeza que deseja excluir esta vistoria salva? Esta ação não pode ser desfeita.')) {
      setSavedInspections(prev => prev.filter(insp => insp.id !== fullInspectionId));
      toast({ title: "Vistoria Excluída", description: "A vistoria salva foi excluída com sucesso.", variant: "destructive" });

      if (clientInfo.inspectionNumber === fullInspectionId) {
        resetInspectionForm();
      }
    }
  }, [setSavedInspections, toast, clientInfo.inspectionNumber, resetInspectionForm]);

  const handleDeleteMultipleInspections = useCallback((inspectionIds: string[]) => {
    console.log('Attempting to delete inspection IDs:', inspectionIds);
    setSavedInspections(prev => {
      const filteredList = prev.filter(insp => !inspectionIds.includes(insp.id));
      const newList = [...filteredList]; // Explicitly create a new array reference
      console.log('New list after filtering (and spreading):', newList.length, 'items. Previous list:', prev.length, 'items.');
      return newList;
    });
    toast({
      title: "Vistorias Excluídas",
      description: `${inspectionIds.length} vistoria(s) foram excluídas com sucesso.`,
      variant: "destructive"
    });

    if (clientInfo.inspectionNumber && inspectionIds.includes(clientInfo.inspectionNumber)) {
      console.log('Current inspection was deleted, resetting form.');
      resetInspectionForm();
    }
  }, [setSavedInspections, toast, clientInfo.inspectionNumber, resetInspectionForm]);


  const handleGeneratePdf = useCallback(() => {
    if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionDate || !clientInfo.inspectionNumber) {
      toast({ title: "Dados Incompletos", description: "CÓDIGO DO CLIENTE, LOCAL, DATA e NÚMERO DA VISTORIA são obrigatórios para gerar o PDF.", variant: "destructive" });
      return;
    }
    const floorsToPrint = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    if (floorsToPrint.length === 0) {
        toast({ title: "Nenhum Andar Nomeado", description: "Adicione e nomeie pelo menos um andar para gerar o PDF.", variant: "destructive" });
        return;
    }
    generateInspectionPdf(clientInfo, floorsToPrint, uploadedLogoDataUrl);
  }, [clientInfo, activeFloorsData, toast, uploadedLogoDataUrl]);

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
        <AppHeader 
          uploadedLogoDataUrl={uploadedLogoDataUrl}
          onLogoUpload={handleLogoUpload}
        />

        <ClientDataForm
          clientInfoData={clientInfo}
          onClientInfoChange={handleClientInfoChange}
          savedLocations={savedLocations}
          // Removed props related to new location input and adding
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
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-x-3 flex-grow mr-2">
                        <Label htmlFor={`floorName-${floorData.id}`} className="text-lg font-medium whitespace-nowrap">
                          ANDAR:
                        </Label>
                        <Input
                          id={`floorName-${floorData.id}`}
                          value={floorData.floor}
                          onChange={(e) => handleFloorSpecificFieldChange(floorIndex, 'floor', e.target.value)}
                          placeholder="Ex: Térreo, 1A, Subsolo"
                          className="flex-grow"
                        />
                      </div>
                      {activeFloorsData.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFloor(floorIndex)}
                          className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                          title="Remover este andar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                    
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
          onSave={() => handleSaveInspection(false)}
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
            onDeleteMultipleInspections={handleDeleteMultipleInspections}
          />
        )}

        <footer className="text-center text-sm text-muted-foreground mt-12 pb-8">
          FireCheck Brazil &copy; {new Date().getFullYear()} - BRAZIL EXTINTORES
        </footer>
      </div>
    </ScrollArea>
  );
}
