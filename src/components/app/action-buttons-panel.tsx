import { Button } from '@/components/ui/button';
import { Download, Save, FolderOpen, PlusSquare, ListChecks } from 'lucide-react';

interface ActionButtonsPanelProps {
  onSave: () => void;
  onNewInspection: () => void;
  onDownloadPdf: () => void;
  onToggleSavedInspections: () => void;
  isSavedInspectionsVisible: boolean;
}

export function ActionButtonsPanel({
  onSave,
  onNewInspection,
  onDownloadPdf,
  onToggleSavedInspections,
  isSavedInspectionsVisible,
}: ActionButtonsPanelProps) {
  return (
    <div className="my-8 p-4 bg-card shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold mb-4 font-headline">Ações</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Button onClick={onDownloadPdf} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Baixar PDF
        </Button>
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
