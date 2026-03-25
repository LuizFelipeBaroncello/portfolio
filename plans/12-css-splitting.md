# 12 - CSS splitting por página

**Prioridade:** 12 (performance)
**Categoria:** Portfolio geral

## Contexto
São ~3.800 linhas de CSS carregadas de uma vez. Separar por rota/componente melhora performance de carregamento.

## Tarefas

### Análise
- [ ] Mapear quais classes CSS são usadas em quais páginas
- [ ] Identificar CSS global (variáveis, reset, tipografia) vs CSS de página

### Migração
- [ ] Manter CSS global em `styles/globals.css` (variáveis, reset, tema)
- [ ] Criar `styles/home.module.css` para a página principal (bento grid, cards)
- [ ] Criar `styles/ev-stats.module.css` para o EV Dashboard
- [ ] Criar `styles/amortizacao.module.css` para o simulador
- [ ] Criar `styles/sun-map.module.css` para o mapa solar
- [ ] Migrar componentes para CSS Modules (Card.module.css, FilterBar.module.css, etc.)

### Refatorar imports
- [ ] Atualizar imports de CSS em cada página/componente
- [ ] Substituir classes globais por classes de módulo (`styles.className`)
- [ ] Remover CSS não utilizado encontrado durante a migração

### Validação
- [ ] Verificar visualmente todas as páginas (dark e light mode)
- [ ] Verificar que não há regressões visuais
- [ ] Rodar `npm run build`
