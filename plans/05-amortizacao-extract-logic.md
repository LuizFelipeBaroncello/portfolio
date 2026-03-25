# 05 - Extrair lógica de cálculo do Simulador de Amortização

**Prioridade:** 5 (melhora qualidade do código, facilita manutenção e testes)
**Categoria:** Projeto - Amortização

## Contexto
O arquivo `pages/amortizacao.js` tem 1.395 linhas misturando lógica de cálculo financeiro com UI React. Separar a lógica permite testabilidade, legibilidade e reuso.

## Tarefas

### Criar módulos de cálculo
- [ ] Criar `lib/amortizacao/sac.js` — lógica de amortização SAC
- [ ] Criar `lib/amortizacao/price.js` — lógica de amortização Price (tabela)
- [ ] Criar `lib/amortizacao/fgts.js` — lógica de uso do FGTS
- [ ] Criar `lib/amortizacao/correcao-monetaria.js` — lógica de correção monetária
- [ ] Criar `lib/amortizacao/seguros.js` — cálculos de seguro
- [ ] Criar `lib/amortizacao/investimento.js` — simulação de investimento vs quitação

### Criar utilitários compartilhados
- [ ] Criar `lib/amortizacao/formatters.js` — formatBRL, formatMonth, formatPercent
- [ ] Criar `lib/amortizacao/validators.js` — validação de inputs numéricos

### Refatorar página
- [ ] Substituir lógica inline por imports dos novos módulos
- [ ] Manter apenas lógica de UI/state no arquivo da página
- [ ] Verificar que resultados permanecem idênticos

### Validação
- [ ] Comparar resultados antes/depois com cenários conhecidos
- [ ] Rodar `npm run build`
