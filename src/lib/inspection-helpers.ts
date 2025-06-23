'use client';

import type { InspectionCategoryState, CategoryOverallStatus } from './types';

export const getCategoryOverallStatus = (category: InspectionCategoryState): CategoryOverallStatus => {
  if (category.type === 'standard' && category.subItems) {
    const relevantSubItems = category.subItems.filter(subItem => !subItem.isRegistry);
    if (relevantSubItems.length === 0 && category.subItems.some(subItem => subItem.isRegistry)) {
        return 'all-items-selected';
    }
    if (relevantSubItems.length === 0) return 'all-items-selected';
    const allSelected = relevantSubItems.every(subItem => subItem.status !== undefined);
    return allSelected ? 'all-items-selected' : 'some-items-pending';
  } else if (category.type === 'special' || category.type === 'pressure') {
    return category.status !== undefined ? 'all-items-selected' : 'some-items-pending';
  }
  return 'some-items-pending';
};
