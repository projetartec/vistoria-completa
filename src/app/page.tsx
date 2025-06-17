
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FullInspectionData, FloorData, TowerData, CategoryUpdatePayload, ClientInfo, StatusOption, InspectionCategoryState, CategoryOverallStatus, RegisteredExtinguisher, RegisteredHose, SubItemState } from '@/lib/types';
import { INITIAL_FLOOR_DATA, INSPECTION_CONFIG } from '@/constants/inspection.config';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateInspectionPdf, generateRegisteredItemsPdf, generateNCItemsPdf, generatePhotoReportPdf } from '@/lib/pdfGenerator';
import { ChevronDown, ChevronUp, Trash2, Eye, EyeOff, Building, Plus, Upload, Layers, PanelTopClose, Library, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveInspectionToDB, getAllInspectionsFromDB, loadInspectionFromDB, deleteInspectionFromDB } from '@/lib/indexedDB';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const generateUniqueId = () => `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`;

const createNewFloorEntry = (): FloorData => {
  return {
    id: generateUniqueId(),
    ...JSON.parse(JSON.stringify(INITIAL_FLOOR_DATA)), // Deep copy
    floor: '', // Floor name will be set by user
    categories: JSON.parse(JSON.stringify(INITIAL_FLOOR_DATA.categories)).map((cat: InspectionCategoryState) => ({...cat, isExpanded: false})),
    isFloorContentVisible: false, // Start hidden
  };
};

const createNewTowerEntry = (): TowerData => {
  return {
    id: generateUniqueId(),
    towerName: '',
    floors: [createNewFloorEntry()],
    isTowerContentVisible: false, // Start hidden
  };
};


const getCategoryOverallStatus = (category: InspectionCategoryState): CategoryOverallStatus => {
  if (category.type === 'standard' && category.subItems) {
    const relevantSubItems = category.subItems.filter(subItem => !subItem.isRegistry);
    if (relevantSubItems.length === 0 && category.subItems.some(subItem => subItem.isRegistry)) { // If only registry items, consider it complete
        return 'all-items-selected';
    }
    if (relevantSubItems.length === 0) return 'all-items-selected'; // Default to complete if no relevant items (e.g. custom category with no subitems yet)
    const allSelected = relevantSubItems.every(subItem => subItem.status !== undefined);
    return allSelected ? 'all-items-selected' : 'some-items-pending';
  } else if (category.type === 'special' || category.type === 'pressure') {
    return category.status !== undefined ? 'all-items-selected' : 'some-items-pending';
  }
  return 'some-items-pending';
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


  const [savedLocations, setSavedLocations] = useLocalStorage<string[]>('firecheck-saved-locations-v1', []);
  const [isChecklistVisible, setIsChecklistVisible] = useState(false);
  const [uploadedLogoDataUrl, setUploadedLogoDataUrl] = useState<string | null>(null);

  const fetchSavedInspectionsFromDb = useCallback(async () => {
    setIsLoadingDbInspections(true);
    try {
      const inspections = await getAllInspectionsFromDB();
      setDbInspections(inspections);
    } catch (error) {
      console.error("Failed to fetch inspections from IndexedDB:", error);
      toast({
        title: "Erro ao Carregar Vistorias Salvas",
        description: "Não foi possível buscar as vistorias do banco de dados do navegador.",
        variant: "destructive",
      });
      setDbInspections([]);
    } finally {
      setIsLoadingDbInspections(false);
    }
  }, [toast]);

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
      fetchSavedInspectionsFromDb();
    }
    setIsClientInitialized(true);
  }, [clientInfo.inspectionDate, fetchSavedInspectionsFromDb]);


  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedLogoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleClientInfoChange = useCallback((field: keyof ClientInfo, value: string) => {
    setClientInfo(prevClientInfo => {
      const newClientInfoState = { ...prevClientInfo, [field]: value };
      if (field === 'clientLocation') {
        if (!newClientInfoState.inspectionNumber || prevClientInfo.clientLocation !== newClientInfoState.clientLocation) {
             newClientInfoState.inspectionNumber = calculateNextInspectionNumber(newClientInfoState.clientLocation);
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

            let floorOverallStateChanged = false;
            const currentTowerFloors = Array.isArray(currentTower.floors) ? currentTower.floors : [];
            const updatedFloors = currentTowerFloors.map((currentFloorData, fIndex) => {
                if (fIndex !== floorIndex) return currentFloorData;

                const originalCategory = currentFloorData.categories.find(cat => cat.id === categoryId);
                if (!originalCategory) return currentFloorData;

                let mutatedCategory = { ...originalCategory };
                let actualModificationsMadeToCategory = false;
                let categoryStructurallyModifiedForAutoCollapse = false;
                const isExpansionChange = update.field === 'isExpanded';
                let autoCollapsedCategoryIdHolder: { id: string | null } = { id: null };


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
                            if (!isExpansionChange) categoryStructurallyModifiedForAutoCollapse = true;
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
                                let subItemChanged = false;
                                if (update.field === 'subItemStatus' && newSubState.status !== (update.value as StatusOption | undefined)) { newSubState.status = update.value as StatusOption | undefined; subItemChanged = true; }
                                else if (update.field === 'subItemObservation' && newSubState.observation !== (update.value as string)) { newSubState.observation = update.value as string; subItemChanged = true; }
                                else if (update.field === 'subItemShowObservation' && newSubState.showObservation !== (update.value as boolean)) { newSubState.showObservation = update.value as boolean; subItemChanged = true; }
                                else if (update.field === 'renameSubItemName' && update.newName && newSubState.name !== update.newName) { newSubState.name = update.newName as string; subItemChanged = true; }
                                else if (update.field === 'subItemPhotoDataUri' && newSubState.photoDataUri !== (update.value as string | null)) { newSubState.photoDataUri = update.value as string | null; if (!update.value) newSubState.photoDescription = ''; subItemChanged = true; }
                                else if (update.field === 'subItemPhotoDescription' && newSubState.photoDescription !== (update.value as string)) { newSubState.photoDescription = update.value as string; subItemChanged = true; }
                                else if (update.field === 'removeSubItemPhoto') { newSubState.photoDataUri = null; newSubState.photoDescription = ''; subItemChanged = true; }

                                if (subItemChanged) {
                                    actualModificationsMadeToCategory = true;
                                    if (!isExpansionChange) categoryStructurallyModifiedForAutoCollapse = true;
                                }
                                return subItemChanged ? newSubState : sub;
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
                                if (!isExpansionChange) categoryStructurallyModifiedForAutoCollapse = true;
                            }
                        }
                        break;
                    default:
                        if (update.field === 'observation' && mutatedCategory.observation !== update.value) { mutatedCategory.observation = update.value as string; actualModificationsMadeToCategory = true; if (!isExpansionChange) categoryStructurallyModifiedForAutoCollapse = true; }
                        else if (update.field === 'showObservation' && mutatedCategory.showObservation !== update.value) { mutatedCategory.showObservation = update.value as boolean; actualModificationsMadeToCategory = true; if (!isExpansionChange) categoryStructurallyModifiedForAutoCollapse = true;}
                        else if (update.field === 'pressureValue' && mutatedCategory.pressureValue !== update.value) { mutatedCategory.pressureValue = update.value as string; actualModificationsMadeToCategory = true; if (!isExpansionChange) categoryStructurallyModifiedForAutoCollapse = true;}
                        else if (update.field === 'pressureUnit' && mutatedCategory.pressureUnit !== update.value) { mutatedCategory.pressureUnit = update.value as InspectionCategoryState['pressureUnit']; actualModificationsMadeToCategory = true; if (!isExpansionChange) categoryStructurallyModifiedForAutoCollapse = true;}
                        else if (update.field === 'renameCategoryTitle' && update.newTitle && mutatedCategory.title !== update.newTitle) { mutatedCategory.title = update.newTitle as string; actualModificationsMadeToCategory = true; }
                        else if (update.field === 'addRegisteredExtinguisher' && mutatedCategory.subItems && update.subItemId && update.value) {
                            const newExt: RegisteredExtinguisher = { ...(update.value as Omit<RegisteredExtinguisher, 'id'>), id: `ext-${generateUniqueId()}` };
                            mutatedCategory.subItems = (mutatedCategory.subItems || []).map(sub =>
                                sub.id === update.subItemId ? { ...sub, registeredExtinguishers: [...(sub.registeredExtinguishers || []), newExt] } : sub
                            );
                            if (mutatedCategory.subItems.some(sub => sub.id === update.subItemId && sub.registeredExtinguishers?.some(e => e.id === newExt.id))) {
                                actualModificationsMadeToCategory = true; if (!isExpansionChange) categoryStructurallyModifiedForAutoCollapse = true;
                            }
                        }
                        else if (update.field === 'removeRegisteredExtinguisher' && mutatedCategory.subItems && update.subItemId && update.extinguisherId) {
                            const oldExtCount = mutatedCategory.subItems.find(s => s.id === update.subItemId)?.registeredExtinguishers?.length || 0;
                            mutatedCategory.subItems = (mutatedCategory.subItems || []).map(sub =>
                                sub.id === update.subItemId ? { ...sub, registeredExtinguishers: (sub.registeredExtinguishers || []).filter(ext => ext.id !== update.extinguisherId) } : sub
                            );
                            const newExtCount = mutatedCategory.subItems.find(s => s.id === update.subItemId)?.registeredExtinguishers?.length || 0;
                            if (newExtCount < oldExtCount) {
                                actualModificationsMadeToCategory = true; if (!isExpansionChange) categoryStructurallyModifiedForAutoCollapse = true;
                            }
                        }
                        else if (update.field === 'addRegisteredHose' && mutatedCategory.subItems && update.subItemId && update.value) {
                            const newHose: RegisteredHose = { ...(update.value as Omit<RegisteredHose, 'id'>), id: `hose-${generateUniqueId()}` };
                            mutatedCategory.subItems = (mutatedCategory.subItems || []).map(sub =>
                                sub.id === update.subItemId ? { ...sub, registeredHoses: [...(sub.registeredHoses || []), newHose] } : sub
                            );
                             if (mutatedCategory.subItems.some(sub => sub.id === update.subItemId && sub.registeredHoses?.some(h => h.id === newHose.id))) {
                                actualModificationsMadeToCategory = true; if (!isExpansionChange) categoryStructurallyModifiedForAutoCollapse = true;
                            }
                        }
                        else if (update.field === 'removeRegisteredHose' && mutatedCategory.subItems && update.subItemId && update.hoseId) {
                             const oldHoseCount = mutatedCategory.subItems.find(s => s.id === update.subItemId)?.registeredHoses?.length || 0;
                            mutatedCategory.subItems = (mutatedCategory.subItems || []).map(sub =>
                                sub.id === update.subItemId ? { ...sub, registeredHoses: (sub.registeredHoses || []).filter(h => h.id !== update.hoseId) } : sub
                            );
                            const newHoseCount = mutatedCategory.subItems.find(s => s.id === update.subItemId)?.registeredHoses?.length || 0;
                             if (newHoseCount < oldHoseCount) {
                                actualModificationsMadeToCategory = true; if (!isExpansionChange) categoryStructurallyModifiedForAutoCollapse = true;
                            }
                        }
                        else if (update.field === 'markAllSubItemsNA' && mutatedCategory.subItems && mutatedCategory.type === 'standard') {
                            let markedAny = false;
                            mutatedCategory.subItems = (mutatedCategory.subItems || []).map(sub => {
                                if (!sub.isRegistry && sub.status !== 'N/A') { markedAny = true; return { ...sub, status: 'N/A' as StatusOption }; }
                                return sub;
                            });
                            if (markedAny) { actualModificationsMadeToCategory = true; if (!isExpansionChange) categoryStructurallyModifiedForAutoCollapse = true; }
                        }
                        else if (update.field === 'addSubItem' && mutatedCategory.type === 'standard' && typeof update.value === 'string' && (update.value as string).trim() !== '') {
                            const newId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                            const newSub: SubItemState = { id: newId, name: (update.value as string).trim(), status: undefined, observation: '', showObservation: false, isRegistry: false, photoDataUri: null, photoDescription: '' };
                            mutatedCategory.subItems = [...(mutatedCategory.subItems || []), newSub];
                            actualModificationsMadeToCategory = true; if (!isExpansionChange) categoryStructurallyModifiedForAutoCollapse = true;
                        }
                        break;
                }

                if (!isExpansionChange &&
                    categoryStructurallyModifiedForAutoCollapse &&
                    originalCategory.isExpanded &&
                    getCategoryOverallStatus(originalCategory) !== 'all-items-selected' && // Only auto-collapse if it wasn't already complete
                    getCategoryOverallStatus(mutatedCategory) === 'all-items-selected'
                   ) {
                    mutatedCategory.isExpanded = false;
                    autoCollapsedCategoryIdHolder.id = originalCategory.id;
                    actualModificationsMadeToCategory = true;
                }


                let finalCategoriesForFloor = [...currentFloorData.categories];
                if (actualModificationsMadeToCategory) {
                    floorOverallStateChanged = true;
                    const categoryModifiedIndex = finalCategoriesForFloor.findIndex(c => c.id === originalCategory.id);
                    if (categoryModifiedIndex !== -1) {
                        finalCategoriesForFloor = [
                            ...finalCategoriesForFloor.slice(0, categoryModifiedIndex),
                            mutatedCategory,
                            ...finalCategoriesForFloor.slice(categoryModifiedIndex + 1)
                        ];
                    }
                }

                if (autoCollapsedCategoryIdHolder.id && autoCollapsedCategoryIdHolder.id === originalCategory.id) {
                    const collapsedIdx = finalCategoriesForFloor.findIndex(c => c.id === autoCollapsedCategoryIdHolder.id);
                    if (collapsedIdx !== -1 && collapsedIdx + 1 < finalCategoriesForFloor.length) {
                        const nextCatOriginal = finalCategoriesForFloor[collapsedIdx + 1];
                        if (!nextCatOriginal.isExpanded) {
                            const updatedNextCat = { ...nextCatOriginal, isExpanded: true };
                             finalCategoriesForFloor = [
                                ...finalCategoriesForFloor.slice(0, collapsedIdx + 1),
                                updatedNextCat,
                                ...finalCategoriesForFloor.slice(collapsedIdx + 2)
                            ];
                            floorOverallStateChanged = true;
                        }
                    }
                }

                return floorOverallStateChanged ? { ...currentFloorData, categories: finalCategoriesForFloor } : currentFloorData;
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
      inspectionDate: defaultInspectionDate, inspectedBy: '',
    };
    setClientInfo(defaultClientInfo);
    setActiveTowersData([createNewTowerEntry()]);
    setIsChecklistVisible(false);
    setIsSavedInspectionsVisible(false); // Hide saved list on new inspection
    setUploadedLogoDataUrl(null);
     if (clientInfo.clientLocation) { // Auto-generate new number only if location was set
        setClientInfo(prev => ({...prev, inspectionNumber: calculateNextInspectionNumber(prev.clientLocation)}));
    }
  }, [clientInfo.clientLocation]);

  const handleAddNewTower = useCallback(() => {
    setActiveTowersData(prevTowers => [...prevTowers, createNewTowerEntry()]);
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
          let newFloorCategories: InspectionCategoryState[];
          const currentFloors = Array.isArray(tower.floors) ? tower.floors : [];
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

          return {
            ...tower,
            floors: [...currentFloors, { ...createNewFloorEntry(), categories: newFloorCategories }],
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

  const handleSaveInspectionToDB = useCallback(async () => {
    if (!clientInfo.inspectionNumber) {
       toast({ title: "ID da Vistoria Necessário", description: "Por favor, preencha o Local para gerar um Número de Vistoria ou insira manualmente.", variant: "destructive" });
       return;
    }
    const inspectionToSave: FullInspectionData = {
      id: clientInfo.inspectionNumber, // Use inspectionNumber as the key for IndexedDB
      clientInfo: { ...clientInfo },
      towers: activeTowersData,
      timestamp: Date.now(),
      uploadedLogoDataUrl: uploadedLogoDataUrl
    };

    try {
      await saveInspectionToDB(inspectionToSave);
      toast({ title: "Vistoria Salva", description: `Vistoria Nº ${inspectionToSave.id} salva no navegador (incluindo fotos e observações).` });
      fetchSavedInspectionsFromDb(); // Refresh the list of saved inspections
    } catch (err: any) {
      console.error('Erro ao salvar vistoria no IndexedDB:', err);
      toast({ title: "Erro ao Salvar", description: err.message || "Não foi possível salvar a vistoria no banco de dados do navegador.", variant: "destructive" });
    }
  }, [clientInfo, activeTowersData, uploadedLogoDataUrl, toast, fetchSavedInspectionsFromDb]);


  const loadInspectionDataToForm = useCallback((inspectionToLoad: FullInspectionData) => {
    const loadedClientInfo = inspectionToLoad.clientInfo || {};
    setClientInfo({
        clientLocation: loadedClientInfo.clientLocation || '',
        clientCode: loadedClientInfo.clientCode || '',
        inspectionNumber: loadedClientInfo.inspectionNumber || inspectionToLoad.id || '', // Prioritize clientInfo.inspectionNumber, then inspectionToLoad.id
        inspectionDate: loadedClientInfo.inspectionDate || (typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : ''),
        inspectedBy: loadedClientInfo.inspectedBy || '',
    });
    setUploadedLogoDataUrl(inspectionToLoad.uploadedLogoDataUrl || null);

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
        isTowerContentVisible: false, // Start hidden when loading from DB/JSON for towers
      };
    });

    setActiveTowersData(sanitizedTowersForForm.length > 0 ? sanitizedTowersForForm : [createNewTowerEntry()]);
    setIsChecklistVisible(true);
    setIsSavedInspectionsVisible(false); // Hide list after loading
  }, [setActiveTowersData, setClientInfo, setUploadedLogoDataUrl, setIsChecklistVisible, setIsSavedInspectionsVisible]);

  const handleLoadInspectionFromDBList = useCallback(async (inspectionId: string) => {
    try {
      const inspectionToLoad = await loadInspectionFromDB(inspectionId);
      if (inspectionToLoad) {
        loadInspectionDataToForm(inspectionToLoad);
        toast({ title: "Vistoria Carregada", description: `Vistoria Nº ${inspectionToLoad.id} carregada do armazenamento do navegador.` });
      } else {
        toast({ title: "Erro ao Carregar", description: `Vistoria Nº ${inspectionId} não encontrada.`, variant: "destructive" });
      }
    } catch (error) {
      console.error("Error loading inspection from DB list:", error);
      toast({ title: "Erro ao Carregar", description: "Não foi possível carregar a vistoria.", variant: "destructive" });
    }
  }, [loadInspectionDataToForm, toast]);

  const handleDeleteInspectionFromDBList = useCallback(async (inspectionId: string, inspectionLocation?: string) => {
    try {
      await deleteInspectionFromDB(inspectionId);
      toast({ title: "Vistoria Removida", description: `Vistoria Nº ${inspectionId} (${inspectionLocation || 'Local não especificado'}) removida com sucesso.` });
      fetchSavedInspectionsFromDb(); // Refresh the list
    } catch (error) {
      console.error("Error deleting inspection from DB list:", error);
      toast({ title: "Erro ao Remover", description: "Não foi possível remover a vistoria.", variant: "destructive" });
    }
  }, [fetchSavedInspectionsFromDb, toast]);

  const handleDownloadJsonFromDBList = useCallback(async (inspectionId: string) => {
    try {
      const inspectionData = await loadInspectionFromDB(inspectionId);
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
  }, [toast]);

  const handleToggleSavedInspections = useCallback(() => {
    setIsSavedInspectionsVisible(prev => !prev);
    if (!isSavedInspectionsVisible) { // If opening, refresh the list
      fetchSavedInspectionsFromDb();
    }
  }, [isSavedInspectionsVisible, fetchSavedInspectionsFromDb]);


  const handleExportCurrentInspectionToJson = useCallback(() => {
    if (!clientInfo.inspectionNumber) {
       toast({ title: "ID da Vistoria Necessário", description: "Por favor, preencha o Local para gerar um Número de Vistoria ou insira manualmente.", variant: "destructive" });
       return;
    }
    const inspectionToExport: FullInspectionData = {
      id: clientInfo.inspectionNumber,
      clientInfo: { ...clientInfo },
      towers: activeTowersData, 
      timestamp: Date.now(),
      uploadedLogoDataUrl: uploadedLogoDataUrl,
    };
    const clientInfoForFilename = { inspectionNumber: inspectionToExport.id, clientLocation: inspectionToExport.clientInfo.clientLocation || 'vistoria' };
    const baseFileName = `vistoria_${clientInfoForFilename.inspectionNumber}_${clientInfoForFilename.clientLocation.replace(/\s+/g, '_')}`;
    const fileName = initiateFileDownload(inspectionToExport, baseFileName);
    toast({ title: "Vistoria Exportada", description: `Arquivo ${fileName} salvo (incluindo fotos e observações da vistoria ativa).` });
  }, [clientInfo, activeTowersData, uploadedLogoDataUrl, toast]);


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
          
          const hasPhotosOrLogo = inspectionToLoad.uploadedLogoDataUrl ||
                                 (inspectionToLoad.towers || []).some(t =>
                                   (t.floors || []).some(f =>
                                     (f.categories || []).some(c =>
                                       (c.subItems || []).some(s => s.photoDataUri)
                                     )
                                   )
                                 );
          toast({ title: "Importação Concluída", description: `Vistoria do arquivo ${file.name} carregada no formulário${hasPhotosOrLogo ? ' com logo/fotos' : ''}. Os dados importados podem ser salvos no navegador.`, duration: 7000 });
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

  const _showAllFloorContentGlobally = useCallback(() => {
    setActiveTowersData(prevTowers => prevTowers.map(tower => ({
      ...tower,
      floors: (Array.isArray(tower.floors) ? tower.floors : []).map(floor => ({
        ...floor,
        isFloorContentVisible: true,
      }))
    })));
  }, []);

  const _hideAllFloorContentGlobally = useCallback(() => {
    setActiveTowersData(prevTowers => prevTowers.map(tower => ({
      ...tower,
      floors: (Array.isArray(tower.floors) ? tower.floors : []).map(floor => ({
        ...floor,
        isFloorContentVisible: false,
      }))
    })));
  }, []);

  const areAnyFloorsGloballyHidden = useMemo(() => {
    return activeTowersData.some(tower =>
      (Array.isArray(tower.floors) ? tower.floors : []).some(floor => !floor.isFloorContentVisible)
    );
  }, [activeTowersData]);

  const handleToggleAllFloorsGlobally = useCallback(() => {
    if (areAnyFloorsGloballyHidden) {
      _showAllFloorContentGlobally();
    } else {
      _hideAllFloorContentGlobally();
    }
  }, [areAnyFloorsGloballyHidden, _showAllFloorContentGlobally, _hideAllFloorContentGlobally]);

  const _showAllTowerContentGlobally = useCallback(() => {
    setActiveTowersData(prevTowers => prevTowers.map(tower => ({
      ...tower,
      isTowerContentVisible: true,
    })));
  }, []);

  const _hideAllTowerContentGlobally = useCallback(() => {
    setActiveTowersData(prevTowers => prevTowers.map(tower => ({
      ...tower,
      isTowerContentVisible: false,
    })));
  }, []);

  const areAnyTowersGloballyHidden = useMemo(() => {
    return activeTowersData.some(tower => !tower.isTowerContentVisible);
  }, [activeTowersData]);

  const handleToggleAllTowersGlobally = useCallback(() => {
    if (areAnyTowersGloballyHidden) {
      _showAllTowerContentGlobally();
    } else {
      _hideAllTowerContentGlobally();
    }
  }, [areAnyTowersGloballyHidden, _showAllTowerContentGlobally, _hideAllTowerContentGlobally]);


  const handleExpandAllCategoriesForFloor = useCallback((towerIndex: number, floorIndex: number) => {
    setActiveTowersData(prevTowers => prevTowers.map((tower, tIdx) => tIdx === towerIndex ? { ...tower, floors: (Array.isArray(tower.floors) ? tower.floors : []).map((floor, fIdx) => fIdx === floorIndex ? { ...floor, categories: floor.categories.map(cat => ({ ...cat, isExpanded: true })) } : floor) } : tower));
  }, []);
  const handleCollapseAllCategoriesForFloor = useCallback((towerIndex: number, floorIndex: number) => {
    setActiveTowersData(prevTowers => prevTowers.map((tower, tIdx) => tIdx === towerIndex ? { ...tower, floors: (Array.isArray(tower.floors) ? tower.floors : []).map((floor, fIdx) => fIdx === floorIndex ? { ...floor, categories: floor.categories.map(cat => ({ ...cat, isExpanded: false })) } : floor) } : tower));
  }, []);
  const handleToggleAllCategoriesForFloor = useCallback((towerIndex: number, floorIndex: number) => {
    const tower = activeTowersData[towerIndex];
    if (tower) { const currentFloors = Array.isArray(tower.floors) ? tower.floors : []; const floor = currentFloors[floorIndex]; if (floor) { const areAnyExpanded = floor.categories.some(cat => cat.isExpanded); if (areAnyExpanded) handleCollapseAllCategoriesForFloor(towerIndex, floorIndex); else handleExpandAllCategoriesForFloor(towerIndex, floorIndex); } }
  }, [activeTowersData, handleCollapseAllCategoriesForFloor, handleExpandAllCategoriesForFloor]);

  const handleToggleTowerContent = useCallback((towerIndex: number) => {
    setActiveTowersData(prevTowers =>
      prevTowers.map((tower, index) =>
        index === towerIndex ? { ...tower, isTowerContentVisible: !tower.isTowerContentVisible } : tower
      )
    );
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

  const handleRemoveCategoryFromFloor = useCallback((towerIndex: number, floorIndex: number, categoryIdToRemove: string) => {
    setActiveTowersData(prevTowers => {
      let overallTowersChanged = false;
      const newTowers = prevTowers.map((tower, tIdx) => {
        if (tIdx !== towerIndex) { return tower; }
        let towerContentChanged = false;
        const currentFloors = Array.isArray(tower.floors) ? tower.floors : [];
        const newFloors = currentFloors.map((floor, fIdx) => {
          if (fIdx !== floorIndex) { return floor; }
          const originalCategories = floor.categories;
          const filteredCategories = originalCategories.filter(cat => cat.id !== categoryIdToRemove);
          if (filteredCategories.length < originalCategories.length) {
            towerContentChanged = true;
            return { ...floor, categories: filteredCategories };
          }
          return floor;
        });
        if (towerContentChanged) { overallTowersChanged = true; return { ...tower, floors: newFloors }; }
        return tower;
      });
      if (overallTowersChanged) { return newTowers; }
      return prevTowers;
    });
  }, []);

  const handleGeneratePdf = useCallback(async () => { await generateInspectionPdf(clientInfo, activeTowersData, uploadedLogoDataUrl); }, [clientInfo, activeTowersData, uploadedLogoDataUrl]);
  const handleGenerateRegisteredItemsReport = useCallback(async () => { await generateRegisteredItemsPdf(clientInfo, activeTowersData, uploadedLogoDataUrl); }, [clientInfo, activeTowersData, uploadedLogoDataUrl]);
  const handleGenerateNCItemsReport = useCallback(async () => { await generateNCItemsPdf(clientInfo, activeTowersData, uploadedLogoDataUrl); }, [clientInfo, activeTowersData, uploadedLogoDataUrl]);
  const handleGeneratePhotoReportPdf = useCallback(async () => { await generatePhotoReportPdf(clientInfo, activeTowersData, uploadedLogoDataUrl); }, [clientInfo, activeTowersData, uploadedLogoDataUrl]);


  if (!isClientInitialized) return <div className="flex justify-center items-center h-screen bg-background"><p className="text-foreground">Carregando formulário...</p></div>;

  return (
    <ScrollArea className="h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <AppHeader uploadedLogoDataUrl={uploadedLogoDataUrl} onLogoUpload={handleLogoUpload} />
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
                  size="icon"
                  className={cn(
                    "rounded-full",
                    areAnyGlobalCategoriesExpanded
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  )}
                  title={areAnyGlobalCategoriesExpanded ? "Recolher Todas as Categorias (Global)" : "Expandir Todas as Categorias (Global)"}
                >
                  {areAnyGlobalCategoriesExpanded ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
                <Button
                  onClick={handleToggleAllFloorsGlobally}
                  size="icon"
                  className={cn(
                    "rounded-full",
                    areAnyFloorsGloballyHidden
                      ? "bg-green-500 hover:bg-green-600 text-white" 
                      : "bg-red-500 hover:bg-red-600 text-white"
                  )}
                  title={areAnyFloorsGloballyHidden ? "Mostrar Conteúdo de Todos os Andares" : "Ocultar Conteúdo de Todos os Andares"}
                >
                  {areAnyFloorsGloballyHidden ? <Layers className="h-5 w-5" /> : <PanelTopClose className="h-5 w-5" />}
                </Button>
                <Button 
                  onClick={handleToggleAllTowersGlobally} 
                  size="icon" 
                  className={cn(
                    "rounded-full",
                    areAnyTowersGloballyHidden
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  )}
                  title={areAnyTowersGloballyHidden ? "Mostrar Conteúdo de Todas as Torres" : "Ocultar Conteúdo de Todas as Torres"}
                >
                  {areAnyTowersGloballyHidden ? <Library className="h-5 w-5" /> : <Archive className="h-5 w-5" />}
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
                        className="text-lg font-semibold w-[150px]"
                      />
                       <Button 
                        onClick={() => handleToggleTowerContent(towerIndex)} 
                        size="icon"
                        className={cn(
                          "rounded-full h-9 w-9",
                          tower.isTowerContentVisible
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        )}
                        title={tower.isTowerContentVisible ? "Ocultar Conteúdo da Torre" : "Mostrar Conteúdo da Torre"}
                       >
                         {tower.isTowerContentVisible ? <ChevronUp className="h-5 w-5"/> : <ChevronDown className="h-5 w-5"/>}
                       </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                       {activeTowersData.length > 1 && (
                         <Button variant="ghost" size="icon" onClick={() => handleRemoveTower(towerIndex)} className="text-destructive hover:bg-destructive/10 h-9 w-9" title="Remover esta torre">
                           <Trash2 className="h-5 w-5" />
                         </Button>
                       )}
                    </div>
                  </CardHeader>
                  {tower.isTowerContentVisible && (
                    <CardContent className="p-4 space-y-4">
                      {(Array.isArray(tower.floors) ? tower.floors : []).map((floorData, floorIndex) => {
                        const areAnyCategoriesExpanded = floorData.categories.some(cat => cat.isExpanded);
                        return (
                          <Card key={floorData.id} className="mb-6 shadow-sm">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex flex-col md:flex-row md:items-center md:flex-wrap gap-x-2 gap-y-2 mb-2">
                                <div className="flex flex-row items-center gap-x-2">
                                  <Label htmlFor={`floorName-${floorData.id}`} className="text-sm font-medium whitespace-nowrap">
                                    ANDAR:
                                  </Label>
                                  <Input
                                    id={`floorName-${floorData.id}`}
                                    value={floorData.floor}
                                    onChange={(e) => handleFloorSpecificFieldChange(towerIndex, floorIndex, 'floor', e.target.value)}
                                    placeholder="Ex: Térreo, 1A"
                                    className="w-[150px] h-9 text-sm"
                                  />
                                  <Button 
                                    onClick={() => handleToggleAllCategoriesForFloor(towerIndex, floorIndex)}
                                    size="icon"
                                    title={areAnyCategoriesExpanded ? "Recolher itens do andar" : "Expandir itens do andar"}
                                    className={cn(
                                      "rounded-full h-9 w-9", 
                                      areAnyCategoriesExpanded
                                        ? "bg-red-500 hover:bg-red-600 text-white"
                                        : "bg-green-500 hover:bg-green-600 text-white"
                                    )}
                                  >
                                    {areAnyCategoriesExpanded ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                  </Button>
                                  <Button 
                                    onClick={() => handleToggleFloorContent(towerIndex, floorIndex)} 
                                    size="icon" 
                                    title={floorData.isFloorContentVisible ? "Ocultar conteúdo do andar" : "Mostrar conteúdo do andar"}
                                    className={cn(
                                      "rounded-full h-9 w-9",
                                      floorData.isFloorContentVisible
                                        ? "bg-red-500 hover:bg-red-600 text-white"
                                        : "bg-green-500 hover:bg-green-600 text-white"
                                    )}
                                  >
                                    {floorData.isFloorContentVisible ? <ChevronUp className="h-5 w-5"/> : <ChevronDown className="h-5 w-5"/>}
                                  </Button>
                                </div>
                                <div className="flex flex-row items-center gap-x-2 md:ml-auto">
                                  {(Array.isArray(tower.floors) ? tower.floors : []).length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveFloorFromTower(towerIndex, floorIndex)} className="text-destructive hover:bg-destructive/10 h-8 w-8" title="Remover este andar">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {floorData.isFloorContentVisible && (
                                <>
                                  {floorData.categories.map((category) => {
                                    const overallStatus = getCategoryOverallStatus(category);
                                    return (
                                      <InspectionCategoryItem
                                        key={`${floorData.id}-${category.id}`}
                                        category={category}
                                        overallStatus={overallStatus}
                                        onCategoryItemUpdate={(catId, update) => handleCategoryItemUpdateForFloor(towerIndex, floorIndex, catId, update)}
                                        isMobile={isMobile}
                                      />
                                    );
                                  })}
                                </>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                       <div className="mt-4 flex justify-end">
                        <Button onClick={() => handleAddFloorToTower(towerIndex)} variant="outline" size="sm" className="rounded-full border-green-500 text-green-600 hover:bg-green-500/10">
                          <Plus className="mr-1 h-4 w-4" /> Adicionar Andar
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )})}
            </>
          )}
        </div>

        <ActionButtonsPanel
          onSave={handleSaveInspectionToDB}
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

        {isSavedInspectionsVisible && (
          <SavedInspectionsList
            inspections={dbInspections}
            isLoading={isLoadingDbInspections}
            onLoadInspection={handleLoadInspectionFromDBList}
            onDeleteInspection={handleDeleteInspectionFromDBList}
            onDownloadJson={handleDownloadJsonFromDBList}
          />
        )}

        <footer className="text-center text-sm text-muted-foreground mt-12 pb-8">FireCheck Brazil &copy; {new Date().getFullYear()} - BRAZIL EXTINTORES</footer>
      </div>
    </ScrollArea>
  );
}
    
    
