# 17 - Corrigir visao isometrica: chao desalinhado e parede translucida errada

**Prioridade:** 17 (bug fix)
**Categoria:** Sun Map - Interior View

## Contexto

Na visao isometrica do interior de um predio, dois problemas visuais existem:
1. O chao continua desalinhado (provavelmente nao esta no plano correto ou as coordenadas estao deslocadas)
2. A parede que fica translucida nao e a mais proxima da camera, mas sim a mais distante — o comportamento esta invertido

## Problema: Parede translucida invertida

Em `components/sun-map/interior/RoomGeometry.jsx`, linhas ~76-81:

```javascript
const facesCamera = useMemo(() => {
  const camDirX = Math.sin(cameraAngle)
  const camDirZ = Math.cos(cameraAngle)
  const dot = wall.normal.x * camDirX + wall.normal.z * camDirZ
  return dot > 0.1
}, [wall.normal, cameraAngle])
```

O dot product positivo significa que a normal da parede aponta na mesma direcao da camera — ou seja, a parede esta de COSTAS para a camera (a face visivel e a de tras). Porem, a logica de transparencia trata `facesCamera = true` como "parede proxima", quando na verdade deveria ser o OPOSTO.

A parede que deve ficar translucida e aquela cuja normal aponta PARA a camera (dot product negativo), pois essa e a parede entre a camera e o interior.

### Correcao da deteccao de parede proxima
- [ ] Em `RoomGeometry.jsx`, linha ~80, inverter a condicao:
  - De: `return dot > 0.1` (normal aponta na direcao da camera = costas para camera)
  - Para: `return dot < -0.1` (normal aponta contra a camera = face voltada para camera = parede proxima)
- [ ] Testar: ao rotacionar a camera, a parede mais proxima (entre voce e o interior) deve ficar translucida/escondida

## Problema: Chao desalinhado

O chao e gerado em `RoomGeometry.jsx` a partir das coordenadas locais do edificio. Possiveis causas:

### Investigacao
- [ ] Verificar se as coordenadas do chao (`localCoords`) estao no mesmo sistema de coordenadas que as paredes
- [ ] Verificar se o `applyWallMods()` em `InteriorView.js` altera as coordenadas das paredes mas NAO atualiza o chao (se o chao e gerado das coordenadas originais e as paredes das modificadas, ficam desalinhados)
- [ ] Verificar a rotacao do Shape do chao — `ShapeGeometry` cria no plano XY, mas o chao deve estar no plano XZ. Confirmar que a `rotation.x = -Math.PI / 2` esta aplicada corretamente

### Possiveis correcoes
- [ ] Se o problema for coordenadas: garantir que chao e paredes usam o mesmo array `localCoords` (ja com wallMods aplicados)
- [ ] Se o problema for rotacao: ajustar a rotacao do mesh do chao
- [ ] Se o problema for centralizacao: verificar se o centroide usado para centralizar o chao coincide com o das paredes

### Validacao
- [ ] Testar com diferentes edificios (3, 4, 5+ lados)
- [ ] Testar apos ajustar paredes (comprimento/deslocamento) — chao deve acompanhar
- [ ] Rotacionar a camera 360 graus — a parede correta deve ficar translucida em cada angulo
- [ ] Rodar `npm run build`
