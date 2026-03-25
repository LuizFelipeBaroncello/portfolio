# 09 - Error fallback no EV Dashboard

**Prioridade:** 9 (resiliência)
**Categoria:** Projeto - EV Dashboard

## Contexto
Os dados do EV Dashboard vêm do Supabase via API route. Se a API falhar, o dashboard quebra silenciosamente sem feedback ao usuário.

## Tarefas

### Tratamento de erro na API
- [ ] Adicionar tratamento de erro no fetch em `pages/ev-stats.js`
- [ ] Exibir mensagem de erro amigável quando a API falhar
- [ ] Adicionar botão de "tentar novamente" para re-fetch

### Fallback de dados
- [ ] Criar dataset de exemplo/mock como fallback
- [ ] Quando API falhar, exibir dados de exemplo com aviso "dados ilustrativos"
- [ ] Garantir que toda a UI funciona com os dados de fallback

### Validação
- [ ] Testar com Supabase indisponível (env vars inválidas ou rede off)
- [ ] Verificar que fallback renderiza corretamente
- [ ] Rodar `npm run build`
