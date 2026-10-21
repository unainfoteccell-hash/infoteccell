# Landing Infoteccell

Abra `index.html` no navegador (duplo clique) para ver o site.

## O que você precisa editar
Tudo fica em `js/config.js`:
- `LOJAS` -> nome, endereço e WhatsApp (ddd + numero) de cada loja. Os botões, o painel "Falar com qual loja?", os cards e o rodapé usam isso.
- `WHATSAPP_COMUNIDADE` -> link do grupo. Aparece só na seção "Entre na nossa comunidade".
- `MENSAGEM_PADRAO` -> texto que já vai escrito quando o cliente chama uma loja.
- `INSTAGRAM_*` -> links dos Instagram.
- `SORTEIO` -> data/hora do sorteio (contagem regressiva).

## Trocar produtos/fotos
Lista de produtos: início da seção "PRODUTOS" em `js/main.js` (array `P`).
Fotos: `assets/img/` (nome-lg.webp = grande 1000px, nome-sm.webp = miniatura 520px).

## Publicar
Cada push na branch `main` do GitHub publica sozinho na Vercel.
Commits devem sair com a conta dona do projeto na Vercel (unainfoteccell-hash).
