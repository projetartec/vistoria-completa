
import type React from 'react';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { InspectionData } from '@/lib/types';

interface ClientDataFormProps {
  inspectionData: InspectionData;
  onFieldChange: (field: keyof InspectionData, value: string) => void;
}

export function ClientDataForm({ inspectionData, onFieldChange }: ClientDataFormProps) {
  
  useEffect(() => {
    // Auto-generate inspection number when client code changes
    // A more robust system might involve checking for existing inspection numbers
    // or using a different sequence generation logic.
    if (inspectionData.clientCode) {
      // Example: if there are saved inspections, find the last one for this client and increment.
      // For now, a simple "-01" suffix or based on a global counter for this client might be too simple.
      // Let's keep the simple "-01" for now, acknowledging it's basic.
      const newInspectionNumber = `${inspectionData.clientCode}-01`;
      if (inspectionData.inspectionNumber !== newInspectionNumber) {
        onFieldChange('inspectionNumber', newInspectionNumber);
      }
    } else {
      // If client code is cleared, clear the inspection number
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
                if (/^\d{0,5}$/.test(val)) { // Only digits, max 5
                  onFieldChange('clientCode', val);
                }
              }}
              placeholder="Ex: 12345"
              maxLength={5}
              pattern="\d*" // Suggests numeric input to browsers
            />
          </div>
          <div>
            <Label htmlFor="floor">ANDAR (alfanumérico)</Label>
            <Input
              id="floor"
              value={inspectionData.floor}
              onChange={(e) => onFieldChange('floor', e.target.value)}
              placeholder="Ex: Térreo, 1A, Subsolo"
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
