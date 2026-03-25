# 10 - Validação de inputs no Simulador de Amortização

**Prioridade:** 10 (robustez)
**Categoria:** Projeto - Amortização

## Tarefas

### Identificar campos
- [ ] Listar todos os inputs numéricos da página (valor financiado, taxa de juros, prazo, valor FGTS, etc.)

### Implementar validações
- [ ] Valor financiado: não permitir zero, negativo ou não-numérico
- [ ] Taxa de juros: não permitir negativo; alertar se valor parecer fora do comum (>30% a.a.)
- [ ] Prazo em meses: não permitir zero, negativo ou fracionário
- [ ] Valor de entrada/FGTS: não permitir negativo; não permitir maior que valor financiado
- [ ] Pagamentos extras: não permitir negativo

### Feedback visual
- [ ] Destacar campo com borda vermelha quando inválido
- [ ] Exibir mensagem de erro inline abaixo do campo
- [ ] Desabilitar botão de calcular enquanto houver erros

### Validação
- [ ] Testar com valores extremos (0, negativos, muito grandes, texto)
- [ ] Rodar `npm run build`
