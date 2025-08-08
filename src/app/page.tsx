
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppHeader } from '@/components/app/app-header';
import { ClientDataForm } from '@/components/app/client-data-form';
import { InspectionCategoryItem } from '@/components/app/inspection-category-item';
import { ActionButtonsPanel } from '@/components/app/action-buttons-panel';
import { SavedInspectionsList } from '@/components/app/saved-inspections-list';
import { FloorsDialog } from '@/components/app/floors-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FullInspectionData, FloorData, TowerData, CategoryUpdatePayload, ClientInfo, StatusOption, InspectionCategoryState, CategoryOverallStatus, RegisteredExtinguisher, RegisteredHose, SubItemState } from '@/lib/types';
import { INITIAL_FLOOR_DATA, INSPECTION_CONFIG } from '@/constants/inspection.config';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateInspectionPdf, generateRegisteredItemsPdf, generateNCItemsPdf, generatePhotoReportPdf } from '@/lib/pdfGenerator';
import { ChevronDown, ChevronUp, Trash2, Eye, EyeOff, Building, Plus, Layers, PanelTopClose, ChevronsUpDown, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveInspectionToFirestore, getInspectionsFromFirestore, loadInspectionFromFirestore, deleteInspectionFromFirestore } from '@/lib/firebase-actions';
import { saveInspectionToDB, deleteInspectionFromDB } from '@/lib/indexedDB';
import { getCategoryOverallStatus } from '@/lib/inspection-helpers';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/context';
import { useRouter } from 'next/navigation';

const generateUniqueId = () => `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`;

const createNewFloorEntry = (): FloorData => {
  return {
    id: generateUniqueId(),
    ...JSON.parse(JSON.stringify(INITIAL_FLOOR_DATA)), // Deep copy
    floor: '', // Floor name will be set by user
    categories: JSON.parse(JSON.stringify(INITIAL_FLOOR_DATA.categories)).map((cat: InspectionCategoryState) => ({...cat, isExpanded: false})),
    isFloorContentVisible: true, // New floors start visible
  };
};

const createNewTowerEntry = (): TowerData => {
  return {
    id: generateUniqueId(),
    towerName: '',
    floors: [createNewFloorEntry()],
  };
};

const calculateNextInspectionNumber = (clientLocation: string): string => {
  const trimmedClientLocation = clientLocation.trim();
  if (!trimmedClientLocation) return '';
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return randomNumber.toString();
};

const initiateFileDownload = (dataToDownload: FullInspectionData | FullInspectionData[], baseFileName: string) => {
  const jsonString = JSON.stringify(dataToDownload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${baseFileName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return `${baseFileName}.json`;
};


export default function FireCheckPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const jsonImportFileInputRef = useRef<HTMLInputElement>(null);

  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientLocation: '',
    clientCode: '',
    inspectionNumber: '',
    inspectionDate: '',
    inspectedBy: '',
  });

  const [activeTowersData, setActiveTowersData] = useState<TowerData[]>([createNewTowerEntry()]);
  const [isClientInitialized, setIsClientInitialized] = useState(false);

  const [dbInspections, setDbInspections] = useState<FullInspectionData[]>([]);
  const [isSavedInspectionsVisible, setIsSavedInspectionsVisible] = useState(false);
  const [isLoadingDbInspections, setIsLoadingDbInspections] = useState(true);
  
  const [modalTowerIndex, setModalTowerIndex] = useState<number | null>(null);


  const [savedLocations, setSavedLocations] = useLocalStorage<string[]>('firecheck-saved-locations-v1', []);
  const [isChecklistVisible, setIsChecklistVisible] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setClientInfo(prev => ({ ...prev, inspectedBy: user }));
    }
  }, [user]);

  const fetchSavedInspections = useCallback(async () => {
    if (!user) return;
    setIsLoadingDbInspections(true);
    try {
      const inspections = await getInspectionsFromFirestore(user);
      setDbInspections(inspections);
    } catch (error) {
      console.error("Failed to fetch inspections from Firestore:", error);
      toast({
        title: "Erro ao Carregar Vistorias Salvas",
        description: "Não foi possível buscar as vistorias da nuvem.",
        variant: "destructive",
      });
      setDbInspections([]);
    } finally {
      setIsLoadingDbInspections(false);
    }
  }, [toast, user]);

 useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').then(registration => {
            // console.log('ServiceWorker registration successful with scope: ', registration.scope);
          }).catch(err => {
            // console.log('ServiceWorker registration failed: ', err);
          });
        });
      }
      if (!clientInfo.inspectionDate) {
        setClientInfo(prev => ({...prev, inspectionDate: new Date().toISOString().split('T')[0]}));
      }
      if (user) {
        fetchSavedInspections();
      }
    }
    setIsClientInitialized(true);
  }, [clientInfo.inspectionDate, fetchSavedInspections, user]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (clientInfo.clientLocation.trim()) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [clientInfo.clientLocation]);


  const handleClientInfoChange = useCallback((field: keyof ClientInfo, value: string) => {
    setClientInfo(prevClientInfo => {
      const newClientInfoState = { ...prevClientInfo, [field]: value };
      if (field === 'clientLocation') {
        if (!newClientInfoState.inspectionNumber || prevClientInfo.clientLocation !== value) {
             newClientInfoState.inspectionNumber = calculateNextInspectionNumber(value);
        }
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

  const handleTowerNameChange = useCallback((towerIndex: number, name: string) => {
    setActiveTowersData(prevTowers =>
      prevTowers.map((tower, index) =>
        index === towerIndex ? { ...tower, towerName: name } : tower
      )
    );
  }, []);

  const handleFloorSpecificFieldChange = useCallback((towerIndex: number, floorIndex: number, field: keyof Pick<FloorData, 'floor'>, value: string) => {
    setActiveTowersData(prevTowers =>
      prevTowers.map((tower, tIndex) => {
        if (tIndex !== towerIndex) return tower;
        const currentFloors = Array.isArray(tower.floors) ? tower.floors : [];
        return {
          ...tower,
          floors: currentFloors.map((floor, fIndex) =>
            fIndex === floorIndex ? { ...floor, [field]: value } : floor
          ),
        };
      })
    );
  }, []);

 const handleCategoryItemUpdateForFloor = useCallback((towerIndex: number, floorIndex: number, categoryId: string, update: CategoryUpdatePayload) => {
    setActiveTowersData(prevTowers => {
        return prevTowers.map((currentTower, tIndex) => {
            if (tIndex !== towerIndex) return currentTower;

            const currentTowerFloors = Array.isArray(currentTower.floors) ? currentTower.floors : [];
            const updatedFloors = currentTowerFloors.map((currentFloorData, fIndex) => {
                if (fIndex !== floorIndex) return currentFloorData;

                const originalCategory = currentFloorData.categories.find(cat => cat.id === categoryId);
                if (!originalCategory) return currentFloorData;

                let mutatedCategory = { ...originalCategory };
                let actualModificationsMadeToCategory = false;
                
                switch (update.field) {
                    case 'isExpanded':
                        if (mutatedCategory.isExpanded !== update.value) {
                            mutatedCategory.isExpanded = update.value as boolean;
                            actualModificationsMadeToCategory = true;
                        }
                        break;
                    case 'status':
                        if (mutatedCategory.status !== update.value) {
                            mutatedCategory.status = update.value as StatusOption | undefined;
                            actualModificationsMadeToCategory = true;
                        }
                        if (mutatedCategory.status === 'N/C' && !mutatedCategory.showObservation) {
                            mutatedCategory.showObservation = true;
                            actualModificationsMadeToCategory = true;
                        }
                        break;
                    case 'subItemStatus':
                    case 'subItemObservation':
                    case 'subItemShowObservation':
                    case 'renameSubItemName':
                    case 'subItemPhotoDataUri':
                    case 'subItemPhotoDescription':
                    case 'removeSubItemPhoto':
                        if (mutatedCategory.subItems && update.subItemId) {
                            const oldSubItemsRef = mutatedCategory.subItems;
                            mutatedCategory.subItems = mutatedCategory.subItems.map(sub => {
                                if (sub.id !== update.subItemId) return sub;
                                
                                let newSubState = { ...sub };
                                let individualSubItemAltered = false;

                                if (update.field === 'subItemStatus') {
                                    if (newSubState.status !== (update.value as StatusOption | undefined)) {
                                        newSubState.status = update.value as StatusOption | undefined;
                                        individualSubItemAltered = true;
                                    }
                                    if (newSubState.status === 'N/C' && !newSubState.showObservation) {
                                        newSubState.showObservation = true;
                                        individualSubItemAltered = true;
                                    }
                                } else if (update.field === 'subItemObservation') {
                                     if (newSubState.observation !== (update.value as string)) {
                                        newSubState.observation = update.value as string;
                                        individualSubItemAltered = true;
                                    }
                                } else if (update.field === 'subItemShowObservation') {
                                    if (newSubState.showObservation !== (update.value as boolean)) {
                                        newSubState.showObservation = update.value as boolean;
                                        individualSubItemAltered = true;
                                    }
                                } else if (update.field === 'renameSubItemName' && update.newName) {
                                    if (newSubState.name !== update.newName) {
                                        newSubState.name = update.newName as string;
                                        individualSubItemAltered = true;
                                    }
                                } else if (update.field === 'subItemPhotoDataUri') {
                                    if (newSubState.photoDataUri !== (update.value as string | null)) {
                                        newSubState.photoDataUri = update.value as string | null;
                                        if (!update.value) newSubState.photoDescription = '';
                                        individualSubItemAltered = true;
                                    }
                                } else if (update.field === 'subItemPhotoDescription') {
                                    if (newSubState.photoDescription !== (update.value as string)) {
                                        newSubState.photoDescription = update.value as string;
                                        individualSubItemAltered = true;
                                    }
                                } else if (update.field === 'removeSubItemPhoto') {
                                    if (newSubState.photoDataUri !== null) {
                                        newSubState.photoDataUri = null;
                                        newSubState.photoDescription = '';
                                        individualSubItemAltered = true;
                                    }
                                }
                                
                                if (individualSubItemAltered) {
                                    actualModificationsMadeToCategory = true;
                                }
                                return individualSubItemAltered ? newSubState : sub;
                            });
                            if (actualModificationsMadeToCategory && mutatedCategory.subItems !== oldSubItemsRef) {
                                mutatedCategory.subItems = [...mutatedCategory.subItems];
                            }
                        }
                        break;
                    case 'removeSubItem':
                         if (mutatedCategory.subItems && update.subItemId) {
                            const initialSubItemsCount = mutatedCategory.subItems.length;
                            const newSubItemsArray = mutatedCategory.subItems.filter(sub => sub.id !== update.subItemId);
                            if (newSubItemsArray.length < initialSubItemsCount) {
                                mutatedCategory.subItems = newSubItemsArray;
                                actualModificationsMadeToCategory = true;
                            }
                        }
                        break;
                    default:
                        if (update.field === 'observation' && mutatedCategory.observation !== update.value) { mutatedCategory.observation = update.value as string; actualModificationsMadeToCategory = true; }
                        else if (update.field === 'showObservation' && mutatedCategory.showObservation !== update.value) { mutatedCategory.showObservation = update.value as boolean; actualModificationsMadeToCategory = true; }
                        else if (update.field === 'pressureValue' && mutatedCategory.pressureValue !== update.value) { mutatedCategory.pressureValue = update.value as string; actualModificationsMadeToCategory = true; }
                        else if (update.field === 'pressureUnit' && mutatedCategory.pressureUnit !== update.value) { mutatedCategory.pressureUnit = update.value as InspectionCategoryState['pressureUnit']; actualModificationsMadeToCategory = true; }
                        else if (update.field === 'renameCategoryTitle' && update.newTitle && mutatedCategory.title !== update.newTitle) { mutatedCategory.title = update.newTitle as string; actualModificationsMadeToCategory = true; }
                        else if (update.field === 'addRegisteredExtinguisher' && mutatedCategory.subItems && update.subItemId && update.value) {
                            const newExt: RegisteredExtinguisher = { ...(update.value as Omit<RegisteredExtinguisher, 'id'>), id: `ext-${generateUniqueId()}` };
                            mutatedCategory.subItems = (mutatedCategory.subItems || []).map(sub =>
                                sub.id === update.subItemId ? { ...sub, registeredExtinguishers: [...(sub.registeredExtinguishers || []), newExt] } : sub
                            );
                            if (mutatedCategory.subItems.some(sub => sub.id === update.subItemId && sub.registeredExtinguishers?.some(e => e.id === newExt.id))) {
                                actualModificationsMadeToCategory = true;
                            }
                        }
                        else if (update.field === 'removeRegisteredExtinguisher' && mutatedCategory.subItems && update.subItemId && update.extinguisherId) {
                            const oldExtCount = mutatedCategory.subItems.find(s => s.id === update.subItemId)?.registeredExtinguishers?.length || 0;
                            mutatedCategory.subItems = (mutatedCategory.subItems || []).map(sub =>
                                sub.id === update.subItemId ? { ...sub, registeredExtinguishers: (sub.registeredExtinguishers || []).filter(ext => ext.id !== update.extinguisherId) } : sub
                            );
                            const newExtCount = mutatedCategory.subItems.find(s => s.id === update.subItemId)?.registeredExtinguishers?.length || 0;
                            if (newExtCount < oldExtCount) {
                                actualModificationsMadeToCategory = true;
                            }
                        }
                        else if (update.field === 'addRegisteredHose' && mutatedCategory.subItems && update.subItemId && update.value) {
                            const newHose: RegisteredHose = { ...(update.value as Omit<RegisteredHose, 'id'>), id: `hose-${generateUniqueId()}` };
                            mutatedCategory.subItems = (mutatedCategory.subItems || []).map(sub =>
                                sub.id === update.subItemId ? { ...sub, registeredHoses: [...(sub.registeredHoses || []), newHose] } : sub
                            );
                             if (mutatedCategory.subItems.some(sub => sub.id === update.subItemId && sub.registeredHoses?.some(h => h.id === newHose.id))) {
                                actualModificationsMadeToCategory = true;
                            }
                        }
                        else if (update.field === 'removeRegisteredHose' && mutatedCategory.subItems && update.subItemId && update.hoseId) {
                             const oldHoseCount = mutatedCategory.subItems.find(s => s.id === update.subItemId)?.registeredHoses?.length || 0;
                            mutatedCategory.subItems = (mutatedCategory.subItems || []).map(sub =>
                                sub.id === update.subItemId ? { ...sub, registeredHoses: (sub.registeredHoses || []).filter(h => h.id !== update.hoseId) } : sub
                            );
                            const newHoseCount = mutatedCategory.subItems.find(s => s.id === update.subItemId)?.registeredHoses?.length || 0;
                             if (newHoseCount < oldHoseCount) {
                                actualModificationsMadeToCategory = true;
                            }
                        }
                        else if (update.field === 'markAllSubItemsNA' && mutatedCategory.subItems && mutatedCategory.type === 'standard') {
                            let markedAny = false;
                            mutatedCategory.subItems = (mutatedCategory.subItems || []).map(sub => {
                                if (!sub.isRegistry && sub.status !== 'N/A') { markedAny = true; return { ...sub, status: 'N/A' as StatusOption }; }
                                return sub;
                            });
                            if (markedAny) { actualModificationsMadeToCategory = true; }
                        }
                         else if (update.field === 'markAllSubItemsOK' && mutatedCategory.subItems && mutatedCategory.type === 'standard') { 
                            let markedAny = false;
                            mutatedCategory.subItems = (mutatedCategory.subItems || []).map(sub => {
                                if (!sub.isRegistry && sub.status !== 'OK') { markedAny = true; return { ...sub, status: 'OK' as StatusOption }; }
                                return sub;
                            });
                            if (markedAny) { actualModificationsMadeToCategory = true; }
                        }
                        else if (update.field === 'addSubItem' && mutatedCategory.type === 'standard' && typeof update.value === 'string' && (update.value as string).trim() !== '') {
                            const newId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                            const newSub: SubItemState = { id: newId, name: (update.value as string).trim(), status: undefined, observation: '', showObservation: false, isRegistry: false, photoDataUri: null, photoDescription: '' };
                            mutatedCategory.subItems = [...(mutatedCategory.subItems || []), newSub];
                            actualModificationsMadeToCategory = true;
                        }
                        break;
                }
                
                let finalCategoriesForFloor = currentFloorData.categories;
                if (actualModificationsMadeToCategory) {
                    const categoryModifiedIndex = finalCategoriesForFloor.findIndex(c => c.id === originalCategory.id);
                    if (categoryModifiedIndex !== -1) {
                        finalCategoriesForFloor = [
                            ...finalCategoriesForFloor.slice(0, categoryModifiedIndex),
                            mutatedCategory,
                            ...finalCategoriesForFloor.slice(categoryModifiedIndex + 1)
                        ];
                    }
                }
                
                return actualModificationsMadeToCategory ? { ...currentFloorData, categories: finalCategoriesForFloor } : currentFloorData;
            });

            return (updatedFloors.some((floor, idx) => floor !== currentTowerFloors[idx]))
                ? { ...currentTower, floors: updatedFloors }
                : currentTower;
        });
    });
  }, []);


  const resetInspectionForm = useCallback(() => {
    const defaultInspectionDate = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '';
    const defaultClientInfo: ClientInfo = {
      clientLocation: '', clientCode: '', inspectionNumber: '',
      inspectionDate: defaultInspectionDate, inspectedBy: user || '',
    };
    setClientInfo(defaultClientInfo);
    setActiveTowersData([createNewTowerEntry()]);
    setIsChecklistVisible(false);
    setIsSavedInspectionsVisible(false); // Hide saved list on new inspection
     if (clientInfo.clientLocation) { // Auto-generate new number only if location was set
        setClientInfo(prev => ({...prev, inspectionNumber: calculateNextInspectionNumber(prev.clientLocation)}));
    }
  }, [clientInfo.clientLocation, user]);

  const handleAddNewTower = useCallback(() => {
    setActiveTowersData(prevTowers => {
        const newTower = createNewTowerEntry();
        return [...prevTowers, newTower];
    });
  }, []);

  const handleRemoveTower = useCallback((towerIndex: number) => {
    if (activeTowersData.length <= 1) {
      toast({ title: "Ação não permitida", description: "Não é possível remover a única torre.", variant: "default" });
      return;
    }
    setActiveTowersData(prev => prev.filter((_, index) => index !== towerIndex));
  }, [activeTowersData.length, toast]);

  const handleAddFloorToTower = useCallback((towerIndex: number) => {
    setActiveTowersData(prevTowers =>
      prevTowers.map((tower, index) => {
        if (index === towerIndex) {
          const currentFloors = Array.isArray(tower.floors) ? tower.floors : [];
          
          const updatedCurrentFloors = currentFloors.map((f, i) => {
            if (i === currentFloors.length - 1 && currentFloors.length > 0) { 
              return { ...f, isFloorContentVisible: false }; 
            }
            return f;
          });

          let newFloorCategories: InspectionCategoryState[];
          const sourceFloorForCategories = currentFloors.length > 0 ? currentFloors[currentFloors.length - 1] : null;

          if (sourceFloorForCategories) {
             newFloorCategories = JSON.parse(JSON.stringify(sourceFloorForCategories.categories)).map((cat: InspectionCategoryState) => ({
                ...cat,
                isExpanded: false, status: undefined, observation: '', showObservation: false, pressureValue: '', pressureUnit: '',
                subItems: cat.subItems ? JSON.parse(JSON.stringify(cat.subItems)).map((sub: SubItemState) => ({
                    ...sub, status: undefined, observation: '', showObservation: false, photoDataUri: null, photoDescription: '',
                    registeredExtinguishers: sub.isRegistry && sub.id === 'extintor_cadastro' ? [] : undefined,
                    registeredHoses: sub.isRegistry && sub.id === 'hidrantes_cadastro_mangueiras' ? [] : undefined,
                })) : undefined,
            }));
          } else {
            newFloorCategories = JSON.parse(JSON.stringify(INITIAL_FLOOR_DATA.categories)).map((cat: InspectionCategoryState) => ({...cat, isExpanded: false}));
          }
          
          const newFloorEntry = { 
            ...createNewFloorEntry(), 
            categories: newFloorCategories,
            isFloorContentVisible: true 
          };

          return {
            ...tower,
            floors: [...updatedCurrentFloors, newFloorEntry],
          };
        }
        return tower;
      })
    );
  }, []);

  const handleRemoveFloorFromTower = useCallback((towerIndex: number, floorIndex: number) => {
    setActiveTowersData(prevTowers =>
      prevTowers.map((tower, tIndex) => {
        if (tIndex === towerIndex) {
          const currentFloors = Array.isArray(tower.floors) ? tower.floors : [];
          if (currentFloors.length <= 1) {
             toast({ title: "Ação não permitida", description: "Não é possível remover o único andar da torre.", variant: "default" });
             return tower;
          }
          return {
            ...tower,
            floors: currentFloors.filter((_, fIndex) => fIndex !== floorIndex),
          };
        }
        return tower;
      })
    );
  }, [toast]);

  const handleSaveInspection = useCallback(async () => {
    if (!user) {
      toast({ title: "Usuário não autenticado", description: "Por favor, faça login para salvar a vistoria.", variant: "destructive" });
      return;
    }
    if (!clientInfo.inspectionNumber) {
       toast({ title: "ID da Vistoria Necessário", description: "Por favor, preencha o Local para gerar um Número de Vistoria ou insira manualmente.", variant: "destructive" });
       return;
    }
    const inspectionToSave: FullInspectionData = {
      id: clientInfo.inspectionNumber,
      clientInfo: { 
        ...clientInfo, 
        inspectedBy: user,
      },
      towers: activeTowersData,
      timestamp: Date.now(),
      owner: user,
    };

    try {
      await saveInspectionToFirestore(inspectionToSave);
      await saveInspectionToDB(inspectionToSave); // Also save to local IndexedDB
      toast({ title: "Vistoria Salva", description: `Vistoria Nº ${inspectionToSave.id} salva na nuvem e localmente.` });
      fetchSavedInspections();
    } catch (err: any) {
      console.error('Erro ao salvar vistoria:', err);
      toast({ title: "Erro ao Salvar", description: err.message || "Não foi possível salvar a vistoria.", variant: "destructive" });
    }
  }, [clientInfo, activeTowersData, toast, fetchSavedInspections, user]);


  const loadInspectionDataToForm = useCallback((inspectionToLoad: FullInspectionData) => {
    const loadedClientInfo = inspectionToLoad.clientInfo || {};
    setClientInfo({
        clientLocation: loadedClientInfo.clientLocation || '',
        clientCode: loadedClientInfo.clientCode || '',
        inspectionNumber: loadedClientInfo.inspectionNumber || inspectionToLoad.id || '',
        inspectionDate: loadedClientInfo.inspectionDate || (typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : ''),
        inspectedBy: loadedClientInfo.inspectedBy || user || '',
    });

    const sanitizedTowersForForm = (inspectionToLoad.towers || []).map(loadedTower => {
      const loadedTowerFloors = Array.isArray(loadedTower.floors) ? loadedTower.floors : [];
      const sanitizedFloorsForForm = loadedTowerFloors.map(loadedFloor => {
        const sanitizedCategoriesForForm = INSPECTION_CONFIG.map(cfgCategory => {
          const jsonCategory = (loadedFloor.categories || []).find(cat => cat.id === cfgCategory.id);
          let finalSubItems: SubItemState[] = [];

          if (cfgCategory.type === 'standard') {
            const configSubItems = cfgCategory.subItems || [];
            if (jsonCategory && Array.isArray(jsonCategory.subItems)) {
              const jsonSubItemsMap = new Map(jsonCategory.subItems.map(js => [js.id, js]));
              
              finalSubItems = configSubItems.map(cfgSub => {
                const jsonSub = jsonSubItemsMap.get(cfgSub.id);
                return {
                  id: cfgSub.id,
                  name: jsonSub?.name || cfgSub.name,
                  status: jsonSub?.status,
                  observation: jsonSub?.observation || '',
                  showObservation: jsonSub?.showObservation || false,
                  isRegistry: cfgSub.isRegistry || false,
                  photoDataUri: jsonSub?.photoDataUri || null,
                  photoDescription: jsonSub?.photoDescription || '',
                  registeredExtinguishers: (jsonSub?.registeredExtinguishers || (cfgSub.isRegistry && cfgSub.id === 'extintor_cadastro' ? [] : undefined))?.map(ext => ({ ...ext, id: (ext.id && typeof ext.id === 'string' && !ext.id.includes('NaN') && !ext.id.startsWith('server-temp-id-')) ? ext.id : `loaded-${generateUniqueId()}-ext` })),
                  registeredHoses: (jsonSub?.registeredHoses || (cfgSub.isRegistry && cfgSub.id === 'hidrantes_cadastro_mangueiras' ? [] : undefined))?.map(hose => ({ ...hose, id: (hose.id && typeof hose.id === 'string' && !hose.id.includes('NaN') && !hose.id.startsWith('server-temp-id-')) ? hose.id : `loaded-${generateUniqueId()}-hose` })),
                };
              });

              jsonCategory.subItems.forEach(jsonSub => {
                if (!configSubItems.some(cfgSub => cfgSub.id === jsonSub.id)) { // Custom sub-item from JSON/DB
                  finalSubItems.push({
                    ...jsonSub, 
                    id: (jsonSub.id && typeof jsonSub.id === 'string' && !jsonSub.id.includes('NaN') && !jsonSub.id.startsWith('server-temp-id-') && (!jsonSub.id.startsWith('custom-') || jsonSub.id.length > 20)) ? jsonSub.id : jsonSub.id.startsWith('custom-') ? jsonSub.id : `loaded-custom-sub-${generateUniqueId()}`,
                    name: jsonSub.name || 'Subitem Carregado',
                    photoDataUri: jsonSub.photoDataUri || null,
                    photoDescription: jsonSub.photoDescription || '',
                    status: jsonSub.status,
                    observation: jsonSub.observation || '',
                    showObservation: jsonSub.showObservation || false,
                    isRegistry: jsonSub.isRegistry || false,
                    registeredExtinguishers: (jsonSub.registeredExtinguishers || undefined)?.map(ext => ({ ...ext, id: (ext.id && typeof ext.id === 'string' && !ext.id.includes('NaN') && !ext.id.startsWith('server-temp-id-')) ? ext.id : `loaded-custom-${generateUniqueId()}-ext` })),
                    registeredHoses: (jsonSub.registeredHoses || undefined)?.map(hose => ({ ...hose, id: (hose.id && typeof hose.id === 'string' && !hose.id.includes('NaN') && !hose.id.startsWith('server-temp-id-')) ? hose.id : `loaded-custom-${generateUniqueId()}-hose` })),
                  });
                }
              });
            } else { 
              finalSubItems = configSubItems.map(cfgSub => ({
                id: cfgSub.id, name: cfgSub.name, status: undefined, observation: '', showObservation: false,
                isRegistry: cfgSub.isRegistry || false, photoDataUri: null, photoDescription: '',
                registeredExtinguishers: (cfgSub.isRegistry && cfgSub.id === 'extintor_cadastro' ? [] : undefined),
                registeredHoses: (cfgSub.isRegistry && cfgSub.id === 'hidrantes_cadastro_mangueiras' ? [] : undefined),
              }));
            }
          }
          
          return {
            id: cfgCategory.id,
            title: jsonCategory?.title || cfgCategory.title,
            type: cfgCategory.type,
            isExpanded: false, 
            status: jsonCategory?.status,
            observation: jsonCategory?.observation || '',
            showObservation: jsonCategory?.showObservation || false,
            pressureValue: jsonCategory?.pressureValue || '',
            pressureUnit: jsonCategory?.pressureUnit || '',
            subItems: cfgCategory.type === 'standard' ? finalSubItems : undefined,
          };
        });
        return {
          ...loadedFloor, 
          id: (loadedFloor.id && typeof loadedFloor.id === 'string' && !loadedFloor.id.startsWith('server-temp-id-')) ? loadedFloor.id : generateUniqueId(),
          floor: loadedFloor.floor || '', 
          categories: sanitizedCategoriesForForm,
          isFloorContentVisible: false, // Start hidden when loading from DB/JSON
        };
      });
      return {
        ...loadedTower, 
        id: (loadedTower.id && typeof loadedTower.id === 'string' && !loadedTower.id.startsWith('server-temp-id-')) ? loadedTower.id : generateUniqueId(),
        towerName: loadedTower.towerName || '', 
        floors: sanitizedFloorsForForm,
      };
    });

    if (sanitizedTowersForForm.length > 0 && sanitizedTowersForForm[0].floors.length > 0) {
      sanitizedTowersForForm[0].floors[0].isFloorContentVisible = true;
    }
    setActiveTowersData(sanitizedTowersForForm.length > 0 ? sanitizedTowersForForm : [createNewTowerEntry()]);
    setIsChecklistVisible(true);
    setIsSavedInspectionsVisible(false); // Hide list after loading
  }, [setActiveTowersData, setClientInfo, setIsChecklistVisible, setIsSavedInspectionsVisible, user]);

  const handleLoadInspection = useCallback(async (inspectionId: string) => {
    if (!user) {
      toast({ title: "Usuário não autenticado", description: "Por favor, faça login para carregar a vistoria.", variant: "destructive" });
      return;
    }
    try {
      const inspectionToLoad = await loadInspectionFromFirestore(inspectionId, user);
      if (inspectionToLoad) {
        loadInspectionDataToForm(inspectionToLoad);
        toast({ title: "Vistoria Carregada", description: `Vistoria Nº ${inspectionToLoad.id} carregada da nuvem.` });
      } else {
        toast({ title: "Erro ao Carregar", description: `Vistoria Nº ${inspectionId} não encontrada na nuvem.`, variant: "destructive" });
      }
    } catch (error) {
      console.error("Error loading inspection from DB list:", error);
      toast({ title: "Erro ao Carregar", description: "Não foi possível carregar a vistoria.", variant: "destructive" });
    }
  }, [loadInspectionDataToForm, toast, user]);

  const handleDeleteInspection = useCallback(async (inspectionId: string, inspectionLocation?: string) => {
    if (!user) {
        toast({ title: "Usuário não autenticado.", variant: "destructive" });
        return;
    }
    try {
      await deleteInspectionFromFirestore(inspectionId, user);
      await deleteInspectionFromDB(inspectionId); // Also delete from local
      toast({ title: "Vistoria Removida", description: `Vistoria Nº ${inspectionId} (${inspectionLocation || 'Local não especificado'}) removida da nuvem e localmente.` });
      fetchSavedInspections();
    } catch (error) {
      console.error("Error deleting inspection:", error);
      toast({ title: "Erro ao Remover", description: "Não foi possível remover a vistoria.", variant: "destructive" });
    }
  }, [fetchSavedInspections, toast, user]);

  const handleDownloadJsonFromDBList = useCallback(async (inspectionId: string) => {
    if (!user) return;
    try {
      const inspectionData = await loadInspectionFromFirestore(inspectionId, user);
      if (inspectionData) {
        const clientInfoForFilename = { inspectionNumber: inspectionData.id, clientLocation: inspectionData.clientInfo.clientLocation || 'vistoria' };
        const baseFileName = `vistoria_${clientInfoForFilename.inspectionNumber}_${clientInfoForFilename.clientLocation.replace(/\s+/g, '_')}`;
        initiateFileDownload(inspectionData, baseFileName);
        toast({ title: "Download Iniciado", description: `JSON da Vistoria Nº ${inspectionId} está sendo baixado (inclui fotos).` });
      } else {
        toast({ title: "Erro", description: "Vistoria não encontrada para download.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error downloading JSON from DB list:", error);
      toast({ title: "Erro no Download", description: "Não foi possível baixar o JSON da vistoria.", variant: "destructive" });
    }
  }, [toast, user]);

  const handleToggleSavedInspections = useCallback(() => {
    setIsSavedInspectionsVisible(prev => !prev);
    if (!isSavedInspectionsVisible) {
      fetchSavedInspections();
    }
  }, [isSavedInspectionsVisible, fetchSavedInspections]);


  const handleExportCurrentInspectionToJson = useCallback(() => {
    if (!clientInfo.inspectionNumber) {
       toast({ title: "ID da Vistoria Necessário", description: "Por favor, preencha o Local para gerar um Número de Vistoria ou insira manualmente.", variant: "destructive" });
       return;
    }
    const inspectionToExport: FullInspectionData = {
      id: clientInfo.inspectionNumber,
      clientInfo: { 
        ...clientInfo,
      },
      towers: activeTowersData, 
      timestamp: Date.now(),
      owner: user || 'unknown'
    };
    const clientInfoForFilename = { inspectionNumber: inspectionToExport.id, clientLocation: inspectionToExport.clientInfo.clientLocation || 'vistoria' };
    const baseFileName = `vistoria_${clientInfoForFilename.inspectionNumber}_${clientInfoForFilename.clientLocation.replace(/\s+/g, '_')}`;
    const fileName = initiateFileDownload(inspectionToExport, baseFileName);
    toast({ title: "Vistoria Exportada", description: `Arquivo ${fileName} salvo (incluindo fotos e observações da vistoria ativa).` });
  }, [clientInfo, activeTowersData, toast, user]);


 const handleImportInspectionFromJson = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const currentInput = event.target;
    const currentFiles = currentInput.files;
    if (!currentFiles || currentFiles.length === 0) {
      toast({ title: "Nenhum arquivo selecionado", variant: "destructive" });
      if (jsonImportFileInputRef.current) {
        jsonImportFileInputRef.current.value = '';
      }
      return;
    }

    const file = currentFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        if (!jsonString || jsonString.trim() === "") {
          console.warn(`Conteúdo vazio ou inválido no arquivo ${file.name}`);
          toast({ title: "Arquivo Vazio", description: `O arquivo ${file.name} está vazio ou não pôde ser lido.`, variant: "destructive" });
          if (jsonImportFileInputRef.current) jsonImportFileInputRef.current.value = '';
          return;
        }
        
        const importedData = JSON.parse(jsonString);

        if (typeof importedData !== 'object' || importedData === null ) {
            console.warn(`Conteúdo JSON não é um objeto de vistoria válido no arquivo ${file.name}:`, JSON.stringify(importedData, null, 2).substring(0,100));
            toast({ title: "Formato Inválido", description: `O arquivo ${file.name} não contém uma vistoria válida.`, variant: "destructive" });
            if (jsonImportFileInputRef.current) jsonImportFileInputRef.current.value = '';
            return;
        }
        
        const inspectionToLoad = importedData as FullInspectionData;
        if (inspectionToLoad && typeof inspectionToLoad === 'object' &&
            typeof inspectionToLoad.id === 'string' &&
            inspectionToLoad.clientInfo && typeof inspectionToLoad.clientInfo === 'object' &&
            Array.isArray(inspectionToLoad.towers) &&
            typeof inspectionToLoad.timestamp === 'number') {
          
          loadInspectionDataToForm(inspectionToLoad);
          
          const hasPhotos = (inspectionToLoad.towers || []).some(t =>
                                   (t.floors || []).some(f =>
                                     (f.categories || []).some(c =>
                                       (c.subItems || []).some(s => s.photoDataUri)
                                     )
                                   )
                                 );
          toast({ title: "Importação Concluída", description: `Vistoria do arquivo ${file.name} carregada no formulário${hasPhotos ? ' com fotos' : ''}. Os dados importados podem ser salvos no navegador.`, duration: 7000 });
        } else {
          console.warn(`Vistoria inválida ou incompleta no arquivo ${file.name} pulada. Conteúdo parcial:`, JSON.stringify(inspectionToLoad, null, 2).substring(0, 500));
          toast({ title: "Estrutura Inválida", description: `O arquivo ${file.name} não corresponde à estrutura de vistoria esperada.`, variant: "destructive" });
        }
      } catch (error: any) {
        console.error(`Erro ao processar JSON do arquivo ${file.name}:`, error);
        if (error instanceof SyntaxError) {
          toast({ title: "Erro de Formato", description: `Arquivo ${file.name} malformatado. Verifique o conteúdo.`, variant: "destructive"});
        } else {
          toast({ title: "Erro de Importação", description: `Não foi possível importar ${file.name}. Verifique o formato.`, variant: "destructive"});
        }
      } finally {
        if (jsonImportFileInputRef.current) {
          jsonImportFileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = (err) => {
      console.error(`Erro ao ler o arquivo ${file.name}:`, err);
      toast({ title: "Erro de Leitura", description: `Não foi possível ler ${file.name}.`, variant: "destructive"});
      if (jsonImportFileInputRef.current) {
        jsonImportFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  }, [toast, loadInspectionDataToForm]);


  const triggerJsonImport = useCallback(() => { jsonImportFileInputRef.current?.click(); }, []);
  const handlePrintPage = useCallback(() => { if (typeof window !== 'undefined') window.print(); }, []);

  const handleCollapseAllGlobalCategories = useCallback(() => {
    setActiveTowersData(prevTowers => prevTowers.map(tower => ({ ...tower, floors: (Array.isArray(tower.floors) ? tower.floors : []).map(floor => ({ ...floor, categories: floor.categories.map(cat => ({ ...cat, isExpanded: false })) })) })));
  }, []);
  const handleExpandAllGlobalCategories = useCallback(() => {
    setActiveTowersData(prevTowers => prevTowers.map(tower => ({ ...tower, floors: (Array.isArray(tower.floors) ? tower.floors : []).map(floor => ({ ...floor, categories: floor.categories.map(cat => ({ ...cat, isExpanded: true })) })) })));
  }, []);
  
  const areAnyGlobalCategoriesExpanded = useMemo(() => {
    return activeTowersData.some(tower =>
      (Array.isArray(tower.floors) ? tower.floors : []).some(floor =>
        floor.categories.some(cat => cat.isExpanded)
      )
    );
  }, [activeTowersData]);

  const handleToggleAllGlobalCategories = useCallback(() => {
    if (areAnyGlobalCategoriesExpanded) {
      handleCollapseAllGlobalCategories();
    } else {
      handleExpandAllGlobalCategories();
    }
  }, [areAnyGlobalCategoriesExpanded, handleCollapseAllGlobalCategories, handleExpandAllGlobalCategories]);

  const handleToggleAllCategoriesForFloor = useCallback((towerIndex: number, floorIndex: number) => {
    setActiveTowersData(prevTowers => {
      return prevTowers.map((t, tIdx) => {
        if (tIdx !== towerIndex) return t;
        
        const currentFloors = Array.isArray(t.floors) ? t.floors : [];
        const floor = currentFloors[floorIndex];
        if (!floor) return t;

        const areAnyExpanded = floor.categories.some(cat => cat.isExpanded);
        const shouldExpand = !areAnyExpanded;
        
        return {
          ...t,
          floors: currentFloors.map((f, fIdx) => {
            if (fIdx !== floorIndex) return f;
            return {
              ...f,
              categories: f.categories.map(cat => ({ ...cat, isExpanded: shouldExpand })),
            };
          }),
        };
      });
    });
  }, []);

  const handleToggleFloorContent = useCallback((towerIndex: number, floorIndex: number) => {
    setActiveTowersData(prevTowers =>
      prevTowers.map((tower, tIdx) => {
        if (tIdx === towerIndex) {
          const currentFloors = Array.isArray(tower.floors) ? tower.floors : [];
          return {
            ...tower,
            floors: currentFloors.map((floor, fIdx) =>
              fIdx === floorIndex
                ? { ...floor, isFloorContentVisible: !floor.isFloorContentVisible }
                : floor
            )
          };
        }
        return tower;
      })
    );
  }, []);

  const handleGeneratePdf = useCallback(async () => { await generateInspectionPdf(clientInfo, activeTowersData); }, [clientInfo, activeTowersData]);
  const handleGenerateRegisteredItemsReport = useCallback(async () => { await generateRegisteredItemsPdf(clientInfo, activeTowersData); }, [clientInfo, activeTowersData]);
  const handleGenerateNCItemsReport = useCallback(async () => { await generateNCItemsPdf(clientInfo, activeTowersData); }, [clientInfo, activeTowersData]);
  const handleGeneratePhotoReportPdf = useCallback(async () => { await generatePhotoReportPdf(clientInfo, activeTowersData); }, [clientInfo, activeTowersData]);


  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <p className="text-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="flex justify-end mb-4">
            <Button variant="ghost" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
            </Button>
        </div>

        <AppHeader />
        <ClientDataForm clientInfoData={clientInfo} onClientInfoChange={handleClientInfoChange} savedLocations={savedLocations} />

        <div className="my-6 p-4 bg-card shadow-lg rounded-lg">
          <Button onClick={() => setIsChecklistVisible(!isChecklistVisible)} variant="ghost" className="w-full flex justify-between items-center text-left mb-2 text-xl font-semibold font-headline text-primary hover:bg-accent/10">
            Checklist da Vistoria
            {isChecklistVisible ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
          </Button>

          {isChecklistVisible && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                 <Button
                    onClick={handleToggleAllGlobalCategories}
                    size="sm"
                    variant="outline"
                    className={cn(areAnyGlobalCategoriesExpanded ? "text-red-600 border-red-500 hover:bg-red-500/10 hover:text-red-700" : "text-green-600 border-green-500 hover:bg-green-500/10 hover:text-green-700")}
                    title={areAnyGlobalCategoriesExpanded ? "Recolher Todas as Categorias (Global)" : "Expandir Todas as Categorias (Global)"}
                  >
                    {areAnyGlobalCategoriesExpanded ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    Categorias
                  </Button>
              </div>

              {activeTowersData.map((tower, towerIndex) => {
                return (
                <Card key={tower.id} className="mb-8 shadow-md border-primary/50">
                  <CardHeader className="bg-primary/5 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-grow">
                      <Building className="h-5 w-5 text-primary flex-shrink-0" />
                      <Input
                        value={tower.towerName}
                        onChange={(e) => handleTowerNameChange(towerIndex, e.target.value)}
                        placeholder={`Nome da Torre ${towerIndex + 1}`}
                        className="text-lg font-semibold w-auto flex-grow"
                      />
                    </div>
                     <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModalTowerIndex(towerIndex)}
                          title="Gerenciar andares desta torre"
                        >
                          <Layers className="mr-2 h-4 w-4" />
                          Gerenciar Andares
                        </Button>
                       {activeTowersData.length > 1 && (
                         <Button variant="ghost" size="icon" onClick={() => handleRemoveTower(towerIndex)} className="text-destructive hover:bg-destructive/10 h-9 w-9" title="Remover esta torre">
                           <Trash2 className="h-5 w-5" />
                         </Button>
                       )}
                     </div>
                  </CardHeader>
                </Card>
              )})}
            </>
          )}
        </div>

        <ActionButtonsPanel
          onSave={handleSaveInspection}
          onNewInspection={resetInspectionForm}
          onAddNewTower={handleAddNewTower} 
          onToggleSavedInspections={handleToggleSavedInspections}
          isSavedInspectionsVisible={isSavedInspectionsVisible}
          onPrint={handlePrintPage}
          onExportJson={handleExportCurrentInspectionToJson}
          onTriggerImportJson={triggerJsonImport}
          onGenerateRegisteredItemsReport={handleGenerateRegisteredItemsReport}
          onGenerateNCItemsReport={handleGenerateNCItemsReport}
          onGeneratePdf={handleGeneratePdf}
          onGeneratePhotoReportPdf={handleGeneratePhotoReportPdf}
        />
        
        {isMobile && (
          <Button
            variant="default"
            size="icon"
            className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg bg-green-500 hover:bg-green-600 text-white"
            onClick={handleAddNewTower}
            title="Adicionar Nova Torre"
          >
            <Building className="h-6 w-6" />
            <span className="sr-only">Adicionar Nova Torre</span>
          </Button>
        )}

         <input type="file" ref={jsonImportFileInputRef} accept=".json,application/json" onChange={handleImportInspectionFromJson} className="hidden" id="json-import-input" />
        
        {modalTowerIndex !== null && activeTowersData[modalTowerIndex] && (
          <FloorsDialog
            key={activeTowersData[modalTowerIndex].id}
            tower={activeTowersData[modalTowerIndex]}
            towerIndex={modalTowerIndex}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setModalTowerIndex(null);
              }
            }}
            onFloorChange={handleFloorSpecificFieldChange}
            onCategoryUpdate={handleCategoryItemUpdateForFloor}
            onAddFloor={() => handleAddFloorToTower(modalTowerIndex)}
            onRemoveFloor={(floorIndex) => handleRemoveFloorFromTower(modalTowerIndex, floorIndex)}
            onToggleFloorCategories={(floorIndex) => handleToggleAllCategoriesForFloor(modalTowerIndex, floorIndex)}
            onToggleFloorContent={(floorIndex) => handleToggleFloorContent(modalTowerIndex, floorIndex)}
            isMobile={isMobile}
          />
        )}

        {isSavedInspectionsVisible && (
          <SavedInspectionsList
            inspections={dbInspections}
            isLoading={isLoadingDbInspections}
            onLoadInspection={handleLoadInspection}
            onDeleteInspection={handleDeleteInspection}
            onDownloadJson={handleDownloadJsonFromDBList}
          />
        )}

        <footer className="text-center text-sm text-muted-foreground mt-12 pb-8">FireCheck Brazil &copy; {new Date().getFullYear()} - BRAZIL EXTINTORES</footer>
      </div>
    </ScrollArea>
  );
}
