const fs = require('fs');
const data = JSON.parse(fs.readFileSync('dashboard_data.json', 'utf8'));

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
data.forEach(d => {
  const [y, m] = d.mes.split('-');
  d.mesLabel = `${MESES[parseInt(m,10)-1]}/${y.slice(2)}`;
});

const dataJson = JSON.stringify(data);

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>BI Funil de Vendas — Ilhas de Atibaia</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
  padding: 24px;
  min-height: 100vh;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #1e293b;
}
.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #f8fafc;
}
.header .subtitle { color: #94a3b8; font-size: 13px; margin-top: 4px; }
.filters {
  display: flex;
  gap: 12px;
  align-items: center;
  background: #1e293b;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.filters label { font-size: 12px; color: #94a3b8; font-weight: 500; }
.filters select {
  background: #0f172a;
  color: #e2e8f0;
  border: 1px solid #334155;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.kpi {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 18px;
  position: relative;
  overflow: hidden;
}
.kpi::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 3px;
  background: var(--accent, #06b6d4);
}
.kpi .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; font-weight: 600; }
.kpi .value { font-size: 24px; font-weight: 700; color: #f8fafc; }
.kpi .delta { font-size: 12px; margin-top: 4px; font-weight: 500; }
.kpi .delta.up { color: #34d399; }
.kpi .delta.down { color: #f87171; }
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}
.chart-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 20px;
}
.chart-card h3 {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 4px;
}
.chart-card .desc { font-size: 12px; color: #94a3b8; margin-bottom: 16px; }
.chart-card.full { grid-column: span 2; }
.chart-wrap { position: relative; height: 280px; }
.chart-wrap.tall { height: 360px; }
.funnel { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
.funnel-row {
  display: grid;
  grid-template-columns: 180px 1fr 90px 90px;
  align-items: center;
  gap: 12px;
}
.funnel-row .name { font-size: 13px; color: #cbd5e1; font-weight: 500; }
.funnel-row .bar-bg { background: #0f172a; height: 28px; border-radius: 4px; overflow: hidden; }
.funnel-row .bar { height: 100%; background: linear-gradient(90deg, #06b6d4, #0891b2); border-radius: 4px; }
.funnel-row .count { font-size: 13px; color: #f8fafc; font-weight: 600; text-align: right; }
.funnel-row .pct { font-size: 12px; color: #34d399; font-weight: 600; text-align: right; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { padding: 8px 10px; text-align: right; border-bottom: 1px solid #334155; }
th { background: #0f172a; color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 11px; position: sticky; top: 0; }
th:first-child, td:first-child { text-align: left; }
tbody tr:hover { background: #0f172a; }
.footer { text-align: center; color: #64748b; font-size: 11px; margin-top: 24px; }
@media (max-width: 900px) {
  .charts-grid { grid-template-columns: 1fr; }
  .chart-card.full { grid-column: span 1; }
}
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>BI Funil de Vendas — Ilhas de Atibaia</h1>
    <div class="subtitle">Análise mensal de captação, conversão e faturamento</div>
  </div>
  <div class="subtitle">Atualizado: <span id="lastUpdate"></span></div>
</div>

<div class="filters">
  <label>Período:</label>
  <select id="periodFilter">
    <option value="all">Todo o período</option>
    <option value="12">Últimos 12 meses</option>
    <option value="6">Últimos 6 meses</option>
    <option value="3">Últimos 3 meses</option>
    <option value="1">Último mês</option>
  </select>
  <label style="margin-left: 16px;">Mês foco (funil):</label>
  <select id="monthFocus"></select>
</div>

<div class="kpi-grid" id="kpiGrid"></div>

<div class="charts-grid">

  <div class="chart-card full">
    <h3>Funil de Conversão — mês selecionado</h3>
    <div class="desc">Cada etapa mostra o volume absoluto e o % em relação à etapa anterior.</div>
    <div class="funnel" id="funnelView"></div>
  </div>

  <div class="chart-card">
    <h3>Leads captados vs Vendas fechadas</h3>
    <div class="desc">Evolução do topo e fundo do funil ao longo do tempo.</div>
    <div class="chart-wrap"><canvas id="chartLeadsVendas"></canvas></div>
  </div>

  <div class="chart-card">
    <h3>Faturamento mensal</h3>
    <div class="desc">Receita gerada (R$) pelas vendas fechadas.</div>
    <div class="chart-wrap"><canvas id="chartFat"></canvas></div>
  </div>

  <div class="chart-card">
    <h3>Investimento em mídia vs Faturamento</h3>
    <div class="desc">Investimento patrocinado (R$) comparado ao faturamento. Linha mostra ROAS.</div>
    <div class="chart-wrap"><canvas id="chartInvestFat"></canvas></div>
  </div>

  <div class="chart-card">
    <h3>Custos por etapa</h3>
    <div class="desc">Custo por lead, lead qualificado e agendamento.</div>
    <div class="chart-wrap"><canvas id="chartCustos"></canvas></div>
  </div>

  <div class="chart-card">
    <h3>Taxas de conversão</h3>
    <div class="desc">% de leads que interagem, agendam e fecham.</div>
    <div class="chart-wrap"><canvas id="chartTaxas"></canvas></div>
  </div>

  <div class="chart-card">
    <h3>Eficiência das reuniões (RO)</h3>
    <div class="desc">Taxa de comparecimento vs No-show nas reuniões agendadas.</div>
    <div class="chart-wrap"><canvas id="chartRO"></canvas></div>
  </div>

  <div class="chart-card full">
    <h3>CAC e Ticket Médio</h3>
    <div class="desc">Custo de aquisição (investimento ÷ vendas) e ticket médio por venda.</div>
    <div class="chart-wrap"><canvas id="chartCAC"></canvas></div>
  </div>

  <div class="chart-card full">
    <h3>Tabela detalhada</h3>
    <div class="desc">Todos os indicadores mês a mês.</div>
    <div class="table-wrap">
      <table id="dataTable">
        <thead>
          <tr>
            <th>Mês</th><th>Leads</th><th>Invest. (R$)</th><th>Interagiu</th>
            <th>Agendam.</th><th>RO</th><th>Vendas</th>
            <th>Faturam. (R$)</th><th>Ticket (R$)</th><th>CAC (R$)</th><th>ROAS</th>
            <th>Tx. Venda</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </div>

</div>

<div class="footer">Dados extraídos de funil_ilhas.xlsx · Ilhas de Atibaia · BI gerado por Claude</div>

<script>
const DATA = ${dataJson};

const fmtBRL = v => v == null || isNaN(v) ? '–' : 'R$ ' + Math.round(v).toLocaleString('pt-BR');
const fmtBRLk = v => v == null || isNaN(v) ? '–' : 'R$ ' + (v/1000).toFixed(0) + 'k';
const fmtNum = v => v == null || isNaN(v) ? '–' : Math.round(v).toLocaleString('pt-BR');
const fmtPct = v => v == null || isNaN(v) ? '–' : (v * 100).toFixed(1) + '%';
const fmtX = v => v == null || isNaN(v) ? '–' : v.toFixed(1) + 'x';

Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#334155';
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';

let charts = {};
function destroyCharts() {
  Object.values(charts).forEach(c => c.destroy && c.destroy());
  charts = {};
}

function getFiltered() {
  const p = document.getElementById('periodFilter').value;
  if (p === 'all') return DATA.slice();
  const n = parseInt(p, 10);
  return DATA.slice(-n);
}

function renderKPIs(rows) {
  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  function delta(curr, prevV) {
    if (!prevV || prevV === 0) return '';
    const diff = (curr - prevV) / Math.abs(prevV);
    const cls = diff >= 0 ? 'up' : 'down';
    const sign = diff >= 0 ? '▲' : '▼';
    return \`<div class="delta \${cls}">\${sign} \${(diff * 100).toFixed(1)}% vs mês ant.</div>\`;
  }
  const totalLeads = rows.reduce((s, r) => s + r.prospects, 0);
  const totalVendas = rows.reduce((s, r) => s + r.vendas, 0);
  const totalFat = rows.reduce((s, r) => s + r.faturamento, 0);
  const totalInvest = rows.reduce((s, r) => s + r.investimento, 0);
  const avgTicket = totalVendas ? totalFat / totalVendas : 0;
  const cacTotal = totalVendas ? totalInvest / totalVendas : 0;
  const roasTotal = totalInvest ? totalFat / totalInvest : 0;

  const kpis = [
    { label: 'Leads no período', value: fmtNum(totalLeads), accent: '#06b6d4' },
    { label: 'Vendas no período', value: fmtNum(totalVendas), accent: '#34d399' },
    { label: 'Faturamento total', value: fmtBRLk(totalFat), accent: '#fbbf24' },
    { label: 'Investimento total', value: fmtBRLk(totalInvest), accent: '#f87171' },
    { label: 'ROAS médio', value: fmtX(roasTotal), accent: '#a78bfa' },
    { label: 'CAC médio', value: fmtBRL(cacTotal), accent: '#fb923c' },
    { label: 'Ticket médio', value: fmtBRL(avgTicket), accent: '#22d3ee' },
    { label: \`Vendas em \${last.mesLabel}\`, value: fmtNum(last.vendas) + (prev ? delta(last.vendas, prev.vendas) : ''), accent: '#ec4899' }
  ];
  document.getElementById('kpiGrid').innerHTML = kpis.map(k =>
    \`<div class="kpi" style="--accent: \${k.accent}"><div class="label">\${k.label}</div><div class="value">\${k.value}</div></div>\`
  ).join('');
}

function renderFunnel(monthMes) {
  const r = DATA.find(d => d.mes === monthMes);
  if (!r) return;
  const stages = [
    { name: 'Leads captados', count: r.prospects, color: '#06b6d4' },
    { name: 'Interagiram', count: r.interagiu, color: '#0891b2' },
    { name: 'Seguiram em atendimento', count: r.seguiramAtendimento, color: '#0e7490' },
    { name: 'Agendamentos', count: r.agendamentos, color: '#34d399' },
    { name: 'Reuniões (RO)', count: r.ro, color: '#22c55e' },
    { name: 'Contratos gerados', count: r.contratosGerados, color: '#fbbf24' },
    { name: 'Vendas fechadas', count: r.vendas, color: '#f59e0b' }
  ];
  const max = stages[0].count;
  let prev = max;
  document.getElementById('funnelView').innerHTML = stages.map((s, i) => {
    const w = max ? (s.count / max) * 100 : 0;
    const conv = i === 0 ? null : (prev ? s.count / prev : 0);
    prev = s.count;
    return \`<div class="funnel-row">
      <div class="name">\${s.name}</div>
      <div class="bar-bg"><div class="bar" style="width: \${w}%; background: linear-gradient(90deg, \${s.color}, \${s.color}aa)"></div></div>
      <div class="count">\${fmtNum(s.count)}</div>
      <div class="pct">\${conv == null ? '—' : fmtPct(conv)}</div>
    </div>\`;
  }).join('');
}

function buildCharts(rows) {
  destroyCharts();
  const labels = rows.map(r => r.mesLabel);

  charts.leadsVendas = new Chart(document.getElementById('chartLeadsVendas'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Leads', data: rows.map(r => r.prospects), backgroundColor: '#06b6d4', yAxisID: 'y' },
        { label: 'Vendas', type: 'line', data: rows.map(r => r.vendas), borderColor: '#34d399', backgroundColor: '#34d39933', borderWidth: 2, yAxisID: 'y1', tension: 0.3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { position: 'left', title: { display: true, text: 'Leads' } },
        y1: { position: 'right', title: { display: true, text: 'Vendas' }, grid: { display: false } }
      },
      plugins: { legend: { position: 'top' } }
    }
  });

  charts.fat = new Chart(document.getElementById('chartFat'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Faturamento (R$)', data: rows.map(r => r.faturamento), backgroundColor: '#fbbf24' }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { ticks: { callback: v => 'R$ ' + (v/1000) + 'k' } } },
      plugins: { tooltip: { callbacks: { label: ctx => fmtBRL(ctx.parsed.y) } } }
    }
  });

  charts.investFat = new Chart(document.getElementById('chartInvestFat'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Investimento', data: rows.map(r => r.investimento), backgroundColor: '#f87171', yAxisID: 'y' },
        { label: 'Faturamento', data: rows.map(r => r.faturamento), backgroundColor: '#fbbf24', yAxisID: 'y' },
        { label: 'ROAS', type: 'line', data: rows.map(r => r.roas), borderColor: '#a78bfa', backgroundColor: 'transparent', borderWidth: 2, yAxisID: 'y1', tension: 0.3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { ticks: { callback: v => 'R$ ' + (v/1000) + 'k' } },
        y1: { position: 'right', title: { display: true, text: 'ROAS (x)' }, grid: { display: false } }
      }
    }
  });

  charts.custos = new Chart(document.getElementById('chartCustos'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Custo por Lead', data: rows.map(r => r.custoLead || null), borderColor: '#06b6d4', backgroundColor: '#06b6d422', tension: 0.3 },
        { label: 'Custo por Lead Qualificado', data: rows.map(r => r.custoLeadQual || null), borderColor: '#34d399', backgroundColor: '#34d39922', tension: 0.3 },
        { label: 'Custo por Agendamento', data: rows.map(r => r.custoAgendamento || null), borderColor: '#fbbf24', backgroundColor: '#fbbf2422', tension: 0.3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { ticks: { callback: v => 'R$ ' + v } } }
    }
  });

  charts.taxas = new Chart(document.getElementById('chartTaxas'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: '% Interação', data: rows.map(r => r.taxaInteracao * 100), borderColor: '#06b6d4', tension: 0.3 },
        { label: '% Agendamento', data: rows.map(r => r.taxaAgendamento * 100), borderColor: '#34d399', tension: 0.3 },
        { label: '% Venda (leads→venda)', data: rows.map(r => r.taxaVenda * 100), borderColor: '#fbbf24', tension: 0.3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { ticks: { callback: v => v + '%' } } }
    }
  });

  charts.ro = new Chart(document.getElementById('chartRO'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Eficiência (compareceu)', data: rows.map(r => r.eficiencia * 100), backgroundColor: '#34d399', stack: 's' },
        { label: 'No Show', data: rows.map(r => r.taxaNoShow * 100), backgroundColor: '#f87171', stack: 's' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { stacked: true, ticks: { callback: v => v + '%' }, max: 100 }, x: { stacked: true } }
    }
  });

  charts.cac = new Chart(document.getElementById('chartCAC'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'CAC', data: rows.map(r => r.cac), backgroundColor: '#fb923c', yAxisID: 'y' },
        { label: 'Ticket Médio', type: 'line', data: rows.map(r => r.ticketMedio), borderColor: '#22d3ee', backgroundColor: 'transparent', borderWidth: 2, yAxisID: 'y1', tension: 0.3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { position: 'left', title: { display: true, text: 'CAC (R$)' }, ticks: { callback: v => 'R$ ' + v } },
        y1: { position: 'right', title: { display: true, text: 'Ticket (R$)' }, ticks: { callback: v => 'R$ ' + (v/1000) + 'k' }, grid: { display: false } }
      }
    }
  });
}

function renderTable(rows) {
  const tbody = document.querySelector('#dataTable tbody');
  tbody.innerHTML = rows.slice().reverse().map(r => \`<tr>
    <td>\${r.mesLabel}</td>
    <td>\${fmtNum(r.prospects)}</td>
    <td>\${fmtBRL(r.investimento)}</td>
    <td>\${fmtNum(r.interagiu)}</td>
    <td>\${fmtNum(r.agendamentos)}</td>
    <td>\${fmtNum(r.ro)}</td>
    <td>\${fmtNum(r.vendas)}</td>
    <td>\${fmtBRL(r.faturamento)}</td>
    <td>\${fmtBRL(r.ticketMedio)}</td>
    <td>\${r.cac ? fmtBRL(r.cac) : '–'}</td>
    <td>\${r.roas ? fmtX(r.roas) : '–'}</td>
    <td>\${fmtPct(r.taxaVenda)}</td>
  </tr>\`).join('');
}

function refresh() {
  const rows = getFiltered();
  renderKPIs(rows);
  buildCharts(rows);
  renderTable(rows);
  renderFunnel(document.getElementById('monthFocus').value);
}

document.getElementById('lastUpdate').textContent = new Date().toLocaleDateString('pt-BR');
const monthSel = document.getElementById('monthFocus');
DATA.slice().reverse().forEach(d => {
  const opt = document.createElement('option');
  opt.value = d.mes;
  opt.textContent = d.mesLabel;
  monthSel.appendChild(opt);
});
monthSel.value = DATA[DATA.length - 1].mes;

document.getElementById('periodFilter').addEventListener('change', refresh);
monthSel.addEventListener('change', () => renderFunnel(monthSel.value));

refresh();
</script>
</body>
</html>
`;

fs.writeFileSync('index.html', html);
console.log('index.html written (' + html.length + ' bytes)');
