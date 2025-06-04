
export type StatusOption = 'OK' | 'N/C' | 'N/A';

export interface SubItemState {
  id: string;
  name: string;
  status: StatusOption | undefined; 
  observation: string;
  showObservation: boolean;
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

// Represents the data for a single floor's inspection checklist
export interface InspectionData {
  id: string; // Unique ID for this specific floor's data entry
  clientLocation: string; // Will be filled from ClientInfo when saving
  clientCode: string; // Will be filled from ClientInfo when saving
  inspectionNumber: string; // Will be filled from ClientInfo when saving
  inspectionDate?: string; // Date of the inspection YYYY-MM-DD
  floor: string; // Specific to this floor entry
  categories: InspectionCategoryState[];
  timestamp?: number; // For sorting saved inspections
}

// Represents the overall client and main inspection identifier
export interface ClientInfo {
  clientLocation: string;
  clientCode: string;
  inspectionNumber: string; 
  inspectionDate: string; // Date of the inspection YYYY-MM-DD
}


export interface InspectionCategoryConfig {
  id: string;
  title: string;
  type: 'standard' | 'special' | 'pressure';
  subItems?: Array<{ id: string; name: string }>; 
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
  | { field: 'subItemShowObservation'; subItemId: string; value: boolean };

// Defines the status for icon display next to category titles
export type CategoryOverallStatus = 'all-items-selected' | 'some-items-pending';
