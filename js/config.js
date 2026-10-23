/* ============================================================================================
   CONFIGURAÇÃO DE NAVEGAÇÃO
   --------------------------------------------------------------------------------------------
   O site é organizado em SEÇÕES (nível mais alto do menu). Cada página pertence a uma seção
   (ver PAGINAS em router.js).

   Seções ativas:
     • Início      – visão geral e acesso rápido
     • Transporte  – tudo sobre linhas, horários, rotas, tarifas, avisos e propostas
     • Conheça Imaruí – lugares, história e cultura (dados em imarui.json, views em js/views-imarui.js)
     • Sobre       – o projeto e a atuação do Vai

   ➜ NOVA SEÇÃO NO FUTURO: acrescente um item em SECOES, registre as páginas em PAGINAS (router.js)
     com o id da seção e guarde os dados num JSON próprio. Menu superior, subnavegação, rodapé
     e a página "Mais" são gerados a partir dessas listas.
   ============================================================================================ */

const SECOES = [
  { id: "inicio",     label: "Início",     rota: "/" },
  { id: "transporte", label: "Transporte", rota: "/transporte" },
  { id: "imarui",     label: "Conheça Imaruí", rota: "/imarui" },
  { id: "sobre",      label: "Sobre",      rota: "/sobre" }
];

// Atalhos fixos da barra inferior (celular). O último ("Mais") abre /mais com todas as páginas.
const BARRA_INFERIOR = [
  { rota: "/",         label: "Início",   icone: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>' },
  { rota: "/rotas",    label: "Rotas",    icone: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4h-2"/>' },
  { rota: "/linhas",   label: "Linhas",   icone: '<rect x="4" y="5" width="16" height="12" rx="2"/><path d="M4 13h16M8 17v2M16 17v2"/>' },
  { rota: "/horarios", label: "Horários", icone: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
  { rota: "/imarui",   label: "Conheça",  secao: "imarui", icone: '<path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.3"/>' },
  { rota: "/mais",     label: "Mais",     icone: '<path d="M4 6h16M4 12h16M4 18h16"/>' }
];
