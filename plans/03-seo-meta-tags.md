# 03 - SEO e Meta Tags

**Prioridade:** 3 (boa impressão antes mesmo de abrir o site)
**Categoria:** Portfolio geral
**Status:** Concluído

## Contexto
O portfólio não tem meta tags para Open Graph, Twitter Cards, descrição, etc. Links compartilhados não geram preview rico.

## Tarefas

### Página principal (index)
- [x] Adicionar `<Head>` com title, description, keywords
- [x] Adicionar Open Graph tags (og:title, og:description, og:image, og:url, og:type)
- [x] Adicionar Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image)
- [x] Criar ou selecionar imagem de preview (og:image) — screenshot do portfólio ou banner

### Páginas de projetos
- [x] Adicionar meta tags em `/ev-stats` (title, description, og tags)
- [x] Adicionar meta tags em `/amortizacao` (title, description, og tags)
- [x] Adicionar meta tags em `/sun-map` (title, description, og tags)

### Configuração geral
- [x] Adicionar favicon se não existir (verificar `/public`)
- [x] Adicionar `robots.txt` em `/public` se não existir
- [x] Adicionar `sitemap.xml` ou configurar geração automática
- [x] Verificar tag `<html lang="pt-BR">` no `_app.js` ou `_document.js`

### Validação
- [x] Testar preview com ferramentas de debug (OG debugger do Facebook, Twitter Card validator)
- [x] Rodar `npm run build`
