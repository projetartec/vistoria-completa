
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ClientInfo } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PREDEFINED_CLIENTS } from '@/constants/client.data';

interface ClientDataFormProps {
  clientInfoData: ClientInfo;
  onClientInfoChange: (field: keyof ClientInfo, value: string) => void;
  savedLocations: string[]; // This prop remains for now, though not directly used in the Select options
}

export function ClientDataForm({ 
  clientInfoData, 
  onClientInfoChange,
  savedLocations, // Kept for potential future use or if other parts of the system rely on it
}: ClientDataFormProps) {
  const [isContentVisible, setIsContentVisible] = useState(false);

  const allLocationSuggestions = React.useMemo(() => {
    // Now only uses predefined clients for the Select options
    const predefinedNames = PREDEFINED_CLIENTS.map(client => client.name);
    return predefinedNames.sort((a, b) => a.localeCompare(b));
  }, []); // PREDEFINED_CLIENTS is constant, so empty dependency array is fine

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
            <div>
              <Label htmlFor="clientLocationSelect">LOCAL (Nome do Cliente)</Label>
              <Select
                value={clientInfoData.clientLocation}
                onValueChange={(value) => onClientInfoChange('clientLocation', value)}
              >
                <SelectTrigger id="clientLocationSelect">
                  <SelectValue placeholder="Selecione um local pré-cadastrado" />
                </SelectTrigger>
                <SelectContent>
                  {allLocationSuggestions.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
      )}
    </Card>
  );
}
