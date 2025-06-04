
import { Button } from '@/components/ui/button';
import { Save, FolderOpen, PlusSquare, ListChecks } from 'lucide-react'; // Removed Download icon

interface ActionButtonsPanelProps {
  onSave: () => void;
  onNewInspection: () => void;
  // onDownloadPdf: () => void; // Removed PDF functionality for now
  onToggleSavedInspections: () => void;
  isSavedInspectionsVisible: boolean;
}

export function ActionButtonsPanel({
  onSave,
  onNewInspection,
  // onDownloadPdf, // Removed
  onToggleSavedInspections,
  isSavedInspectionsVisible,
}: ActionButtonsPanelProps) {
  return (
    <div className="my-8 p-4 bg-card shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold mb-4 font-headline">Ações</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"> {/* Adjusted grid to 3 cols */}
        {/* Removed Download PDF Button */}
        <Button onClick={onSave} >
          <Save className="mr-2 h-4 w-4" /> Salvar Vistoria
        </Button>
        <Button onClick={onToggleSavedInspections} variant="outline">
          <ListChecks className="mr-2 h-4 w-4" /> {isSavedInspectionsVisible ? 'Ocultar Salvas' : 'Ver Salvas'}
        </Button>
        <Button onClick={onNewInspection} variant="secondary">
          <PlusSquare className="mr-2 h-4 w-4" /> Nova Vistoria
        </Button>
      </div>
    </div>
  );
}
