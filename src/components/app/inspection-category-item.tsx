
import * as React from 'react';
import { useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import type { InspectionCategoryState, StatusOption, CategoryUpdatePayload } from '@/lib/types';
import { PRESSURE_UNITS, STATUS_OPTIONS } from '@/constants/inspection.config';
import { cn } from '@/lib/utils';

type CategoryOverallStatus = 'completed' | 'incomplete' | 'pending' | 'not-applicable';

interface InspectionCategoryItemProps {
  category: InspectionCategoryState;
  onCategoryItemUpdate: (categoryId: string, update: CategoryUpdatePayload) => void;
  overallStatus: CategoryOverallStatus;
}

const InspectionCategoryItemComponent = ({ category, onCategoryItemUpdate, overallStatus }: InspectionCategoryItemProps) => {

  const handleUpdate = useCallback((field: CategoryUpdatePayload['field'], value: any, subItemId?: string) => {
    let payload: CategoryUpdatePayload;
    if (subItemId) {
      if (field === 'subItemStatus') {
        payload = { field, subItemId, value: value as StatusOption | undefined };
      } else if (field === 'subItemObservation') {
        payload = { field, subItemId, value: value as string };
      } else if (field === 'subItemShowObservation') {
        payload = { field, subItemId, value: value as boolean };
      } else {
        return;
      }
    } else {
      if (field === 'status') {
        payload = { field, value: value as StatusOption | undefined };
      } else {
         payload = { field, value } as CategoryUpdatePayload;
      }
    }
    onCategoryItemUpdate(category.id, payload);
  }, [category.id, onCategoryItemUpdate]);


  const handleAccordionValueChange = useCallback((openItemId: string) => {
    const newIsExpanded = openItemId === category.id;
    if (newIsExpanded !== category.isExpanded) {
      handleUpdate('isExpanded', newIsExpanded);
    }
  }, [category.id, category.isExpanded, handleUpdate]);

  const getStatusLabelColor = (option: StatusOption): string => {
    switch (option) {
      case 'OK':
        return "text-green-600 dark:text-green-400";
      case 'N/C':
        return "text-red-600 dark:text-red-400";
      case 'N/A':
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "";
    }
  };

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
            {overallStatus === 'completed' && (
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-600 dark:text-green-400 flex-shrink-0" />
            )}
            {overallStatus === 'incomplete' && (
              <XCircle className="h-5 w-5 mr-2 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <h3 className="text-lg font-semibold font-headline text-left flex-1">{category.title}</h3>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pt-0 pb-4 space-y-1">
          {category.type === 'standard' && category.subItems?.map((subItem) => (
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
                <div className="mt-1 sm:ml-[calc(33%+0.5rem)]"> 
                  <Textarea
                    value={subItem.observation}
                    onChange={(e) => handleUpdate('subItemObservation', e.target.value, subItem.id)}
                    placeholder="Observações do subitem..."
                    className="w-full"
                  />
                </div>
              )}
            </div>
          ))}

          {category.type === 'special' && (
            <div className="py-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                <span className="font-medium text-base flex-grow break-words min-w-0 sm:w-auto">{category.title} Status</span> 
                 <div className="flex items-center gap-x-2 sm:gap-x-3 flex-shrink-0">
                  <RadioGroup
                    value={category.status || ''}
                    onValueChange={(value) => handleUpdate('status', value as StatusOption)}
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
                    onClick={() => handleUpdate('showObservation', !category.showObservation)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    {category.showObservation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{category.showObservation ? 'Esconder' : 'Mostrar'} Observação</span>
                  </Button>
                </div>
              </div>
              {category.showObservation && (
                 <div className="mt-1 sm:ml-[calc(33%+0.5rem)]">
                  <Textarea
                    value={category.observation}
                    onChange={(e) => handleUpdate('observation', e.target.value)}
                    placeholder={`Observações para ${category.title}...`}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          {category.type === 'pressure' && (
            <div className="py-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <Label htmlFor={`${category.id}-pressureValue`}>Pressão</Label>
                  <Input
                    id={`${category.id}-pressureValue`}
                    type="text" 
                    value={category.pressureValue || ''}
                    onChange={(e) => handleUpdate('pressureValue', e.target.value)}
                    placeholder="Ex: 7.5"
                  />
                </div>
                <div>
                  <Label htmlFor={`${category.id}-pressureUnit`}>Unidade</Label>
                  <Select
                    value={category.pressureUnit || ''}
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleUpdate('showObservation', !category.showObservation)} 
                className="text-muted-foreground hover:text-foreground"
              >
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
};

export const InspectionCategoryItem = React.memo(InspectionCategoryItemComponent);

