
export type StatusOption = 'OK' | 'N/C' | 'N/A' | 'NONE'; // Changed '' to 'NONE'

export interface SubItemState {
  id: string;
  name: string;
  status: StatusOption;
  observation: string;
  showObservation: boolean;
}

export interface InspectionCategoryState {
  id: string;
  title: string;
  isExpanded: boolean;
  type: 'standard' | 'special' | 'pressure';
  subItems?: SubItemState[];
  status?: StatusOption; // For special items
  observation?: string;
  showObservation?: boolean;
  pressureValue?: string;
  pressureUnit?: 'Kg' | 'PSI' | 'Bar' | '';
}

export interface HoseEntry {
  id: string;
  quantity: string;
  length: '15 metros' | '20 metros' | '30 metros' | '';
  diameter: '1½"' | '2½"' | '';
  type: 'Tipo 1' | 'Tipo 2' | 'Tipo 3' | 'Tipo 4' | 'Tipo 5' | 'Tipo 6' | '';
}

export interface ExtinguisherEntry {
  id: string;
  quantity: string;
  type: 'AP' | 'ABC' | 'BC' | 'EPM' | 'CO²' | '';
  weight: '4kg' | '6kg' | '8kg' | '10kg' | '12kg' | '20kg' | '50kg' | '75kg' | '';
}

export interface InspectionData {
  id: string;
  clientLocation: string;
  clientCode: string;
  floor: string;
  inspectionNumber: string;
  categories: InspectionCategoryState[];
  hoses: HoseEntry[];
  extinguishers: ExtinguisherEntry[];
  timestamp?: number;
}

export interface SubItemConfig {
  id: string;
  name: string;
}

export interface InspectionCategoryConfig {
  id: string;
  title: string;
  type: 'standard' | 'special' | 'pressure';
  subItems?: SubItemConfig[];
}

export type CategoryUpdatePayload =
  | { field: 'isExpanded'; value: boolean }
  | { field: 'status'; value: StatusOption }
  | { field: 'observation'; value: string }
  | { field: 'showObservation'; value: boolean }
  | { field: 'pressureValue'; value: string }
  | { field: 'pressureUnit'; value: string }
  | { field: 'subItemStatus'; subItemId: string; value: StatusOption }
  | { field: 'subItemObservation'; subItemId: string; value: string }
  | { field: 'subItemShowObservation'; subItemId: string; value: boolean };
