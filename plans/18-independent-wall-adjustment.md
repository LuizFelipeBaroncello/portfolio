# 18 - Ajuste de parede independente por parede

**Prioridade:** 18 (bug fix / improvement)
**Categoria:** Sun Map - Interior View

## Contexto

O ajuste de paredes no modal de interior permite alterar Comprimento e Deslocamento por parede. Porem, o comportamento atual nao e conforme o esperado — cada parede deve poder ser ajustada de forma totalmente independente, sem mover ou afetar as paredes vizinhas. Pode haver "buracos" entre paredes, e isso e aceitavel.

## Analise do codigo atual

Em `components/sun-map/InteriorView.js`:
- Linha ~68: `wallMods` e um objeto indexado por indice de parede: `{ [wallIndex]: { lengthDelta, offsetDelta } }`
- Linhas ~96-101: `updateWallMod()` atualiza uma parede especifica por indice
- Linha ~77: `applyWallMods(baseLocalCoords, wallMods)` aplica todas as modificacoes de uma vez

O problema esta na funcao `applyWallMods()` (linhas ~525-565):

### Problema: Vertices compartilhados
- O sistema atual opera sobre um array de coordenadas do poligono, onde cada vertice e compartilhado entre duas paredes adjacentes
- Quando se ajusta uma parede, os vertices movidos afetam as paredes vizinhas
- Isso impede ajustes verdadeiramente independentes

## Nova abordagem: Paredes como segmentos independentes

Em vez de operar sobre vertices de um poligono, cada parede deve ser tratada como um segmento independente com seus proprios dois endpoints.

### Tarefas

### Redesenhar a estrutura de dados
- [ ] Mudar a representacao interna: em vez de um array de vertices do poligono, cada parede deve armazenar seus proprios dois pontos (start, end)
- [ ] Inicializar cada parede a partir das coordenadas originais do edificio
- [ ] Manter `wallMods` como esta (por indice, com `lengthDelta` e `offsetDelta`)

### Reimplementar `applyWallMods()`
- [ ] **Comprimento (lengthDelta):** Expandir/contrair a parede simetricamente a partir do seu centro, movendo apenas os endpoints dessa parede
- [ ] **Offset (offsetDelta):** Mover a parede inteira ao longo da sua normal, sem tocar nas paredes vizinhas
- [ ] As paredes vizinhas NAO devem ser afetadas — buracos entre paredes sao aceitaveis

### Atualizar RoomGeometry.jsx
- [ ] Adaptar a renderizacao das paredes para usar segmentos independentes em vez de vertices compartilhados
- [ ] O chao pode continuar usando as coordenadas originais (ou as coordenadas ajustadas, conforme fizer mais sentido visualmente)

### Atualizar a UI
- [ ] Verificar se os sliders e labels refletem corretamente o estado de cada parede independente
- [ ] Considerar adicionar um botao "Reset" por parede para voltar ao estado original

### Validacao
- [ ] Ajustar uma parede e verificar que as adjacentes NAO se movem de forma alguma
- [ ] Ajustar offset de uma parede — deve criar um "buraco" visivel entre ela e as vizinhas
- [ ] Ajustar comprimento — deve expandir/contrair simetricamente sem afetar vizinhas
- [ ] Ajustar multiplas paredes independentemente
- [ ] Verificar que janelas continuam posicionadas corretamente nas paredes ajustadas
- [ ] Salvar e reabrir — verificar persistencia das modificacoes
- [ ] Rodar `npm run build`
