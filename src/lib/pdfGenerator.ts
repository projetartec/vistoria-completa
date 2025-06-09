
import type { InspectionData, ClientInfo, SubItemState, StatusOption, InspectionCategoryState, RegisteredExtinguisher, RegisteredHose, ExtinguisherTypeOption, HoseLengthOption, HoseDiameterOption, HoseTypeOption, ExtinguisherWeightOption } from './types';
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
  body {
    font-family: 'PT Sans', Arial, sans-serif; margin: 0; padding: 0; line-height: 1.1; font-size: 7.5pt; background-color: #FFFFFF; color: #1A1A1A;
  }
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

  .pdf-section-title {
    font-size: 10pt;
    font-weight: 700;
    color: #1F2937;
    margin-top: 8px;
    margin-bottom: 4px;
    padding-bottom: 2.5px;
    border-bottom: 1.2px solid #2563EB;
    page-break-after: avoid; /* Evita quebra de página/coluna após o título */
  }
  
  .page-break-before { page-break-before: always !important; }
  .page-break-after { page-break-after: always !important; }
  .page-break-avoid { page-break-inside: avoid !important; }


  .pdf-floor-section { margin-bottom: 8px; break-inside: avoid-column; page-break-inside: avoid; }
  .pdf-floor-title { font-size: 10pt; font-weight: 700; color: #1F2937; margin-top: 8px; margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1.5px solid #2563EB; page-break-after: avoid; }
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


  .pdf-footer { text-align: center; margin-top: 12px; padding-top: 6px; border-top: 1px solid #E5E7EB; font-size: 6pt; color: #6B7280; }

  @media print {
    html, body { 
      height: auto; 
      background-color: #FFFFFF !important; 
      margin: 0 !important; 
      padding: 3mm 2mm !important; 
      print-color-adjust: exact !important; 
      -webkit-print-color-adjust: exact !important; 
      font-size: 7.5pt;
      overflow: visible !important;
    }
    .pdf-container { 
      width: 100%; 
      box-shadow: none !important; 
      padding: 0 !important; 
      border: none !important; 
      margin: 0 !important;
      overflow: visible !important;
    }
    .pdf-footer { page-break-before: auto; page-break-inside: avoid; }
    
    .pdf-header-main .company-name, .pdf-client-info .pdf-main-title { color: #2563EB !important; }
    .pdf-header-main .company-details p { color: #374151 !important; }
    .pdf-client-info .pdf-subtitle { color: #6B7280 !important; }
    .pdf-client-info-grid strong { color: #111827 !important; }
    .pdf-section-title, .pdf-floor-title { color: #1F2937 !important; border-bottom-color: #2563EB !important; }
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

    .first-page-center-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; text-align: center; }
    .first-page-center-container .pdf-header-main, .first-page-center-container .pdf-client-info { width: 80%; max-width: 600px; margin-left: auto; margin-right: auto; }
    .two-column-layout { column-count: 2; column-gap: 20px; margin-top: 5px; page-break-inside: avoid;}
    .two-column-layout > * { break-inside: avoid-column; page-break-inside: avoid; }
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


export function generateInspectionPdf(clientInfo: ClientInfo, floorsData: InspectionData[], uploadedLogoDataUrl?: string | null): void {
  if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionDate || !clientInfo.inspectionNumber) {
    alert("CÓDIGO DO CLIENTE, LOCAL, NÚMERO DA VISTORIA e DATA DA VISTORIA são obrigatórios para gerar o PDF.");
    return;
  }
  const relevantFloorsData = floorsData.filter(floor => floor && floor.floor && floor.floor.trim() !== "");
  if (relevantFloorsData.length === 0) {
    alert("Nenhum andar com nome preenchido para incluir no PDF.");
    return;
  }

  const defaultLogoUrl = '/brazil-extintores-logo.png';
  const logoToUse = uploadedLogoDataUrl || defaultLogoUrl;
  const isDataUrl = uploadedLogoDataUrl && uploadedLogoDataUrl.startsWith('data:image');

  const processedFloorsData = relevantFloorsData.map(floor => {
    let floorHasPressureSPK = false;
    let floorPressureSPKValue = '';
    let floorPressureSPKUnit = '';
    let floorHasPressureHidrante = false;
    let floorPressureHidranteValue = '';
    let floorPressureHidranteUnit = '';
    let floorRegisteredExtinguishers: RegisteredExtinguisher[] = [];
    let floorRegisteredHoses: RegisteredHose[] = [];
    
    const categories = floor.categories.map(category => {
      let categoryHasNCItems = false; 

      if (category.id === 'pressao_spk' && category.status !== 'N/A' && category.pressureValue) {
        floorHasPressureSPK = true;
        floorPressureSPKValue = category.pressureValue;
        floorPressureSPKUnit = category.pressureUnit || '';
      }
      if (category.id === 'pressao_hidrante' && category.status !== 'N/A' && category.pressureValue) {
        floorHasPressureHidrante = true;
        floorPressureHidranteValue = category.pressureValue;
        floorPressureHidranteUnit = category.pressureUnit || '';
      }

      if (category.type === 'standard' && category.subItems) {
        const processedSubItems = category.subItems.map(subItem => {
          if (subItem.status === 'N/C' && !subItem.isRegistry) {
            categoryHasNCItems = true;
          }
          if (subItem.isRegistry && subItem.id === 'extintor_cadastro' && subItem.registeredExtinguishers) {
            floorRegisteredExtinguishers.push(...subItem.registeredExtinguishers);
          }
          if (subItem.isRegistry && subItem.id === 'hidrantes_cadastro_mangueiras' && subItem.registeredHoses) {
            floorRegisteredHoses.push(...subItem.registeredHoses);
          }
          return subItem; 
        });
        return { ...category, subItems: processedSubItems, categoryHasNCItems };
      } else if ((category.type === 'special' || category.type === 'pressure') && category.status === 'N/C') { 
          categoryHasNCItems = true;
      }
      return { ...category, categoryHasNCItems };
    });
    return { 
        ...floor, 
        categories,
        floorHasPressureSPK,
        floorPressureSPKValue,
        floorPressureSPKUnit,
        floorHasPressureHidrante,
        floorPressureHidranteValue,
        floorPressureHidranteUnit,
        floorRegisteredExtinguishers,
        floorRegisteredHoses,
    };
  });

  const extinguisherTypeTotals: { [key: string]: number } = {};
  let grandTotalExtinguishersCount = 0;
  
  interface HoseCombinationTotals {
    [key: string]: {
      quantity: number;
      length: HoseLengthOption | '';
      diameter: HoseDiameterOption | '';
      type: HoseTypeOption | '';
    };
  }
  const hoseCombinationTotals: HoseCombinationTotals = {};
  let grandTotalHosesCount = 0;

  processedFloorsData.forEach(floor => {
    floor.floorRegisteredExtinguishers.forEach(ext => {
      if (ext.type && ext.quantity > 0) {
        extinguisherTypeTotals[ext.type] = (extinguisherTypeTotals[ext.type] || 0) + ext.quantity;
      }
      grandTotalExtinguishersCount += (ext.quantity || 0);
    });
    floor.floorRegisteredHoses.forEach(hose => {
      if (hose.length && hose.diameter && hose.type && hose.quantity > 0) {
        const hoseKey = `${hose.length}_${hose.diameter}_${hose.type}`;
        if (!hoseCombinationTotals[hoseKey]) {
          hoseCombinationTotals[hoseKey] = { quantity: 0, length: hose.length, diameter: hose.diameter, type: hose.type };
        }
        hoseCombinationTotals[hoseKey].quantity += hose.quantity;
      }
      grandTotalHosesCount += (hose.quantity || 0);
    });
  });


  let pdfHtml = `
    <html>
      <head>
        <title>Relatório Vistoria Técnica - ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
        <style>
          ${PDF_COMMON_STYLES}
          ${PDF_SPECIFIC_STYLES_VISTORIA}
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <div class="first-page-center-container">
            <header class="pdf-header-main">
              <div class="pdf-header-content-wrapper">
                <div class="pdf-logo-container">
                  <img src="${isDataUrl ? logoToUse : (typeof window !== 'undefined' ? window.location.origin + logoToUse : logoToUse) }" alt="Brazil Extintores Logo" />
                </div>
                <div class="pdf-company-info-container">
                  <div class="company-name">BRAZIL EXTINTORES - SP</div>
                  <div class="company-details">
                    <p>Telefone: (19) 3884-6127 - (19) 9 8183-1813</p>
                    <p>OSORIO MACHADO DE PAIVA, 915</p>
                    <p>PARQUE BOM RETIRO - Cep: 13142-128 - PAULINIA - SP</p>
                    <p>CNPJ: 24.218.850/0001-29 | I.E.: 513096549110</p>
                    <p>Registro Inmetro N°: 001459/2018</p>
                    <p>e-mail: comercial@brazilexintores.com.br</p>
                  </div>
                </div>
              </div>
            </header>

            <section class="pdf-client-info">
              <h2 class="pdf-main-title">Relatório de Vistoria Técnica</h2>
              <p class="pdf-subtitle">DADOS DO CLIENTE</p>
              <div class="pdf-client-info-grid">
                <div><strong>Número da Vistoria:</strong> ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                <div><strong>Data da Vistoria:</strong> ${clientInfo.inspectionDate ? format(new Date(clientInfo.inspectionDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</div>
                <div style="grid-column: 1 / -1;"><strong>Local (Cliente):</strong> ${clientInfo.clientLocation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                <div><strong>Código do Cliente:</strong> ${clientInfo.clientCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                ${clientInfo.inspectedBy ? `<div><strong>Vistoriado por:</strong> ${clientInfo.inspectedBy.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>` : ''}
                <div><strong>Relatório gerado em:</strong> ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
              </div>
            </section>
          </div>
          <div class="page-break-after"></div>

          <!-- Página 2: Lista de Itens e Subitens Verificados (Nomes) -->
          <section class="pdf-verified-items-summary page-break-avoid">
            <h3 class="pdf-section-title">Itens e Subitens Verificados na Vistoria (Geral)</h3>`;
            
  const overallUniqueVerifiedCategoryTitles = new Set<string>();
  const categoryToSubitemsMap: Record<string, Set<string>> = {};

  processedFloorsData.forEach(floor => {
    floor.categories.forEach(category => {
      let categoryWasInteractedWith = false;
      if ((category.type === 'special' || category.type === 'pressure') && category.status !== undefined) {
        categoryWasInteractedWith = true;
      }
      if (category.type === 'standard' && category.subItems) {
        category.subItems.forEach(subItem => {
          if (!subItem.isRegistry && subItem.status !== undefined) {
            categoryWasInteractedWith = true;
            if (!categoryToSubitemsMap[category.title]) {
              categoryToSubitemsMap[category.title] = new Set();
            }
            categoryToSubitemsMap[category.title].add(subItem.name);
          }
        });
      }
      if (categoryWasInteractedWith) {
        overallUniqueVerifiedCategoryTitles.add(category.title);
      }
    });
  });
  
  if (overallUniqueVerifiedCategoryTitles.size > 0) {
    pdfHtml += `<div class="pdf-verified-items-list">`;
    INSPECTION_CONFIG.forEach(configCategory => { // Iterate in defined order
      if (overallUniqueVerifiedCategoryTitles.has(configCategory.title)) {
        pdfHtml += `<div class="category-group">
                      <p class="category-title">${configCategory.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
        if (configCategory.type === 'standard' && categoryToSubitemsMap[configCategory.title]?.size > 0) {
          pdfHtml += `<ul>`;
          // Iterate subitems in their defined order from INSPECTION_CONFIG
          configCategory.subItems?.forEach(subItemConfig => {
            if (!subItemConfig.isRegistry && categoryToSubitemsMap[configCategory.title].has(subItemConfig.name)) {
                 pdfHtml += `<li>${subItemConfig.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
            }
          });
          pdfHtml += `</ul>`;
        }
        pdfHtml += `</div>`;
      }
    });
    pdfHtml += `</div>`;
  } else {
    pdfHtml += `<p class="pdf-no-items" style="text-align: center; padding: 12px;">Nenhum item foi marcado como verificado nesta vistoria.</p>`;
  }

  pdfHtml += `</section>
              <div class="page-break-after"></div>

            <!-- Página 3+: Detalhes de Itens Não Conformes (N/C) -->
            <section class="pdf-non-compliant-details page-break-avoid">
              <h3 class="pdf-section-title">Detalhes de Itens Não Conformes (N/C)</h3>`;

  let anyNonConformingItemsFound = false;
  processedFloorsData.forEach((floor) => {
    let floorHasNCItemsForReport = false;
    let floorNCItemsContent = '';

    floor.categories.forEach(category => {
      let categoryHasNCItemsForReport = false;
      let categoryNCItemsHTML = '';

      if (category.type === 'standard' && category.subItems) {
        category.subItems.forEach(subItem => {
          if (!subItem.isRegistry && subItem.status === 'N/C') { 
            categoryHasNCItemsForReport = true;
            categoryNCItemsHTML += `<div class="pdf-subitem-wrapper page-break-avoid">
                                      <div class="pdf-subitem">
                                        <span class="pdf-subitem-name">${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>
                                        <span class="pdf-status ${getStatusClass(subItem.status)}">${getStatusLabel(subItem.status)}</span>
                                      </div>`;
            if (subItem.showObservation && subItem.observation) {
              categoryNCItemsHTML += `<div class="pdf-observation">${subItem.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
            }
            categoryNCItemsHTML += `</div>`;
          }
        });
      } else if ((category.type === 'special' || category.type === 'pressure') && category.status === 'N/C') { 
        categoryHasNCItemsForReport = true;
        const detailsClass = category.type === 'special' ? 'pdf-special-details' : 'pdf-pressure-details';
        categoryNCItemsHTML += `<div class="${detailsClass} page-break-avoid">
                                  <p><span class="pdf-subitem-name">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")} Status:</span> <span class="pdf-status ${getStatusClass(category.status)}">${getStatusLabel(category.status)}</span></p>`;
        if (category.type === 'pressure' && category.status === 'N/C') { 
             categoryNCItemsHTML += `<p><span class="pdf-subitem-name">Pressão:</span> <span>${category.pressureValue ? category.pressureValue.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'N/P'} ${category.pressureUnit || ''}</span></p>`;
        }
        if (category.showObservation && category.observation) {
          categoryNCItemsHTML += `<div class="pdf-observation">${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
        }
        categoryNCItemsHTML += `</div>`;
      }

      if (categoryHasNCItemsForReport) {
        floorHasNCItemsForReport = true;
        anyNonConformingItemsFound = true;
        floorNCItemsContent += `<article class="pdf-category-card page-break-avoid">
                                  <header class="pdf-category-header">
                                    <span class="pdf-category-title-text">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>
                                  </header>
                                  <div class="pdf-category-content">${categoryNCItemsHTML}</div>
                                </article>`;
      }
    });
    if (floorHasNCItemsForReport) {
        pdfHtml += `<div class="pdf-floor-section page-break-avoid">
                        <h3 class="pdf-floor-title">${floor.floor.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>
                        ${floorNCItemsContent}
                    </div>`;
    }
  });
   if (!anyNonConformingItemsFound) {
    pdfHtml += `<p class="pdf-no-items" style="text-align: center; padding: 12px;">Nenhum item "Não Conforme" (N/C) encontrado nesta vistoria.</p>`;
  }
  pdfHtml += `</section>`;

  // Registros de Pressão
  let anyPressureData = false;
  processedFloorsData.forEach((floor) => {
    if (floor.floorHasPressureSPK || floor.floorHasPressureHidrante) {
      anyPressureData = true;
    }
  });

  if (anyPressureData) {
    pdfHtml += `<div class="two-column-layout page-break-avoid">
                  <section class="pdf-pressure-reading-section">
                    <h3 class="pdf-section-title" style="column-span: all; -webkit-column-span: all;">Registros de Pressão (SPK e Hidrante)</h3>`;
    processedFloorsData.forEach((floor) => {
      if (floor.floorHasPressureSPK || floor.floorHasPressureHidrante) {
        pdfHtml += `<div class="pdf-floor-section">
                      <h3 class="pdf-floor-title">${floor.floor.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>
                      <div class="pdf-category-card">
                        <div class="pdf-category-content">`;
        if (floor.floorHasPressureSPK) {
          pdfHtml += `<p><strong>Pressão SPK:</strong> ${floor.floorPressureSPKValue.replace(/</g, "&lt;").replace(/>/g, "&gt;")} ${floor.floorPressureSPKUnit.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
        } else {
          pdfHtml += `<p><strong>Pressão SPK:</strong> <span class="pdf-no-items">Não registrada ou N/A</span></p>`;
        }
        if (floor.floorHasPressureHidrante) {
          pdfHtml += `<p><strong>Pressão Hidrante:</strong> ${floor.floorPressureHidranteValue.replace(/</g, "&lt;").replace(/>/g, "&gt;")} ${floor.floorPressureHidranteUnit.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
        } else {
          pdfHtml += `<p><strong>Pressão Hidrante:</strong> <span class="pdf-no-items">Não registrada ou N/A</span></p>`;
        }
        pdfHtml += `    </div>
                      </div>
                    </div>`;
      }
    });
    pdfHtml += `  </section>
                </div>`; 
  }


  // Itens Cadastrados (Extintores e Mangueiras)
  let anyRegisteredItemsOnFloors = false;
  processedFloorsData.forEach((floor) => {
    if (floor.floorRegisteredExtinguishers.length > 0 || floor.floorRegisteredHoses.length > 0) {
      anyRegisteredItemsOnFloors = true;
    }
  });

  if (anyRegisteredItemsOnFloors || grandTotalExtinguishersCount > 0 || grandTotalHosesCount > 0) {
    pdfHtml += `<div class="two-column-layout page-break-avoid">
                  <section class="pdf-registered-items-outer-section">
                    <h3 class="pdf-section-title" style="column-span: all; -webkit-column-span: all;">Itens Cadastrados (Extintores e Mangueiras)</h3>`;
    if (anyRegisteredItemsOnFloors) {
        processedFloorsData.forEach((floor) => {
            if (floor.floorRegisteredExtinguishers.length > 0 || floor.floorRegisteredHoses.length > 0) {
            pdfHtml += `<div class="pdf-floor-section">
                            <h3 class="pdf-floor-title">${floor.floor.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>
                            <div class="pdf-registered-items-section">`;
            
            if (floor.floorRegisteredExtinguishers.length > 0) {
                pdfHtml += `<h4>Extintores Cadastrados neste Andar:</h4><ul>`;
                floor.floorRegisteredExtinguishers.forEach(ext => {
                pdfHtml += `<li>${ext.quantity}x - ${ext.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${ext.weight.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
                });
                pdfHtml += `</ul>`;
            } else {
                pdfHtml += `<h4>Extintores Cadastrados neste Andar:</h4><p class="pdf-no-items">Nenhum extintor cadastrado.</p>`;
            }

            if (floor.floorRegisteredHoses.length > 0) {
                pdfHtml += `<h4>Mangueiras Cadastradas neste Andar:</h4><ul>`;
                floor.floorRegisteredHoses.forEach(hose => {
                pdfHtml += `<li>${hose.quantity}x - ${hose.length.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${hose.diameter.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${hose.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
                });
                pdfHtml += `</ul>`;
            } else {
                pdfHtml += `<h4>Mangueiras Cadastradas neste Andar:</h4><p class="pdf-no-items">Nenhuma mangueira cadastrada.</p>`;
            }
            pdfHtml += `  </div>
                        </div>`;
            }
        });
    } else {
         pdfHtml += `<p class="pdf-no-items" style="text-align: center; padding: 12px; column-span: all; -webkit-column-span: all;">Nenhum extintor ou mangueira cadastrado nos andares para esta vistoria.</p>`;
    }

    // Resumo Geral de Itens Cadastrados
    pdfHtml += `<div class="pdf-totals-summary">
                  <h4 style="column-span: all; -webkit-column-span: all;">Totais Gerais de Itens Cadastrados</h4>
                  <p><strong>Total de Extintores Registrados na Vistoria:</strong></p>
                  <ul class="pdf-type-breakdown">`;

    let hasAnyExtinguisherTypeTotal = false;
    EXTINGUISHER_TYPES.forEach(type => {
      if (extinguisherTypeTotals[type] && extinguisherTypeTotals[type] > 0) {
        pdfHtml += `<li>${type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}: ${extinguisherTypeTotals[type]}</li>`;
        hasAnyExtinguisherTypeTotal = true;
      }
    });
    if (!hasAnyExtinguisherTypeTotal && grandTotalExtinguishersCount > 0) {
      pdfHtml += `<li>Total (não especificado por tipo): ${grandTotalExtinguishersCount}</li>`;
    } else if (!hasAnyExtinguisherTypeTotal && grandTotalExtinguishersCount === 0) {
      pdfHtml += `<li>Nenhum extintor cadastrado.</li>`;
    }
    pdfHtml += `</ul>
                <p style="margin-top: 2px;"><strong>Total Geral de Extintores:</strong> ${grandTotalExtinguishersCount}</p>
                
                <p style="margin-top: 6px;"><strong>Total de Mangueiras Registradas na Vistoria:</strong></p>
                <ul class="pdf-type-breakdown">`;
    
    let hasAnyHoseCombinationTotal = false;
    Object.values(hoseCombinationTotals).forEach(detail => {
      if (detail.quantity > 0) {
        pdfHtml += `<li>${detail.quantity}x - ${detail.length.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${detail.diameter.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${detail.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
        hasAnyHoseCombinationTotal = true;
      }
    });
    if (!hasAnyHoseCombinationTotal && grandTotalHosesCount > 0) {
      pdfHtml += `<li>Total (não especificado por combinação): ${grandTotalHosesCount}</li>`;
    } else if (!hasAnyHoseCombinationTotal && grandTotalHosesCount === 0) {
      pdfHtml += `<li>Nenhuma mangueira cadastrada.</li>`;
    }

    pdfHtml += `</ul>
                <p style="margin-top: 2px;"><strong>Total Geral de Mangueiras:</strong> ${grandTotalHosesCount}</p>
              </div>
            </section>
          </div>`; 
  }


  pdfHtml += `
          <footer class="pdf-footer">
            FireCheck Brazil &copy; ${new Date().getFullYear()} - BRAZIL EXTINTORES
          </footer>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(pdfHtml);
    printWindow.document.close();
    setTimeout(() => {
      try {
         printWindow.focus(); 
         printWindow.print();
      } catch (e) {
        console.error("Error during print:", e);
        alert("Ocorreu um erro ao tentar imprimir o PDF. Verifique o console do navegador para mais detalhes.");
      }
    }, 750); 
  } else {
    alert("Não foi possível abrir a janela de impressão. Verifique se o seu navegador está bloqueando pop-ups.");
  }
}

export function generateRegisteredItemsPdf(clientInfo: ClientInfo, floorsData: InspectionData[], uploadedLogoDataUrl?: string | null): void {
  if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionDate || !clientInfo.inspectionNumber) {
    alert("CÓDIGO DO CLIENTE, LOCAL, NÚMERO DA VISTORIA e DATA DA VISTORIA são obrigatórios para gerar o relatório.");
    return;
  }
  const relevantFloorsData = floorsData.filter(floor => floor && floor.floor && floor.floor.trim() !== "");
  if (relevantFloorsData.length === 0) {
    alert("Nenhum andar com nome preenchido para incluir no relatório.");
    return;
  }

  const defaultLogoUrl = '/brazil-extintores-logo.png';
  const logoToUse = uploadedLogoDataUrl || defaultLogoUrl;
  const isDataUrl = uploadedLogoDataUrl && uploadedLogoDataUrl.startsWith('data:image');

  // Aggregate registered items
  let grandTotalExtinguishersCount = 0;
  const extinguisherTypeAndWeightTotals: { [type: string]: { [weight: string]: number } } = {};
  EXTINGUISHER_TYPES.forEach(type => {
    extinguisherTypeAndWeightTotals[type] = {};
    EXTINGUISHER_WEIGHTS.forEach(weight => {
      extinguisherTypeAndWeightTotals[type][weight] = 0;
    });
  });

  let grandTotalHosesCount = 0;
  const hoseCombinationTotals: { [key: string]: { quantity: number; length: HoseLengthOption; diameter: HoseDiameterOption; type: HoseTypeOption } } = {};

  const processedFloorsForReport = relevantFloorsData.map(floor => {
    const floorExtinguishers: RegisteredExtinguisher[] = [];
    const floorHoses: RegisteredHose[] = [];

    floor.categories.forEach(category => {
      if (category.subItems) {
        category.subItems.forEach(subItem => {
          if (subItem.isRegistry) {
            if (subItem.id === 'extintor_cadastro' && subItem.registeredExtinguishers) {
              floorExtinguishers.push(...subItem.registeredExtinguishers);
              subItem.registeredExtinguishers.forEach(ext => {
                if (ext.type && ext.weight && ext.quantity > 0) {
                  extinguisherTypeAndWeightTotals[ext.type][ext.weight] = (extinguisherTypeAndWeightTotals[ext.type][ext.weight] || 0) + ext.quantity;
                  grandTotalExtinguishersCount += ext.quantity;
                }
              });
            } else if (subItem.id === 'hidrantes_cadastro_mangueiras' && subItem.registeredHoses) {
              floorHoses.push(...subItem.registeredHoses);
              subItem.registeredHoses.forEach(hose => {
                 if (hose.length && hose.diameter && hose.type && hose.quantity > 0) {
                    const hoseKey = `${hose.length}_${hose.diameter}_${hose.type}`;
                    if (!hoseCombinationTotals[hoseKey]) {
                        hoseCombinationTotals[hoseKey] = { quantity: 0, length: hose.length, diameter: hose.diameter, type: hose.type };
                    }
                    hoseCombinationTotals[hoseKey].quantity += hose.quantity;
                    grandTotalHosesCount += hose.quantity;
                 }
              });
            }
          }
        });
      }
    });
    return {
      floorName: floor.floor,
      extinguishers: floorExtinguishers,
      hoses: floorHoses,
    };
  });

  let pdfHtml = `
    <html>
      <head>
        <title>Relatório de Itens Cadastrados - ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
        <style>
          ${PDF_COMMON_STYLES}
          /* Add any specific styles for this new report if needed, or reuse common ones */
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <div class="first-page-center-container">
            <header class="pdf-header-main">
              <div class="pdf-header-content-wrapper">
                <div class="pdf-logo-container">
                  <img src="${isDataUrl ? logoToUse : (typeof window !== 'undefined' ? window.location.origin + logoToUse : logoToUse) }" alt="Brazil Extintores Logo" />
                </div>
                <div class="pdf-company-info-container">
                   <div class="company-name">BRAZIL EXTINTORES - SP</div>
                   <div class="company-details">
                      <p>Telefone: (19) 3884-6127 - (19) 9 8183-1813</p>
                      <p>OSORIO MACHADO DE PAIVA, 915</p>
                      <p>PARQUE BOM RETIRO - Cep: 13142-128 - PAULINIA - SP</p>
                      <p>CNPJ: 24.218.850/0001-29 | I.E.: 513096549110</p>
                      <p>Registro Inmetro N°: 001459/2018</p>
                      <p>e-mail: comercial@brazilexintores.com.br</p>
                   </div>
                </div>
              </div>
            </header>

            <section class="pdf-client-info">
              <h2 class="pdf-main-title">Relatório de Itens Cadastrados</h2>
              <p class="pdf-subtitle">DADOS DA VISTORIA</p>
              <div class="pdf-client-info-grid">
                <div><strong>Número da Vistoria:</strong> ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                <div><strong>Data da Vistoria:</strong> ${clientInfo.inspectionDate ? format(new Date(clientInfo.inspectionDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</div>
                <div style="grid-column: 1 / -1;"><strong>Local (Cliente):</strong> ${clientInfo.clientLocation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                <div><strong>Código do Cliente:</strong> ${clientInfo.clientCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                ${clientInfo.inspectedBy ? `<div><strong>Vistoriado por:</strong> ${clientInfo.inspectedBy.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>` : ''}
                <div><strong>Relatório gerado em:</strong> ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
              </div>
            </section>
          </div>
          <div class="page-break-after"></div>

          <div class="two-column-layout page-break-avoid">
            <section class="pdf-items-by-floor">
              <h3 class="pdf-section-title" style="column-span: all; -webkit-column-span: all;">Itens Cadastrados por Andar</h3>`;

  if (processedFloorsForReport.length > 0 && (grandTotalExtinguishersCount > 0 || grandTotalHosesCount > 0)) {
    processedFloorsForReport.forEach(floor => {
      if (floor.extinguishers.length > 0 || floor.hoses.length > 0) {
        pdfHtml += `<div class="pdf-floor-section">
                      <h3 class="pdf-floor-title">${floor.floorName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>
                      <div class="pdf-registered-items-section">`;
        if (floor.extinguishers.length > 0) {
          pdfHtml += `<h4>Extintores Cadastrados:</h4><ul>`;
          floor.extinguishers.forEach(ext => {
            pdfHtml += `<li>${ext.quantity}x - ${ext.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${ext.weight.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
          });
          pdfHtml += `</ul>`;
        } else {
          pdfHtml += `<h4>Extintores Cadastrados:</h4><p class="pdf-no-items">Nenhum extintor cadastrado neste andar.</p>`;
        }
        if (floor.hoses.length > 0) {
          pdfHtml += `<h4>Mangueiras Cadastradas:</h4><ul>`;
          floor.hoses.forEach(hose => {
            pdfHtml += `<li>${hose.quantity}x - ${hose.length.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${hose.diameter.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${hose.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
          });
          pdfHtml += `</ul>`;
        } else {
          pdfHtml += `<h4>Mangueiras Cadastradas:</h4><p class="pdf-no-items">Nenhuma mangueira cadastrada neste andar.</p>`;
        }
        pdfHtml += `  </div></div>`;
      }
    });
  } else {
     pdfHtml += `<p class="pdf-no-items" style="text-align:center; padding: 12px; column-span: all; -webkit-column-span: all;">Nenhum item cadastrado nos andares especificados.</p>`;
  }
  pdfHtml += `</section>
            
            <section class="pdf-totals-summary">
              <h3 class="pdf-section-title" style="column-span: all; -webkit-column-span: all;">Resumo Geral de Itens Cadastrados</h3>
              
              <h4>Extintores</h4>
              <ul class="pdf-type-breakdown">`;
  let foundExtinguishersInSummary = false;
  EXTINGUISHER_TYPES.forEach(type => {
    let typeHasEntries = false;
    let typeSubList = '';
    EXTINGUISHER_WEIGHTS.forEach(weight => {
      if (extinguisherTypeAndWeightTotals[type]?.[weight] > 0) {
        typeHasEntries = true;
        foundExtinguishersInSummary = true;
        typeSubList += `<li>${weight.replace(/</g, "&lt;").replace(/>/g, "&gt;")}: ${extinguisherTypeAndWeightTotals[type][weight]}</li>`;
      }
    });
    if (typeHasEntries) {
      pdfHtml += `<li><strong>${type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}:</strong><ul>${typeSubList}</ul></li>`;
    }
  });
  if (!foundExtinguishersInSummary && grandTotalExtinguishersCount === 0) {
    pdfHtml += `<li>Nenhum extintor cadastrado.</li>`;
  } else if (!foundExtinguishersInSummary && grandTotalExtinguishersCount > 0) {
     pdfHtml += `<li>Total (detalhes não especificados): ${grandTotalExtinguishersCount}</li>`;
  }
  pdfHtml += `</ul>
              <p><strong>Total Geral de Extintores: ${grandTotalExtinguishersCount}</strong></p>

              <h4 style="margin-top: 12px;">Mangueiras</h4>
              <ul class="pdf-type-breakdown">`;
  if (Object.keys(hoseCombinationTotals).length > 0) {
    Object.values(hoseCombinationTotals).forEach(detail => {
      if (detail.quantity > 0) {
         pdfHtml += `<li>${detail.quantity}x - ${detail.length.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${detail.diameter.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${detail.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
      }
    });
  } else if (grandTotalHosesCount === 0){
    pdfHtml += `<li>Nenhuma mangueira cadastrada.</li>`;
  } else {
     pdfHtml += `<li>Total (detalhes não especificados): ${grandTotalHosesCount}</li>`;
  }
  pdfHtml += `</ul>
              <p><strong>Total Geral de Mangueiras: ${grandTotalHosesCount}</strong></p>
            </section>
          </div>
          <footer class="pdf-footer">
            FireCheck Brazil &copy; ${new Date().getFullYear()} - BRAZIL EXTINTORES
          </footer>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(pdfHtml);
    printWindow.document.close();
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.error("Error during print:", e);
        alert("Ocorreu um erro ao tentar imprimir o PDF. Verifique o console do navegador para mais detalhes.");
      }
    }, 750);
  } else {
    alert("Não foi possível abrir a janela de impressão. Verifique se o seu navegador está bloqueando pop-ups.");
  }
}

export function generateNCItemsPdf(clientInfo: ClientInfo, floorsData: InspectionData[], uploadedLogoDataUrl?: string | null): void {
  if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionDate || !clientInfo.inspectionNumber) {
    alert("CÓDIGO DO CLIENTE, LOCAL, NÚMERO DA VISTORIA e DATA DA VISTORIA são obrigatórios para gerar o relatório N/C.");
    return;
  }
  const relevantFloorsData = floorsData.filter(floor => floor && floor.floor && floor.floor.trim() !== "");
  if (relevantFloorsData.length === 0) {
    alert("Nenhum andar com nome preenchido para incluir no relatório N/C.");
    return;
  }

  const defaultLogoUrl = '/brazil-extintores-logo.png';
  const logoToUse = uploadedLogoDataUrl || defaultLogoUrl;
  const isDataUrl = uploadedLogoDataUrl && uploadedLogoDataUrl.startsWith('data:image');

  let ncItemsFoundOverall = false;

  let pdfHtml = `
    <html>
      <head>
        <title>Relatório de Itens N/C - ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
        <style>
          ${PDF_COMMON_STYLES}
          ${PDF_SPECIFIC_STYLES_VISTORIA} /* Reusing some styles */
          .pdf-nc-item-category { font-weight: bold; margin-top: 5px; margin-bottom: 1px; font-size: 8.5pt; color: #111827 !important; page-break-after: avoid;}
          .pdf-nc-item-name { margin-left: 6px; font-size: 8pt; color: #1F2937 !important;}
          .pdf-nc-observation { margin-left: 6px; margin-top: 0.3px; padding: 2.5px 4px; background-color: #FEF2F2 !important; border-left: 1.5px solid #F87171 !important; font-size: 7.5pt; color: #7F1D1D !important; white-space: pre-wrap;}
          .pdf-nc-pressure-details { margin-left: 6px; font-size: 7.5pt;}
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <header class="pdf-header-main">
             <div class="pdf-header-content-wrapper">
              <div class="pdf-logo-container">
                <img src="${isDataUrl ? logoToUse : (typeof window !== 'undefined' ? window.location.origin + logoToUse : logoToUse) }" alt="Brazil Extintores Logo" />
              </div>
              <div class="pdf-company-info-container">
                 <div class="company-name">BRAZIL EXTINTORES - SP</div>
                 <div class="company-details">
                    <p>Telefone: (19) 3884-6127 - (19) 9 8183-1813</p>
                    <p>OSORIO MACHADO DE PAIVA, 915</p>
                    <p>PARQUE BOM RETIRO - Cep: 13142-128 - PAULINIA - SP</p>
                    <p>CNPJ: 24.218.850/0001-29 | I.E.: 513096549110</p>
                    <p>Registro Inmetro N°: 001459/2018</p>
                    <p>e-mail: comercial@brazilexintores.com.br</p>
                 </div>
              </div>
            </div>
          </header>

          <section class="pdf-client-info">
            <h2 class="pdf-main-title">Relatório de Itens Não Conformes (N/C)</h2>
            <p class="pdf-subtitle">DADOS DA VISTORIA</p>
            <div class="pdf-client-info-grid">
              <div><strong>Número da Vistoria:</strong> ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              <div><strong>Data da Vistoria:</strong> ${clientInfo.inspectionDate ? format(new Date(clientInfo.inspectionDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</div>
              <div style="grid-column: 1 / -1;"><strong>Local (Cliente):</strong> ${clientInfo.clientLocation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              <div><strong>Código do Cliente:</strong> ${clientInfo.clientCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              ${clientInfo.inspectedBy ? `<div><strong>Vistoriado por:</strong> ${clientInfo.inspectedBy.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>` : ''}
              <div><strong>Relatório gerado em:</strong> ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
            </div>
          </section>

          <section class="pdf-nc-items-section page-break-avoid">
            <h3 class="pdf-section-title">Detalhes dos Itens Marcados como "Não Conforme"</h3>`;

  relevantFloorsData.forEach(floor => {
    let floorHasNCItems = false;
    let floorNCItemsHtml = '';

    floor.categories.forEach(category => {
      let categoryHasNCItems = false;
      let categoryNCItemsHtml = '';

      if (category.type === 'standard' && category.subItems) {
        category.subItems.forEach(subItem => {
          if (!subItem.isRegistry && subItem.status === 'N/C') {
            floorHasNCItems = true;
            categoryHasNCItems = true;
            ncItemsFoundOverall = true;
            categoryNCItemsHtml += `<div class="pdf-nc-item-name">${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
            if (subItem.showObservation && subItem.observation) {
              categoryNCItemsHtml += `<div class="pdf-nc-observation">${subItem.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
            }
          }
        });
      } else if ((category.type === 'special' || category.type === 'pressure') && category.status === 'N/C') {
        floorHasNCItems = true;
        categoryHasNCItems = true;
        ncItemsFoundOverall = true;
        // For special/pressure, the category title itself is the item
        if (category.type === 'pressure') {
          categoryNCItemsHtml += `<div class="pdf-nc-pressure-details">Pressão: ${category.pressureValue ? category.pressureValue.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'N/P'} ${category.pressureUnit || ''}</div>`;
        }
        if (category.showObservation && category.observation) {
          categoryNCItemsHtml += `<div class="pdf-nc-observation">${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
        }
      }

      if (categoryHasNCItems) {
        floorNCItemsHtml += `<div class="pdf-nc-item-category">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>${categoryNCItemsHtml}`;
      }
    });

    if (floorHasNCItems) {
      pdfHtml += `<div class="pdf-floor-section page-break-avoid" style="margin-bottom: 6px;">
                    <h3 class="pdf-floor-title" style="font-size: 10.5pt; margin-bottom: 3px;">${floor.floor.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>
                    ${floorNCItemsHtml}
                  </div>`;
    }
  });

  if (!ncItemsFoundOverall) {
    pdfHtml += `<p class="pdf-no-items" style="text-align: center; padding: 12px;">Nenhum item "Não Conforme" (N/C) encontrado nesta vistoria.</p>`;
  }

  pdfHtml += `  </section>
                <footer class="pdf-footer">
                  FireCheck Brazil &copy; ${new Date().getFullYear()} - BRAZIL EXTINTORES
                </footer>
              </div>
            </body>
          </html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(pdfHtml);
    printWindow.document.close();
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.error("Error during print:", e);
        alert("Ocorreu um erro ao tentar imprimir o PDF. Verifique o console do navegador para mais detalhes.");
      }
    }, 750);
  } else {
    alert("Não foi possível abrir a janela de impressão. Verifique se o seu navegador está bloqueando pop-ups.");
  }
}

