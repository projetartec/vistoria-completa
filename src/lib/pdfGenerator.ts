
import type { InspectionData, ClientInfo, InspectionCategoryState, SubItemState, StatusOption } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getStatusLabel(status: StatusOption | undefined): string {
  if (status === undefined) return 'Pendente';
  return status;
}

export function generateInspectionPdf(clientInfo: ClientInfo, floorsData: InspectionData[]): void {
  if (!clientInfo.clientCode || !clientInfo.clientLocation || !clientInfo.inspectionDate) {
    alert("CÓDIGO DO CLIENTE, LOCAL e DATA DA VISTORIA são obrigatórios para gerar o PDF.");
    return;
  }
  if (floorsData.length === 0 || floorsData.every(floor => !floor.floor)) {
    alert("Nenhum andar com nome preenchido para incluir no PDF.");
    return;
  }

  const logoUrl = '/brazil-extintores-logo.png';

  let pdfHtml = `
    <html>
      <head>
        <title>Vistoria Técnica - ${clientInfo.inspectionNumber || clientInfo.clientCode}</title>
        <style>
          body { font-family: 'PT Sans', Arial, sans-serif; margin: 20px; line-height: 1.4; font-size: 10pt; }
          .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
          .header-text h1 { font-size: 16pt; margin: 0; color: #64B5F6; }
          .header-text p { font-size: 12pt; margin: 0; }
          .header-logo img { max-height: 50px; max-width: 180px; }
          .client-info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
          .client-info-table th, .client-info-table td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 9pt; }
          .client-info-table th { background-color: #f5f5f5; }
          .floor-section { margin-bottom: 25px; padding-top: 10px; }
          .floor-title { font-size: 14pt; font-weight: bold; margin-bottom: 15px; color: #333; border-top: 1px dashed #ccc; padding-top:15px; }
          .floor-section:first-of-type .floor-title { border-top: none; padding-top:0; }
          .category-section { margin-bottom: 10px; }
          .category-title { font-size: 12pt; font-weight: bold; margin-top: 10px; margin-bottom: 5px; color: #444; }
          .subitem-list, .special-item-details, .pressure-item-details, .registry-list { margin-left: 0; padding-left: 0; list-style-type: none; }
          .subitem-list li, .registry-list li { margin-bottom: 4px; padding-left: 10px; border-left: 2px solid #eee; }
          .subitem-list li strong, .special-item-details p strong, .pressure-item-details p strong { font-weight: normal; color: #555; }
          .observation-note { font-style: italic; color: #777; margin-left: 15px; font-size: 9pt; padding-top: 2px;}
          .registry-title { font-size: 10pt; font-weight: bold; margin-top: 8px; margin-bottom: 3px; color: #555; }
          .page-break-before { page-break-before: always; }
          
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .floor-section, .category-section, .subitem-list li, .registry-list li { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
  `;

  pdfHtml += `
    <div class="header-container">
      <div class="header-text">
        <h1>BRAZIL EXTINTORES</h1>
        <p>VISTORIA TÉCNICA</p>
      </div>
      <div class="header-logo">
        <img src="${logoUrl}" alt="Logo Brazil Extintores" onerror="this.style.display='none'"/>
      </div>
    </div>
    <table class="client-info-table">
      <tr>
        <th>Número da Vistoria:</th><td>${clientInfo.inspectionNumber || `${clientInfo.clientCode}-01`}</td>
        <th>Data da Vistoria:</th><td>${clientInfo.inspectionDate ? format(new Date(clientInfo.inspectionDate + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</td>
      </tr>
      <tr>
        <th>Local (Cliente):</th><td colspan="3">${clientInfo.clientLocation.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
      </tr>
      <tr>
        <th>Código do Cliente:</th><td>${clientInfo.clientCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
        <th>Data da Geração do PDF:</th><td>${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
      </tr>
    </table>
  `;

  floorsData.forEach((floor) => {
    if (!floor.floor) return;

    pdfHtml += `<div class="floor-section">`;
    pdfHtml += `<div class="floor-title">Andar: ${floor.floor.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;

    floor.categories.forEach(category => {
      pdfHtml += `<div class="category-section">`;
      pdfHtml += `<h3 class="category-title">${category.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>`;

      if (category.type === 'standard' && category.subItems) {
        pdfHtml += `<ul class="subitem-list">`;
        category.subItems.forEach(subItem => {
          if (subItem.isRegistry) {
            pdfHtml += `<li><strong>${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}:</strong>`;
            if (subItem.registeredExtinguishers && subItem.registeredExtinguishers.length > 0) {
              pdfHtml += `<ul class="registry-list" style="padding-left: 15px; margin-top: 5px;">`;
              subItem.registeredExtinguishers.forEach(ext => {
                pdfHtml += `<li>${ext.quantity}x - ${ext.type} - ${ext.weight}</li>`;
              });
              pdfHtml += `</ul>`;
            } else {
              pdfHtml += ` <span style="color: #777;">Nenhum extintor cadastrado.</span>`;
            }
            pdfHtml += `</li>`;
          } else {
            pdfHtml += `<li><strong>${subItem.name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}:</strong> ${getStatusLabel(subItem.status)}`;
            if (subItem.showObservation && subItem.observation) {
              pdfHtml += `<div class="observation-note">Obs: ${subItem.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>')}</div>`;
            }
            pdfHtml += `</li>`;
          }
        });
        pdfHtml += `</ul>`;
      } else if (category.type === 'special') {
        pdfHtml += `<div class="special-item-details">`;
        pdfHtml += `<p><strong>Status Geral:</strong> ${getStatusLabel(category.status)}</p>`;
        if (category.showObservation && category.observation) {
          pdfHtml += `<div class="observation-note">Obs: ${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>')}</div>`;
        }
        pdfHtml += `</div>`;
      } else if (category.type === 'pressure') {
        pdfHtml += `<div class="pressure-item-details">`;
        pdfHtml += `<p><strong>Pressão:</strong> ${category.pressureValue ? category.pressureValue.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'N/P'} ${category.pressureUnit || ''}</p>`;
        if (category.showObservation && category.observation) {
          pdfHtml += `<div class="observation-note">Obs: ${category.observation.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>')}</div>`;
        }
        pdfHtml += `</div>`;
      }
      pdfHtml += `</div>`;
    });
    pdfHtml += `</div>`;
  });

  pdfHtml += `
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
        alert("Ocorreu um erro ao tentar imprimir. Verifique o console para detalhes.");
      }
    }, 500);
  } else {
    alert("Não foi possível abrir a janela de impressão. Verifique se o seu navegador está bloqueando pop-ups.");
  }
}
