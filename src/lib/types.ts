
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
}

export interface InspectionCategoryState {
  id: string;
  title: string;
  isExpanded: boolean;
  type: 'standard' | 'special' | 'pressure';
  subItems?: SubItemState[];
  status?: StatusOption | undefined; // Agora aplicável a special e pressure
  observation?: string;
  showObservation?: boolean;
  pressureValue?: string;
  pressureUnit?: 'Kg' | 'PSI' | 'Bar' | '';
}

// Represents a single floor's data within a full inspection
export interface InspectionData {
  id: string; // Unique ID for this floor entry
  floor: string;
  categories: InspectionCategoryState[];
}

export interface ClientInfo {
  clientLocation: string;
  clientCode: string;
  inspectionNumber: string;
  inspectionDate: string;
}

// Represents a full inspection, including client info and all its floors
export interface FullInspectionData {
  id: string; // Unique ID for the full inspection (typically inspectionNumber)
  clientInfo: ClientInfo;
  floors: InspectionData[];
  timestamp: number;
  uploadedLogoDataUrl?: string | null; // Added to store uploaded logo
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
  | { field: 'addRegisteredExtinguisher'; subItemId: string; value: Omit<RegisteredExtinguisher, 'id'> }
  | { field: 'removeRegisteredExtinguisher'; subItemId: string; extinguisherId: string }
  | { field: 'addRegisteredHose'; subItemId: string; value: Omit<RegisteredHose, 'id'> }
  | { field: 'removeRegisteredHose'; subItemId: string; hoseId: string }
  | { field: 'markAllSubItemsNA' }; // Added new action type

export type CategoryOverallStatus = 'all-items-selected' | 'some-items-pending';

    
