
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
import type { FullInspectionData, InspectionData, CategoryUpdatePayload, ClientInfo, StatusOption, InspectionCategoryState, CategoryOverallStatus, RegisteredExtinguisher, RegisteredHose, SubItemState } from '@/lib/types';
import { INITIAL_INSPECTION_DATA, INSPECTION_CONFIG } from '@/constants/inspection.config';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateInspectionPdf } from '@/lib/pdfGenerator';
import { ChevronDown, ChevronUp, Trash2, Eye, EyeOff } from 'lucide-react';

const createNewFloorEntry = (): InspectionData => {
  const newId = (typeof window !== 'undefined')
    ? `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`
    : `server-temp-id-${Math.random().toString(36).substring(2,9)}`;

  return {
    id: newId,
    ...JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA)), // Deep copy
    floor: '',
    categories: JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA.categories)), // Deep copy
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
    inspectedBy: '',
  });

  const [activeFloorsData, setActiveFloorsData] = useState<InspectionData[]>([]);
  const [isClientInitialized, setIsClientInitialized] = useState(false);

  const initialSavedFullInspections = useMemo(() => [], []);
  const [savedInspections, setSavedInspections] = useLocalStorage<FullInspectionData[]>('firecheck-full-inspections-v2', initialSavedFullInspections);

  const [savedLocations, setSavedLocations] = useLocalStorage<string[]>('firecheck-saved-locations-v1', []);


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
        if (value && field === 'clientLocation') {
            setSavedLocations(prevLocs => {
                const lowerCaseValue = value.trim().toLowerCase();
                const exists = prevLocs.some(loc => loc.toLowerCase() === lowerCaseValue);
                if (!exists && value.trim()) {
                    return [...prevLocs, value.trim()].sort((a,b) => a.localeCompare(b));
                }
                return prevLocs;
            });
        }
      }
      return newClientInfoState;
    });
  }, [setSavedLocations]);


  const handleFloorSpecificFieldChange = useCallback((floorIndex: number, field: keyof Pick<InspectionData, 'floor'>, value: string) => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map((floor, index) =>
        index === floorIndex ? { ...floor, [field]: value } : floor
      )
    );
  }, []);

  const handleCategoryItemUpdateForFloor = useCallback((floorIndex: number, categoryId: string, update: CategoryUpdatePayload) => {
    setActiveFloorsData(prevFloors => {
      return prevFloors.map((currentFloorData, fIndex) => {
        if (fIndex !== floorIndex) {
          return currentFloorData;
        }
        
        let inspectionChangedOverall = false;
        let autoCollapsedCategoryId: string | null = null;

        const intermediateCategories = currentFloorData.categories.map(cat => {
          if (cat.id !== categoryId) {
            return cat;
          }
          
          let updatedCatData = { ...cat };
          let categoryStructurallyChanged = false; 
          const explicitExpansionChange = update.field === 'isExpanded';

          switch (update.field) {
            case 'isExpanded':
              if (updatedCatData.isExpanded !== update.value) {
                updatedCatData.isExpanded = update.value;
                inspectionChangedOverall = true; 
              }
              break;
            case 'status':
              if (updatedCatData.status !== update.value) {
                updatedCatData.status = update.value; categoryStructurallyChanged = true;
              }
              break;
            case 'observation':
              if (updatedCatData.observation !== update.value) {
                updatedCatData.observation = update.value; categoryStructurallyChanged = true;
              }
              break;
            case 'showObservation':
              if (updatedCatData.showObservation !== update.value) {
                updatedCatData.showObservation = update.value; categoryStructurallyChanged = true;
              }
              break;
            case 'pressureValue':
              if (updatedCatData.pressureValue !== update.value) {
                updatedCatData.pressureValue = update.value; categoryStructurallyChanged = true;
              }
              break;
            case 'pressureUnit':
              if (updatedCatData.pressureUnit !== update.value) {
                updatedCatData.pressureUnit = update.value as InspectionCategoryState['pressureUnit']; categoryStructurallyChanged = true;
              }
              break;
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
            case 'addSubItem':
              if (cat.type === 'standard' && update.value.trim() !== '') {
                const newSubItem: SubItemState = {
                  id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  name: update.value.trim(),
                  status: undefined,
                  observation: '',
                  showObservation: false,
                  isRegistry: false,
                };
                updatedCatData.subItems = [...(updatedCatData.subItems || []), newSubItem];
                categoryStructurallyChanged = true;
                 setTimeout(() => {
                    toast({ title: "Subitem Adicionado", description: `Subitem "${newSubItem.name}" adicionado.`});
                }, 0);
              }
              break;
            case 'removeSubItem':
              if (cat.subItems && update.subItemId) {
                updatedCatData.subItems = cat.subItems.filter(sub => sub.id !== update.subItemId);
                categoryStructurallyChanged = true;
                setTimeout(() => {
                    toast({ title: "Subitem Removido", variant: "destructive" });
                }, 0);
              }
              break;
            default: break;
          }
          
          if (!explicitExpansionChange && categoryStructurallyChanged) {
            let shouldAutoCollapse = false;
            if (updatedCatData.type === 'standard' && updatedCatData.subItems) {
              const relevantSubItems = updatedCatData.subItems.filter(sub => !sub.isRegistry);
              if (relevantSubItems.length > 0) {
                  const allRelevantSubItemsCompleted = relevantSubItems.every(sub => sub.status !== undefined);
                  if (allRelevantSubItemsCompleted) {
                      shouldAutoCollapse = true;
                  }
              }
            } else if (updatedCatData.type === 'special' || updatedCatData.type === 'pressure') {
                if (updatedCatData.status !== undefined) {
                    shouldAutoCollapse = true;
                }
            }

            if (shouldAutoCollapse && cat.isExpanded) { // Only auto-collapse if it was expanded
                updatedCatData.isExpanded = false;
                autoCollapsedCategoryId = cat.id; 
            }
          }

          if (categoryStructurallyChanged) { 
            inspectionChangedOverall = true;
          }
          
          return updatedCatData;
        });

        let finalCategories = intermediateCategories;
        if (autoCollapsedCategoryId) {
          const collapsedCategoryIndex = intermediateCategories.findIndex(c => c.id === autoCollapsedCategoryId);
          if (collapsedCategoryIndex !== -1 && collapsedCategoryIndex + 1 < intermediateCategories.length) {
            finalCategories = intermediateCategories.map((cat, idx) => {
              if (idx === collapsedCategoryIndex + 1 && !cat.isExpanded) { // Only expand if not already expanded
                return { ...cat, isExpanded: true };
              }
              return cat;
            });
            if (finalCategories.some((cat, idx) => cat.isExpanded !== intermediateCategories[idx].isExpanded)) {
                 inspectionChangedOverall = true;
            }
          }
        }
        
        if (inspectionChangedOverall) {
          return { ...currentFloorData, categories: finalCategories };
        }
        return currentFloorData;
      });
    });
  }, [toast]);


  const resetInspectionForm = useCallback(() => {
    const defaultInspectionDate = new Date().toISOString().split('T')[0];
    const defaultClientInfo: ClientInfo = {
      clientLocation: '',
      clientCode: '',
      inspectionNumber: '', 
      inspectionDate: defaultInspectionDate,
      inspectedBy: '',
    };
    setClientInfo(defaultClientInfo); 
    setActiveFloorsData([createNewFloorEntry()]);
    setBlockAutoSaveOnce(true); 
    toast({ title: "Novo Formulário", description: "Formulário de vistoria reiniciado." });
  }, [toast]);

  const handleNewFloorInspection = useCallback(() => {
    setActiveFloorsData(prevFloors => {
      const newFloorId = `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`;
      let newFloorCategories: InspectionCategoryState[];
  
      if (prevFloors.length > 0) {
        const lastFloor = prevFloors[prevFloors.length - 1];
        newFloorCategories = lastFloor.categories.map(lastFloorCat => {
          const newCatState: InspectionCategoryState = {
            ...lastFloorCat, 
            isExpanded: false, 
            status: undefined, 
            observation: '',  
            showObservation: false, 
            pressureValue: '', 
            pressureUnit: '',
          };
  
          if (lastFloorCat.type === 'standard' && lastFloorCat.subItems) {
            newCatState.subItems = JSON.parse(JSON.stringify(lastFloorCat.subItems)).map((subItem: SubItemState) => {
              const copiedSubItem = { ...subItem }; 
              
              copiedSubItem.status = undefined;
              copiedSubItem.observation = '';
              copiedSubItem.showObservation = false;
              
              if (subItem.isRegistry) {
                if (subItem.id === 'extintor_cadastro') {
                   copiedSubItem.registeredExtinguishers = subItem.registeredExtinguishers ? JSON.parse(JSON.stringify(subItem.registeredExtinguishers)) : [];
                } else if (subItem.id === 'hidrantes_cadastro_mangueiras') {
                   copiedSubItem.registeredHoses = subItem.registeredHoses ? JSON.parse(JSON.stringify(subItem.registeredHoses)) : [];
                }
              }
              return copiedSubItem;
            });
          }
          return newCatState;
        });
      } else {
        newFloorCategories = INSPECTION_CONFIG.map(configCat => ({
          id: configCat.id,
          title: configCat.title,
          type: configCat.type,
          isExpanded: false,
          ...(configCat.type === 'standard' && {
            subItems: configCat.subItems!.map(subItem => ({
              id: subItem.id,
              name: subItem.name,
              status: undefined,
              observation: '',
              showObservation: false,
              isRegistry: subItem.isRegistry || false,
              ...(subItem.isRegistry && subItem.id === 'extintor_cadastro' && { registeredExtinguishers: [] }),
              ...(subItem.isRegistry && subItem.id === 'hidrantes_cadastro_mangueiras' && { registeredHoses: [] }),
            })),
          }),
          ...(configCat.type === 'special' && {
            status: undefined,
            observation: '',
            showObservation: false,
          }),
          ...(configCat.type === 'pressure' && {
            status: undefined,
            pressureValue: '',
            pressureUnit: '' as InspectionCategoryState['pressureUnit'],
            observation: '',
            showObservation: false,
          }),
        }));
      }
  
      const newFloorEntry: InspectionData = {
        id: newFloorId,
        floor: '', 
        categories: newFloorCategories,
      };
  
      return [...prevFloors, newFloorEntry];
    });
  
    toast({
      title: "Novo Andar Adicionado",
      description: "Estrutura, ordem, itens cadastrados (extintores/mangueiras) e subitens personalizados foram copiados do andar anterior. Outros itens foram reiniciados.",
    });
  }, [toast]);

  const handleRemoveFloor = useCallback((floorIndex: number) => {
    if (activeFloorsData.length <= 1) {
      toast({ title: "Ação Inválida", description: "Deve haver pelo menos um andar.", variant: "destructive" });
      return;
    }
    setActiveFloorsData(prev => prev.filter((_, index) => index !== floorIndex));
    toast({ title: "Andar Removido", description: "O formulário do andar foi removido.", variant: "default" });
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
      setClientInfo({ 
        ...inspectionToLoad.clientInfo,
        inspectedBy: inspectionToLoad.clientInfo.inspectedBy || '', 
      }); 
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
            id: (sub.id && typeof sub.id === 'string' && !sub.id.includes('NaN') && !sub.id.startsWith('server-temp-id-') && !sub.id.startsWith('custom-')) 
                ? sub.id 
                : sub.id.startsWith('custom-') ? sub.id : `loaded-sub-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
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
    setSavedInspections(prev => prev.filter(insp => insp.id !== fullInspectionId));
    toast({ title: "Vistoria Excluída", description: "A vistoria salva foi excluída com sucesso.", variant: "destructive" });

    if (clientInfo.inspectionNumber === fullInspectionId) {
      resetInspectionForm();
    }
  }, [setSavedInspections, toast, clientInfo.inspectionNumber, resetInspectionForm]);

  const handleDeleteMultipleInspections = useCallback((inspectionIds: string[]) => {
    console.log('Attempting to delete inspection IDs:', inspectionIds);
    setSavedInspections(prev => {
      const filteredList = prev.filter(insp => !inspectionIds.includes(insp.id));
      const newList = [...filteredList]; 
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

  const handleCollapseAllGlobal = useCallback(() => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map(floor => ({
        ...floor,
        categories: floor.categories.map(cat => ({ ...cat, isExpanded: false })),
      }))
    );
    toast({ title: "Checklist Recolhido", description: "Todos os itens do checklist foram recolhidos." });
  }, [toast]);

  const handleExpandAllGlobal = useCallback(() => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map(floor => ({
        ...floor,
        categories: floor.categories.map(cat => ({ ...cat, isExpanded: true })),
      }))
    );
    toast({ title: "Checklist Expandido", description: "Todos os itens do checklist foram expandidos." });
  }, [toast]);

  const handleExpandAllForFloor = useCallback((floorIndex: number) => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map((floor, fIndex) => {
        if (fIndex === floorIndex) {
          return {
            ...floor,
            categories: floor.categories.map(cat => ({ ...cat, isExpanded: true })),
          };
        }
        return floor;
      })
    );
    toast({ title: `Itens do Andar ${activeFloorsData[floorIndex]?.floor || floorIndex + 1} Expandidos` });
  }, [activeFloorsData, toast]);
  
  const handleCollapseAllForFloor = useCallback((floorIndex: number) => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map((floor, fIndex) => {
        if (fIndex === floorIndex) {
          return {
            ...floor,
            categories: floor.categories.map(cat => ({ ...cat, isExpanded: false })),
          };
        }
        return floor;
      })
    );
    toast({ title: `Itens do Andar ${activeFloorsData[floorIndex]?.floor || floorIndex + 1} Recolhidos` });
  }, [activeFloorsData, toast]);


  const handleMoveCategoryItem = useCallback((floorIndex: number, categoryId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map((floor, fIndex) => {
        if (fIndex !== floorIndex) {
          return floor;
        }
        const categories = [...floor.categories]; 
        const itemIndex = categories.findIndex(cat => cat.id === categoryId);
  
        if (itemIndex === -1) return floor; 
  
        if (direction === 'up' && itemIndex > 0) {
          const temp = categories[itemIndex];
          categories[itemIndex] = categories[itemIndex - 1];
          categories[itemIndex - 1] = temp;
        } else if (direction === 'down' && itemIndex < categories.length - 1) {
          const temp = categories[itemIndex];
          categories[itemIndex] = categories[itemIndex + 1];
          categories[itemIndex + 1] = temp;
        } else if (direction === 'top' && itemIndex > 0) {
          const [itemToMove] = categories.splice(itemIndex, 1);
          categories.unshift(itemToMove);
        } else if (direction === 'bottom' && itemIndex < categories.length - 1) {
          const [itemToMove] = categories.splice(itemIndex, 1);
          categories.push(itemToMove);
        }
        return { ...floor, categories };
      })
    );
  }, []);

  const handleRemoveCategoryFromFloor = useCallback((floorIndex: number, categoryId: string) => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map((floor, fIndex) => {
        if (fIndex !== floorIndex) {
          return floor;
        }
        return {
          ...floor,
          categories: floor.categories.filter(cat => cat.id !== categoryId),
        };
      })
    );
    toast({ title: "Categoria Removida", description: "A categoria foi removida deste andar.", variant: "default" });
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
                <Button onClick={handleExpandAllGlobal} variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" /> Mostrar Todos (Global)
                </Button>
                <Button onClick={handleCollapseAllGlobal} variant="outline" size="sm">
                  <EyeOff className="mr-2 h-4 w-4" /> Esconder Todos (Global)
                </Button>
              </div>

              {activeFloorsData.map((floorData, floorIndex) => (
                <Card key={floorData.id} className="mb-6 shadow-md overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
                      <div className="flex items-center gap-x-3 flex-grow mr-2 w-full sm:w-auto">
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
                      <div className="flex space-x-2 flex-shrink-0 self-start sm:self-center">
                         <Button onClick={() => handleExpandAllForFloor(floorIndex)} variant="outline" size="sm" title="Expandir itens deste andar">
                            <Eye className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Expandir Andar</span>
                          </Button>
                          <Button onClick={() => handleCollapseAllForFloor(floorIndex)} variant="outline" size="sm" title="Recolher itens deste andar">
                            <EyeOff className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Recolher Andar</span>
                          </Button>
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
                    </div>
                    
                    {floorData.categories.map((category, categoryIndex) => {
                      const overallStatus = getCategoryOverallStatus(category);
                      return (
                        <InspectionCategoryItem
                          key={`${floorData.id}-${category.id}`}
                          category={category}
                          overallStatus={overallStatus}
                          onCategoryItemUpdate={handleCategoryItemUpdateForFloor}
                          floorIndex={floorIndex}
                          onMoveCategoryItem={handleMoveCategoryItem}
                          onRemoveCategory={handleRemoveCategoryFromFloor}
                          categoryIndex={categoryIndex}
                          totalCategoriesInFloor={floorData.categories.length}
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

    
