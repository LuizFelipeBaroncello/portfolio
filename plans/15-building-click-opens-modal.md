# 15 - Clicar em edificio desenhado deve abrir modal "EDIFICIOS 3D"

**Prioridade:** 15 (feature)
**Categoria:** Sun Map

## Contexto

Atualmente, o modal de interior (InteriorView) so pode ser aberto de duas formas:
1. Dando double-click em um edificio na lista lateral (~linhas 883-886)
2. Clicando no botao "Interior" no painel de acoes do edificio selecionado (~linhas 929-941)

O usuario espera que um single click em um edificio desenhado no mapa selecione o edificio E abra o modal diretamente.

## Problema

Em `pages/sun-map.tsx`, o click no mapa ja seleciona o edificio (marca como `selectedBuildingIdx`), mas nao abre o modal. Precisa-se que o mesmo single click tambem dispare `setShowInterior(true)`.

## Tarefas

### Identificar o handler de click existente no mapa
- [ ] Em `pages/sun-map.tsx`, localizar o handler de click no mapa que ja identifica qual edificio foi clicado (provavelmente via `map.on('click', ...)` nos layers de edificios customizados)
- [ ] Entender como `selectedBuildingIdx` e setado a partir do click no mapa

### Adicionar abertura do modal no single click
- [ ] No handler de click do mapa que ja seleciona o edificio, adicionar `setShowInterior(true)` e `setInteriorBuildingIdx(idx)` no mesmo handler
- [ ] Garantir que o click so abre o modal se o edificio clicado for um edificio customizado (nao um edificio do tileset padrao do mapa)

### Feedback visual
- [ ] Considerar mudar o cursor para `pointer` ao passar o mouse sobre edificios customizados no mapa (se ainda nao estiver implementado)

### Validacao
- [ ] Testar clicando em um edificio desenhado no mapa — deve selecionar E abrir o modal em um unico click
- [ ] Testar que clicar em area vazia do mapa nao abre o modal
- [ ] Confirmar que as outras formas de abrir o modal continuam funcionando
- [ ] Rodar `npm run build`
