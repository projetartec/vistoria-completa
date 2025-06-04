
import { Button } from '@/components/ui/button';
import { Save, FolderOpen, PlusSquare, ListChecks, CopyPlus, FileText, Printer } from 'lucide-react';

interface ActionButtonsPanelProps {
  onSave: () => void;
  onNewInspection: () => void;
  onNewFloor: () => void;
  onToggleSavedInspections: () => void;
  isSavedInspectionsVisible: boolean;
  onGeneratePdf: () => void;
  onPrint: () => void;
}

export function ActionButtonsPanel({
  onSave,
  onNewInspection,
  onNewFloor,
  onToggleSavedInspections,
  isSavedInspectionsVisible,
  onGeneratePdf,
  onPrint,
}: ActionButtonsPanelProps) {
  return (
    <div className="my-8 p-4 bg-card shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold mb-4 font-headline">Ações</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Button onClick={onSave} >
          <Save className="mr-2 h-4 w-4" /> Salvar Vistoria
        </Button>
        <Button
          onClick={onNewFloor}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          <CopyPlus className="mr-2 h-4 w-4" /> Novo Andar
        </Button>
        <Button
          onClick={onGeneratePdf}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <FileText className="mr-2 h-4 w-4" /> Gerar PDF
        </Button>
        <Button
          onClick={onPrint}
          variant="secondary"
        >
          <Printer className="mr-2 h-4 w-4" /> Imprimir Vistoria
        </Button>
        <Button
          onClick={onToggleSavedInspections}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          <ListChecks className="mr-2 h-4 w-4" /> {isSavedInspectionsVisible ? 'Ocultar Salvas' : 'Ver Salvas'}
        </Button>
        <Button
          onClick={onNewInspection}
          variant="destructive"
        >
          <PlusSquare className="mr-2 h-4 w-4" /> Nova Vistoria (Limpar Tudo)
        </Button>
      </div>
    </div>
  );
}
