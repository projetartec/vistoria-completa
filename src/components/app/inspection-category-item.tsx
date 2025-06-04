import type React from 'react';
import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import type { InspectionCategoryState, SubItemState, StatusOption } from '@/lib/types';
import { PRESSURE_UNITS, STATUS_OPTIONS } from '@/constants/inspection.config';

interface InspectionCategoryItemProps {
  category: InspectionCategoryState;
  onCategoryChange: (updatedCategory: InspectionCategoryState) => void;
}

export function InspectionCategoryItem({ category, onCategoryChange }: InspectionCategoryItemProps) {
  const [isContentVisible, setIsContentVisible] = useState(true);

  const handleSubItemChange = (subItemId: string, field: keyof SubItemState, value: any) => {
    const updatedSubItems = category.subItems?.map(sub =>
      sub.id === subItemId ? { ...sub, [field]: value } : sub
    );
    onCategoryChange({ ...category, subItems: updatedSubItems });
  };

  const handleSpecialItemChange = (field: keyof InspectionCategoryState, value: any) => {
    onCategoryChange({ ...category, [field]: value });
  };

  const toggleObservation = (subItemId: string) => {
     handleSubItemChange(subItemId, 'showObservation', !category.subItems?.find(s => s.id === subItemId)?.showObservation);
  };

  const toggleSpecialObservation = () => {
    handleSpecialItemChange('showObservation', !category.showObservation);
  };

  return (
    <Accordion type="single" collapsible defaultValue={category.isExpanded ? category.id : undefined} className="mb-4 bg-card shadow-md rounded-lg">
      <AccordionItem value={category.id} className="border-b-0">
        <AccordionTrigger
          className="px-4 py-3 hover:no-underline"
          onClick={() => onCategoryChange({ ...category, isExpanded: !category.isExpanded })}
        >
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-semibold font-headline">{category.title}</h3>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setIsContentVisible(!isContentVisible); }}>
              {isContentVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              <span className="sr-only">{isContentVisible ? 'Esconder' : 'Mostrar'} Conteúdo</span>
            </Button>
          </div>
        </AccordionTrigger>
        <AccordionContent className={`px-4 pt-0 pb-4 ${!isContentVisible ? 'hidden' : ''}`}>
          {category.type === 'standard' && category.subItems?.map((subItem) => (
            <div key={subItem.id} className="py-3 border-b last:border-b-0">
              <Label className="font-medium">{subItem.name}</Label>
              <RadioGroup
                value={subItem.status}
                onValueChange={(value) => handleSubItemChange(subItem.id, 'status', value as StatusOption)}
                className="flex space-x-4 mt-2 mb-2"
              >
                {STATUS_OPTIONS.map(opt => (
                  <div key={opt} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt} id={`${category.id}-${subItem.id}-${opt}`} />
                    <Label htmlFor={`${category.id}-${subItem.id}-${opt}`}>{opt || 'Nenhum'}</Label>
                  </div>
                ))}
              </RadioGroup>
              <Button variant="outline" size="sm" onClick={() => toggleObservation(subItem.id)} className="mb-2">
                {subItem.showObservation ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {subItem.showObservation ? 'Esconder' : 'Mostrar'} Observação
              </Button>
              {subItem.showObservation && (
                <Textarea
                  value={subItem.observation}
                  onChange={(e) => handleSubItemChange(subItem.id, 'observation', e.target.value)}
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
                onValueChange={(value) => handleSpecialItemChange('status', value as StatusOption)}
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
                  onChange={(e) => handleSpecialItemChange('observation', e.target.value)}
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
                  type="text" // Using text to allow for decimal points flexibly
                  value={category.pressureValue}
                  onChange={(e) => handleSpecialItemChange('pressureValue', e.target.value)}
                  placeholder="Ex: 7.5"
                />
              </div>
              <div>
                <Label htmlFor={`${category.id}-pressureUnit`}>Unidade</Label>
                <Select
                  value={category.pressureUnit}
                  onValueChange={(value) => handleSpecialItemChange('pressureUnit', value)}
                >
                  <SelectTrigger id={`${category.id}-pressureUnit`}>
                    <SelectValue placeholder="Selecione Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESSURE_UNITS.map(unit => (
                      <SelectItem key={unit} value={unit || ''}>{unit || 'Nenhuma'}</SelectItem>
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
