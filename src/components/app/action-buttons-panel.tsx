
import { Button } from '@/components/ui/button';
import { Save, FolderOpen, PlusSquare, ListChecks, CopyPlus, FileText } from 'lucide-react';

interface ActionButtonsPanelProps {
  onSave: () => void;
  onNewInspection: () => void;
  onNewFloor: () => void;
  onToggleSavedInspections: () => void;
  isSavedInspectionsVisible: boolean;
  onGeneratePdf: () => void; // New prop for PDF generation
}

export function ActionButtonsPanel({
  onSave,
  onNewInspection,
  onNewFloor,
  onToggleSavedInspections,
  isSavedInspectionsVisible,
  onGeneratePdf, // Destructure new prop
}: ActionButtonsPanelProps) {
  return (
    <div className="my-8 p-4 bg-card shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold mb-4 font-headline">Ações</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"> {/* Adjusted grid for more buttons */}
        <Button onClick={onSave} >
          <Save className="mr-2 h-4 w-4" /> Salvar Vistoria
        </Button>
        <Button onClick={onNewFloor} variant="outline">
          <CopyPlus className="mr-2 h-4 w-4" /> Novo Andar
        </Button>
        <Button onClick={onGeneratePdf} variant="outline"> {/* PDF Button */}
          <FileText className="mr-2 h-4 w-4" /> Gerar PDF
        </Button>
        <Button onClick={onToggleSavedInspections} variant="outline">
          <ListChecks className="mr-2 h-4 w-4" /> {isSavedInspectionsVisible ? 'Ocultar Salvas' : 'Ver Salvas'}
        </Button>
        <Button onClick={onNewInspection} variant="secondary" className="sm:col-span-2 md:col-span-1"> {/* Adjust span for layout */}
          <PlusSquare className="mr-2 h-4 w-4" /> Nova Vistoria (Limpar Tudo)
        </Button>
      </div>
    </div>
  );
}
