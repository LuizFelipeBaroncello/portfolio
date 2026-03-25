# 02 - Adicionar gráficos ao Simulador de Amortização

**Prioridade:** 2 (transforma calculadora em ferramenta de análise)
**Categoria:** Projeto - Amortização

## Contexto
O simulador já faz cálculos complexos (SAC, Price, FGTS, correção monetária) mas apresenta resultados apenas em tabela/números. Gráficos tornam a análise muito mais intuitiva.

## Tarefas

### Setup
- [ ] Escolher e instalar biblioteca de gráficos (Recharts recomendado por integrar bem com React)
- [ ] Criar componente base de chart wrapper para reuso

### Gráficos a implementar
- [ ] Gráfico de evolução do saldo devedor ao longo do tempo
- [ ] Gráfico comparativo SAC vs Price (parcelas mensais lado a lado)
- [ ] Gráfico de composição da parcela (amortização vs juros vs seguros) empilhado
- [ ] Gráfico de custo total acumulado (quanto já pagou ao longo do tempo)
- [ ] Se houver simulação de investimento: gráfico comparativo entre quitar antecipado vs investir

### Integração com UI
- [ ] Posicionar gráficos abaixo ou ao lado da tabela de resultados
- [ ] Garantir responsividade dos gráficos em mobile
- [ ] Aplicar cores consistentes com o tema dark/light do portfólio
- [ ] Adicionar tooltips nos pontos do gráfico para ver valores exatos

### Validação
- [ ] Testar com diferentes cenários de financiamento
- [ ] Verificar que gráficos atualizam ao mudar parâmetros
- [ ] Rodar `npm run build`
