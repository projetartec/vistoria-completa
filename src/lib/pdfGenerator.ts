
import type { InspectionData, ClientInfo, SubItemState, StatusOption, InspectionCategoryState } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// SVG Icons (no longer used for category headers in N/A summary, but kept for potential future use or if detailed report is re-added)
// const checkCircleSvg = `
//   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-status-completed">
//     <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
//     <polyline points="22 4 12 14.01 9 11.01"/>
//   </svg>
// `;

// const xCircleSvg = `
//   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-status-incomplete">
//     <circle cx="12" cy="12" r="10"/>
//     <line x1="15" y1="9" x2="9" y2="15"/>
//     <line x1="9" y1="9" x2="15" y2="15"/>
//   </svg>
// `;


function getStatusLabel(status: StatusOption | undefined): string {
  if (status === undefined) return 'Pendente'; // Should not appear in N/A summary ideally
  return status;
}

function getStatusClass(status: StatusOption | undefined): string {
  // Only N/A status is expected here for the summary
  if (status === 'N/A') return 'status-na';
  // Fallbacks, though not primary for this report type
  if (status === 'OK') return 'status-ok';
  if (status === 'N/C') return 'status-nc';
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

  // Check if there are any N/A items to report
  let hasNaItems = false;
  relevantFloorsData.forEach(floor => {
    floor.categories.forEach(category => {
      if (category.type === 'standard' && category.subItems) {
        if (category.subItems.some(subItem => !subItem.isRegistry && subItem.status === 'N/A')) {
          hasNaItems = true;
        }
      } else if ((category.type === 'special' || category.type === 'pressure') && category.status === 'N/A') {
        hasNaItems = true;
      }
    });
  });

  if (!hasNaItems) {
    alert("Nenhum item marcado como 'N/A' para incluir no relatório resumido.");
    return;
  }


  const defaultLogoUrl = '/brazil-extintores-logo.png';
  const logoToUse = uploadedLogoDataUrl || defaultLogoUrl;
  const isDataUrl = uploadedLogoDataUrl && uploadedLogoDataUrl.startsWith('data:image');

  let pdfHtml = `
    <html>
      <head>
        <title>Relatório Resumido N/A - ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap');
          body {
            font-family: 'PT Sans', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            font-size: 10pt; 
            background-color: #FFFFFF;
            color: #1A1A1A;
          }
          .pdf-container { max-width: 850px; margin: 0 auto; background-color: #FFFFFF; padding: 25px; border: 1px solid #DDD; }

          .pdf-header-main {
            display: flex;
            flex-direction: row; 
            justify-content: center; 
            align-items: center; 
            border-bottom: 2px solid #D1D5DB;
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
            border: 1px solid #D1D5DB;
            border-radius: 8px;
            padding: 20px; 
            margin-bottom: 30px;
            background-color: #F9FAFB;
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
            border-bottom: 1px solid #E5E7EB;
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
            color: #1F2937;
            margin-top: 25px; 
            margin-bottom: 20px; 
            padding-bottom: 8px; 
            border-bottom: 3px solid #2563EB;
          }
          .pdf-floor-section:first-of-type .pdf-floor-title { margin-top: 10px; }

          .pdf-category-card {
            background-color: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            margin-bottom: 20px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.05); 
            page-break-inside: avoid;
          }
          .pdf-category-header {
            display: flex;
            align-items: center;
            padding: 12px 15px; 
            background-color: #F3F4F6;
            border-bottom: 1px solid #E5E7EB;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
          }
          /* Removed SVG icon from header for N/A summary */
          .pdf-category-title-text {
            font-size: 14pt; 
            font-weight: 600;
            color: #111827;
            flex-grow: 1;
          }

          .pdf-category-content { padding: 15px; font-size: 10pt; } 

          .pdf-subitem-wrapper {
             margin-bottom: 10px;
             padding-bottom: 10px;
             border-bottom: 1px dashed #E5E7EB;
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
            color: #4B5563;
            margin-top: 6px;
            padding: 8px 10px;
            background-color: #F9FAFB;
            border-left: 3px solid #9CA3AF;
            font-size: 0.95em;
            white-space: pre-wrap;
            width: 100%;
            box-sizing: border-box;
          }
          
          .pdf-no-na-items {
            padding: 10px;
            text-align: center;
            color: #6B7280;
            font-style: italic;
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
            border-top: 1px solid #E5E7EB;
            font-size: 9pt;
            color: #6B7280;
          }

          @media print {
            html, body {
                height: auto;
                background-color: #FFFFFF !important;
                margin: 0 !important;
                padding: 10mm 8mm !important;
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
                page-break-before: auto;
                page-break-inside: avoid;
            }
            .pdf-floor-section {
                page-break-inside: avoid; 
                page-break-before: auto; 
            }
            .pdf-floor-section:first-of-type {
                page-break-before: avoid; 
            }
            .pdf-category-card {
                page-break-inside: avoid !important; 
                box-shadow: none !important;
                border: 1px solid #E5E7EB !important;
            }
            .pdf-subitem-wrapper {
                page-break-inside: avoid !important; 
            }
            .pdf-header-main .company-name { color: #2563EB !important; }
            .pdf-header-main .company-details p { color: #374151 !important; }
            .pdf-client-info .pdf-main-title { color: #2563EB !important; }
            .pdf-client-info .pdf-subtitle { color: #6B7280 !important; }
            .pdf-client-info-grid strong { color: #111827 !important; }
            .pdf-floor-title { color: #1F2937 !important; border-bottom: 3px solid #2563EB !important; }
            .pdf-category-title-text { color: #111827 !important; }
            .pdf-subitem-name { color: #1F2937 !important; }
            .pdf-observation { color: #4B5563 !important; border-left: 3px solid #9CA3AF !important; background-color: #F9FAFB !important; }
            .status-na { background-color: #FFFBEB !important; color: #B45309 !important; border: 1px solid #FDE68A !important; }
            /* Ensure other statuses are styled correctly if they somehow appear, though not intended for N/A summary */
            .status-ok { background-color: #ECFDF5 !important; color: #047857 !important; border: 1px solid #A7F3D0 !important; }
            .status-nc { background-color: #FEF2F2 !important; color: #B91C1C !important; border: 1px solid #FECACA !important; }
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
            <h2 class="pdf-main-title">RELATÓRIO RESUMIDO - ITENS NÃO APLICÁVEIS (N/A)</h2>
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
    let floorHasNaItems = false;
    let floorHtmlContent = '';

    floor.categories.forEach(category => {
      let categoryHtmlContent = '';
      let categoryHasNaItems = false;

      if (category.type === 'standard' && category.subItems) {
        const naSubItems = category.subItems.filter(subItem => !subItem.isRegistry && subItem.status === 'N/A');
        if (naSubItems.length > 0) {
          categoryHasNaItems = true;
          naSubItems.forEach(subItem => {
            categoryHtmlContent += `<div class="pdf-subitem-wrapper">`;
            categoryHtmlContent += `<div class="pdf-subitem">`;
            categoryHtmlContent += `  <span class="pdf-subitem-name">${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
            categoryHtmlContent += `  <span class="pdf-status ${getStatusClass(subItem.status)}">${getStatusLabel(subItem.status)}</span>`;
            categoryHtmlContent += `</div>`;
            if (subItem.showObservation && subItem.observation) {
              categoryHtmlContent += `<div class="pdf-observation">${subItem.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
            }
            categoryHtmlContent += `</div>`;
          });
        }
      } else if ((category.type === 'special' || category.type === 'pressure') && category.status === 'N/A') {
        categoryHasNaItems = true;
        const detailsClass = category.type === 'special' ? 'pdf-special-details' : 'pdf-pressure-details';
        categoryHtmlContent += `<div class="${detailsClass} pdf-subitem-wrapper">`; 
        categoryHtmlContent += `<p><span class="pdf-subitem-name">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")} Status:</span> <span class="pdf-status ${getStatusClass(category.status)}">${getStatusLabel(category.status)}</span></p>`;
        if (category.type === 'pressure' && category.pressureValue) {
            categoryHtmlContent += `<p><span class="pdf-subitem-name">Pressão:</span> <span>${category.pressureValue ? category.pressureValue.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'N/P'} ${category.pressureUnit || ''}</span></p>`;
        }
        if (category.showObservation && category.observation) {
          categoryHtmlContent += `<div class="pdf-observation">${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
        }
        categoryHtmlContent += `</div>`;
      }

      if (categoryHasNaItems) {
        floorHasNaItems = true;
        floorHtmlContent += `<article class="pdf-category-card">`;
        floorHtmlContent += `  <header class="pdf-category-header">`;
        floorHtmlContent += `    <span class="pdf-category-title-text">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
        floorHtmlContent += `  </header>`;
        floorHtmlContent += `  <div class="pdf-category-content">`;
        floorHtmlContent += categoryHtmlContent;
        floorHtmlContent += `  </div>`;
        floorHtmlContent += `</article>`;
      }
    });
    
    if (floorHasNaItems) {
        pdfHtml += `<section class="pdf-floor-section">`;
        pdfHtml += `<h3 class="pdf-floor-title">${floor.floor.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>`;
        pdfHtml += floorHtmlContent;
        pdfHtml += `</section>`;
    }
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
    setTimeout(() => {
      try {
         printWindow.focus();
         printWindow.print();
      } catch (e) {
        console.error("Error during print:", e);
        alert("Ocorreu um erro ao tentar imprimir o PDF. Verifique o console do navegador para mais detalhes.");
      }
    }, 500);
  } else {
    alert("Não foi possível abrir a janela de impressão. Verifique se o seu navegador está bloqueando pop-ups.");
  }
}
