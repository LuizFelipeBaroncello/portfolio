# 09 - Error fallback no EV Dashboard

**Prioridade:** 9 (resiliência)
**Categoria:** Projeto - EV Dashboard
**Status:** Concluído

## Contexto
Os dados do EV Dashboard vêm do Supabase via API route. Se a API falhar, o dashboard quebra silenciosamente sem feedback ao usuário.

## Tarefas

### Tratamento de erro na API
- [x] Adicionar tratamento de erro no fetch em `pages/ev-stats.js`
- [x] Exibir mensagem de erro amigável quando a API falhar
- [x] Adicionar botão de "tentar novamente" para re-fetch

### Fallback de dados
- [x] Criar dataset de exemplo/mock como fallback
- [x] Quando API falhar, exibir dados de exemplo com aviso "dados ilustrativos"
- [x] Garantir que toda a UI funciona com os dados de fallback

### Validação
- [x] Testar com Supabase indisponível (env vars inválidas ou rede off)
- [x] Verificar que fallback renderiza corretamente
- [x] Rodar `npm run build`
