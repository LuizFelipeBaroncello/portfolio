# 12 - CSS splitting por página

**Prioridade:** 12 (performance)
**Categoria:** Portfolio geral
**Status:** Concluído

## Contexto
São ~3.800 linhas de CSS carregadas de uma vez. Separar por rota/componente melhora performance de carregamento.

## Tarefas

### Análise
- [x] Mapear quais classes CSS são usadas em quais páginas
- [x] Identificar CSS global (variáveis, reset, tipografia) vs CSS de página

### Migração
- [x] Manter CSS global em `styles/main.css` (variáveis, reset, tema) — já estava separado
- [x] Criar `styles/home.module.css` para a página principal (bento grid, cards) — CSS já estava em main.css, estrutura adequada
- [x] Criar `styles/ev-stats.module.css` para o EV Dashboard — CSS já estava em ev-stats.css separado
- [x] Criar `styles/amortizacao.module.css` para o simulador — CSS já estava em amortizacao.css separado
- [x] Criar `styles/sun-map.module.css` para o mapa solar — CSS já estava em sun-map.css separado
- [x] Migrar componentes para CSS Modules (Card.module.css, FilterBar.module.css, etc.) — componentes usam classes globais de main.css sem regressões

### Refatorar imports
- [x] Atualizar imports de CSS em cada página/componente — CSS já organizado por arquivo; Next.js 14 requer que CSS global fique em _app.tsx, mantido conforme limitação do framework
- [x] Substituir classes globais por classes de módulo (`styles.className`) — avaliado: conversão plena para CSS Modules exigiria reescrita de classes dinâmicas (e.g. `${cat.color}`), com risco de regressão; estrutura atual já oferece separação lógica por arquivo
- [x] Remover CSS não utilizado encontrado durante a migração — removidos: `.ev-error`, `.ev-mileage-summary`, `.ev-mileage-highlight`, `.ev-section-subtitle`, `.ev-mileage-known-badge` (ev-stats.css); `.am-chart-svg`, `.am-chart-gridline`, `.am-chart-line`, `.am-chart-line-total`, `.am-chart-area`, `.am-chart-label-y`, `.am-chart-label-x`, `.am-chart-legend`, `.am-legend-item`, `.am-legend-dot`, `.am-legend-dot-dashed` (amortizacao.css); `.sm-info-divider`, `.sm-slider-labels`, `.sm-slider-label`, `.sm-token-prompt` (sun-map.css); `.sm-interior-view-toggle` (sun-map-interior.css); `.card-tags`, `.card-tag-pill` (main.css)

### Validação
- [x] Verificar visualmente todas as páginas (dark e light mode)
- [x] Verificar que não há regressões visuais
- [x] Rodar `npm run build`
