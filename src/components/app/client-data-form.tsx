
import type React from 'react';
import { useState } from 'react'; // Adicionado para controle de visibilidade
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp } from 'lucide-react'; // Adicionado para ícones do botão
import type { ClientInfo } from '@/lib/types';

interface ClientDataFormProps {
  clientInfoData: ClientInfo;
  onClientInfoChange: (field: keyof ClientInfo, value: string) => void;
  savedLocations: string[];
  newLocationInput: string;
  onNewLocationInputChange: (value: string) => void;
  onAddNewLocation: () => void;
}

export function ClientDataForm({ 
  clientInfoData, 
  onClientInfoChange,
  savedLocations,
  newLocationInput,
  onNewLocationInputChange,
  onAddNewLocation,
}: ClientDataFormProps) {
  const [isAddLocationSectionVisible, setIsAddLocationSectionVisible] = useState(false); // Iniciar escondido

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-center text-primary">VISTORIA TÉCNICA</CardTitle>
        <CardDescription className="font-headline text-lg text-center text-muted-foreground pt-1">
          DADOS DO CLIENTE
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => setIsAddLocationSectionVisible(!isAddLocationSectionVisible)}
          variant="ghost"
          className="w-full flex justify-between items-center text-left mb-4 text-lg font-semibold text-primary hover:bg-accent/10"
        >
          <span>{isAddLocationSectionVisible ? 'Ocultar Cadastro de Local' : 'Cadastrar Novo Local'}</span>
          {isAddLocationSectionVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>

        {isAddLocationSectionVisible && (
          <div className="mb-6 border-b pb-6 pt-2">
            <Label htmlFor="newLocationInput" className="text-base font-medium">Nome do Novo Local</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="newLocationInput"
                value={newLocationInput}
                onChange={(e) => onNewLocationInputChange(e.target.value)}
                placeholder="Digite o nome do novo local"
                className="flex-grow"
              />
              <Button onClick={onAddNewLocation} variant="outline">Adicionar Local</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="clientLocationSelect">LOCAL (Nome do Cliente)</Label>
            <Select
              id="clientLocationSelect"
              value={clientInfoData.clientLocation}
              onValueChange={(value) => onClientInfoChange('clientLocation', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione ou cadastre um local" />
              </SelectTrigger>
              <SelectContent>
                {savedLocations.length === 0 ? (
                  <SelectItem value="NO_LOCATIONS_PLACEHOLDER" disabled>
                    Nenhum local cadastrado. Adicione acima.
                  </SelectItem>
                ) : (
                  savedLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))
                )}
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
