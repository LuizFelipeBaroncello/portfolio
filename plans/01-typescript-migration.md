# 01 - Migrar projeto para TypeScript

**Prioridade:** 1 (maior impacto profissional)
**Categoria:** Portfolio geral
**Status:** Concluído

## Contexto
O projeto inteiro usa JavaScript puro. TypeScript agrega valor profissional e previne bugs, especialmente nos cálculos complexos de amortização e geometria 3D.

## Tarefas

### Configuração inicial
- [x] Instalar `typescript`, `@types/react`, `@types/node`, `@types/react-dom`
- [x] Criar `tsconfig.json` com configuração para Next.js
- [x] Verificar compatibilidade das dependências (`react-grid-layout`, `maplibre-gl`, `suncalc`, `@supabase/supabase-js`)

### Migração de arquivos core
- [x] Renomear `next.config.js` para `next.config.ts` (ou manter .js conforme Next.js 14)
- [x] Migrar `lib/supabase.js` → `lib/supabase.ts`
- [x] Migrar `lib/useTheme.js` → `lib/useTheme.ts`

### Migração de componentes
- [x] Migrar `components/Card.js` → `.tsx` (criar interface CardProps)
- [x] Migrar `components/BioCard.js` → `.tsx`
- [x] Migrar `components/FilterBar.js` → `.tsx`
- [x] Migrar `components/BentoGrid.js` → `.tsx`
- [x] Migrar `components/MapCard.js` → `.tsx`
- [x] Migrar `components/LinkedInCard.js` → `.tsx`
- [x] Migrar `components/MusicCard.js` → `.tsx`
- [x] Migrar `components/ThemeToggle.js` → `.tsx`

### Migração de páginas
- [x] Migrar `pages/index.js` → `.tsx`
- [x] Migrar `pages/_app.js` → `.tsx`
- [x] Migrar `pages/ev-stats.js` → `.tsx`
- [x] Migrar `pages/amortizacao.js` → `.tsx`
- [x] Migrar `pages/sun-map.js` → `.tsx`
- [x] Migrar `pages/api/ev-stats.js` → `.ts`

### Migração de utilitários
- [x] Migrar `lib/sun-calc-utils.js` → `.ts` (tipar funções de cálculo solar)
- [x] Migrar `lib/sun-ray-utils.js` → `.ts` (tipar geometria 3D)

### Validação
- [x] Rodar `npm run build` sem erros de tipo
- [x] Testar todas as páginas no browser
