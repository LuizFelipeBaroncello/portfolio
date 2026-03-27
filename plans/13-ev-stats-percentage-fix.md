# 13 - Quilometragem nao deve contar para % total nos cards do EV Stats

**Prioridade:** 13 (bug fix)
**Categoria:** EV Stats

## Contexto

Na pagina `ev-stats`, os cards de categoria mostram uma porcentagem que representa a participacao de cada categoria no total. O problema e que "Quilometragem" (medida em km) esta sendo incluida no calculo do denominador junto com valores monetarios, distorcendo todas as porcentagens.

## Problema

Em `pages/ev-stats.tsx`, linhas ~651-686, o calculo da porcentagem usa `VISIBLE_CATEGORIES` que inclui quilometragem:

```typescript
const allTotal = VISIBLE_CATEGORIES.reduce((s, c) => s + (totals[c.key] || 0), 0)
const pct = allTotal > 0 ? (val / allTotal) * 100 : 0
```

Ja existe a constante `COST_CATEGORIES` (linha ~38) que exclui quilometragem:
```typescript
const COST_CATEGORIES = CATEGORIES.filter((c) => c.key !== 'quilometragem')
```

## Tarefas

### Correcao do calculo de porcentagem
- [ ] Em `pages/ev-stats.tsx`, na secao dos cards de categoria (~linha 653), trocar `VISIBLE_CATEGORIES.reduce(...)` por `COST_CATEGORIES.reduce(...)` para o calculo de `allTotal`
- [ ] Para o card de Quilometragem especificamente, a porcentagem nao faz sentido — considerar esconder o `<span className="ev-cat-pct">` quando `cat.key === 'quilometragem'`, ou mostrar algo como o valor absoluto em km

### Verificar timeline
- [ ] Na secao de timeline (~linhas 727-750), verificar se o mesmo problema existe com `VISIBLE_CATEGORIES` e corrigir se necessario

### Validacao
- [ ] Rodar `npm run build` para confirmar que nada quebrou
- [ ] Verificar visualmente que as porcentagens dos cards monetarios somam ~100%
