
import { Button } from '@/components/ui/button';
import { Save, FolderOpen, PlusSquare, ListChecks, CopyPlus } from 'lucide-react';

interface ActionButtonsPanelProps {
  onSave: () => void;
  onNewInspection: () => void;
  onNewFloor: () => void; // New prop for "Novo Andar"
  onToggleSavedInspections: () => void;
  isSavedInspectionsVisible: boolean;
}

export function ActionButtonsPanel({
  onSave,
  onNewInspection,
  onNewFloor, // Destructure new prop
  onToggleSavedInspections,
  isSavedInspectionsVisible,
}: ActionButtonsPanelProps) {
  return (
    <div className="my-8 p-4 bg-card shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold mb-4 font-headline">Ações</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Adjusted grid for 2x2 on sm and up */}
        <Button onClick={onSave} >
          <Save className="mr-2 h-4 w-4" /> Salvar Vistoria
        </Button>
        <Button onClick={onNewFloor} variant="outline"> {/* New Floor Button */}
          <CopyPlus className="mr-2 h-4 w-4" /> Novo Andar
        </Button>
        <Button onClick={onToggleSavedInspections} variant="outline">
          <ListChecks className="mr-2 h-4 w-4" /> {isSavedInspectionsVisible ? 'Ocultar Salvas' : 'Ver Salvas'}
        </Button>
        <Button onClick={onNewInspection} variant="secondary">
          <PlusSquare className="mr-2 h-4 w-4" /> Nova Vistoria (Limpar Tudo)
        </Button>
      </div>
    </div>
  );
}
