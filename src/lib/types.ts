
export type StatusOption = 'OK' | 'N/C' | 'N/A' | 'NONE';

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
  subItems?: SubItemState[]; // For 'standard' type
  status?: StatusOption; // For 'special' type
  observation?: string; // For 'special' and 'pressure' types (main observation for the category)
  showObservation?: boolean; // For 'special' and 'pressure' types
  pressureValue?: string; // For 'pressure' type
  pressureUnit?: 'Kg' | 'PSI' | 'Bar' | ''; // For 'pressure' type
}

export interface InspectionData {
  id: string; // Unique ID for the inspection, generated client-side
  clientLocation: string;
  clientCode: string;
  floor: string;
  inspectionNumber: string; // Auto-generated: <clientCode>-<sequence>
  categories: InspectionCategoryState[];
  timestamp?: number; // For sorting saved inspections
}

// Defines the static configuration for each category type
export interface InspectionCategoryConfig {
  id: string;
  title: string;
  type: 'standard' | 'special' | 'pressure';
  subItems?: Array<{ id: string; name: string }>; // Only for 'standard' type
}

// Payload for updating category items, used in callbacks
export type CategoryUpdatePayload =
  | { field: 'isExpanded'; value: boolean }
  | { field: 'status'; value: StatusOption } // For 'special' items
  | { field: 'observation'; value: string } // For 'special' or 'pressure' items (main observation)
  | { field: 'showObservation'; value: boolean } // For 'special' or 'pressure' items (main observation)
  | { field: 'pressureValue'; value: string }
  | { field: 'pressureUnit'; value: InspectionCategoryState['pressureUnit'] }
  | { field: 'subItemStatus'; subItemId: string; value: StatusOption }
  | { field: 'subItemObservation'; subItemId: string; value: string }
  | { field: 'subItemShowObservation'; subItemId: string; value: boolean };
