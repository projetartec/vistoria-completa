
export type StatusOption = 'OK' | 'N/C' | 'N/A' | '';

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
  // For items with sub-items (e.g., Extintor)
  subItems?: SubItemState[];
  // For special items (e.g., Bomba Principal SPK)
  status?: StatusOption;
  observation?: string;
  showObservation?: boolean;
  // For pressure items
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
  id: string; // Unique ID for the inspection, can be timestamp or UUID
  clientLocation: string;
  clientCode: string;
  floor: string;
  inspectionNumber: string;
  categories: InspectionCategoryState[];
  hoses: HoseEntry[];
  extinguishers: ExtinguisherEntry[];
  timestamp?: number; // For sorting saved inspections
}

// Config types
export interface SubItemConfig {
  id: string;
  name: string;
}

export interface InspectionCategoryConfig {
  id: string;
  title: string;
  type: 'standard' | 'special' | 'pressure';
  subItems?: SubItemConfig[]; // Only for 'standard' type
}
