# 02 - Adicionar gráficos ao Simulador de Amortização

**Prioridade:** 2 (transforma calculadora em ferramenta de análise)
**Categoria:** Projeto - Amortização
**Status:** Concluído

## Contexto
O simulador já faz cálculos complexos (SAC, Price, FGTS, correção monetária) mas apresenta resultados apenas em tabela/números. Gráficos tornam a análise muito mais intuitiva.

## Tarefas

### Setup
- [x] Escolher e instalar biblioteca de gráficos (Recharts recomendado por integrar bem com React)
- [x] Criar componente base de chart wrapper para reuso

### Gráficos a implementar
- [x] Gráfico de evolução do saldo devedor ao longo do tempo
- [x] Gráfico comparativo SAC vs Price (parcelas mensais lado a lado)
- [x] Gráfico de composição da parcela (amortização vs juros vs seguros) empilhado
- [x] Gráfico de custo total acumulado (quanto já pagou ao longo do tempo)
- [x] Se houver simulação de investimento: gráfico comparativo entre quitar antecipado vs investir

### Integração com UI
- [x] Posicionar gráficos abaixo ou ao lado da tabela de resultados
- [x] Garantir responsividade dos gráficos em mobile
- [x] Aplicar cores consistentes com o tema dark/light do portfólio
- [x] Adicionar tooltips nos pontos do gráfico para ver valores exatos

### Validação
- [x] Testar com diferentes cenários de financiamento
- [x] Verificar que gráficos atualizam ao mudar parâmetros
- [x] Rodar `npm run build`
