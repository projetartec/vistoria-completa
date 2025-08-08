
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Select component is no longer used for clientLocation
import type { ClientInfo } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
// PREDEFINED_CLIENTS is not used here for a Select anymore
// import { PREDEFINED_CLIENTS } from '@/constants/client.data'; 

interface ClientDataFormProps {
  clientInfoData: ClientInfo;
  onClientInfoChange: (field: keyof Omit<ClientInfo, 'logoUrl'>, value: string) => void;
  savedLocations: string[]; // Kept for potential future use with suggestions, not for Select
}

export function ClientDataForm({ 
  clientInfoData, 
  onClientInfoChange,
  // savedLocations prop is kept but not directly used in this version of the form
}: ClientDataFormProps) {
  const [isContentVisible, setIsContentVisible] = useState(true);

  // allLocationSuggestions is no longer used for a Select component
  // const allLocationSuggestions = React.useMemo(() => {
  //   const predefinedNames = PREDEFINED_CLIENTS.map(client => client.name);
  //   return predefinedNames.sort((a, b) => a.localeCompare(b));
  // }, []);

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-center text-primary">VISTORIA TÉCNICA</CardTitle>
        <div 
          className="flex items-center justify-center mt-1 cursor-pointer select-none group"
          onClick={() => setIsContentVisible(!isContentVisible)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsContentVisible(!isContentVisible); }}
          aria-expanded={isContentVisible}
          aria-controls="client-data-content"
        >
          <CardDescription className="font-headline text-lg text-muted-foreground pt-1 group-hover:text-primary transition-colors">
            DADOS DO CLIENTE
          </CardDescription>
          {isContentVisible ? (
            <ChevronUp className="h-5 w-5 ml-2 text-muted-foreground group-hover:text-primary transition-colors" />
          ) : (
            <ChevronDown className="h-5 w-5 ml-2 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
      </CardHeader>
      {isContentVisible && (
        <CardContent id="client-data-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Changed from Select to Input */}
            <div className="md:col-span-2">
              <Label htmlFor="clientLocationInput">LOCAL (Nome do Cliente)</Label>
              <Input
                id="clientLocationInput"
                type="text"
                value={clientInfoData.clientLocation}
                onChange={(e) => onClientInfoChange('clientLocation', e.target.value)}
                placeholder="Digite o nome do cliente/local"
              />
            </div>

            {/* Código do Cliente field removed from UI */}
            {/* 
            <div>
              <Label htmlFor="clientCode">CÓDIGO DO CLIENTE</Label>
              <Input
                id="clientCode"
                value={clientInfoData.clientCode}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d{0,5}$/.test(val) || val === '') { 
                    onClientInfoChange('clientCode', val);
                  }
                }}
                placeholder="Ex: 12345 (ou será preenchido)"
                maxLength={5}
                pattern="\d*" 
              />
            </div>
            */}
            
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="inspectionNumber">Número da Vistoria</Label>
                  <Input
                    id="inspectionNumber"
                    value={clientInfoData.inspectionNumber}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                    placeholder="Será gerado ao digitar o Local"
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
                readOnly
                className="bg-muted cursor-not-allowed"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
