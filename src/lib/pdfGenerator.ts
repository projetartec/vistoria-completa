
import type { InspectionData, ClientInfo, SubItemState, StatusOption, InspectionCategoryState, CategoryOverallStatus } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Replicate logic from page.tsx to determine category overall status for PDF icons
const getCategoryOverallStatusForPdf = (category: InspectionCategoryState): CategoryOverallStatus => {
  if (category.type === 'standard' && category.subItems) {
    const relevantSubItems = category.subItems.filter(subItem => !subItem.isRegistry);
    if (relevantSubItems.length === 0) {
      return 'all-items-selected'; 
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


export function generateInspectionPdf(clientInfo: ClientInfo, floorsData: InspectionData[]): void {
  if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionDate || !clientInfo.inspectionNumber) {
    alert("CÓDIGO DO CLIENTE, LOCAL, NÚMERO DA VISTORIA e DATA DA VISTORIA são obrigatórios para gerar o PDF.");
    return;
  }
  if (floorsData.length === 0 || floorsData.every(floor => !floor.floor || floor.floor.trim() === "")) {
    alert("Nenhum andar com nome preenchido para incluir no PDF.");
    return;
  }

  const logoUrl = 'https://placehold.co/180x60.png'; // Changed to placeholder URL

  let pdfHtml = `
    <html>
      <head>
        <title>Vistoria Técnica - ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap');
          body { 
            font-family: 'PT Sans', Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            line-height: 1.6; 
            font-size: 12pt; /* Increased base font size */
            background-color: #FFFFFF; 
            color: #1A1A1A; 
          }
          .pdf-container { max-width: 850px; margin: 0 auto; background-color: #FFFFFF; padding: 25px; border: 1px solid #DDD; }

          .pdf-header-main { 
            display: flex; 
            align-items: center; 
            border-bottom: 2px solid #D1D5DB; 
            padding-bottom: 20px; 
            margin-bottom: 25px; 
          }
          .pdf-header-main .logo-container {
            margin-right: 20px; /* Space between logo and text */
            flex-shrink: 0; /* Prevent logo from shrinking */
          }
          .pdf-header-main .logo-img { 
            max-height: 60px; 
            max-width: 180px;
            width: auto;
            height: auto;
            border-radius: 4px; /* Optional: if logo has rounded corners */
          }
          .pdf-header-main .text-container {
            /* flex-grow: 1; // Let it take remaining space if needed */
          }
          .pdf-header-main .company-title { 
            font-size: 26pt; /* Increased */
            font-weight: 700; 
            color: #2563EB; /* Slightly darker blue */
            margin: 0; 
            line-height: 1.1;
          }
          .pdf-header-main .subtitle { 
            font-size: 16pt; /* Increased */
            color: #374151; /* Darker gray */
            margin: 0; 
            padding-top: 5px; 
            line-height: 1.1;
          }
          
          .pdf-client-info { 
            border: 1px solid #D1D5DB; 
            border-radius: 8px; 
            padding: 25px; /* Increased padding */
            margin-bottom: 30px; 
            background-color: #F9FAFB; 
          }
          .pdf-client-info h2 { 
            font-size: 18pt; /* Increased */
            color: #1D4ED8; /* Matching darker blue */
            margin-top: 0; 
            margin-bottom: 20px; /* Increased margin */
            border-bottom: 1px solid #E5E7EB; 
            padding-bottom: 12px; /* Increased padding */
          }
          .pdf-client-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 25px; font-size: 11pt; }
          .pdf-client-info-grid div { padding: 4px 0; }
          .pdf-client-info-grid strong { color: #111827; font-weight: 600; }

          .pdf-floor-section { margin-bottom: 35px; }
          .pdf-floor-title { 
            font-size: 20pt; /* Increased */
            font-weight: 700; 
            color: #1F2937; 
            margin-top: 30px; /* Increased margin */
            margin-bottom: 25px; /* Increased margin */
            padding-bottom: 10px; /* Increased padding */
            border-bottom: 3px solid #2563EB; 
          }
          .pdf-floor-section:first-of-type .pdf-floor-title { margin-top: 10px; } /* Adjusted for first floor */

          .pdf-category-card { 
            background-color: #FFFFFF;
            border: 1px solid #E5E7EB; 
            border-radius: 8px; 
            margin-bottom: 25px; /* Increased margin */
            box-shadow: 0 4px 8px rgba(0,0,0,0.08); /* Enhanced shadow */
            page-break-inside: avoid;
          }
          .pdf-category-header { 
            display: flex; 
            align-items: center; 
            padding: 15px 20px; /* Increased padding */
            background-color: #F3F4F6; 
            border-bottom: 1px solid #E5E7EB;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
          }
          .pdf-category-header svg { margin-right: 15px; flex-shrink: 0; }
          .icon-status-completed { stroke: #059669; } /* Adjusted green */
          .icon-status-incomplete { stroke: #DC2626; } /* Adjusted red */
          .pdf-category-title-text { 
            font-size: 16pt; /* Increased */
            font-weight: 600; 
            color: #111827; 
            flex-grow: 1; 
          }
          
          .pdf-category-content { padding: 20px; font-size: 11pt; } /* Increased padding and font size */
          
          .pdf-subitem-wrapper {
             margin-bottom: 12px; 
             padding-bottom: 12px; 
             border-bottom: 1px dashed #E5E7EB; 
          }
          .pdf-subitem-wrapper:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }

          .pdf-subitem { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            /* Removed bottom margin/padding here, moved to wrapper */
          }
          .pdf-subitem-name { font-weight: 600; color: #1F2937; flex-grow: 1; margin-right: 15px; }
          .pdf-status { padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.95em; white-space: nowrap; }
          .status-ok { background-color: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; } 
          .status-nc { background-color: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; } 
          .status-na { background-color: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; } 
          .status-pending { background-color: #F3F4F6; color: #4B5563; border: 1px solid #D1D5DB; }
          
          .pdf-observation { 
            color: #4B5563; 
            margin-left: 0; /* Keep aligned if it's part of a subitem-wrapper */
            margin-top: 8px; /* Space from the subitem line */
            padding: 10px 12px; 
            background-color: #F9FAFB; 
            border-left: 4px solid #9CA3AF; 
            font-size: 1em; /* Relative to category content font size */
            white-space: pre-wrap; 
            width: 100%; 
            box-sizing: border-box;
          }
          /* Removed: .pdf-subitem > .pdf-observation as observation is now within pdf-subitem-wrapper */

          .pdf-registry-container {
            margin-top: 10px; /* Space before registry section */
          }
          .pdf-registry-title { 
            font-weight: bold; 
            margin-top: 15px; /* Increased margin */
            margin-bottom: 8px; /* Increased margin */
            color: #374151; 
            display: block; 
            font-size: 1.15em; /* Slightly larger */
          }
          .pdf-registry-list { list-style: none; padding-left: 0; margin-top: 0; }
          .pdf-registry-list li { 
            padding: 5px 0; /* Increased padding */
            font-size: 1em; 
            border-bottom: 1px dotted #EEE; 
          }
          .pdf-registry-list li:last-child { border-bottom: none; }
          

          .pdf-pressure-details p, .pdf-special-details p { 
            margin: 6px 0 10px 0; /* Increased margin */
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
          }
          .pdf-pressure-details .pdf-subitem-name, .pdf-special-details .pdf-subitem-name { flex-grow: 0; font-weight: 600; } 

          .pdf-footer {
            text-align: center;
            margin-top: 50px; /* Increased margin */
            padding-top: 25px; /* Increased padding */
            border-top: 1px solid #E5E7EB;
            font-size: 10pt; /* Increased */
            color: #6B7280;
          }

          @media print {
            body { background-color: #FFFFFF; margin:0; padding: 15mm 10mm; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .pdf-container { box-shadow: none; padding: 0; border: none; }
            .pdf-category-card { box-shadow: none; border: 1px solid #E5E7EB; }
          }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <header class="pdf-header-main">
            <div class="logo-container">
              <img src="${logoUrl}" alt="Logo Brazil Extintores" class="logo-img" onerror="this.style.display='none'"/>
            </div>
            <div class="text-container">
              <div class="company-title">BRAZIL EXTINTORES</div>
              <div class="subtitle">VISTORIA TÉCNICA</div>
            </div>
          </header>

          <section class="pdf-client-info">
            <h2>Dados do Cliente e Vistoria</h2>
            <div class="pdf-client-info-grid">
              <div><strong>Número da Vistoria:</strong> ${clientInfo.inspectionNumber.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              <div><strong>Data da Vistoria:</strong> ${clientInfo.inspectionDate ? format(new Date(clientInfo.inspectionDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</div>
              <div style="grid-column: 1 / -1;"><strong>Local (Cliente):</strong> ${clientInfo.clientLocation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              <div><strong>Código do Cliente:</strong> ${clientInfo.clientCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
              <div><strong>PDF Gerado em:</strong> ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
            </div>
          </section>
  `;

  floorsData.filter(floor => floor.floor && floor.floor.trim() !== "").forEach((floor) => {
    pdfHtml += `<section class="pdf-floor-section">`;
    pdfHtml += `<h3 class="pdf-floor-title">${floor.floor.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>`;

    floor.categories.forEach(category => {
      const overallStatus = getCategoryOverallStatusForPdf(category);
      const statusIcon = overallStatus === 'all-items-selected' ? checkCircleSvg : xCircleSvg;

      pdfHtml += `<article class="pdf-category-card">`;
      pdfHtml += `  <header class="pdf-category-header">`;
      pdfHtml += `    ${statusIcon}`;
      pdfHtml += `    <span class="pdf-category-title-text">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
      pdfHtml += `  </header>`;
      pdfHtml += `  <div class="pdf-category-content">`;

      if (category.type === 'standard' && category.subItems) {
        category.subItems.forEach(subItem => {
          pdfHtml += `<div class="pdf-subitem-wrapper">`; // Wrapper for subitem + observation
          if (subItem.isRegistry) {
             pdfHtml += `<div class="pdf-registry-container">`;
            if (subItem.id === 'extintor_cadastro' && subItem.registeredExtinguishers && subItem.registeredExtinguishers.length > 0) {
              pdfHtml += `<span class="pdf-registry-title">${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}:</span>`;
              pdfHtml += `<ul class="pdf-registry-list">`;
              subItem.registeredExtinguishers.forEach(ext => {
                pdfHtml += `<li>${ext.quantity}x - ${ext.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${ext.weight.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
              });
              pdfHtml += `</ul>`;
            } else if (subItem.id === 'hidrantes_cadastro_mangueiras' && subItem.registeredHoses && subItem.registeredHoses.length > 0) {
              pdfHtml += `<span class="pdf-registry-title">${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}:</span>`;
              pdfHtml += `<ul class="pdf-registry-list">`;
              subItem.registeredHoses.forEach(hose => {
                pdfHtml += `<li>${hose.quantity}x - ${hose.length.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${hose.diameter.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - ${hose.type.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`;
              });
              pdfHtml += `</ul>`;
            } else if (subItem.isRegistry) { // Catch-all for empty registries
                 pdfHtml += `<div class="pdf-subitem">`; // Use pdf-subitem for consistent styling if needed
                 pdfHtml += `  <span class="pdf-subitem-name">${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}:</span> <span style="color: #6B7280; font-style: italic;">Nenhum item cadastrado.</span>`;
                 pdfHtml += `</div>`;
            }
             pdfHtml += `</div>`;
          } else { 
            pdfHtml += `<div class="pdf-subitem">`;
            pdfHtml += `  <span class="pdf-subitem-name">${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
            pdfHtml += `  <span class="pdf-status ${getStatusClass(subItem.status)}">${getStatusLabel(subItem.status)}</span>`;
            pdfHtml += `</div>`; 
            if (subItem.showObservation && subItem.observation) {
              pdfHtml += `<div class="pdf-observation">${subItem.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
            }
          }
          pdfHtml += `</div>`; // End of pdf-subitem-wrapper
        });
      } else if (category.type === 'special') {
        pdfHtml += `<div class="pdf-special-details pdf-subitem-wrapper">`; // Added wrapper
        pdfHtml += `<p><span class="pdf-subitem-name">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")} Status:</span> <span class="pdf-status ${getStatusClass(category.status)}">${getStatusLabel(category.status)}</span></p>`;
        if (category.showObservation && category.observation) {
          pdfHtml += `<div class="pdf-observation">${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
        }
        pdfHtml += `</div>`;
      } else if (category.type === 'pressure') {
        pdfHtml += `<div class="pdf-pressure-details pdf-subitem-wrapper">`; // Added wrapper
        pdfHtml += `<p><span class="pdf-subitem-name">Pressão:</span> <span>${category.pressureValue ? category.pressureValue.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'N/P'} ${category.pressureUnit || ''}</span></p>`;
        if (category.showObservation && category.observation) {
          pdfHtml += `<div class="pdf-observation">${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
        }
        pdfHtml += `</div>`;
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

