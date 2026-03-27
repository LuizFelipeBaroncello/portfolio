# 14 - Sun Map deve inicializar no modo claro se o tema for claro

**Prioridade:** 14 (bug fix)
**Categoria:** Sun Map

## Contexto

Quando o usuario esta no modo claro e abre a pagina `/sun-map`, o mapa inicializa com o estilo escuro e so muda para claro quando o tema e alternado manualmente. O problema esta na ordem de execucao dos hooks.

## Problema

Em `pages/sun-map.tsx`:
- Linha ~190: `const [theme, toggleTheme] = useTheme()` inicializa o tema
- Linhas ~288-352: O `useEffect` de inicializacao do mapa roda apenas uma vez (`initRef.current` impede re-execucao) e usa `getMapStyle(theme)` na linha ~300
- O problema e que na primeira renderizacao, `theme` pode ainda nao ter sido resolvido do `localStorage` ou do `prefers-color-scheme`, resultando no valor default `'dark'`

O `useEffect` de troca de tema (linhas ~379-390) so reage a mudancas SUBSEQUENTES de `theme`, mas nao corrige o estilo inicial se o tema ja era `light` desde o comeco.

## Tarefas

### Opcao A: Garantir que o tema esta resolvido antes de criar o mapa
- [ ] Em `lib/use-theme.ts`, verificar se o hook retorna o tema correto na primeira renderizacao (nao um default temporario)
- [ ] Se `useTheme` usa `useState('dark')` como default e depois atualiza via `useEffect`, o mapa ja tera sido criado com o tema errado

### Opcao B: Forcar atualizacao do estilo apos mapa carregar
- [ ] No `useEffect` de inicializacao do mapa (~linha 288), apos `setMapLoaded(true)`, verificar se o tema atual difere do estilo aplicado e chamar `map.setStyle(getMapStyle(theme))`
- [ ] Ou: remover `theme` do closure do init e usar um `ref` para o tema atual, adicionando um efeito que sincroniza o estilo do mapa sempre que `mapLoaded` muda para `true`

### Opcao C: Incluir `theme` como trigger do efeito de troca
- [ ] Ajustar o `useEffect` de linhas ~379-390 para tambem rodar quando `mapLoaded` muda, nao so quando `theme` muda
- [ ] Isso garante que o estilo seja aplicado mesmo que `theme` ja estivesse correto antes do mapa carregar

### Validacao
- [ ] Testar abrindo a pagina com tema claro no sistema/localStorage
- [ ] Confirmar que o mapa inicia com estilo `positron` (claro)
- [ ] Confirmar que alternar o tema continua funcionando normalmente
- [ ] Rodar `npm run build`
