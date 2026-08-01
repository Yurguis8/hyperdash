import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { DashboardPayload } from './dashboard-types';

const BORDER = { style: 'thin' as const, color: { argb: 'E4E4E7' } };
const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '18181B' } };
const SUBHEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'F4F4F5' } };

function styleHeaderRow(row: ExcelJS.Row, height = 28) {
  row.height = height;
  row.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  row.fill = HEADER_FILL;
  row.alignment = { vertical: 'middle', horizontal: 'left' };
  row.eachCell((cell) => {
    cell.border = { bottom: BORDER };
  });
}

function styleSubHeaderRow(row: ExcelJS.Row) {
  row.height = 24;
  row.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '52525B' } };
  row.fill = SUBHEADER_FILL;
  row.alignment = { vertical: 'middle', horizontal: 'left' };
}

function styleDataRow(row: ExcelJS.Row, zebra: boolean) {
  row.height = 22;
  row.font = { name: 'Calibri', size: 10, color: { argb: '27272A' } };
  if (zebra) {
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAFAFA' } };
  }
  row.eachCell((cell) => {
    cell.border = {
      top: BORDER,
      bottom: BORDER,
      left: BORDER,
      right: BORDER,
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });
}

function formatTrend(change: number | null): string {
  if (change === null) return '—';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1).replace('.', ',')}% vs período anterior`;
}

export async function exportDashboardToExcel(data: DashboardPayload, fileName = 'metadash-relatorio.xlsx') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MetaDash';
  workbook.created = new Date();

  const summary = workbook.addWorksheet('Resumo', {
    views: [{ state: 'frozen', ySplit: 8 }],
  });
  summary.properties.defaultColWidth = 14;
  summary.getColumn(1).width = 22;
  summary.getColumn(2).width = 18;
  summary.getColumn(3).width = 28;

  summary.mergeCells('A1:C1');
  const titleCell = summary.getCell('A1');
  titleCell.value = 'MetaDash — Relatório de Performance';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: '18181B' } };
  titleCell.alignment = { vertical: 'middle' };
  summary.getRow(1).height = 32;

  summary.getCell('A2').value = 'Período';
  summary.getCell('B2').value = data.periodLabel;
  summary.getCell('A3').value = 'Conta';
  summary.getCell('B3').value = data.accountName ?? '—';
  summary.getCell('A4').value = 'Gerado em';
  summary.getCell('B4').value = new Date(data.generatedAt).toLocaleString('pt-BR');
  summary.getCell('A5').value = 'ROAS consolidado';
  summary.getCell('B5').value = data.metrics.roas.value;

  ['A2', 'A3', 'A4', 'A5'].forEach((ref) => {
    summary.getCell(ref).font = { bold: true, color: { argb: '71717A' }, size: 10 };
  });
  ['B2', 'B3', 'B4', 'B5'].forEach((ref) => {
    summary.getCell(ref).font = { size: 10, color: { argb: '18181B' } };
  });

  const headerRow = summary.getRow(8);
  headerRow.values = ['Métrica', 'Valor', 'Tendência'];
  styleHeaderRow(headerRow);

  const metricRows: [string, string, string][] = [
    ['Investimento', data.metrics.spend.value, formatTrend(data.metrics.spend.changePercent)],
    ['Impressões', data.metrics.impressions.value, formatTrend(data.metrics.impressions.changePercent)],
    ['Cliques', data.metrics.clicks.value, formatTrend(data.metrics.clicks.changePercent)],
    ['CTR', data.metrics.ctr.value, formatTrend(data.metrics.ctr.changePercent)],
    ['CPC', data.metrics.cpc.value, formatTrend(data.metrics.cpc.changePercent)],
    ['CPM', data.metrics.cpm.value, formatTrend(data.metrics.cpm.changePercent)],
    ['Alcance', data.metrics.reach.value, formatTrend(data.metrics.reach.changePercent)],
    ['ROAS', data.metrics.roas.value, formatTrend(data.metrics.roas.changePercent)],
  ];

  metricRows.forEach(([metric, value, trend], index) => {
    const row = summary.addRow([metric, value, trend]);
    styleDataRow(row, index % 2 === 0);
    row.getCell(2).font = { name: 'Calibri', size: 10, bold: true };
  });

  const daily = workbook.addWorksheet('Evolução diária');
  daily.getColumn(1).width = 14;
  daily.getColumn(2).width = 16;
  daily.getColumn(3).width = 18;

  const dailyHeader = daily.getRow(1);
  dailyHeader.values = ['Data', 'Investimento (R$)', 'Receita (R$)'];
  styleHeaderRow(dailyHeader);

  data.timeSeries.forEach((point, index) => {
    const row = daily.addRow([
      point.label,
      point.spend,
      point.revenue,
    ]);
    styleDataRow(row, index % 2 === 0);
    row.getCell(2).numFmt = '"R$" #,##0.00';
    row.getCell(3).numFmt = '"R$" #,##0.00';
  });

  const ads = workbook.addWorksheet('Top anúncios');
  ads.getColumn(1).width = 36;
  ads.getColumn(2).width = 16;
  ads.getColumn(3).width = 14;
  ads.getColumn(4).width = 12;

  const adsHeader = ads.getRow(1);
  adsHeader.values = ['Anúncio', 'Investimento', 'CPC', 'ROAS'];
  styleHeaderRow(adsHeader);

  data.topAds.forEach((ad, index) => {
    const row = ads.addRow([ad.name, ad.spendRaw, ad.cpcRaw, ad.roasRaw]);
    styleDataRow(row, index % 2 === 0);
    row.getCell(2).numFmt = '"R$" #,##0.00';
    row.getCell(3).numFmt = '"R$" #,##0.00';
    row.getCell(4).numFmt = '0.0"x"';
  });

  if (data.topAds.length === 0) {
    const row = ads.addRow(['Nenhum anúncio no período', '—', '—', '—']);
    styleDataRow(row, false);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
}

/** @deprecated Use exportDashboardToExcel */
export async function exportToExcel(
  data: Array<{ Metrica: string; Valor: string }>,
  fileName = 'relatorio.xlsx'
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Métricas Meta Ads');
  worksheet.columns = [
    { header: 'Métrica', key: 'Metrica', width: 25 },
    { header: 'Valor / Resultado', key: 'Valor', width: 20 },
  ];
  styleHeaderRow(worksheet.getRow(1));
  data.forEach((item, index) => {
    const row = worksheet.addRow(item);
    styleDataRow(row, index % 2 === 0);
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
}
