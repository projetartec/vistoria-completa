
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
import type { FullInspectionData, InspectionData, CategoryUpdatePayload, ClientInfo, StatusOption, InspectionCategoryState, CategoryOverallStatus, RegisteredExtinguisher, RegisteredHose, SubItemState } from '@/lib/types';
import { INITIAL_INSPECTION_DATA, INSPECTION_CONFIG } from '@/constants/inspection.config';
// PREDEFINED_CLIENTS is no longer used for auto-filling clientCode in this version
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateInspectionPdf, generateRegisteredItemsPdf, generateNCItemsPdf, generatePhotoReportPdf } from '@/lib/pdfGenerator'; 
import { ChevronDown, ChevronUp, Trash2, Eye, EyeOff, Rows3, Columns3, Copy, Edit2, FileJson } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const createNewFloorEntry = (): InspectionData => {
  const newId = (typeof window !== 'undefined')
    ? `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`
    : `server-temp-id-${Math.random().toString(36).substring(2,9)}`;

  return {
    id: newId,
    ...JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA)), // Deep copy
    floor: '',
    categories: JSON.parse(JSON.stringify(INITIAL_INSPECTION_DATA.categories)).map((cat: InspectionCategoryState) => ({...cat, isExpanded: false})),
    isFloorContentVisible: false, 
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
  clientLocation: string
): string => {
  const trimmedClientLocation = clientLocation.trim();

  if (!trimmedClientLocation) {
    return '';
  }
  // Simplified: Generate a random number, clientLocation is just a trigger
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
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [blockAutoSaveOnce, setBlockAutoSaveOnce] = useState(false); // This might become less relevant
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const jsonImportFileInputRef = useRef<HTMLInputElement>(null);

  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientLocation: '',
    clientCode: '', 
    inspectionNumber: '',
    inspectionDate: typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '',
    inspectedBy: '',
  });

  const [activeFloorsData, setActiveFloorsData] = useState<InspectionData[]>([]);
  const [isClientInitialized, setIsClientInitialized] = useState(false);

  const initialSavedFullInspections = useMemo(() => [], []);
  const [savedInspections, setSavedInspections] = useLocalStorage<FullInspectionData[]>('firecheck-full-inspections-v2', initialSavedFullInspections);

  const [savedLocations, setSavedLocations] = useLocalStorage<string[]>('firecheck-saved-locations-v1', []);


  const [isChecklistVisible, setIsChecklistVisible] = useState(false);
  const [isSavedInspectionsVisible, setIsSavedInspectionsVisible] = useState(false);
  const [uploadedLogoDataUrl, setUploadedLogoDataUrl] = useState<string | null>(null);


  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          // console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(err => {
          // console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
     // Initialize clientInfo.inspectionDate here if not already set by server/localStorage
     if (!clientInfo.inspectionDate && typeof window !== 'undefined') {
      setClientInfo(prev => ({...prev, inspectionDate: new Date().toISOString().split('T')[0]}));
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
      };
      reader.readAsDataURL(file);
    }
  }, []);


  const handleClientInfoChange = useCallback((field: keyof ClientInfo, value: string) => {
    setClientInfo(prevClientInfo => {
      const newClientInfoState = { ...prevClientInfo, [field]: value };
      
      if (field === 'clientLocation') {
        if (!newClientInfoState.inspectionNumber || prevClientInfo.clientLocation !== newClientInfoState.clientLocation) {
             newClientInfoState.inspectionNumber = calculateNextInspectionNumber(
                newClientInfoState.clientLocation 
             );
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
            case 'renameCategoryTitle':
              if (updatedCatData.title !== update.newTitle) {
                updatedCatData.title = update.newTitle;
                categoryStructurallyChanged = true;
              }
              break;
            case 'subItemStatus':
            case 'subItemObservation':
            case 'subItemShowObservation':
            case 'renameSubItemName':
            case 'subItemPhotoDataUri':
            case 'subItemPhotoDescription':
            case 'removeSubItemPhoto':
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
                  } else if (update.field === 'renameSubItemName' && newSubItemState.name !== update.newName) {
                    newSubItemState.name = update.newName;
                    changed = true;
                  } else if (update.field === 'subItemPhotoDataUri' && newSubItemState.photoDataUri !== (update.value as string | null)) {
                    newSubItemState.photoDataUri = update.value as string | null;
                    if (!update.value) newSubItemState.photoDescription = ''; 
                    changed = true;
                  } else if (update.field === 'subItemPhotoDescription' && newSubItemState.photoDescription !== (update.value as string)) {
                    newSubItemState.photoDescription = update.value as string;
                    changed = true;
                  } else if (update.field === 'removeSubItemPhoto') {
                    newSubItemState.photoDataUri = null;
                    newSubItemState.photoDescription = '';
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
                  photoDataUri: null,
                  photoDescription: '',
                };
                updatedCatData.subItems = [...(updatedCatData.subItems || []), newSubItem];
                categoryStructurallyChanged = true;
              }
              break;
            case 'removeSubItem':
              if (cat.subItems && update.subItemId) {
                const subItemToRemove = cat.subItems.find(sub => sub.id === update.subItemId);
                updatedCatData.subItems = cat.subItems.filter(sub => sub.id !== update.subItemId);
                categoryStructurallyChanged = true;
                if (subItemToRemove) {
                    // No confirmation needed
                }
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

            if (shouldAutoCollapse && cat.isExpanded) { 
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
              if (idx === collapsedCategoryIndex + 1 && !cat.isExpanded) { 
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
  }, []);


  const resetInspectionForm = useCallback(() => {
    const defaultInspectionDate = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '';
    const defaultClientInfo: ClientInfo = {
      clientLocation: '',
      clientCode: '', 
      inspectionNumber: '', 
      inspectionDate: defaultInspectionDate,
      inspectedBy: '',
    };
    setClientInfo(defaultClientInfo); 
    setActiveFloorsData([createNewFloorEntry()]);
    setIsChecklistVisible(false); 
    setBlockAutoSaveOnce(true); 
  }, []);

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
              copiedSubItem.photoDataUri = null; 
              copiedSubItem.photoDescription = ''; 
              
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
              photoDataUri: null, 
              photoDescription: '',
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
        isFloorContentVisible: false, 
      };
  
      return [...prevFloors, newFloorEntry];
    });
  
  }, []);

  const handleRemoveFloor = useCallback((floorIndex: number) => {
    if (activeFloorsData.length <= 1) {
      return;
    }
    setActiveFloorsData(prev => prev.filter((_, index) => index !== floorIndex));
  }, [activeFloorsData.length]);


  const handleSaveInspection = useCallback((isAutoSave = false) => {
    const currentClientInfo = clientInfo;
    
    const namedFloors = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    if (namedFloors.length === 0 && activeFloorsData.some(floor => floor.categories.some(cat => cat.status !== undefined || (cat.subItems && cat.subItems.some(sub => sub.status !== undefined))))) {
      if (!isAutoSave) {
        // Removed toast for manual save as well, as PDF generation is allowed without named floors.
        // toast({ title: "Sem Andares Nomeados", description: "Adicione e nomeie pelo menos um andar para salvar dados relevantes.", variant: "destructive" });
      }
    }

    const fullInspectionToSaveForLocalStorage: FullInspectionData = {
      id: currentClientInfo.inspectionNumber || `temp-id-${Date.now()}`,
      clientInfo: { ...currentClientInfo },
      floors: (namedFloors.length > 0 ? namedFloors : activeFloorsData).map(floor => ({
        ...floor,
        categories: floor.categories.map(category => ({
          ...category,
          subItems: category.subItems ? category.subItems.map(subItem => {
            const { photoDataUri, photoDescription, ...restOfSubItem } = subItem; // Strip photo data
            return restOfSubItem;
          }) : undefined,
        })),
      })),
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
      if (!isAutoSave && fullInspectionToSaveForLocalStorage.id && fullInspectionToSaveForLocalStorage.clientInfo.inspectionNumber) {
        toast({ title: "Vistoria Salva Localmente", description: `Vistoria Nº ${fullInspectionToSaveForLocalStorage.id} salva no navegador.` });
      }
      return sortedList;
    });
  }, [clientInfo, activeFloorsData, setSavedInspections, uploadedLogoDataUrl, toast]);


  // useEffect for Auto-Save - This is now disabled
  useEffect(() => {
    // if (blockAutoSaveOnce) {
    //   setBlockAutoSaveOnce(false); 
    //   return;
    // }

    // if (isClientInitialized) {
    //   if (debounceTimeoutRef.current) {
    //     clearTimeout(debounceTimeoutRef.current);
    //   }
    //   debounceTimeoutRef.current = setTimeout(() => {
    //     handleSaveInspection(true); // Auto-save call
    //   }, 2500); 
    // }

    // return () => {
    //   if (debounceTimeoutRef.current) {
    //     clearTimeout(debounceTimeoutRef.current);
    //   }
    // };
  }, [clientInfo, activeFloorsData, isClientInitialized, handleSaveInspection, blockAutoSaveOnce, uploadedLogoDataUrl]);


  const handleLoadInspection = (fullInspectionId: string) => {
    const inspectionToLoad = savedInspections.find(insp => insp.id === fullInspectionId);
    if (inspectionToLoad) {
      setBlockAutoSaveOnce(true);
      
      const loadedClientInfo = inspectionToLoad.clientInfo || {};
      setClientInfo({
        clientLocation: loadedClientInfo.clientLocation || '',
        clientCode: loadedClientInfo.clientCode || '',
        inspectionNumber: loadedClientInfo.inspectionNumber || '',
        inspectionDate: loadedClientInfo.inspectionDate || (typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : ''),
        inspectedBy: loadedClientInfo.inspectedBy || '',
      });
      
      setUploadedLogoDataUrl(inspectionToLoad.uploadedLogoDataUrl || null);

      const sanitizedFloors = (inspectionToLoad.floors || []).map(floor => ({
        ...floor,
        id: (floor.id && typeof floor.id === 'string' && !floor.id.startsWith('server-temp-id-'))
            ? floor.id
            : `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
        isFloorContentVisible: false, 
        categories: (floor.categories || []).map(cat => ({
          ...cat,
          isExpanded: false, 
          subItems: (cat.subItems || []).map(sub => ({
            ...sub,
            id: (sub.id && typeof sub.id === 'string' && !sub.id.includes('NaN') && !sub.id.startsWith('server-temp-id-') && !sub.id.startsWith('custom-')) 
                ? sub.id 
                : sub.id.startsWith('custom-') ? sub.id : `loaded-sub-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
            // Initialize photo fields as empty since they are not stored in localStorage's saved list
            photoDataUri: null, 
            photoDescription: '',
            registeredExtinguishers: (sub.registeredExtinguishers || []).map(ext => ({
              ...ext,
              id: (ext.id && typeof ext.id === 'string' && !ext.id.includes('NaN') && !ext.id.startsWith('server-temp-id-'))
                  ? ext.id
                  : `${Date.now().toString()}-${Math.random().toString(36).substring(2, 10)}-ext`
            })),
            registeredHoses: (sub.registeredHoses || []).map(hose => ({
              ...hose,
              id: (hose.id && typeof hose.id === 'string' && !hose.id.includes('NaN') && !hose.id.startsWith('server-temp-id-'))
                  ? hose.id
                  : `${Date.now().toString()}-${Math.random().toString(36).substring(2, 10)}-hose`
            }))
          }))
        }))
      }));
      
      setActiveFloorsData(sanitizedFloors);
      setIsSavedInspectionsVisible(false);
      setIsChecklistVisible(false); 
      toast({ title: "Vistoria Carregada", description: `Vistoria Nº ${fullInspectionId} carregada. Fotos não são armazenadas na lista de salvas e precisarão ser recapturadas ou importadas de um JSON se necessário.`});
    }
  };

  const handleDeleteInspection = useCallback((fullInspectionId: string) => {
    setSavedInspections(prev => prev.filter(insp => insp.id !== fullInspectionId));
     toast({ title: "Vistoria Excluída", description: `Vistoria Nº ${fullInspectionId} foi excluída.`, variant: "destructive" });

    if (clientInfo.inspectionNumber === fullInspectionId) {
      resetInspectionForm();
    }
  }, [setSavedInspections, clientInfo.inspectionNumber, resetInspectionForm, toast]);

  const handleDeleteMultipleInspections = useCallback((inspectionIds: string[]) => {
    setSavedInspections(prev => {
      const filteredList = prev.filter(insp => !inspectionIds.includes(insp.id));
      const newList = [...filteredList]; 
      return newList;
    });
     toast({ title: "Vistorias Excluídas", description: `${inspectionIds.length} vistoria(s) foram excluídas.`, variant: "destructive" });

    if (clientInfo.inspectionNumber && inspectionIds.includes(clientInfo.inspectionNumber)) {
      resetInspectionForm();
    }
  }, [setSavedInspections, clientInfo.inspectionNumber, resetInspectionForm, toast]);

  const handleDuplicateInspection = useCallback((originalInspectionId: string) => {
    const originalInspection = savedInspections.find(insp => insp.id === originalInspectionId);
    if (originalInspection) {
      const duplicatedInspection = JSON.parse(JSON.stringify(originalInspection)) as FullInspectionData;
      
      const newInspectionNumber = `${(originalInspection.clientInfo.inspectionNumber || 'COPIA')}_CÓPIA_${Date.now().toString().slice(-5)}`;
      duplicatedInspection.id = newInspectionNumber;
      
      const originalClientInfo = originalInspection.clientInfo || {};
      duplicatedInspection.clientInfo = {
        clientLocation: originalClientInfo.clientLocation || '',
        clientCode: originalClientInfo.clientCode || '',
        inspectionNumber: newInspectionNumber, 
        inspectionDate: typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '',
        inspectedBy: '', 
      };
      duplicatedInspection.timestamp = Date.now();

      duplicatedInspection.floors = (duplicatedInspection.floors || []).map(floor => ({
        ...floor,
        id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}-floorcopy`,
        isFloorContentVisible: false, 
        categories: (floor.categories || []).map(cat => ({
          ...cat,
          isExpanded: false, 
          subItems: (cat.subItems || []).map(sub => ({
            ...sub,
            id: sub.id.startsWith('custom-') || sub.isRegistry 
                ? `${sub.id.split('-')[0]}-${Date.now()}-${Math.random().toString(36).substring(2,9)}-copy` 
                : sub.id,
            // Photos are not part of the duplicated inspection from the saved list
            photoDataUri: null, 
            photoDescription: '', 
            registeredExtinguishers: (sub.registeredExtinguishers || []).map(ext => ({
              ...ext,
              id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 10)}-extcopy`
            })),
            registeredHoses: (sub.registeredHoses || []).map(hose => ({
              ...hose,
              id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 10)}-hosecopy`
            }))
          }))
        }))
      }));

      setSavedInspections(prevSaved => {
        return [duplicatedInspection, ...prevSaved].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      });
      toast({ title: "Vistoria Duplicada", description: `Vistoria Nº ${newInspectionNumber} criada (fotos não incluídas da lista de salvas).`});
    }
  }, [savedInspections, setSavedInspections, toast]);

  const handleUpdateClientLocationForSavedInspection = useCallback((inspectionId: string, newClientLocation: string) => {
    if (!newClientLocation.trim()) {
      toast({ title: "Erro ao Atualizar", description: "O novo nome do cliente não pode ser vazio.", variant: "destructive" });
      return;
    }

    setSavedInspections(prevSaved => {
      const inspectionToUpdate = prevSaved.find(insp => insp.id === inspectionId);
      if (!inspectionToUpdate) {
        toast({ title: "Erro ao Atualizar", description: "Vistoria original não encontrada.", variant: "destructive" });
        return prevSaved;
      }
      
      const updatedClientInfo = {
        ...(inspectionToUpdate.clientInfo || {}),
        clientLocation: newClientLocation.trim(),
      };

      const updatedInspection: FullInspectionData = {
        ...JSON.parse(JSON.stringify(inspectionToUpdate)), 
        clientInfo: updatedClientInfo,
        timestamp: Date.now(), 
      };

      const updatedList = prevSaved.map(insp => insp.id === inspectionId ? updatedInspection : insp);
      const sortedList = updatedList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      toast({ title: "Nome do Cliente Atualizado", description: `O nome do cliente para a vistoria Nº ${inspectionId} foi atualizado.` });
      return sortedList;
    });

    if (clientInfo.inspectionNumber === inspectionId) {
      setClientInfo(prev => ({ ...prev, clientLocation: newClientLocation.trim() }));
    }
  }, [savedInspections, setSavedInspections, clientInfo.inspectionNumber, toast]);


  const handleGeneratePdf = useCallback(() => {
    const floorsToPrint = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    if (floorsToPrint.length === 0 && activeFloorsData.some(f => f.categories.length > 0)) { 
      // Toast removed as PDF generation is now allowed without these fields.
      // toast({ title: "Sem Andares Nomeados para PDF", description: "Nomeie pelo menos um andar para incluir no PDF ou adicione itens.", variant: "destructive" });
      // return; // No longer returning
    }
    generateInspectionPdf(clientInfo, floorsToPrint.length > 0 ? floorsToPrint : activeFloorsData, uploadedLogoDataUrl);
  }, [clientInfo, activeFloorsData, uploadedLogoDataUrl, toast]);

  const handleGenerateRegisteredItemsReport = useCallback(() => {
    const floorsToReport = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    if (floorsToReport.length === 0 && activeFloorsData.some(f => f.categories.length > 0)) {
      // Toast removed
      // return; // No longer returning
    }
    generateRegisteredItemsPdf(clientInfo, floorsToReport.length > 0 ? floorsToReport : activeFloorsData, uploadedLogoDataUrl);
  }, [clientInfo, activeFloorsData, uploadedLogoDataUrl, toast]);

  const handleGenerateNCItemsReport = useCallback(() => {
    const floorsToReport = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    if (floorsToReport.length === 0 && activeFloorsData.some(f => f.categories.length > 0)) {
       // Toast removed
       // return; // No longer returning
    }
    generateNCItemsPdf(clientInfo, floorsToReport.length > 0 ? floorsToReport : activeFloorsData, uploadedLogoDataUrl);
  }, [clientInfo, activeFloorsData, uploadedLogoDataUrl, toast]);

  const handleGeneratePhotoReportPdf = useCallback(() => {
    const floorsToReport = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    if (floorsToReport.length === 0 && activeFloorsData.some(f => f.categories.length > 0)) {
      // Toast removed
      // return; // No longer returning
    }
    generatePhotoReportPdf(clientInfo, floorsToReport.length > 0 ? floorsToReport : activeFloorsData, uploadedLogoDataUrl);
  }, [clientInfo, activeFloorsData, uploadedLogoDataUrl, toast]);


  const handlePrintPage = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  const toggleSavedInspections = () => {
    setIsSavedInspectionsVisible(!isSavedInspectionsVisible);
  };

  const handleCollapseAllGlobalCategories = useCallback(() => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map(floor => ({
        ...floor,
        categories: floor.categories.map(cat => ({ ...cat, isExpanded: false })),
      }))
    );
  }, []);

  const handleExpandAllGlobalCategories = useCallback(() => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map(floor => ({
        ...floor,
        categories: floor.categories.map(cat => ({ ...cat, isExpanded: true })),
      }))
    );
  }, []);

  const handleShowAllFloorContent = useCallback(() => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map(floor => ({
        ...floor,
        isFloorContentVisible: true,
      }))
    );
  }, []);

  const handleHideAllFloorContent = useCallback(() => {
    setActiveFloorsData(prevFloors =>
      prevFloors.map(floor => ({
        ...floor,
        isFloorContentVisible: false,
      }))
    );
  }, []);


  const handleExpandAllCategoriesForFloor = useCallback((floorIndex: number) => {
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
  }, []);
  
  const handleCollapseAllCategoriesForFloor = useCallback((floorIndex: number) => {
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
  }, []);

  const handleToggleAllCategoriesForFloor = useCallback((floorIndex: number) => {
    const floor = activeFloorsData[floorIndex];
    if (floor) {
      const areAnyExpanded = floor.categories.some(cat => cat.isExpanded);
      if (areAnyExpanded) {
        handleCollapseAllCategoriesForFloor(floorIndex);
      } else {
        handleExpandAllCategoriesForFloor(floorIndex);
      }
    }
  }, [activeFloorsData, handleCollapseAllCategoriesForFloor, handleExpandAllCategoriesForFloor]);

  const handleToggleFloorContent = useCallback((floorIndex: number) => {
    setActiveFloorsData(prevFloors => {
      const newFloors = prevFloors.map((floor, index) =>
        index === floorIndex
          ? { ...floor, isFloorContentVisible: !(floor.isFloorContentVisible !== undefined ? floor.isFloorContentVisible : false) } 
          : floor
      );
      return newFloors;
    });
  }, []);


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
  }, []);

  const handleExportCurrentInspectionToJson = useCallback(() => {
    const namedFloorsFromActiveData = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    // Toast for unnamed floors removed as per previous request
    // if (namedFloorsFromActiveData.length === 0 && activeFloorsData.some(f => f.categories.length > 0)) {
    //   // return;
    // }

    const inspectionToExport: FullInspectionData = {
      id: clientInfo.inspectionNumber || `export-id-${Date.now()}`,
      clientInfo: { ...clientInfo },
      // Photos from activeFloorsData are included here
      floors: namedFloorsFromActiveData.length > 0 ? namedFloorsFromActiveData : activeFloorsData,
      timestamp: Date.now(),
      uploadedLogoDataUrl: uploadedLogoDataUrl,
    };
    
    const clientInfoForFilename = {
        inspectionNumber: inspectionToExport.id,
        clientLocation: inspectionToExport.clientInfo.clientLocation || 'vistoria',
        clientCode: '', 
        inspectionDate: '', 
    };

    const baseFileName = `vistoria_${clientInfoForFilename.inspectionNumber}_${clientInfoForFilename.clientLocation.replace(/\s+/g, '_')}`;
    const fileName = initiateFileDownload(inspectionToExport, baseFileName);
    toast({ title: "Vistoria Exportada", description: `Arquivo ${fileName} salvo.` });
  }, [clientInfo, activeFloorsData, uploadedLogoDataUrl, toast]);

  const handleDownloadSelectedInspections = useCallback((inspectionIds: string[]) => {
    if (inspectionIds.length === 0) {
      toast({ title: "Nenhuma Vistoria Selecionada", description: "Selecione uma ou mais vistorias para baixar.", variant: "destructive" });
      return;
    }
    const inspectionsToDownload = savedInspections.filter(insp => inspectionIds.includes(insp.id));
    if (inspectionsToDownload.length === 0) {
      toast({ title: "Vistorias Não Encontradas", description: "Não foi possível encontrar as vistorias selecionadas.", variant: "destructive" });
      return;
    }
    // Remember: inspectionsToDownload are from localStorage, so they won't have full photo data
    const fileName = initiateFileDownload(inspectionsToDownload, 'vistorias_selecionadas');
    toast({ title: "Vistorias Exportadas", description: `Arquivo ${fileName} com ${inspectionsToDownload.length} vistoria(s) salvo (fotos não incluídas da lista salva).` });
  }, [savedInspections, toast]);

  const handleDownloadSingleSavedInspection = useCallback((inspectionId: string) => {
    const inspectionToDownload = savedInspections.find(insp => insp.id === inspectionId);
    if (!inspectionToDownload) {
      toast({ title: "Vistoria Não Encontrada", description: "Não foi possível encontrar a vistoria para download.", variant: "destructive" });
      return;
    }
    // Remember: inspectionToDownload is from localStorage, so it won't have full photo data
    const clientLoc = (inspectionToDownload.clientInfo.clientLocation || 'sem_local').replace(/\s+/g, '_');
    const baseFileName = `vistoria_${inspectionToDownload.id}_${clientLoc}`;
    const fileName = initiateFileDownload(inspectionToDownload, baseFileName);
    toast({ title: "Vistoria Exportada", description: `Arquivo ${fileName} salvo (fotos não incluídas da lista salva).` });
  }, [savedInspections, toast]);


  const handleImportInspectionFromJson = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      toast({ title: "Nenhum arquivo selecionado", description: "Por favor, selecione um ou mais arquivos JSON para importar.", variant: "destructive"});
      return;
    }

    let firstInspectionLoadedToForm = false;
    let importedCount = 0;
    let updatedCount = 0;
    
    const processFile = (file: File, isFirstFile: boolean) => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonString = e.target?.result as string;
            const importedData = JSON.parse(jsonString);
            const inspectionsToProcess: FullInspectionData[] = Array.isArray(importedData) ? importedData : [importedData];

            if (inspectionsToProcess.length === 0) {
              throw new Error(`Nenhuma vistoria encontrada no arquivo ${file.name}.`);
            }

            setSavedInspections(currentSavedInspections => {
              let newSavedList = [...currentSavedInspections];
              inspectionsToProcess.forEach((inspectionToImport, index) => {
                if (!inspectionToImport.id || !inspectionToImport.clientInfo || !inspectionToImport.floors || !inspectionToImport.timestamp) {
                  console.warn(`Vistoria inválida ou incompleta no arquivo ${file.name} no índice ${index}, pulando.`);
                  return; 
                }
                
                // Prepare the version for localStorage (strip photos)
                const inspectionForLocalStorage: FullInspectionData = {
                  ...inspectionToImport,
                  floors: inspectionToImport.floors.map(floor => ({
                    ...floor,
                    categories: floor.categories.map(category => ({
                      ...category,
                      subItems: category.subItems ? category.subItems.map(subItem => {
                        const { photoDataUri, photoDescription, ...restOfSubItem } = subItem;
                        return restOfSubItem;
                      }) : undefined,
                    })),
                  })),
                };


                const existingIndex = newSavedList.findIndex(insp => insp.id === inspectionForLocalStorage.id);
                if (existingIndex > -1) {
                  newSavedList[existingIndex] = inspectionForLocalStorage; 
                  updatedCount++;
                } else {
                  newSavedList.push(inspectionForLocalStorage); 
                  importedCount++;
                }

                // Load the first valid inspection (with photos if present in JSON) from the very first file into the active form
                if (isFirstFile && index === 0 && !firstInspectionLoadedToForm) {
                  setBlockAutoSaveOnce(true);
                  const loadedClientInfo = inspectionToImport.clientInfo || {};
                  setClientInfo({
                      clientLocation: loadedClientInfo.clientLocation || '',
                      clientCode: loadedClientInfo.clientCode || '',
                      inspectionNumber: loadedClientInfo.inspectionNumber || inspectionToImport.id,
                      inspectionDate: loadedClientInfo.inspectionDate || (typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : ''),
                      inspectedBy: loadedClientInfo.inspectedBy || '',
                  });
                  setUploadedLogoDataUrl(inspectionToImport.uploadedLogoDataUrl || null);
                  
                  // Sanitize and load floors WITH photo data for the active form
                  const sanitizedFloorsWithPhotos = (inspectionToImport.floors || []).map(floor => ({
                    ...floor,
                    id: (floor.id && typeof floor.id === 'string' && !floor.id.startsWith('server-temp-id-')) ? floor.id : `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
                    isFloorContentVisible: false, 
                    categories: (floor.categories || []).map(cat => ({
                      ...cat, isExpanded: false, 
                      subItems: (cat.subItems || []).map(sub => ({
                        ...sub,
                        id: (sub.id && typeof sub.id === 'string' && !sub.id.includes('NaN') && !sub.id.startsWith('server-temp-id-') && !sub.id.startsWith('custom-')) ? sub.id : sub.id.startsWith('custom-') ? sub.id : `imported-sub-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
                        photoDataUri: sub.photoDataUri || null, // Keep photo for active form
                        photoDescription: sub.photoDescription || '', // Keep photo description for active form
                        registeredExtinguishers: (sub.registeredExtinguishers || []).map(ext => ({ ...ext, id: (ext.id && typeof ext.id === 'string' && !ext.id.includes('NaN') && !ext.id.startsWith('server-temp-id-')) ? ext.id : `${Date.now().toString()}-${Math.random().toString(36).substring(2, 10)}-ext-imported` })),
                        registeredHoses: (sub.registeredHoses || []).map(hose => ({ ...hose, id: (hose.id && typeof hose.id === 'string' && !hose.id.includes('NaN') && !hose.id.startsWith('server-temp-id-')) ? hose.id : `${Date.now().toString()}-${Math.random().toString(36).substring(2, 10)}-hose-imported` }))
                      }))
                    }))
                  }));
                  setActiveFloorsData(sanitizedFloorsWithPhotos);
                  setIsChecklistVisible(false); 
                  firstInspectionLoadedToForm = true;
                }
              });
              return newSavedList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            });
            resolve();
          } catch (error) {
            console.error(`Erro ao importar JSON do arquivo ${file.name}:`, error);
            let errorMessage = `Não foi possível importar do arquivo ${file.name}. Verifique o formato.`;
            if (error instanceof Error) { errorMessage = error.message; }
            toast({ title: "Erro na Importação", description: errorMessage, variant: "destructive"});
            reject(error);
          }
        };
        reader.onerror = (err) => {
          console.error(`Erro ao ler o arquivo ${file.name}:`, err);
          toast({ title: "Erro de Leitura", description: `Não foi possível ler o arquivo ${file.name}.`, variant: "destructive"});
          reject(err);
        };
        reader.readAsText(file);
      });
    };

    (async () => {
      for (let i = 0; i < files.length; i++) {
        await processFile(files[i], i === 0);
      }
      
      let summaryMessage = "";
      if (importedCount > 0 && updatedCount > 0) {
        summaryMessage = `${importedCount} nova(s) vistoria(s) importada(s) e ${updatedCount} atualizada(s).`;
      } else if (importedCount > 0) {
        summaryMessage = `${importedCount} nova(s) vistoria(s) importada(s).`;
      } else if (updatedCount > 0) {
        summaryMessage = `${updatedCount} vistoria(s) atualizada(s).`;
      }
      
      if (firstInspectionLoadedToForm) {
        summaryMessage += ` A primeira vistoria foi carregada no formulário (com fotos, se presentes no JSON). As vistorias salvas na lista local não armazenam fotos.`;
      } else if (summaryMessage) {
        summaryMessage += ` As vistorias salvas na lista local não armazenam fotos.`;
      }


      if (summaryMessage) {
        toast({ title: "Importação Concluída", description: summaryMessage });
      } else if (files.length > 0 && importedCount === 0 && updatedCount === 0 && !firstInspectionLoadedToForm) {
        toast({ title: "Importação Concluída", description: "Nenhuma vistoria válida foi encontrada nos arquivos para importar ou atualizar.", variant: "default" });
      }

      if (event.target) {
        event.target.value = ''; 
      }
    })();

  }, [toast, setSavedInspections, setActiveFloorsData, setClientInfo, setUploadedLogoDataUrl]);

  const triggerJsonImport = useCallback(() => {
    jsonImportFileInputRef.current?.click();
  }, []);


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
              <div className="flex flex-wrap gap-2 mb-4">
                <Button onClick={handleExpandAllGlobalCategories} variant="outline" size="sm" title="Expandir Todas as Categorias (Global)">
                  <Eye className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Expandir Tudo</span>
                </Button>
                <Button onClick={handleCollapseAllGlobalCategories} variant="outline" size="sm" title="Recolher Todas as Categorias (Global)">
                  <EyeOff className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Recolher Tudo</span>
                </Button>
                <Button onClick={handleShowAllFloorContent} variant="outline" size="sm" title="Mostrar Conteúdo de Todos os Andares (Global)">
                  <Rows3 className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Mostrar Tudo</span>
                </Button>
                <Button onClick={handleHideAllFloorContent} variant="outline" size="sm" title="Ocultar Conteúdo de Todos os Andares (Global)">
                  <Columns3 className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Ocultar Tudo</span>
                </Button>
              </div>

              {activeFloorsData.map((floorData, floorIndex) => {
                const areAnyCategoriesExpanded = floorData.categories.some(cat => cat.isExpanded);
                return (
                  <Card key={floorData.id} className="mb-6 shadow-md">
                    <CardContent className="p-4 space-y-3">
                       <div className="flex flex-col md:flex-row md:items-center md:flex-wrap gap-x-2 gap-y-3 mb-3">
                          <div className="flex flex-row items-center gap-x-2 flex-grow md:flex-grow-0">
                            <Label htmlFor={`floorName-${floorData.id}`} className="text-base font-medium whitespace-nowrap">
                              ANDAR:
                            </Label>
                            <Input
                              id={`floorName-${floorData.id}`}
                              value={floorData.floor}
                              onChange={(e) => handleFloorSpecificFieldChange(floorIndex, 'floor', e.target.value)}
                              placeholder="Ex: Térreo, 1A, Subsolo"
                              className="flex-grow max-w-xs min-w-[100px]"
                            />
                          </div>
                          
                          <div className="flex flex-row items-center gap-x-2 md:ml-auto">
                             <Button 
                              onClick={() => handleToggleAllCategoriesForFloor(floorIndex)} 
                              variant="outline" 
                              size="sm" 
                              title={areAnyCategoriesExpanded ? "Recolher todos os itens deste andar" : "Expandir todos os itens deste andar"}
                            >
                              {areAnyCategoriesExpanded ? (
                                <>
                                  <EyeOff className="mr-1 h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Recolher Itens</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-1 h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Expandir Itens</span>
                                </>
                              )}
                            </Button>
                            <Button 
                                onClick={() => handleToggleFloorContent(floorIndex)} 
                                variant="outline" 
                                size="sm" 
                                title={floorData.isFloorContentVisible !== false ? "Ocultar conteúdo do andar" : "Mostrar conteúdo do andar"}
                              >
                                {floorData.isFloorContentVisible !== false ? <ChevronUp className="mr-1 h-4 w-4 sm:mr-2" /> : <ChevronDown className="mr-1 h-4 w-4 sm:mr-2" />}
                                <span className="hidden sm:inline">{floorData.isFloorContentVisible !== false ? "Ocultar" : "Mostrar"}</span>
                             </Button>
                             {activeFloorsData.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFloor(floorIndex)}
                                className="text-destructive hover:bg-destructive/10 h-9 w-9"
                                title="Remover este andar"
                              >
                                <Trash2 className="h-5 w-5" />
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
                                key={`${floorData.id}-${category.id}`}
                                category={category}
                                overallStatus={overallStatus}
                                onCategoryItemUpdate={handleCategoryItemUpdateForFloor}
                                floorIndex={floorIndex}
                                onMoveCategoryItem={handleMoveCategoryItem}
                                onRemoveCategory={handleRemoveCategoryFromFloor}
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
            </>
          )}
        </div>
        
        <ActionButtonsPanel
          onSave={() => handleSaveInspection(false)}
          onNewInspection={resetInspectionForm}
          onNewFloor={handleNewFloorInspection}
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
         <input 
          type="file"
          ref={jsonImportFileInputRef}
          accept=".json,application/json"
          onChange={handleImportInspectionFromJson}
          className="hidden"
          id="json-import-input"
          multiple // Allow multiple file selection
        />

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

        <footer className="text-center text-sm text-muted-foreground mt-12 pb-8">
          FireCheck Brazil &copy; {new Date().getFullYear()} - BRAZIL EXTINTORES
        </footer>
      </div>
    </ScrollArea>
  );
}

