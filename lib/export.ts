import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function exportToExcel(data: Array<{ Metrica: string; Valor: string }>, fileName = 'relatorio.xlsx') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Métricas Meta Ads');

  // Define as colunas e larguras
  worksheet.columns = [
    { header: 'Métrica', key: 'Metrica', width: 25 },
    { header: 'Valor / Resultado', key: 'Valor', width: 20 },
  ];

  // Estiliza o cabeçalho (Linha 1)
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0071E3' }, // Azul estilo Apple / SaaS Pro
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;

  // Adiciona as linhas de dados
  data.forEach((item) => {
    const row = worksheet.addRow(item);
    row.height = 24;
    row.alignment = { vertical: 'middle', horizontal: 'left' };
    
    // Adiciona bordas finas em cada célula
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'E5E5EA' } },
        bottom: { style: 'thin', color: { argb: 'E5E5EA' } },
        left: { style: 'thin', color: { argb: 'E5E5EA' } },
        right: { style: 'thin', color: { argb: 'E5E5EA' } },
      };
      cell.font = { name: 'Arial', size: 11 };
    });
  });

  // Gera o arquivo e faz o download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
}