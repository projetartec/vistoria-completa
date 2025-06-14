
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppHeader } from '@/components/app/app-header';
import { ClientDataForm } from '@/components/app/client-data-form';
import { InspectionCategoryItem } from '@/components/app/inspection-category-item';
import { ActionButtonsPanel } from '@/components/app/action-buttons-panel';
// SavedInspectionsList is no longer used
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
import { ChevronDown, ChevronUp, Trash2, Eye, EyeOff, Rows3, Columns3, Building, Plus, Upload } from 'lucide-react';
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

// This helper remains for the "Exportar JSON" button as a fallback or alternative.
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

  // Remove localStorage for full inspections
  // const initialSavedFullInspections = useMemo(() => [], []);
  // const [savedInspections, setSavedInspections] = useLocalStorage<FullInspectionData[]>('firecheck-full-inspections-v3-towers', initialSavedFullInspections);

  const [savedLocations, setSavedLocations] = useLocalStorage<string[]>('firecheck-saved-locations-v1', []);
  const [isChecklistVisible, setIsChecklistVisible] = useState(false);
  // isSavedInspectionsVisible is no longer needed
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
                    getCategoryOverallStatus(originalCategory) !== 'all-items-selected' &&
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

  const handleSaveInspection = useCallback(async () => {
    if (!window.showSaveFilePicker) {
      toast({
        title: "Navegador incompatível",
        description: "Seu navegador não suporta a API para salvar arquivos diretamente. Use o botão 'Exportar JSON'.",
        variant: "destructive",
      });
      return;
    }

    const currentClientInfo = clientInfo;
    const inspectionToSave: FullInspectionData = {
      id: currentClientInfo.inspectionNumber || `temp-id-${Date.now()}`,
      clientInfo: { ...currentClientInfo },
      towers: activeTowersData, // Includes photoDataUri
      timestamp: Date.now(),
      uploadedLogoDataUrl: uploadedLogoDataUrl
    };

    const jsonString = JSON.stringify(inspectionToSave, null, 2);
    const suggestedName = `vistoria_${(currentClientInfo.inspectionNumber || 'NO-NUM').replace(/\s+/g, '_')}_${(currentClientInfo.clientLocation || 'LOCAL').replace(/[^\w.-]/g, '_')}.json`;

    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: suggestedName,
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      toast({ title: "Vistoria Salva", description: `Arquivo ${handle.name} salvo com sucesso (incluindo fotos e observações).` });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao salvar arquivo:', err);
        toast({ title: "Erro ao Salvar", description: "Não foi possível salvar o arquivo no seu dispositivo.", variant: "destructive" });
      } else {
        toast({ title: "Salvamento Cancelado", description: "O salvamento do arquivo foi cancelado.", variant: "default" });
      }
    }
  }, [clientInfo, activeTowersData, uploadedLogoDataUrl, toast]);


  const loadInspectionDataToForm = useCallback((inspectionToLoad: FullInspectionData) => {
    const loadedClientInfo = inspectionToLoad.clientInfo || {};
    setClientInfo({
        clientLocation: loadedClientInfo.clientLocation || '',
        clientCode: loadedClientInfo.clientCode || '',
        inspectionNumber: loadedClientInfo.inspectionNumber || '',
        inspectionDate: loadedClientInfo.inspectionDate || (typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : ''),
        inspectedBy: loadedClientInfo.inspectedBy || '',
    });
    setUploadedLogoDataUrl(inspectionToLoad.uploadedLogoDataUrl || null);

    const sanitizedTowersForForm = (inspectionToLoad.towers || []).map(loadedTower => {
      const sanitizedFloorsForForm = (loadedTower.floors || []).map(loadedFloor => {
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
                if (!configSubItems.some(cfgSub => cfgSub.id === jsonSub.id)) { // Custom sub-item from JSON
                  finalSubItems.push({
                    ...jsonSub, // Spread all properties from jsonSub
                    id: (jsonSub.id && typeof jsonSub.id === 'string' && !jsonSub.id.includes('NaN') && !jsonSub.id.startsWith('server-temp-id-') && (!jsonSub.id.startsWith('custom-') || jsonSub.id.length > 20)) ? jsonSub.id : jsonSub.id.startsWith('custom-') ? jsonSub.id : `loaded-custom-sub-${generateUniqueId()}`,
                    name: jsonSub.name || 'Subitem Carregado',
                    photoDataUri: jsonSub.photoDataUri || null,
                    photoDescription: jsonSub.photoDescription || '',
                    // Ensure other SubItemState properties have defaults if not in jsonSub
                    status: jsonSub.status,
                    observation: jsonSub.observation || '',
                    showObservation: jsonSub.showObservation || false,
                    isRegistry: jsonSub.isRegistry || false,
                    registeredExtinguishers: (jsonSub.registeredExtinguishers || undefined)?.map(ext => ({ ...ext, id: (ext.id && typeof ext.id === 'string' && !ext.id.includes('NaN') && !ext.id.startsWith('server-temp-id-')) ? ext.id : `loaded-custom-${generateUniqueId()}-ext` })),
                    registeredHoses: (jsonSub.registeredHoses || undefined)?.map(hose => ({ ...hose, id: (hose.id && typeof hose.id === 'string' && !hose.id.includes('NaN') && !hose.id.startsWith('server-temp-id-')) ? hose.id : `loaded-custom-${generateUniqueId()}-hose` })),
                  });
                }
              });
            } else { // jsonCategory not found or no subItems in json, use config defaults
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
            isExpanded: false, // Always start collapsed
            status: jsonCategory?.status,
            observation: jsonCategory?.observation || '',
            showObservation: jsonCategory?.showObservation || false,
            pressureValue: jsonCategory?.pressureValue || '',
            pressureUnit: jsonCategory?.pressureUnit || '',
            subItems: cfgCategory.type === 'standard' ? finalSubItems : undefined,
          };
        });
        return {
          ...loadedFloor, // Spread other properties from loadedFloor like floor name
          id: (loadedFloor.id && typeof loadedFloor.id === 'string' && !loadedFloor.id.startsWith('server-temp-id-')) ? loadedFloor.id : generateUniqueId(),
          floor: loadedFloor.floor || '', // Ensure floor has a value
          categories: sanitizedCategoriesForForm,
          isFloorContentVisible: false, // Always start collapsed
        };
      });
      return {
        ...loadedTower, // Spread other properties from loadedTower like towerName
        id: (loadedTower.id && typeof loadedTower.id === 'string' && !loadedTower.id.startsWith('server-temp-id-')) ? loadedTower.id : generateUniqueId(),
        towerName: loadedTower.towerName || '', // Ensure towerName has a value
        floors: sanitizedFloorsForForm,
        isTowerContentVisible: false, // Always start collapsed
      };
    });

    setActiveTowersData(sanitizedTowersForForm.length > 0 ? sanitizedTowersForForm : [createNewTowerEntry()]);
    setIsChecklistVisible(true);
  }, [setActiveTowersData, setClientInfo, setUploadedLogoDataUrl]);


  const handleLoadFromFileSystem = useCallback(async () => {
    if (!window.showOpenFilePicker) {
      toast({
        title: "Navegador incompatível",
        description: "Seu navegador não suporta a API para abrir arquivos diretamente. Use o botão 'Importar JSON'.",
        variant: "destructive",
      });
      return;
    }
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
        multiple: false,
      });
      const file = await fileHandle.getFile();
      const contents = await file.text();
      
      if (!contents || contents.trim() === "") {
        toast({
          title: "Arquivo Vazio ou Inválido",
          description: "O arquivo selecionado está vazio ou não pôde ser lido como texto.",
          variant: "destructive",
        });
        return;
      }

      const inspectionToLoad = JSON.parse(contents) as FullInspectionData;

      if (inspectionToLoad && typeof inspectionToLoad === 'object' && inspectionToLoad.id && inspectionToLoad.clientInfo && inspectionToLoad.towers) {
        loadInspectionDataToForm(inspectionToLoad);
        toast({ title: "Vistoria Carregada", description: `Vistoria Nº ${inspectionToLoad.id} carregada do arquivo ${file.name} (incluindo fotos e observações).`});
      } else {
        toast({ title: "Arquivo Inválido", description: "O arquivo selecionado não parece ser uma vistoria válida.", variant: "destructive" });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
         toast({ title: "Abertura Cancelada", description: "A seleção de arquivo foi cancelada.", variant: "default" });
      } else if (err instanceof SyntaxError) {
        console.error('Erro ao parsear JSON do arquivo:', err);
        toast({ title: "Erro de Formato", description: "O arquivo JSON está malformatado e não pôde ser lido.", variant: "destructive" });
      }
      else {
        console.error('Erro ao abrir arquivo:', err);
        toast({ title: "Erro ao Abrir", description: "Não foi possível abrir ou processar o arquivo.", variant: "destructive" });
      }
    }
  }, [loadInspectionDataToForm, toast]);


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
    setActiveTowersData(prevTowers => prevTowers.map((tower, tIdx) => tIdx === towerIndex ? { ...tower, floors: tower.floors.map((floor, fIdx) => fIdx === floorIndex ? { ...floor, isFloorContentVisible: !(floor.isFloorContentVisible !== undefined ? floor.isFloorContentVisible : true) } : floor) } : floor));
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
    const inspectionToExport: FullInspectionData = {
      id: clientInfo.inspectionNumber || `export-id-${Date.now()}`,
      clientInfo: { ...clientInfo },
      towers: activeTowersData, 
      timestamp: Date.now(),
      uploadedLogoDataUrl: uploadedLogoDataUrl,
    };
    const clientInfoForFilename = { inspectionNumber: inspectionToExport.id, clientLocation: inspectionToExport.clientInfo.clientLocation || 'vistoria' };
    const baseFileName = `vistoria_${clientInfoForFilename.inspectionNumber}_${clientInfoForFilename.clientLocation.replace(/\s+/g, '_')}`;
    const fileName = initiateFileDownload(inspectionToExport, baseFileName); // Uses the traditional blob download
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

    let firstInspectionToLoadToFormWithPhotos: FullInspectionData | null = null;
   

    const readFilePromise = (file: File): Promise<FullInspectionData | null> => { 
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonString = e.target?.result as string;
            if (!jsonString || jsonString.trim() === "") {
                console.warn(`Conteúdo vazio ou inválido no arquivo ${file.name}`);
                resolve(null);
                return;
            }
            const importedData = JSON.parse(jsonString);

            if (typeof importedData !== 'object' || importedData === null || Array.isArray(importedData)) { 
                console.warn(`Conteúdo JSON não é um objeto de vistoria válido no arquivo ${file.name}:`, JSON.stringify(importedData, null, 2).substring(0,100));
                resolve(null);
                return;
            }
            
            const inspection = importedData as FullInspectionData;
            if (inspection && typeof inspection === 'object' &&
                typeof inspection.id === 'string' &&
                inspection.clientInfo && typeof inspection.clientInfo === 'object' &&
                Array.isArray(inspection.towers) &&
                typeof inspection.timestamp === 'number') {
              resolve(inspection);
            } else {
              console.warn(`Vistoria inválida ou incompleta no arquivo ${file.name} pulada. Conteúdo parcial:`, JSON.stringify(inspection, null, 2).substring(0, 500));
              resolve(null);
            }
          } catch (error: any) {
            console.error(`Erro ao parsear JSON do arquivo ${file.name}:`, error);
            if (error instanceof SyntaxError) {
              toast({ title: "Erro de Formato", description: `Arquivo ${file.name} malformatado. Verifique o conteúdo.`, variant: "destructive"});
            } else {
              toast({ title: "Erro de Parse", description: `Não foi possível parsear ${file.name}. Verifique o formato.`, variant: "destructive"});
            }
            reject(error); 
          }
        };
        reader.onerror = (err) => {
          console.error(`Erro ao ler o arquivo ${file.name}:`, err);
          toast({ title: "Erro de Leitura", description: `Não foi possível ler ${file.name}.`, variant: "destructive"});
          reject(err); 
        };
        reader.readAsText(currentFiles[0]); 
      });
    };

    try {
        firstInspectionToLoadToFormWithPhotos = await readFilePromise(currentFiles[0]);
    } catch (error) {
         if (jsonImportFileInputRef.current) {
            jsonImportFileInputRef.current.value = '';
        }
        return;
    }


    if (firstInspectionToLoadToFormWithPhotos) {
        loadInspectionDataToForm(firstInspectionToLoadToFormWithPhotos);
        
        const hasPhotosOrLogo = firstInspectionToLoadToFormWithPhotos.uploadedLogoDataUrl ||
                               (firstInspectionToLoadToFormWithPhotos.towers || []).some(t =>
                                 (t.floors || []).some(f =>
                                   (f.categories || []).some(c =>
                                     (c.subItems || []).some(s => s.photoDataUri)
                                   )
                                 )
                               );
        toast({ title: "Importação Concluída", description: `Vistoria do arquivo ${currentFiles[0].name} carregada no formulário${hasPhotosOrLogo ? ' com logo/fotos' : ''}.`, duration: 7000 });
    } else {
         toast({ title: "Importação Falhou", description: `Nenhuma vistoria válida encontrada no arquivo ${currentFiles[0].name}.`, variant: "destructive" });
    }

    if (jsonImportFileInputRef.current) {
      jsonImportFileInputRef.current.value = '';
    }
  }, [toast, loadInspectionDataToForm]);


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
          onPrint={handlePrintPage}
          onExportJson={handleExportCurrentInspectionToJson} // Traditional export
          onTriggerImportJson={triggerJsonImport} // Traditional import via input
          onLoadFromFileSystem={handleLoadFromFileSystem} // New File System API Load
          onGenerateRegisteredItemsReport={handleGenerateRegisteredItemsReport}
          onGenerateNCItemsReport={handleGenerateNCItemsReport}
          onGeneratePdf={handleGeneratePdf}
          onGeneratePhotoReportPdf={handleGeneratePhotoReportPdf}
        />
         <input type="file" ref={jsonImportFileInputRef} accept=".json,application/json" onChange={handleImportInspectionFromJson} className="hidden" id="json-import-input" />

        {/* SavedInspectionsList is removed */}

        <footer className="text-center text-sm text-muted-foreground mt-12 pb-8">FireCheck Brazil &copy; {new Date().getFullYear()} - BRAZIL EXTINTORES</footer>
      </div>
    </ScrollArea>
  );
}
    

    
