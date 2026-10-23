/* ============================================================
   SEÇÃO "CONHEÇA IMARUÍ" — lugares, história e cultura
   Dados em imarui.json (separado de data.json, que é só do transporte).

   Para cadastrar um lugar novo, acrescente um item em "lugares" no imarui.json:
     id, nome, categoria, descricao, importancia   (textos verificados)
     endereco  e/ou  lat + lng                      (só se confirmados; sem eles o botão de rota não aparece)
     aviso, linhas (ids de data.json), temas (ids de "temas"), referencias, leituras
   Para um tema novo de história/cultura, acrescente um item em "temas".
   ============================================================ */

let IMARUI = null;

// Não é crítico: se imarui.json falhar, o restante do site (transporte) continua funcionando.
async function loadImarui(){
  try{
    const res = await fetch("./imarui.json", { cache: "no-store" });
    if(!res.ok) throw new Error("HTTP " + res.status);
    IMARUI = await res.json();
  }catch(e){
    IMARUI = null;
    console.warn("imarui.json indisponível:", e);
  }
}

function lugarById(id){ return (IMARUI.lugares||[]).find(l => l.id === id) || null; }
function temaById(id){ return (IMARUI.temas||[]).find(t => t.id === id) || null; }
function fonteById(id){ return (IMARUI.fontes||[]).find(f => f.id === id) || null; }

/* ---------- localização e rota ---------- */
function temCoordenadas(l){ return Number.isFinite(l.lat) && Number.isFinite(l.lng); }
// Destino usado nos mapas: coordenadas verificadas ou endereço cadastrado; nunca um ponto inventado.
function destinoLugar(l){
  if(temCoordenadas(l)) return `${l.lat},${l.lng}`;
  return l.endereco ? l.endereco : null;
}
const MODOS_ROTA = [
  { valor:"driving", rotulo:"De carro" },
  { valor:"walking", rotulo:"A pé" },
  { valor:"transit", rotulo:"Transporte público" }
];
// Link de direções do Google Maps. Sem "origin", o Google usa a localização do aparelho.
function linkRota(l, modo, origemTexto){
  const destino = destinoLugar(l);
  if(!destino) return null;
  const p = new URLSearchParams({ api:"1", destination:destino, travelmode:modo || "driving" });
  if(origemTexto) p.set("origin", origemTexto);
  return "https://www.google.com/maps/dir/?" + p.toString();
}
function mapaEmbedLugar(l){
  const destino = destinoLugar(l);
  if(!destino) return "";
  return `
  <div class="card reveal" style="padding:0; overflow:hidden;">
    <iframe src="https://maps.google.com/maps?q=${encodeURIComponent(destino)}&z=14&output=embed" width="100%" height="320" style="border:0; display:block;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa: ${esc(l.nome)}"></iframe>
  </div>`;
}

function referenciasHtml(refs){
  const itens = (refs||[]).map(r => {
    const f = fonteById(r.id || r);
    if(!f) return "";
    return `${f.titulo}${r.pagina ? `, p. ${r.pagina}` : ""}`;
  }).filter(Boolean);
  return itens.length ? `<p class="fonte">Fonte: ${itens.join("; ")}.</p>` : "";
}
function leiturasHtml(){
  const ls = IMARUI.leituras || [];
  if(!ls.length) return "";
  return `
  <div class="leituras">
    <h3 class="leituras-title">Para saber mais</h3>
    <ul>
      ${ls.map(x => `<li><a href="${x.url}" target="_blank" rel="noopener noreferrer">${x.titulo}</a> <span class="fonte">· ${x.origem}</span></li>`).join("")}
    </ul>
  </div>`;
}

function imaruiIndisponivel(){
  return `<div class="wrap section"><div class="empty-state">${svgIcon('empty')}<h3>Não foi possível carregar esta seção.</h3><p>O conteúdo de Conheça Imaruí está temporariamente indisponível. O transporte continua funcionando normalmente.</p><a href="#/linhas" class="btn-secondary mt-24">Ver linhas de ônibus</a></div></div>`;
}

/* ---------- visão geral ---------- */
function viewImarui(){
  if(!IMARUI) return imaruiIndisponivel();
  const nL = (IMARUI.lugares||[]).length, nT = (IMARUI.temas||[]).length;
  const f = (IMARUI.fontes||[])[0];
  return `
  <section class="section wrap" style="padding-top:36px;">
    <span class="eyebrow">Conheça Imaruí</span>
    <h1 style="margin-bottom:14px;">Histórias, lugares e <em style="color:var(--amber); font-style:normal;">culturas</em></h1>
    <p class="lede" style="max-width:62ch;">${IMARUI.apresentacao.texto}</p>
    <div class="grid grid-2 mt-32">
      <a href="#/imarui/lugares" class="card hub-card reveal">
        <div class="hub-card-top"><h3 class="mb-0">Lugares</h3><span class="hub-arrow">${svgIcon('arrow')}</span></div>
        <p>Locais para conhecer e como chegar até eles.</p>
        <span class="hub-meta">${nL} ${nL===1?"lugar":"lugares"}</span>
      </a>
      <a href="#/imarui/cultura" class="card hub-card reveal">
        <div class="hub-card-top"><h3 class="mb-0">História e cultura</h3><span class="hub-arrow">${svgIcon('arrow')}</span></div>
        <p>Dos povos originários às festas e tradições de hoje.</p>
        <span class="hub-meta">${nT} ${nT===1?"tema":"temas"}</span>
      </a>
    </div>
    ${f ? `
    <details class="mais mais-box mt-32">
      <summary>Fontes e leituras</summary>
      <div class="mais-body">
        <p>Os textos foram elaborados a partir da cartilha <strong>${f.titulo}</strong>, de ${f.autores}, distribuída nas escolas da rede municipal. Cada tema indica a página de origem. Informações ainda não confirmadas não são apresentadas como fato.</p>
        ${leiturasHtml()}
      </div>
    </details>` : ""}
  </section>`;
}

/* ---------- lugares ---------- */
function lugarCard(l){
  return `
  <a href="#/imarui/lugares/${l.id}" class="card line-card lugar-card reveal">
    <div>
      <span class="cat-label">${l.categoria}</span>
      <h3 class="mb-0 lugar-nome">${l.nome}</h3>
      <p style="margin-top:8px;">${l.descricao}</p>
    </div>
    <div class="line-meta">
      <span>${svgIcon('loc')} ${destinoLugar(l) ? "Rota disponível" : "Localização a confirmar"}</span>
    </div>
    <div class="card-cta">Conhecer lugar ${svgIcon('arrow')}</div>
  </a>`;
}

function viewImaruiLugares(){
  if(!IMARUI) return imaruiIndisponivel();
  const lugares = IMARUI.lugares || [];
  return `
  <section class="section wrap" style="padding-top:36px;">
    <span class="eyebrow">Conheça Imaruí</span>
    <h1 style="margin-bottom:12px;">Lugares</h1>
    <p class="lede" style="max-width:60ch; margin-bottom:22px;">Novos lugares entram aqui à medida que forem confirmados.</p>
    ${lugares.length
      ? `<div class="grid grid-3">${lugares.map(lugarCard).join("")}</div>`
      : `<div class="empty-state">${svgIcon('empty')}<h3>Nenhum lugar cadastrado ainda.</h3></div>`}
  </section>`;
}

function viewImaruiLugarDetail(ctx){
  if(!IMARUI) return imaruiIndisponivel();
  const l = lugarById(ctx.id);
  if(!l) return `<div class="wrap section"><div class="empty-state">${svgIcon('empty')}<h3>Lugar não encontrado.</h3><a href="#/imarui/lugares" class="btn-secondary mt-24">Ver todos os lugares</a></div></div>`;
  const destino = destinoLugar(l);
  const temas = (l.temas||[]).map(temaById).filter(Boolean);
  const linhasLugar = (l.linhas||[]).map(linhaById).filter(Boolean);
  const refs = referenciasHtml(l.referencias);
  const apoio = refs || l.leituras;
  return `
  <section class="detail-hero wrap">
    <a href="#/imarui/lugares" class="back-link">${svgIcon('back')} Todos os lugares</a>
    <span class="eyebrow">${l.categoria}</span>
    <h1 class="detail-route" style="font-size:clamp(2rem,7vw,3rem);">${l.nome}</h1>
    <div class="info-strip">
      <div class="info-item"><div class="label">Localização</div><div class="value" style="max-width:52ch;">${l.endereco || "A confirmar"}</div></div>
    </div>
  </section>

  <section class="section wrap">
    <div class="grid grid-2" style="align-items:start;">
      <div class="card reveal detalhe-texto">
        <p class="lede">${l.descricao}</p>
        <h2 class="card-title">Por que conhecer</h2>
        <p>${l.importancia}</p>
        ${l.aviso ? `<div class="aviso-box" role="note"><strong>Antes de visitar</strong><p>${l.aviso}</p></div>` : ""}
        ${temas.length ? `
          <div>
            <h2 class="card-title">Leia também</h2>
            <div class="time-chips">${temas.map(t=>`<a class="chip" href="#/imarui/cultura/${t.id}">${t.titulo}</a>`).join("")}</div>
          </div>` : ""}
        ${apoio ? `
        <details class="mais">
          <summary>Fontes e leituras</summary>
          <div class="mais-body">
            ${refs}
            ${l.leituras ? leiturasHtml() : ""}
          </div>
        </details>` : ""}
      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">
        ${destino ? mapaEmbedLugar(l) : ""}
        <div class="card reveal">
          <h2 class="card-title">Como chegar</h2>
          ${destino ? `
          <form id="rotaForm" data-lugar="${l.id}">
            <a id="rotaBtn" class="btn-primary" style="text-decoration:none; margin-top:0;" href="${linkRota(l, "driving")}" target="_blank" rel="noopener noreferrer">
              ${svgIcon('arrow')} Iniciar rota no Google Maps
            </a>
            <details class="mais" style="margin-top:12px;">
              <summary>Mudar meio de transporte ou ponto de partida</summary>
              <div class="mais-body">
                <fieldset class="modo-fieldset">
                  <legend class="eyebrow" style="margin-bottom:10px;">Como você vai</legend>
                  <div class="chip-row" style="flex-wrap:wrap;">
                    ${MODOS_ROTA.map((m,i)=>`<label class="chip-radio"><input type="radio" name="modo" value="${m.valor}" ${i===0?"checked":""}><span class="chip">${m.rotulo}</span></label>`).join("")}
                  </div>
                </fieldset>
                <label class="origem-label" for="origemInput">Partir de outro lugar? <span class="fonte">(opcional)</span></label>
                <div class="search-bar">
                  ${svgIcon('pinFrom')}
                  <input id="origemInput" type="text" placeholder="Deixe em branco para usar a sua localização" autocomplete="off">
                </div>
              </div>
            </details>
            <p class="fonte" style="margin-top:12px;">Abre o Google Maps com o destino preenchido. Sem origem, o Google pede permissão para usar a localização do seu aparelho; o Vai não acessa nem guarda essa localização. O Google mostra apenas os percursos que conhece.</p>
          </form>` : `
          <p>A localização deste lugar ainda não foi confirmada. Quando o endereço ou as coordenadas forem cadastrados, o mapa e o botão de rota aparecem aqui.</p>`}
          ${linhasLugar.length
            ? `<div class="transp-lugar"><h3 class="leituras-title">Transporte público</h3><div class="grid" style="gap:10px;">${linhasLugar.map(lineCard).join("")}</div></div>`
            : `<p class="transp-lugar fonte">Ainda não há linha de ônibus cadastrada até este lugar. <a href="#/linhas" class="link-sutil">Ver linhas e horários</a></p>`}
        </div>
      </div>
    </div>
  </section>`;
}

/* ---------- história e cultura ---------- */
function temaCard(t){
  const lugar = t.lugar ? lugarById(t.lugar) : null;
  const completo = t.texto.map(p=>`<p>${p}</p>`).join("");
  const refs = referenciasHtml(t.referencias);
  const extras = `
    ${lugar ? `<a href="#/imarui/lugares/${lugar.id}" class="card-cta link-lugar">${svgIcon('loc')} Ver ${lugar.nome} ${svgIcon('arrow')}</a>` : ""}
    ${refs}
    ${t.leituras ? leiturasHtml() : ""}`;
  // Com resumo: mostra o resumo e deixa o texto completo num painel expansível.
  // Sem resumo (texto já curto): mostra o texto direto.
  const corpo = t.resumo ? `
    <p>${t.resumo}</p>
    <details class="mais">
      <summary>Ler mais</summary>
      <div class="mais-body">${completo}${extras}</div>
    </details>` : `${completo}${extras}`;
  return `
  <article class="card tema-card reveal" id="tema-${t.id}" data-cat="${t.categoria}">
    <span class="cat-label">${t.categoria}</span>
    <h2 class="tema-title">${t.titulo}</h2>
    ${corpo}
  </article>`;
}

function viewImaruiCultura(ctx){
  if(!IMARUI) return imaruiIndisponivel();
  const cats = IMARUI.categorias || [];
  return `
  <section class="section wrap" style="padding-top:36px;">
    <span class="eyebrow">Conheça Imaruí</span>
    <h1 style="margin-bottom:12px;">História e cultura</h1>
    <p class="lede" style="max-width:60ch; margin-bottom:22px;">Dos primeiros povos que viveram junto à lagoa às festas e tradições de hoje.</p>
    <div class="chip-row" id="catChips" role="group" aria-label="Filtrar por categoria">
      <button class="chip active" data-cat="" aria-pressed="true">Todos</button>
      ${cats.map(c=>`<button class="chip" data-cat="${c}" aria-pressed="false">${c}</button>`).join("")}
    </div>
    <div class="grid grid-2 mt-24" id="temasGrid" style="align-items:start;">
      ${(IMARUI.temas||[]).map(temaCard).join("")}
    </div>
  </section>`;
}

/* ---------- eventos da seção ---------- */
function bindImarui(){
  // botão de rota: atualiza o link conforme o meio de transporte e a origem escolhidos
  const form = $("#rotaForm");
  if(form){
    const lugar = lugarById(form.dataset.lugar);
    const btn = $("#rotaBtn");
    const atualizar = ()=>{
      const modo = form.querySelector("input[name=modo]:checked").value;
      btn.href = linkRota(lugar, modo, $("#origemInput").value.trim());
    };
    form.addEventListener("change", atualizar);
    $("#origemInput").addEventListener("input", atualizar);
    form.addEventListener("submit", e => e.preventDefault());
  }
  // filtro de categorias (história e cultura)
  const chips = $("#catChips");
  if(chips){
    chips.addEventListener("click", e=>{
      const b = e.target.closest(".chip");
      if(!b) return;
      $$(".chip", chips).forEach(c=>{ c.classList.remove("active"); c.setAttribute("aria-pressed","false"); });
      b.classList.add("active"); b.setAttribute("aria-pressed","true");
      $$("#temasGrid .tema-card").forEach(card=>{ card.hidden = !!b.dataset.cat && card.dataset.cat !== b.dataset.cat; });
    });
  }
}

// Abre /imarui/cultura/<id>: rola até o tema indicado
function irParaTema(id){
  const el = document.getElementById("tema-" + id);
  if(el){
    el.classList.add("in");
    const d = el.querySelector("details.mais");
    if(d) d.open = true; // quem chegou por um link quer ler o tema
    el.scrollIntoView({ behavior:"auto", block:"start" });
  }
}