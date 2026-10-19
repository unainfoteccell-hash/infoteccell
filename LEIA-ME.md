# Landing Infoteccell

Abra `index.html` no navegador (duplo clique) para ver o site.

## O que você precisa editar
Tudo fica em `js/config.js`:
- `WHATSAPP_COMUNIDADE` -> cole o link da comunidade (https://chat.whatsapp.com/...). Todos os botões verdes passam a funcionar sozinhos.
- `WHATSAPP_ATENDIMENTO` -> (opcional) link wa.me do atendimento, usado nos botões "Falar com a loja" dos produtos.
- `SORTEIO` -> data/hora do sorteio (contagem regressiva).

## Trocar produtos/fotos
Lista de produtos: início da seção "PRODUTOS" em `js/main.js` (array `P`).
Fotos: `assets/img/` (nome-lg.webp = grande 1000px, nome-sm.webp = miniatura 520px).

## Publicar
Envie a pasta `site` inteira para qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, Hostinger...).
