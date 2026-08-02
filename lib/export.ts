import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { DashboardPayload } from './dashboard-types';

const BORDER_LIGHT = { style: 'thin' as const, color: { argb: 'E2E8F0' } };
const BORDER_MEDIUM = { style: 'medium' as const, color: { argb: 'CBD5E1' } };

// Helpers de cores para ROAS (tons corporativos discretos)
const ROAS_COLORS = {
  bom: { bg: 'D1FAE5', font: '065F46' },      // Verde suave
  atencao: { bg: 'FEF3C7', font: '92400E' },  // Amarelo suave
  critico: { bg: 'FEE2E2', font: '991B1B' },  // Vermelho suave
};

function getRoasStyle(roas: number) {
  if (roas >= 3.0) return ROAS_COLORS.bom;
  if (roas >= 1.0) return ROAS_COLORS.atencao;
  return ROAS_COLORS.critico;
}

function parsePtBrNumber(value: string): number {
  const normalized = value
    .replace(/\s/g, '')
    .replace(/[^0-9,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function applyCardBorder(ws: ExcelJS.Worksheet, startCol: number, endCol: number, startRow: number, endRow: number) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = ws.getCell(r, c);
      cell.border = {
        top: r === startRow ? BORDER_MEDIUM : undefined,
        bottom: r === endRow ? BORDER_MEDIUM : undefined,
        left: c === startCol ? BORDER_MEDIUM : undefined,
        right: c === endCol ? BORDER_MEDIUM : undefined,
      };
    }
  }
}

export async function exportDashboardToExcel(
  data: DashboardPayload,
  fileName = 'hyperpanel-relatorio.xlsx',
  chartBase64?: string
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HyperPanel';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Resumo Executivo', {
    views: [{ showGridLines: true }],
  });

  // Configurar larguras de colunas
  ws.columns = [
    { key: 'A', width: 22 }, // Canal / Campanha / Etapa
    { key: 'B', width: 16 }, // Investimento
    { key: 'C', width: 16 }, // Receita
    { key: 'D', width: 16 }, // ROAS
    { key: 'E', width: 14 }, // Leads
    { key: 'F', width: 14 }, // Conversões
    { key: 'G', width: 14 }, // CPC
    { key: 'H', width: 14 }, // CPL
    { key: 'I', width: 14 }, // CTR
    { key: 'J', width: 14 }, // Conv. Lead
    { key: 'K', width: 4 },  // Spacer
    { key: 'L', width: 22 }, // Legenda / Campanha
    { key: 'M', width: 16 }, // Campanha Investimento
    { key: 'N', width: 16 }, // Campanha Receita
    { key: 'O', width: 14 }, // Campanha ROAS
  ];

  // 1. Cabeçalho Principal (Row 2 & Row 3) - Tema Slate do Hyperpanel
  ws.mergeCells('A2:O2');
  const titleCell = ws.getCell('A2');
  titleCell.value = 'DASHBOARD DE PERFORMANCE DE MARKETING';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } }; // Slate 900
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 28;

  ws.mergeCells('A3:O3');
  const subTitleCell = ws.getCell('A3');
  subTitleCell.value = 'Visão executiva • Relatório consolidado gerado pelo HyperPanel';
  subTitleCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: '94A3B8' } }; // Slate 400
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(3).height = 18;

  // 2. Filtros (Row 4 & Row 5)
  // Data Inicial
  ws.mergeCells('A4:B4');
  const filterD1Header = ws.getCell('A4');
  filterD1Header.value = 'DATA INICIAL';
  filterD1Header.font = { name: 'Arial', size: 8, bold: true, color: { argb: '1E293B' } }; // Slate 800
  filterD1Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } }; // Slate 100
  filterD1Header.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('A5:B5');
  const filterD1Val = ws.getCell('A5');
  filterD1Val.value = data.timeSeries[0]?.label || '—';
  filterD1Val.font = { name: 'Arial', size: 9, bold: true, color: { argb: '1E293B' } };
  filterD1Val.alignment = { vertical: 'middle', horizontal: 'center' };

  // Data Final
  ws.mergeCells('C4:D4');
  const filterD2Header = ws.getCell('C4');
  filterD2Header.value = 'DATA FINAL';
  filterD2Header.font = { name: 'Arial', size: 8, bold: true, color: { argb: '1E293B' } };
  filterD2Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
  filterD2Header.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('C5:D5');
  const filterD2Val = ws.getCell('C5');
  filterD2Val.value = data.timeSeries[data.timeSeries.length - 1]?.label || '—';
  filterD2Val.font = { name: 'Arial', size: 9, bold: true, color: { argb: '1E293B' } };
  filterD2Val.alignment = { vertical: 'middle', horizontal: 'center' };

  // Canal
  ws.mergeCells('E4:F4');
  const filterChanHeader = ws.getCell('E4');
  filterChanHeader.value = 'CANAL';
  filterChanHeader.font = { name: 'Arial', size: 8, bold: true, color: { argb: '1E293B' } };
  filterChanHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
  filterChanHeader.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('E5:F5');
  const filterChanVal = ws.getCell('E5');
  filterChanVal.value = 'Meta Ads';
  filterChanVal.font = { name: 'Arial', size: 9, bold: true, color: { argb: '1E293B' } };
  filterChanVal.alignment = { vertical: 'middle', horizontal: 'center' };

  // Campanha
  ws.mergeCells('G4:H4');
  const filterCampHeader = ws.getCell('G4');
  filterCampHeader.value = 'CAMPANHA';
  filterCampHeader.font = { name: 'Arial', size: 8, bold: true, color: { argb: '1E293B' } };
  filterCampHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
  filterCampHeader.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('G5:H5');
  const filterCampVal = ws.getCell('G5');
  filterCampVal.value = 'Todas';
  filterCampVal.font = { name: 'Arial', size: 9, bold: true, color: { argb: '1E293B' } };
  filterCampVal.alignment = { vertical: 'middle', horizontal: 'center' };

  // Adicionar bordas finas na seção de filtros
  for (let r = 4; r <= 5; r++) {
    for (let c = 1; c <= 8; c++) {
      ws.getCell(r, c).border = {
        top: BORDER_LIGHT,
        bottom: BORDER_LIGHT,
        left: BORDER_LIGHT,
        right: BORDER_LIGHT,
      };
    }
  }
  ws.getRow(4).height = 16;
  ws.getRow(5).height = 18;


  // 3. KPIs Linha 1 (Row 7 to 10)
  // Card 1: INVESTIMENTO (A-B) - Indigo
  ws.mergeCells('A7:B7');
  const kpi1Header = ws.getCell('A7');
  kpi1Header.value = 'INVESTIMENTO';
  kpi1Header.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FFFFFF' } };
  kpi1Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } }; // Indigo 600
  kpi1Header.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('A8:B9');
  const kpi1Val = ws.getCell('A8');
  kpi1Val.value = data.metrics.spend.raw ?? 0;
  kpi1Val.numFmt = '"R$" #,##0.00';
  kpi1Val.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1E293B' } };
  kpi1Val.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('A10:B10');
  const kpi1Desc = ws.getCell('A10');
  kpi1Desc.value = 'Total aplicado no período';
  kpi1Desc.font = { name: 'Arial', size: 7.5, color: { argb: '64748B' } };
  kpi1Desc.alignment = { vertical: 'middle', horizontal: 'center' };
  applyCardBorder(ws, 1, 2, 7, 10);

  // Card 2: RECEITA ATRIBUÍDA (C-D) - Emerald
  const spend = data.metrics.spend.raw ?? 0;
  const roas = data.roasNumeric ?? 0;
  const revenue = spend * roas;

  ws.mergeCells('C7:D7');
  const kpi2Header = ws.getCell('C7');
  kpi2Header.value = 'RECEITA ATRIBUÍDA';
  kpi2Header.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FFFFFF' } };
  kpi2Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }; // Emerald 500
  kpi2Header.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('C8:D9');
  const kpi2Val = ws.getCell('C8');
  kpi2Val.value = revenue;
  kpi2Val.numFmt = '"R$" #,##0.00';
  kpi2Val.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1E293B' } };
  kpi2Val.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('C10:D10');
  const kpi2Desc = ws.getCell('C10');
  kpi2Desc.value = 'Receita associada às campanhas';
  kpi2Desc.font = { name: 'Arial', size: 7.5, color: { argb: '64748B' } };
  kpi2Desc.alignment = { vertical: 'middle', horizontal: 'center' };
  applyCardBorder(ws, 3, 4, 7, 10);

  // Card 3: ROAS (E-F) - Amber
  ws.mergeCells('E7:F7');
  const kpi3Header = ws.getCell('E7');
  kpi3Header.value = 'ROAS';
  kpi3Header.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FFFFFF' } };
  kpi3Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F59E0B' } }; // Amber 500
  kpi3Header.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('E8:F9');
  const kpi3Val = ws.getCell('E8');
  kpi3Val.value = roas;
  kpi3Val.numFmt = '0.00"x"';
  kpi3Val.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1E293B' } };
  kpi3Val.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('E10:F10');
  const kpi3Desc = ws.getCell('E10');
  kpi3Desc.value = 'Receita ÷ Investimento';
  kpi3Desc.font = { name: 'Arial', size: 7.5, color: { argb: '64748B' } };
  kpi3Desc.alignment = { vertical: 'middle', horizontal: 'center' };
  applyCardBorder(ws, 5, 6, 7, 10);

  // Card 4: LEADS (G-I) - Slate 900
  ws.mergeCells('G7:I7');
  const kpi4Header = ws.getCell('G7');
  kpi4Header.value = 'LEADS';
  kpi4Header.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FFFFFF' } };
  kpi4Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } }; // Slate 900
  kpi4Header.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('G8:I9');
  const kpi4Val = ws.getCell('G8');
  kpi4Val.value = data.metrics.leads.raw ?? 0;
  kpi4Val.numFmt = '#,##0';
  kpi4Val.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1E293B' } };
  kpi4Val.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('G10:I10');
  const kpi4Desc = ws.getCell('G10');
  kpi4Desc.value = 'Contatos gerados no período';
  kpi4Desc.font = { name: 'Arial', size: 7.5, color: { argb: '64748B' } };
  kpi4Desc.alignment = { vertical: 'middle', horizontal: 'center' };
  applyCardBorder(ws, 7, 9, 7, 10);

  ws.getRow(7).height = 16;
  ws.getRow(8).height = 14;
  ws.getRow(9).height = 14;
  ws.getRow(10).height = 15;


  // 4. KPIs Linha 2 (Row 12 to 15)
  // Card 5: CONVERSÕES (A-B) - Emerald 600
  ws.mergeCells('A12:B12');
  const kpi5Header = ws.getCell('A12');
  kpi5Header.value = 'CONVERSÕES';
  kpi5Header.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FFFFFF' } };
  kpi5Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } }; // Emerald 600
  kpi5Header.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('A13:B14');
  const kpi5Val = ws.getCell('A13');
  kpi5Val.value = data.metrics.conversions.raw ?? 0;
  kpi5Val.numFmt = '#,##0';
  kpi5Val.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1E293B' } };
  kpi5Val.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('A15:B15');
  const kpi5Desc = ws.getCell('A15');
  kpi5Desc.value = 'Resultados finais atribuídos';
  kpi5Desc.font = { name: 'Arial', size: 7.5, color: { argb: '64748B' } };
  kpi5Desc.alignment = { vertical: 'middle', horizontal: 'center' };
  applyCardBorder(ws, 1, 2, 12, 15);

  // Card 6: CTR (C-D) - Slate 700
  ws.mergeCells('C12:D12');
  const kpi6Header = ws.getCell('C12');
  kpi6Header.value = 'CTR';
  kpi6Header.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FFFFFF' } };
  kpi6Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '334155' } }; // Slate 700
  kpi6Header.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('C13:D14');
  const kpi6Val = ws.getCell('C13');
  kpi6Val.value = (data.metrics.ctr.raw ?? 0) / 100;
  kpi6Val.numFmt = '0.0%';
  kpi6Val.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1E293B' } };
  kpi6Val.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('C15:D15');
  const kpi6Desc = ws.getCell('C15');
  kpi6Desc.value = 'Cliques ÷ Impressões';
  kpi6Desc.font = { name: 'Arial', size: 7.5, color: { argb: '64748B' } };
  kpi6Desc.alignment = { vertical: 'middle', horizontal: 'center' };
  applyCardBorder(ws, 3, 4, 12, 15);

  // Card 7: CPC (E-F) - Slate 600
  ws.mergeCells('E12:F12');
  const kpi7Header = ws.getCell('E12');
  kpi7Header.value = 'CPC';
  kpi7Header.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FFFFFF' } };
  kpi7Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '475569' } }; // Slate 600
  kpi7Header.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('E13:F14');
  const kpi7Val = ws.getCell('E13');
  kpi7Val.value = data.metrics.cpc.raw ?? 0;
  kpi7Val.numFmt = '"R$" #,##0.00';
  kpi7Val.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1E293B' } };
  kpi7Val.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('E15:F15');
  const kpi7Desc = ws.getCell('E15');
  kpi7Desc.value = 'Investimento ÷ Cliques';
  kpi7Desc.font = { name: 'Arial', size: 7.5, color: { argb: '64748B' } };
  kpi7Desc.alignment = { vertical: 'middle', horizontal: 'center' };
  applyCardBorder(ws, 5, 6, 12, 15);

  // Card 8: CPL (G-I) - Indigo
  ws.mergeCells('G12:I12');
  const kpi8Header = ws.getCell('G12');
  kpi8Header.value = 'CPL';
  kpi8Header.font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FFFFFF' } };
  kpi8Header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } }; // Indigo
  kpi8Header.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('G13:I14');
  const kpi8Val = ws.getCell('G13');
  kpi8Val.value = data.metrics.cpl.raw ?? 0;
  kpi8Val.numFmt = '"R$" #,##0.00';
  kpi8Val.font = { name: 'Arial', size: 16, bold: true, color: { argb: '1E293B' } };
  kpi8Val.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('G15:I15');
  const kpi8Desc = ws.getCell('G15');
  kpi8Desc.value = 'Investimento ÷ Leads';
  kpi8Desc.font = { name: 'Arial', size: 7.5, color: { argb: '64748B' } };
  kpi8Desc.alignment = { vertical: 'middle', horizontal: 'center' };
  applyCardBorder(ws, 7, 9, 12, 15);

  ws.getRow(12).height = 16;
  ws.getRow(13).height = 14;
  ws.getRow(14).height = 14;
  ws.getRow(15).height = 15;


  // 5. Tabela "RESUMO DE PERFORMANCE META ADS" (Row 17) - Slate 900
  ws.mergeCells('A17:J17');
  const tbl1Title = ws.getCell('A17');
  tbl1Title.value = 'RESUMO DE PERFORMANCE META ADS';
  tbl1Title.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  tbl1Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } }; // Slate 900
  tbl1Title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Legenda de desempenho (Row 17 lado direito)
  ws.mergeCells('L17:O17');
  const legendTitle = ws.getCell('L17');
  legendTitle.value = 'LEGENDA DE DESEMPENHO';
  legendTitle.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
  legendTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
  legendTitle.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.getRow(17).height = 22;

  // Cabeçalhos (Row 18)
  const headers = [
    'Plataforma', 'Investimento', 'Receita', 'ROAS', 'Leads', 'Conversões', 'CPC', 'CPL', 'CTR', 'Conv. Lead'
  ];
  headers.forEach((h, idx) => {
    const cell = ws.getCell(18, idx + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '334155' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: idx === 0 ? 'left' : idx === 3 ? 'center' : 'right'
    };
    cell.border = { bottom: BORDER_MEDIUM, top: BORDER_LIGHT };
  });

  // Legenda de desempenho itens
  ws.mergeCells('L18:O18');
  const lSub = ws.getCell('L18');
  lSub.value = 'Classificação por ROAS';
  lSub.font = { name: 'Arial', size: 8, italic: true, color: { argb: '64748B' } };
  lSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
  lSub.alignment = { vertical: 'middle', horizontal: 'center' };
  lSub.border = { bottom: BORDER_MEDIUM, top: BORDER_LIGHT };

  ws.getRow(18).height = 20;

  // Preenche dados dos canais (Row 19 em diante)
  let channelRowIndex = 19;
  data.channels.forEach((ch) => {
    const row = ws.getRow(channelRowIndex);
    row.height = 20;

    ws.getCell(channelRowIndex, 1).value = ch.name;
    ws.getCell(channelRowIndex, 2).value = ch.spendRaw;
    ws.getCell(channelRowIndex, 3).value = ch.revenueRaw;
    ws.getCell(channelRowIndex, 4).value = ch.roasRaw;
    ws.getCell(channelRowIndex, 5).value = ch.leadsRaw;
    ws.getCell(channelRowIndex, 6).value = ch.conversionsRaw;

    ws.getCell(channelRowIndex, 7).value = parsePtBrNumber(ch.cpc);
    ws.getCell(channelRowIndex, 8).value = parsePtBrNumber(ch.cpl);
    ws.getCell(channelRowIndex, 9).value = parsePtBrNumber(ch.ctr) / 100;
    ws.getCell(channelRowIndex, 10).value = parsePtBrNumber(ch.leadConversionRate) / 100;

    // Formatação de Células
    ws.getCell(channelRowIndex, 1).font = { name: 'Arial', size: 9, bold: true };
    ws.getCell(channelRowIndex, 2).numFmt = '"R$" #,##0.00';
    ws.getCell(channelRowIndex, 3).numFmt = '"R$" #,##0.00';
    ws.getCell(channelRowIndex, 4).numFmt = '0.00"x"';
    ws.getCell(channelRowIndex, 5).numFmt = '#,##0';
    ws.getCell(channelRowIndex, 6).numFmt = '#,##0';
    ws.getCell(channelRowIndex, 7).numFmt = '"R$" #,##0.00';
    ws.getCell(channelRowIndex, 8).numFmt = '"R$" #,##0.00';
    ws.getCell(channelRowIndex, 9).numFmt = '0.0%';
    ws.getCell(channelRowIndex, 10).numFmt = '0.0%';

    // Alinhamentos
    ws.getCell(channelRowIndex, 1).alignment = { vertical: 'middle', horizontal: 'left' };
    for (let c = 2; c <= 10; c++) {
      ws.getCell(channelRowIndex, c).alignment = {
        vertical: 'middle',
        horizontal: c === 4 ? 'center' : 'right'
      };
      ws.getCell(channelRowIndex, c).font = { name: 'Arial', size: 9 };
    }

    // Estilo Condicional de ROAS
    const rStyle = getRoasStyle(ch.roasRaw);
    ws.getCell(channelRowIndex, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rStyle.bg } };
    ws.getCell(channelRowIndex, 4).font = { name: 'Arial', size: 9, bold: true, color: { argb: rStyle.font } };

    // Bordas de linhas
    for (let c = 1; c <= 10; c++) {
      ws.getCell(channelRowIndex, c).border = { bottom: BORDER_LIGHT };
    }

    channelRowIndex++;
  });

  // Legenda de desempenho itens de cores (Abaixo do cabeçalho da legenda)
  const legends = [
    { label: 'Bom (ROAS ≥ 3,0)', ...ROAS_COLORS.bom },
    { label: 'Atenção (ROAS 1,0 - 2,99)', ...ROAS_COLORS.atencao },
    { label: 'Crítico (ROAS < 1,0)', ...ROAS_COLORS.critico },
  ];
  legends.forEach((leg, idx) => {
    const lRow = 19 + idx;
    ws.mergeCells(`L${lRow}:O${lRow}`);
    const lCell = ws.getCell(lRow, 12);
    lCell.value = leg.label;
    lCell.font = { name: 'Arial', size: 8.5, bold: true, color: { argb: leg.font } };
    lCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: leg.bg } };
    lCell.alignment = { vertical: 'middle', horizontal: 'center' };
    lCell.border = {
      top: BORDER_LIGHT,
      bottom: BORDER_LIGHT,
      left: BORDER_LIGHT,
      right: BORDER_LIGHT
    };
  });


  // 6. Bloco Inferior (Row 25) - Slate 800 para cabeçalhos de tabelas secundárias
  const lowerStartRow = 25;
  ws.mergeCells(`A${lowerStartRow}:D${lowerStartRow}`);
  const tblFunnelTitle = ws.getCell(lowerStartRow, 1);
  tblFunnelTitle.value = 'EFICIÊNCIA DO FUNIL';
  tblFunnelTitle.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  tblFunnelTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } }; // Slate 800
  tblFunnelTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Coluna F-I: RESULTADOS POR CAMPANHA
  ws.mergeCells(`F${lowerStartRow}:I${lowerStartRow}`);
  const tblCampTitle = ws.getCell(lowerStartRow, 6);
  tblCampTitle.value = 'RESULTADOS POR CAMPANHA';
  tblCampTitle.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  tblCampTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } }; // Slate 800
  tblCampTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Coluna L-O: TOP ANÚNCIOS
  ws.mergeCells(`L${lowerStartRow}:O${lowerStartRow}`);
  const tblAdsTitle = ws.getCell(lowerStartRow, 12);
  tblAdsTitle.value = 'TOP ANÚNCIOS';
  tblAdsTitle.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  tblAdsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } }; // Slate 800
  tblAdsTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  ws.getRow(lowerStartRow).height = 22;

  // Cabeçalhos do Funil (Row 26)
  ws.mergeCells(`A${lowerStartRow + 1}:C${lowerStartRow + 1}`);
  const fHead1 = ws.getCell(lowerStartRow + 1, 1);
  fHead1.value = 'Etapa do Funil';
  fHead1.font = { name: 'Arial', size: 9, bold: true, color: { argb: '334155' } };
  fHead1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
  fHead1.alignment = { vertical: 'middle', horizontal: 'left' };

  const fHead2 = ws.getCell(lowerStartRow + 1, 4);
  fHead2.value = 'Taxa';
  fHead2.font = { name: 'Arial', size: 9, bold: true, color: { argb: '334155' } };
  fHead2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
  fHead2.alignment = { vertical: 'middle', horizontal: 'center' };

  // Cabeçalhos de Campanhas (Row 26)
  const campHeaders = ['Campanha', 'Investimento', 'Receita', 'ROAS'];
  campHeaders.forEach((h, idx) => {
    const col = 6 + idx;
    const cell = ws.getCell(lowerStartRow + 1, col);
    cell.value = h;
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '334155' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: idx === 0 ? 'left' : idx === 3 ? 'center' : 'right'
    };
  });

  // Cabeçalhos de Anúncios (Row 26)
  const adHeaders = ['Anúncio', 'Investimento', 'CPC', 'ROAS'];
  adHeaders.forEach((h, idx) => {
    const col = 12 + idx;
    const cell = ws.getCell(lowerStartRow + 1, col);
    cell.value = h;
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '334155' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: idx === 0 ? 'left' : idx === 3 ? 'center' : 'right'
    };
  });

  ws.getRow(lowerStartRow + 1).height = 20;

  // Dados do Funil (Row 27-29)
  const funnelSteps = data.funnel;
  funnelSteps.forEach((step, idx) => {
    const rNum = lowerStartRow + 2 + idx;
    ws.getRow(rNum).height = 20;

    ws.mergeCells(`A${rNum}:C${rNum}`);
    const cStep = ws.getCell(rNum, 1);
    cStep.value = step.label;
    cStep.font = { name: 'Arial', size: 9 };
    cStep.alignment = { vertical: 'middle', horizontal: 'left' };

    const cVal = ws.getCell(rNum, 4);
    cVal.value = step.rate / 100;
    cVal.font = { name: 'Arial', size: 9, bold: true };
    cVal.numFmt = '0.0%';
    cVal.alignment = { vertical: 'middle', horizontal: 'center' };

    for (let c = 1; c <= 4; c++) {
      ws.getCell(rNum, c).border = { bottom: BORDER_LIGHT };
    }
  });

  // Dados de Campanhas (Row 27-31)
  data.campaigns.forEach((cRow, idx) => {
    const rNum = lowerStartRow + 2 + idx;
    ws.getRow(rNum).height = 20;

    ws.getCell(rNum, 6).value = cRow.name;
    ws.getCell(rNum, 7).value = cRow.spendRaw;
    ws.getCell(rNum, 8).value = cRow.revenueRaw;
    ws.getCell(rNum, 9).value = cRow.roasRaw;

    ws.getCell(rNum, 6).font = { name: 'Arial', size: 9 };
    ws.getCell(rNum, 7).font = { name: 'Arial', size: 9 };
    ws.getCell(rNum, 8).font = { name: 'Arial', size: 9 };

    ws.getCell(rNum, 7).numFmt = '"R$" #,##0.00';
    ws.getCell(rNum, 8).numFmt = '"R$" #,##0.00';
    ws.getCell(rNum, 9).numFmt = '0.00"x"';

    ws.getCell(rNum, 6).alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getCell(rNum, 7).alignment = { vertical: 'middle', horizontal: 'right' };
    ws.getCell(rNum, 8).alignment = { vertical: 'middle', horizontal: 'right' };
    ws.getCell(rNum, 9).alignment = { vertical: 'middle', horizontal: 'center' };

    const rStyle = getRoasStyle(cRow.roasRaw);
    ws.getCell(rNum, 9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rStyle.bg } };
    ws.getCell(rNum, 9).font = { name: 'Arial', size: 9, bold: true, color: { argb: rStyle.font } };

    for (let c = 6; c <= 9; c++) {
      ws.getCell(rNum, c).border = { bottom: BORDER_LIGHT };
    }
  });

  // Dados de Anúncios (Row 27-29)
  data.topAds.forEach((adRow, idx) => {
    const rNum = lowerStartRow + 2 + idx;
    ws.getRow(rNum).height = 20;

    ws.getCell(rNum, 12).value = adRow.name;
    ws.getCell(rNum, 13).value = adRow.spendRaw;
    ws.getCell(rNum, 14).value = adRow.cpcRaw;
    ws.getCell(rNum, 15).value = adRow.roasRaw;

    ws.getCell(rNum, 12).font = { name: 'Arial', size: 9 };
    ws.getCell(rNum, 13).font = { name: 'Arial', size: 9 };
    ws.getCell(rNum, 14).font = { name: 'Arial', size: 9 };

    ws.getCell(rNum, 13).numFmt = '"R$" #,##0.00';
    ws.getCell(rNum, 14).numFmt = '"R$" #,##0.00';
    ws.getCell(rNum, 15).numFmt = '0.00"x"';

    ws.getCell(rNum, 12).alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getCell(rNum, 13).alignment = { vertical: 'middle', horizontal: 'right' };
    ws.getCell(rNum, 14).alignment = { vertical: 'middle', horizontal: 'right' };
    ws.getCell(rNum, 15).alignment = { vertical: 'middle', horizontal: 'center' };

    const rStyle = getRoasStyle(adRow.roasRaw);
    ws.getCell(rNum, 15).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rStyle.bg } };
    ws.getCell(rNum, 15).font = { name: 'Arial', size: 9, bold: true, color: { argb: rStyle.font } };

    for (let c = 12; c <= 15; c++) {
      ws.getCell(rNum, c).border = { bottom: BORDER_LIGHT };
    }
  });

  // Embutir a imagem do gráfico capturado se fornecido
  if (chartBase64) {
    try {
      const imageId = workbook.addImage({
        base64: chartBase64,
        extension: 'png',
      });
      // Inserir a partir da coluna B, linha 34 (row 33, col 1)
      ws.addImage(imageId, {
        tl: { col: 1, row: 33 },
        ext: { width: 680, height: 320 }
      });
    } catch (imageError) {
      console.error('Erro ao adicionar imagem do gráfico no Excel:', imageError);
    }
  }

  // Salvar arquivo
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
  worksheet.getRow(1).height = 24;
  worksheet.getRow(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } }; // Slate 900
  data.forEach((item) => {
    const row = worksheet.addRow(item);
    row.height = 20;
    row.eachCell((cell) => {
      cell.border = {
        top: BORDER_LIGHT,
        bottom: BORDER_LIGHT,
        left: BORDER_LIGHT,
        right: BORDER_LIGHT,
      };
    });
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
}
