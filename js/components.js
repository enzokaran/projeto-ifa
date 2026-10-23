/* ============================================================
   COMPONENTES DE RENDERIZAÇÃO (templates reutilizáveis)
   ============================================================ */

/* ---------- mapas ---------- */
// Converte lat/lng (cadastrados em data.json) em posição percentual (x,y) dentro do mapa
// ilustrativo, usando a área coberta por todos os pontos cadastrados como referência.
function pontoXY(p){
  const todos = DATA.pontos;
  const lats = todos.map(t=>t.lat), lngs = todos.map(t=>t.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const pad = 12; // margem para os pinos não colarem na borda
  const x = maxLng===minLng ? 50 : pad + (p.lng-minLng)/(maxLng-minLng) * (100-2*pad);
  const y = maxLat===minLat ? 50 : pad + (maxLat-p.lat)/(maxLat-minLat) * (100-2*pad);
  return {x, y};
}

function mockMap(pontosDestaque){
  const coords = pontosDestaque.map(p=>({...p, ...pontoXY(p)}));
  const pins = coords.map((p,i)=>`
    <div class="pin ${i>0?'alt':''}" style="left:${p.x}%; top:${p.y}%;">
      <div class="head"><span>${i+1}</span></div>
      <div class="pin-label">${p.nome}</div>
    </div>`).join("");
  return `
  <div class="mockmap reveal" role="img" aria-label="Mapa ilustrativo dos pontos cadastrados">
    <svg width="100%" height="100%" style="position:absolute; inset:0;" aria-hidden="true">
      <polyline class="route-line" points="${coords.map(p=>`${p.x*3.6},${p.y*2.7}`).join(" ")}"/>
    </svg>
    ${pins}
  </div>`;
}

function cidadeMapSection(){
  const embedUrl = DATA.cidade.mapaEmbedUrl;
  if(embedUrl){
    return `
    <div class="card reveal" style="padding:0; overflow:hidden;">
      <iframe src="${embedUrl}" width="100%" height="440" style="border:0; display:block;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa de Imaruí"></iframe>
    </div>`;
  }
  return `
    <div class="card reveal" style="padding:16px;">
      ${mockMap(DATA.pontos)}
    </div>
    <div class="map-note">${svgIcon('empty')}<span>Mapa ilustrativo. Para exibir o mapa real do Google My Maps, cole o link de incorporação no campo <code>cidade.mapaEmbedUrl</code> do arquivo data.json.</span></div>`;
}

// Mapa individual de cada linha. Cada linha pode ter seu próprio link do Google My Maps
// no campo "mapaEmbedUrl" (dentro do objeto da linha, em data.json). Enquanto esse campo
// não for preenchido, usa o mesmo mapa geral da cidade (cidade.mapaEmbedUrl) como padrão.
function linhaMapSection(l){
  const embedUrl = l.mapaEmbedUrl || DATA.cidade.mapaEmbedUrl;
  if(embedUrl){
    return `
    <div class="card reveal" style="padding:0; overflow:hidden;">
      <iframe src="${embedUrl}" width="100%" height="360" style="border:0; display:block;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa da linha ${l.numero}"></iframe>
    </div>`;
  }
  return `
    <div class="card reveal" style="padding:16px;">
      ${mockMap(DATA.pontos.filter(p=>p.linhas.includes(l.id)))}
    </div>
    <div class="map-note">${svgIcon('empty')}<span>Mapa ilustrativo. Para exibir o mapa real desta linha, cole o link de incorporação do Google My Maps no campo <code>mapaEmbedUrl</code> da linha ${l.numero} em data.json.</span></div>`;
}

/* ---------- linhas ---------- */
function lineCard(l){
  const status = statusHojeLabel(l);
  const horas = horariosParaCartao(l);
  return `
  <a href="#/linhas/${l.id}" class="card line-card reveal">
    <div class="line-card-top">
      <span class="line-badge">LINHA ${l.numero}</span>
      ${status ? `<span class="line-meta"><span>${svgIcon('clock')} ${status}</span></span>` : ""}
    </div>
    <div>
      <div class="line-route">${l.origem} <span class="arrow">→</span> ${l.destino}</div>
      <div class="line-meta mt-24" style="margin-top:8px;">
        <span>${svgIcon('tag')} ${fmtMoeda(l.valor)}</span>
        <span>${svgIcon('calendar')} ${diasResumoCurto(l)}</span>
      </div>
    </div>
    <div class="time-chips">
      ${horas.slice(0,5).map(h=>`<span class="time-chip">${h}</span>`).join("") || `<span class="time-chip">Sem horários cadastrados</span>`}
    </div>
    <div class="card-cta">Ver linha ${svgIcon('arrow')}</div>
  </a>`;
}

function itinerarioHtml(l, comLegenda){
  return `
  <div class="itinerary">
    ${l.itinerario.map((p,i)=>`
      <div class="itin-stop ${i===0||i===l.itinerario.length-1?'endpoint':''}">
        <div class="rail"><div class="node"></div><div class="stem"></div></div>
        <div class="itin-body"><div class="name">${p}</div>${comLegenda ? `<div class="sub">${i===0?'Origem':(i===l.itinerario.length-1?'Destino':'Parada')}</div>` : ""}</div>
      </div>`).join("")}
  </div>`;
}

/* ---------- avisos ---------- */
function alertCard(a){
  const meta = { ok:{cls:"ok", dot:"🟢"}, warn:{cls:"warn", dot:"🟡"}, bad:{cls:"bad", dot:"🔴"} }[a.nivel] || {cls:"ok", dot:"🟢"};
  return `
  <div class="alert ${meta.cls} reveal">
    <div class="alert-icon" aria-hidden="true">${meta.dot}</div>
    <div>
      <div class="alert-title">${a.titulo}</div>
      <p>${a.texto}</p>
      <div class="update-note" style="padding-top:8px;"><span>Atualizado em ${a.data}</span></div>
    </div>
  </div>`;
}

/* ---------- propostas ---------- */
function propostaCard(pr){
  const temMapa = !!pr.mapaEmbedUrl;
  return `
  <div class="card reveal" style="padding:0; overflow:hidden;">
    <div style="padding:22px;">
      <span class="line-badge" style="background:var(--amber-dim); color:var(--amber);">PROPOSTA</span>
      <h3 style="margin:12px 0 10px;">${pr.nome}</h3>
      <p style="margin:0;">${pr.descricao}</p>
    </div>
    ${temMapa
      ? `<iframe src="${pr.mapaEmbedUrl}" width="100%" height="320" style="border:0; display:block;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa da proposta ${pr.nome}"></iframe>`
      : `<div class="map-note" style="padding:0 22px 22px;">${svgIcon('empty')}<span>Sem mapa ainda. Para exibir o trajeto, cole o link de incorporação do Google My Maps no campo <code>mapaEmbedUrl</code> desta proposta em data.json.</span></div>`}
  </div>`;
}

/* ---------- quadro de próximas saídas (home) ---------- */
let mostrarSaidasAnteriores = false;

function flapRow(item, passada){
  return `
        <div class="flap-row" data-hora="${item.hora}" ${passada?'data-passada="1" style="opacity:.5;"':''}>
          <div class="flap-time">${item.hora}</div>
          <div class="flap-route">
            <span class="line-tag">LINHA ${item.linha.numero}</span>
            <span class="dest">${item.linha.origem} → ${item.linha.destino}</span>
          </div>
          <div class="flap-eta">${passada ? "Já saiu" : etaLabel(item.hora)}</div>
        </div>`;
}

function nextDeparturesBoard(){
  const todas = todosHorariosHoje().sort((a,b)=> a.hora.localeCompare(b.hora));
  const passadas = todas.filter(i => minutosAte(i.hora) < 0);
  const proximas = todas.filter(i => minutosAte(i.hora) >= 0).slice(0,4);
  const sig = proximas.map(i=>i.linha.id+i.hora).join("|") + "#" + passadas.length;
  const vazio = !todas.length
    ? "Não há saídas programadas para hoje."
    : "Não há mais saídas hoje.";
  return `
  <div class="board reveal" id="nextBoard" data-sig="${sig}">
    <div class="board-head">
      <h3><span class="live"></span>Próximas saídas</h3>
      <a href="#/horarios" style="font-size:.78rem; color:var(--teal); font-weight:700;">Ver tudo</a>
    </div>
    <div class="board-list">
      ${mostrarSaidasAnteriores ? passadas.map(i=>flapRow(i,true)).join("") : ""}
      ${proximas.length
        ? proximas.map(i=>flapRow(i,false)).join("")
        : `<p style="padding:14px 10px; font-size:.9rem;">${vazio}</p>`}
    </div>
    ${passadas.length ? `
    <div style="padding:0 20px 16px;">
      <button type="button" id="toggleAnteriores" aria-expanded="${mostrarSaidasAnteriores}" style="font-size:.78rem; color:var(--teal); font-weight:700; text-decoration:underline; text-underline-offset:3px;">
        ${mostrarSaidasAnteriores ? "Ocultar" : "Mostrar"} saídas anteriores (${passadas.length})
      </button>
    </div>` : ""}
  </div>`;
}

// Atualiza o quadro quando uma saída passa, sem recarregar a página.
function atualizarQuadroSaidas(forcar){
  const atual = $("#nextBoard");
  if(!atual) return;
  const tmp = document.createElement("div");
  tmp.innerHTML = nextDeparturesBoard().trim();
  const novo = tmp.firstElementChild;
  if(forcar || novo.dataset.sig !== atual.dataset.sig){
    novo.classList.add("in");
    atual.replaceWith(novo);
  }else{
    $$(".flap-row[data-hora]:not([data-passada])", atual).forEach(r=>{
      const eta = $(".flap-eta", r);
      if(eta) eta.textContent = etaLabel(r.dataset.hora);
    });
  }
}
document.addEventListener("click", e=>{
  if(e.target.closest("#toggleAnteriores")){
    mostrarSaidasAnteriores = !mostrarSaidasAnteriores;
    atualizarQuadroSaidas(true);
  }
});
setInterval(()=>atualizarQuadroSaidas(false), 30000);
