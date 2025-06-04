
import type { InspectionData, ClientInfo, SubItemState, StatusOption, InspectionCategoryState, CategoryOverallStatus } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Replicate logic from page.tsx to determine category overall status for PDF icons
const getCategoryOverallStatusForPdf = (category: InspectionCategoryState): CategoryOverallStatus => {
  if (category.type === 'standard' && category.subItems) {
    const relevantSubItems = category.subItems.filter(subItem => !subItem.isRegistry);
    if (relevantSubItems.length === 0) {
      return 'all-items-selected'; // Or 'some-items-pending' if empty means incomplete
    }
    const allSelected = relevantSubItems.every(subItem => subItem.status !== undefined);
    return allSelected ? 'all-items-selected' : 'some-items-pending';
  } else if (category.type === 'special' || category.type === 'pressure') {
    return category.status !== undefined ? 'all-items-selected' : 'some-items-pending';
  }
  return 'some-items-pending';
};

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

// SVG Icons
const checkCircleSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-status-completed">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
`;

const xCircleSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-status-incomplete">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
`;


export function generateInspectionPdf(clientInfo: ClientInfo, floorsData: InspectionData[]): void {
  if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionDate || !clientInfo.inspectionNumber) {
    alert("CÓDIGO DO CLIENTE, LOCAL, NÚMERO DA VISTORIA e DATA DA VISTORIA são obrigatórios para gerar o PDF.");
    return;
  }
  if (floorsData.length === 0 || floorsData.every(floor => !floor.floor || floor.floor.trim() === "")) {
    alert("Nenhum andar com nome preenchido para incluir no PDF.");
    return;
  }

  const logoUrl = '/brazil-extintores-logo.png'; // Assumes logo is in public folder

  let pdfHtml = `
    <html>
      <head>
        <title>Vistoria Técnica - ${clientInfo.inspectionNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap');
          body { 
            font-family: 'PT Sans', Arial, sans-serif; 
            margin: 0; 
            padding: 25px; 
            line-height: 1.5; 
            font-size: 10pt; 
            background-color: #F5F5F5; /* --background approx */
            color: #0A0A0A; /* --foreground approx */
          }
          .pdf-container { max-width: 800px; margin: 0 auto; background-color: #FFFFFF; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }

          .pdf-header-main { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E5E5E5; padding-bottom: 15px; margin-bottom: 20px; }
          .pdf-header-main .company-title { font-size: 20pt; font-weight: bold; color: #64B5F6; /* --primary approx */ margin: 0; }
          .pdf-header-main .subtitle { font-size: 13pt; color: #737373; /* --muted-foreground approx */ margin: 0; }
          .pdf-header-main .logo img { max-height: 60px; max-width: 200px; }
          
          .pdf-client-info { border: 1px solid #E0E0E0; border-radius: 8px; padding: 15px; margin-bottom: 25px; background-color: #FFFFFF; }
          .pdf-client-info h2 { font-size: 14pt; color: #64B5F6; margin-top: 0; margin-bottom: 10px; border-bottom: 1px solid #EFEFEF; padding-bottom: 5px;}
          .pdf-client-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 15px; }
          .pdf-client-info-grid div { font-size: 9.5pt; }
          .pdf-client-info-grid strong { color: #333; }

          .pdf-floor-section { margin-bottom: 30px; }
          .pdf-floor-title { 
            font-size: 16pt; 
            font-weight: bold; 
            color: #333; 
            margin-top: 20px;
            margin-bottom: 15px; 
            padding-bottom: 5px;
            border-bottom: 2px solid #64B5F6; 
          }
          .pdf-floor-section:first-of-type .pdf-floor-title { margin-top: 0; }

          .pdf-category-card { 
            background-color: #FFFFFF; /* --card approx */
            border: 1px solid #E0E0E0; /* --border approx */
            border-radius: 8px; /* --radius approx */
            margin-bottom: 15px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            page-break-inside: avoid;
          }
          .pdf-category-header { 
            display: flex; 
            align-items: center; 
            padding: 10px 15px; 
            background-color: #FAFAFA; /* Lighter card header */
            border-bottom: 1px solid #E0E0E0;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
          }
          .pdf-category-header svg { margin-right: 10px; }
          .icon-status-completed { stroke: #4CAF50; /* Green */ }
          .icon-status-incomplete { stroke: #F44336; /* Red */ }
          .pdf-category-title-text { font-size: 12pt; font-weight: bold; color: #333; flex-grow: 1; }
          
          .pdf-category-content { padding: 15px; font-size: 9.5pt; }
          .pdf-subitem { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dotted #EEE; }
          .pdf-subitem:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
          .pdf-subitem-name { font-weight: bold; color: #222; }
          .pdf-status { padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 0.85em; }
          .status-ok { background-color: #E8F5E9; color: #2E7D32; border: 1px solid #C8E6C9; }
          .status-nc { background-color: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2; }
          .status-na { background-color: #FFFDE7; color: #795548; border: 1px solid #FFF9C4; }
          .status-pending { background-color: #F5F5F5; color: #757575; border: 1px solid #E0E0E0; }
          
          .pdf-observation { 
            font-style: italic; 
            color: #555; 
            margin-left: 10px; 
            margin-top: 3px;
            padding: 5px; 
            background-color: #F9F9F9; 
            border-left: 3px solid #CCC; 
            font-size: 0.9em; 
            white-space: pre-wrap; /* Preserve line breaks */
          }
          .pdf-registry-list { list-style: none; padding-left: 10px; margin-top: 5px; }
          .pdf-registry-list li { padding: 2px 0; font-size: 0.95em; }
          .pdf-registry-title { font-weight: bold; margin-top: 8px; margin-bottom: 3px; color: #444; display: block; }

          .pdf-pressure-details p, .pdf-special-details p { margin: 2px 0 5px 0; }

          @media print {
            body { background-color: #FFFFFF; margin:0; padding: 20mm 15mm; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .pdf-container { box-shadow: none; padding: 0; }
            .pdf-category-card, .pdf-subitem { page-break-inside: avoid; }
             /* Hide header on subsequent pages - often tricky, relying on browser behavior */
            .pdf-header-main { display: block; } /* Ensure it's block for first page */
          }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <div class="pdf-header-main">
            <div>
              <div class="company-title">BRAZIL EXTINTORES</div>
              <div class="subtitle">VISTORIA TÉCNICA</div>
            </div>
            <div class="logo">
              <img src="${logoUrl}" alt="Logo Brazil Extintores" onerror="this.style.display='none'"/>
            </div>
          </div>

          <div class="pdf-client-info">
            <h2>Dados do Cliente e Vistoria</h2>
            <div class="pdf-client-info-grid">
              <div><strong>Número da Vistoria:</strong> ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              <div><strong>Data da Vistoria:</strong> ${clientInfo.inspectionDate ? format(new Date(clientInfo.inspectionDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</div>
              <div style="grid-column: 1 / -1;"><strong>Local (Cliente):</strong> ${clientInfo.clientLocation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              <div><strong>Código do Cliente:</strong> ${clientInfo.clientCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              <div><strong>PDF Gerado em:</strong> ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
            </div>
          </div>
  `;

  floorsData.filter(floor => floor.floor && floor.floor.trim() !== "").forEach((floor) => {
    pdfHtml += `<div class="pdf-floor-section">`;
    pdfHtml += `<div class="pdf-floor-title">${floor.floor.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;

    floor.categories.forEach(category => {
      const overallStatus = getCategoryOverallStatusForPdf(category);
      const statusIcon = overallStatus === 'all-items-selected' ? checkCircleSvg : xCircleSvg;

      pdfHtml += `<div class="pdf-category-card">`;
      pdfHtml += `  <div class="pdf-category-header">`;
      pdfHtml += `    ${statusIcon}`;
      pdfHtml += `    <span class="pdf-category-title-text">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
      pdfHtml += `  </div>`;
      pdfHtml += `  <div class="pdf-category-content">`;

      if (category.type === 'standard' && category.subItems) {
        category.subItems.forEach(subItem => {
          pdfHtml += `<div class="pdf-subitem">`;
          pdfHtml += `  <span class="pdf-subitem-name">${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}:</span> `;
          
          if (subItem.isRegistry) {
            if (subItem.registeredExtinguishers && subItem.registeredExtinguishers.length > 0) {
              pdfHtml += `<ul class="pdf-registry-list">`;
              subItem.registeredExtinguishers.forEach(ext => {
                pdfHtml += `<li>${ext.quantity}x - ${ext.type} - ${ext.weight}</li>`;
              });
              pdfHtml += `</ul>`;
            } else {
              pdfHtml += ` <span style="color: #777; font-style: italic;">Nenhum extintor cadastrado.</span>`;
            }
          } else {
            pdfHtml += `  <span class="pdf-status ${getStatusClass(subItem.status)}">${getStatusLabel(subItem.status)}</span>`;
            if (subItem.showObservation && subItem.observation) {
              pdfHtml += `<div class="pdf-observation">${subItem.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
            }
          }
          pdfHtml += `</div>`;
        });
      } else if (category.type === 'special') {
        pdfHtml += `<div class="pdf-special-details">`;
        pdfHtml += `<p><span class="pdf-subitem-name">Status Geral:</span> <span class="pdf-status ${getStatusClass(category.status)}">${getStatusLabel(category.status)}</span></p>`;
        if (category.showObservation && category.observation) {
          pdfHtml += `<div class="pdf-observation">${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
        }
        pdfHtml += `</div>`;
      } else if (category.type === 'pressure') {
        pdfHtml += `<div class="pdf-pressure-details">`;
        pdfHtml += `<p><span class="pdf-subitem-name">Pressão:</span> ${category.pressureValue ? category.pressureValue.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'N/P'} ${category.pressureUnit || ''}</p>`;
        if (category.showObservation && category.observation) {
          pdfHtml += `<div class="pdf-observation">${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
        }
        pdfHtml += `</div>`;
      }
      pdfHtml += `  </div>`; // end category-content
      pdfHtml += `</div>`; // end category-card
    });
    pdfHtml += `</div>`; // end floor-section
  });

  pdfHtml += `
        </div> <!-- end pdf-container -->
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(pdfHtml);
    printWindow.document.close();
    // Timeout helps ensure CSS is applied before print dialog
    setTimeout(() => {
      try {
         printWindow.focus(); // Focus the new window
         printWindow.print();
         // Optionally close after printing, but browsers often handle this or give user choice
         // printWindow.close(); 
      } catch (e) {
        console.error("Error during print:", e);
        alert("Ocorreu um erro ao tentar imprimir o PDF. Verifique o console do navegador para mais detalhes.");
      }
    }, 500); // 500ms delay, adjust if needed
  } else {
    alert("Não foi possível abrir a janela de impressão. Verifique se o seu navegador está bloqueando pop-ups.");
  }
}
