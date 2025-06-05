
import type React from 'react';
// Removed useState as it's no longer needed after removing the toggle section
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Removed Button as it was only used for the removed "Cadastrar Novo Local" feature
// Removed ChevronDown and ChevronUp as they were used for the toggle button
import type { ClientInfo } from '@/lib/types';

interface ClientDataFormProps {
  clientInfoData: ClientInfo;
  onClientInfoChange: (field: keyof ClientInfo, value: string) => void;
  savedLocations: string[];
  // Removed props related to new location input and adding
}

export function ClientDataForm({ 
  clientInfoData, 
  onClientInfoChange,
  savedLocations,
  // Removed props destructuring
}: ClientDataFormProps) {
  // Removed isAddLocationSectionVisible state

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-center text-primary">VISTORIA TÉCNICA</CardTitle>
        <CardDescription className="font-headline text-lg text-center text-muted-foreground pt-1">
          DADOS DO CLIENTE
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Removed the toggle button and the conditional section for adding new location */}

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
        </div>
      </CardContent>
    </Card>
  );
}
