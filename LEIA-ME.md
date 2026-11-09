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

## Estúdio de Promoções (admin.html)
Abra `https://infoteccell.vercel.app/admin.html` (não aparece no site para o público).
1. Preencha nome, preço, especificações, cores e brindes e anexe a foto do produto (o fundo é removido no próprio aparelho).
2. Escolha **Feed (1080x1350)** ou **Story (1080x1920)** e baixe o PNG. No celular, "Compartilhar / Postar" abre o Instagram.
3. **Publicar no site** adiciona a promoção na seção "Ofertas" (precisa da chave do GitHub, configurada uma vez no próprio estúdio).

As promoções do site ficam em `data/promos.js` (o estúdio atualiza esse arquivo sozinho).
