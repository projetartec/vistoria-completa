
import * as React from 'react';
import { useCallback, useState, useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff, CheckCircle2, XCircle, PlusCircle, Trash2, ListX } from 'lucide-react';
import type { InspectionCategoryState, StatusOption, CategoryUpdatePayload, CategoryOverallStatus, SubItemState, RegisteredExtinguisher, ExtinguisherTypeOption, ExtinguisherWeightOption, RegisteredHose, HoseLengthOption, HoseDiameterOption, HoseTypeOption } from '@/lib/types';
import { PRESSURE_UNITS, STATUS_OPTIONS, EXTINGUISHER_TYPES, EXTINGUISHER_WEIGHTS, HOSE_LENGTHS, HOSE_DIAMETERS, HOSE_TYPES } from '@/constants/inspection.config';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';


interface InspectionCategoryItemProps {
  category: InspectionCategoryState;
  onCategoryItemUpdate: (categoryId: string, update: CategoryUpdatePayload) => void;
  overallStatus: CategoryOverallStatus;
}

const ExtinguisherRegistrySubItem: React.FC<{
  subItem: SubItemState;
  onUpdate: (update: CategoryUpdatePayload) => void;
}> = ({ subItem, onUpdate }) => {
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
};

const HoseRegistrySubItem: React.FC<{
  subItem: SubItemState;
  onUpdate: (update: CategoryUpdatePayload) => void;
}> = ({ subItem, onUpdate }) => {
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
};


const InspectionCategoryItemComponent = ({ category, onCategoryItemUpdate, overallStatus }: InspectionCategoryItemProps) => {

  const handleUpdate = useCallback((field: CategoryUpdatePayload['field'], value?: any, subItemId?: string, itemId?: string) => {
    let payload: CategoryUpdatePayload;
    if (field === 'markAllSubItemsNA') {
      payload = { field };
    } else if (subItemId) {
      if (field === 'subItemStatus') payload = { field, subItemId, value: value as StatusOption | undefined };
      else if (field === 'subItemObservation') payload = { field, subItemId, value: value as string };
      else if (field === 'subItemShowObservation') payload = { field, subItemId, value: value as boolean };
      else if (field === 'addRegisteredExtinguisher') payload = { field, subItemId, value: value as Omit<RegisteredExtinguisher, 'id'> };
      else if (field === 'removeRegisteredExtinguisher' && itemId) payload = { field, subItemId, extinguisherId: itemId };
      else if (field === 'addRegisteredHose') payload = { field, subItemId, value: value as Omit<RegisteredHose, 'id'> };
      else if (field === 'removeRegisteredHose' && itemId) payload = { field, subItemId, hoseId: itemId };
      else return;
    } else {
      if (field === 'status') payload = { field, value: value as StatusOption | undefined };
      else payload = { field, value } as CategoryUpdatePayload; // Cast for other direct category updates
    }
    onCategoryItemUpdate(category.id, payload);
  }, [category.id, onCategoryItemUpdate]);


  const handleAccordionValueChange = useCallback((openItemId: string) => {
    const newIsExpanded = openItemId === category.id;
    if (newIsExpanded !== category.isExpanded) {
      handleUpdate('isExpanded', newIsExpanded, undefined);
    }
  }, [category.id, category.isExpanded, handleUpdate]);

  const getStatusLabelColor = (option: StatusOption): string => {
    switch (option) {
      case 'OK': return "text-green-600 dark:text-green-400";
      case 'N/C': return "text-red-600 dark:text-red-400";
      case 'N/A': return "text-yellow-600 dark:text-yellow-400";
      default: return "";
    }
  };

  const hasNonRegistrySubItems = useMemo(() => {
    return category.type === 'standard' && category.subItems && category.subItems.some(sub => !sub.isRegistry);
  }, [category.subItems, category.type]);

  return (
    <Accordion
      type="single"
      collapsible
      value={category.isExpanded ? category.id : ""}
      onValueChange={handleAccordionValueChange}
      className="mb-4 bg-card shadow-md rounded-lg"
    >
      <AccordionItem value={category.id} className="border-b-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center flex-1">
            {overallStatus === 'all-items-selected' ? (
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 mr-2 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <h3 className="text-lg font-semibold font-headline text-left flex-1">{category.title}</h3>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-0 pb-4 space-y-1">
          {category.type === 'standard' && hasNonRegistrySubItems && (
            <div className="mb-3 mt-1 flex justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdate('markAllSubItemsNA')}
                className="text-yellow-600 border-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-700"
              >
                <ListX className="mr-2 h-4 w-4" /> Marcar Todos N/A
              </Button>
            </div>
          )}

          {category.type === 'standard' && category.subItems?.map((subItem) => {
            if (subItem.isRegistry) {
              if (subItem.id === 'extintor_cadastro') {
                return (
                  <ExtinguisherRegistrySubItem
                    key={subItem.id}
                    subItem={subItem}
                    onUpdate={(updatePayload) => onCategoryItemUpdate(category.id, updatePayload)}
                  />
                );
              } else if (subItem.id === 'hidrantes_cadastro_mangueiras') {
                return (
                  <HoseRegistrySubItem
                    key={subItem.id}
                    subItem={subItem}
                    onUpdate={(updatePayload) => onCategoryItemUpdate(category.id, updatePayload)}
                  />
                );
              }
              return null;
            }
            return (
              <div key={subItem.id} className="py-2 border-t first:border-t-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                  <Label className="font-medium text-base flex-grow break-words min-w-0 sm:w-auto">{subItem.name}</Label>
                  <div className="flex items-center gap-x-2 sm:gap-x-3 flex-shrink-0">
                    <RadioGroup
                      value={subItem.status || ''}
                      onValueChange={(value) => handleUpdate('subItemStatus', value as StatusOption, subItem.id)}
                      className="flex items-center space-x-2"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <div key={`${subItem.id}-${opt}`} className="flex items-center space-x-1">
                          <RadioGroupItem value={opt} id={`${subItem.id}-${opt}-rg-item`} />
                          <Label
                            htmlFor={`${subItem.id}-${opt}-rg-item`}
                            className={cn("cursor-pointer font-normal", getStatusLabelColor(opt))}
                          >
                            {opt}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUpdate('subItemShowObservation', !subItem.showObservation, subItem.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      {subItem.showObservation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{subItem.showObservation ? 'Esconder' : 'Mostrar'} Observação</span>
                    </Button>
                  </div>
                </div>
                {subItem.showObservation && (
                  <div className="mt-1 sm:ml-[calc(33%+0.5rem)]"> {/* Ajuste para alinhar com os inputs de RadioGroup */}
                    <Textarea
                      value={subItem.observation}
                      onChange={(e) => handleUpdate('subItemObservation', e.target.value, subItem.id)}
                      placeholder="Observações do subitem..."
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            );
          })}

          {category.type === 'special' && (
            <div className="py-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                <span className="font-medium text-base flex-grow break-words min-w-0 sm:w-auto">{category.title} Status</span>
                 <div className="flex items-center gap-x-2 sm:gap-x-3 flex-shrink-0">
                  <RadioGroup
                    value={category.status || ''}
                    onValueChange={(value) => handleUpdate('status', value as StatusOption, undefined)}
                    className="flex items-center space-x-2"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <div key={`${category.id}-${opt}`} className="flex items-center space-x-1">
                        <RadioGroupItem value={opt} id={`${category.id}-${opt}-rg-item`} />
                        <Label
                          htmlFor={`${category.id}-${opt}-rg-item`}
                          className={cn("cursor-pointer font-normal", getStatusLabelColor(opt))}
                        >
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUpdate('showObservation', !category.showObservation, undefined)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    {category.showObservation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{category.showObservation ? 'Esconder' : 'Mostrar'} Observação</span>
                  </Button>
                </div>
              </div>
              {category.showObservation && (
                 <div className="mt-1 sm:ml-[calc(33%+0.5rem)]"> {/* Ajuste para alinhar */}
                  <Textarea
                    value={category.observation}
                    onChange={(e) => handleUpdate('observation', e.target.value, undefined)}
                    placeholder={`Observações para ${category.title}...`}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          {category.type === 'pressure' && (
            <div className="py-3 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <span className="font-medium text-base flex-grow break-words min-w-0 sm:w-auto">{category.title} Status</span>
                 <div className="flex items-center gap-x-2 sm:gap-x-3 flex-shrink-0">
                  <RadioGroup
                    value={category.status || ''}
                    onValueChange={(value) => handleUpdate('status', value as StatusOption, undefined)}
                    className="flex items-center space-x-2"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <div key={`${category.id}-${opt}-pressure`} className="flex items-center space-x-1">
                        <RadioGroupItem value={opt} id={`${category.id}-${opt}-pressure-rg-item`} />
                        <Label
                          htmlFor={`${category.id}-${opt}-pressure-rg-item`}
                          className={cn("cursor-pointer font-normal", getStatusLabelColor(opt))}
                        >
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {category.status !== 'N/A' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <Label htmlFor={`${category.id}-pressureValue`}>Pressão</Label>
                    <Input
                      id={`${category.id}-pressureValue`}
                      type="text"
                      value={category.pressureValue || ''}
                      onChange={(e) => handleUpdate('pressureValue', e.target.value, undefined)}
                      placeholder="Ex: 7.5"
                      disabled={category.status === 'N/A'}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${category.id}-pressureUnit`}>Unidade</Label>
                    <Select
                      value={category.pressureUnit || ''}
                      onValueChange={(value) => handleUpdate('pressureUnit', value as InspectionCategoryState['pressureUnit'], undefined)}
                      disabled={category.status === 'N/A'}
                    >
                      <SelectTrigger id={`${category.id}-pressureUnit`}>
                        <SelectValue placeholder="Selecione Unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRESSURE_UNITS.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdate('showObservation', !category.showObservation, undefined)}
                className="text-muted-foreground hover:text-foreground"
              >
                {category.showObservation ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {category.showObservation ? 'Esconder' : 'Mostrar'} Observação
              </Button>
              {category.showObservation && (
                <Textarea
                  value={category.observation}
                  onChange={(e) => handleUpdate('observation', e.target.value, undefined)}
                  placeholder={`Observações para ${category.title}...`}
                  className="mt-1"
                />
              )}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export const InspectionCategoryItem = React.memo(InspectionCategoryItemComponent);
