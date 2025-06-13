
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
    inspectionDate: '', // Initialize as empty, useEffect will set it
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
      // Set initial date only if it's not already set (e.g. by loading from storage)
      if (!clientInfo.inspectionDate) {
        setClientInfo(prev => ({...prev, inspectionDate: new Date().toISOString().split('T')[0]}));
      }
    }
    setIsClientInitialized(true); // Mark as initialized after setup
  }, []); // Empty dependency array ensures this runs once on mount and after client-side hydration


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
        if (tIndex !== towerIndex) return currentTower; // Not the target tower

        const updatedFloors = currentTower.floors.map((currentFloorData, fIndex) => {
          if (fIndex !== floorIndex) return currentFloorData; // Not the target floor
          
          let floorOverallStateChanged = false; 
          let autoCollapsedCategoryIdHolder: { id: string | null } = { id: null };

          const newCategoriesForFloor = currentFloorData.categories.map(originalCategory => {
            if (originalCategory.id !== categoryId) return originalCategory; // Not the target category for this update

            let workingCategoryCopy = { ...originalCategory }; // Shallow copy the target category
            let categoryStructurallyModified = false;
            const isExpansionChange = update.field === 'isExpanded';

            switch (update.field) {
              case 'isExpanded':
                if (workingCategoryCopy.isExpanded !== update.value) { 
                  workingCategoryCopy.isExpanded = update.value; 
                  categoryStructurallyModified = true; 
                }
                break;
              case 'status':
                if (workingCategoryCopy.status !== update.value) { 
                  workingCategoryCopy.status = update.value; 
                  categoryStructurallyModified = true; 
                }
                break;
              case 'subItemStatus':
              case 'subItemObservation':
              case 'subItemShowObservation':
              case 'renameSubItemName':
              case 'subItemPhotoDataUri':
              case 'subItemPhotoDescription':
              case 'removeSubItemPhoto':
                if (workingCategoryCopy.subItems && update.subItemId) {
                  workingCategoryCopy.subItems = workingCategoryCopy.subItems.map(sub => {
                    if (sub.id !== update.subItemId) return sub;
                    let subItemChanged = false; const newSubState = { ...sub };
                    if (update.field === 'subItemStatus' && newSubState.status !== (update.value as StatusOption | undefined)) { newSubState.status = update.value as StatusOption | undefined; subItemChanged = true; }
                    else if (update.field === 'subItemObservation' && newSubState.observation !== (update.value as string)) { newSubState.observation = update.value as string; subItemChanged = true; }
                    else if (update.field === 'subItemShowObservation' && newSubState.showObservation !== (update.value as boolean)) { newSubState.showObservation = update.value as boolean; subItemChanged = true; }
                    else if (update.field === 'renameSubItemName' && newSubState.name !== update.newName) { newSubState.name = update.newName; subItemChanged = true; }
                    else if (update.field === 'subItemPhotoDataUri' && newSubState.photoDataUri !== (update.value as string | null)) { newSubState.photoDataUri = update.value as string | null; if (!update.value) newSubState.photoDescription = ''; subItemChanged = true; }
                    else if (update.field === 'subItemPhotoDescription' && newSubState.photoDescription !== (update.value as string)) { newSubState.photoDescription = update.value as string; subItemChanged = true; }
                    else if (update.field === 'removeSubItemPhoto') { newSubState.photoDataUri = null; newSubState.photoDescription = ''; subItemChanged = true; }
                    if (subItemChanged) categoryStructurallyModified = true; return subItemChanged ? newSubState : sub;
                  });
                }
                break;
              case 'removeSubItem':
                if (workingCategoryCopy.subItems && update.subItemId) {
                  const initialCount = workingCategoryCopy.subItems.length;
                  workingCategoryCopy.subItems = workingCategoryCopy.subItems.filter(sub => sub.id !== update.subItemId);
                  if (workingCategoryCopy.subItems.length < initialCount) {
                    categoryStructurallyModified = true;
                  }
                }
                break;
              default: // Handles category-level fields
                if (update.field === 'observation' && workingCategoryCopy.observation !== update.value) { workingCategoryCopy.observation = update.value; categoryStructurallyModified = true; }
                else if (update.field === 'showObservation' && workingCategoryCopy.showObservation !== update.value) { workingCategoryCopy.showObservation = update.value; categoryStructurallyModified = true; }
                else if (update.field === 'pressureValue' && workingCategoryCopy.pressureValue !== update.value) { workingCategoryCopy.pressureValue = update.value; categoryStructurallyModified = true; }
                else if (update.field === 'pressureUnit' && workingCategoryCopy.pressureUnit !== update.value) { workingCategoryCopy.pressureUnit = update.value as InspectionCategoryState['pressureUnit']; categoryStructurallyModified = true; }
                else if (update.field === 'renameCategoryTitle' && workingCategoryCopy.title !== update.newTitle) { workingCategoryCopy.title = update.newTitle; categoryStructurallyModified = true; }
                else if (update.field === 'addRegisteredExtinguisher' && workingCategoryCopy.subItems && update.subItemId && update.value) {
                  const newExt: RegisteredExtinguisher = { ...update.value, id: `ext-${generateUniqueId()}` };
                  workingCategoryCopy.subItems = (workingCategoryCopy.subItems || []).map(sub => 
                    sub.id === update.subItemId ? { ...sub, registeredExtinguishers: [...(sub.registeredExtinguishers || []), newExt] } : sub
                  );
                  categoryStructurallyModified = true;
                }
                else if (update.field === 'removeRegisteredExtinguisher' && workingCategoryCopy.subItems && update.subItemId && update.extinguisherId) {
                  workingCategoryCopy.subItems = (workingCategoryCopy.subItems || []).map(sub => 
                    sub.id === update.subItemId ? { ...sub, registeredExtinguishers: (sub.registeredExtinguishers || []).filter(ext => ext.id !== update.extinguisherId) } : sub
                  );
                  categoryStructurallyModified = true;
                }
                else if (update.field === 'addRegisteredHose' && workingCategoryCopy.subItems && update.subItemId && update.value) {
                  const newHose: RegisteredHose = { ...update.value, id: `hose-${generateUniqueId()}` };
                  workingCategoryCopy.subItems = (workingCategoryCopy.subItems || []).map(sub =>
                    sub.id === update.subItemId ? { ...sub, registeredHoses: [...(sub.registeredHoses || []), newHose] } : sub
                  );
                  categoryStructurallyModified = true;
                }
                else if (update.field === 'removeRegisteredHose' && workingCategoryCopy.subItems && update.subItemId && update.hoseId) {
                  workingCategoryCopy.subItems = (workingCategoryCopy.subItems || []).map(sub =>
                    sub.id === update.subItemId ? { ...sub, registeredHoses: (sub.registeredHoses || []).filter(h => h.id !== update.hoseId) } : sub
                  );
                  categoryStructurallyModified = true;
                }
                else if (update.field === 'markAllSubItemsNA' && workingCategoryCopy.subItems && workingCategoryCopy.type === 'standard') {
                  workingCategoryCopy.subItems = (workingCategoryCopy.subItems || []).map(sub => 
                    !sub.isRegistry ? { ...sub, status: 'N/A' as StatusOption } : sub
                  );
                  categoryStructurallyModified = true;
                }
                else if (update.field === 'addSubItem' && workingCategoryCopy.type === 'standard' && typeof update.value === 'string' && update.value.trim() !== '') {
                  const newId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                  const newSub: SubItemState = { id: newId, name: update.value.trim(), status: undefined, observation: '', showObservation: false, isRegistry: false, photoDataUri: null, photoDescription: '' };
                  workingCategoryCopy.subItems = [...(workingCategoryCopy.subItems || []), newSub];
                  categoryStructurallyModified = true;
                }
                break;
            }
            
            if (!isExpansionChange && categoryStructurallyModified) {
              let shouldAutoCollapse = false;
              if (workingCategoryCopy.type === 'standard' && workingCategoryCopy.subItems) {
                const relevantSubItems = workingCategoryCopy.subItems.filter(sub => !sub.isRegistry);
                if (relevantSubItems.length > 0 && relevantSubItems.every(sub => sub.status !== undefined)) { shouldAutoCollapse = true; }
                else if (relevantSubItems.length === 0 && originalCategory.subItems?.filter(s=>!s.isRegistry).length ?? 0 > 0) {shouldAutoCollapse = true;} // All items removed
              } else if (workingCategoryCopy.type === 'special' || workingCategoryCopy.type === 'pressure') {
                  if (workingCategoryCopy.status !== undefined) shouldAutoCollapse = true;
              }
              if (shouldAutoCollapse && workingCategoryCopy.isExpanded) { 
                workingCategoryCopy.isExpanded = false; 
                autoCollapsedCategoryIdHolder.id = originalCategory.id; 
              }
            }
            if (categoryStructurallyModified) floorOverallStateChanged = true;
            return categoryStructurallyModified ? workingCategoryCopy : originalCategory;
          });

          let finalCategoriesForFloor = newCategoriesForFloor;
          if (autoCollapsedCategoryIdHolder.id) {
            const collapsedIdx = finalCategoriesForFloor.findIndex(c => c.id === autoCollapsedCategoryIdHolder.id);
            if (collapsedIdx !== -1 && collapsedIdx + 1 < finalCategoriesForFloor.length) {
              const nextCat = finalCategoriesForFloor[collapsedIdx + 1];
              if (!nextCat.isExpanded) { // Only auto-expand if currently collapsed
                finalCategoriesForFloor = finalCategoriesForFloor.map((cat, idx) => 
                  idx === collapsedIdx + 1 ? { ...cat, isExpanded: true } : cat
                );
                floorOverallStateChanged = true; // Mark floor as changed due to auto-expansion
              }
            }
          }
          
          // If any category object instance changed, or if auto-expansion modified another category, floorOverallStateChanged will be true
          return floorOverallStateChanged ? { ...currentFloorData, categories: finalCategoriesForFloor } : currentFloorData;
        });

        // Check if any floor object instance actually changed
        const floorsReallyChanged = updatedFloors.some((newFloor, idx) => newFloor !== currentTower.floors[idx]);
        return floorsReallyChanged ? { ...currentTower, floors: updatedFloors } : currentTower;
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
    setUploadedLogoDataUrl(null); // Reset logo as well
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
          // Try to copy structure from last floor of THIS tower, or default if no floors yet in this tower
          const sourceFloorForCategories = tower.floors.length > 0 ? tower.floors[tower.floors.length - 1] : null;

          if (sourceFloorForCategories) {
             newFloorCategories = JSON.parse(JSON.stringify(sourceFloorForCategories.categories)).map((cat: InspectionCategoryState) => ({
                ...cat,
                isExpanded: false, status: undefined, observation: '', showObservation: false, pressureValue: '', pressureUnit: '',
                subItems: cat.subItems ? JSON.parse(JSON.stringify(cat.subItems)).map((sub: SubItemState) => ({
                    ...sub, status: undefined, observation: '', showObservation: false, photoDataUri: null, photoDescription: '',
                    // Keep registered items if copied from a floor that had them, but reset them
                    registeredExtinguishers: sub.isRegistry && sub.id === 'extintor_cadastro' ? [] : undefined,
                    registeredHoses: sub.isRegistry && sub.id === 'hidrantes_cadastro_mangueiras' ? [] : undefined,
                })) : undefined,
            }));
          } else { // Fallback to INITIAL_FLOOR_DATA if no source floor in current tower
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

    const processedTowers = activeTowersData
      .filter(tower => tower.towerName && tower.towerName.trim() !== "")
      .map(tower => ({
        ...tower,
        floors: tower.floors
          .filter(floor => floor.floor && floor.floor.trim() !== "")
          .map(floor => ({
            ...floor,
            categories: floor.categories.map(category => ({
              ...category,
              subItems: category.subItems ? category.subItems.map(subItem => {
                const { photoDataUri, photoDescription, ...restOfSubItem } = subItem;
                return restOfSubItem;
              }) : undefined,
            })),
          })),
      }));

    const towersToSaveInStorage = (processedTowers.length > 0 && activeTowersData.some(t => t.towerName.trim() !== "" || t.floors.some(f => f.floor.trim() !== "")))
      ? processedTowers
      : activeTowersData.map(tower => ({ // Fallback to save all if no named towers/floors but data exists
        ...tower,
        floors: tower.floors.map(floor => ({
            ...floor,
            categories: floor.categories.map(category => ({
                ...category,
                subItems: category.subItems ? category.subItems.map(subItem => {
                    const { photoDataUri, photoDescription, ...restOfSubItem } = subItem;
                    return restOfSubItem;
                }) : undefined,
            })),
        })),
      }));


    const fullInspectionToSaveForLocalStorage: FullInspectionData = {
      id: currentClientInfo.inspectionNumber || `temp-id-${Date.now()}`,
      clientInfo: { ...currentClientInfo },
      towers: towersToSaveInStorage,
      timestamp: Date.now(),
      uploadedLogoDataUrl: uploadedLogoDataUrl
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
      // Only toast if inspectionNumber is valid (not a temp-id)
      if (fullInspectionToSaveForLocalStorage.id && !fullInspectionToSaveForLocalStorage.id.startsWith('temp-id-')) {
        toast({ title: "Vistoria Salva Localmente", description: `Vistoria Nº ${fullInspectionToSaveForLocalStorage.id} salva no navegador (sem fotos).` });
      } else if (towersToSaveInStorage.length > 0) { // Toast for temp-id only if there's actual tower data
         toast({ title: "Vistoria Salva Localmente", description: `Vistoria (ID temporário) salva no navegador (sem fotos). Preencha o Local para gerar Nº Vistoria.` });
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

      const sanitizedTowers = (inspectionToLoad.towers || []).map(tower => ({
        ...tower,
        id: (tower.id && typeof tower.id === 'string' && !tower.id.startsWith('server-temp-id-')) ? tower.id : generateUniqueId(),
        isTowerContentVisible: false, // Start collapsed
        floors: (tower.floors || []).map(floor => ({
          ...floor,
          id: (floor.id && typeof floor.id === 'string' && !floor.id.startsWith('server-temp-id-')) ? floor.id : generateUniqueId(),
          isFloorContentVisible: false, // Start collapsed
          categories: (floor.categories || INSPECTION_CONFIG.map(cfg => ({ // Fallback for categories if missing
              id: cfg.id, title: cfg.title, type: cfg.type, isExpanded: false,
              ...(cfg.type === 'standard' && { subItems: cfg.subItems?.map(sCfg => ({ id: sCfg.id, name: sCfg.name, isRegistry: sCfg.isRegistry || false, photoDataUri: null, photoDescription: '', ...(sCfg.isRegistry && sCfg.id === 'extintor_cadastro' && { registeredExtinguishers: [] }), ...(sCfg.isRegistry && sCfg.id === 'hidrantes_cadastro_mangueiras' && { registeredHoses: [] }) })) || [] }),
              ...(cfg.type === 'special' && { status: undefined, observation: '', showObservation: false }),
              ...(cfg.type === 'pressure' && { status: undefined, pressureValue: '', pressureUnit: '', observation: '', showObservation: false }),
          }))).map((cat: InspectionCategoryState) => ({
            ...cat, isExpanded: false,
            subItems: (cat.subItems || []).map(sub => ({
              ...sub,
              id: (sub.id && typeof sub.id === 'string' && !sub.id.includes('NaN') && !sub.id.startsWith('server-temp-id-') && (!sub.id.startsWith('custom-') || sub.id.length > 20) ) ? sub.id : sub.id.startsWith('custom-') ? sub.id : `loaded-sub-${generateUniqueId()}`, // Attempt to preserve custom IDs if they look valid
              photoDataUri: null, photoDescription: '', // Photos not stored in localStorage
              registeredExtinguishers: (sub.registeredExtinguishers || []).map(ext => ({ ...ext, id: (ext.id && typeof ext.id === 'string' && !ext.id.includes('NaN') && !ext.id.startsWith('server-temp-id-')) ? ext.id : `${generateUniqueId()}-ext` })),
              registeredHoses: (sub.registeredHoses || []).map(hose => ({ ...hose, id: (hose.id && typeof hose.id === 'string' && !hose.id.includes('NaN') && !hose.id.startsWith('server-temp-id-')) ? hose.id : `${generateUniqueId()}-hose` }))
            }))
          }))
        }))
      }));

      setActiveTowersData(sanitizedTowers.length > 0 ? sanitizedTowers : [createNewTowerEntry()]);
      setIsSavedInspectionsVisible(false); setIsChecklistVisible(false); // Auto-close lists
      toast({ title: "Vistoria Carregada", description: `Vistoria Nº ${fullInspectionId} carregada. Fotos não são incluídas do armazenamento local.`});
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
      const duplicatedInspection = JSON.parse(JSON.stringify(originalInspection)) as FullInspectionData;
      const newInspectionNumber = `${(originalInspection.clientInfo.inspectionNumber || 'COPIA')}_CÓPIA_${Date.now().toString().slice(-5)}`;
      duplicatedInspection.id = newInspectionNumber;
      duplicatedInspection.clientInfo = {
        ...(originalInspection.clientInfo || {}),
        inspectionNumber: newInspectionNumber,
        inspectionDate: typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '',
        inspectedBy: clientInfo.inspectedBy || '', // Use current inspector or leave blank
      };
      duplicatedInspection.timestamp = Date.now();
      duplicatedInspection.towers = (duplicatedInspection.towers || []).map(tower => ({
        ...tower, id: generateUniqueId(), isTowerContentVisible: false,
        floors: (tower.floors || []).map(floor => ({
          ...floor, id: generateUniqueId(), isFloorContentVisible: false,
          categories: (floor.categories || []).map(cat => ({
            ...cat, isExpanded: false,
            subItems: (cat.subItems || []).map(sub => ({
              ...sub,
              id: sub.id.startsWith('custom-') || sub.isRegistry ? `${sub.id.split('-')[0]}-${generateUniqueId()}-copy` : sub.id, // Generate new IDs for custom/registry subitems
              photoDataUri: null, photoDescription: '',
              registeredExtinguishers: (sub.registeredExtinguishers || []).map(ext => ({ ...ext, id: `${generateUniqueId()}-extcopy`})),
              registeredHoses: (sub.registeredHoses || []).map(hose => ({ ...hose, id: `${generateUniqueId()}-hosecopy` }))
            }))
          }))
        }))
      }));
      setSavedInspections(prev => [duplicatedInspection, ...prev].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      toast({ title: "Vistoria Duplicada", description: `Nova Vistoria Nº ${newInspectionNumber} criada (fotos não incluídas).`});
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

  const handleGeneratePdf = useCallback(() => {
    generateInspectionPdf(clientInfo, activeTowersData, uploadedLogoDataUrl);
  }, [clientInfo, activeTowersData, uploadedLogoDataUrl]);

  const handleGenerateRegisteredItemsReport = useCallback(() => {
    generateRegisteredItemsPdf(clientInfo, activeTowersData, uploadedLogoDataUrl);
  }, [clientInfo, activeTowersData, uploadedLogoDataUrl]);

  const handleGenerateNCItemsReport = useCallback(() => {
    generateNCItemsPdf(clientInfo, activeTowersData, uploadedLogoDataUrl);
  }, [clientInfo, activeTowersData, uploadedLogoDataUrl]);

  const handleGeneratePhotoReportPdf = useCallback(() => {
    generatePhotoReportPdf(clientInfo, activeTowersData, uploadedLogoDataUrl);
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

  const handleMoveCategoryItem = useCallback((towerIndex: number, floorIndex: number, categoryId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setActiveTowersData(prevTowers => prevTowers.map((tower, tIdx) => {
      if (tIdx !== towerIndex) return tower;
      return { ...tower, floors: tower.floors.map((floor, fIdx) => {
        if (fIdx !== floorIndex) return floor;
        const categories = [...floor.categories]; const itemIndex = categories.findIndex(cat => cat.id === categoryId);
        if (itemIndex === -1) return floor; // Should not happen
        const itemToMove = categories[itemIndex];
        if (direction === 'up' && itemIndex > 0) { categories.splice(itemIndex, 1); categories.splice(itemIndex - 1, 0, itemToMove); }
        else if (direction === 'down' && itemIndex < categories.length - 1) { categories.splice(itemIndex, 1); categories.splice(itemIndex + 1, 0, itemToMove); }
        else if (direction === 'top' && itemIndex > 0) { categories.splice(itemIndex, 1); categories.unshift(itemToMove); }
        else if (direction === 'bottom' && itemIndex < categories.length - 1) { categories.splice(itemIndex, 1); categories.push(itemToMove); }
        else return floor; // No change if already at edge or invalid direction
        return { ...floor, categories };
      })};
    }));
  }, []);

  const handleRemoveCategoryFromFloor = useCallback((towerIndex: number, floorIndex: number, categoryId: string) => {
    setActiveTowersData(prevTowers =>
      prevTowers.map((tower, tIdx) => {
        if (tIdx !== towerIndex) return tower; // Not the target tower, return original

        const newFloors = tower.floors.map((floor, fIdx) => {
          if (fIdx !== floorIndex) return floor; // Not the target floor, return original

          const newCategories = floor.categories.filter(cat => cat.id !== categoryId);

          if (newCategories.length < floor.categories.length) {
            return { ...floor, categories: newCategories }; // Return new floor object
          }
          return floor; // No change to this floor's categories
        });

        // Check if the floors array itself or any floor object within it has changed
        let floorsActuallyChanged = newFloors.length !== tower.floors.length;
        if (!floorsActuallyChanged) {
          for (let i = 0; i < newFloors.length; i++) {
            if (newFloors[i] !== tower.floors[i]) { // Reference check for floor objects
              floorsActuallyChanged = true;
              break;
            }
          }
        }

        if (floorsActuallyChanged) {
          return { ...tower, floors: newFloors }; // Return new tower object
        }
        return tower; // No change to this tower
      })
    );
  }, []);


  const handleExportCurrentInspectionToJson = useCallback(() => {
    const processedTowersForExport = activeTowersData
      .map(tower => ({
        ...tower,
        floors: tower.floors
          .map(floor => ({
            ...floor,
            // Photos are included in this export
          })),
      }));

    const inspectionToExport: FullInspectionData = {
      id: clientInfo.inspectionNumber || `export-id-${Date.now()}`,
      clientInfo: { ...clientInfo },
      towers: processedTowersForExport,
      timestamp: Date.now(),
      uploadedLogoDataUrl: uploadedLogoDataUrl,
    };
    const clientInfoForFilename = { inspectionNumber: inspectionToExport.id, clientLocation: inspectionToExport.clientInfo.clientLocation || 'vistoria' };
    const baseFileName = `vistoria_${clientInfoForFilename.inspectionNumber}_${clientInfoForFilename.clientLocation.replace(/\s+/g, '_')}`;
    const fileName = initiateFileDownload(inspectionToExport, baseFileName);
    toast({ title: "Vistoria Exportada", description: `Arquivo ${fileName} salvo (incluindo fotos da vistoria ativa).` });
  }, [clientInfo, activeTowersData, uploadedLogoDataUrl, toast]);

  const handleDownloadSelectedInspections = useCallback((inspectionIds: string[]) => {
    const inspectionsToDownload = savedInspections.filter(insp => inspectionIds.includes(insp.id));
    if (inspectionsToDownload.length > 0) {
      const fileName = initiateFileDownload(inspectionsToDownload, 'vistorias_selecionadas');
      toast({ title: "Download Iniciado", description: `${inspectionsToDownload.length} vistoria(s) salvas em ${fileName}.`});
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
      toast({ title: "Download Iniciado", description: `Vistoria ${fileName} salva.`});
    }
  }, [savedInspections, toast]);

 const handleImportInspectionFromJson = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) { toast({ title: "Nenhum arquivo selecionado", variant: "destructive"}); return; }

    let firstInspectionToLoadToFormWithPhotos: FullInspectionData | null = null;
    const allInspectionsFromFiles: FullInspectionData[] = [];

    const readFilePromise = (file: File): Promise<FullInspectionData[]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonString = e.target?.result as string;
            const importedData = JSON.parse(jsonString);
            const inspectionsToProcess: FullInspectionData[] = Array.isArray(importedData) ? importedData : [importedData];
            const validInspectionsFromFile: FullInspectionData[] = [];
            inspectionsToProcess.forEach(inspection => {
              // Basic validation: check for essential fields
              if (inspection && typeof inspection.id === 'string' && inspection.clientInfo && Array.isArray(inspection.towers) && typeof inspection.timestamp === 'number') {
                validInspectionsFromFile.push(inspection);
              } else {
                console.warn(`Vistoria inválida ou incompleta no arquivo ${file.name} pulada. Faltando id, clientInfo, towers ou timestamp.`);
              }
            });
            resolve(validInspectionsFromFile);
          } catch (error) {
            console.error(`Erro ao parsear JSON do arquivo ${file.name}:`, error);
            toast({ title: "Erro de Parse", description: `Não foi possível parsear ${file.name}. Verifique o formato do arquivo.`, variant: "destructive"});
            reject(error); // Reject the promise for this file
          }
        };
        reader.onerror = (err) => {
          console.error(`Erro ao ler o arquivo ${file.name}:`, err);
          toast({ title: "Erro de Leitura", description: `Não foi possível ler ${file.name}.`, variant: "destructive"});
          reject(err); // Reject the promise for this file
        };
        reader.readAsText(file);
      });
    };

    const fileReadResults = await Promise.allSettled(Array.from(files).map(file => readFilePromise(file)));

    fileReadResults.forEach((result, fileIndex) => {
      if (result.status === 'fulfilled' && result.value) {
        result.value.forEach((inspection, inspectionIndexWithinFile) => {
          allInspectionsFromFiles.push(inspection);
          if (fileIndex === 0 && inspectionIndexWithinFile === 0 && !firstInspectionToLoadToFormWithPhotos) {
            firstInspectionToLoadToFormWithPhotos = inspection; // Keep the one with photos to load into form
          }
        });
      } else if (result.status === 'rejected') {
        // Error already toasted in readFilePromise
      }
    });

    let importedCount = 0;
    let updatedCount = 0;

    if (allInspectionsFromFiles.length > 0) {
      setSavedInspections(currentSavedInspections => {
        let newOrUpdatedInspections = [...currentSavedInspections];
        
        allInspectionsFromFiles.forEach(inspectionToImport => {
          // Prepare a version for localStorage (without photos)
          const inspectionForLocalStorage: FullInspectionData = {
            ...inspectionToImport,
            towers: (inspectionToImport.towers || []).map(tower => ({
              ...tower,
              floors: (tower.floors || []).map(floor => ({
                ...floor,
                categories: (floor.categories || []).map(category => ({
                  ...category,
                  subItems: category.subItems ? category.subItems.map(subItem => {
                    const { photoDataUri, photoDescription, ...rest } = subItem;
                    return rest;
                  }) : undefined,
                })),
              })),
            })),
          };

          const existingIndex = newOrUpdatedInspections.findIndex(insp => insp.id === inspectionForLocalStorage.id && insp.id);
          if (existingIndex > -1) {
            newOrUpdatedInspections[existingIndex] = inspectionForLocalStorage;
            updatedCount++;
          } else {
            newOrUpdatedInspections.push(inspectionForLocalStorage);
            importedCount++;
          }
        });
        return newOrUpdatedInspections.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      });
    }

    if (firstInspectionToLoadToFormWithPhotos) {
        handleLoadInspection(firstInspectionToLoadToFormWithPhotos.id); // Use existing load logic, it will handle sanitization
        // Override with photo data if present from the imported file
        setClientInfo(prev => ({
            ...prev, // Keep potentially sanitized client info from handleLoadInspection
            ...(firstInspectionToLoadToFormWithPhotos!.clientInfo || {}) // But prefer imported clientInfo
        }));
        setUploadedLogoDataUrl(firstInspectionToLoadToFormWithPhotos.uploadedLogoDataUrl || null);
        setActiveTowersData(prevActiveTowers => { // Need to merge photo data back if loaded via handleLoadInspection
            return prevActiveTowers.map(activeTower => {
                const importedTower = firstInspectionToLoadToFormWithPhotos!.towers.find(it => it.id === activeTower.id || it.towerName === activeTower.towerName); // Match by ID or name
                if (!importedTower) return activeTower;
                return {
                    ...activeTower,
                    floors: activeTower.floors.map(activeFloor => {
                        const importedFloor = importedTower.floors.find(ifl => ifl.id === activeFloor.id || ifl.floor === activeFloor.floor);
                        if (!importedFloor) return activeFloor;
                        return {
                            ...activeFloor,
                            categories: activeFloor.categories.map(activeCat => {
                                const importedCat = importedFloor.categories.find(icf => icf.id === activeCat.id);
                                if (!importedCat || !importedCat.subItems) return activeCat;
                                return {
                                    ...activeCat,
                                    subItems: activeCat.subItems?.map(activeSub => {
                                        const importedSub = importedCat.subItems!.find(isb => isb.id === activeSub.id);
                                        return {
                                            ...activeSub,
                                            photoDataUri: importedSub?.photoDataUri || activeSub.photoDataUri,
                                            photoDescription: importedSub?.photoDescription || activeSub.photoDescription,
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        });
    }

    let summaryMessage = "";
    if (importedCount > 0 && updatedCount > 0) summaryMessage = `${importedCount} nova(s) e ${updatedCount} atualizada(s).`;
    else if (importedCount > 0) summaryMessage = `${importedCount} nova(s) importada(s).`;
    else if (updatedCount > 0) summaryMessage = `${updatedCount} vistoria(s) atualizada(s).`;

    if (firstInspectionToLoadToFormWithPhotos) {
        summaryMessage += ` A primeira foi carregada no formulário${firstInspectionToLoadToFormWithPhotos.uploadedLogoDataUrl || (firstInspectionToLoadToFormWithPhotos.towers || []).some(t => t.floors.some(f => f.categories.some(c => c.subItems?.some(s => s.photoDataUri)))) ? ' com logo/fotos' : ''}.`;
    } else if (allInspectionsFromFiles.length > 0 && !summaryMessage) {
        summaryMessage = "Vistorias processadas. Verifique a lista de salvas.";
    }


    if (summaryMessage) toast({ title: "Importação Concluída", description: summaryMessage });
    else if (files.length > 0 && allInspectionsFromFiles.length === 0) toast({ title: "Importação Concluída", description: "Nenhuma vistoria válida encontrada nos arquivos.", variant: "default" });


    if (event.target) event.target.value = ''; // Clear the input
  }, [toast, setSavedInspections, handleLoadInspection]);


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
                                  {floorData.categories.map((category, categoryIndex) => {
                                    const overallStatus = getCategoryOverallStatus(category);
                                    return (
                                      <InspectionCategoryItem
                                        key={`${floorData.id}-${category.id}`} // Ensure unique key
                                        category={category}
                                        overallStatus={overallStatus}
                                        onCategoryItemUpdate={(catId, update) => handleCategoryItemUpdateForFloor(towerIndex, floorIndex, catId, update)}
                                        floorIndex={floorIndex}
                                        towerIndex={towerIndex}
                                        onMoveCategoryItem={(catId, dir) => handleMoveCategoryItem(towerIndex, floorIndex, catId, dir)}
                                        onRemoveCategory={(catId) => handleRemoveCategoryFromFloor(towerIndex, floorIndex, catId)}
                                        categoryIndex={categoryIndex}
                                        totalCategoriesInFloor={floorData.categories.length}
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
