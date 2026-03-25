# 08 - Loading states e error handling

**Prioridade:** 8 (UX)
**Categoria:** Portfolio geral

## Contexto
As chamadas à API do Supabase (ev-stats) não têm feedback visual de carregamento nem tratamento de erro visível ao usuário. Páginas complexas também podem demorar a carregar.

## Tarefas

### Loading states
- [ ] Adicionar skeleton/spinner enquanto dados do EV Dashboard carregam
- [ ] Adicionar loading state nos gráficos do simulador (se aplicável após plano 02)
- [ ] Adicionar loading state no mapa do Sun Map enquanto MapLibre inicializa

### Error handling
- [ ] Criar componente reutilizável de erro (mensagem amigável + botão retry)
- [ ] Tratar erro na chamada à API `/api/ev-stats` — exibir mensagem ao usuário
- [ ] Tratar erro de inicialização do MapLibre no Sun Map
- [ ] Adicionar try/catch nos cálculos de amortização para inputs inválidos

### Validação
- [ ] Simular falha de API (desconectar rede) e verificar comportamento
- [ ] Rodar `npm run build`
