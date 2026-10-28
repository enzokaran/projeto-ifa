/* ============================================================
   REGISTRO DE PÁGINAS, NAVEGAÇÃO E ROTEADOR
   ------------------------------------------------------------
   PAGINAS é a fonte única das rotas do site. Cada item define:
     rota      caminho (#/rota)
     secao     id da seção (ver SECOES em config.js)
     titulo    texto usado em menus, subnavegação e <title>
     view      função que desenha a página
     sub       true = aparece na subnavegação da seção
     grupo     (opcional) agrupamento no índice /transporte
     descricao / resumo   (opcional) texto e contador do índice
     menu:false = não aparece na página "Mais"
   Para criar uma página nova, basta acrescentar um item aqui.
   ============================================================ */
const PAGINAS = [
  { rota:"/", secao:"inicio", titulo:"Início", view:viewHome, menu:false },

  // ----- Seção: Transporte -----
  { rota:"/transporte", secao:"transporte", titulo:"Visão geral", view:viewTransporte, sub:true, hub:true },
  { rota:"/linhas", secao:"transporte", titulo:"Linhas", view:viewLinhas, sub:true, grupo:"consultar",
    descricao:"Todas as linhas, com valor, dias de operação, itinerário e mapa.",
    resumo:()=>`${DATA.linhas.length} ${DATA.linhas.length===1?"linha cadastrada":"linhas cadastradas"}` },
  { rota:"/horarios", secao:"transporte", titulo:"Horários", view:viewHorarios, sub:true, grupo:"consultar",
    descricao:"Saídas de todas as linhas, dia a dia, de hoje até domingo." },
  { rota:"/rotas", secao:"transporte", titulo:"Rotas", view:viewRotas, sub:true, grupo:"consultar",
    descricao:"Informe origem e destino e veja quais linhas e itinerários atendem." },
  { rota:"/tarifas", secao:"transporte", titulo:"Tarifas", view:viewTarifas, sub:true, grupo:"informacoes",
    descricao:"Valor por linha, categorias especiais e formas de pagamento." },
  { rota:"/avisos", secao:"transporte", titulo:"Avisos", view:viewAvisos, sub:true, grupo:"informacoes",
    descricao:"Alterações de itinerário, interrupções e comunicados.",
    resumo:()=>`${DATA.avisos.length} ${DATA.avisos.length===1?"comunicado":"comunicados"}` },
  { rota:"/propostas", secao:"transporte", titulo:"Propostas", view:viewPropostas, sub:true, grupo:"explorar",
    descricao:"Rotas em estudo que ainda não estão em operação.",
    resumo:()=>`${DATA.propostas.length} ${DATA.propostas.length===1?"proposta":"propostas"}` },
  { rota:"/visitante", secao:"transporte", titulo:"Estou visitando a cidade", view:viewVisitante, sub:true, grupo:"explorar",
    descricao:"Como chegar aos principais tipos de local usando o transporte." },
  { rota:"/favoritos", secao:"transporte", titulo:"Favoritos", view:viewFavoritos, sub:true, grupo:"explorar",
    descricao:"Linhas que você salvou neste aparelho.",
    resumo:()=>{ const n = favs().filter(x=>x.startsWith("linha:")).length; return `${n} ${n===1?"linha salva":"linhas salvas"}`; } },

  // ----- Seção: Conheça Imaruí (dados em imarui.json) -----
  { rota:"/imarui", secao:"imarui", titulo:"Visão geral", view:viewImarui, sub:true, hub:true },
  { rota:"/imarui/lugares", secao:"imarui", titulo:"Lugares", view:viewImaruiLugares, sub:true },
  { rota:"/imarui/cultura", secao:"imarui", titulo:"História e cultura", view:viewImaruiCultura, sub:true },

  // ----- Seção: Sobre -----
  { rota:"/sobre", secao:"sobre", titulo:"Sobre o Vai", view:viewSobre, sub:true },
  { rota:"/cidade", secao:"sobre", titulo:"Mobilidade na cidade", view:viewCidade, sub:true },

  // ----- Utilitária -----
  { rota:"/mais", secao:"utilitaria", titulo:"Mais", view:viewMais, menu:false }

];

function paginaPorRota(rota){ return PAGINAS.find(p => p.rota === rota) || null; }
const TITULO_SITE = "Vai Imaruí";
const TITULO_HOME = "Vai Imaruí — Ônibus, horários e cultura em Imaruí/SC";
const DESC_HOME = "Horários de ônibus e vans, linhas, tarifas e rotas em Imaruí/SC, mais a história, os lugares e a cultura da cidade. Projeto educacional gratuito do IFA.";
// Descrição (meta description) de cada página — atualizada a cada troca de rota
const DESCRICOES = {
  "/transporte": "Transporte em Imaruí/SC: linhas de ônibus e vans, horários, rotas, tarifas e avisos em um só lugar.",
  "/linhas": "Todas as linhas de ônibus e vans de Imaruí/SC, com valor, dias de operação, itinerário e mapa.",
  "/horarios": "Horários de ônibus e vans em Imaruí/SC: saídas de hoje até domingo, para todas as linhas.",
  "/rotas": "Planeje sua viagem em Imaruí/SC: informe origem e destino e veja quais linhas de ônibus atendem.",
  "/tarifas": "Tarifas do transporte em Imaruí/SC: valor por linha, meia-passagem, gratuidades e formas de pagamento.",
  "/avisos": "Avisos do transporte em Imaruí/SC: alterações de itinerário, interrupções e comunicados.",
  "/propostas": "Propostas de novas linhas de ônibus em Imaruí/SC, ainda em estudo.",
  "/visitante": "Visitando Imaruí/SC? Veja como chegar ao centro, à saúde, aos serviços e ao turismo de ônibus.",
  "/imarui": "Conheça Imaruí/SC: história, lugares, cultura e tradições da cidade, e como chegar até eles.",
  "/imarui/lugares": "Lugares para conhecer em Imaruí/SC e como chegar até eles de carro, a pé ou de transporte público.",
  "/imarui/cultura": "História e cultura de Imaruí/SC: dos povos originários aos açorianos, pescadores, festas e tradições de hoje.",
  "/sobre": "Sobre o Vai Imaruí: projeto educacional independente, feito por estudantes do IFA, sem fins lucrativos.",
  "/cidade": "Mobilidade em Imaruí/SC: como funciona o transporte na cidade e na região."
};
function atualizarMeta(descricao){
  let m = document.querySelector('meta[name="description"]');
  if(!m){ m = document.createElement("meta"); m.name = "description"; document.head.appendChild(m); }
  m.content = descricao;
}

/* ---------- construção de menus a partir da configuração ---------- */
function montarNavegacao(){
  $("#navLinks").innerHTML = SECOES.map(s =>
    `<a href="#${s.rota}" data-secao="${s.id}">${s.label}</a>`).join("");

  $("#bottomNav").innerHTML = BARRA_INFERIOR.map(i =>
    `<a href="#${i.rota}" class="bn-item" data-rota="${i.rota}">
       <svg viewBox="0 0 24 24" aria-hidden="true">${i.icone}</svg>${i.label}</a>`).join("");

  $("#footCols").innerHTML = SECOES.filter(s => s.id !== "inicio").map(s => `
    <div class="foot-col">
      <h4>${s.label}</h4>
      ${PAGINAS.filter(p => p.secao === s.id && p.menu !== false).map(p => `<a href="#${p.rota}">${p.titulo}</a>`).join("")}
    </div>`).join("");
}

function subnavHtml(pg, rotaAtual){
  const irmas = PAGINAS.filter(p => p.secao === pg.secao && p.sub);
  if(irmas.length < 2) return "";
  const secao = SECOES.find(s => s.id === pg.secao);
  return `
  <nav class="subnav wrap" aria-label="${secao ? secao.label : "Seção"}">
    <div class="chip-row">
      ${irmas.map(p => `<a class="chip ${p.rota===rotaAtual?'active':''}" href="#${p.rota}" ${p.rota===rotaAtual?'aria-current="page"':''}>${p.titulo}</a>`).join("")}
    </div>
  </nav>`;
}

/* ---------- roteador ---------- */
function parseHash(){
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, qs] = raw.split("?");
  return { path: path || "/", query: new URLSearchParams(qs || "") };
}

let primeiraRenderizacao = true;

function render(){
  const { path, query } = parseHash();
  const ctx = { path, query, id: null };
  let pg = null, html, titulo = "";

  const linhaMatch = path.match(/^\/linhas\/(.+)$/);
  const lugarMatch = path.match(/^\/imarui\/lugares\/(.+)$/);
  const temaMatch = path.match(/^\/imarui\/cultura\/(.+)$/);
  if(lugarMatch){
    pg = paginaPorRota("/imarui/lugares");
    ctx.id = decodeURIComponent(lugarMatch[1]);
    html = viewImaruiLugarDetail(ctx);
    const lg = IMARUI ? lugarById(ctx.id) : null;
    titulo = lg ? lg.nome : "Lugar não encontrado";
  }else if(temaMatch){
    pg = paginaPorRota("/imarui/cultura");
    ctx.id = decodeURIComponent(temaMatch[1]);
    html = viewImaruiCultura(ctx);
    titulo = pg.titulo;
  }else if(linhaMatch){
    pg = paginaPorRota("/linhas");
    ctx.id = decodeURIComponent(linhaMatch[1]);
    html = viewLinhaDetail(ctx);
    const l = linhaById(ctx.id);
    titulo = l ? `Linha ${l.numero}` : "Linha não encontrada";
  }else{
    pg = paginaPorRota(path);
    html = pg ? pg.view(ctx) : viewNaoEncontrada();
    titulo = pg && pg.rota !== "/" ? (pg.hub ? SECOES.find(s=>s.id===pg.secao).label : pg.titulo) : "";
  }

  const rotaAtual = pg ? pg.rota : null;
  const sub = pg && !pg.hub ? subnavHtml(pg, rotaAtual) : "";
  app.innerHTML = sub + html;

  document.title = titulo ? `${titulo} — ${TITULO_SITE}` : TITULO_HOME;
  let desc = DESC_HOME;
  if(lugarMatch && IMARUI && lugarById(ctx.id)){
    const lg = lugarById(ctx.id);
    desc = `${lg.nome} em Imaruí/SC: ${lg.descricao}`.slice(0,155);
  }else if(linhaMatch && linhaById(ctx.id)){
    const l = linhaById(ctx.id);
    desc = `Linha ${l.numero}: ${l.origem} → ${l.destino}. Horários, valor, itinerário e mapa do ônibus em Imaruí/SC.`;
  }else if(pg && DESCRICOES[pg.rota]){
    desc = DESCRICOES[pg.rota];
  }
  atualizarMeta(desc);
  window.scrollTo({ top:0, behavior:"instant" });
  if(!primeiraRenderizacao) app.focus({ preventScroll:true });
  primeiraRenderizacao = false;

  updateNavActive(pg);
  bindPageEvents();
  initReveal();
  if(temaMatch) irParaTema(ctx.id);
}

function updateNavActive(pg){
  const secaoId = pg ? pg.secao : null;
  $$("#navLinks a").forEach(a=>{
    const on = a.dataset.secao === secaoId;
    a.classList.toggle("active", on);
    if(on) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
  });
  const rota = pg ? pg.rota : null;
  const doAtalho = i => i.rota !== "/mais" && (i.rota === rota || !!(i.secao && pg && i.secao === pg.secao));
  const atalho = BARRA_INFERIOR.some(doAtalho);
  $$("#bottomNav a").forEach(a=>{
    const r = a.dataset.rota;
    const item = BARRA_INFERIOR.find(i => i.rota === r);
    const on = r === "/mais" ? (!atalho && rota !== null) : doAtalho(item);
    a.classList.toggle("active", on);
    if(on) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
  });
}

function irParaRotas(from, to){
  location.hash = `/rotas?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

function bindPageEvents(){
  bindImarui();
  // planejador (início)
  const pf = $("#plannerForm");
  if(pf){
    pf.addEventListener("submit", e=>{
      e.preventDefault();
      irParaRotas($("#fromInput").value.trim(), $("#toInput").value.trim());
    });
    const swap = $("#swapBtn");
    if(swap) swap.addEventListener("click", ()=>{
      const a = $("#fromInput"), b = $("#toInput");
      [a.value,b.value] = [b.value,a.value];
    });
  }
  // planejador (página Rotas)
  const pf2 = $("#plannerForm2");
  if(pf2){
    pf2.addEventListener("submit", e=>{
      e.preventDefault();
      irParaRotas($("#fromInput2").value.trim(), $("#toInput2").value.trim());
    });
  }
  // favoritar linha
  const favBtn = $("#favBtn");
  if(favBtn){
    favBtn.addEventListener("click", ()=>{
      toggleFav(favBtn.dataset.fav);
      const on = isFav(favBtn.dataset.fav);
      favBtn.classList.toggle("on", on);
      favBtn.setAttribute("aria-pressed", on);
      $("span", favBtn).textContent = on ? "Nos favoritos" : "Salvar linha";
    });
  }
  // informar problema (confirmação local)
  const reportBtn = $("#reportBtn");
  if(reportBtn){
    reportBtn.addEventListener("click", ()=>{
      reportBtn.textContent = "Obrigado! Recebemos sua notificação.";
      reportBtn.style.color = "var(--green)";
    });
  }
  // chips de dia (horários)
  const dayChips = $("#dayChips");
  if(dayChips){
    dayChips.addEventListener("click", e=>{
      const btn = e.target.closest(".chip");
      if(!btn) return;
      $$(".chip", dayChips).forEach(c=>{ c.classList.remove("active"); c.setAttribute("aria-pressed","false"); });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed","true");
      renderHorariosResult(btn.dataset.day);
    });
    renderHorariosResult("Hoje");
  }
  // destinos do visitante
  $$("[data-visit]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const cat = btn.dataset.visit;
      const d = DATA.destinosVisitante.find(x=>x.cat===cat);
      const linhas = d.linhas.map(id=>linhaById(id)).filter(Boolean);
      $("#visitResult").innerHTML = `
        <div class="card reveal in">
          <h2 class="card-title" style="margin-bottom:6px;">Como chegar até: ${cat}</h2>
          <p style="margin-bottom:16px;">Opções de transporte disponíveis para essa categoria.</p>
          <div class="grid grid-3">${linhas.map(lineCard).join("") || `<p>Informação não disponível.</p>`}</div>
        </div>`;
    });
  });
}

/* ---------- inicialização ---------- */
window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", async ()=>{
  try{
    await loadData();
    await loadImarui();
    montarNavegacao();
    render();
  }catch(err){
    app.innerHTML = `<div class="wrap section"><div class="empty-state">${svgIcon('empty')}
      <h3>Não foi possível carregar data.json.</h3>
      <p>Este site precisa ser aberto por um servidor (hospedagem normal, GitHub Pages, Netlify, ou "python -m http.server" localmente) — abrir o arquivo .html direto (file://) bloqueia a leitura do data.json.</p>
    </div></div>`;
    console.error(err);
  }
});

// Modo offline (PWA) — só em http(s)
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load", ()=>{ navigator.serviceWorker.register("./sw.js").catch(()=>{}); });
}