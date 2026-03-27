# 10 - Validação de inputs no Simulador de Amortização

**Prioridade:** 10 (robustez)
**Categoria:** Projeto - Amortização
**Status:** Concluído

## Tarefas

### Identificar campos
- [x] Listar todos os inputs numéricos da página (valor financiado, taxa de juros, prazo, valor FGTS, etc.)

### Implementar validações
- [x] Valor financiado: não permitir zero, negativo ou não-numérico
- [x] Taxa de juros: não permitir negativo; alertar se valor parecer fora do comum (>30% a.a.)
- [x] Prazo em meses: não permitir zero, negativo ou fracionário
- [x] Valor de entrada/FGTS: não permitir negativo; não permitir maior que valor financiado
- [x] Pagamentos extras: não permitir negativo

### Feedback visual
- [x] Destacar campo com borda vermelha quando inválido
- [x] Exibir mensagem de erro inline abaixo do campo
- [x] Desabilitar botão de calcular enquanto houver erros

### Validação
- [x] Testar com valores extremos (0, negativos, muito grandes, texto)
- [x] Rodar `npm run build`
