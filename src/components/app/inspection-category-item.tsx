import type React from 'react';
import { useState, useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import type { InspectionCategoryState, SubItemState, StatusOption, CategoryUpdatePayload } from '@/lib/types';
import { PRESSURE_UNITS, STATUS_OPTIONS } from '@/constants/inspection.config';

interface InspectionCategoryItemProps {
  category: InspectionCategoryState;
  onCategoryItemUpdate: (categoryId: string, update: CategoryUpdatePayload) => void;
}

export function InspectionCategoryItem({ category, onCategoryItemUpdate }: InspectionCategoryItemProps) {
  const [isContentVisible, setIsContentVisible] = useState(true);

  const handleAccordionToggle = useCallback(() => {
    onCategoryItemUpdate(category.id, { field: 'isExpanded', value: !category.isExpanded });
  }, [category.id, category.isExpanded, onCategoryItemUpdate]);

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

  const handleVisibilityToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setIsContentVisible(prev => !prev);
  };

  return (
    <Accordion type="single" collapsible defaultValue={category.isExpanded ? category.id : undefined} className="mb-4 bg-card shadow-md rounded-lg">
      <AccordionItem value={category.id} className="border-b-0">
        <AccordionTrigger
          className="px-4 py-3 hover:no-underline"
        >
          <div className="flex justify-between items-center w-full" onClick={handleAccordionToggle}>
            <h3 className="text-lg font-semibold font-headline">{category.title}</h3>
            <Button
              asChild
              variant="ghost"
              size="sm"
              onClick={handleVisibilityToggle}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleVisibilityToggle(e);
                }
              }}
              aria-label={isContentVisible ? 'Esconder Conteúdo' : 'Mostrar Conteúdo'}
              className="p-1 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div role="button" tabIndex={0}>
                {isContentVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </Button>
          </div>
        </AccordionTrigger>
        <AccordionContent className={`px-4 pt-0 pb-4 ${!isContentVisible ? 'hidden' : ''}`}>
          {category.type === 'standard' && category.subItems?.map((subItem) => (
            <div key={subItem.id} className="py-3 border-b last:border-b-0">
              <Label className="font-medium">{subItem.name}</Label>
              <RadioGroup
                value={subItem.status}
                onValueChange={(value) => handleSubItemStatusChange(subItem.id, value as StatusOption)}
                className="flex space-x-4 mt-2 mb-2"
              >
                {STATUS_OPTIONS.map(opt => (
                  <div key={opt} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt} id={`${category.id}-${subItem.id}-${opt}`} />
                    <Label htmlFor={`${category.id}-${subItem.id}-${opt}`}>{opt || 'Nenhum'}</Label>
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
                className="flex space-x-4 mt-2 mb-2"
              >
                {STATUS_OPTIONS.map(opt => (
                  <div key={opt} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt} id={`${category.id}-${opt}`} />
                    <Label htmlFor={`${category.id}-${opt}`}>{opt || 'Nenhum'}</Label>
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
