const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('funil_ilhas.xlsx');
const ws = wb.Sheets['Atualização Mensal'];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

function excelDate(serial) {
  if (typeof serial !== 'number') return null;
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return d;
}

const MES_PT = {
  janeiro: 0, fevereiro: 1, marco: 2, 'março': 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
};

function parseMonthText(text, atualDate) {
  if (typeof text !== 'string') return null;
  const t = text.trim().toLowerCase();
  if (MES_PT.hasOwnProperty(t)) {
    let year = atualDate ? atualDate.getFullYear() : new Date().getFullYear();
    const m = MES_PT[t];
    if (atualDate && atualDate.getMonth() < m) year -= 1;
    return new Date(year, m, 1);
  }
  return null;
}

const rows = [];
for (let i = 2; i < raw.length; i++) {
  const r = raw[i];
  if (!r || r.every(c => c === '')) continue;
  const atual = excelDate(r[0]);
  let mes = excelDate(r[1]);
  if (!mes) mes = parseMonthText(r[1], atual);
  if (!mes) continue;
  const prospects = Number(r[2]) || 0;
  if (prospects === 0) continue;

  rows.push({
    rowIndex: i,
    atualizacao: atual ? atual.toISOString().slice(0, 10) : String(r[0]),
    mesText: typeof r[1] === 'string' ? r[1] : null,
    mes: mes.toISOString().slice(0, 10),
    mesLabel: mes.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    prospects: prospects,
    investimento: Number(r[3]) || 0,
    custoLead: Number(r[4]) || 0,
    custoLeadQual: Number(r[5]) || 0,
    custoAgendamento: Number(r[6]) || 0,
    semInteracao: Number(r[7]) || 0,
    contatosInvalidos: Number(r[8]) || 0,
    interagiu: Number(r[9]) || 0,
    interagiuPct: Number(r[10]) || 0,
    interesseHospedagem: Number(r[11]) || 0,
    perfilExclusao: Number(r[12]) || 0,
    lost: Number(r[13]) || 0,
    interagiramParaLostHospExc: Number(r[14]) || 0,
    seguiramAtendimento: Number(r[15]) || 0,
    seguiramVsLeads: Number(r[16]) || 0,
    seguiramVsInteragiu: Number(r[17]) || 0,
    agendamentos: Number(r[18]) || 0,
    reagendamentos: Number(r[19]) || 0,
    agendVsSeguiram: Number(r[20]) || 0,
    ro: Number(r[21]) || 0,
    eficiencia: Number(r[22]) || 0,
    taxaNoShow: Number(r[23]) || 0,
    standby: Number(r[24]) || 0,
    contratosGerados: Number(r[25]) || 0,
    vendas: Number(r[26]) || 0,
    faturamento: Number(r[27]) || 0,
    vendaVsRO: Number(r[28]) || 0,
    yoy: Number(r[29]) || 0,
    ticketMedio: Number(r[30]) || 0
  });
}

const byMonth = new Map();
for (const r of rows) {
  const cur = byMonth.get(r.mes);
  if (!cur || r.prospects > cur.prospects) byMonth.set(r.mes, r);
}
const monthly = [...byMonth.values()].sort((a, b) => a.mes.localeCompare(b.mes));

monthly.forEach(m => {
  m.taxaInteracao = m.prospects ? m.interagiu / m.prospects : 0;
  m.taxaAgendamento = m.prospects ? m.agendamentos / m.prospects : 0;
  m.taxaRO = m.agendamentos ? m.ro / m.agendamentos : 0;
  m.taxaVenda = m.prospects ? m.vendas / m.prospects : 0;
  m.taxaVendaRO = m.ro ? m.vendas / m.ro : 0;
  m.cac = m.vendas ? m.investimento / m.vendas : 0;
  m.roas = m.investimento ? m.faturamento / m.investimento : 0;
});

console.log('Months extracted:', monthly.length);
console.log('First:', monthly[0].mes, 'Last:', monthly[monthly.length - 1].mes);

fs.writeFileSync('dashboard_data.json', JSON.stringify(monthly, null, 2));
console.log('dashboard_data.json written');
