# 16 - Botao FAB (+) para abrir modal "EDIFICIOS 3D"

**Prioridade:** 16 (feature)
**Categoria:** Sun Map

## Contexto

Adicionar um botao flutuante (FAB - Floating Action Button) no estilo Material UI no canto inferior direito do mapa. O botao abre o modal de edificios 3D, que oferece a opcao de adicionar um novo edificio. O botao deve estar sempre visivel, independentemente de haver edificios customizados ou nao.

## Design

- Botao redondo com icone "+" generico
- Posicionado no canto inferior direito do mapa, com margem de ~16-24px
- Estilo Material Design: sombra elevada, cor de destaque, hover com leve elevacao
- Deve respeitar o tema claro/escuro
- Z-index acima do mapa mas abaixo de modais
- Sempre visivel (nao depende de estado de edificios)

## Tarefas

### Criar o botao FAB
- [ ] Em `pages/sun-map.tsx`, adicionar um `<button>` com classe CSS `sm-fab-interior` posicionado absolutamente dentro do container do mapa
- [ ] O botao deve estar sempre visivel e ao clicar abre o modal de edificios 3D
- [ ] O modal aberto pelo FAB deve dar a opcao de adicionar um novo edificio

### Estilizar o FAB
- [ ] Em `styles/sun-map.css`, adicionar estilos:
  ```css
  .sm-fab-interior {
    position: absolute;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    z-index: 10;
    box-shadow: 0 3px 5px -1px rgba(0,0,0,0.2), 0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12);
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .sm-fab-interior:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 5px -3px rgba(0,0,0,0.2), 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12);
  }
  ```
- [ ] Adicionar cores para tema claro e escuro (usar variaveis CSS existentes ou definir novas)

### Icone
- [ ] Usar um SVG inline de "+" generico
- [ ] O icone deve ser visivel em ambos os temas

### Validacao
- [ ] Testar que o botao esta sempre visivel (com e sem edificios)
- [ ] Testar que clicar no FAB abre o modal com opcao de adicionar edificio
- [ ] Testar em ambos os temas
- [ ] Verificar que nao obstrui controles existentes do mapa
- [ ] Rodar `npm run build`
