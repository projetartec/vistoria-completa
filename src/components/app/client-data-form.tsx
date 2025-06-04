
import type React from 'react';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { InspectionData } from '@/lib/types';

interface ClientDataFormProps {
  inspectionData: InspectionData;
  onFieldChange: (field: keyof Omit<InspectionData, 'categories' | 'id' | 'timestamp' | 'floor'>, value: string) => void;
}

export function ClientDataForm({ inspectionData, onFieldChange }: ClientDataFormProps) {
  
  useEffect(() => {
    if (inspectionData.clientCode) {
      const newInspectionNumber = `${inspectionData.clientCode}-01`;
      if (inspectionData.inspectionNumber !== newInspectionNumber) {
        onFieldChange('inspectionNumber', newInspectionNumber);
      }
    } else {
      if (inspectionData.inspectionNumber !== '') {
        onFieldChange('inspectionNumber', '');
      }
    }
  }, [inspectionData.clientCode, inspectionData.inspectionNumber, onFieldChange]);

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Dados do Cliente e Vistoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="clientLocation">LOCAL (Nome do Cliente)</Label>
            <Input
              id="clientLocation"
              value={inspectionData.clientLocation}
              onChange={(e) => onFieldChange('clientLocation', e.target.value)}
              placeholder="Nome do Cliente"
            />
          </div>
          <div>
            <Label htmlFor="clientCode">CÓDIGO DO CLIENTE (até 5 números)</Label>
            <Input
              id="clientCode"
              value={inspectionData.clientCode}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d{0,5}$/.test(val)) { 
                  onFieldChange('clientCode', val);
                }
              }}
              placeholder="Ex: 12345"
              maxLength={5}
              pattern="\d*" 
            />
          </div>
          <div>
            <Label htmlFor="inspectionNumber">Número da Vistoria</Label>
            <Input
              id="inspectionNumber"
              value={inspectionData.inspectionNumber}
              readOnly
              className="bg-muted cursor-not-allowed"
              placeholder="Gerado automaticamente"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
