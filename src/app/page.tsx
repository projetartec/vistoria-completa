
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
import { ChevronDown, ChevronUp, Trash2, Eye, EyeOff, Rows3, Columns3, Copy, Edit2, FileJson, PlusSquare, Building, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const generateUniqueId = () => `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`;

const createNewFloorEntry = (): FloorData => {
  return {
    id: generateUniqueId(),
    ...JSON.parse(JSON.stringify(INITIAL_FLOOR_DATA)), // Deep copy
    floor: '', // Floor name will be set by user
    categories: JSON.parse(JSON.stringify(INITIAL_FLOOR_DATA.categories)).map((cat: InspectionCategoryState) => ({...cat, isExpanded: false})),
    isFloorContentVisible: true,
  };
};

const createNewTowerEntry = (): TowerData => {
  return {
    id: generateUniqueId(),
    towerName: '',
    floors: [createNewFloorEntry()],
    isTowerContentVisible: true,
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

  const initialSavedFullInspections = useMemo(() => [], []);
  const [savedInspections, setSavedInspections] = useLocalStorage<FullInspectionData[]>('firecheck-full-inspections-v3-towers', initialSavedFullInspections);

  const [savedLocations, setSavedLocations] = useLocalStorage<string[]>('firecheck-saved-locations-v1', []);
  const [isChecklistVisible, setIsChecklistVisible] = useState(false);
  const [isSavedInspectionsVisible, setIsSavedInspectionsVisible] = useState(false);
  const [uploadedLogoDataUrl, setUploadedLogoDataUrl] = useState<string | null>(null);

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
    }
    setIsClientInitialized(true);
  }, [clientInfo.inspectionDate]);


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
        return {
          ...tower,
          floors: tower.floors.map((floor, fIndex) =>
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
            const updatedFloors = currentTower.floors.map((currentFloorData, fIndex) => {
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
                    getCategoryOverallStatus(originalCategory) !== 'all-items-selected' && // Was not complete before
                    getCategoryOverallStatus(mutatedCategory) === 'all-items-selected'      // Is complete now
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

            return (updatedFloors.some((floor, idx) => floor !== currentTower.floors[idx]))
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
    setUploadedLogoDataUrl(null);
  }, []);

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
          const sourceFloorForCategories = tower.floors.length > 0 ? tower.floors[tower.floors.length - 1] : null;

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
            floors: [...tower.floors, { ...createNewFloorEntry(), categories: newFloorCategories }],
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
          if (tower.floors.length <= 1) {
             toast({ title: "Ação não permitida", description: "Não é possível remover o único andar da torre.", variant: "default" });
             return tower;
          }
          return {
            ...tower,
            floors: tower.floors.filter((_, fIndex) => fIndex !== floorIndex),
          };
        }
        return tower;
      })
    );
  }, [toast]);

  const handleSaveInspection = useCallback(() => {
    const currentClientInfo = clientInfo;

    // Prepare data for localStorage: strip photoDataUri from subItems
    const towersForLocalStorage = activeTowersData.map(tower => ({
        ...tower,
        floors: tower.floors.map(floor => ({
            ...floor,
            categories: floor.categories.map(category => ({
                ...category,
                subItems: category.subItems ? category.subItems.map(subItem => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { photoDataUri, ...restOfSubItem } = subItem;
                    return { ...restOfSubItem, photoDataUri: null }; // Ensure photoDataUri is null for localStorage
                }) : undefined,
            })),
        })),
    }));

    const fullInspectionToSaveForLocalStorage: FullInspectionData = {
      id: currentClientInfo.inspectionNumber || `temp-id-${Date.now()}`,
      clientInfo: { ...currentClientInfo },
      towers: towersForLocalStorage,
      timestamp: Date.now(),
      uploadedLogoDataUrl: uploadedLogoDataUrl // Keep logo for localStorage
    };

    setSavedInspections(prevSaved => {
      let newSavedList = [...prevSaved];
      const existingIndex = newSavedList.findIndex(insp => insp.id === fullInspectionToSaveForLocalStorage.id && insp.id !== '');
      if (existingIndex > -1 && fullInspectionToSaveForLocalStorage.id) {
        newSavedList[existingIndex] = fullInspectionToSaveForLocalStorage;
      } else {
        newSavedList.push(fullInspectionToSaveForLocalStorage);
      }
      const sortedList = newSavedList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      const hasNamedTowersOrFloors = activeTowersData.some(t => (t.towerName && t.towerName.trim() !== "") || t.floors.some(f => f.floor && f.floor.trim() !== ""));

      if (fullInspectionToSaveForLocalStorage.id && !fullInspectionToSaveForLocalStorage.id.startsWith('temp-id-')) {
        toast({ title: "Vistoria Salva", description: `Vistoria Nº ${fullInspectionToSaveForLocalStorage.id} salva (observações salvas, fotos não são salvas no navegador para economizar espaço).` });
      } else if (hasNamedTowersOrFloors) {
         toast({ title: "Vistoria Salva", description: `Vistoria (ID temporário) salva (observações salvas, fotos não são salvas no navegador para economizar espaço). Preencha o Local para gerar Nº Vistoria.` });
      }
      return sortedList;
    });
  }, [clientInfo, activeTowersData, setSavedInspections, uploadedLogoDataUrl, toast]);

  const handleLoadInspection = (fullInspectionId: string) => {
    const inspectionToLoad = savedInspections.find(insp => insp.id === fullInspectionId);
    if (inspectionToLoad) {
        const loadedClientInfo = inspectionToLoad.clientInfo || {};
        setClientInfo({
            clientLocation: loadedClientInfo.clientLocation || '',
            clientCode: loadedClientInfo.clientCode || '',
            inspectionNumber: loadedClientInfo.inspectionNumber || '',
            inspectionDate: loadedClientInfo.inspectionDate || (typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : ''),
            inspectedBy: loadedClientInfo.inspectedBy || '',
        });
        setUploadedLogoDataUrl(inspectionToLoad.uploadedLogoDataUrl || null);

        // When loading from localStorage, photoDataUri for sub-items will be null.
        // The structure here ensures all config-defined items are present.
        const sanitizedTowers = (inspectionToLoad.towers || []).map(tower => ({
            ...tower,
            id: (tower.id && typeof tower.id === 'string' && !tower.id.startsWith('server-temp-id-')) ? tower.id : generateUniqueId(),
            isTowerContentVisible: false,
            floors: (tower.floors || []).map(floor => ({
                ...floor,
                id: (floor.id && typeof floor.id === 'string' && !floor.id.startsWith('server-temp-id-')) ? floor.id : generateUniqueId(),
                isFloorContentVisible: false,
                categories: INSPECTION_CONFIG.map(cfg => {
                    const loadedCat = (floor.categories || []).find(lc => lc.id === cfg.id);
                    const loadedSubItems = loadedCat?.subItems || [];

                    return {
                        id: cfg.id,
                        title: loadedCat?.title || cfg.title,
                        type: cfg.type,
                        isExpanded: false, // Always collapse on load
                        status: loadedCat?.status,
                        observation: loadedCat?.observation || '',
                        showObservation: loadedCat?.showObservation || false,
                        pressureValue: loadedCat?.pressureValue || '',
                        pressureUnit: loadedCat?.pressureUnit || '',
                        subItems: cfg.subItems?.map(sCfg => {
                            const loadedSubItem = loadedSubItems.find(ls => ls.id === sCfg.id);
                            return {
                                id: sCfg.id,
                                name: loadedSubItem?.name || sCfg.name,
                                status: loadedSubItem?.status,
                                observation: loadedSubItem?.observation || '',
                                showObservation: loadedSubItem?.showObservation || false,
                                isRegistry: sCfg.isRegistry || false,
                                photoDataUri: loadedSubItem?.photoDataUri || null, // Will be null from localStorage
                                photoDescription: loadedSubItem?.photoDescription || '',
                                registeredExtinguishers: loadedSubItem?.registeredExtinguishers?.map(ext => ({ ...ext, id: (ext.id && typeof ext.id === 'string' && !ext.id.includes('NaN') && !ext.id.startsWith('server-temp-id-')) ? ext.id : `${generateUniqueId()}-ext` })) || (sCfg.isRegistry && sCfg.id === 'extintor_cadastro' ? [] : undefined),
                                registeredHoses: loadedSubItem?.registeredHoses?.map(hose => ({ ...hose, id: (hose.id && typeof hose.id === 'string' && !hose.id.includes('NaN') && !hose.id.startsWith('server-temp-id-')) ? hose.id : `${generateUniqueId()}-hose` })) || (sCfg.isRegistry && sCfg.id === 'hidrantes_cadastro_mangueiras' ? [] : undefined),
                            };
                        }).concat( // Add custom sub-items from localStorage not in INSPECTION_CONFIG
                            loadedSubItems.filter(ls => !cfg.subItems?.some(sCfg => sCfg.id === ls.id))
                            .map(customSub => ({
                                ...customSub,
                                id: (customSub.id && typeof customSub.id === 'string' && !customSub.id.includes('NaN') && !customSub.id.startsWith('server-temp-id-') && (!customSub.id.startsWith('custom-') || customSub.id.length > 20) ) ? customSub.id : customSub.id.startsWith('custom-') ? customSub.id : `loaded-sub-${generateUniqueId()}`,
                                photoDataUri: null, // Explicitly null for localStorage sourced custom items
                                photoDescription: customSub.photoDescription || '',
                            }))
                        ) || [],
                    };
                }),
            })),
        }));

        setActiveTowersData(sanitizedTowers.length > 0 ? sanitizedTowers : [createNewTowerEntry()]);
        setIsSavedInspectionsVisible(false); setIsChecklistVisible(true);
        
        toast({ title: "Vistoria Carregada", description: `Vistoria Nº ${fullInspectionId} carregada (observações restauradas; fotos de vistorias salvas no navegador não são armazenadas).`});
    }
  };


  const handleDeleteInspection = useCallback((fullInspectionId: string) => {
    setSavedInspections(prev => prev.filter(insp => insp.id !== fullInspectionId));
    toast({ title: "Vistoria Excluída", description: `Vistoria Nº ${fullInspectionId} foi excluída.`, variant: "destructive" });
    if (clientInfo.inspectionNumber === fullInspectionId) resetInspectionForm();
  }, [setSavedInspections, clientInfo.inspectionNumber, resetInspectionForm, toast]);

  const handleDeleteMultipleInspections = useCallback((inspectionIds: string[]) => {
    setSavedInspections(prev => prev.filter(insp => !inspectionIds.includes(insp.id)));
    toast({ title: "Vistorias Excluídas", description: `${inspectionIds.length} vistoria(s) foram excluídas.`, variant: "destructive" });
    if (clientInfo.inspectionNumber && inspectionIds.includes(clientInfo.inspectionNumber)) resetInspectionForm();
  }, [setSavedInspections, clientInfo.inspectionNumber, resetInspectionForm, toast]);

  const handleDuplicateInspection = useCallback((originalInspectionId: string) => {
    const originalInspection = savedInspections.find(insp => insp.id === originalInspectionId);
    if (originalInspection) {
      const duplicatedInspection = JSON.parse(JSON.stringify(originalInspection)) as FullInspectionData; // Deep copy from localStorage
      const newInspectionNumber = `${(originalInspection.clientInfo.inspectionNumber || 'COPIA')}_CÓPIA_${Date.now().toString().slice(-5)}`;
      duplicatedInspection.id = newInspectionNumber;
      duplicatedInspection.clientInfo = {
        ...(originalInspection.clientInfo || {}),
        inspectionNumber: newInspectionNumber,
        inspectionDate: typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '',
        inspectedBy: clientInfo.inspectedBy || '', // Use current inspector for new copy
      };
      duplicatedInspection.timestamp = Date.now();
      
      // Photos are already stripped in originalInspection from localStorage.
      // We just need to ensure IDs are new for the duplicated structure.
      duplicatedInspection.towers = (duplicatedInspection.towers || []).map(tower => ({
        ...tower, id: generateUniqueId(), isTowerContentVisible: false,
        floors: (tower.floors || []).map(floor => ({
          ...floor, id: generateUniqueId(), isFloorContentVisible: false,
          categories: (floor.categories || []).map(cat => ({
            ...cat, isExpanded: false,
            subItems: (cat.subItems || []).map(sub => ({
              ...sub, // photoDataUri will be null here from localStorage copy
              id: sub.id.startsWith('custom-') || sub.isRegistry ? `${sub.id.split('-')[0]}-${generateUniqueId()}-copy` : sub.id,
              registeredExtinguishers: (sub.registeredExtinguishers || []).map(ext => ({ ...ext, id: `${generateUniqueId()}-extcopy`})),
              registeredHoses: (sub.registeredHoses || []).map(hose => ({ ...hose, id: `${generateUniqueId()}-hosecopy` }))
            }))
          }))
        }))
      }));
      setSavedInspections(prev => [duplicatedInspection, ...prev].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      
      toast({ title: "Vistoria Duplicada", description: `Nova Vistoria Nº ${newInspectionNumber} criada. Fotos não são duplicadas de dados salvos no navegador.`});
    }
  }, [savedInspections, setSavedInspections, toast, clientInfo.inspectedBy]);

  const handleUpdateClientLocationForSavedInspection = useCallback((inspectionId: string, newClientLocation: string) => {
    setSavedInspections(prevInspections =>
      prevInspections.map(insp =>
        insp.id === inspectionId
          ? { ...insp, clientInfo: { ...insp.clientInfo, clientLocation: newClientLocation } }
          : insp
      ).sort((a,b) => (b.timestamp||0) - (a.timestamp||0))
    );
    if (clientInfo.inspectionNumber === inspectionId) {
      setClientInfo(prev => ({ ...prev, clientLocation: newClientLocation }));
    }
    toast({ title: "Local Atualizado", description: `Local da vistoria Nº ${inspectionId} atualizado.`});
  }, [setSavedInspections, clientInfo.inspectionNumber, toast]);

  const handleGeneratePdf = useCallback(async () => {
    await generateInspectionPdf(clientInfo, activeTowersData, uploadedLogoDataUrl);
  }, [clientInfo, activeTowersData, uploadedLogoDataUrl]);

  const handleGenerateRegisteredItemsReport = useCallback(async () => {
    await generateRegisteredItemsPdf(clientInfo, activeTowersData, uploadedLogoDataUrl);
  }, [clientInfo, activeTowersData, uploadedLogoDataUrl]);

  const handleGenerateNCItemsReport = useCallback(async () => {
    await generateNCItemsPdf(clientInfo, activeTowersData, uploadedLogoDataUrl);
  }, [clientInfo, activeTowersData, uploadedLogoDataUrl]);

  const handleGeneratePhotoReportPdf = useCallback(async () => {
    await generatePhotoReportPdf(clientInfo, activeTowersData, uploadedLogoDataUrl);
  }, [clientInfo, activeTowersData, uploadedLogoDataUrl]);


  const handlePrintPage = useCallback(() => { if (typeof window !== 'undefined') window.print(); }, []);
  const toggleSavedInspections = () => setIsSavedInspectionsVisible(!isSavedInspectionsVisible);

  const handleCollapseAllGlobalCategories = useCallback(() => {
    setActiveTowersData(prevTowers => prevTowers.map(tower => ({ ...tower, floors: tower.floors.map(floor => ({ ...floor, categories: floor.categories.map(cat => ({ ...cat, isExpanded: false })) })) })));
  }, []);
  const handleExpandAllGlobalCategories = useCallback(() => {
    setActiveTowersData(prevTowers => prevTowers.map(tower => ({ ...tower, floors: tower.floors.map(floor => ({ ...floor, categories: floor.categories.map(cat => ({ ...cat, isExpanded: true })) })) })));
  }, []);

  const handleShowAllTowerContent = useCallback(() => {
    setActiveTowersData(prevTowers => prevTowers.map(tower => ({ ...tower, isTowerContentVisible: true })));
  }, []);
  const handleHideAllTowerContent = useCallback(() => {
    setActiveTowersData(prevTowers => prevTowers.map(tower => ({ ...tower, isTowerContentVisible: false })));
  }, []);

  const handleShowAllFloorContent = useCallback((towerIndex: number) => {
    setActiveTowersData(prevTowers => prevTowers.map((tower, tIdx) => tIdx === towerIndex ? { ...tower, floors: tower.floors.map(f => ({ ...f, isFloorContentVisible: true })) } : tower));
  }, []);
  const handleHideAllFloorContent = useCallback((towerIndex: number) => {
    setActiveTowersData(prevTowers => prevTowers.map((tower, tIdx) => tIdx === towerIndex ? { ...tower, floors: tower.floors.map(f => ({ ...f, isFloorContentVisible: false })) } : tower));
  }, []);

  const handleExpandAllCategoriesForFloor = useCallback((towerIndex: number, floorIndex: number) => {
    setActiveTowersData(prevTowers => prevTowers.map((tower, tIdx) => tIdx === towerIndex ? { ...tower, floors: tower.floors.map((floor, fIdx) => fIdx === floorIndex ? { ...floor, categories: floor.categories.map(cat => ({ ...cat, isExpanded: true })) } : floor) } : tower));
  }, []);
  const handleCollapseAllCategoriesForFloor = useCallback((towerIndex: number, floorIndex: number) => {
    setActiveTowersData(prevTowers => prevTowers.map((tower, tIdx) => tIdx === towerIndex ? { ...tower, floors: tower.floors.map((floor, fIdx) => fIdx === floorIndex ? { ...floor, categories: floor.categories.map(cat => ({ ...cat, isExpanded: false })) } : floor) } : tower));
  }, []);
  const handleToggleAllCategoriesForFloor = useCallback((towerIndex: number, floorIndex: number) => {
    const tower = activeTowersData[towerIndex];
    if (tower) { const floor = tower.floors[floorIndex]; if (floor) { const areAnyExpanded = floor.categories.some(cat => cat.isExpanded); if (areAnyExpanded) handleCollapseAllCategoriesForFloor(towerIndex, floorIndex); else handleExpandAllCategoriesForFloor(towerIndex, floorIndex); } }
  }, [activeTowersData, handleCollapseAllCategoriesForFloor, handleExpandAllCategoriesForFloor]);

  const handleToggleTowerContent = useCallback((towerIndex: number) => {
    setActiveTowersData(prevTowers => prevTowers.map((tower, index) => index === towerIndex ? { ...tower, isTowerContentVisible: !(tower.isTowerContentVisible !== undefined ? tower.isTowerContentVisible : true) } : tower));
  }, []);
  const handleToggleFloorContent = useCallback((towerIndex: number, floorIndex: number) => {
    setActiveTowersData(prevTowers => prevTowers.map((tower, tIdx) => tIdx === towerIndex ? { ...tower, floors: tower.floors.map((floor, fIdx) => fIdx === floorIndex ? { ...floor, isFloorContentVisible: !(floor.isFloorContentVisible !== undefined ? floor.isFloorContentVisible : true) } : floor) } : tower));
  }, []);


  const handleRemoveCategoryFromFloor = useCallback((towerIndex: number, floorIndex: number, categoryIdToRemove: string) => {
    setActiveTowersData(prevTowers => {
      let overallTowersChanged = false;

      const newTowers = prevTowers.map((tower, tIdx) => {
        if (tIdx !== towerIndex) {
          return tower;
        }

        let towerContentChanged = false;
        const newFloors = tower.floors.map((floor, fIdx) => {
          if (fIdx !== floorIndex) {
            return floor;
          }

          const originalCategories = floor.categories;
          const filteredCategories = originalCategories.filter(cat => cat.id !== categoryIdToRemove);

          if (filteredCategories.length < originalCategories.length) {
            towerContentChanged = true;
            return { ...floor, categories: filteredCategories };
          }
          return floor;
        });

        if (towerContentChanged) {
          overallTowersChanged = true;
          return { ...tower, floors: newFloors };
        }
        return tower;
      });

      if (overallTowersChanged) {
        return newTowers;
      }
      return prevTowers;
    });
  }, []);


  const handleExportCurrentInspectionToJson = useCallback(() => {
    // Full activeTowersData (with photos) is used for JSON export
    const inspectionToExport: FullInspectionData = {
      id: clientInfo.inspectionNumber || `export-id-${Date.now()}`,
      clientInfo: { ...clientInfo },
      towers: activeTowersData, // Use activeTowersData directly
      timestamp: Date.now(),
      uploadedLogoDataUrl: uploadedLogoDataUrl,
    };
    const clientInfoForFilename = { inspectionNumber: inspectionToExport.id, clientLocation: inspectionToExport.clientInfo.clientLocation || 'vistoria' };
    const baseFileName = `vistoria_${clientInfoForFilename.inspectionNumber}_${clientInfoForFilename.clientLocation.replace(/\s+/g, '_')}`;
    const fileName = initiateFileDownload(inspectionToExport, baseFileName);
    toast({ title: "Vistoria Exportada", description: `Arquivo ${fileName} salvo (incluindo fotos e observações da vistoria ativa).` });
  }, [clientInfo, activeTowersData, uploadedLogoDataUrl, toast]);

  const handleDownloadSelectedInspections = useCallback((inspectionIds: string[]) => {
    const inspectionsToDownload = savedInspections.filter(insp => inspectionIds.includes(insp.id));
    if (inspectionsToDownload.length > 0) {
      const fileName = initiateFileDownload(inspectionsToDownload, 'vistorias_selecionadas');
      toast({ title: "Download Iniciado", description: `${inspectionsToDownload.length} vistoria(s) salvas em ${fileName} (fotos não inclusas no JSON do navegador).`});
    } else {
      toast({ title: "Nenhuma Vistoria Selecionada", description: "Selecione vistorias para baixar.", variant: "default"});
    }
  }, [savedInspections, toast]);

  const handleDownloadSingleSavedInspection = useCallback((inspectionId: string) => {
    const inspectionToDownload = savedInspections.find(insp => insp.id === inspectionId);
    if (inspectionToDownload) {
      const clientInfoForFilename = {
        inspectionNumber: inspectionToDownload.id,
        clientLocation: inspectionToDownload.clientInfo.clientLocation || 'vistoria_salva'
      };
      const baseFileName = `vistoria_${clientInfoForFilename.inspectionNumber}_${clientInfoForFilename.clientLocation.replace(/\s+/g, '_')}`;
      const fileName = initiateFileDownload(inspectionToDownload, baseFileName);
      toast({ title: "Download Iniciado", description: `Vistoria ${fileName} salva (fotos não inclusas no JSON do navegador).`});
    }
  }, [savedInspections, toast]);

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

    let firstInspectionToLoadToFormWithPhotos: FullInspectionData | null = null;
    const allInspectionsFromFiles: FullInspectionData[] = [];

    const readFilePromise = (file: File): Promise<FullInspectionData[]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonString = e.target?.result as string;
            if (!jsonString || jsonString.trim() === "") {
                console.warn(`Conteúdo vazio ou inválido no arquivo ${file.name}`);
                resolve([]);
                return;
            }
            const importedData = JSON.parse(jsonString);

            if (typeof importedData !== 'object' || importedData === null) {
                console.warn(`Conteúdo JSON não é um objeto ou array válido no arquivo ${file.name}:`, JSON.stringify(importedData, null, 2).substring(0,100));
                resolve([]);
                return;
            }

            const inspectionsToProcess: FullInspectionData[] = Array.isArray(importedData) ? importedData : [importedData];
            const validInspectionsFromFile: FullInspectionData[] = [];

            inspectionsToProcess.forEach(inspection => {
              if (inspection && typeof inspection === 'object' &&
                  typeof inspection.id === 'string' &&
                  inspection.clientInfo && typeof inspection.clientInfo === 'object' &&
                  Array.isArray(inspection.towers) &&
                  typeof inspection.timestamp === 'number') {
                validInspectionsFromFile.push(inspection);
              } else {
                console.warn(`Vistoria inválida ou incompleta no arquivo ${file.name} pulada. Conteúdo parcial:`, JSON.stringify(inspection, null, 2).substring(0, 500));
              }
            });
            resolve(validInspectionsFromFile);
          } catch (error) {
            console.error(`Erro ao parsear JSON do arquivo ${file.name}:`, error);
            toast({ title: "Erro de Parse", description: `Não foi possível parsear ${file.name}. Verifique o formato.`, variant: "destructive"});
            reject(error);
          }
        };
        reader.onerror = (err) => {
          console.error(`Erro ao ler o arquivo ${file.name}:`, err);
          toast({ title: "Erro de Leitura", description: `Não foi possível ler ${file.name}.`, variant: "destructive"});
          reject(err);
        };
        reader.readAsText(file);
      });
    };

    const fileReadResults = await Promise.allSettled(Array.from(currentFiles).map(file => readFilePromise(file)));

    fileReadResults.forEach((result, fileIndex) => {
      if (result.status === 'fulfilled' && result.value) {
        result.value.forEach((inspection, inspectionIndexWithinFile) => {
          allInspectionsFromFiles.push(inspection);
          if (fileIndex === 0 && inspectionIndexWithinFile === 0 && !firstInspectionToLoadToFormWithPhotos) {
            firstInspectionToLoadToFormWithPhotos = inspection;
          }
        });
      } else if (result.status === 'rejected') {
        console.error(`Falha ao processar um dos arquivos:`, result.reason);
      }
    });

    let finalImportedCount = 0;
    let finalUpdatedCount = 0;

    if (allInspectionsFromFiles.length > 0) {
      setSavedInspections(currentSavedInspections => {
        let newOrUpdatedInspectionsList = [...currentSavedInspections];
        let currentImported = 0;
        let currentUpdated = 0;

        allInspectionsFromFiles.forEach(inspectionToImport => {
          const inspectionForLocalStorageProcessing: FullInspectionData = JSON.parse(JSON.stringify(inspectionToImport));
           inspectionForLocalStorageProcessing.towers = inspectionForLocalStorageProcessing.towers.map(tower => ({
              ...tower,
              floors: tower.floors.map(floor => ({
                  ...floor,
                  categories: floor.categories.map(category => ({
                      ...category,
                      subItems: category.subItems ? category.subItems.map(subItem => {
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          const { photoDataUri, ...restOfSubItem } = subItem;
                          return { ...restOfSubItem, photoDataUri: null };
                      }) : undefined,
                  })),
              })),
          }));


          const existingIndex = newOrUpdatedInspectionsList.findIndex(insp => insp.id === inspectionForLocalStorageProcessing.id && insp.id);
          if (existingIndex > -1) {
            newOrUpdatedInspectionsList[existingIndex] = inspectionForLocalStorageProcessing;
            currentUpdated++;
          } else {
            newOrUpdatedInspectionsList.push(inspectionForLocalStorageProcessing);
            currentImported++;
          }
        });
        finalImportedCount = currentImported;
        finalUpdatedCount = currentUpdated;
        return newOrUpdatedInspectionsList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      });
    }

    if (firstInspectionToLoadToFormWithPhotos) {
        setClientInfo({ // Set client info directly from the loaded inspection
            clientLocation: firstInspectionToLoadToFormWithPhotos.clientInfo.clientLocation || '',
            clientCode: firstInspectionToLoadToFormWithPhotos.clientInfo.clientCode || '',
            inspectionNumber: firstInspectionToLoadToFormWithPhotos.id, // Use the ID from the JSON as inspection number
            inspectionDate: firstInspectionToLoadToFormWithPhotos.clientInfo.inspectionDate || (typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : ''),
            inspectedBy: firstInspectionToLoadToFormWithPhotos.clientInfo.inspectedBy || '',
        });
        setUploadedLogoDataUrl(firstInspectionToLoadToFormWithPhotos.uploadedLogoDataUrl || null);

        const sanitizedTowersForForm = (firstInspectionToLoadToFormWithPhotos.towers || []).map(loadedTower => ({
            ...loadedTower, // Spread basic tower properties like name, id
            id: (loadedTower.id && typeof loadedTower.id === 'string' && !loadedTower.id.startsWith('server-temp-id-')) ? loadedTower.id : generateUniqueId(),
            isTowerContentVisible: false,
            floors: (loadedTower.floors || []).map(loadedFloor => ({
                ...loadedFloor, // Spread basic floor properties like name, id
                id: (loadedFloor.id && typeof loadedFloor.id === 'string' && !loadedFloor.id.startsWith('server-temp-id-')) ? loadedFloor.id : generateUniqueId(),
                isFloorContentVisible: false,
                categories: INSPECTION_CONFIG.map(cfgCategory => {
                    const jsonCategory = (loadedFloor.categories || []).find(cat => cat.id === cfgCategory.id);
                    const jsonSubItems = jsonCategory?.subItems || [];

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
                        subItems: cfgCategory.subItems?.map(cfgSubItem => {
                            const jsonSubItem = jsonSubItems.find(sub => sub.id === cfgSubItem.id);
                            return {
                                id: cfgSubItem.id,
                                name: jsonSubItem?.name || cfgSubItem.name,
                                status: jsonSubItem?.status,
                                observation: jsonSubItem?.observation || '',
                                showObservation: jsonSubItem?.showObservation || false,
                                isRegistry: cfgSubItem.isRegistry || false,
                                photoDataUri: jsonSubItem?.photoDataUri || null, // Preserving from JSON
                                photoDescription: jsonSubItem?.photoDescription || '',
                                registeredExtinguishers: (jsonSubItem?.registeredExtinguishers || (cfgSubItem.isRegistry && cfgSubItem.id === 'extintor_cadastro' ? [] : undefined))?.map(ext => ({ ...ext, id: (ext.id && typeof ext.id === 'string' && !ext.id.includes('NaN') && !ext.id.startsWith('server-temp-id-')) ? ext.id : `${generateUniqueId()}-ext` })),
                                registeredHoses: (jsonSubItem?.registeredHoses || (cfgSubItem.isRegistry && cfgSubItem.id === 'hidrantes_cadastro_mangueiras' ? [] : undefined))?.map(hose => ({ ...hose, id: (hose.id && typeof hose.id === 'string' && !hose.id.includes('NaN') && !hose.id.startsWith('server-temp-id-')) ? hose.id : `${generateUniqueId()}-hose` })),
                            };
                        }).concat( // Add custom sub-items from JSON not in INSPECTION_CONFIG
                           jsonSubItems.filter(jsonSub => !cfgCategory.subItems?.some(cfgSub => cfgSub.id === jsonSub.id))
                           .map(customSub => ({
                                ...customSub, // Spread all properties of custom sub-item from JSON
                                id: (customSub.id && typeof customSub.id === 'string' && !customSub.id.includes('NaN') && !customSub.id.startsWith('server-temp-id-') && (!customSub.id.startsWith('custom-') || customSub.id.length > 20) ) ? customSub.id : customSub.id.startsWith('custom-') ? customSub.id : `loaded-sub-${generateUniqueId()}`,
                                photoDataUri: customSub.photoDataUri || null, // Ensure these are also handled
                                photoDescription: customSub.photoDescription || '',
                            }))
                        ) || [],
                    };
                }),
            })),
        }));
        setActiveTowersData(sanitizedTowersForForm.length > 0 ? sanitizedTowersForForm : [createNewTowerEntry()]);
        setIsSavedInspectionsVisible(false); setIsChecklistVisible(true);
    }


    let summaryMessage = "";
    if (finalImportedCount > 0 && finalUpdatedCount > 0) summaryMessage = `${finalImportedCount} nova(s) e ${finalUpdatedCount} atualizada(s) adicionadas/atualizadas no navegador.`;
    else if (finalImportedCount > 0) summaryMessage = `${finalImportedCount} nova(s) vistoria(s) adicionada(s) ao navegador.`;
    else if (finalUpdatedCount > 0) summaryMessage = `${finalUpdatedCount} vistoria(s) existente(s) atualizada(s) no navegador.`;

    if (firstInspectionToLoadToFormWithPhotos) {
        const hasPhotosOrLogo = firstInspectionToLoadToFormWithPhotos.uploadedLogoDataUrl ||
                               (firstInspectionToLoadToFormWithPhotos.towers || []).some(t =>
                                 (t.floors || []).some(f =>
                                   (f.categories || []).some(c =>
                                     (c.subItems || []).some(s => s.photoDataUri)
                                   )
                                 )
                               );
        summaryMessage += ` A primeira vistoria válida do arquivo foi carregada no formulário${hasPhotosOrLogo ? ' com logo/fotos' : ''}. As fotos são mantidas no formulário ativo e em exportações JSON, mas não no armazenamento do navegador.`;
    } else if (allInspectionsFromFiles.length === 0 && currentFiles.length > 0) {
        summaryMessage = "Nenhuma vistoria válida encontrada nos arquivos processados.";
    } else if (allInspectionsFromFiles.length > 0 && !summaryMessage) {
        summaryMessage = "Vistorias processadas e adicionadas/atualizadas no navegador. Verifique a lista de salvas.";
    }


    if (summaryMessage) toast({ title: "Importação Concluída", description: summaryMessage, duration: 7000 });

    if (jsonImportFileInputRef.current) {
      jsonImportFileInputRef.current.value = '';
    }
  }, [toast, setSavedInspections, setActiveTowersData, setClientInfo, setUploadedLogoDataUrl]);


  const triggerJsonImport = useCallback(() => { jsonImportFileInputRef.current?.click(); }, []);

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
                <Button onClick={handleExpandAllGlobalCategories} variant="outline" size="sm" title="Expandir Todas as Categorias (Global)"><Eye className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Expandir Categorias</span></Button>
                <Button onClick={handleCollapseAllGlobalCategories} variant="outline" size="sm" title="Recolher Todas as Categorias (Global)"><EyeOff className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Recolher Categorias</span></Button>
                <Button onClick={handleShowAllTowerContent} variant="outline" size="sm" title="Mostrar Conteúdo de Todas as Torres (Global)"><Rows3 className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Mostrar Torres</span></Button>
                <Button onClick={handleHideAllTowerContent} variant="outline" size="sm" title="Ocultar Conteúdo de Todas as Torres (Global)"><Columns3 className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Ocultar Torres</span></Button>
              </div>

              {activeTowersData.map((tower, towerIndex) => (
                <Card key={tower.id} className="mb-8 shadow-md border-primary/50">
                  <CardHeader className="bg-primary/5 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-grow">
                      <Building className="h-5 w-5 text-primary flex-shrink-0" />
                      <Input
                        value={tower.towerName}
                        onChange={(e) => handleTowerNameChange(towerIndex, e.target.value)}
                        placeholder={`Nome da Torre ${towerIndex + 1}`}
                        className="text-lg font-semibold flex-grow min-w-[150px]"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                       <Button onClick={() => handleShowAllFloorContent(towerIndex)} variant="outline" size="xs" title="Mostrar todos os andares desta torre"><Rows3 className="mr-1 h-3 w-3" /></Button>
                       <Button onClick={() => handleHideAllFloorContent(towerIndex)} variant="outline" size="xs" title="Ocultar todos os andares desta torre"><Columns3 className="mr-1 h-3 w-3" /></Button>
                       <Button onClick={() => handleToggleTowerContent(towerIndex)} variant="outline" size="sm" title={tower.isTowerContentVisible !== false ? "Ocultar Conteúdo da Torre" : "Mostrar Conteúdo da Torre"}>
                         {tower.isTowerContentVisible !== false ? <ChevronUp className="mr-1 h-4 w-4"/> : <ChevronDown className="mr-1 h-4 w-4"/>}
                         <span className="hidden sm:inline">{tower.isTowerContentVisible !== false ? "Ocultar Torre" : "Mostrar Torre"}</span>
                       </Button>
                       <Button onClick={() => handleAddFloorToTower(towerIndex)} variant="outline" size="sm" className="border-green-500 text-green-600 hover:bg-green-500/10">
                         <Plus className="mr-1 h-4 w-4" /> Adicionar Andar
                       </Button>
                       {activeTowersData.length > 1 && (
                         <Button variant="ghost" size="icon" onClick={() => handleRemoveTower(towerIndex)} className="text-destructive hover:bg-destructive/10 h-9 w-9" title="Remover esta torre">
                           <Trash2 className="h-5 w-5" />
                         </Button>
                       )}
                    </div>
                  </CardHeader>
                  {tower.isTowerContentVisible !== false && (
                    <CardContent className="p-4 space-y-4">
                      {tower.floors.map((floorData, floorIndex) => {
                        const areAnyCategoriesExpanded = floorData.categories.some(cat => cat.isExpanded);
                        return (
                          <Card key={floorData.id} className="mb-6 shadow-sm">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex flex-col md:flex-row md:items-center md:flex-wrap gap-x-2 gap-y-2 mb-2">
                                <div className="flex flex-row items-center gap-x-2 flex-grow md:flex-grow-0">
                                  <Label htmlFor={`floorName-${floorData.id}`} className="text-sm font-medium whitespace-nowrap">
                                    ANDAR:
                                  </Label>
                                  <Input
                                    id={`floorName-${floorData.id}`}
                                    value={floorData.floor}
                                    onChange={(e) => handleFloorSpecificFieldChange(towerIndex, floorIndex, 'floor', e.target.value)}
                                    placeholder="Ex: Térreo, 1A"
                                    className="flex-grow max-w-xs min-w-[100px] h-9 text-sm"
                                  />
                                </div>
                                <div className="flex flex-row items-center gap-x-2 md:ml-auto">
                                  <Button onClick={() => handleToggleAllCategoriesForFloor(towerIndex, floorIndex)} variant="outline" size="xs" title={areAnyCategoriesExpanded ? "Recolher itens do andar" : "Expandir itens do andar"}>
                                    {areAnyCategoriesExpanded ? <EyeOff className="mr-1 h-3 w-3"/> : <Eye className="mr-1 h-3 w-3"/>}
                                    <span className="hidden sm:inline">{areAnyCategoriesExpanded ? "Recolher" : "Expandir"}</span>
                                  </Button>
                                  <Button onClick={() => handleToggleFloorContent(towerIndex, floorIndex)} variant="outline" size="xs" title={floorData.isFloorContentVisible !== false ? "Ocultar conteúdo do andar" : "Mostrar conteúdo do andar"}>
                                    {floorData.isFloorContentVisible !== false ? <ChevronUp className="mr-1 h-3 w-3"/> : <ChevronDown className="mr-1 h-3 w-3"/>}
                                    <span className="hidden sm:inline">{floorData.isFloorContentVisible !== false ? "Ocultar" : "Mostrar"}</span>
                                  </Button>
                                  {tower.floors.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveFloorFromTower(towerIndex, floorIndex)} className="text-destructive hover:bg-destructive/10 h-8 w-8" title="Remover este andar">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {(floorData.isFloorContentVisible !== false) && (
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
                    </CardContent>
                  )}
                </Card>
              ))}
            </>
          )}
        </div>

        <ActionButtonsPanel
          onSave={handleSaveInspection}
          onNewInspection={resetInspectionForm}
          onAddNewTower={handleAddNewTower}
          onToggleSavedInspections={toggleSavedInspections}
          isSavedInspectionsVisible={isSavedInspectionsVisible}
          onPrint={handlePrintPage}
          onExportJson={handleExportCurrentInspectionToJson}
          onTriggerImportJson={triggerJsonImport}
          onGenerateRegisteredItemsReport={handleGenerateRegisteredItemsReport}
          onGenerateNCItemsReport={handleGenerateNCItemsReport}
          onGeneratePdf={handleGeneratePdf}
          onGeneratePhotoReportPdf={handleGeneratePhotoReportPdf}
        />
         <input type="file" ref={jsonImportFileInputRef} accept=".json,application/json" onChange={handleImportInspectionFromJson} className="hidden" id="json-import-input" multiple />

        {isSavedInspectionsVisible && (
          <SavedInspectionsList
            savedInspections={savedInspections}
            onLoadInspection={handleLoadInspection}
            onDeleteInspection={handleDeleteInspection}
            onDeleteMultipleInspections={handleDeleteMultipleInspections}
            onDuplicateInspection={handleDuplicateInspection}
            onUpdateClientLocation={handleUpdateClientLocationForSavedInspection}
            onDownloadSelected={handleDownloadSelectedInspections}
            onDownloadSingleInspection={handleDownloadSingleSavedInspection}
          />
        )}

        <footer className="text-center text-sm text-muted-foreground mt-12 pb-8">FireCheck Brazil &copy; {new Date().getFullYear()} - BRAZIL EXTINTORES</footer>
      </div>
    </ScrollArea>
  );
}
    
