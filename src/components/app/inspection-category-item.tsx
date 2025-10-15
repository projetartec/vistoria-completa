
import * as React from 'react';
import { useCallback, useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff, CheckCircle2, XCircle, PlusCircle, Trash2, ListX, Save, X, Camera, Loader2 } from 'lucide-react';
import type { InspectionCategoryState, StatusOption, CategoryUpdatePayload, CategoryOverallStatus, SubItemState, RegisteredExtinguisher, ExtinguisherTypeOption, ExtinguisherWeightOption, RegisteredHose, HoseLengthOption, HoseDiameterOption, HoseTypeOption } from '@/lib/types';
import { PRESSURE_UNITS, STATUS_OPTIONS, EXTINGUISHER_TYPES, EXTINGUISHER_WEIGHTS, HOSE_LENGTHS, HOSE_DIAMETERS, HOSE_TYPES } from '@/constants/inspection.config';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '@/hooks/use-toast';
import { uploadImageAndGetURL } from '@/lib/firebase-storage';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface InspectionCategoryItemProps {
  category: InspectionCategoryState;
  onCategoryItemUpdate: (categoryId: string, update: CategoryUpdatePayload) => void;
  overallStatus: CategoryOverallStatus;
  isMobile: boolean;
}

const ExtinguisherRegistrySubItem: React.FC<{
  subItem: SubItemState;
  onUpdate: (update: CategoryUpdatePayload) => void;
}> = React.memo(({ subItem, onUpdate }) => {
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [type, setType] = useState<ExtinguisherTypeOption | ''>('');
  const [weight, setWeight] = useState<ExtinguisherWeightOption | ''>('');

  const handleAddExtinguisher = () => {
    if (!quantity || !type || !weight) {
      alert('Por favor, preencha Quantidade, Tipo e Peso do extintor.');
      return;
    }
    onUpdate({
      field: 'addRegisteredExtinguisher',
      subItemId: subItem.id,
      value: { quantity: Number(quantity), type, weight },
    });
    setQuantity(1);
    setType('');
    setWeight('');
  };

  const handleRemoveExtinguisher = (extinguisherId: string) => {
    onUpdate({
      field: 'removeRegisteredExtinguisher',
      subItemId: subItem.id,
      extinguisherId,
    });
  };

  return (
    <Card className="mt-2 mb-1 bg-muted/30">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-md font-semibold">{subItem.name}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <Label htmlFor={`${subItem.id}-ext-qty`} className="text-xs">Quantidade</Label>
            <Input
              id={`${subItem.id}-ext-qty`}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              min="1"
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label htmlFor={`${subItem.id}-ext-type`} className="text-xs">Tipo</Label>
            <Select value={type} onValueChange={(val) => setType(val as ExtinguisherTypeOption)}>
              <SelectTrigger id={`${subItem.id}-ext-type`} className="h-9 text-sm">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {EXTINGUISHER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`${subItem.id}-ext-weight`} className="text-xs">Peso</Label>
            <Select value={weight} onValueChange={(val) => setWeight(val as ExtinguisherWeightOption)}>
              <SelectTrigger id={`${subItem.id}-ext-weight`} className="h-9 text-sm">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {EXTINGUISHER_WEIGHTS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddExtinguisher} size="sm" className="h-9">
            <PlusCircle className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </div>

        {subItem.registeredExtinguishers && subItem.registeredExtinguishers.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">Extintores Cadastrados:</h4>
            <ul className="list-disc list-inside pl-1 space-y-0.5 text-sm">
              {subItem.registeredExtinguishers.map((ext) => (
                <li key={ext.id} className="flex justify-between items-center">
                  <span>{ext.quantity}x - {ext.type} - {ext.weight}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveExtinguisher(ext.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
ExtinguisherRegistrySubItem.displayName = 'ExtinguisherRegistrySubItem';


const HoseRegistrySubItem: React.FC<{
  subItem: SubItemState;
  onUpdate: (update: CategoryUpdatePayload) => void;
}> = React.memo(({ subItem, onUpdate }) => {
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [length, setLength] = useState<HoseLengthOption | ''>('');
  const [diameter, setDiameter] = useState<HoseDiameterOption | ''>('');
  const [type, setType] = useState<HoseTypeOption | ''>('');

  const handleAddHose = () => {
    if (!quantity || !length || !diameter || !type) {
      alert('Por favor, preencha Quantidade, Medida, Diâmetro e Tipo da mangueira.');
      return;
    }
    onUpdate({
      field: 'addRegisteredHose',
      subItemId: subItem.id,
      value: { quantity: Number(quantity), length, diameter, type },
    });
    setQuantity(1);
    setLength('');
    setDiameter('');
    setType('');
  };

  const handleRemoveHose = (hoseId: string) => {
    onUpdate({
      field: 'removeRegisteredHose',
      subItemId: subItem.id,
      hoseId,
    });
  };

  return (
    <Card className="mt-2 mb-1 bg-muted/30">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-md font-semibold">{subItem.name}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
          <div>
            <Label htmlFor={`${subItem.id}-hose-qty`} className="text-xs">Quantidade</Label>
            <Input
              id={`${subItem.id}-hose-qty`}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              min="1"
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label htmlFor={`${subItem.id}-hose-length`} className="text-xs">Medida</Label>
            <Select value={length} onValueChange={(val) => setLength(val as HoseLengthOption)}>
              <SelectTrigger id={`${subItem.id}-hose-length`} className="h-9 text-sm">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {HOSE_LENGTHS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`${subItem.id}-hose-diameter`} className="text-xs">Diâmetro</Label>
            <Select value={diameter} onValueChange={(val) => setDiameter(val as HoseDiameterOption)}>
              <SelectTrigger id={`${subItem.id}-hose-diameter`} className="h-9 text-sm">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {HOSE_DIAMETERS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`${subItem.id}-hose-type`} className="text-xs">Tipo</Label>
            <Select value={type} onValueChange={(val) => setType(val as HoseTypeOption)}>
              <SelectTrigger id={`${subItem.id}-hose-type`} className="h-9 text-sm">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {HOSE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddHose} size="sm" className="h-9">
            <PlusCircle className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </div>

        {subItem.registeredHoses && subItem.registeredHoses.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">Mangueiras Cadastradas:</h4>
            <ul className="list-disc list-inside pl-1 space-y-0.5 text-sm">
              {subItem.registeredHoses.map((hose) => (
                <li key={hose.id} className="flex justify-between items-center">
                  <span>{hose.quantity}x - {hose.length} - {hose.diameter} - {hose.type}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveHose(hose.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
HoseRegistrySubItem.displayName = 'HoseRegistrySubItem';


const InspectionCategoryItemComponent = ({ 
  category, 
  onCategoryItemUpdate, 
  overallStatus, 
  isMobile,
}: InspectionCategoryItemProps) => {
  const [newSubItemName, setNewSubItemName] = useState('');
  const [isEditingCategoryTitle, setIsEditingCategoryTitle] = useState(false);
  const [editingCategoryTitleValue, setEditingCategoryTitleValue] = useState(category.title);
  
  const [editingSubItemId, setEditingSubItemId] = useState<string | null>(null);
  const [editingSubItemNameValue, setEditingSubItemNameValue] = useState('');
  
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const [uploadingPhotoSubItemId, setUploadingPhotoSubItemId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpdate = useCallback((field: CategoryUpdatePayload['field'], value?: any, subItemId?: string, itemId?: string) => {
    let payload: CategoryUpdatePayload;
    if (field === 'markAllSubItemsNA') payload = { field };
    else if (field === 'markAllSubItemsOK') payload = { field }; 
    else if (field === 'addSubItem') payload = { field, categoryId: category.id, value: value as string };
    else if (field === 'removeSubItem' && subItemId) payload = { field, categoryId: category.id, subItemId };
    else if (field === 'renameCategoryTitle') payload = { field, newTitle: value as string };
    else if (field === 'renameSubItemName' && subItemId) payload = { field, subItemId, newName: value as string };
    else if (subItemId) {
      if (field === 'subItemStatus') payload = { field, subItemId, value: value as StatusOption | undefined };
      else if (field === 'subItemObservation') payload = { field, subItemId, value: value as string };
      else if (field === 'subItemShowObservation') payload = { field, subItemId, value: value as boolean };
      else if (field === 'subItemPhotoURL') payload = { field, subItemId, value: value as string | null };
      else if (field === 'subItemPhotoDescription') payload = { field, subItemId, value: value as string };
      else if (field === 'removeSubItemPhoto') payload = { field, subItemId };
      else if (field === 'addRegisteredExtinguisher') payload = { field, subItemId, value: value as Omit<RegisteredExtinguisher, 'id'> };
      else if (field === 'removeRegisteredExtinguisher' && itemId) payload = { field, subItemId, extinguisherId: itemId };
      else if (field === 'addRegisteredHose') payload = { field, subItemId, value: value as Omit<RegisteredHose, 'id'> };
      else if (field === 'removeRegisteredHose' && itemId) payload = { field, subItemId, hoseId: itemId };
      else return;
    } else {
      if (field === 'status') payload = { field, value: value as StatusOption | undefined };
      else payload = { field, value } as CategoryUpdatePayload;
    }
    onCategoryItemUpdate(category.id, payload);
  }, [category.id, onCategoryItemUpdate]);

  const handleSubItemRegistryUpdate = useCallback(
    (updatePayload: CategoryUpdatePayload) => {
      onCategoryItemUpdate(category.id, updatePayload);
    },
    [category.id, onCategoryItemUpdate]
  );

  const handlePhotoChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, subItemId: string) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingPhotoSubItemId(subItemId);
      try {
        const dataUri = await fileToDataUri(file);
        const imagePath = `inspections/${category.id}/${subItemId}-${Date.now()}`;
        const downloadURL = await uploadImageAndGetURL(dataUri, imagePath);
        handleUpdate('subItemPhotoURL', downloadURL, subItemId);
        toast({ title: 'Foto Adicionada', description: 'Sua foto foi salva na nuvem.' });
      } catch (error: any) {
        console.error("Photo upload failed:", error);
        toast({ title: 'Erro no Upload', description: error.message || 'Não foi possível salvar a foto na nuvem.', variant: 'destructive' });
      } finally {
        setUploadingPhotoSubItemId(null);
      }
    }
    if (event.target) event.target.value = '';
  }, [handleUpdate, toast, category.id]);

  const handleRemovePhoto = useCallback((subItemId: string) => {
    // Note: This only removes the URL from Firestore. It does not delete the file from Storage.
    // Implementing file deletion would require a more complex setup, possibly with security rules or backend functions.
    handleUpdate('removeSubItemPhoto', undefined, subItemId);
    toast({ title: 'Foto Removida', description: 'A referência da foto foi removida da vistoria.' });
  }, [handleUpdate, toast]);

  const handleAccordionValueChange = useCallback((openItemId: string) => {
    const newIsExpanded = openItemId === category.id;
    if (newIsExpanded !== category.isExpanded && !isEditingCategoryTitle) { 
      handleUpdate('isExpanded', newIsExpanded, undefined);
    }
  }, [category.id, category.isExpanded, handleUpdate, isEditingCategoryTitle]);

  const getStatusLabelColor = (option: StatusOption): string => {
    switch (option) {
      case 'OK': return "text-green-600 dark:text-green-400";
      case 'N/C': return "text-red-600 dark:text-red-400";
      case 'N/A': return "text-yellow-600 dark:text-yellow-400";
      default: return "";
    }
  };

  const handleAddCustomSubItem = useCallback(() => {
    if (newSubItemName.trim() === '') {
      alert('Por favor, insira um nome para o novo subitem.');
      return;
    }
    handleUpdate('addSubItem', newSubItemName.trim());
    setNewSubItemName(''); 
  }, [newSubItemName, handleUpdate]);

  const hasNonRegistrySubItems = useMemo(() => {
    return category.type === 'standard' && category.subItems && category.subItems.some(sub => !sub.isRegistry);
  }, [category.subItems, category.type]);

  const handleEditCategoryTitle = () => { if(isEditingCategoryTitle) return; setEditingCategoryTitleValue(category.title); setIsEditingCategoryTitle(true); };
  const handleSaveCategoryTitle = () => { if (editingCategoryTitleValue.trim() === '') { alert('O título não pode ser vazio.'); return; } handleUpdate('renameCategoryTitle', editingCategoryTitleValue.trim()); setIsEditingCategoryTitle(false); };
  const handleCancelEditCategoryTitle = () => { setIsEditingCategoryTitle(false); setEditingCategoryTitleValue(category.title); };
  const handleEditSubItemName = (subItem: SubItemState) => { if(editingSubItemId === subItem.id) return; setEditingSubItemId(subItem.id); setEditingSubItemNameValue(subItem.name); };
  const handleSaveSubItemName = (subItemId: string) => { if (editingSubItemNameValue.trim() === '') { alert('O nome não pode ser vazio.'); return; } handleUpdate('renameSubItemName', editingSubItemNameValue.trim(), subItemId); setEditingSubItemId(null); };
  const handleCancelEditSubItemName = () => { const subItem = category.subItems?.find(s => s.id === editingSubItemId); if(subItem) setEditingSubItemNameValue(subItem.name); setEditingSubItemId(null); };

  return (
    <Accordion
      type="single" collapsible value={category.isExpanded && !isEditingCategoryTitle ? category.id : ""} 
      onValueChange={handleAccordionValueChange} className="mb-4 bg-card shadow-md rounded-lg group/item transition-all duration-150 ease-out"
    >
      <AccordionItem value={category.id} className="border-b-0">
        <div className="flex items-center justify-between px-4 py-3 group/item">
          {isEditingCategoryTitle ? (
            <div className="flex items-center gap-2 w-full flex-1 mr-2">
              <Input value={editingCategoryTitleValue} onChange={(e) => setEditingCategoryTitleValue(e.target.value)} onClick={(e) => e.stopPropagation()} 
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveCategoryTitle(); } if (e.key === 'Escape') { e.preventDefault(); handleCancelEditCategoryTitle(); }}}
                className="h-9 text-base sm:text-lg" autoFocus />
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleSaveCategoryTitle();}} className="h-9 w-9 text-green-600 hover:bg-green-500/10"><Save className="h-5 w-5"/></Button>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleCancelEditCategoryTitle();}} className="h-9 w-9 text-red-600 hover:bg-red-500/10"><X className="h-5 w-5"/></Button>
            </div>
          ) : (
            <AccordionTrigger className={cn("flex-1 items-center text-left font-medium transition-all hover:no-underline focus:outline-none py-0 px-0 justify-between", "[&[data-state=open]>svg]:rotate-180")} disabled={isEditingCategoryTitle}>
              <div className="flex items-center flex-1 mr-2"> 
                {overallStatus === 'all-items-selected' ? <CheckCircle2 className="h-5 w-5 mr-2 text-green-600 dark:text-green-400 flex-shrink-0" /> : <XCircle className="h-5 w-5 mr-2 text-red-600 dark:text-red-400 flex-shrink-0" />}
                <h3 className="text-base sm:text-lg font-semibold font-headline cursor-pointer hover:text-primary/80 transition-colors" onClick={(e) => { e.stopPropagation(); handleEditCategoryTitle(); }} title="Clique para editar">{category.title}</h3>
              </div>
            </AccordionTrigger>
          )}
          
        </div>
        
        <AccordionContent className="px-4 pt-0 pb-4 space-y-1">
          {category.type === 'standard' && hasNonRegistrySubItems && (
             <div className="mb-3 mt-1 flex flex-wrap gap-2 justify-start">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleUpdate('markAllSubItemsOK')} 
                className="rounded-full text-green-600 border-green-500 hover:bg-green-500/10 hover:text-green-700 w-10 h-10"
                title="Marcar Todos OK"
              >
                OK
              </Button>
               <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleUpdate('markAllSubItemsNA')} 
                className="rounded-full text-yellow-600 border-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-700 w-10 h-10"
                title="Marcar Todos N/A"
              >
                N/A
              </Button>
            </div>
          )}

          {category.type === 'standard' && category.subItems?.map((subItem) => {
            if (subItem.isRegistry) {
              if (subItem.id === 'extintor_cadastro') return <ExtinguisherRegistrySubItem key={subItem.id} subItem={subItem} onUpdate={handleSubItemRegistryUpdate} />;
              else if (subItem.id === 'hidrantes_cadastro_mangueiras') return <HoseRegistrySubItem key={subItem.id} subItem={subItem} onUpdate={handleSubItemRegistryUpdate} />;
              return null;
            }
            return (
              <div key={subItem.id} className="py-3 border-t first:border-t-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:gap-x-3 gap-y-1 mb-1">
                  {editingSubItemId === subItem.id ? (
                    <div className="flex items-center gap-2 flex-grow">
                       <Input value={editingSubItemNameValue} onChange={(e) => setEditingSubItemNameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveSubItemName(subItem.id); } if (e.key === 'Escape') { e.preventDefault(); handleCancelEditSubItemName(); }}}
                          className="h-9 text-sm sm:text-base" autoFocus />
                        <Button variant="ghost" size="icon" onClick={() => handleSaveSubItemName(subItem.id)} className="h-9 w-9 text-green-600 hover:bg-green-500/10" title="Salvar"><Save className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={handleCancelEditSubItemName} className="h-9 w-9 text-red-600 hover:bg-red-500/10" title="Cancelar"><X className="h-5 w-5"/></Button>
                    </div>
                  ) : ( <Label className="font-medium text-sm sm:text-base flex-grow break-words min-w-0 sm:w-auto cursor-pointer hover:text-primary/80 transition-colors" onClick={() => handleEditSubItemName(subItem)} title="Clique para editar">{subItem.name}</Label> )}
                  <div className="flex items-center gap-x-1 sm:gap-x-2 flex-shrink-0 flex-wrap">
                    <RadioGroup value={subItem.status || ''} onValueChange={(value) => handleUpdate('subItemStatus', value as StatusOption, subItem.id)} className="flex items-center gap-2 flex-wrap">
                      {STATUS_OPTIONS.map(opt => ( <div key={`${subItem.id}-${opt}`} className="flex items-center space-x-1"><RadioGroupItem value={opt} id={`${subItem.id}-${opt}-rg-item`} className="h-5 w-5"/><Label htmlFor={`${subItem.id}-${opt}-rg-item`} className={cn("cursor-pointer font-normal text-sm", getStatusLabelColor(opt))}>{opt}</Label></div> ))}
                    </RadioGroup>
                    <Button variant="ghost" size="icon" onClick={() => handleUpdate('subItemShowObservation', !subItem.showObservation, subItem.id)} className="h-9 w-9 text-muted-foreground hover:text-foreground" title={subItem.showObservation ? 'Esconder Obs.' : 'Mostrar Obs.'}>{subItem.showObservation ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</Button>
                    <Button variant="ghost" size="icon" onClick={() => handleUpdate('removeSubItem', undefined, subItem.id)} className="h-9 w-9 text-destructive hover:bg-destructive/10" title="Remover subitem"><Trash2 className="h-5 w-5" /></Button>
                    {uploadingPhotoSubItemId === subItem.id ? (
                      <Button variant="outline" size="icon" className="rounded-full h-9 w-9" disabled>
                          <Loader2 className="h-5 w-5 animate-spin" />
                      </Button>
                    ) : !subItem.photoURL && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          ref={el => fileInputRefs.current[subItem.id] = el}
                          onChange={(e) => handlePhotoChange(e, subItem.id)}
                          className="hidden"
                          id={`photo-input-${subItem.id}`}
                        />
                        <Button
                          onClick={() => fileInputRefs.current[subItem.id]?.click()}
                          variant="outline"
                          size="icon"
                          className="rounded-full h-9 w-9"
                          title="Adicionar Foto"
                        >
                          <Camera className="h-5 w-5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {subItem.showObservation && ( <div className="mt-1"><Textarea value={subItem.observation} onChange={(e) => handleUpdate('subItemObservation', e.target.value, subItem.id)} placeholder="Observações..." className="w-full text-sm"/></div> )}
                {subItem.photoURL && (
                  <div className="mt-2 space-y-2 p-2 border rounded-md bg-muted/20">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Foto:</Label>
                      <Image src={subItem.photoURL} alt={`Foto de ${subItem.name}`} width={150} height={150} className="rounded-md object-contain max-h-[150px] w-auto border" />
                      <Textarea value={subItem.photoDescription || ''} onChange={(e) => handleUpdate('subItemPhotoDescription', e.target.value, subItem.id)} placeholder="Obs. da foto..." className="w-full text-sm" rows={2}/>
                      <Button onClick={() => handleRemovePhoto(subItem.id)} variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 border-destructive/50"><Trash2 className="mr-1 h-4 w-4" /> Remover Foto</Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {category.type === 'standard' && (
            <div className="mt-4 pt-4 border-t">
              <Label htmlFor={`add-subitem-${category.id}`} className="text-sm font-medium">Adicionar Novo Subitem:</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input id={`add-subitem-${category.id}`} type="text" value={newSubItemName} onChange={(e) => setNewSubItemName(e.target.value)} placeholder="Nome do novo subitem" className="flex-grow" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSubItem();}}}/>
                <Button onClick={handleAddCustomSubItem} size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar</Button>
              </div>
            </div>
          )}

          {category.type === 'special' && ( <div className="py-2"> <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1"> {!isEditingCategoryTitle ? ( <span className="font-medium text-sm sm:text-base flex-grow break-words min-w-0 sm:w-auto cursor-pointer hover:text-primary/80 transition-colors" onClick={(e) => { e.stopPropagation(); handleEditCategoryTitle(); }} title="Clique para editar">{category.title} Status</span> ) : ( <div className="flex items-center gap-2 w-full"></div> )} <div className="flex items-center gap-x-2 sm:gap-x-3 flex-shrink-0 flex-wrap"> <RadioGroup value={category.status || ''} onValueChange={(value) => handleUpdate('status', value as StatusOption, undefined)} className="flex items-center gap-2 flex-wrap"> {STATUS_OPTIONS.map(opt => ( <div key={`${category.id}-${opt}`} className="flex items-center space-x-1"><RadioGroupItem value={opt} id={`${category.id}-${opt}-rg-item`} className="h-5 w-5" /><Label htmlFor={`${category.id}-${opt}-rg-item`} className={cn("cursor-pointer font-normal text-sm", getStatusLabelColor(opt))}>{opt}</Label></div> ))} </RadioGroup> <Button variant="ghost" size="icon" onClick={() => handleUpdate('showObservation', !category.showObservation, undefined)} className="h-9 w-9 text-muted-foreground hover:text-foreground">{category.showObservation ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}<span className="sr-only">{category.showObservation ? 'Esconder' : 'Mostrar'} Obs.</span></Button> </div> </div> {category.showObservation && ( <div className="mt-1"><Textarea value={category.observation} onChange={(e) => handleUpdate('observation', e.target.value, undefined)} placeholder={`Observações para ${category.title}...`} className="w-full"/></div> )} </div> )}
          {category.type === 'pressure' && ( <div className="py-3 space-y-3"> <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2"> {!isEditingCategoryTitle ? ( <span className="font-medium text-sm sm:text-base flex-grow break-words min-w-0 sm:w-auto cursor-pointer hover:text-primary/80 transition-colors" onClick={(e) => { e.stopPropagation(); handleEditCategoryTitle(); }} title="Clique para editar">{category.title} Status</span> ) : ( <div className="flex items-center gap-2 w-full"></div> )} <div className="flex items-center gap-x-2 sm:gap-x-3 flex-shrink-0 flex-wrap"> <RadioGroup value={category.status || ''} onValueChange={(value) => handleUpdate('status', value as StatusOption, undefined)} className="flex items-center gap-2 flex-wrap"> {STATUS_OPTIONS.map(opt => ( <div key={`${category.id}-${opt}-pressure`} className="flex items-center space-x-1"><RadioGroupItem value={opt} id={`${category.id}-${opt}-pressure-rg-item`} className="h-5 w-5"/><Label htmlFor={`${category.id}-${opt}-pressure-rg-item`} className={cn("cursor-pointer font-normal text-sm", getStatusLabelColor(opt))}>{opt}</Label></div> ))} </RadioGroup> </div> </div> {category.status !== 'N/A' && ( <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end"> <div> <Label htmlFor={`${category.id}-pressureValue`}>Pressão</Label> <Input id={`${category.id}-pressureValue`} type="text" value={category.pressureValue || ''} onChange={(e) => handleUpdate('pressureValue', e.target.value, undefined)} placeholder="Ex: 7.5" disabled={category.status === 'N/A'}/> </div> <div> <Label htmlFor={`${category.id}-pressureUnit`}>Unidade</Label> <Select value={category.pressureUnit || ''} onValueChange={(value) => handleUpdate('pressureUnit', value as InspectionCategoryState['pressureUnit'], undefined)} disabled={category.status === 'N/A'}> <SelectTrigger id={`${category.id}-pressureUnit`}><SelectValue placeholder="Selecione Unidade" /></SelectTrigger> <SelectContent>{PRESSURE_UNITS.map(unit => ( <SelectItem key={unit} value={unit}>{unit}</SelectItem> ))}</SelectContent> </Select> </div> </div> )} <Button variant="outline" size="sm" onClick={() => handleUpdate('showObservation', !category.showObservation, undefined)} className="text-muted-foreground hover:text-foreground">{category.showObservation ? <EyeOff className="mr-2 h-5 w-5" /> : <Eye className="mr-2 h-5 w-5" />} {category.showObservation ? 'Esconder' : 'Mostrar'} Obs.</Button> {category.showObservation && ( <Textarea value={category.observation} onChange={(e) => handleUpdate('observation', e.target.value, undefined)} placeholder={`Observações para ${category.title}...`} className="mt-1"/> )} </div> )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export const InspectionCategoryItem = React.memo(InspectionCategoryItemComponent);
