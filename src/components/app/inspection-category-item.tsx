
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
  const handleSubItemStatusChange = useCallback((subItemId: string, newStatus: StatusOption) => {
    onCategoryItemUpdate(category.id, { field: 'subItemStatus', subItemId, value: newStatus });
  }, [category.id, onCategoryItemUpdate]);

  const handleSubItemObservationChange = useCallback((subItemId: string, observation: string) => {
    onCategoryItemUpdate(category.id, { field: 'subItemObservation', subItemId, value: observation });
  }, [category.id, onCategoryItemUpdate]);

  const toggleSubItemObservation = useCallback((subItemId: string, currentShowState: boolean) => {
    onCategoryItemUpdate(category.id, { field: 'subItemShowObservation', subItemId, value: !currentShowState });
  }, [category.id, onCategoryItemUpdate]);

  const handleSpecialStatusChange = useCallback((newStatus: StatusOption) => {
    onCategoryItemUpdate(category.id, { field: 'status', value: newStatus });
  }, [category.id, onCategoryItemUpdate]);

  const handleSpecialObservationChange = useCallback((observation: string) => {
    onCategoryItemUpdate(category.id, { field: 'observation', value: observation });
  }, [category.id, onCategoryItemUpdate]);

  const toggleSpecialObservation = useCallback(() => {
    onCategoryItemUpdate(category.id, { field: 'showObservation', value: !category.showObservation });
  }, [category.id, category.showObservation, onCategoryItemUpdate]);
  
  const handlePressureValueChange = useCallback((value: string) => {
    onCategoryItemUpdate(category.id, { field: 'pressureValue', value });
  }, [category.id, onCategoryItemUpdate]);

  const handlePressureUnitChange = useCallback((value: string) => {
    onCategoryItemUpdate(category.id, { field: 'pressureUnit', value });
  }, [category.id, onCategoryItemUpdate]);

  const handleAccordionValueChange = useCallback((openItemId: string) => {
    const newIsExpanded = openItemId === category.id;
    if (newIsExpanded !== category.isExpanded) {
      onCategoryItemUpdate(category.id, { field: 'isExpanded', value: newIsExpanded });
    }
  }, [category.id, category.isExpanded, onCategoryItemUpdate]);

  return (
    <Accordion 
      type="single" 
      collapsible 
      value={category.isExpanded ? category.id : ""}
      onValueChange={handleAccordionValueChange}
      className="mb-4 bg-card shadow-md rounded-lg"
    >
      <AccordionItem value={category.id} className="border-b-0">
        <AccordionTrigger
          className="px-4 py-3 hover:no-underline"
        >
          <h3 className="text-lg font-semibold font-headline text-left flex-1">{category.title}</h3>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-0 pb-4">
          {category.type === 'standard' && category.subItems?.map((subItem) => (
             <div key={subItem.id} className="py-3 border-b last:border-b-0">
              <Label className="font-medium">{subItem.name}</Label>
              <RadioGroup
                value={subItem.status}
                onValueChange={(value) => handleSubItemStatusChange(subItem.id, value as StatusOption)}
                className="flex items-center space-x-2 mt-2 mb-2"
              >
                {STATUS_OPTIONS.map(opt => (
                  <div key={`${category.id}-${subItem.id}-${opt}`} className="flex items-center space-x-1">
                    <RadioGroupItem value={opt} id={`${category.id}-${subItem.id}-${opt}`} />
                    <Label htmlFor={`${category.id}-${subItem.id}-${opt}`} className="mr-2 last:mr-0 cursor-pointer">{opt || 'Nenhum'}</Label>
                  </div>
                ))}
              </RadioGroup>
              <Button variant="outline" size="sm" onClick={() => toggleSubItemObservation(subItem.id, subItem.showObservation)} className="mb-2">
                {subItem.showObservation ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {subItem.showObservation ? 'Esconder' : 'Mostrar'} Observação
              </Button>
              {subItem.showObservation && (
                <Textarea
                  value={subItem.observation}
                  onChange={(e) => handleSubItemObservationChange(subItem.id, e.target.value)}
                  placeholder="Observações..."
                  className="mt-1"
                />
              )}
            </div>
          ))}

          {category.type === 'special' && (
            <div className="py-3">
              <RadioGroup
                value={category.status}
                onValueChange={(value) => handleSpecialStatusChange(value as StatusOption)}
                className="flex items-center space-x-2 mt-2 mb-2"
              >
                {STATUS_OPTIONS.map(opt => (
                   <div key={`${category.id}-${opt}`} className="flex items-center space-x-1">
                    <RadioGroupItem value={opt} id={`${category.id}-${opt}`} />
                    <Label htmlFor={`${category.id}-${opt}`} className="mr-2 last:mr-0 cursor-pointer">{opt || 'Nenhum'}</Label>
                  </div>
                ))}
              </RadioGroup>
              <Button variant="outline" size="sm" onClick={toggleSpecialObservation} className="mb-2">
                {category.showObservation ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {category.showObservation ? 'Esconder' : 'Mostrar'} Observação
              </Button>
              {category.showObservation && (
                <Textarea
                  value={category.observation}
                  onChange={(e) => handleSpecialObservationChange(e.target.value)}
                  placeholder="Observações..."
                  className="mt-1"
                />
              )}
            </div>
          )}

          {category.type === 'pressure' && (
            <div className="py-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <Label htmlFor={`${category.id}-pressureValue`}>Pressão</Label>
                <Input
                  id={`${category.id}-pressureValue`}
                  type="text" 
                  value={category.pressureValue}
                  onChange={(e) => handlePressureValueChange(e.target.value)}
                  placeholder="Ex: 7.5"
                />
              </div>
              <div>
                <Label htmlFor={`${category.id}-pressureUnit`}>Unidade</Label>
                <Select
                  value={category.pressureUnit}
                  onValueChange={(value) => handlePressureUnitChange(value)}
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
