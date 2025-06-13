
import type { FloorData, TowerData, ClientInfo, SubItemState, StatusOption, InspectionCategoryState, RegisteredExtinguisher, RegisteredHose, ExtinguisherTypeOption, HoseLengthOption, HoseDiameterOption, HoseTypeOption, ExtinguisherWeightOption } from './types'; // Updated type imports
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { INSPECTION_CONFIG, EXTINGUISHER_TYPES, EXTINGUISHER_WEIGHTS, HOSE_LENGTHS, HOSE_DIAMETERS, HOSE_TYPES } from '@/constants/inspection.config';

// SVG Icons remain the same
const checkCircleSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-status-completed">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
`;

const xCircleSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-status-incomplete">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
`;


function getStatusLabel(status: StatusOption | undefined): string {
  if (status === undefined) return 'Pendente';
  return status;
}

function getStatusClass(status: StatusOption | undefined): string {
  if (status === 'OK') return 'status-ok';
  if (status === 'N/C') return 'status-nc';
  if (status === 'N/A') return 'status-na';
  return 'status-pending';
}

const PDF_COMMON_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap');
  body { font-family: 'PT Sans', Arial, sans-serif; margin: 0; padding: 0; line-height: 1.1; font-size: 7.5pt; background-color: #FFFFFF; color: #1A1A1A; }
  .pdf-container { max-width: 800px; margin: 0 auto; background-color: #FFFFFF; padding: 5px; border: 1px solid #DDD; }
  .pdf-header-main { display: flex; flex-direction: row; justify-content: center; align-items: center; border-bottom: 1px solid #D1D5DB; padding-bottom: 4px; margin-bottom: 6px; }
  .pdf-header-content-wrapper { display: flex; align-items: center; gap: 6px; }
  .pdf-logo-container { flex-shrink: 0; }
  .pdf-logo-container img { max-height: 60px; width: auto; max-width: 140px; display: block; }
  .pdf-company-info-container { text-align: left; }
  .pdf-header-main .company-name { font-size: 11pt; font-weight: 700; color: #2563EB; margin-bottom: 0.5px; }
  .pdf-header-main .company-details p { font-size: 6.5pt; color: #374151; margin: 0.1px 0; line-height: 1.0; }
  .pdf-client-info { border: 1px solid #D1D5DB; border-radius: 3px; padding: 6px; margin-bottom: 6px; background-color: #F9FAFB; }
  .pdf-client-info .pdf-main-title { font-size: 11pt; font-weight: 700; color: #2563EB; margin-top: 0; margin-bottom: 0.5px; text-align: center; }
  .pdf-client-info .pdf-subtitle { font-size: 8pt; font-weight: 700; color: #6B7280; margin-top: 0; margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px solid #E5E7EB; text-align: center; }
  .pdf-client-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 6px; font-size: 7pt; text-align: left; }
  .pdf-client-info-grid div { padding: 0.2px 0; }
  .pdf-client-info-grid strong { color: #111827; font-weight: 600; }
  .pdf-section-title { font-size: 10pt; font-weight: 700; color: #1F2937; margin-top: 8px; margin-bottom: 4px; padding-bottom: 2.5px; border-bottom: 1.2px solid #2563EB; page-break-after: avoid; }
  .page-break-before { page-break-before: always !important; }
  .page-break-after { page-break-after: always !important; }
  .page-break-avoid { page-break-inside: avoid !important; }

  .pdf-tower-section { margin-bottom: 10px; page-break-inside: avoid; border: 1px solid #DDD; padding: 5px; border-radius: 4px; background-color: #fdfdfd;}
  .pdf-tower-title { font-size: 11pt; font-weight: bold; color: #111827; margin-top: 5px; margin-bottom: 5px; padding: 3px; background-color: #E0E7FF; border-radius: 3px; text-align: center; page-break-after: avoid; }
  .pdf-floor-section { margin-bottom: 8px; break-inside: avoid-column; page-break-inside: avoid; padding-left: 10px; border-left: 2px solid #BFDBFE; }
  .pdf-floor-title { font-size: 10pt; font-weight: 700; color: #1F2937; margin-top: 8px; margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1.5px solid #60A5FA; page-break-after: avoid; } /* Lighter blue for floor */
  .pdf-floor-section:first-of-type .pdf-floor-title { margin-top: 1px; }
  
  .pdf-registered-items-section { margin-top: 6px; }
  .pdf-registered-items-section h4 { font-size: 8.5pt; font-weight: 600; color: #374151; margin-top: 4px; margin-bottom: 2px; page-break-after: avoid; }
  .pdf-registered-items-section ul { list-style: disc; margin-left: 12px; padding-left: 0; margin-top: 0; margin-bottom: 2px; }
  .pdf-registered-items-section li { font-size: 7pt; color: #4B5563; margin-bottom: 0.2px; }
  .pdf-no-items { font-style: italic; color: #6B7280; margin-left: 2px; font-size: 7pt; }
  
  .pdf-totals-summary { margin-top: 8px; padding-top: 4px; border-top: 1px solid #E5E7EB; break-inside: avoid-column; page-break-inside: avoid; }
  .pdf-totals-summary h4 { font-size: 9pt; font-weight: 600; color: #111827; margin-bottom: 2px; page-break-after: avoid; }
  .pdf-totals-summary p { font-size: 7.5pt; color: #1F2937; margin-bottom: 0.5px; }
  .pdf-totals-summary .pdf-type-breakdown { list-style: none; padding-left: 4px; margin-top: 0.1px; margin-bottom: 2px; }
  .pdf-totals-summary .pdf-type-breakdown li { font-size: 7pt; color: #374151; margin-bottom: 0.1px; }
  .pdf-totals-summary .pdf-type-breakdown ul { list-style: circle; margin-left: 6px; padding-left: 0; margin-top: 0.1px; }
  .pdf-totals-summary .pdf-type-breakdown ul li { font-size: 6.5pt; }

  .pdf-photo-report-section { margin-top: 10px; page-break-before: always; }
  .pdf-photo-report-section-standalone { margin-top: 10px; }
  .pdf-photo-items-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin-top: 5px; }
  .pdf-photo-item { border: 1px solid #E5E7EB; border-radius: 4px; padding: 8px; page-break-inside: avoid; background-color: #F9FAFB; display: flex; flex-direction: column; }
  .pdf-photo-item img { width: 100%; max-height: 200px; object-fit: contain; border-radius: 3px; margin-bottom: 6px; border: 1px solid #DDD; background-color: #FFF; }
  .pdf-photo-item p { font-size: 6.5pt; margin: 1px 0; color: #374151; line-height: 1.2; }
  .pdf-photo-item strong { font-weight: 600; color: #111827; }
  .pdf-photo-item .photo-observation { font-size: 6pt; white-space: pre-wrap; word-wrap: break-word; margin-top:3px; padding: 3px; border-top: 1px dashed #DDD; }

  .pdf-nc-summary-section { page-break-before: always; margin-top: 10px; }
  .pdf-nc-summary-list { column-count: 2; column-gap: 20px; margin-top: 5px; page-break-inside: avoid; }
  .pdf-nc-summary-list .category-group { break-inside: avoid-column; page-break-inside: avoid; margin-bottom: 8px; }
  .pdf-nc-summary-list .category-title { font-weight: bold; font-size: 8.5pt; margin-bottom: 2px; page-break-after: avoid; color: #111827; }
  .pdf-nc-summary-list ul { list-style: none; margin-left: 5px; padding-left: 0; font-size: 7.5pt; }
  .pdf-nc-summary-list li { margin-bottom: 1px; display: flex; justify-content: space-between; }
  .pdf-nc-summary-list li .item-name { color: #374151; }
  .pdf-nc-summary-list li .item-count { font-weight: bold; color: #B91C1C; }

  .pdf-footer { text-align: center; margin-top: 12px; padding-top: 6px; border-top: 1px solid #E5E7EB; font-size: 6pt; color: #6B7280; }
  @media print {
    html, body { height: auto; background-color: #FFFFFF !important; margin: 0 !important; padding: 3mm 2mm !important; print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; font-size: 7.5pt; overflow: visible !important; }
    .pdf-container { width: 100%; box-shadow: none !important; padding: 0 !important; border: none !important; margin: 0 !important; overflow: visible !important; }
    .pdf-footer { page-break-before: auto; page-break-inside: avoid; }
    .pdf-header-main .company-name, .pdf-client-info .pdf-main-title { color: #2563EB !important; }
    .pdf-header-main .company-details p { color: #374151 !important; }
    .pdf-client-info .pdf-subtitle { color: #6B7280 !important; }
    .pdf-client-info-grid strong { color: #111827 !important; }
    .pdf-section-title { color: #1F2937 !important; border-bottom-color: #2563EB !important; }
    .pdf-tower-title { color: #111827 !important; background-color: #E0E7FF !important; }
    .pdf-floor-title { color: #1F2937 !important; border-bottom-color: #60A5FA !important; }
    .pdf-category-title-text { color: #111827 !important; }
    .pdf-subitem-name { color: #1F2937 !important; }
    .pdf-observation { color: #4B5563 !important; border-left: 1.5px solid #9CA3AF !important; background-color: #F9FAFB !important; }
    .status-ok { background-color: #ECFDF5 !important; color: #047857 !important; border: 0.5px solid #A7F3D0 !important; }
    .status-nc { background-color: #FEF2F2 !important; color: #B91C1C !important; border: 0.5px solid #FECACA !important; }
    .status-na { background-color: #FFFBEB !important; color: #B45309 !important; border: 0.5px solid #FDE68A !important; }
    .status-pending { background-color: #F3F4F6 !important; color: #4B5563 !important; border: 0.5px solid #D1D5DB !important; }
    .pdf-registered-items-section h4 { color: #374151 !important; }
    .pdf-registered-items-section li { color: #4B5563 !important; }
    .pdf-no-items { color: #6B7280 !important; }
    .pdf-totals-summary h4 { color: #111827 !important; }
    .pdf-totals-summary p { color: #1F2937 !important; }
    .pdf-totals-summary .pdf-type-breakdown li { color: #374151 !important; }
    .pdf-verified-items-list { column-count: 2; column-gap: 12px; margin-top: 3px; page-break-inside: avoid; }
    .pdf-verified-items-list .category-group { break-inside: avoid-column; page-break-inside: avoid; margin-bottom: 4px; }
    .pdf-verified-items-list .category-title { font-weight: bold; font-size: 8pt; margin-bottom: 1px; page-break-after: avoid; }
    .pdf-verified-items-list ul { list-style: disc; margin-left: 11px; padding-left: 0; font-size: 7pt; }
    .pdf-verified-items-list li { margin-bottom: 0.3px; }
    .pdf-nc-item-category { font-weight: bold; margin-top: 4px; margin-bottom: 1px; font-size: 8pt; color: #111827 !important; page-break-after: avoid; }
    .pdf-nc-item-name { margin-left: 5px; font-size: 7.5pt; color: #1F2937 !important;}
    .pdf-nc-observation { margin-left: 5px; margin-top: 0.2px; padding: 2px 3.5px; background-color: #FEF2F2 !important; border-left: 1.5px solid #F87171 !important; font-size: 7pt; color: #7F1D1D !important; white-space: pre-wrap;}
    .pdf-nc-pressure-details { margin-left: 5px; font-size: 7pt;}
    .pdf-nc-summary-list .category-title { color: #111827 !important; }
    .pdf-nc-summary-list li .item-name { color: #374151 !important; }
    .pdf-nc-summary-list li .item-count { color: #B91C1C !important; }
    .first-page-center-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; text-align: center; }
    .first-page-center-container .pdf-header-main, .first-page-center-container .pdf-client-info { width: 80%; max-width: 600px; margin-left: auto; margin-right: auto; }
    .two-column-layout { column-count: 2; column-gap: 20px; margin-top: 5px; page-break-inside: avoid;}
    .two-column-layout > * { break-inside: avoid-column; page-break-inside: avoid; }
    .pdf-photo-items-container { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .pdf-photo-item img { max-height: 150px; }
  }
`;

const PDF_SPECIFIC_STYLES_VISTORIA = `
  .pdf-category-card { background-color: #FFFFFF; border: 0.5px solid #E5E7EB; border-radius: 3px; margin-bottom: 6px; box-shadow: 0 0.5px 0.5px rgba(0,0,0,0.02); page-break-inside: avoid; }
  .pdf-category-header { display: flex; align-items: center; padding: 3px 5px; background-color: #F3F4F6; border-bottom: 0.5px solid #E5E7EB; border-top-left-radius: 3px; border-top-right-radius: 3px; page-break-after: avoid; }
  .pdf-category-title-text { font-size: 9pt; font-weight: 600; color: #111827; flex-grow: 1; }
  .pdf-category-content { padding: 5px; font-size: 7pt; }
  .pdf-subitem-wrapper { margin-bottom: 3px; padding-bottom: 3px; border-bottom: 0.5px dashed #E5E7EB; page-break-inside: avoid; }
  .pdf-subitem-wrapper:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .pdf-subitem { display: flex; justify-content: space-between; align-items: center; }
  .pdf-subitem-name { font-weight: 600; color: #1F2937; flex-grow: 1; margin-right: 3px; font-size: 7pt; }
  .pdf-status { padding: 0.3px 3px; border-radius: 2.5px; font-weight: 600; font-size: 0.65em; white-space: nowrap; }
  .pdf-observation { color: #4B5563; margin-top: 1.5px; padding: 3px 4px; background-color: #F9FAFB; border-left: 1.5px solid #9CA3AF; font-size: 0.7em; white-space: pre-wrap; width: 100%; box-sizing: border-box; }
  .pdf-pressure-details p, .pdf-special-details p { margin: 0.5px 0 3px 0; display: flex; justify-content: space-between; align-items: center; font-size: 7pt;}
  .pdf-pressure-details .pdf-subitem-name, .pdf-special-details .pdf-subitem-name { flex-grow: 0; font-weight: 600; }
  @media print {
    .pdf-category-card { page-break-inside: avoid !important; box-shadow: none !important; border: 0.5px solid #E5E7EB !important; }
    .pdf-subitem-wrapper { page-break-inside: avoid !important; }
  }
`;


export function generateInspectionPdf(clientInfo: ClientInfo, towersData: TowerData[], uploadedLogoDataUrl?: string | null): void {
  const defaultLogoUrl = '/brazil-extintores-logo.png';
  const logoToUse = uploadedLogoDataUrl || defaultLogoUrl;
  const isDataUrl = uploadedLogoDataUrl && uploadedLogoDataUrl.startsWith('data:image');

  const processedTowersData = towersData
    .filter(tower => tower && tower.towerName && tower.towerName.trim() !== "")
    .map(tower => ({
      ...tower,
      floors: tower.floors
        .filter(floor => floor && floor.floor && floor.floor.trim() !== "")
        .map(floor => {
          let floorHasPressureSPK = false, floorPressureSPKValue = '', floorPressureSPKUnit = '';
          let floorHasPressureHidrante = false, floorPressureHidranteValue = '', floorPressureHidranteUnit = '';
          let floorRegisteredExtinguishers: RegisteredExtinguisher[] = [];
          let floorRegisteredHoses: RegisteredHose[] = [];
          const categories = floor.categories.map(category => {
            let categoryHasNCItems = false;
            if (category.id === 'pressao_spk' && category.status !== 'N/A' && category.pressureValue) { floorHasPressureSPK = true; floorPressureSPKValue = category.pressureValue; floorPressureSPKUnit = category.pressureUnit || ''; }
            if (category.id === 'pressao_hidrante' && category.status !== 'N/A' && category.pressureValue) { floorHasPressureHidrante = true; floorPressureHidranteValue = category.pressureValue; floorPressureHidranteUnit = category.pressureUnit || ''; }
            if (category.type === 'standard' && category.subItems) {
              const processedSubItems = category.subItems.map(subItem => {
                if (subItem.status === 'N/C' && !subItem.isRegistry) categoryHasNCItems = true;
                if (subItem.isRegistry && subItem.id === 'extintor_cadastro' && subItem.registeredExtinguishers) floorRegisteredExtinguishers.push(...subItem.registeredExtinguishers);
                if (subItem.isRegistry && subItem.id === 'hidrantes_cadastro_mangueiras' && subItem.registeredHoses) floorRegisteredHoses.push(...subItem.registeredHoses);
                return subItem;
              });
              return { ...category, subItems: processedSubItems, categoryHasNCItems };
            } else if ((category.type === 'special' || category.type === 'pressure') && category.status === 'N/C') categoryHasNCItems = true;
            return { ...category, categoryHasNCItems };
          });
          return { ...floor, categories, floorHasPressureSPK, floorPressureSPKValue, floorPressureSPKUnit, floorHasPressureHidrante, floorPressureHidranteValue, floorPressureHidranteUnit, floorRegisteredExtinguishers, floorRegisteredHoses };
        }),
    }));

  const towersToActuallyPrint = processedTowersData.length > 0 ? processedTowersData : towersData.map(tower => ({ // Fallback to all towers if none are named
    ...tower,
    floors: tower.floors.map(floor => { // Map floors similarly for fallback
        let floorHasPressureSPK = false, floorPressureSPKValue = '', floorPressureSPKUnit = '';
        let floorHasPressureHidrante = false, floorPressureHidranteValue = '', floorPressureHidranteUnit = '';
        let floorRegisteredExtinguishers: RegisteredExtinguisher[] = [];
        let floorRegisteredHoses: RegisteredHose[] = [];
        const categories = floor.categories.map(category => {
            let categoryHasNCItems = false;
            if (category.id === 'pressao_spk' && category.status !== 'N/A' && category.pressureValue) { floorHasPressureSPK = true; floorPressureSPKValue = category.pressureValue; floorPressureSPKUnit = category.pressureUnit || ''; }
            if (category.id === 'pressao_hidrante' && category.status !== 'N/A' && category.pressureValue) { floorHasPressureHidrante = true; floorPressureHidranteValue = category.pressureValue; floorPressureHidranteUnit = category.pressureUnit || ''; }
            if (category.type === 'standard' && category.subItems) {
                const processedSubItems = category.subItems.map(subItem => {
                if (subItem.status === 'N/C' && !subItem.isRegistry) categoryHasNCItems = true;
                if (subItem.isRegistry && subItem.id === 'extintor_cadastro' && subItem.registeredExtinguishers) floorRegisteredExtinguishers.push(...subItem.registeredExtinguishers);
                if (subItem.isRegistry && subItem.id === 'hidrantes_cadastro_mangueiras' && subItem.registeredHoses) floorRegisteredHoses.push(...subItem.registeredHoses);
                return subItem;
                });
                return { ...category, subItems: processedSubItems, categoryHasNCItems };
            } else if ((category.type === 'special' || category.type === 'pressure') && category.status === 'N/C') categoryHasNCItems = true;
            return { ...category, categoryHasNCItems };
        });
        return { ...floor, categories, floorHasPressureSPK, floorPressureSPKValue, floorPressureSPKUnit, floorHasPressureHidrante, floorPressureHidranteValue, floorPressureHidranteUnit, floorRegisteredExtinguishers, floorRegisteredHoses };
    }),
  }));


  const extinguisherTypeTotals: { [key: string]: number } = {};
  let grandTotalExtinguishersCount = 0;
  interface HoseCombinationTotals { [key: string]: { quantity: number; length: HoseLengthOption | ''; diameter: HoseDiameterOption | ''; type: HoseTypeOption | ''; }; }
  const hoseCombinationTotals: HoseCombinationTotals = {};
  let grandTotalHosesCount = 0;
  const photosForReport: Array<{ towerName: string; floorName: string; categoryTitle: string; subItemName: string; photoDataUri: string; photoDescription: string; }> = [];
  const ncSummaryCounts: { [categoryId: string]: { categoryTitle: string; isSpecialOrPressure: boolean; ncCategoryItselfCount: number; subItems: { [subItemId: string]: { subItemName: string; count: number } } } } = {};
  INSPECTION_CONFIG.forEach(configCat => {
    ncSummaryCounts[configCat.id] = { categoryTitle: configCat.title, isSpecialOrPressure: configCat.type === 'special' || configCat.type === 'pressure', ncCategoryItselfCount: 0, subItems: {} };
    if (configCat.type === 'standard' && configCat.subItems) { configCat.subItems.forEach(configSubItem => { if (!configSubItem.isRegistry) ncSummaryCounts[configCat.id].subItems[configSubItem.id] = { subItemName: configSubItem.name, count: 0 }; }); }
  });

  towersToActuallyPrint.forEach(tower => {
    tower.floors.forEach(floor => {
      floor.floorRegisteredExtinguishers.forEach(ext => { if (ext.type && ext.quantity > 0) extinguisherTypeTotals[ext.type] = (extinguisherTypeTotals[ext.type] || 0) + ext.quantity; grandTotalExtinguishersCount += (ext.quantity || 0); });
      floor.floorRegisteredHoses.forEach(hose => { if (hose.length && hose.diameter && hose.type && hose.quantity > 0) { const key = `${hose.length}_${hose.diameter}_${hose.type}`; if (!hoseCombinationTotals[key]) hoseCombinationTotals[key] = { quantity: 0, length: hose.length, diameter: hose.diameter, type: hose.type }; hoseCombinationTotals[key].quantity += hose.quantity; } grandTotalHosesCount += (hose.quantity || 0); });
      floor.categories.forEach(category => {
        if (category.type === 'standard' && category.subItems) {
          category.subItems.forEach(subItem => {
            if (!subItem.isRegistry && subItem.photoDataUri) photosForReport.push({ towerName: tower.towerName || 'Torre Não Especificada', floorName: floor.floor || 'Andar Não Especificado', categoryTitle: category.title, subItemName: subItem.name, photoDataUri: subItem.photoDataUri, photoDescription: subItem.photoDescription || '' });
            if (!subItem.isRegistry && subItem.status === 'N/C') if (ncSummaryCounts[category.id] && ncSummaryCounts[category.id].subItems[subItem.id]) ncSummaryCounts[category.id].subItems[subItem.id].count++;
          });
        } else if ((category.type === 'special' || category.type === 'pressure') && category.status === 'N/C') if (ncSummaryCounts[category.id]) ncSummaryCounts[category.id].ncCategoryItselfCount++;
      });
    });
  });
  
  let pdfHtml = `<html><head><title>Relatório Vistoria Técnica - ${clientInfo.inspectionNumber}</title><style>${PDF_COMMON_STYLES}${PDF_SPECIFIC_STYLES_VISTORIA}</style></head><body><div class="pdf-container">`;
  // Cover Page
  pdfHtml += `<div class="first-page-center-container"><header class="pdf-header-main"><div class="pdf-header-content-wrapper"><div class="pdf-logo-container"><img src="${isDataUrl ? logoToUse : (typeof window !== 'undefined' ? window.location.origin + logoToUse : logoToUse) }" alt="Logo"/></div><div class="pdf-company-info-container"><div class="company-name">BRAZIL EXTINTORES - SP</div><div class="company-details"><p>Telefone: (19) 3884-6127 - (19) 9 8183-1813</p><p>OSORIO MACHADO DE PAIVA, 915</p><p>PARQUE BOM RETIRO - Cep: 13142-128 - PAULINIA - SP</p><p>CNPJ: 24.218.850/0001-29 | I.E.: 513096549110</p><p>Registro Inmetro N°: 001459/2018</p><p>e-mail: comercial@brazilexintores.com.br</p></div></div></div></header><section class="pdf-client-info"><h2 class="pdf-main-title">Relatório de Vistoria Técnica</h2><p class="pdf-subtitle">DADOS DO CLIENTE</p><div class="pdf-client-info-grid"><div><strong>Nº Vistoria:</strong> ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'N/A'}</div><div><strong>Data:</strong> ${clientInfo.inspectionDate ? format(new Date(clientInfo.inspectionDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</div><div style="grid-column: 1 / -1;"><strong>Local:</strong> ${clientInfo.clientLocation.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'N/A'}</div><div><strong>Cód. Cliente:</strong> ${clientInfo.clientCode.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'N/A'}</div><div><strong>Vistoriado por:</strong> ${clientInfo.inspectedBy?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'N/A'}</div><div><strong>Gerado em:</strong> ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div></div></section></div><div class="page-break-after"></div>`;

  // Verified Items Summary Page
  pdfHtml += `<section class="pdf-verified-items-summary page-break-avoid"><h3 class="pdf-section-title">Itens e Subitens Verificados na Vistoria (Geral)</h3>`;
  const overallUniqueVerifiedCategoryTitles = new Set<string>(); const categoryToSubitemsMap: Record<string, Set<string>> = {};
  towersToActuallyPrint.forEach(tower => tower.floors.forEach(floor => floor.categories.forEach(category => { let catInteracted = false; if ((category.type === 'special' || category.type === 'pressure') && category.status !== undefined) catInteracted = true; if (category.type === 'standard' && category.subItems) category.subItems.forEach(subItem => { if (!subItem.isRegistry && subItem.status !== undefined) { catInteracted = true; if (!categoryToSubitemsMap[category.title]) categoryToSubitemsMap[category.title] = new Set(); categoryToSubitemsMap[category.title].add(subItem.name); } }); if (catInteracted) overallUniqueVerifiedCategoryTitles.add(category.title); })));
  if (overallUniqueVerifiedCategoryTitles.size > 0) { pdfHtml += `<div class="pdf-verified-items-list">`; INSPECTION_CONFIG.forEach(cfgCat => { if (overallUniqueVerifiedCategoryTitles.has(cfgCat.title)) { pdfHtml += `<div class="category-group"><p class="category-title">${cfgCat.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`; if (cfgCat.type === 'standard' && categoryToSubitemsMap[cfgCat.title]?.size > 0) { pdfHtml += `<ul>`; cfgCat.subItems?.forEach(subCfg => { if (!subCfg.isRegistry && categoryToSubitemsMap[cfgCat.title].has(subCfg.name)) pdfHtml += `<li>${subCfg.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`; }); pdfHtml += `</ul>`; } pdfHtml += `</div>`; } }); pdfHtml += `</div>`; } else { pdfHtml += `<p class="pdf-no-items" style="text-align: center; padding: 12px;">Nenhum item verificado.</p>`; }
  pdfHtml += `</section><div class="page-break-after"></div>`;

  // N/C Items Details Page
  pdfHtml += `<section class="pdf-non-compliant-details page-break-avoid"><h3 class="pdf-section-title">Detalhes de Itens Não Conformes (N/C)</h3>`;
  let anyNonConformingItemsFound = false;
  towersToActuallyPrint.forEach(tower => {
    let towerHasNCItemsForReport = false; let towerNCItemsContent = '';
    tower.floors.forEach(floor => {
      let floorHasNCItemsForReport = false; let floorNCItemsContent = '';
      floor.categories.forEach(category => {
        let catHasNC = false; let catNCContent = '';
        if (category.type === 'standard' && category.subItems) category.subItems.forEach(sub => { if (!sub.isRegistry && sub.status === 'N/C') { catHasNC=true; catNCContent += `<div class="pdf-subitem-wrapper page-break-avoid"><div class="pdf-subitem"><span class="pdf-subitem-name">${sub.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span><span class="pdf-status ${getStatusClass(sub.status)}">${getStatusLabel(sub.status)}</span></div>`; if (sub.showObservation && sub.observation) catNCContent += `<div class="pdf-observation">${sub.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`; catNCContent += `</div>`; }});
        else if ((category.type === 'special' || category.type === 'pressure') && category.status === 'N/C') { catHasNC=true; const detClass = category.type === 'special' ? 'pdf-special-details' : 'pdf-pressure-details'; catNCContent += `<div class="${detClass} page-break-avoid"><p><span class="pdf-subitem-name">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")} Status:</span> <span class="pdf-status ${getStatusClass(category.status)}">${getStatusLabel(category.status)}</span></p>`; if (category.type === 'pressure' && category.status === 'N/C') catNCContent += `<p><span class="pdf-subitem-name">Pressão:</span> <span>${category.pressureValue?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'N/P'} ${category.pressureUnit || ''}</span></p>`; if (category.showObservation && category.observation) catNCContent += `<div class="pdf-observation">${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`; catNCContent += `</div>`; }
        if (catHasNC) { floorHasNCItemsForReport=true; anyNonConformingItemsFound=true; floorNCItemsContent += `<article class="pdf-category-card page-break-avoid"><header class="pdf-category-header"><span class="pdf-category-title-text">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span></header><div class="pdf-category-content">${catNCContent}</div></article>`; }
      });
      if (floorHasNCItemsForReport) { towerHasNCItemsForReport = true; towerNCItemsContent += `<div class="pdf-floor-section page-break-avoid"><h3 class="pdf-floor-title">${(floor.floor || 'Andar Não Especificado').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>${floorNCItemsContent}</div>`; }
    });
    if (towerHasNCItemsForReport) pdfHtml += `<div class="pdf-tower-section page-break-avoid"><h2 class="pdf-tower-title">${(tower.towerName || 'Torre Não Especificada').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>${towerNCItemsContent}</div>`;
  });
  if (!anyNonConformingItemsFound) pdfHtml += `<p class="pdf-no-items" style="text-align: center; padding: 12px;">Nenhum item "Não Conforme" (N/C) encontrado.</p>`;
  pdfHtml += `</section>`;

  // N/C Summary Counts Page
  pdfHtml += `<section class="pdf-nc-summary-section"><h3 class="pdf-section-title">Resumo de Quantidade de Itens Não Conformes (N/C)</h3><div class="pdf-nc-summary-list">`;
  let totalNcItemsForSummaryPage = 0;
  Object.values(ncSummaryCounts).forEach(catSum => {
    let catHasNcForSum = false; if (catSum.isSpecialOrPressure && catSum.ncCategoryItselfCount > 0) { catHasNcForSum = true; totalNcItemsForSummaryPage += catSum.ncCategoryItselfCount; } else if (!catSum.isSpecialOrPressure) Object.values(catSum.subItems).forEach(sub => { if (sub.count > 0) { catHasNcForSum = true; totalNcItemsForSummaryPage += sub.count; }});
    if (catHasNcForSum || true) { pdfHtml += `<div class="category-group"><p class="category-title">${catSum.categoryTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p><ul>`; if (catSum.isSpecialOrPressure) pdfHtml += `<li><span class="item-name">${catSum.categoryTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span> <span class="item-count">${catSum.ncCategoryItselfCount}</span></li>`; else { const subItemsCfg = INSPECTION_CONFIG.find(c => c.id === Object.keys(ncSummaryCounts).find(k => ncSummaryCounts[k].categoryTitle === catSum.categoryTitle))?.subItems; if (subItemsCfg) subItemsCfg.forEach(cfgSub => { if (!cfgSub.isRegistry) { const subData = catSum.subItems[cfgSub.id]; const count = subData ? subData.count : 0; pdfHtml += `<li><span class="item-name">${cfgSub.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span> <span class="item-count">${count}</span></li>`; } }); } pdfHtml += `</ul></div>`; }
  });
  pdfHtml += `</div></section>`;
  
  // Pressure Readings Page
  let anyPressureData = false; towersToActuallyPrint.forEach(t => t.floors.forEach(f => { if (f.floorHasPressureSPK || f.floorHasPressureHidrante) anyPressureData = true; }));
  if (anyPressureData) { pdfHtml += `<div class="two-column-layout page-break-avoid"><section class="pdf-pressure-reading-section"><h3 class="pdf-section-title" style="column-span: all; -webkit-column-span: all;">Registros de Pressão (SPK e Hidrante)</h3>`; towersToActuallyPrint.forEach(tower => { let towerHasPress = false; let towerPressCont = ''; tower.floors.forEach(floor => { if (floor.floorHasPressureSPK || floor.floorHasPressureHidrante) { towerHasPress=true; towerPressCont += `<div class="pdf-floor-section"><h3 class="pdf-floor-title">${(floor.floor || 'Andar N/E').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3><div class="pdf-category-card"><div class="pdf-category-content">`; if (floor.floorHasPressureSPK) towerPressCont += `<p><strong>Pressão SPK:</strong> ${floor.floorPressureSPKValue.replace(/</g, "&lt;").replace(/>/g, "&gt;")} ${floor.floorPressureSPKUnit.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`; else towerPressCont += `<p><strong>Pressão SPK:</strong> <span class="pdf-no-items">N/R ou N/A</span></p>`; if (floor.floorHasPressureHidrante) towerPressCont += `<p><strong>Pressão Hidrante:</strong> ${floor.floorPressureHidranteValue.replace(/</g, "&lt;").replace(/>/g, "&gt;")} ${floor.floorPressureHidranteUnit.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`; else towerPressCont += `<p><strong>Pressão Hidrante:</strong> <span class="pdf-no-items">N/R ou N/A</span></p>`; towerPressCont += `</div></div></div>`; } }); if (towerHasPress) pdfHtml += `<div class="pdf-tower-section"><h2 class="pdf-tower-title">${(tower.towerName || 'Torre N/E').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>${towerPressCont}</div>`; }); pdfHtml += `</section></div>`; }

  // Registered Items Page
  let anyRegItems = false; towersToActuallyPrint.forEach(t => t.floors.forEach(f => { if (f.floorRegisteredExtinguishers.length > 0 || f.floorRegisteredHoses.length > 0) anyRegItems = true; })); if (anyRegItems || grandTotalExtinguishersCount > 0 || grandTotalHosesCount > 0) { pdfHtml += `<div class="two-column-layout page-break-avoid"><section class="pdf-registered-items-outer-section"><h3 class="pdf-section-title" style="column-span: all; -webkit-column-span: all;">Itens Cadastrados</h3>`; if (anyRegItems) towersToActuallyPrint.forEach(tower => { let towerHasReg = false; let towerRegCont = ''; tower.floors.forEach(floor => { if (floor.floorRegisteredExtinguishers.length > 0 || floor.floorRegisteredHoses.length > 0) { towerHasReg=true; towerRegCont += `<div class="pdf-floor-section"><h3 class="pdf-floor-title">${(floor.floor || 'Andar N/E').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3><div class="pdf-registered-items-section">`; if (floor.floorRegisteredExtinguishers.length>0) { towerRegCont += `<h4>Extintores:</h4><ul>`; floor.floorRegisteredExtinguishers.forEach(e => towerRegCont += `<li>${e.quantity}x - ${e.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${e.weight.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`); towerRegCont += `</ul>`; } else towerRegCont += `<h4>Extintores:</h4><p class="pdf-no-items">Nenhum.</p>`; if (floor.floorRegisteredHoses.length>0) { towerRegCont += `<h4>Mangueiras:</h4><ul>`; floor.floorRegisteredHoses.forEach(h => towerRegCont += `<li>${h.quantity}x - ${h.length.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${h.diameter.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${h.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`); towerRegCont += `</ul>`; } else towerRegCont += `<h4>Mangueiras:</h4><p class="pdf-no-items">Nenhuma.</p>`; towerRegCont += `</div></div>`; } }); if (towerHasReg) pdfHtml += `<div class="pdf-tower-section"><h2 class="pdf-tower-title">${(tower.towerName || 'Torre N/E').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>${towerRegCont}</div>`; }); else pdfHtml += `<p class="pdf-no-items" style="text-align: center; padding: 12px; column-span: all; -webkit-column-span: all;">Nenhum item cadastrado.</p>`; pdfHtml += `<div class="pdf-totals-summary"><h4 style="column-span: all; -webkit-column-span: all;">Totais Gerais</h4><p><strong>Extintores:</strong></p><ul class="pdf-type-breakdown">`; let hasExtTot = false; EXTINGUISHER_TYPES.forEach(t => { if (extinguisherTypeTotals[t] && extinguisherTypeTotals[t] > 0) { pdfHtml += `<li>${t.replace(/</g, "&lt;").replace(/>/g, "&gt;")}: ${extinguisherTypeTotals[t]}</li>`; hasExtTot = true; } }); if (!hasExtTot && grandTotalExtinguishersCount === 0) pdfHtml += `<li>Nenhum.</li>`; pdfHtml += `</ul><p><strong>Total Geral Extintores:</strong> ${grandTotalExtinguishersCount}</p><p style="margin-top: 6px;"><strong>Mangueiras:</strong></p><ul class="pdf-type-breakdown">`; let hasHoseTot = false; Object.values(hoseCombinationTotals).forEach(d => { if (d.quantity > 0) { pdfHtml += `<li>${d.quantity}x - ${d.length.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${d.diameter.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${d.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`; hasHoseTot=true; }}); if (!hasHoseTot && grandTotalHosesCount === 0) pdfHtml += `<li>Nenhuma.</li>`; pdfHtml += `</ul><p><strong>Total Geral Mangueiras:</strong> ${grandTotalHosesCount}</p></div></section></div>`; }

  // Photo Report Page
  if (photosForReport.length > 0) { pdfHtml += `<section class="pdf-photo-report-section"><h3 class="pdf-section-title">Registro Fotográfico</h3><div class="pdf-photo-items-container">`; photosForReport.forEach(p => { pdfHtml += `<div class="pdf-photo-item"><img src="${p.photoDataUri}" alt="Foto"/><p><strong>Torre:</strong> ${p.towerName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p><p><strong>Andar:</strong> ${p.floorName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p><p><strong>Categoria:</strong> ${p.categoryTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p><p><strong>Subitem:</strong> ${p.subItemName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p><p class="photo-observation"><strong>Obs:</strong> ${p.photoDescription?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'Nenhuma'}</p></div>`; }); pdfHtml += `</div></section>`; }

  pdfHtml += `<footer class="pdf-footer">FireCheck Brazil &copy; ${new Date().getFullYear()} - BRAZIL EXTINTORES</footer></div></body></html>`;
  const printWindow = window.open('', '_blank');
  if (printWindow) { printWindow.document.open(); printWindow.document.write(pdfHtml); printWindow.document.close(); setTimeout(() => { try { printWindow.focus(); printWindow.print(); } catch (e) { console.error("Error during print:", e); }}, 750); }
}

export function generateRegisteredItemsPdf(clientInfo: ClientInfo, towersData: TowerData[], uploadedLogoDataUrl?: string | null): void {
  const defaultLogoUrl = '/brazil-extintores-logo.png'; const logoToUse = uploadedLogoDataUrl || defaultLogoUrl; const isDataUrl = !!(uploadedLogoDataUrl && uploadedLogoDataUrl.startsWith('data:image'));
  let grandTotalExtinguishersCount = 0; const extinguisherTypeAndWeightTotals: { [type: string]: { [weight: string]: number } } = {}; EXTINGUISHER_TYPES.forEach(t => { extinguisherTypeAndWeightTotals[t] = {}; EXTINGUISHER_WEIGHTS.forEach(w => extinguisherTypeAndWeightTotals[t][w] = 0); });
  let grandTotalHosesCount = 0; const hoseCombinationTotals: { [key: string]: { quantity: number; length: HoseLengthOption; diameter: HoseDiameterOption; type: HoseTypeOption } } = {};
  
  const relevantTowersData = towersData
    .filter(tower => tower && tower.towerName && tower.towerName.trim() !== "")
    .map(tower => ({
      ...tower,
      floors: tower.floors.filter(floor => floor && floor.floor && floor.floor.trim() !== ""),
    }));
  const towersToReport = relevantTowersData.length > 0 ? relevantTowersData : towersData;


  const processedTowersForReport = towersToReport.map(tower => {
    const towerExtinguishers: RegisteredExtinguisher[] = []; const towerHoses: RegisteredHose[] = [];
    tower.floors.forEach(floor => {
      floor.categories.forEach(category => {
        if (category.subItems) category.subItems.forEach(subItem => {
          if (subItem.isRegistry) {
            if (subItem.id === 'extintor_cadastro' && subItem.registeredExtinguishers) { towerExtinguishers.push(...subItem.registeredExtinguishers); subItem.registeredExtinguishers.forEach(ext => { if (ext.type && ext.weight && ext.quantity > 0) { extinguisherTypeAndWeightTotals[ext.type][ext.weight] = (extinguisherTypeAndWeightTotals[ext.type][ext.weight] || 0) + ext.quantity; grandTotalExtinguishersCount += ext.quantity; } }); }
            else if (subItem.id === 'hidrantes_cadastro_mangueiras' && subItem.registeredHoses) { towerHoses.push(...subItem.registeredHoses); subItem.registeredHoses.forEach(hose => { if (hose.length && hose.diameter && hose.type && hose.quantity > 0) { const key = `${hose.length}_${hose.diameter}_${hose.type}`; if (!hoseCombinationTotals[key]) hoseCombinationTotals[key] = { quantity: 0, length: hose.length, diameter: hose.diameter, type: hose.type }; hoseCombinationTotals[key].quantity += hose.quantity; grandTotalHosesCount += hose.quantity; } }); }
          }
        });
      });
    });
    return { towerName: tower.towerName || 'Torre N/E', floors: tower.floors.map(f => ({ floorName: f.floor || 'Andar N/E', extinguishers: f.categories.flatMap(c => c.subItems?.filter(si => si.id === 'extintor_cadastro' && si.isRegistry).flatMap(si => si.registeredExtinguishers || []) || []), hoses: f.categories.flatMap(c => c.subItems?.filter(si => si.id === 'hidrantes_cadastro_mangueiras' && si.isRegistry).flatMap(si => si.registeredHoses || []) || []) })) };
  });

  let pdfHtml = `<html><head><title>Relatório Itens Cadastrados - ${clientInfo.inspectionNumber}</title><style>${PDF_COMMON_STYLES}</style></head><body><div class="pdf-container">`;
  pdfHtml += `<div class="first-page-center-container"><header class="pdf-header-main">...</header><section class="pdf-client-info"><h2 class="pdf-main-title">Relatório de Itens Cadastrados</h2>...</section></div><div class="page-break-after"></div>`; // Header and Client Info (abbreviated)
  pdfHtml += `<div class="two-column-layout page-break-avoid"><section class="pdf-items-by-floor"><h3 class="pdf-section-title" style="column-span: all;">Itens Cadastrados por Torre/Andar</h3>`;
  let anyItemsOnFloors = false;
  processedTowersForReport.forEach(tower => {
    let towerHasItems = false; let towerHtml = '';
    tower.floors.forEach(floor => {
      if (floor.extinguishers.length > 0 || floor.hoses.length > 0) {
        towerHasItems = true; anyItemsOnFloors = true;
        towerHtml += `<div class="pdf-floor-section"><h3 class="pdf-floor-title">${floor.floorName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3><div class="pdf-registered-items-section">`;
        if (floor.extinguishers.length > 0) { towerHtml += `<h4>Extintores:</h4><ul>`; floor.extinguishers.forEach(e => towerHtml += `<li>${e.quantity}x - ${e.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${e.weight.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`); towerHtml += `</ul>`; } else towerHtml += `<h4>Extintores:</h4><p class="pdf-no-items">Nenhum.</p>`;
        if (floor.hoses.length > 0) { towerHtml += `<h4>Mangueiras:</h4><ul>`; floor.hoses.forEach(h => towerHtml += `<li>${h.quantity}x - ${h.length.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${h.diameter.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${h.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`); towerHtml += `</ul>`; } else towerHtml += `<h4>Mangueiras:</h4><p class="pdf-no-items">Nenhuma.</p>`;
        towerHtml += `</div></div>`;
      }
    });
    if(towerHasItems) pdfHtml += `<div class="pdf-tower-section"><h2 class="pdf-tower-title">${tower.towerName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>${towerHtml}</div>`;
  });
  if (!anyItemsOnFloors && (grandTotalExtinguishersCount > 0 || grandTotalHosesCount > 0)) {} // Handled by summary
  else if (!anyItemsOnFloors) pdfHtml += `<p class="pdf-no-items" style="text-align:center; padding: 12px; column-span: all;">Nenhum item cadastrado.</p>`;
  pdfHtml += `</section>`;
  pdfHtml += `<section class="pdf-totals-summary"><h3 class="pdf-section-title" style="column-span: all;">Resumo Geral</h3><h4>Extintores</h4><ul class="pdf-type-breakdown">`;
  let foundExt = false; EXTINGUISHER_TYPES.forEach(t => { let typeHasEnt = false; let typeSub = ''; EXTINGUISHER_WEIGHTS.forEach(w => { if (extinguisherTypeAndWeightTotals[t]?.[w] > 0) { typeHasEnt = true; foundExt = true; typeSub += `<li>${w.replace(/</g, "&lt;").replace(/>/g, "&gt;")}: ${extinguisherTypeAndWeightTotals[t][w]}</li>`; } }); if (typeHasEnt) pdfHtml += `<li><strong>${t.replace(/</g, "&lt;").replace(/>/g, "&gt;")}:</strong><ul>${typeSub}</ul></li>`; }); if (!foundExt && grandTotalExtinguishersCount === 0) pdfHtml += `<li>Nenhum.</li>`;
  pdfHtml += `</ul><p><strong>Total Geral Extintores: ${grandTotalExtinguishersCount}</strong></p><h4 style="margin-top: 12px;">Mangueiras</h4><ul class="pdf-type-breakdown">`;
  if (Object.keys(hoseCombinationTotals).length > 0) Object.values(hoseCombinationTotals).forEach(d => { if (d.quantity > 0) pdfHtml += `<li>${d.quantity}x - ${d.length.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${d.diameter.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${d.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`; }); else if (grandTotalHosesCount === 0) pdfHtml += `<li>Nenhuma.</li>`;
  pdfHtml += `</ul><p><strong>Total Geral Mangueiras: ${grandTotalHosesCount}</strong></p></section></div>`;
  pdfHtml += `<footer class="pdf-footer">...</footer></div></body></html>`; // Footer (abbreviated)
  const printWindow = window.open('', '_blank'); if (printWindow) { printWindow.document.open(); printWindow.document.write(pdfHtml); printWindow.document.close(); setTimeout(() => { try { printWindow.focus(); printWindow.print(); } catch (e) { console.error("Print error:", e); }}, 750); }
}

export function generateNCItemsPdf(clientInfo: ClientInfo, towersData: TowerData[], uploadedLogoDataUrl?: string | null): void {
  const defaultLogoUrl = '/brazil-extintores-logo.png'; const logoToUse = uploadedLogoDataUrl || defaultLogoUrl; const isDataUrl = !!(uploadedLogoDataUrl && uploadedLogoDataUrl.startsWith('data:image'));
  let ncItemsFoundOverall = false;
  let pdfHtml = `<html><head><title>Relatório Itens N/C - ${clientInfo.inspectionNumber}</title><style>${PDF_COMMON_STYLES} .pdf-nc-item-category { font-weight: bold; margin-top: 6px; margin-bottom: 2px; font-size: 9pt; color: #111827 !important; page-break-after: avoid; padding-left: 2px; } .pdf-nc-item-name { margin-left: 10px; font-size: 8pt; color: #1F2937 !important; margin-bottom: 1px; } .pdf-nc-observation { margin-left: 10px; margin-top: 0.5px; margin-bottom: 3px; padding: 3px 5px; background-color: #FEF2F2 !important; border-left: 2px solid #F87171 !important; font-size: 7.5pt; color: #7F1D1D !important; white-space: pre-wrap; word-wrap: break-word; } .pdf-nc-pressure-details { margin-left: 10px; font-size: 8pt; margin-bottom: 1px; } .pdf-nc-items-section { column-count: 2; column-gap: 20px; margin-top: 5px; } .pdf-nc-items-section .pdf-tower-section { break-inside: avoid-column; page-break-inside: avoid; margin-bottom: 10px; } .pdf-nc-items-section .pdf-floor-section { break-inside: avoid-column; page-break-inside: avoid; margin-bottom: 10px; } .pdf-tower-title { font-size: 10.5pt !important; margin-bottom: 4px !important; column-span: all; -webkit-column-span: all; } .pdf-floor-title { font-size: 10pt !important; margin-bottom: 3px !important; } </style></head><body><div class="pdf-container">`;
  pdfHtml += `<header class="pdf-header-main">...</header><section class="pdf-client-info"><h2 class="pdf-main-title">Relatório de Itens Não Conformes (N/C)</h2>...</section>`; // Header and Client Info (abbreviated)
  pdfHtml += `<section class="pdf-nc-items-section"><h3 class="pdf-section-title" style="column-span:all;">Detalhes dos Itens "Não Conforme"</h3>`;
  
  const relevantTowersData = towersData
    .filter(tower => tower && tower.towerName && tower.towerName.trim() !== "")
    .map(tower => ({
      ...tower,
      floors: tower.floors.filter(floor => floor && floor.floor && floor.floor.trim() !== ""),
    }));
  const towersToReport = relevantTowersData.length > 0 ? relevantTowersData : towersData;

  towersToReport.forEach(tower => {
    let towerHasNC = false; let towerHtml = '';
    tower.floors.forEach(floor => {
      let floorHasNC = false; let floorHtml = '';
      INSPECTION_CONFIG.forEach(cfgCat => {
        const category = floor.categories.find(cat => cat.id === cfgCat.id); if (!category) return;
        let catHasNC = false; let catHtml = '';
        if (category.type === 'standard' && category.subItems) cfgCat.subItems?.forEach(cfgSub => { if (cfgSub.isRegistry) return; const sub = category.subItems?.find(si => si.id === cfgSub.id); if (sub && sub.status === 'N/C') { ncItemsFoundOverall=true; floorHasNC=true; catHasNC=true; catHtml += `<div class="pdf-nc-item-name">${sub.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`; if (sub.showObservation && sub.observation) catHtml += `<div class="pdf-nc-observation">${sub.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`; }});
        else if ((category.type === 'special' || category.type === 'pressure') && category.status === 'N/C') { ncItemsFoundOverall=true; floorHasNC=true; catHasNC=true; if (category.type === 'pressure') catHtml += `<div class="pdf-nc-pressure-details">Pressão: ${category.pressureValue?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'N/P'} ${category.pressureUnit || ''}</div>`; if (category.showObservation && category.observation) catHtml += `<div class="pdf-nc-observation">${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`; }
        if (catHasNC) floorHtml += `<div class="pdf-nc-item-category">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>${catHtml}`;
      });
      if (floorHasNC) { towerHasNC = true; towerHtml += `<div class="pdf-floor-section"><h3 class="pdf-floor-title">${(floor.floor || 'Andar N/E').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>${floorHtml}</div>`; }
    });
    if(towerHasNC) pdfHtml += `<div class="pdf-tower-section"><h2 class="pdf-tower-title">${(tower.towerName || 'Torre N/E').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>${towerHtml}</div>`;
  });
  if (!ncItemsFoundOverall) pdfHtml += `<p class="pdf-no-items" style="text-align: center; padding: 12px; column-span:all;">Nenhum item "Não Conforme" (N/C) encontrado.</p>`;
  pdfHtml += `</section><footer class="pdf-footer">...</footer></div></body></html>`; // Footer (abbreviated)
  const printWindow = window.open('', '_blank'); if (printWindow) { printWindow.document.open(); printWindow.document.write(pdfHtml); printWindow.document.close(); setTimeout(() => { try { printWindow.focus(); printWindow.print(); } catch (e) { console.error("Print error:", e); }}, 750); }
}

export function generatePhotoReportPdf(clientInfo: ClientInfo, towersData: TowerData[], uploadedLogoDataUrl?: string | null): void {
  const defaultLogoUrl = '/brazil-extintores-logo.png'; const logoToUse = uploadedLogoDataUrl || defaultLogoUrl; const isDataUrl = !!(uploadedLogoDataUrl && uploadedLogoDataUrl.startsWith('data:image'));
  const photosForReport: Array<{ towerName: string; floorName: string; categoryTitle: string; subItemName: string; photoDataUri: string; photoDescription: string; }> = [];
  
  const relevantTowersData = towersData
    .filter(tower => tower && tower.towerName && tower.towerName.trim() !== "")
    .map(tower => ({
      ...tower,
      floors: tower.floors.filter(floor => floor && floor.floor && floor.floor.trim() !== ""),
    }));
  const towersToReport = relevantTowersData.length > 0 ? relevantTowersData : towersData;

  towersToReport.forEach(tower => tower.floors.forEach(floor => floor.categories.forEach(cat => { if (cat.type === 'standard' && cat.subItems) cat.subItems.forEach(sub => { if (!sub.isRegistry && sub.photoDataUri) photosForReport.push({ towerName: tower.towerName || 'Torre N/E', floorName: floor.floor || 'Andar N/E', categoryTitle: cat.title, subItemName: sub.name, photoDataUri: sub.photoDataUri, photoDescription: sub.photoDescription || '' }); }); })));
  let pdfHtml = `<html><head><title>Relatório Fotográfico - ${clientInfo.inspectionNumber}</title><style>${PDF_COMMON_STYLES}</style></head><body><div class="pdf-container">`;
  pdfHtml += `<header class="pdf-header-main">...</header><section class="pdf-client-info"><h2 class="pdf-main-title">Relatório Fotográfico</h2>...</section>`; // Header and Client Info (abbreviated)
  pdfHtml += `<section class="pdf-photo-report-section-standalone"><h3 class="pdf-section-title">Registro Fotográfico</h3>`;
  if (photosForReport.length > 0) { pdfHtml += `<div class="pdf-photo-items-container">`; photosForReport.forEach(p => { pdfHtml += `<div class="pdf-photo-item"><img src="${p.photoDataUri}" alt="Foto"/><p><strong>Torre:</strong> ${p.towerName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p><p><strong>Andar:</strong> ${p.floorName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p><p><strong>Categoria:</strong> ${p.categoryTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p><p><strong>Subitem:</strong> ${p.subItemName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p><p class="photo-observation"><strong>Obs:</strong> ${p.photoDescription?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'Nenhuma'}</p></div>`; }); pdfHtml += `</div>`; }
  else pdfHtml += `<p class="pdf-no-items" style="text-align: center; padding: 12px;">Nenhuma foto encontrada.</p>`;
  pdfHtml += `</section><footer class="pdf-footer">...</footer></div></body></html>`; // Footer (abbreviated)
  const printWindow = window.open('', '_blank'); if (printWindow) { printWindow.document.open(); printWindow.document.write(pdfHtml); printWindow.document.close(); setTimeout(() => { try { printWindow.focus(); printWindow.print(); } catch (e) { console.error("Print error:", e); }}, 750); }
}
