# 01 - Migrar projeto para TypeScript

**Prioridade:** 1 (maior impacto profissional)
**Categoria:** Portfolio geral

## Contexto
O projeto inteiro usa JavaScript puro. TypeScript agrega valor profissional e previne bugs, especialmente nos cálculos complexos de amortização e geometria 3D.

## Tarefas

### Configuração inicial
- [ ] Instalar `typescript`, `@types/react`, `@types/node`, `@types/react-dom`
- [ ] Criar `tsconfig.json` com configuração para Next.js
- [ ] Verificar compatibilidade das dependências (`react-grid-layout`, `maplibre-gl`, `suncalc`, `@supabase/supabase-js`)

### Migração de arquivos core
- [ ] Renomear `next.config.js` para `next.config.ts` (ou manter .js conforme Next.js 14)
- [ ] Migrar `lib/supabase.js` → `lib/supabase.ts`
- [ ] Migrar `lib/useTheme.js` → `lib/useTheme.ts`

### Migração de componentes
- [ ] Migrar `components/Card.js` → `.tsx` (criar interface CardProps)
- [ ] Migrar `components/BioCard.js` → `.tsx`
- [ ] Migrar `components/FilterBar.js` → `.tsx`
- [ ] Migrar `components/BentoGrid.js` → `.tsx`
- [ ] Migrar `components/MapCard.js` → `.tsx`
- [ ] Migrar `components/LinkedInCard.js` → `.tsx`
- [ ] Migrar `components/MusicCard.js` → `.tsx`
- [ ] Migrar `components/ThemeToggle.js` → `.tsx`

### Migração de páginas
- [ ] Migrar `pages/index.js` → `.tsx`
- [ ] Migrar `pages/_app.js` → `.tsx`
- [ ] Migrar `pages/ev-stats.js` → `.tsx`
- [ ] Migrar `pages/amortizacao.js` → `.tsx`
- [ ] Migrar `pages/sun-map.js` → `.tsx`
- [ ] Migrar `pages/api/ev-stats.js` → `.ts`

### Migração de utilitários
- [ ] Migrar `lib/sun-calc-utils.js` → `.ts` (tipar funções de cálculo solar)
- [ ] Migrar `lib/sun-ray-utils.js` → `.ts` (tipar geometria 3D)

### Validação
- [ ] Rodar `npm run build` sem erros de tipo
- [ ] Testar todas as páginas no browser
