# 05 - Extrair lógica de cálculo do Simulador de Amortização

**Prioridade:** 5 (melhora qualidade do código, facilita manutenção e testes)
**Categoria:** Projeto - Amortização
**Status:** Concluído

## Contexto
O arquivo `pages/amortizacao.js` tinha 1.395 linhas misturando lógica de cálculo financeiro com UI React. Separar a lógica permite testabilidade, legibilidade e reuso.

## Tarefas

### Criar módulos de cálculo
- [x] Criar `lib/amortizacao/schedule.js` — geração de cronograma (SAC e Price, FGTS, correção, seguro)
- [x] Criar `lib/amortizacao/investment.js` — simulação de investimento vs quitação
- [x] Criar `lib/amortizacao/summary.js` — cálculo de resumo do financiamento
- [x] Criar `lib/amortizacao/rates.js` — conversão de taxa anual para mensal

### Criar utilitários compartilhados
- [x] Criar `lib/amortizacao/formatters.js` — formatBRL, formatDate, formatMonth, addMonths
- [x] Criar `lib/amortizacao/plan-helpers.js` — planTypeLabel, planDescription
- [x] Criar `lib/amortizacao/index.js` — re-exporta todos os módulos

### Refatorar página
- [x] Substituir lógica inline por imports dos novos módulos
- [x] Manter apenas lógica de UI/state no arquivo da página
- [x] Verificar que resultados permanecem idênticos

### Testes (67 testes)
- [x] `__tests__/amortizacao/formatters.test.js` — formatação BRL, datas, addMonths, imutabilidade
- [x] `__tests__/amortizacao/rates.test.js` — conversão anual→mensal, juros compostos
- [x] `__tests__/amortizacao/schedule.test.js` — SAC, Price, extras, correção, seguro, FGTS, edge cases
- [x] `__tests__/amortizacao/investment.test.js` — investimento, FGTS a 3% a.a., compounding
- [x] `__tests__/amortizacao/summary.test.js` — estrutura, totais, parcelas
- [x] `__tests__/amortizacao/plan-helpers.test.js` — labels, descrições de todos os tipos

### Validação
- [x] 67 testes passando
- [x] `npm run build` sem erros
