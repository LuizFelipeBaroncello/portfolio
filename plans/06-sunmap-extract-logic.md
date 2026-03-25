# 06 - Extrair lógica de geometria 3D do Sun Map

**Prioridade:** 6 (melhora qualidade do código)
**Categoria:** Projeto - Sun Map

## Contexto
O arquivo `pages/sun-map.js` tem 1.731 linhas. Já existem `sun-calc-utils.js` e `sun-ray-utils.js`, mas ainda há muita lógica misturada na página.

## Tarefas

### Analisar código atual
- [ ] Mapear quais funções da página são lógica pura vs UI
- [ ] Identificar o que já está em `lib/sun-calc-utils.js` e `lib/sun-ray-utils.js`

### Extrair lógica restante
- [ ] Mover lógica de renderização do mapa para módulo separado (configuração MapLibre, layers, sources)
- [ ] Mover cálculos de shadow casting para utils (se não estiver)
- [ ] Mover lógica de convex hull / polygon orientation para utils
- [ ] Mover configurações de building colors/heights para constantes

### Criar componentes auxiliares
- [ ] Extrair painel de controles do mapa em componente separado
- [ ] Extrair visualização de room/interior em componente separado (se aplicável)

### Validação
- [ ] Testar mapa interativo completamente (zoom, pan, seleção de hora)
- [ ] Verificar sombras e raios solares em diferentes horários
- [ ] Rodar `npm run build`
