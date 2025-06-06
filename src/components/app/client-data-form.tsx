
import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ClientInfo } from '@/lib/types';

interface ClientDataFormProps {
  clientInfoData: ClientInfo;
  onClientInfoChange: (field: keyof ClientInfo, value: string) => void;
  savedLocations: string[];
}

export function ClientDataForm({ 
  clientInfoData, 
  onClientInfoChange,
  savedLocations,
}: ClientDataFormProps) {

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-center text-primary">VISTORIA TÉCNICA</CardTitle>
        <CardDescription className="font-headline text-lg text-center text-muted-foreground pt-1">
          DADOS DO CLIENTE
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="clientLocationInput">LOCAL (Nome do Cliente)</Label>
            <Input
              id="clientLocationInput"
              value={clientInfoData.clientLocation}
              onChange={(e) => onClientInfoChange('clientLocation', e.target.value)}
              placeholder="Digite ou selecione um local"
              list="client-locations-list" 
            />
            <datalist id="client-locations-list">
              {savedLocations.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="clientCode">CÓDIGO DO CLIENTE</Label>
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
          
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="inspectionNumber">Número da Vistoria</Label>
                <Input
                  id="inspectionNumber"
                  value={clientInfoData.inspectionNumber}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  placeholder="Preencha Cliente/Local"
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
          <div className="md:col-span-2">
            <Label htmlFor="inspectedBy">Vistoriado por</Label>
            <Input
              id="inspectedBy"
              value={clientInfoData.inspectedBy || ''}
              onChange={(e) => onClientInfoChange('inspectedBy', e.target.value)}
              placeholder="Nome do técnico responsável"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
