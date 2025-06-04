
import type React from 'react';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ClientInfo } from '@/lib/types';

interface ClientDataFormProps {
  clientInfoData: ClientInfo;
  onClientInfoChange: (field: keyof ClientInfo, value: string) => void;
}

export function ClientDataForm({ clientInfoData, onClientInfoChange }: ClientDataFormProps) {
  
  useEffect(() => {
    if (clientInfoData.clientCode) {
      const newInspectionNumber = `${clientInfoData.clientCode}-01`; 
      if (clientInfoData.inspectionNumber !== newInspectionNumber) {
        onClientInfoChange('inspectionNumber', newInspectionNumber);
      }
    } else {
      if (clientInfoData.inspectionNumber !== '') {
        onClientInfoChange('inspectionNumber', '');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [clientInfoData.clientCode]);

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
              value={clientInfoData.clientLocation}
              onChange={(e) => onClientInfoChange('clientLocation', e.target.value)}
              placeholder="Nome do Cliente"
            />
          </div>
          <div>
            <Label htmlFor="clientCode">CÓDIGO DO CLIENTE (até 5 números)</Label>
            <Input
              id="clientCode"
              value={clientInfoData.clientCode}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d{0,5}$/.test(val)) { 
                  onClientInfoChange('clientCode', val);
                }
              }}
              placeholder="Ex: 12345"
              maxLength={5}
              pattern="\d*" 
            />
          </div>
          
          {/* Container for Inspection Number and Date to be side-by-side on larger screens */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="inspectionNumber">Número da Vistoria</Label>
                <Input
                  id="inspectionNumber"
                  value={clientInfoData.inspectionNumber}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  placeholder="Gerado automaticamente"
                />
              </div>
              <div>
                <Label htmlFor="inspectionDate">Data da Vistoria</Label>
                <Input
                  id="inspectionDate"
                  type="date"
                  value={clientInfoData.inspectionDate}
                  onChange={(e) => onClientInfoChange('inspectionDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
