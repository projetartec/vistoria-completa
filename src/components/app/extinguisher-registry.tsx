import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle } from 'lucide-react';
import type { ExtinguisherEntry } from '@/lib/types';
import { EXTINGUISHER_TYPE_OPTIONS, EXTINGUISHER_WEIGHT_OPTIONS } from '@/constants/inspection.config';

interface ExtinguisherRegistryProps {
  extinguishers: ExtinguisherEntry[];
  onExtinguishersChange: (updatedExtinguishers: ExtinguisherEntry[]) => void;
}

export function ExtinguisherRegistry({ extinguishers, onExtinguishersChange }: ExtinguisherRegistryProps) {
  const addExtinguisher = () => {
    const newExtinguisher: ExtinguisherEntry = {
      id: Date.now().toString(), // Simple unique ID
      quantity: '1',
      type: '',
      weight: '',
    };
    onExtinguishersChange([...extinguishers, newExtinguisher]);
  };

  const updateExtinguisher = (id: string, field: keyof ExtinguisherEntry, value: string) => {
    onExtinguishersChange(extinguishers.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeExtinguisher = (id: string) => {
    onExtinguishersChange(extinguishers.filter(e => e.id !== id));
  };

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-xl">Cadastro de Extintores</CardTitle>
        <Button onClick={addExtinguisher} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Extintor
        </Button>
      </CardHeader>
      <CardContent>
        {extinguishers.length === 0 && <p className="text-muted-foreground">Nenhum extintor registrado.</p>}
        {extinguishers.map((extinguisher, index) => (
          <div key={extinguisher.id} className="mb-4 p-4 border rounded-md relative bg-background shadow">
            <h4 className="font-medium mb-2 text-primary">Extintor {index + 1}</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeExtinguisher(extinguisher.id)}
              className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
              aria-label="Remover Extintor"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`extinguisher-quantity-${extinguisher.id}`}>Quantidade</Label>
                <Input
                  id={`extinguisher-quantity-${extinguisher.id}`}
                  type="number"
                  value={extinguisher.quantity}
                  onChange={(e) => updateExtinguisher(extinguisher.id, 'quantity', e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor={`extinguisher-type-${extinguisher.id}`}>Tipo</Label>
                <Select value={extinguisher.type} onValueChange={(value) => updateExtinguisher(extinguisher.id, 'type', value)}>
                  <SelectTrigger id={`extinguisher-type-${extinguisher.id}`}>
                    <SelectValue placeholder="Selecione Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTINGUISHER_TYPE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`extinguisher-weight-${extinguisher.id}`}>Peso</Label>
                <Select value={extinguisher.weight} onValueChange={(value) => updateExtinguisher(extinguisher.id, 'weight', value)}>
                  <SelectTrigger id={`extinguisher-weight-${extinguisher.id}`}>
                    <SelectValue placeholder="Selecione Peso" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTINGUISHER_WEIGHT_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
