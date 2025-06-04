
import * as React from 'react';
import { useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff } from 'lucide-react';
import type { InspectionCategoryState, StatusOption, CategoryUpdatePayload } from '@/lib/types';
import { PRESSURE_UNITS, STATUS_OPTIONS } from '@/constants/inspection.config';

interface InspectionCategoryItemProps {
  category: InspectionCategoryState;
  onCategoryItemUpdate: (categoryId: string, update: CategoryUpdatePayload) => void;
}

export function InspectionCategoryItem({ category, onCategoryItemUpdate }: InspectionCategoryItemProps) {

  const handleUpdate = useCallback((field: CategoryUpdatePayload['field'], value: any, subItemId?: string) => {
    const payload: CategoryUpdatePayload = subItemId 
      ? { field, subItemId, value } as CategoryUpdatePayload // This needs careful typing based on field
      : { field, value } as CategoryUpdatePayload;
    
    // More type safety for subItem specific payloads
    if (field === 'subItemStatus' && subItemId) {
      onCategoryItemUpdate(category.id, { field, subItemId, value: value as StatusOption });
    } else if (field === 'subItemObservation' && subItemId) {
      onCategoryItemUpdate(category.id, { field, subItemId, value: value as string });
    } else if (field === 'subItemShowObservation' && subItemId) {
      onCategoryItemUpdate(category.id, { field, subItemId, value: value as boolean });
    } else {
      onCategoryItemUpdate(category.id, payload);
    }
  }, [category.id, onCategoryItemUpdate]);


  const handleAccordionValueChange = useCallback((openItemId: string) => {
    // openItemId will be category.id if opening, or "" if closing (for single collapsible)
    const newIsExpanded = openItemId === category.id;
    if (newIsExpanded !== category.isExpanded) {
      handleUpdate('isExpanded', newIsExpanded);
    }
  }, [category.id, category.isExpanded, handleUpdate]);

  return (
    <Accordion
      type="single"
      collapsible
      value={category.isExpanded ? category.id : ""} // Controlled by isExpanded
      onValueChange={handleAccordionValueChange}
      className="mb-4 bg-card shadow-md rounded-lg"
    >
      <AccordionItem value={category.id} className="border-b-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <h3 className="text-lg font-semibold font-headline text-left flex-1">{category.title}</h3>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-0 pb-4 space-y-4">
          {/* Standard items with sub-items */}
          {category.type === 'standard' && category.subItems?.map((subItem) => (
            <div key={subItem.id} className="py-3 border-t first:border-t-0">
              <Label className="font-medium text-base">{subItem.name}</Label>
              <RadioGroup
                value={subItem.status}
                onValueChange={(value) => handleUpdate('subItemStatus', value as StatusOption, subItem.id)}
                className="flex items-center space-x-2 mt-2 mb-2"
              >
                {STATUS_OPTIONS.map(opt => (
                  <div key={`${subItem.id}-${opt}`} className="flex items-center space-x-1">
                    <RadioGroupItem value={opt} id={`${subItem.id}-${opt}-rg-item`} />
                    <Label htmlFor={`${subItem.id}-${opt}-rg-item`} className="cursor-pointer font-normal">
                      {opt === 'NONE' ? 'Nenhum' : opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdate('subItemShowObservation', !subItem.showObservation, subItem.id)}
                className="mb-2"
              >
                {subItem.showObservation ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {subItem.showObservation ? 'Esconder' : 'Mostrar'} Observação
              </Button>
              {subItem.showObservation && (
                <Textarea
                  value={subItem.observation}
                  onChange={(e) => handleUpdate('subItemObservation', e.target.value, subItem.id)}
                  placeholder="Observações do subitem..."
                  className="mt-1"
                />
              )}
            </div>
          ))}

          {/* Special items (direct status and observation) */}
          {category.type === 'special' && (
            <div className="py-3">
              <Label className="font-medium text-base">Status Geral</Label>
              <RadioGroup
                value={category.status}
                onValueChange={(value) => handleUpdate('status', value as StatusOption)}
                className="flex items-center space-x-2 mt-2 mb-2"
              >
                {STATUS_OPTIONS.map(opt => (
                  <div key={`${category.id}-${opt}`} className="flex items-center space-x-1">
                    <RadioGroupItem value={opt} id={`${category.id}-${opt}-rg-item`} />
                    <Label htmlFor={`${category.id}-${opt}-rg-item`} className="cursor-pointer font-normal">
                      {opt === 'NONE' ? 'Nenhum' : opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button variant="outline" size="sm" onClick={() => handleUpdate('showObservation', !category.showObservation)} className="mb-2">
                {category.showObservation ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {category.showObservation ? 'Esconder' : 'Mostrar'} Observação
              </Button>
              {category.showObservation && (
                <Textarea
                  value={category.observation}
                  onChange={(e) => handleUpdate('observation', e.target.value)}
                  placeholder={`Observações para ${category.title}...`}
                  className="mt-1"
                />
              )}
            </div>
          )}

          {/* Pressure items */}
          {category.type === 'pressure' && (
            <div className="py-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <Label htmlFor={`${category.id}-pressureValue`}>Pressão</Label>
                  <Input
                    id={`${category.id}-pressureValue`}
                    type="text" // Using text to allow for decimal values or ranges if needed
                    value={category.pressureValue}
                    onChange={(e) => handleUpdate('pressureValue', e.target.value)}
                    placeholder="Ex: 7.5"
                  />
                </div>
                <div>
                  <Label htmlFor={`${category.id}-pressureUnit`}>Unidade</Label>
                  <Select
                    value={category.pressureUnit || ''} // Ensure value is not undefined for Select
                    onValueChange={(value) => handleUpdate('pressureUnit', value as InspectionCategoryState['pressureUnit'])}
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
              <Button variant="outline" size="sm" onClick={() => handleUpdate('showObservation', !category.showObservation)} className="mb-2">
                {category.showObservation ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {category.showObservation ? 'Esconder' : 'Mostrar'} Observação
              </Button>
              {category.showObservation && (
                <Textarea
                  value={category.observation}
                  onChange={(e) => handleUpdate('observation', e.target.value)}
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
}
