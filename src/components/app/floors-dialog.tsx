'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InspectionCategoryItem } from './inspection-category-item';
import { getCategoryOverallStatus } from '@/lib/inspection-helpers';
import type { TowerData, FloorData, CategoryUpdatePayload } from '@/lib/types';
import { Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloorsDialogProps {
  tower: TowerData;
  towerIndex: number;
  onOpenChange: (open: boolean) => void;
  onFloorChange: (towerIndex: number, floorIndex: number, field: keyof Pick<FloorData, 'floor'>, value: string) => void;
  onCategoryUpdate: (towerIndex: number, floorIndex: number, categoryId: string, update: CategoryUpdatePayload) => void;
  onAddFloor: () => void;
  onRemoveFloor: (floorIndex: number) => void;
  onToggleFloorCategories: (floorIndex: number) => void;
  onToggleFloorContent: (floorIndex: number) => void;
  isMobile: boolean;
}

export function FloorsDialog({
  tower,
  towerIndex,
  onOpenChange,
  onFloorChange,
  onCategoryUpdate,
  onAddFloor,
  onRemoveFloor,
  onToggleFloorCategories,
  onToggleFloorContent,
  isMobile,
}: FloorsDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Andares da Torre: {tower.towerName || `Torre ${towerIndex + 1}`}</DialogTitle>
          <DialogDescription>Gerencie os andares e seus checklists para esta torre.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-4 py-4">
            {(Array.isArray(tower.floors) ? tower.floors : []).map((floorData, floorIndex) => {
              const areAnyCategoriesExpanded = floorData.categories.some((cat) => cat.isExpanded);
              return (
                <Card key={floorData.id} className="mb-6 shadow-sm">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex flex-row items-center gap-x-2 mb-2">
                      <Label htmlFor={`floorName-${floorData.id}`} className="text-sm font-medium whitespace-nowrap">
                        ANDAR:
                      </Label>
                      <Input
                        id={`floorName-${floorData.id}`}
                        value={floorData.floor}
                        onChange={(e) => onFloorChange(towerIndex, floorIndex, 'floor', e.target.value)}
                        placeholder="Ex: Térreo, 1A"
                        className="w-[150px] h-9 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onToggleFloorCategories(floorIndex)}
                        title={areAnyCategoriesExpanded ? 'Recolher itens do andar' : 'Expandir itens do andar'}
                        className={cn(
                          'rounded-full h-9 w-9',
                          areAnyCategoriesExpanded
                            ? 'border-red-500 text-red-600 hover:bg-red-500/10 hover:text-red-700'
                            : 'border-green-500 text-green-600 hover:bg-green-500/10 hover:text-green-700'
                        )}
                      >
                        {areAnyCategoriesExpanded ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onToggleFloorContent(floorIndex)}
                        title={floorData.isFloorContentVisible ? 'Ocultar conteúdo do andar' : 'Mostrar conteúdo do andar'}
                        className={cn(
                          'rounded-full h-9 w-9',
                          floorData.isFloorContentVisible
                            ? 'border-red-500 text-red-600 hover:bg-red-500/10 hover:text-red-700'
                            : 'border-green-500 text-green-600 hover:bg-green-500/10 hover:text-green-700'
                        )}
                      >
                        {floorData.isFloorContentVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                      {(Array.isArray(tower.floors) ? tower.floors : []).length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveFloor(floorIndex)}
                          className="text-destructive hover:bg-destructive/10 h-9 w-9"
                          title="Remover este andar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                    {floorData.isFloorContentVisible && (
                      <>
                        {floorData.categories.map((category) => {
                          const overallStatus = getCategoryOverallStatus(category);
                          return (
                            <InspectionCategoryItem
                              key={`${floorData.id}-${category.id}`}
                              category={category}
                              overallStatus={overallStatus}
                              onCategoryItemUpdate={(catId, update) => onCategoryUpdate(towerIndex, floorIndex, catId, update)}
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
          </div>
        </ScrollArea>
        <DialogFooter className="pt-4 border-t">
          <Button onClick={onAddFloor} variant="outline" size="sm" className="rounded-full border-green-500 text-green-600 hover:bg-green-500/10">
            <Plus className="mr-1 h-4 w-4" /> Adicionar Andar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
