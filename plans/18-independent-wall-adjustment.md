# 18 - Ajuste de parede independente por parede

**Prioridade:** 18 (bug fix / improvement)
**Categoria:** Sun Map - Interior View

## Contexto

O ajuste de paredes no modal de interior permite alterar Comprimento e Deslocamento por parede. Porem, o comportamento atual nao e conforme o esperado — cada parede deveria poder ser ajustada de forma totalmente independente sem afetar as outras.

## Analise do codigo atual

Em `components/sun-map/InteriorView.js`:
- Linha ~68: `wallMods` e um objeto indexado por indice de parede: `{ [wallIndex]: { lengthDelta, offsetDelta } }`
- Linhas ~96-101: `updateWallMod()` atualiza uma parede especifica por indice
- Linha ~77: `applyWallMods(baseLocalCoords, wallMods)` aplica todas as modificacoes de uma vez

O problema esta na funcao `applyWallMods()` (linhas ~525-565):

### Problema 1: Vertices compartilhados
- Cada parede compartilha vertices com as paredes adjacentes (vertice 0-1 da parede A e vertice 1 da parede anterior)
- Quando se ajusta o comprimento ou offset de uma parede, os vertices movidos afetam as paredes vizinhas
- O resultado e que ajustar uma parede "arrasta" as adjacentes

### Problema 2: Aplicacao sequencial
- As modificacoes sao aplicadas sequencialmente sobre as coordenadas, entao a ordem importa e pode causar acumulo de erros

## Tarefas

### Redesenhar a logica de aplicacao de wallMods
- [ ] Estudar a funcao `applyWallMods()` em detalhe (linhas ~525-565 de InteriorView.js)
- [ ] Identificar exatamente como os vertices compartilhados estao sendo manipulados

### Implementar ajuste verdadeiramente independente
- [ ] **Para comprimento (lengthDelta):** Cada parede deve expandir/contrair simetricamente a partir do seu centro, mas os vertices resultantes devem ser reconciliados com as paredes adjacentes. Opcoes:
  - Calcular a nova posicao dos vertices de cada parede independentemente, depois recalcular as intersecoes com paredes adjacentes
  - Ou: mover os vertices de cada parede e interpolar as juncoes

- [ ] **Para offset (offsetDelta):** Mover a parede ao longo da sua normal sem alterar as paredes vizinhas. As paredes adjacentes devem ser estendidas/encurtadas para encontrar a parede deslocada (intersecao de linhas).

### Abordagem sugerida: intersecao de retas
- [ ] Para cada parede, calcular a reta (linha infinita) da parede ajustada
- [ ] Para cada par de paredes adjacentes, calcular o ponto de intersecao das duas retas
- [ ] Usar esses pontos de intersecao como os novos vertices do poligono
- [ ] Isso garante que cada parede pode ser movida/redimensionada independentemente e o poligono se ajusta automaticamente

### Atualizar a UI se necessario
- [ ] Verificar se os sliders e labels refletem corretamente o estado de cada parede
- [ ] Considerar adicionar um botao "Reset" por parede para voltar ao estado original

### Validacao
- [ ] Ajustar uma parede e verificar que as adjacentes NAO mudam de posicao (apenas se estendem/encurtam para encontrar a parede ajustada)
- [ ] Ajustar multiplas paredes independentemente
- [ ] Verificar que o chao acompanha as novas coordenadas
- [ ] Verificar que janelas continuam posicionadas corretamente nas paredes ajustadas
- [ ] Salvar e reabrir — verificar persistencia das modificacoes
- [ ] Rodar `npm run build`
