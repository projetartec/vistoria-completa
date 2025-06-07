
import type { InspectionData, ClientInfo, SubItemState, StatusOption, InspectionCategoryState } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// SVG Icons
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

function getCategoryOverallStatus(category: InspectionCategoryState): 'all-items-selected' | 'some-items-pending' {
  if (category.type === 'standard' && category.subItems) {
    const relevantSubItems = category.subItems.filter(subItem => !subItem.isRegistry);
    if (relevantSubItems.length === 0 && (!category.subItems.some(si => si.isRegistry))) { // if only registry items, it's effectively complete unless they are empty
         // For categories with only registry subitems, consider "complete" if they exist.
         // More specific logic might be needed if registry items themselves have a concept of completion.
         return 'all-items-selected';
    }
    if (relevantSubItems.length === 0 && category.subItems.some(si => si.isRegistry) ) {
        // If there are only registry items, consider them 'all-items-selected' for simplicity here.
        // The actual display of registry items will show their content.
        return 'all-items-selected';
    }
    const allSelected = relevantSubItems.every(subItem => subItem.status !== undefined);
    return allSelected ? 'all-items-selected' : 'some-items-pending';
  } else if (category.type === 'special' || category.type === 'pressure') {
    return category.status !== undefined ? 'all-items-selected' : 'some-items-pending';
  }
  return 'some-items-pending';
}


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
  const relevantFloorsData = floorsData.filter(floor => floor.floor && floor.floor.trim() !== "");
  if (relevantFloorsData.length === 0) {
    alert("Nenhum andar com nome preenchido para incluir no PDF.");
    return;
  }

  const defaultLogoUrl = '/brazil-extintores-logo.png';
  const logoToUse = uploadedLogoDataUrl || defaultLogoUrl;
  const isDataUrl = uploadedLogoDataUrl && uploadedLogoDataUrl.startsWith('data:image');


  let pdfHtml = `
    <html>
      <head>
        <title>Vistoria Técnica - ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap');
          body {
            font-family: 'PT Sans', Arial, sans-serif;
            margin: 0;
            padding: 20px; /* Reduced padding for more content space */
            line-height: 1.6;
            font-size: 10pt; 
            background-color: #FFFFFF; /* Ensure background is white for printing */
            color: #1A1A1A; /* Default text color */
          }
          .pdf-container { max-width: 850px; margin: 0 auto; background-color: #FFFFFF; padding: 25px; border: 1px solid #DDD; }

          .pdf-header-main {
            display: flex;
            flex-direction: row; 
            justify-content: center; 
            align-items: center; 
            border-bottom: 2px solid #D1D5DB; /* Light gray border */
            padding-bottom: 15px;
            margin-bottom: 25px;
          }

          .pdf-header-content-wrapper { 
            display: flex;
            align-items: center; 
            gap: 20px; 
          }

          .pdf-logo-container {
            flex-shrink: 0; 
          }

          .pdf-logo-container img {
            max-height: 112px; 
            width: auto; 
            max-width: 224px; 
            display: block; 
          }
          
          .pdf-company-info-container {
             text-align: left; 
          }

          .pdf-header-main .company-name {
            font-size: 18pt; 
            font-weight: 700;
            color: #2563EB; 
            margin-bottom: 5px;
          }
          .pdf-header-main .company-details p {
            font-size: 9pt; 
            color: #374151; 
            margin: 2px 0;
            line-height: 1.3;
          }

          .pdf-client-info {
            border: 1px solid #D1D5DB; /* Consistent border */
            border-radius: 8px;
            padding: 20px; 
            margin-bottom: 30px;
            background-color: #F9FAFB; /* Light background for client info section */
          }
          .pdf-client-info .pdf-main-title { 
            font-size: 20pt; 
            font-weight: 700; 
            color: #2563EB; 
            margin-top: 0;
            margin-bottom: 5px; 
            text-align: center; 
          }
          .pdf-client-info .pdf-subtitle { 
            font-size: 14pt; 
            font-weight: 700; 
            color: #6B7280; 
            margin-top: 0;
            margin-bottom: 15px; 
            padding-bottom: 10px; 
            border-bottom: 1px solid #E5E7EB; /* Light border for subtitle */
            text-align: center; 
          }

          .pdf-client-info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 10px 20px; 
            font-size: 10pt; 
            text-align: left; 
          }
          .pdf-client-info-grid div { padding: 3px 0; }
          .pdf-client-info-grid strong { color: #111827; font-weight: 600; }

          .pdf-floor-section { 
            margin-bottom: 30px; 
          }
          .pdf-floor-title {
            font-size: 18pt; 
            font-weight: 700;
            color: #1F2937; /* Darker title for floors */
            margin-top: 25px; 
            margin-bottom: 20px; 
            padding-bottom: 8px; 
            border-bottom: 3px solid #2563EB; /* Primary color accent for floor title */
          }
          .pdf-floor-section:first-of-type .pdf-floor-title { margin-top: 10px; } /* Less top margin for the first floor */

          .pdf-category-card {
            background-color: #FFFFFF;
            border: 1px solid #E5E7EB; /* Lighter border for cards */
            border-radius: 8px;
            margin-bottom: 20px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.05); 
            page-break-inside: avoid;
          }
          .pdf-category-header {
            display: flex;
            align-items: center;
            padding: 12px 15px; 
            background-color: #F3F4F6; /* Light gray header for category */
            border-bottom: 1px solid #E5E7EB;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
          }
          .pdf-category-header svg.icon-status-completed { color: #10B981; margin-right: 8px; flex-shrink: 0;} /* Green for completed */
          .pdf-category-header svg.icon-status-incomplete { color: #EF4444; margin-right: 8px; flex-shrink: 0;} /* Red for incomplete */
          
          .pdf-category-title-text {
            font-size: 14pt; 
            font-weight: 600;
            color: #111827; /* Dark text for category title */
            flex-grow: 1;
          }

          .pdf-category-content { padding: 15px; font-size: 10pt; } 

          .pdf-subitem-wrapper {
             margin-bottom: 10px;
             padding-bottom: 10px;
             border-bottom: 1px dashed #E5E7EB; /* Dashed separator for subitems */
             page-break-inside: avoid;
          }
          .pdf-subitem-wrapper:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }

          .pdf-subitem {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .pdf-subitem-name { font-weight: 600; color: #1F2937; flex-grow: 1; margin-right: 10px; }
          .pdf-status { padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 0.9em; white-space: nowrap; }
          .status-ok { background-color: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }
          .status-nc { background-color: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; }
          .status-na { background-color: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
          .status-pending { background-color: #F3F4F6; color: #4B5563; border: 1px solid #D1D5DB; }

          .pdf-observation {
            color: #4B5563; /* Muted text for observations */
            margin-top: 6px;
            padding: 8px 10px;
            background-color: #F9FAFB; /* Very light background for observations */
            border-left: 3px solid #9CA3AF; /* Accent border for observations */
            font-size: 0.95em;
            white-space: pre-wrap; /* Preserve line breaks in observations */
            width: 100%;
            box-sizing: border-box;
          }
          
          .pdf-registry-section {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #E0E0E0;
          }
          .pdf-registry-title {
            font-size: 1.1em;
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
          }
          .pdf-registry-list {
            list-style: none;
            padding-left: 0;
            margin-left: 5px;
          }
          .pdf-registry-list li {
            padding: 3px 0;
            font-size: 0.95em;
            border-bottom: 1px dotted #EEE;
          }
           .pdf-registry-list li:last-child {
            border-bottom: none;
          }

          .pdf-pressure-details p, .pdf-special-details p {
            margin: 4px 0 8px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .pdf-pressure-details .pdf-subitem-name, .pdf-special-details .pdf-subitem-name { flex-grow: 0; font-weight: 600; }

          .pdf-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB; /* Light border for footer */
            font-size: 9pt;
            color: #6B7280; /* Muted text for footer */
          }

          /* Print-specific styles */
          @media print {
            html, body {
                height: auto;
                background-color: #FFFFFF !important;
                margin: 0 !important; /* Reset margin for print */
                padding: 10mm 8mm !important; /* Standard print margins */
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
                font-size: 10pt;
            }
            .pdf-container {
                width: 100%;
                box-shadow: none !important;
                padding: 0 !important;
                border: none !important;
                margin: 0 !important;
            }
            .pdf-header-main, .pdf-client-info {
                page-break-after: avoid;
            }
             .pdf-footer {
                page-break-before: auto; /* Allow break before footer if necessary */
                page-break-inside: avoid; /* Try to keep footer content together */
            }

            /* Try to keep floor sections from breaking in the middle */
            .pdf-floor-section {
                page-break-inside: avoid; 
                page-break-before: auto; 
            }
            /* Avoid breaking just after the first floor title if possible */
            .pdf-floor-section:first-of-type {
                page-break-before: avoid; 
            }

            /* Try to keep category cards from breaking */
            .pdf-category-card {
                page-break-inside: avoid !important; 
                box-shadow: none !important;
                border: 1px solid #E5E7EB !important; /* ensure border prints */
            }
            /* Try to keep subitems with their details together */
            .pdf-subitem-wrapper {
                page-break-inside: avoid !important; 
            }

            /* Explicit color overrides for printing */
            .pdf-header-main .company-name { color: #2563EB !important; }
            .pdf-header-main .company-details p { color: #374151 !important; }
            .pdf-client-info .pdf-main-title { color: #2563EB !important; }
            .pdf-client-info .pdf-subtitle { color: #6B7280 !important; }
            .pdf-client-info-grid strong { color: #111827 !important; }
            .pdf-floor-title { color: #1F2937 !important; border-bottom: 3px solid #2563EB !important; }
            .pdf-category-header svg.icon-status-completed { color: #10B981 !important; }
            .pdf-category-header svg.icon-status-incomplete { color: #EF4444 !important; }
            .pdf-category-title-text { color: #111827 !important; }
            .pdf-subitem-name { color: #1F2937 !important; }
            .pdf-observation { color: #4B5563 !important; border-left: 3px solid #9CA3AF !important; background-color: #F9FAFB !important; }
            .status-ok { background-color: #ECFDF5 !important; color: #047857 !important; border: 1px solid #A7F3D0 !important; }
            .status-nc { background-color: #FEF2F2 !important; color: #B91C1C !important; border: 1px solid #FECACA !important; }
            .status-na { background-color: #FFFBEB !important; color: #B45309 !important; border: 1px solid #FDE68A !important; }
            .status-pending { background-color: #F3F4F6 !important; color: #4B5563 !important; border: 1px solid #D1D5DB !important; }
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
            <h2 class="pdf-main-title">VISTORIA TÉCNICA</h2>
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
  `;

  relevantFloorsData.forEach((floor) => {
    pdfHtml += `<section class="pdf-floor-section">`;
    pdfHtml += `<h3 class="pdf-floor-title">${floor.floor.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>`;

    floor.categories.forEach(category => {
      const overallStatus = getCategoryOverallStatus(category);
      const statusIcon = overallStatus === 'all-items-selected' ? checkCircleSvg : xCircleSvg;
      const iconClass = overallStatus === 'all-items-selected' ? 'icon-status-completed' : 'icon-status-incomplete';

      pdfHtml += `<article class="pdf-category-card">`;
      pdfHtml += `  <header class="pdf-category-header">`;
      pdfHtml += `    ${statusIcon.replace('class="', `class="${iconClass} `)}`
      pdfHtml += `    <span class="pdf-category-title-text">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
      pdfHtml += `  </header>`;
      pdfHtml += `  <div class="pdf-category-content">`;

      if (category.type === 'standard' && category.subItems) {
        category.subItems.forEach(subItem => {
          if (subItem.isRegistry) {
            if (subItem.id === 'extintor_cadastro' && subItem.registeredExtinguishers && subItem.registeredExtinguishers.length > 0) {
              pdfHtml += `<div class="pdf-registry-section">`;
              pdfHtml += `<h4 class="pdf-registry-title">${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h4>`;
              pdfHtml += `<ul class="pdf-registry-list">`;
              subItem.registeredExtinguishers.forEach(ext => {
                pdfHtml += `<li>${ext.quantity}x - ${ext.type} - ${ext.weight}</li>`;
              });
              pdfHtml += `</ul></div>`;
            } else if (subItem.id === 'hidrantes_cadastro_mangueiras' && subItem.registeredHoses && subItem.registeredHoses.length > 0) {
              pdfHtml += `<div class="pdf-registry-section">`;
              pdfHtml += `<h4 class="pdf-registry-title">${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h4>`;
              pdfHtml += `<ul class="pdf-registry-list">`;
              subItem.registeredHoses.forEach(hose => {
                 pdfHtml += `<li>${hose.quantity}x - ${hose.length} - ${hose.diameter} - ${hose.type}</li>`;
              });
              pdfHtml += `</ul></div>`;
            }
          } else {
            pdfHtml += `<div class="pdf-subitem-wrapper">`;
            pdfHtml += `<div class="pdf-subitem">`;
            pdfHtml += `  <span class="pdf-subitem-name">${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
            pdfHtml += `  <span class="pdf-status ${getStatusClass(subItem.status)}">${getStatusLabel(subItem.status)}</span>`;
            pdfHtml += `</div>`;
            if (subItem.showObservation && subItem.observation) {
              pdfHtml += `<div class="pdf-observation">${subItem.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
            }
            pdfHtml += `</div>`;
          }
        });
      } else if (category.type === 'special' || category.type === 'pressure') {
        const detailsClass = category.type === 'special' ? 'pdf-special-details' : 'pdf-pressure-details';
        pdfHtml += `<div class="${detailsClass}">`; // Removed pdf-subitem-wrapper as it adds extra border
        pdfHtml += `<p><span class="pdf-subitem-name">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")} Status:</span> <span class="pdf-status ${getStatusClass(category.status)}">${getStatusLabel(category.status)}</span></p>`;
        if (category.type === 'pressure' && category.status !== 'N/A') {
             pdfHtml += `<p><span class="pdf-subitem-name">Pressão:</span> <span>${category.pressureValue ? category.pressureValue.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'N/P'} ${category.pressureUnit || ''}</span></p>`;
        }
        if (category.showObservation && category.observation) {
          pdfHtml += `<div class="pdf-observation">${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
        }
        pdfHtml += `</div>`;
      }
      
      if (category.observation && (category.type === 'special' || category.type === 'pressure')) {
          // General observation for special/pressure categories if no subitems shown directly but observation exists
      }

      pdfHtml += `  </div>`;
      pdfHtml += `</article>`;
    });
    pdfHtml += `</section>`;
  });


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
    // Delay print to allow images and styles to load
    setTimeout(() => {
      try {
         printWindow.focus(); // For some browsers
         printWindow.print();
         // printWindow.close(); // Optional: close window after print dialog
      } catch (e) {
        console.error("Error during print:", e);
        alert("Ocorreu um erro ao tentar imprimir o PDF. Verifique o console do navegador para mais detalhes.");
      }
    }, 500); // 500ms delay, adjust if needed
  } else {
    alert("Não foi possível abrir a janela de impressão. Verifique se o seu navegador está bloqueando pop-ups.");
  }
}

