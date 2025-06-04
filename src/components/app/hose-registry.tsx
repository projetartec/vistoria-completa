import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle } from 'lucide-react';
import type { HoseEntry } from '@/lib/types';
import { HOSE_DIAMETER_OPTIONS, HOSE_LENGTH_OPTIONS, HOSE_TYPE_OPTIONS } from '@/constants/inspection.config';

interface HoseRegistryProps {
  hoses: HoseEntry[];
  onHosesChange: (updatedHoses: HoseEntry[]) => void;
}

export function HoseRegistry({ hoses, onHosesChange }: HoseRegistryProps) {
  const addHose = () => {
    const newHose: HoseEntry = {
      id: Date.now().toString(), // Simple unique ID
      quantity: '1',
      length: '',
      diameter: '',
      type: '',
    };
    onHosesChange([...hoses, newHose]);
  };

  const updateHose = (id: string, field: keyof HoseEntry, value: string) => {
    onHosesChange(hoses.map(h => h.id === id ? { ...h, [field]: value } : h));
  };

  const removeHose = (id: string) => {
    onHosesChange(hoses.filter(h => h.id !== id));
  };

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-xl">Cadastro de Mangueiras</CardTitle>
        <Button onClick={addHose} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Registrar Nova Mangueira
        </Button>
      </CardHeader>
      <CardContent>
        {hoses.length === 0 && <p className="text-muted-foreground">Nenhuma mangueira registrada.</p>}
        {hoses.map((hose, index) => (
          <div key={hose.id} className="mb-4 p-4 border rounded-md relative bg-background shadow">
            <h4 className="font-medium mb-2 text-primary">Mangueira {index + 1}</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeHose(hose.id)}
              className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
              aria-label="Remover Mangueira"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`hose-quantity-${hose.id}`}>Quantidade</Label>
                <Input
                  id={`hose-quantity-${hose.id}`}
                  type="number"
                  value={hose.quantity}
                  onChange={(e) => updateHose(hose.id, 'quantity', e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor={`hose-length-${hose.id}`}>Medida</Label>
                <Select value={hose.length} onValueChange={(value) => updateHose(hose.id, 'length', value)}>
                  <SelectTrigger id={`hose-length-${hose.id}`}>
                    <SelectValue placeholder="Selecione Medida" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOSE_LENGTH_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`hose-diameter-${hose.id}`}>Diâmetro</Label>
                <Select value={hose.diameter} onValueChange={(value) => updateHose(hose.id, 'diameter', value)}>
                  <SelectTrigger id={`hose-diameter-${hose.id}`}>
                    <SelectValue placeholder="Selecione Diâmetro" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOSE_DIAMETER_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`hose-type-${hose.id}`}>Tipo</Label>
                <Select value={hose.type} onValueChange={(value) => updateHose(hose.id, 'type', value)}>
                  <SelectTrigger id={`hose-type-${hose.id}`}>
                    <SelectValue placeholder="Selecione Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOSE_TYPE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
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
