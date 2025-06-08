
import type { InspectionData, ClientInfo, SubItemState, StatusOption, InspectionCategoryState, RegisteredExtinguisher, RegisteredHose, ExtinguisherTypeOption, HoseLengthOption, HoseDiameterOption, HoseTypeOption } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { INSPECTION_CONFIG, EXTINGUISHER_TYPES, HOSE_LENGTHS, HOSE_DIAMETERS, HOSE_TYPES } from '@/constants/inspection.config';

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
    let floorHasNonConformingItems = false; // Only N/C

    const categories = floor.categories.map(category => {
      let hasVerifiedItemsFloor = false;
      let categoryHasNCItems = false; // Only N/C

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
          const isVerified = subItem.status !== undefined && !subItem.isRegistry;
          if (isVerified) {
            hasVerifiedItemsFloor = true;
          }
          if (isVerified && subItem.status === 'N/C') {
            categoryHasNCItems = true;
            floorHasNonConformingItems = true;
          }
          if (subItem.isRegistry && subItem.id === 'extintor_cadastro' && subItem.registeredExtinguishers) {
            floorRegisteredExtinguishers.push(...subItem.registeredExtinguishers);
          }
          if (subItem.isRegistry && subItem.id === 'hidrantes_cadastro_mangueiras' && subItem.registeredHoses) {
            floorRegisteredHoses.push(...subItem.registeredHoses);
          }
          return { ...subItem, isVerified };
        });
        return { ...category, subItems: processedSubItems, hasVerifiedItemsFloor, categoryHasNCItems };
      } else if (category.type === 'special' || category.type === 'pressure') {
        if (category.status !== undefined) {
          hasVerifiedItemsFloor = true;
        }
        if (category.status === 'N/C') { 
          categoryHasNCItems = true;
          floorHasNonConformingItems = true;
        }
      }
      return { ...category, hasVerifiedItemsFloor, categoryHasNCItems };
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
        floorHasNonConformingItems
    };
  });

  // Calculate totals for extinguishers by type and hoses by characteristics
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
        <title>Relatório Resumido - ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap');
          body {
            font-family: 'PT Sans', Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.5; font-size: 10pt; background-color: #FFFFFF; color: #1A1A1A;
          }
          .pdf-container { max-width: 850px; margin: 0 auto; background-color: #FFFFFF; padding: 25px; border: 1px solid #DDD; }
          .pdf-header-main { display: flex; flex-direction: row; justify-content: center; align-items: center; border-bottom: 2px solid #D1D5DB; padding-bottom: 15px; margin-bottom: 25px; }
          .pdf-header-content-wrapper { display: flex; align-items: center; gap: 20px; }
          .pdf-logo-container { flex-shrink: 0; }
          .pdf-logo-container img { max-height: 112px; width: auto; max-width: 224px; display: block; }
          .pdf-company-info-container { text-align: left; }
          .pdf-header-main .company-name { font-size: 18pt; font-weight: 700; color: #2563EB; margin-bottom: 5px; }
          .pdf-header-main .company-details p { font-size: 9pt; color: #374151; margin: 2px 0; line-height: 1.3; }
          .pdf-client-info { border: 1px solid #D1D5DB; border-radius: 8px; padding: 20px; margin-bottom: 30px; background-color: #F9FAFB; }
          .pdf-client-info .pdf-main-title { font-size: 18pt; font-weight: 700; color: #2563EB; margin-top: 0; margin-bottom: 5px; text-align: center; }
          .pdf-client-info .pdf-subtitle { font-size: 12pt; font-weight: 700; color: #6B7280; margin-top: 0; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #E5E7EB; text-align: center; }
          .pdf-client-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; font-size: 10pt; text-align: left; }
          .pdf-client-info-grid div { padding: 3px 0; }
          .pdf-client-info-grid strong { color: #111827; font-weight: 600; }

          .pdf-section-title { font-size: 16pt; font-weight: 700; color: #1F2937; margin-top: 25px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #2563EB; }
          
          .pdf-verified-summary-overall { margin-bottom: 20px; page-break-inside: avoid; }
          .pdf-verified-summary-overall h4 { font-size: 13pt; font-weight: 600; color: #374151; margin-top: 0; margin-bottom: 10px; }
          .pdf-verified-summary-category-overall { margin-bottom: 8px; }
          .pdf-verified-summary-category-title-overall { font-size: 11pt; font-weight: 600; color: #111827; margin-bottom: 4px; }
          .pdf-verified-summary-overall ul { list-style: disc; margin-left: 20px; padding-left: 0; margin-top: 0; margin-bottom: 5px; }
          .pdf-verified-summary-overall li { font-size: 10pt; color: #4B5563; margin-bottom: 2px; }


          .page-break-before { page-break-before: always; }

          .pdf-floor-section { margin-bottom: 30px; }
          .pdf-floor-title { font-size: 18pt; font-weight: 700; color: #1F2937; margin-top: 25px; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 3px solid #2563EB; }
          .pdf-floor-section:first-of-type .pdf-floor-title { margin-top: 10px; }
          .pdf-category-card { background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); page-break-inside: avoid; }
          .pdf-category-header { display: flex; align-items: center; padding: 10px 15px; background-color: #F3F4F6; border-bottom: 1px solid #E5E7EB; border-top-left-radius: 8px; border-top-right-radius: 8px; }
          .pdf-category-title-text { font-size: 13pt; font-weight: 600; color: #111827; flex-grow: 1; }
          .pdf-category-content { padding: 15px; font-size: 10pt; }
          .pdf-subitem-wrapper { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #E5E7EB; page-break-inside: avoid; }
          .pdf-subitem-wrapper:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
          .pdf-subitem { display: flex; justify-content: space-between; align-items: center; }
          .pdf-subitem-name { font-weight: 600; color: #1F2937; flex-grow: 1; margin-right: 10px; }
          .pdf-status { padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 0.9em; white-space: nowrap; }
          .status-ok { background-color: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }
          .status-nc { background-color: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; }
          .status-na { background-color: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
          .status-pending { background-color: #F3F4F6; color: #4B5563; border: 1px solid #D1D5DB; }
          .pdf-observation { color: #4B5563; margin-top: 6px; padding: 8px 10px; background-color: #F9FAFB; border-left: 3px solid #9CA3AF; font-size: 0.95em; white-space: pre-wrap; width: 100%; box-sizing: border-box; }
          .pdf-pressure-details p, .pdf-special-details p { margin: 4px 0 8px 0; display: flex; justify-content: space-between; align-items: center; }
          .pdf-pressure-details .pdf-subitem-name, .pdf-special-details .pdf-subitem-name { flex-grow: 0; font-weight: 600; }
          
          .pdf-registered-items-section { margin-top: 20px; }
          .pdf-registered-items-section h4 { font-size: 12pt; font-weight: 600; color: #374151; margin-top: 15px; margin-bottom: 8px; }
          .pdf-registered-items-section ul { list-style: disc; margin-left: 25px; padding-left: 0; margin-top: 0; margin-bottom: 10px; }
          .pdf-registered-items-section li { font-size: 10pt; color: #4B5563; margin-bottom: 3px; }
          .pdf-no-items { font-style: italic; color: #6B7280; margin-left: 5px; }
          
          .pdf-totals-summary { margin-top: 30px; padding-top: 15px; border-top: 1px solid #E5E7EB; }
          .pdf-totals-summary h4 { font-size: 13pt; font-weight: 600; color: #111827; margin-bottom: 10px; }
          .pdf-totals-summary p { font-size: 11pt; color: #1F2937; margin-bottom: 5px; }
          .pdf-totals-summary .pdf-type-breakdown { list-style: none; padding-left: 15px; margin-top: 2px; margin-bottom: 8px; }
          .pdf-totals-summary .pdf-type-breakdown li { font-size: 10pt; color: #374151; margin-bottom: 1px; }


          .pdf-footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 9pt; color: #6B7280; }

          @media print {
            html, body { height: auto; background-color: #FFFFFF !important; margin: 0 !important; padding: 10mm 8mm !important; print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; font-size: 10pt; }
            .pdf-container { width: 100%; box-shadow: none !important; padding: 0 !important; border: none !important; margin: 0 !important; }
            .pdf-header-main, .pdf-client-info, .pdf-verified-summary-overall, .pdf-pressure-reading-section, .pdf-registered-items-outer-section { page-break-after: avoid; }
            .pdf-section-title { page-break-after: avoid; }
            .pdf-footer { page-break-before: auto; page-break-inside: avoid; }
            .pdf-floor-section { page-break-inside: avoid; page-break-before: auto; }
            .pdf-floor-section:first-of-type { page-break-before: avoid; }
            .pdf-category-card { page-break-inside: avoid !important; box-shadow: none !important; border: 1px solid #E5E7EB !important; }
            .pdf-subitem-wrapper { page-break-inside: avoid !important; }
            .pdf-header-main .company-name, .pdf-client-info .pdf-main-title { color: #2563EB !important; }
            .pdf-header-main .company-details p { color: #374151 !important; }
            .pdf-client-info .pdf-subtitle { color: #6B7280 !important; }
            .pdf-client-info-grid strong { color: #111827 !important; }
            .pdf-section-title, .pdf-floor-title { color: #1F2937 !important; border-bottom-color: #2563EB !important; }
            .pdf-verified-summary-overall h4 { color: #374151 !important; }
            .pdf-verified-summary-category-title-overall { color: #111827 !important; }
            .pdf-verified-summary-overall li { color: #4B5563 !important; }
            .pdf-category-title-text { color: #111827 !important; }
            .pdf-subitem-name { color: #1F2937 !important; }
            .pdf-observation { color: #4B5563 !important; border-left: 3px solid #9CA3AF !important; background-color: #F9FAFB !important; }
            .status-ok { background-color: #ECFDF5 !important; color: #047857 !important; border: 1px solid #A7F3D0 !important; }
            .status-nc { background-color: #FEF2F2 !important; color: #B91C1C !important; border: 1px solid #FECACA !important; }
            .status-na { background-color: #FFFBEB !important; color: #B45309 !important; border: 1px solid #FDE68A !important; }
            .status-pending { background-color: #F3F4F6 !important; color: #4B5563 !important; border: 1px solid #D1D5DB !important; }
            .pdf-registered-items-section h4 { color: #374151 !important; }
            .pdf-registered-items-section li { color: #4B5563 !important; }
            .pdf-no-items { color: #6B7280 !important; }
            .pdf-totals-summary h4 { color: #111827 !important; }
            .pdf-totals-summary p { color: #1F2937 !important; }
            .pdf-totals-summary .pdf-type-breakdown li { color: #374151 !important; }
          }
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
            <h2 class="pdf-main-title">Relatório Resumido de Vistoria Técnica</h2>
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

          <section class="pdf-verified-summary-overall">
            <h3 class="pdf-section-title">Itens e Subitens Verificados na Vistoria (Geral)</h3>`;
            
  const overallUniqueVerifiedCategories = new Set<string>();
  const overallUniqueVerifiedSubItems = new Set<string>(); // Stores "categoryId_subItemId"

  processedFloorsData.forEach(floor => {
    floor.categories.forEach(category => {
      if (category.hasVerifiedItemsFloor) {
        overallUniqueVerifiedCategories.add(category.id);
        if (category.type === 'standard' && category.subItems) {
          category.subItems.forEach(subItem => {
            if (subItem.isVerified && !subItem.isRegistry) { // Only non-registry items for this list
              overallUniqueVerifiedSubItems.add(`${category.id}_${subItem.id}`);
            }
          });
        }
      }
    });
  });
  
  INSPECTION_CONFIG.forEach(configCategory => {
    if (overallUniqueVerifiedCategories.has(configCategory.id)) {
      pdfHtml += `<div class="pdf-verified-summary-category-overall">
                    <p class="pdf-verified-summary-category-title-overall">${configCategory.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
      if (configCategory.type === 'standard' && configCategory.subItems) {
        const verifiedSubItemsForThisConfigCategory = configCategory.subItems.filter(subItemConfig => 
          !subItemConfig.isRegistry && overallUniqueVerifiedSubItems.has(`${configCategory.id}_${subItemConfig.id}`)
        );
        if (verifiedSubItemsForThisConfigCategory.length > 0) {
          pdfHtml += `<ul>`;
          verifiedSubItemsForThisConfigCategory.forEach(subItemConfig => {
            pdfHtml += `<li>${subItemConfig.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
          });
          pdfHtml += `</ul>`;
        }
      }
      pdfHtml += `</div>`;
    }
  });

  pdfHtml += `</section>

            <div class="page-break-before"></div>

            <section class="pdf-non-compliant-details">
              <h3 class="pdf-section-title">Detalhes de Itens Não Conformes (N/C)</h3>`;

  let anyNonConformingItemsFound = false;
  processedFloorsData.forEach((floor) => {
    if (floor.floorHasNonConformingItems) {
      anyNonConformingItemsFound = true;
      pdfHtml += `<div class="pdf-floor-section">
                    <h3 class="pdf-floor-title">${floor.floor.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>`;
      floor.categories.forEach(category => {
        if (category.categoryHasNCItems) {
          pdfHtml += `<article class="pdf-category-card">
                        <header class="pdf-category-header">
                          <span class="pdf-category-title-text">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>
                        </header>
                        <div class="pdf-category-content">`;
          
          if (category.type === 'standard' && category.subItems) {
            category.subItems.forEach(subItem => {
              if (!subItem.isRegistry && subItem.status === 'N/C') { // Only N/C
                pdfHtml += `<div class="pdf-subitem-wrapper">
                              <div class="pdf-subitem">
                                <span class="pdf-subitem-name">${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>
                                <span class="pdf-status ${getStatusClass(subItem.status)}">${getStatusLabel(subItem.status)}</span>
                              </div>`;
                if (subItem.showObservation && subItem.observation) {
                  pdfHtml += `<div class="pdf-observation">${subItem.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
                }
                pdfHtml += `</div>`;
              }
            });
          } else if ((category.type === 'special' || category.type === 'pressure') && category.status === 'N/C') { // Only N/C
            const detailsClass = category.type === 'special' ? 'pdf-special-details' : 'pdf-pressure-details';
            pdfHtml += `<div class="${detailsClass}">
                          <p><span class="pdf-subitem-name">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")} Status:</span> <span class="pdf-status ${getStatusClass(category.status)}">${getStatusLabel(category.status)}</span></p>`;
            if (category.type === 'pressure' && category.status !== 'N/A') { 
                 pdfHtml += `<p><span class="pdf-subitem-name">Pressão:</span> <span>${category.pressureValue ? category.pressureValue.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'N/P'} ${category.pressureUnit || ''}</span></p>`;
            }
            if (category.showObservation && category.observation) {
              pdfHtml += `<div class="pdf-observation">${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
            }
            pdfHtml += `</div>`;
          }
          pdfHtml += `    </div>
                      </article>`;
        }
      });
      pdfHtml += `  </div>`;
    }
  });
   if (!anyNonConformingItemsFound) {
    pdfHtml += `<p class="pdf-no-items" style="text-align: center; padding: 20px;">Nenhum item "Não Conforme" (N/C) encontrado nesta vistoria.</p>`;
  }
  pdfHtml += `</section>`;

  pdfHtml += `<div class="page-break-before"></div>
              <section class="pdf-pressure-reading-section">
                <h3 class="pdf-section-title">Registros de Pressão (SPK e Hidrante)</h3>`;
  let anyPressureData = false;
  processedFloorsData.forEach((floor) => {
    if (floor.floorHasPressureSPK || floor.floorHasPressureHidrante) {
      anyPressureData = true;
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
  if (!anyPressureData) {
    pdfHtml += `<p class="pdf-no-items" style="text-align: center; padding: 20px;">Nenhum registro de pressão (SPK ou Hidrante) encontrado para esta vistoria.</p>`;
  }
  pdfHtml += `</section>`;


  pdfHtml += `<div class="page-break-before"></div>
              <section class="pdf-registered-items-outer-section">
                <h3 class="pdf-section-title">Itens Cadastrados (Extintores e Mangueiras)</h3>`;
  let anyRegisteredItemsOnFloors = false;
  processedFloorsData.forEach((floor) => {
    if (floor.floorRegisteredExtinguishers.length > 0 || floor.floorRegisteredHoses.length > 0) {
      anyRegisteredItemsOnFloors = true;
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

   if (!anyRegisteredItemsOnFloors && grandTotalExtinguishersCount === 0 && grandTotalHosesCount === 0) {
    pdfHtml += `<p class="pdf-no-items" style="text-align: center; padding: 20px;">Nenhum extintor ou mangueira cadastrado nesta vistoria.</p>`;
  }

  pdfHtml += `<div class="pdf-totals-summary">
                <h4>Totais Gerais de Itens Cadastrados</h4>
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
              <p style="margin-top: 5px;"><strong>Total Geral de Extintores:</strong> ${grandTotalExtinguishersCount}</p>
              
              <p style="margin-top: 10px;"><strong>Total de Mangueiras Registradas na Vistoria:</strong></p>
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
              <p style="margin-top: 5px;"><strong>Total Geral de Mangueiras:</strong> ${grandTotalHosesCount}</p>
            </div>
          </section>`;


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
