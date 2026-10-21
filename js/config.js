/* =====================================================
   CONFIGURAÇÕES DA INFOTECCELL  —  edite só aqui
   ===================================================== */
window.INFOTEC = {
  // Link do grupo/comunidade do WhatsApp.
  // Aparece SÓ na seção "Entre na nossa comunidade".
  WHATSAPP_COMUNIDADE: "https://chat.whatsapp.com/EtiRz2dect40zlVHe0QFkR",

  // Mensagem que já vem escrita quando o cliente chama uma loja.
  MENSAGEM_PADRAO: "Olá! Vim pelo site da Infoteccell.",

  // Vendas online (WhatsApp exclusivo para compras pelo site)
  VENDAS_ONLINE: {
    nome: "Vendas online",
    ddd: "55",
    numero: "999501072",
    mensagem: "Olá! Quero comprar pelo site da Infoteccell."
  },

  // Lojas — cada uma tem o seu WhatsApp.
  //   ddd + numero: só dígitos, sem 55 do país (o site já coloca).
  //   id: não mude (os botões usam).
  LOJAS: [
    {
      id: "cajazeiras",
      nome: "Infoteccell Cajazeiras",
      local: "Cajazeiras",
      endereco: "Rua Juvêncio Carneiro, 291 — Cajazeiras",
      ddd: "55",
      numero: "999501072"
    },
    {
      id: "uirauna",
      nome: "Infoteccell Uiraúna",
      local: "Uiraúna",
      endereco: "Rua João Pinto, 12 — Centro, Uiraúna",
      ddd: "84",
      numero: "998939583"
    },
    {
      id: "luisgomes",
      nome: "Infoteccell Luís Gomes",
      local: "Luís Gomes",
      endereco: "Avenida Senhora Santana — Centro, Luís Gomes",
      ddd: "84",
      numero: "999589893"
    }
  ],

  // Instagram
  INSTAGRAM_UNA: "https://www.instagram.com/infoteccell_una/",
  INSTAGRAM_BRASIL: "https://www.instagram.com/infoteccell_brasil/",
  INSTAGRAM_LUISGOMES: "https://www.instagram.com/infoteccel/",

  // Data do sorteio "Show de Prêmios" (fuso de Brasília)
  SORTEIO: "2026-10-31T00:00:00-03:00"
};
