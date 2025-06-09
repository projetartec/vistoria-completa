
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ClientInfo } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PREDEFINED_CLIENTS } from '@/constants/client.data';

interface ClientDataFormProps {
  clientInfoData: ClientInfo;
  onClientInfoChange: (field: keyof ClientInfo, value: string) => void;
  savedLocations: string[]; // Continuamos usando savedLocations para o datalist de locais gerais
}

export function ClientDataForm({ 
  clientInfoData, 
  onClientInfoChange,
  savedLocations, // Esta prop ainda pode ser útil para sugestões gerais além dos predefinidos
}: ClientDataFormProps) {
  const [isContentVisible, setIsContentVisible] = useState(false);

  // Combinar clientes predefinidos com outros locais salvos para o datalist
  // Garantindo que os nomes predefinidos apareçam e não haja duplicatas na sugestão.
  const allLocationSuggestions = React.useMemo(() => {
    const predefinedNames = PREDEFINED_CLIENTS.map(client => client.name);
    const combined = [...new Set([...predefinedNames, ...savedLocations])];
    return combined.sort((a, b) => a.localeCompare(b));
  }, [savedLocations]);

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
              <Label htmlFor="clientLocationInput">LOCAL (Nome do Cliente)</Label>
              <Input
                id="clientLocationInput"
                value={clientInfoData.clientLocation}
                onChange={(e) => onClientInfoChange('clientLocation', e.target.value)}
                placeholder="Digite ou selecione um local"
                list="client-locations-datalist" 
              />
              <datalist id="client-locations-datalist">
                {allLocationSuggestions.map((loc) => (
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
                  // Permite até 5 dígitos ou vazio
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
