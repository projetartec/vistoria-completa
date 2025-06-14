
import type { FloorData, TowerData, ClientInfo, SubItemState, StatusOption, InspectionCategoryState, RegisteredExtinguisher, RegisteredHose, ExtinguisherTypeOption, HoseLengthOption, HoseDiameterOption, HoseTypeOption, ExtinguisherWeightOption } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { INSPECTION_CONFIG, EXTINGUISHER_TYPES, EXTINGUISHER_WEIGHTS, HOSE_LENGTHS, HOSE_DIAMETERS, HOSE_TYPES } from '@/constants/inspection.config';


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
  body { font-family: 'PT Sans', Arial, sans-serif; margin: 0; padding: 0; line-height: 1.2; font-size: 9pt; background-color: #FFFFFF; color: #1A1A1A; }
  .pdf-container { padding: 20mm; width: auto; /* Adjusted for print */ }
  .pdf-header-main { display: flex; flex-direction: row; justify-content: space-between; align-items: center; border-bottom: 1px solid #D1D5DB; padding-bottom: 10px; margin-bottom: 10px; }
  .pdf-logo-container img { max-height: 70px; width: auto; max-width: 180px; display: block; }
  .pdf-company-info-container { text-align: left; }
  .pdf-header-main .company-name { font-size: 14pt; font-weight: 700; color: #2563EB; margin-bottom: 2px; }
  .pdf-header-main .company-details p { font-size: 8pt; color: #374151; margin: 1px 0; line-height: 1.1; }
  
  .pdf-client-info { border: 1px solid #D1D5DB; border-radius: 6px; padding: 10px; margin-bottom: 15px; background-color: #F9FAFB; }
  .pdf-client-info .pdf-main-title { font-size: 16pt; font-weight: 700; color: #2563EB; margin-top: 0; margin-bottom: 5px; text-align: center; }
  .pdf-client-info .pdf-subtitle { font-size: 11pt; font-weight: 700; color: #6B7280; margin-top: 0; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #E5E7EB; text-align: center; }
  .pdf-client-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 10px; font-size: 9pt; }
  .pdf-client-info-grid div { padding: 2px 0; }
  .pdf-client-info-grid strong { color: #111827; font-weight: 600; }
  
  .pdf-section-title { font-size: 12pt; font-weight: 700; color: #1F2937; margin-top: 20px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1.5px solid #2563EB; }
  
  .pdf-tower-section { margin-bottom: 15px; border: 1px solid #DDD; padding: 10px; border-radius: 6px; background-color: #fdfdfd; page-break-inside: avoid; }
  .pdf-tower-title { font-size: 11pt; font-weight: bold; color: #111827; margin-top: 5px; margin-bottom: 10px; padding: 5px; background-color: #E0E7FF; border-radius: 4px; text-align: center; }
  .pdf-floor-section { margin-bottom: 10px; padding-left: 15px; border-left: 3px solid #BFDBFE; page-break-inside: avoid; }
  .pdf-floor-title { font-size: 10pt; font-weight: 700; color: #1F2937; margin-top: 10px; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid #60A5FA; }
  
  .pdf-category-card { background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 4px; margin-bottom: 8px; page-break-inside: avoid; }
  .pdf-category-header { display: flex; align-items: center; padding: 5px 8px; background-color: #F3F4F6; border-bottom: 1px solid #E5E7EB; }
  .pdf-category-title-text { font-size: 10pt; font-weight: 600; color: #111827; flex-grow: 1; }
  .pdf-category-content { padding: 8px; font-size: 9pt; }
  .pdf-subitem-wrapper { margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dashed #E5E7EB; }
  .pdf-subitem-wrapper:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .pdf-subitem { display: flex; justify-content: space-between; align-items: center; }
  .pdf-subitem-name { font-weight: 600; color: #1F2937; flex-grow: 1; margin-right: 5px; font-size: 9pt; }
  .pdf-status { padding: 2px 5px; border-radius: 3px; font-weight: 600; font-size: 8pt; white-space: nowrap; }
  .pdf-observation { color: #4B5563; margin-top: 3px; padding: 5px 6px; background-color: #F9FAFB; border-left: 2px solid #9CA3AF; font-size: 8.5pt; white-space: pre-wrap; width: 100%; box-sizing: border-box; }
  .pdf-pressure-details p, .pdf-special-details p { margin: 2px 0 5px 0; display: flex; justify-content: space-between; align-items: center; font-size: 9pt;}
  .pdf-pressure-details .pdf-subitem-name, .pdf-special-details .pdf-subitem-name { flex-grow: 0; font-weight: 600; }
  
  .pdf-registered-items-section h4 { font-size: 10pt; font-weight: 600; color: #374151; margin-top: 8px; margin-bottom: 4px; }
  .pdf-registered-items-section ul { list-style: disc; margin-left: 20px; padding-left: 0; margin-top: 0; margin-bottom: 5px; }
  .pdf-registered-items-section li { font-size: 9pt; color: #4B5563; margin-bottom: 2px; }
  .pdf-no-items { font-style: italic; color: #6B7280; font-size: 9pt; }
  
  .pdf-totals-summary { margin-top: 15px; padding-top: 10px; border-top: 1px solid #E5E7EB; }
  .pdf-totals-summary h4 { font-size: 10pt; font-weight: 600; color: #111827; margin-bottom: 5px; }
  .pdf-totals-summary p { font-size: 9pt; color: #1F2937; margin-bottom: 3px; }
  .pdf-totals-summary .pdf-type-breakdown { list-style: none; padding-left: 5px; margin-top: 2px; margin-bottom: 5px; }
  .pdf-totals-summary .pdf-type-breakdown li { font-size: 9pt; color: #374151; margin-bottom: 2px; }
  .pdf-totals-summary .pdf-type-breakdown ul { list-style: circle; margin-left: 10px; padding-left: 0; margin-top: 2px; }
  .pdf-totals-summary .pdf-type-breakdown ul li { font-size: 8pt; }

  .pdf-photo-report-section, .pdf-photo-report-section-standalone { margin-top: 15px; }
  .pdf-photo-items-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 10px; }
  .pdf-photo-item { border: 1px solid #E5E7EB; border-radius: 6px; padding: 10px; background-color: #F9FAFB; display: flex; flex-direction: column; page-break-inside: avoid; }
  .pdf-photo-item img { width: 100%; max-height: 250px; object-fit: contain; border-radius: 4px; margin-bottom: 8px; border: 1px solid #DDD; background-color: #FFF; }
  .pdf-photo-item p { font-size: 8pt; margin: 2px 0; color: #374151; line-height: 1.2; }
  .pdf-photo-item strong { font-weight: 600; color: #111827; }
  .pdf-photo-item .photo-observation { font-size: 7.5pt; white-space: pre-wrap; word-wrap: break-word; margin-top: 5px; padding: 5px; border-top: 1px dashed #DDD; }
  
  .pdf-footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #E5E7EB; font-size: 8pt; color: #6B7280; }

  /* Classes for specific report layouts based on previous request for generateInspectionPdf */
  .first-page-center-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh; /* This may need adjustment for print view */
  }
  
  .verified-items-page-content .pdf-verified-items-list {
    column-count: 2;
    column-gap: 20px;
  }
  .verified-items-page-content .category-group { margin-bottom: 8px; page-break-inside: avoid; }
  .verified-items-page-content .category-title { font-weight: bold; font-size: 10pt; margin-bottom: 3px; }
  .verified-items-page-content ul { list-style: disc; margin-left: 15px; padding-left: 0; font-size: 9pt; }
  .verified-items-page-content li { margin-bottom: 2px; }
  
  .nc-items-page-content .pdf-tower-section { page-break-inside: avoid; }
  .nc-items-page-content .pdf-floor-section { page-break-inside: avoid; }
  .nc-items-page-content .pdf-nc-item-category { font-weight: bold; margin-top: 8px; margin-bottom: 3px; font-size: 10pt; color: #111827; }
  .nc-items-page-content .pdf-nc-item-name { margin-left: 10px; font-size: 9pt; color: #1F2937; }
  .nc-items-page-content .pdf-nc-observation { margin-left: 10px; margin-top: 2px; padding: 4px 6px; background-color: #FEF2F2; border-left: 2px solid #F87171; font-size: 8.5pt; color: #7F1D1D; white-space: pre-wrap; }
  .nc-items-page-content .pdf-nc-pressure-details { margin-left: 10px; font-size: 9pt; }
  .nc-items-page-content .pdf-nc-summary-list { column-count: 2; column-gap: 20px; }
  
  .status-ok { background-color: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; }
  .status-nc { background-color: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
  .status-na { background-color: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
  .status-pending { background-color: #E5E7EB; color: #4B5563; border: 1px solid #D1D5DB; }

  @media print {
    body { margin: 10mm; font-size: 9pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .pdf-container { padding: 0; }
    .pdf-header-main .company-name, .pdf-client-info .pdf-main-title { color: #1E40AF; } /* Darker blue for print */
    
    /* Attempt to force page breaks. Use on wrapper divs for sections. */
    .print-page-break-after { page-break-after: always !important; }
    .print-page-break-before { page-break-before: always !important; }
    .print-page-break-inside-avoid { page-break-inside: avoid !important; }

    .status-ok, .status-nc, .status-na, .status-pending {
      /* Ensure colors print, or simplify for black & white */
       border: 1px solid #ccc;
       background-color: #fff !important; /* Remove background for cleaner print */
    }
    .status-ok { color: #006400 !important; } 
    .status-nc { color: #8B0000 !important; } 
    .status-na { color: #556B2F !important; } /* Darker yellow/olive */
    .status-pending { color: #404040 !important; }

    .pdf-tower-title { background-color: #e8e8e8 !important; }
    .pdf-category-header { background-color: #f0f0f0 !important; }
    .pdf-observation { background-color: #fdfdfd !important; border-left-color: #bbb; }
    .nc-items-page-content .pdf-nc-observation { background-color: #fff2f2 !important; border-left-color: #ffbaba; }
  }
`;


function openHtmlInNewWindow(htmlContent: string) {
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(htmlContent);
    win.document.close(); // Important for some browsers
    // Delay print to allow content to render, especially images
    setTimeout(() => {
      win.print();
    }, 1000); // Increased delay for potentially complex content or many images
  } else {
    alert('Por favor, desabilite o bloqueador de pop-ups para gerar o PDF.');
  }
}

function getHeaderHtml(clientInfo: ClientInfo, title: string, uploadedLogoDataUrl?: string | null): string {
  const defaultLogoUrl = '/brazil-extintores-logo.png'; // Make sure this path is correct from /public
  const logoToUse = uploadedLogoDataUrl || defaultLogoUrl;
  // For window.print, relative paths or absolute paths from the domain root are fine.
  // Data URIs also work.
  const logoSrc = logoToUse;


  return `
    <header class="pdf-header-main">
      <div class="pdf-header-content-wrapper">
        <div class="pdf-logo-container"><img src="${logoSrc}" alt="Logo"/></div>
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
      <h2 class="pdf-main-title">${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>
      <p class="pdf-subtitle">DADOS DO CLIENTE</p>
      <div class="pdf-client-info-grid">
        <div><strong>Nº Vistoria:</strong> ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'N/A'}</div>
        <div><strong>Data:</strong> ${clientInfo.inspectionDate ? format(new Date(clientInfo.inspectionDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</div>
        <div style="grid-column: 1 / -1;"><strong>Local:</strong> ${clientInfo.clientLocation.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'N/A'}</div>
        <div><strong>Cód. Cliente:</strong> ${clientInfo.clientCode.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'N/A'}</div>
        <div><strong>Vistoriado por:</strong> ${clientInfo.inspectedBy?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'N/A'}</div>
        <div><strong>Gerado em:</strong> ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
      </div>
    </section>
  `;
}

export function generateInspectionPdf(clientInfo: ClientInfo, towersData: TowerData[], uploadedLogoDataUrl?: string | null): void {
  const processedTowersData = towersData
    .filter(tower => tower && (tower.towerName?.trim() !== "" || tower.floors.some(f => f.floor?.trim() !== ""))) // Consider tower if it has name OR named floors
    .map(tower => ({
      ...tower,
      floors: tower.floors
        .filter(floor => floor && floor.floor?.trim() !== "")
        .map(floor => {
          let floorRegisteredExtinguishers: RegisteredExtinguisher[] = [];
          let floorRegisteredHoses: RegisteredHose[] = [];
          const categories = floor.categories.map(category => {
            if (category.type === 'standard' && category.subItems) {
              category.subItems.forEach(subItem => {
                if (subItem.isRegistry && subItem.id === 'extintor_cadastro' && subItem.registeredExtinguishers) floorRegisteredExtinguishers.push(...subItem.registeredExtinguishers);
                if (subItem.isRegistry && subItem.id === 'hidrantes_cadastro_mangueiras' && subItem.registeredHoses) floorRegisteredHoses.push(...subItem.registeredHoses);
              });
            }
            return category;
          });
          return { ...floor, categories, floorRegisteredExtinguishers, floorRegisteredHoses };
        }),
    }));

  const towersToActuallyPrint = processedTowersData.length > 0 ? processedTowersData : towersData.map(tower => ({ // Fallback to all towers if filtering results in empty
    ...tower,
    floors: tower.floors.map(floor => { 
        let floorRegisteredExtinguishers: RegisteredExtinguisher[] = [];
        let floorRegisteredHoses: RegisteredHose[] = [];
        const categories = floor.categories.map(category => {
            if (category.type === 'standard' && category.subItems) {
                category.subItems.forEach(subItem => {
                if (subItem.isRegistry && subItem.id === 'extintor_cadastro' && subItem.registeredExtinguishers) floorRegisteredExtinguishers.push(...subItem.registeredExtinguishers);
                if (subItem.isRegistry && subItem.id === 'hidrantes_cadastro_mangueiras' && subItem.registeredHoses) floorRegisteredHoses.push(...subItem.registeredHoses);
                });
            }
            return category;
        });
        return { ...floor, categories, floorRegisteredExtinguishers, floorRegisteredHoses };
    }),
  }));


  const photosForReport: Array<{ towerName: string; floorName: string; categoryTitle: string; subItemName: string; photoDataUri: string; photoDescription: string; }> = [];
  towersToActuallyPrint.forEach(tower => {
    tower.floors.forEach(floor => {
      floor.categories.forEach(category => {
        if (category.type === 'standard' && category.subItems) {
          category.subItems.forEach(subItem => {
            if (!subItem.isRegistry && subItem.photoDataUri) {
              photosForReport.push({
                towerName: tower.towerName || 'Torre Não Especificada',
                floorName: floor.floor || 'Andar Não Especificado',
                categoryTitle: category.title,
                subItemName: subItem.name,
                photoDataUri: subItem.photoDataUri,
                photoDescription: subItem.photoDescription || ''
              });
            }
          });
        }
      });
    });
  });

  let htmlBodyContent = '';

  // Page 1: Header & Client Data (Centered)
  htmlBodyContent += `<div class="first-page-center-container print-page-break-after">`;
  htmlBodyContent += getHeaderHtml(clientInfo, "Relatório de Vistoria Técnica", uploadedLogoDataUrl);
  htmlBodyContent += `</div>`;

  // Page 2: Verified Items
  htmlBodyContent += `<div class="verified-items-page-content print-page-break-after">`;
  htmlBodyContent += `<h3 class="pdf-section-title">Itens e Subitens Verificados na Vistoria (Geral)</h3>`;
  const overallUniqueVerifiedCategoryTitles = new Set<string>();
  const categoryToSubitemsMap: Record<string, Set<string>> = {};
  towersToActuallyPrint.forEach(tower => {
    tower.floors.forEach(floor => {
      floor.categories.forEach(category => {
        let catInteracted = false;
        if ((category.type === 'special' || category.type === 'pressure') && category.status !== undefined) {
          catInteracted = true;
        }
        if (category.type === 'standard' && category.subItems) {
          category.subItems.forEach(subItem => {
            if (!subItem.isRegistry && subItem.status !== undefined) {
              catInteracted = true;
              if (!categoryToSubitemsMap[category.title]) categoryToSubitemsMap[category.title] = new Set();
              categoryToSubitemsMap[category.title].add(subItem.name);
            }
          });
        }
        if (catInteracted) {
          overallUniqueVerifiedCategoryTitles.add(category.title);
        }
      });
    });
  });

  if (overallUniqueVerifiedCategoryTitles.size > 0) {
    htmlBodyContent += `<div class="pdf-verified-items-list">`;
    INSPECTION_CONFIG.forEach(cfgCat => {
      if (overallUniqueVerifiedCategoryTitles.has(cfgCat.title)) {
        htmlBodyContent += `<div class="category-group"><p class="category-title">${cfgCat.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
        if (cfgCat.type === 'standard' && categoryToSubitemsMap[cfgCat.title]?.size > 0) {
          htmlBodyContent += `<ul>`;
          cfgCat.subItems?.forEach(subCfg => {
            if (!subCfg.isRegistry && categoryToSubitemsMap[cfgCat.title].has(subCfg.name)) {
              htmlBodyContent += `<li>${subCfg.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
            }
          });
          htmlBodyContent += `</ul>`;
        }
        htmlBodyContent += `</div>`;
      }
    });
    htmlBodyContent += `</div>`;
  } else {
    htmlBodyContent += `<p class="pdf-no-items" style="text-align: center; padding: 12px;">Nenhum item verificado.</p>`;
  }
  htmlBodyContent += `</div>`;


  // Page 3: Non-Compliant (N/C) Items
  htmlBodyContent += `<div class="nc-items-page-content print-page-break-after">`;
  htmlBodyContent += `<h3 class="pdf-section-title">Detalhes de Itens Não Conformes (N/C)</h3>`;
  let anyNonConformingItemsFound = false;
  towersToActuallyPrint.forEach(tower => {
    let towerHasNCItemsForReport = false;
    let towerNCItemsContent = '';
    tower.floors.forEach(floor => {
      let floorHasNCItemsForReport = false;
      let floorNCItemsContent = '';
      floor.categories.forEach(category => {
        let catHasNC = false;
        let catNCContent = '';
        if (category.type === 'standard' && category.subItems) {
          category.subItems.forEach(sub => {
            if (!sub.isRegistry && sub.status === 'N/C') {
              catHasNC = true;
              catNCContent += `<div class="pdf-subitem-wrapper page-break-inside-avoid">`;
              catNCContent += `<div class="pdf-subitem"><span class="pdf-subitem-name">${sub.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span><span class="pdf-status ${getStatusClass(sub.status)}">${getStatusLabel(sub.status)}</span></div>`;
              if (sub.showObservation && sub.observation) {
                catNCContent += `<div class="pdf-nc-observation">${sub.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
              }
              catNCContent += `</div>`;
            }
          });
        } else if ((category.type === 'special' || category.type === 'pressure') && category.status === 'N/C') {
          catHasNC = true;
          catNCContent += `<div class="page-break-inside-avoid">`;
          catNCContent += `<p><span class="pdf-subitem-name">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")} Status:</span> <span class="pdf-status ${getStatusClass(category.status)}">${getStatusLabel(category.status)}</span></p>`;
          if (category.type === 'pressure' && category.status === 'N/C') {
            catNCContent += `<p class="pdf-nc-pressure-details">Pressão: ${category.pressureValue?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'N/P'} ${category.pressureUnit || ''}</p>`;
          }
          if (category.showObservation && category.observation) {
            catNCContent += `<div class="pdf-nc-observation">${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
          }
          catNCContent += `</div>`;
        }

        if (catHasNC) {
          floorHasNCItemsForReport = true;
          anyNonConformingItemsFound = true;
          floorNCItemsContent += `<div class="pdf-nc-item-category">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>${catNCContent}`;
        }
      });

      if (floorHasNCItemsForReport) {
        towerHasNCItemsForReport = true;
        towerNCItemsContent += `<div class="pdf-floor-section"><h3 class="pdf-floor-title">${(floor.floor || 'Andar Não Especificado').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>${floorNCItemsContent}</div>`;
      }
    });
    if (towerHasNCItemsForReport) {
      htmlBodyContent += `<div class="pdf-tower-section"><h2 class="pdf-tower-title">${(tower.towerName || 'Torre Não Especificada').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>${towerNCItemsContent}</div>`;
    }
  });
  if (!anyNonConformingItemsFound) {
    htmlBodyContent += `<p class="pdf-no-items" style="text-align: center; padding: 12px;">Nenhum item "Não Conforme" (N/C) encontrado.</p>`;
  }
  htmlBodyContent += `</div>`;


  // Page 4: Registered Items
  let anyRegItems = false;
  towersToActuallyPrint.forEach(t => t.floors.forEach(f => { if (f.floorRegisteredExtinguishers.length > 0 || f.floorRegisteredHoses.length > 0) anyRegItems = true; }));
  
  let grandTotalExtinguishersCount = 0;
  const extinguisherTypeAndWeightTotals: { [type: string]: { [weight: string]: number } } = {};
  EXTINGUISHER_TYPES.forEach(t => { extinguisherTypeAndWeightTotals[t] = {}; EXTINGUISHER_WEIGHTS.forEach(w => extinguisherTypeAndWeightTotals[t][w] = 0); });
  
  let grandTotalHosesCount = 0;
  const hoseCombinationTotals: { [key: string]: { quantity: number; length: HoseLengthOption; diameter: HoseDiameterOption; type: HoseTypeOption } } = {};

  towersToActuallyPrint.forEach(tower => {
    tower.floors.forEach(floor => {
      floor.floorRegisteredExtinguishers.forEach(ext => {
        if (ext.type && ext.weight && ext.quantity > 0) {
          extinguisherTypeAndWeightTotals[ext.type][ext.weight] = (extinguisherTypeAndWeightTotals[ext.type][ext.weight] || 0) + ext.quantity;
          grandTotalExtinguishersCount += ext.quantity;
        }
      });
      floor.floorRegisteredHoses.forEach(hose => {
        if (hose.length && hose.diameter && hose.type && hose.quantity > 0) {
          const key = `${hose.length}_${hose.diameter}_${hose.type}`;
          if (!hoseCombinationTotals[key]) {
            hoseCombinationTotals[key] = { quantity: 0, length: hose.length, diameter: hose.diameter, type: hose.type };
          }
          hoseCombinationTotals[key].quantity += hose.quantity;
          grandTotalHosesCount += hose.quantity;
        }
      });
    });
  });
  
  if (anyRegItems || grandTotalExtinguishersCount > 0 || grandTotalHosesCount > 0) {
    htmlBodyContent += `<div class="registered-items-page-content print-page-break-after">`; // Add page break before if not first content page after NC items
    htmlBodyContent += `<h3 class="pdf-section-title">Itens Cadastrados (Extintores e Mangueiras)</h3>`;
    if (anyRegItems) {
       towersToActuallyPrint.forEach(tower => {
        let towerHasRegItems = false;
        let towerRegContent = '';
        tower.floors.forEach(floor => {
          if (floor.floorRegisteredExtinguishers.length > 0 || floor.floorRegisteredHoses.length > 0) {
            towerHasRegItems = true;
            towerRegContent += `<div class="pdf-floor-section"><h3 class="pdf-floor-title">${(floor.floor || 'Andar N/E').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3><div class="pdf-registered-items-section">`;
            if (floor.floorRegisteredExtinguishers.length > 0) {
              towerRegContent += `<h4>Extintores:</h4><ul>`;
              floor.floorRegisteredExtinguishers.forEach(e => towerRegContent += `<li>${e.quantity}x - ${e.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${e.weight.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`);
              towerRegContent += `</ul>`;
            } else {
              towerRegContent += `<h4>Extintores:</h4><p class="pdf-no-items">Nenhum.</p>`;
            }
            if (floor.floorRegisteredHoses.length > 0) {
              towerRegContent += `<h4>Mangueiras:</h4><ul>`;
              floor.floorRegisteredHoses.forEach(h => towerRegContent += `<li>${h.quantity}x - ${h.length.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${h.diameter.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${h.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`);
              towerRegContent += `</ul>`;
            } else {
              towerRegContent += `<h4>Mangueiras:</h4><p class="pdf-no-items">Nenhuma.</p>`;
            }
            towerRegContent += `</div></div>`;
          }
        });
        if (towerHasRegItems) {
          htmlBodyContent += `<div class="pdf-tower-section"><h2 class="pdf-tower-title">${(tower.towerName || 'Torre N/E').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>${towerRegContent}</div>`;
        }
      });
    } else {
         htmlBodyContent += `<p class="pdf-no-items" style="text-align: center; padding: 12px;">Nenhum item cadastrado nos andares.</p>`;
    }

    htmlBodyContent += `<div class="pdf-totals-summary page-break-inside-avoid"><h4>Totais Gerais</h4><p><strong>Extintores:</strong></p><ul class="pdf-type-breakdown">`;
    let hasExtTot = false;
    EXTINGUISHER_TYPES.forEach(t => {
      let typeHasWeights = false;
      let weightDetails = '';
      EXTINGUISHER_WEIGHTS.forEach(w => {
        if (extinguisherTypeAndWeightTotals[t]?.[w] > 0) {
          typeHasWeights = true;
          weightDetails += `<li>${w.replace(/</g, "&lt;").replace(/>/g, "&gt;")}: ${extinguisherTypeAndWeightTotals[t][w]}</li>`;
        }
      });
      if (typeHasWeights) {
        htmlBodyContent += `<li><strong>${t.replace(/</g, "&lt;").replace(/>/g, "&gt;")}:</strong><ul>${weightDetails}</ul></li>`;
        hasExtTot = true;
      }
    });
    if (!hasExtTot && grandTotalExtinguishersCount === 0) htmlBodyContent += `<li>Nenhum.</li>`;
    htmlBodyContent += `</ul><p><strong>Total Geral Extintores:</strong> ${grandTotalExtinguishersCount}</p>`;
    htmlBodyContent += `<p style="margin-top: 10px;"><strong>Mangueiras:</strong></p><ul class="pdf-type-breakdown">`;
    let hasHoseTot = false;
    Object.values(hoseCombinationTotals).forEach(d => {
      if (d.quantity > 0) {
        htmlBodyContent += `<li>${d.quantity}x - ${d.length.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${d.diameter.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${d.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
        hasHoseTot = true;
      }
    });
    if (!hasHoseTot && grandTotalHosesCount === 0) htmlBodyContent += `<li>Nenhuma.</li>`;
    htmlBodyContent += `</ul><p><strong>Total Geral Mangueiras:</strong> ${grandTotalHosesCount}</p></div>`;
    htmlBodyContent += `</div>`;
  }


  // Page 5+: Photo Report
  if (photosForReport.length > 0) {
    htmlBodyContent += `<div class="photo-report-page-content print-page-break-before">`; // Add page break before
    htmlBodyContent += `<h3 class="pdf-section-title">Registro Fotográfico</h3>`;
    htmlBodyContent += `<div class="pdf-photo-items-container">`;
    photosForReport.forEach(p => {
      htmlBodyContent += `<div class="pdf-photo-item">`;
      htmlBodyContent += `<img src="${p.photoDataUri}" alt="Foto ${p.subItemName.replace(/"/g, "'")}"/>`;
      htmlBodyContent += `<p><strong>Torre:</strong> ${p.towerName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
      htmlBodyContent += `<p><strong>Andar:</strong> ${p.floorName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
      htmlBodyContent += `<p><strong>Categoria:</strong> ${p.categoryTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
      htmlBodyContent += `<p><strong>Subitem:</strong> ${p.subItemName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
      htmlBodyContent += `<p class="photo-observation"><strong>Obs:</strong> ${p.photoDescription?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'Nenhuma'}</p>`;
      htmlBodyContent += `</div>`;
    });
    htmlBodyContent += `</div></div>`;
  }

  htmlBodyContent += `<footer class="pdf-footer">FireCheck Brazil &copy; ${new Date().getFullYear()} - BRAZIL EXTINTORES</footer>`;

  const fullHtml = `
    <html>
      <head>
        <title>Relatório Vistoria Técnica - ${clientInfo.inspectionNumber}</title>
        <style>${PDF_COMMON_STYLES}</style>
      </head>
      <body>
        <div class="pdf-container">${htmlBodyContent}</div>
        <script>
          setTimeout(() => {
            window.print();
          }, 1000); // Delay for rendering
        </script>
      </body>
    </html>`;
  openHtmlInNewWindow(fullHtml);
}


export function generateRegisteredItemsPdf(clientInfo: ClientInfo, towersData: TowerData[], uploadedLogoDataUrl?: string | null): void {
  let grandTotalExtinguishersCount = 0;
  const extinguisherTypeAndWeightTotals: { [type: string]: { [weight: string]: number } } = {};
  EXTINGUISHER_TYPES.forEach(t => { extinguisherTypeAndWeightTotals[t] = {}; EXTINGUISHER_WEIGHTS.forEach(w => extinguisherTypeAndWeightTotals[t][w] = 0); });
  
  let grandTotalHosesCount = 0;
  const hoseCombinationTotals: { [key: string]: { quantity: number; length: HoseLengthOption; diameter: HoseDiameterOption; type: HoseTypeOption } } = {};
  
  const relevantTowersData = towersData
    .filter(tower => tower && (tower.towerName?.trim() !== "" || tower.floors.some(f => f.floor?.trim() !== "")))
    .map(tower => ({
      ...tower,
      floors: tower.floors.filter(floor => floor && floor.floor?.trim() !== ""),
    }));
  const towersToReport = relevantTowersData.length > 0 ? relevantTowersData : towersData;

  const processedTowersForReport = towersToReport.map(tower => {
    tower.floors.forEach(floor => {
      floor.categories.forEach(category => {
        if (category.subItems) category.subItems.forEach(subItem => {
          if (subItem.isRegistry) {
            if (subItem.id === 'extintor_cadastro' && subItem.registeredExtinguishers) {
              subItem.registeredExtinguishers.forEach(ext => {
                if (ext.type && ext.weight && ext.quantity > 0) {
                  extinguisherTypeAndWeightTotals[ext.type][ext.weight] = (extinguisherTypeAndWeightTotals[ext.type][ext.weight] || 0) + ext.quantity;
                  grandTotalExtinguishersCount += ext.quantity;
                }
              });
            } else if (subItem.id === 'hidrantes_cadastro_mangueiras' && subItem.registeredHoses) {
              subItem.registeredHoses.forEach(hose => {
                if (hose.length && hose.diameter && hose.type && hose.quantity > 0) {
                  const key = `${hose.length}_${hose.diameter}_${hose.type}`;
                  if (!hoseCombinationTotals[key]) {
                    hoseCombinationTotals[key] = { quantity: 0, length: hose.length, diameter: hose.diameter, type: hose.type };
                  }
                  hoseCombinationTotals[key].quantity += hose.quantity;
                  grandTotalHosesCount += hose.quantity;
                }
              });
            }
          }
        });
      });
    });
    return {
      towerName: tower.towerName || 'Torre N/E',
      floors: tower.floors.map(f => ({
        floorName: f.floor || 'Andar N/E',
        extinguishers: f.categories.flatMap(c => c.subItems?.filter(si => si.id === 'extintor_cadastro' && si.isRegistry).flatMap(si => si.registeredExtinguishers || []) || []),
        hoses: f.categories.flatMap(c => c.subItems?.filter(si => si.id === 'hidrantes_cadastro_mangueiras' && si.isRegistry).flatMap(si => si.registeredHoses || []) || [])
      }))
    };
  });

  let htmlBodyContent = getHeaderHtml(clientInfo, "Relatório de Itens Cadastrados", uploadedLogoDataUrl);
  htmlBodyContent += `<section class="pdf-items-by-floor"><h3 class="pdf-section-title">Itens Cadastrados por Torre/Andar</h3>`;
  let anyItemsOnFloors = false;
  processedTowersForReport.forEach(tower => {
    let towerHasItems = false; let towerHtml = '';
    tower.floors.forEach(floor => {
      if (floor.extinguishers.length > 0 || floor.hoses.length > 0) {
        towerHasItems = true; anyItemsOnFloors = true;
        towerHtml += `<div class="pdf-floor-section page-break-inside-avoid"><h3 class="pdf-floor-title">${floor.floorName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3><div class="pdf-registered-items-section">`;
        if (floor.extinguishers.length > 0) {
          towerHtml += `<h4>Extintores:</h4><ul>`;
          floor.extinguishers.forEach(e => towerHtml += `<li>${e.quantity}x - ${e.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${e.weight.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`);
          towerHtml += `</ul>`;
        } else {
          towerHtml += `<h4>Extintores:</h4><p class="pdf-no-items">Nenhum.</p>`;
        }
        if (floor.hoses.length > 0) {
          towerHtml += `<h4>Mangueiras:</h4><ul>`;
          floor.hoses.forEach(h => towerHtml += `<li>${h.quantity}x - ${h.length.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${h.diameter.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${h.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`);
          towerHtml += `</ul>`;
        } else {
          towerHtml += `<h4>Mangueiras:</h4><p class="pdf-no-items">Nenhuma.</p>`;
        }
        towerHtml += `</div></div>`;
      }
    });
    if (towerHasItems) {
      htmlBodyContent += `<div class="pdf-tower-section page-break-inside-avoid"><h2 class="pdf-tower-title">${tower.towerName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>${towerHtml}</div>`;
    }
  });
  if (!anyItemsOnFloors && (grandTotalExtinguishersCount > 0 || grandTotalHosesCount > 0)) {
    // If no items on floors but there are totals, implies an issue or all items are global (not handled here)
  } else if (!anyItemsOnFloors) {
    htmlBodyContent += `<p class="pdf-no-items" style="text-align:center; padding: 12px;">Nenhum item cadastrado.</p>`;
  }
  htmlBodyContent += `</section>`;
  
  htmlBodyContent += `<section class="pdf-totals-summary page-break-inside-avoid"><h3 class="pdf-section-title">Resumo Geral</h3><h4>Extintores</h4><ul class="pdf-type-breakdown">`;
  let foundExt = false;
  EXTINGUISHER_TYPES.forEach(t => {
    let typeHasEnt = false;
    let typeSub = '';
    EXTINGUISHER_WEIGHTS.forEach(w => {
      if (extinguisherTypeAndWeightTotals[t]?.[w] > 0) {
        typeHasEnt = true;
        foundExt = true;
        typeSub += `<li>${w.replace(/</g, "&lt;").replace(/>/g, "&gt;")}: ${extinguisherTypeAndWeightTotals[t][w]}</li>`;
      }
    });
    if (typeHasEnt) {
      htmlBodyContent += `<li><strong>${t.replace(/</g, "&lt;").replace(/>/g, "&gt;")}:</strong><ul>${typeSub}</ul></li>`;
    }
  });
  if (!foundExt && grandTotalExtinguishersCount === 0) {
    htmlBodyContent += `<li>Nenhum.</li>`;
  }
  htmlBodyContent += `</ul><p><strong>Total Geral Extintores: ${grandTotalExtinguishersCount}</strong></p><h4 style="margin-top: 12px;">Mangueiras</h4><ul class="pdf-type-breakdown">`;
  if (Object.keys(hoseCombinationTotals).length > 0) {
    Object.values(hoseCombinationTotals).forEach(d => {
      if (d.quantity > 0) htmlBodyContent += `<li>${d.quantity}x - ${d.length.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${d.diameter.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${d.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
    });
  } else if (grandTotalHosesCount === 0) {
    htmlBodyContent += `<li>Nenhuma.</li>`;
  }
  htmlBodyContent += `</ul><p><strong>Total Geral Mangueiras: ${grandTotalHosesCount}</strong></p></section>`;
  htmlBodyContent += `<footer class="pdf-footer">FireCheck Brazil &copy; ${new Date().getFullYear()} - BRAZIL EXTINTORES</footer>`;

  const fullHtml = `
    <html>
      <head>
        <title>Itens Cadastrados - ${clientInfo.inspectionNumber}</title>
        <style>${PDF_COMMON_STYLES}</style>
      </head>
      <body>
        <div class="pdf-container">${htmlBodyContent}</div>
        <script>
          setTimeout(() => { window.print(); }, 1000);
        </script>
      </body>
    </html>`;
  openHtmlInNewWindow(fullHtml);
}

export function generateNCItemsPdf(clientInfo: ClientInfo, towersData: TowerData[], uploadedLogoDataUrl?: string | null): void {
  let ncItemsFoundOverall = false;
  let htmlBodyContent = getHeaderHtml(clientInfo, "Relatório de Itens Não Conformes (N/C)", uploadedLogoDataUrl);
  htmlBodyContent += `<section class="pdf-nc-items-section nc-items-page-content"><h3 class="pdf-section-title">Detalhes dos Itens "Não Conforme"</h3>`;
  
  const relevantTowersData = towersData
    .filter(tower => tower && (tower.towerName?.trim() !== "" || tower.floors.some(f => f.floor?.trim() !== "")))
    .map(tower => ({
      ...tower,
      floors: tower.floors.filter(floor => floor && floor.floor?.trim() !== ""),
    }));
  const towersToReport = relevantTowersData.length > 0 ? relevantTowersData : towersData;

  towersToReport.forEach(tower => {
    let towerHasNC = false; let towerHtml = '';
    tower.floors.forEach(floor => {
      let floorHasNC = false; let floorHtml = '';
      INSPECTION_CONFIG.forEach(cfgCat => {
        const category = floor.categories.find(cat => cat.id === cfgCat.id); if (!category) return;
        let catHasNC = false; let catHtml = '';
        if (category.type === 'standard' && category.subItems) {
          cfgCat.subItems?.forEach(cfgSub => {
            if (cfgSub.isRegistry) return;
            const sub = category.subItems?.find(si => si.id === cfgSub.id);
            if (sub && sub.status === 'N/C') {
              ncItemsFoundOverall=true; floorHasNC=true; catHasNC=true;
              catHtml += `<div class="pdf-nc-item-name page-break-inside-avoid">${sub.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
              if (sub.showObservation && sub.observation) {
                catHtml += `<div class="pdf-nc-observation page-break-inside-avoid">${sub.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
              }
            }
          });
        } else if ((category.type === 'special' || category.type === 'pressure') && category.status === 'N/C') {
          ncItemsFoundOverall=true; floorHasNC=true; catHasNC=true;
          if (category.type === 'pressure') {
            catHtml += `<div class="pdf-nc-pressure-details page-break-inside-avoid">Pressão: ${category.pressureValue?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'N/P'} ${category.pressureUnit || ''}</div>`;
          }
          if (category.showObservation && category.observation) {
            catHtml += `<div class="pdf-nc-observation page-break-inside-avoid">${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
          }
        }
        if (catHasNC) {
          floorHtml += `<div class="pdf-nc-item-category page-break-inside-avoid">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>${catHtml}`;
        }
      });
      if (floorHasNC) {
        towerHasNC = true;
        towerHtml += `<div class="pdf-floor-section page-break-inside-avoid"><h3 class="pdf-floor-title">${(floor.floor || 'Andar N/E').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>${floorHtml}</div>`;
      }
    });
    if (towerHasNC) {
      htmlBodyContent += `<div class="pdf-tower-section page-break-inside-avoid"><h2 class="pdf-tower-title">${(tower.towerName || 'Torre N/E').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>${towerHtml}</div>`;
    }
  });
  if (!ncItemsFoundOverall) {
    htmlBodyContent += `<p class="pdf-no-items" style="text-align: center; padding: 12px;">Nenhum item "Não Conforme" (N/C) encontrado.</p>`;
  }
  htmlBodyContent += `</section><footer class="pdf-footer">FireCheck Brazil &copy; ${new Date().getFullYear()} - BRAZIL EXTINTORES</footer>`;
  
  const fullHtml = `
    <html>
      <head>
        <title>Itens N_C - ${clientInfo.inspectionNumber}</title>
        <style>
          ${PDF_COMMON_STYLES}
          .nc-items-page-content { column-count: 2; column-gap: 20px; }
        </style>
      </head>
      <body>
        <div class="pdf-container">${htmlBodyContent}</div>
        <script>
          setTimeout(() => { window.print(); }, 1000);
        </script>
      </body>
    </html>`;
  openHtmlInNewWindow(fullHtml);
}

export function generatePhotoReportPdf(clientInfo: ClientInfo, towersData: TowerData[], uploadedLogoDataUrl?: string | null): void {
  const photosForReport: Array<{ towerName: string; floorName: string; categoryTitle: string; subItemName: string; photoDataUri: string; photoDescription: string; }> = [];
  
  const relevantTowersData = towersData
    .filter(tower => tower && (tower.towerName?.trim() !== "" || tower.floors.some(f => f.floor?.trim() !== "")))
    .map(tower => ({
      ...tower,
      floors: tower.floors.filter(floor => floor && floor.floor?.trim() !== ""),
    }));
  const towersToReport = relevantTowersData.length > 0 ? relevantTowersData : towersData;

  towersToReport.forEach(tower => {
    tower.floors.forEach(floor => {
      floor.categories.forEach(cat => {
        if (cat.type === 'standard' && cat.subItems) {
          cat.subItems.forEach(sub => {
            if (!sub.isRegistry && sub.photoDataUri) {
              photosForReport.push({
                towerName: tower.towerName || 'Torre N/E',
                floorName: floor.floor || 'Andar N/E',
                categoryTitle: cat.title,
                subItemName: sub.name,
                photoDataUri: sub.photoDataUri,
                photoDescription: sub.photoDescription || ''
              });
            }
          });
        }
      });
    });
  });
  
  let htmlBodyContent = getHeaderHtml(clientInfo, "Relatório Fotográfico", uploadedLogoDataUrl);
  htmlBodyContent += `<section class="pdf-photo-report-section-standalone"><h3 class="pdf-section-title">Registro Fotográfico</h3>`;
  if (photosForReport.length > 0) {
    htmlBodyContent += `<div class="pdf-photo-items-container">`;
    photosForReport.forEach(p => {
      htmlBodyContent += `<div class="pdf-photo-item">`;
      htmlBodyContent += `<img src="${p.photoDataUri}" alt="Foto ${p.subItemName.replace(/"/g, "'")}"/>`;
      htmlBodyContent += `<p><strong>Torre:</strong> ${p.towerName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
      htmlBodyContent += `<p><strong>Andar:</strong> ${p.floorName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
      htmlBodyContent += `<p><strong>Categoria:</strong> ${p.categoryTitle.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
      htmlBodyContent += `<p><strong>Subitem:</strong> ${p.subItemName.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
      htmlBodyContent += `<p class="photo-observation"><strong>Obs:</strong> ${p.photoDescription?.replace(/</g, "&lt;").replace(/>/g, "&gt;") || 'Nenhuma'}</p>`;
      htmlBodyContent += `</div>`;
    });
    htmlBodyContent += `</div>`;
  } else {
    htmlBodyContent += `<p class="pdf-no-items" style="text-align: center; padding: 12px;">Nenhuma foto encontrada.</p>`;
  }
  htmlBodyContent += `</section><footer class="pdf-footer">FireCheck Brazil &copy; ${new Date().getFullYear()} - BRAZIL EXTINTORES</footer>`;

  const fullHtml = `
    <html>
      <head>
        <title>RelatorioFotografico_${clientInfo.inspectionNumber}</title>
        <style>${PDF_COMMON_STYLES}</style>
      </head>
      <body>
        <div class="pdf-container">${htmlBodyContent}</div>
        <script>
          setTimeout(() => { window.print(); }, 1000);
        </script>
      </body>
    </html>`;
  openHtmlInNewWindow(fullHtml);
}
