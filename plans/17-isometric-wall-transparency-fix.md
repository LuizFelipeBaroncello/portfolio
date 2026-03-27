# 17 - Corrigir visao isometrica: chao desalinhado, parede translucida errada e rotacao do sol

**Prioridade:** 17 (bug fix)
**Categoria:** Sun Map - Interior View

## Contexto

Na visao isometrica do interior de um predio, tres problemas visuais existem:
1. O chao ja comeca desalinhado desde a geracao inicial (nao e causado por wallMods)
2. A parede que fica translucida nao e a mais proxima da camera, mas sim a mais distante — comportamento invertido
3. A direcao do sol esta errada — sol saindo de uma janela no oeste aparece como se viesse do norte. Ha um problema de rotacao no mapeamento de azimuth para o sistema de coordenadas 3D

## Problema 1: Parede translucida invertida

Em `components/sun-map/interior/RoomGeometry.jsx`, linhas ~76-81:

```javascript
const facesCamera = useMemo(() => {
  const camDirX = Math.sin(cameraAngle)
  const camDirZ = Math.cos(cameraAngle)
  const dot = wall.normal.x * camDirX + wall.normal.z * camDirZ
  return dot > 0.1
}, [wall.normal, cameraAngle])
```

O dot product positivo significa que a normal da parede aponta na mesma direcao da camera — ou seja, a parede esta de COSTAS para a camera. Porem, a logica trata `facesCamera = true` como "parede proxima", quando deveria ser o oposto.

### Correcao
- [ ] Em `RoomGeometry.jsx`, linha ~80, inverter a condicao:
  - De: `return dot > 0.1`
  - Para: `return dot < -0.1`
- [ ] Testar: ao rotacionar a camera, a parede mais proxima (entre voce e o interior) deve ficar translucida/escondida

## Problema 2: Chao desalinhado na geracao inicial

O chao ja comeca desalinhado — o problema esta na geracao inicial, nao nos wallMods.

### Investigacao
- [ ] Em `RoomGeometry.jsx`, verificar como o `THREE.Shape` do chao e criado a partir de `localCoords`
- [ ] `ShapeGeometry` cria geometria no plano XY. Para usar como chao (plano XZ), precisa de `rotation.x = -Math.PI / 2`. Verificar se essa rotacao esta aplicada corretamente
- [ ] Verificar se as coordenadas `localCoords` passadas para o chao estao no sistema correto (x,z para o plano horizontal)
- [ ] Verificar se o centroide usado para centralizar o chao e o mesmo usado para as paredes

### Possiveis correcoes
- [ ] Se o Shape esta usando coordenadas (x,y) mas as paredes usam (x,z): converter adequadamente ao criar o Shape
- [ ] Se a rotacao esta errada ou ausente: aplicar `rotation.x = -Math.PI / 2` no mesh do chao
- [ ] Se o centroide diverge: unificar o calculo de centro entre chao e paredes

## Problema 3: Rotacao do sol incorreta

O sol aparenta estar vindo da direcao errada (ex: janela oeste mostra sol vindo do norte). Ha um erro no mapeamento do azimuth solar para o sistema de coordenadas 3D.

### Investigacao
- [ ] Em `components/sun-map/interior/IsometricScene.jsx`, verificar como o azimuth e altitude do sol sao convertidos para a posicao da luz direcional
- [ ] Em `lib/sun-ray-utils.ts`, verificar como o azimuth e convertido para direcao dos raios solares que geram os patches no chao
- [ ] Identificar a convencao de azimuth usada pelo SunCalc (0=Norte, 90=Leste, 180=Sul, 270=Oeste) vs a convencao do sistema de coordenadas 3D
- [ ] Verificar se a conversao lat/lng para metros locais em `sun-ray-utils.ts` preserva a orientacao correta (norte/sul/leste/oeste)

### Possiveis correcoes
- [ ] Pode ser necessario adicionar um offset de rotacao (ex: -90 graus) na conversao azimuth → direcao 3D
- [ ] Ou inverter algum eixo na conversao de coordenadas
- [ ] Corrigir tanto a luz direcional (IsometricScene) quanto os sun patches (SunPatches.jsx via sun-ray-utils)

### Validacao
- [ ] Testar com sol no Leste (manha) — luz deve entrar por janelas voltadas para Leste
- [ ] Testar com sol no Oeste (tarde) — luz deve entrar por janelas voltadas para Oeste
- [ ] Testar com diferentes edificios (3, 4, 5+ lados)
- [ ] Rotacionar a camera 360 graus — a parede correta deve ficar translucida em cada angulo
- [ ] Verificar que chao e paredes estao alinhados desde o inicio (sem wallMods)
- [ ] Rodar `npm run build`
