# 06 - Extrair lógica de geometria 3D do Sun Map

**Prioridade:** 6 (melhora qualidade do código)
**Categoria:** Projeto - Sun Map
**Status:** Concluído

## Contexto
O arquivo `pages/sun-map.js` tem 1.731 linhas. Já existem `sun-calc-utils.js` e `sun-ray-utils.js`, mas ainda há muita lógica misturada na página.

## Tarefas

### Analisar código atual
- [x] Mapear quais funções da página são lógica pura vs UI
- [x] Identificar o que já está em `lib/sun-calc-utils.js` e `lib/sun-ray-utils.js`

### Extrair lógica restante
- [x] Mover lógica de renderização do mapa para módulo separado (configuração MapLibre, layers, sources)
- [x] Mover cálculos de shadow casting para utils (se não estiver)
- [x] Mover lógica de convex hull / polygon orientation para utils
- [x] Mover configurações de building colors/heights para constantes

### Criar componentes auxiliares
- [x] Extrair painel de controles do mapa em componente separado
- [x] Extrair visualização de room/interior em componente separado (se aplicável)

### Validação
- [x] Testar mapa interativo completamente (zoom, pan, seleção de hora)
- [x] Verificar sombras e raios solares em diferentes horários
- [x] Rodar `npm run build`
