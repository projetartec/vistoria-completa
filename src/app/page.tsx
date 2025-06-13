
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
import { PREDEFINED_CLIENTS } from '@/constants/client.data'; // Importar clientes predefinidos
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateInspectionPdf, generateRegisteredItemsPdf, generateNCItemsPdf, generatePhotoReportPdf } from '@/lib/pdfGenerator'; 
import { ChevronDown, ChevronUp, Trash2, Eye, EyeOff, Rows3, Columns3, Copy, Edit2 } from 'lucide-react';
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

const initiateFileDownload = (inspectionData: FullInspectionData, clientInfoForFilename: ClientInfo) => {
  const jsonString = JSON.stringify(inspectionData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `vistoria_${clientInfoForFilename.inspectionNumber}_${clientInfoForFilename.clientLocation.replace(/\s+/g, '_')}.json`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return fileName; 
};


export default function FireCheckPage() {
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [blockAutoSaveOnce, setBlockAutoSaveOnce] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const jsonImportFileInputRef = useRef<HTMLInputElement>(null);

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


  const [isChecklistVisible, setIsChecklistVisible] = useState(false);
  const [isSavedInspectionsVisible, setIsSavedInspectionsVisible] = useState(false);
  const [uploadedLogoDataUrl, setUploadedLogoDataUrl] = useState<string | null>(null);


  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          // console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(err => {
          // console.log('ServiceWorker registration failed: ', err);
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
      };
      reader.readAsDataURL(file);
    }
  }, []);


  const handleClientInfoChange = useCallback((field: keyof ClientInfo, value: string) => {
    setClientInfo(prevClientInfo => {
      const newClientInfoState = { ...prevClientInfo, [field]: value };
      
      if (field === 'clientLocation') {
        const matchedClient = PREDEFINED_CLIENTS.find(
          client => client.name.trim().toLowerCase() === value.trim().toLowerCase()
        );
        if (matchedClient) {
          newClientInfoState.clientCode = matchedClient.code || ''; 
        }
      }

      if (field === 'clientLocation' || field === 'clientCode') {
        if (!newClientInfoState.inspectionNumber || 
            (field === 'clientLocation' && prevClientInfo.clientLocation !== newClientInfoState.clientLocation) ||
            (field === 'clientCode' && prevClientInfo.clientCode !== newClientInfoState.clientCode) ) {
             newClientInfoState.inspectionNumber = calculateNextInspectionNumber(
                newClientInfoState.clientCode,
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
                    if (!update.value) newSubItemState.photoDescription = ''; // Clear description if photo is removed
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
              copiedSubItem.photoDataUri = null; // Reset photo for new floor
              copiedSubItem.photoDescription = ''; // Reset photo description
              
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
    if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionNumber || !clientInfo.inspectionDate) {
      if (!isAutoSave) {
        toast({ title: "Dados Incompletos", description: "CÓDIGO DO CLIENTE, LOCAL, NÚMERO e DATA DA VISTORIA são obrigatórios.", variant: "destructive" });
      }
      return;
    }
     
    const namedFloors = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    if (namedFloors.length === 0) {
      if (!isAutoSave) {
        toast({ title: "Sem Andares Nomeados", description: "Adicione e nomeie pelo menos um andar.", variant: "destructive" });
      }
      return;
    }

    // Create a "lightweight" version for localStorage by removing photo data
    const lightweightFloors = namedFloors.map(floor => ({
      ...floor,
      categories: floor.categories.map(category => ({
        ...category,
        subItems: category.subItems ? category.subItems.map(subItem => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { photoDataUri, photoDescription, ...restOfSubItem } = subItem;
          return restOfSubItem;
        }) : []
      }))
    }));

    const fullInspectionToSaveForLocalStorage: FullInspectionData = {
      id: clientInfo.inspectionNumber, 
      clientInfo: { ...clientInfo }, 
      floors: lightweightFloors, // Use lightweight floors for localStorage
      timestamp: Date.now(),
      uploadedLogoDataUrl: uploadedLogoDataUrl
    };


    setSavedInspections(prevSaved => {
      let newSavedList = [...prevSaved];
      const existingIndex = newSavedList.findIndex(insp => insp.id === fullInspectionToSaveForLocalStorage.id);
      if (existingIndex > -1) {
        newSavedList[existingIndex] = fullInspectionToSaveForLocalStorage;
      } else {
        newSavedList.push(fullInspectionToSaveForLocalStorage);
      }
      const sortedList = newSavedList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      if (!isAutoSave) { 
        toast({ title: "Vistoria Salva Localmente", description: `Vistoria Nº ${fullInspectionToSaveForLocalStorage.id} salva no navegador (sem fotos na lista).` });
      }
      return sortedList;
    });
  }, [clientInfo, activeFloorsData, setSavedInspections, uploadedLogoDataUrl, toast]);


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

      // When loading from localStorage, photos are not present in `inspectionToLoad.floors`
      // So we initialize photoDataUri and photoDescription to null/empty
      const sanitizedFloors = inspectionToLoad.floors.map(floor => ({
        ...floor,
        id: (floor.id && typeof floor.id === 'string' && !floor.id.startsWith('server-temp-id-'))
            ? floor.id
            : `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
        isFloorContentVisible: false, 
        categories: floor.categories.map(cat => ({
          ...cat,
          isExpanded: false, 
          subItems: cat.subItems ? cat.subItems.map(sub => ({
            ...sub,
            id: (sub.id && typeof sub.id === 'string' && !sub.id.includes('NaN') && !sub.id.startsWith('server-temp-id-') && !sub.id.startsWith('custom-')) 
                ? sub.id 
                : sub.id.startsWith('custom-') ? sub.id : `loaded-sub-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
            photoDataUri: null, // Initialize as null when loading from saved list
            photoDescription: '', // Initialize as empty
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
      setIsChecklistVisible(false); 
      toast({ title: "Vistoria Carregada", description: `Vistoria Nº ${fullInspectionId} carregada (fotos não são salvas na lista).`});
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
      // Duplicating from the potentially "lightweight" version in savedInspections
      const duplicatedInspection = JSON.parse(JSON.stringify(originalInspection)) as FullInspectionData;
      
      const newInspectionNumber = `${originalInspection.clientInfo.inspectionNumber}_CÓPIA_${Date.now().toString().slice(-5)}`;
      duplicatedInspection.id = newInspectionNumber;
      duplicatedInspection.clientInfo.inspectionNumber = newInspectionNumber;
      duplicatedInspection.clientInfo.inspectionDate = new Date().toISOString().split('T')[0];
      duplicatedInspection.clientInfo.inspectedBy = ''; 
      duplicatedInspection.timestamp = Date.now();

      // Ensure duplicated floors also initialize photo fields correctly (as empty)
      duplicatedInspection.floors = duplicatedInspection.floors.map(floor => ({
        ...floor,
        id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}-floorcopy`,
        isFloorContentVisible: false, 
        categories: floor.categories.map(cat => ({
          ...cat,
          isExpanded: false, 
          subItems: cat.subItems ? cat.subItems.map(sub => ({
            ...sub,
            id: sub.id.startsWith('custom-') || sub.isRegistry 
                ? `${sub.id.split('-')[0]}-${Date.now()}-${Math.random().toString(36).substring(2,9)}-copy` 
                : sub.id,
            photoDataUri: null, // Duplicated inspection starts without photos
            photoDescription: '', // Duplicated inspection starts without photo descriptions
            registeredExtinguishers: sub.registeredExtinguishers ? sub.registeredExtinguishers.map(ext => ({
              ...ext,
              id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 10)}-extcopy`
            })) : [],
            registeredHoses: sub.registeredHoses ? sub.registeredHoses.map(hose => ({
              ...hose,
              id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 10)}-hosecopy`
            })) : []
          })) : []
        }))
      }));

      setSavedInspections(prevSaved => {
        return [duplicatedInspection, ...prevSaved].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      });
      toast({ title: "Vistoria Duplicada", description: `Vistoria Nº ${newInspectionNumber} criada (sem fotos).`});
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

      const updatedInspection: FullInspectionData = {
        ...JSON.parse(JSON.stringify(inspectionToUpdate)), 
        clientInfo: {
          ...inspectionToUpdate.clientInfo,
          clientLocation: newClientLocation.trim(),
        },
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
    if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionDate || !clientInfo.inspectionNumber) {
       toast({ title: "Dados Incompletos para PDF", description: "Preencha os dados do cliente para gerar o PDF.", variant: "destructive" });
      return;
    }
    const floorsToPrint = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    if (floorsToPrint.length === 0) {
       toast({ title: "Sem Andares Nomeados para PDF", description: "Nomeie pelo menos um andar para incluir no PDF.", variant: "destructive" });
      return;
    }
    // activeFloorsData will contain photos if they were just taken for the current inspection
    generateInspectionPdf(clientInfo, floorsToPrint, uploadedLogoDataUrl);
  }, [clientInfo, activeFloorsData, uploadedLogoDataUrl, toast]);

  const handleGenerateRegisteredItemsReport = useCallback(() => {
    if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionDate || !clientInfo.inspectionNumber) {
       toast({ title: "Dados Incompletos para Relatório", description: "Preencha os dados do cliente para gerar o relatório.", variant: "destructive" });
      return;
    }
    const floorsToReport = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    if (floorsToReport.length === 0) {
       toast({ title: "Sem Andares Nomeados para Relatório", description: "Nomeie pelo menos um andar para incluir no relatório.", variant: "destructive" });
      return;
    }
    generateRegisteredItemsPdf(clientInfo, floorsToReport, uploadedLogoDataUrl);
  }, [clientInfo, activeFloorsData, uploadedLogoDataUrl, toast]);

  const handleGenerateNCItemsReport = useCallback(() => {
    if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionDate || !clientInfo.inspectionNumber) {
       toast({ title: "Dados Incompletos para Relatório N/C", description: "Preencha os dados do cliente para gerar o relatório.", variant: "destructive" });
      return;
    }
    const floorsToReport = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    if (floorsToReport.length === 0) {
       toast({ title: "Sem Andares Nomeados para Relatório N/C", description: "Nomeie pelo menos um andar para incluir no relatório.", variant: "destructive" });
      return;
    }
    generateNCItemsPdf(clientInfo, floorsToReport, uploadedLogoDataUrl);
  }, [clientInfo, activeFloorsData, uploadedLogoDataUrl, toast]);

  const handleGeneratePhotoReportPdf = useCallback(() => {
    if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionDate || !clientInfo.inspectionNumber) {
       toast({ title: "Dados Incompletos para Relatório de Fotos", description: "Preencha os dados do cliente para gerar o relatório.", variant: "destructive" });
      return;
    }
    const floorsToReport = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    if (floorsToReport.length === 0) {
       toast({ title: "Sem Andares Nomeados para Relatório de Fotos", description: "Nomeie pelo menos um andar para incluir no relatório.", variant: "destructive" });
      return;
    }
    generatePhotoReportPdf(clientInfo, floorsToReport, uploadedLogoDataUrl);
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
    if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionNumber || !clientInfo.inspectionDate) {
      toast({ title: "Dados Incompletos", description: "Preencha os dados do cliente para exportar.", variant: "destructive" });
      return;
    }
    const namedFloorsFromActiveData = activeFloorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
    if (namedFloorsFromActiveData.length === 0) {
      toast({ title: "Sem Andares Nomeados", description: "Adicione e nomeie pelo menos um andar para exportar.", variant: "destructive" });
      return;
    }

    // Export activeFloorsData which WILL contain photos if present for the current inspection
    const inspectionToExport: FullInspectionData = {
      id: clientInfo.inspectionNumber,
      clientInfo: { ...clientInfo },
      floors: namedFloorsFromActiveData, // activeFloorsData contains the photos
      timestamp: Date.now(),
      uploadedLogoDataUrl: uploadedLogoDataUrl,
    };

    const fileName = initiateFileDownload(inspectionToExport, clientInfo);
    toast({ title: "Vistoria Exportada", description: `Arquivo ${fileName} salvo (com fotos, se houver).` });
  }, [clientInfo, activeFloorsData, uploadedLogoDataUrl, toast]);

  const handleImportInspectionFromJson = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: "Nenhum arquivo selecionado", description: "Por favor, selecione um arquivo JSON para importar.", variant: "destructive"});
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const importedData = JSON.parse(jsonString) as FullInspectionData;

        if (!importedData.id || !importedData.clientInfo || !importedData.floors || !importedData.timestamp) {
          throw new Error("Formato de arquivo JSON inválido.");
        }
        
        setBlockAutoSaveOnce(true);
        setClientInfo(importedData.clientInfo);
        setUploadedLogoDataUrl(importedData.uploadedLogoDataUrl || null);
        
        // Imported JSON might contain photos, so we load them as is into activeFloorsData
        const sanitizedFloors = importedData.floors.map(floor => ({
          ...floor,
          id: (floor.id && typeof floor.id === 'string' && !floor.id.startsWith('server-temp-id-'))
              ? floor.id
              : `${Date.now().toString()}-${Math.random().toString(36).substring(2, 9)}`,
          isFloorContentVisible: false, 
          categories: floor.categories.map(cat => ({
            ...cat,
            isExpanded: false, 
            subItems: cat.subItems ? cat.subItems.map(sub => ({
              ...sub,
              id: (sub.id && typeof sub.id === 'string' && !sub.id.includes('NaN') && !sub.id.startsWith('server-temp-id-') && !sub.id.startsWith('custom-')) 
                  ? sub.id 
                  : sub.id.startsWith('custom-') ? sub.id : `imported-sub-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
              photoDataUri: sub.photoDataUri || null, // Load photo if present in JSON
              photoDescription: sub.photoDescription || '', // Load photo desc if present
              registeredExtinguishers: sub.registeredExtinguishers ? sub.registeredExtinguishers.map(ext => ({
                ...ext,
                id: (ext.id && typeof ext.id === 'string' && !ext.id.includes('NaN') && !ext.id.startsWith('server-temp-id-'))
                    ? ext.id
                    : `${Date.now().toString()}-${Math.random().toString(36).substring(2, 10)}-ext-imported`
              })) : [],
              registeredHoses: sub.registeredHoses ? sub.registeredHoses.map(hose => ({
                ...hose,
                id: (hose.id && typeof hose.id === 'string' && !hose.id.includes('NaN') && !hose.id.startsWith('server-temp-id-'))
                    ? hose.id
                    : `${Date.now().toString()}-${Math.random().toString(36).substring(2, 10)}-hose-imported`
              })) : []
            })) : []
          }))
        }));
        setActiveFloorsData(sanitizedFloors);
        setIsChecklistVisible(false); 

        toast({ title: "Vistoria Importada", description: `Vistoria Nº ${importedData.id} carregada do arquivo (com fotos, se houver).` });
        
      } catch (error) {
        console.error("Erro ao importar JSON:", error);
        toast({ title: "Erro na Importação", description: "Não foi possível importar a vistoria do arquivo. Verifique o formato do arquivo e tente novamente.", variant: "destructive"});
      } finally {
        if (event.target) {
          event.target.value = ''; 
        }
      }
    };
    reader.readAsText(file);
  }, [toast]);

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
        />

        {isSavedInspectionsVisible && (
          <SavedInspectionsList
            savedInspections={savedInspections}
            onLoadInspection={handleLoadInspection}
            onDeleteInspection={handleDeleteInspection}
            onDeleteMultipleInspections={handleDeleteMultipleInspections}
            onDuplicateInspection={handleDuplicateInspection}
            onUpdateClientLocation={handleUpdateClientLocationForSavedInspection}
          />
        )}

        <footer className="text-center text-sm text-muted-foreground mt-12 pb-8">
          FireCheck Brazil &copy; {new Date().getFullYear()} - BRAZIL EXTINTORES
        </footer>
      </div>
    </ScrollArea>
  );
}

    

      