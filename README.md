# BI Funil de Vendas — Ilhas de Atibaia

Dashboard público com indicadores de funil de vendas, atualizado automaticamente.

## Como funciona

- **Fonte**: planilha no Google Sheets (publicada com link aberto, somente leitura)
- **Build**: `node build_bi.js && node build_dashboard.js`
  - `build_bi.js` lê `funil_ilhas.xlsx` e gera `dashboard_data.json`
  - `build_dashboard.js` lê o JSON e gera `index.html`
- **Hospedagem**: GitHub Pages
- **Atualização automática**: GitHub Actions roda toda **quarta às 12:00 BRT** (2h antes da reunião)
- **Rebuild manual**: aba Actions → "Update BI" → Run workflow

## Atualizar manualmente

```bash
npm install
npm run all   # baixa xlsx + roda build
```

Abra `index.html` no navegador.

## Trocar a planilha-fonte

Editar a URL em dois lugares:
- `package.json` → script `download`
- `.github/workflows/update-bi.yml` → step "Download planilha"

## Mudar o horário do rebuild

Editar o cron em `.github/workflows/update-bi.yml`:

```yaml
- cron: '0 15 * * 3'   # min hora dia-mês mês dia-semana (0=dom, 3=qua)
```

UTC. Brasil é UTC-3, então `15 UTC = 12 BRT`.
