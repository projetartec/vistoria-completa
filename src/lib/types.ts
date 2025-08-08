
export type StatusOption = 'OK' | 'N/C' | 'N/A';

export type ExtinguisherTypeOption = 'AP' | 'ABC' | 'BC' | 'EPM' | 'CO²';
export type ExtinguisherWeightOption = '4kg' | '6kg' | '8kg' | '10kg' | '12kg' | '20kg' | '50kg' | '75kg';

export interface RegisteredExtinguisher {
  id: string;
  quantity: number;
  type: ExtinguisherTypeOption | '';
  weight: ExtinguisherWeightOption | '';
}

export type HoseLengthOption = '15 metros' | '20 metros' | '30 metros';
export type HoseDiameterOption = '1½"' | '2½"';
export type HoseTypeOption = 'Tipo 1' | 'Tipo 2' | 'Tipo 3' | 'Tipo 4' | 'Tipo 5' | 'Tipo 6';

export interface RegisteredHose {
  id: string;
  quantity: number;
  length: HoseLengthOption | '';
  diameter: HoseDiameterOption | '';
  type: HoseTypeOption | '';
}

export interface SubItemState {
  id: string;
  name: string;
  status?: StatusOption | undefined;
  observation?: string;
  showObservation?: boolean;
  isRegistry?: boolean;
  registeredExtinguishers?: RegisteredExtinguisher[];
  registeredHoses?: RegisteredHose[];
  photoDataUri?: string | null;
  photoDescription?: string;
}

export interface InspectionCategoryState {
  id: string;
  title: string;
  isExpanded: boolean;
  type: 'standard' | 'special' | 'pressure';
  subItems?: SubItemState[];
  status?: StatusOption | undefined;
  observation?: string;
  showObservation?: boolean;
  pressureValue?: string;
  pressureUnit?: 'Kg' | 'PSI' | 'Bar' | '';
}

// Renamed from InspectionData to FloorData
export interface FloorData {
  id: string; // Unique ID for this floor entry
  floor: string; // Name of the floor, e.g., "Térreo", "1A"
  categories: InspectionCategoryState[];
  isFloorContentVisible?: boolean;
}

export interface TowerData {
  id: string; // Unique ID for this tower entry
  towerName: string;
  floors: FloorData[];
}

export interface ClientInfo {
  clientLocation: string;
  clientCode: string;
  inspectionNumber: string;
  inspectionDate: string;
  inspectedBy?: string;
}

// Updated to use TowerData[]
export interface FullInspectionData {
  id: string;
  clientInfo: ClientInfo;
  towers: TowerData[];
  timestamp: number;
  owner: string; // User who owns the inspection
}


export interface InspectionCategoryConfig {
  id: string;
  title: string;
  type: 'standard' | 'special' | 'pressure';
  subItems?: Array<{ id: string; name: string; isRegistry?: boolean }>;
}

export type CategoryUpdatePayload =
  | { field: 'isExpanded'; value: boolean }
  | { field: 'status'; value: StatusOption | undefined }
  | { field: 'observation'; value: string }
  | { field: 'showObservation'; value: boolean }
  | { field: 'pressureValue'; value: string }
  | { field: 'pressureUnit'; value: InspectionCategoryState['pressureUnit'] }
  | { field: 'subItemStatus'; subItemId: string; value: StatusOption | undefined }
  | { field: 'subItemObservation'; subItemId: string; value: string }
  | { field: 'subItemShowObservation'; subItemId: string; value: boolean }
  | { field: 'subItemPhotoDataUri'; subItemId: string; value: string | null }
  | { field: 'subItemPhotoDescription'; subItemId: string; value: string }
  | { field: 'removeSubItemPhoto'; subItemId: string }
  | { field: 'addRegisteredExtinguisher'; subItemId: string; value: Omit<RegisteredExtinguisher, 'id'> }
  | { field: 'removeRegisteredExtinguisher'; subItemId: string; extinguisherId: string }
  | { field: 'addRegisteredHose'; subItemId: string; value: Omit<RegisteredHose, 'id'> }
  | { field: 'removeRegisteredHose'; subItemId: string; hoseId: string }
  | { field: 'markAllSubItemsNA' }
  | { field: 'markAllSubItemsOK' } // Added new action type
  | { field: 'addSubItem'; categoryId: string; value: string }
  | { field: 'removeSubItem'; categoryId: string; subItemId: string }
  | { field: 'renameCategoryTitle'; newTitle: string }
  | { field: 'renameSubItemName'; subItemId: string; newName: string };

export type CategoryOverallStatus = 'all-items-selected' | 'some-items-pending';

    

    