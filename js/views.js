/* ============================================================
   VIEWS (páginas). Cada view recebe ctx = { path, query, id }
   O registro de rotas (PAGINAS) fica em router.js.
   ============================================================ */

/* ---------- Início ---------- */
function viewHome(){
  return `
  <section class="hero wrap">
    <div class="hero-grid">
      <div>
        <span class="hero-tag"><span class="dot"></span> Imaruí · operação normal hoje</span>
        <h1>Encontre <em>seu caminho.</em></h1>
        <p class="lede">Consulte horários, rotas, pontos e tarifas do transporte de Imaruí em um só lugar — sem precisar perguntar a ninguém.</p>
        <form class="planner reveal" id="plannerForm">
          <div class="planner-fields">
            <label class="planner-field">
              ${svgIcon('pinFrom')}
              <input id="fromInput" type="text" placeholder="De onde você está?" aria-label="De onde você está?" autocomplete="off">
            </label>
            <label class="planner-field">
              ${svgIcon('pinTo')}
              <input id="toInput" type="text" placeholder="Para onde você quer ir?" aria-label="Para onde você quer ir?" autocomplete="off">
              <button type="button" class="planner-swap" id="swapBtn" aria-label="Inverter origem e destino">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><path d="M7 10l5-5 5 5M7 14l5 5 5-5"/></svg>
              </button>
            </label>
          </div>
          <button type="submit" class="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            Encontrar transporte
          </button>
        </form>
      </div>
      <div>${nextDeparturesBoard()}</div>
    </div>
  </section>

  <section class="section-tight wrap">
    <nav aria-label="Acesso rápido">
      <div class="chip-row quick-links">
        ${["/linhas","/horarios","/tarifas","/avisos","/propostas","/visitante"].map(r=>{
          const p = paginaPorRota(r);
          return `<a class="chip" href="#${r}">${p.titulo}</a>`;
        }).join("")}
        <a class="chip chip-more" href="#/transporte">Todo o transporte ${svgIcon('arrow')}</a>
      </div>
    </nav>
  </section>

  <section class="section-tight wrap">
    <div class="sec-head">
      <div><span class="eyebrow">Avisos</span><h2 style="font-size:1.6rem;">Fique por dentro</h2></div>
      <a href="#/avisos" class="btn-secondary">Ver todos ${svgIcon('arrow')}</a>
    </div>
    <div class="grid" style="gap:12px;">
      ${DATA.avisos.slice(0,2).map(alertCard).join("")}
    </div>
  </section>

  <section class="section wrap">
    <div class="sec-head">
      <div><span class="eyebrow">Linhas</span><h2 style="font-size:1.6rem;">Linhas em destaque</h2></div>
      <a href="#/linhas" class="btn-secondary">Ver todas ${svgIcon('arrow')}</a>
    </div>
    <div class="grid grid-3">
      ${DATA.linhas.map(lineCard).join("")}
    </div>
  </section>
  `;
}

/* ---------- Transporte (página-índice da seção) ---------- */
function viewTransporte(){
  const grupos = [
    { id:"consultar",   titulo:"Consultar" },
    { id:"informacoes", titulo:"Valores e comunicados" },
    { id:"explorar",    titulo:"Explorar" }
  ];
  const paginas = PAGINAS.filter(p => p.secao === "transporte" && p.grupo);
  return `
  <section class="section wrap" style="padding-top:36px;">
    <span class="eyebrow">Transporte</span>
    <h1 style="margin-bottom:12px;">Transporte público <em style="color:var(--amber); font-style:normal;">de Imaruí</em></h1>
    <p class="lede" style="max-width:60ch; margin-bottom:8px;">Linhas, horários, rotas e tarifas reunidos em um só lugar. Escolha o que você precisa consultar.</p>
    ${grupos.map(g=>`
      <div class="hub-group">
        <h2 class="hub-title">${g.titulo}</h2>
        <div class="grid grid-3">
          ${paginas.filter(p=>p.grupo===g.id).map(p=>`
            <a href="#${p.rota}" class="card hub-card reveal">
              <div class="hub-card-top"><h3 class="mb-0">${p.titulo}</h3><span class="hub-arrow">${svgIcon('arrow')}</span></div>
              <p>${p.descricao}</p>
              ${p.resumo ? `<span class="hub-meta">${p.resumo()}</span>` : ""}
            </a>`).join("")}
        </div>
      </div>`).join("")}
  </section>`;
}

/* ---------- Rotas (planejador) ---------- */
function viewRotas(ctx){
  const from = (ctx.query.get("from") || "").trim();
  const to = (ctx.query.get("to") || "").trim();
  let results = "";
  if(from || to){
    // todos os termos preenchidos precisam aparecer na origem, destino ou itinerário da linha
    const termos = [from, to].map(normalizar).filter(Boolean);
    const found = DATA.linhas.filter(l=>{
      const txt = normalizar([l.origem, l.destino, ...l.itinerario].join(" "));
      return termos.every(t => txt.includes(t));
    });
    results = found.length ? `
      <div class="grid" style="gap:14px; margin-top:26px;">
        ${found.map(l=>{
          const prox = proximaSaidaHoje(l) || horariosParaCartao(l)[0] || null;
          return `
          <div class="card reveal">
            <div class="line-card-top">
              <span class="line-badge">LINHA ${l.numero}</span>
              <span class="flap-eta">${statusHojeLabel(l) || "Sem horários cadastrados"}</span>
            </div>
            <div class="line-route mt-24">${l.origem} <span class="arrow">→</span> ${l.destino}</div>
            <div class="line-meta" style="margin:10px 0 14px;">
              <span>${svgIcon('clock')} Próx.: ${prox || "Informação não disponível"}</span>
              <span>${svgIcon('tag')} ${fmtMoeda(l.valor)}</span>
              <span>${svgIcon('calendar')} ${diasResumoCurto(l)}</span>
            </div>
            <div style="margin-bottom:6px;">${itinerarioHtml(l, false)}</div>
            <a href="#/linhas/${l.id}" class="card-cta">Ver detalhes da rota ${svgIcon('arrow')}</a>
          </div>`;
        }).join("")}
      </div>
    ` : `
      <div class="empty-state reveal">
        ${svgIcon('empty')}
        <h3>Não encontramos uma rota para essa busca.</h3>
        <p>Tente pesquisar por outro bairro, comunidade ou o nome de uma linha.</p>
        <a href="#/linhas" class="btn-secondary mt-24">Ver todas as linhas ${svgIcon('arrow')}</a>
      </div>
    `;
  }
  return `
  <section class="section wrap" style="padding-top:36px;">
    <span class="eyebrow">Planejador</span>
    <h1 style="margin-bottom:18px;">Como você quer <em style="color:var(--amber); font-style:normal;">chegar?</em></h1>
    <form class="planner reveal" id="plannerForm2" style="max-width:640px;">
      <div class="planner-fields">
        <label class="planner-field">
          ${svgIcon('pinFrom')}
          <input id="fromInput2" type="text" placeholder="De onde você está?" aria-label="De onde você está?" value="${esc(from)}" autocomplete="off">
        </label>
        <label class="planner-field">
          ${svgIcon('pinTo')}
          <input id="toInput2" type="text" placeholder="Para onde você quer ir?" aria-label="Para onde você quer ir?" value="${esc(to)}" autocomplete="off">
        </label>
      </div>
      <button type="submit" class="btn-primary">${svgIcon('search')} Encontrar transporte</button>
    </form>
    ${results}
  </section>`;
}

/* ---------- Linhas ---------- */
function viewLinhas(){
  return `
  <section class="section wrap" style="padding-top:36px;">
    <span class="eyebrow">Catálogo</span>
    <h1 style="margin-bottom:22px;">Linhas</h1>
    <div class="grid grid-3">
      ${DATA.linhas.map(lineCard).join("")}
    </div>
  </section>`;
}

function viewLinhaDetail(ctx){
  const l = linhaById(ctx.id);
  if(!l) return `<div class="wrap section"><div class="empty-state">${svgIcon('empty')}<h3>Linha não encontrada.</h3><a href="#/linhas" class="btn-secondary mt-24">Ver todas as linhas</a></div></div>`;
  const favId = "linha:"+l.id;
  return `
  <section class="detail-hero wrap">
    <a href="#/linhas" class="back-link">${svgIcon('back')} Todas as linhas</a>
    <span class="eyebrow">Linha ${l.numero}</span>
    <h1 class="detail-route">${l.origem}<span class="arrow">→</span>${l.destino}</h1>
    <div class="info-strip">
      <div class="info-item"><div class="label">Origem</div><div class="value">${l.origem}</div></div>
      <div class="info-item"><div class="label">Destino</div><div class="value">${l.destino}</div></div>
      <div class="info-item"><div class="label">Valor</div><div class="value accent">${fmtMoeda(l.valor)}</div></div>
      <div class="info-item"><div class="label">Dias</div><div class="value">${diasResumoLabel(l)}</div></div>
    </div>
    <button class="fav-btn mt-24 ${isFav(favId)?'on':''}" id="favBtn" data-fav="${favId}" aria-pressed="${isFav(favId)}">
      ${svgIcon('star')} <span>${isFav(favId)?'Nos favoritos':'Salvar linha'}</span>
    </button>
  </section>

  <section class="section wrap">
    <div class="grid grid-2" style="align-items:start;">
      <div class="card reveal">
        <h2 class="card-title">Horários</h2>
        ${Object.entries(l.dias).map(([k,horas])=>`
          <div style="margin-bottom:18px;">
            <div class="eyebrow" style="margin-bottom:10px;">${DIA_LABEL[k] || k}</div>
            <div class="time-chips">
              ${horas.length ? horas.map(h=>`<span class="time-chip">${h}</span>`).join("") : `<p>Não há operação neste dia.</p>`}
            </div>
          </div>
        `).join("")}
        <h2 class="card-title mt-32">Veículo</h2>
        ${l.veiculo ? `
          <div class="line-meta" style="gap:16px 26px;">
            ${l.veiculo.tipo ? `<span>${svgIcon('bus')} Tipo: ${l.veiculo.tipo}</span>` : ""}
            <span>${svgIcon('tag')} Capacidade: ${l.veiculo.capacidade} passageiros</span>
            <span>${svgIcon('calendar')} Acessibilidade: ${l.veiculo.acessibilidade?'Sim':'Não'}</span>
            <span>${svgIcon('clock')} Ar-condicionado: ${l.veiculo.arCondicionado?'Sim':'Não'}</span>
          </div>
        ` : `<p>Informação não disponível.</p>`}
        <p class="mt-24">Operado por ${empresaById(l.empresa)?.nome || "Informação não disponível"}.</p>
      </div>

      <div class="card reveal">
        <h2 class="card-title">Itinerário</h2>
        ${itinerarioHtml(l, true)}
        <h2 class="card-title mt-32">Mapa</h2>
        ${linhaMapSection(l)}
      </div>
    </div>

    <div class="update-note">
      <span>Informações atualizadas em ${DATA.cidade.atualizadoEm}.</span>
      <button id="reportBtn">Encontrou uma informação incorreta? Informar problema</button>
    </div>
  </section>`;
}

/* ---------- Horários ---------- */
function viewHorarios(){
  const dias = ["Hoje","Amanhã","Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
  return `
  <section class="section wrap" style="padding-top:36px;">
    <span class="eyebrow">Consulta</span>
    <h1 style="margin-bottom:20px;">Dias e horários</h1>
    <div class="chip-row reveal" id="dayChips" role="group" aria-label="Escolha o dia">
      ${dias.map((d,i)=>`<button class="chip ${i===0?'active':''}" data-day="${d}" aria-pressed="${i===0}">${d}</button>`).join("")}
    </div>
    <div id="horariosResult" class="mt-24" aria-live="polite"></div>
  </section>`;
}

function renderHorariosResult(day){
  // número do dia da semana (0=domingo ... 6=sábado) do chip escolhido
  const hojeNum = new Date().getDay();
  const numDia = { "Hoje":hojeNum, "Amanhã":(hojeNum+1)%7, "Domingo":0, "Segunda":1, "Terça":2, "Quarta":3, "Quinta":4, "Sexta":5, "Sábado":6 }[day];
  const chaves = DIA_CHAVES[numDia] || [];
  const ehHoje = numDia === hojeNum && day !== "Amanhã";
  const all = DATA.linhas
    .flatMap(l => chaves.flatMap(k => (l.dias[k] || []).map(h=>({hora:h,linha:l}))))
    .sort((a,b)=>a.hora.localeCompare(b.hora));
  const el = $("#horariosResult");
  if(!el) return;
  el.innerHTML = all.length ? `
    <div class="board">
      <div class="board-head"><h3>Transporte — ${day}</h3></div>
      <div class="board-list">
        ${all.map(item=>`
          <div class="flap-row">
            <div class="flap-time">${item.hora}</div>
            <div class="flap-route"><span class="line-tag">LINHA ${item.linha.numero}</span><span class="dest">${item.linha.origem} → ${item.linha.destino}</span></div>
            <div class="flap-eta">${ehHoje ? (minutosAte(item.hora) < 0 ? "Já saiu" : etaLabel(item.hora)) : ''}</div>
          </div>`).join("")}
      </div>
    </div>
  ` : `<div class="empty-state">${svgIcon('empty')}<h3>Não há transporte disponível nesta data.</h3></div>`;
}

/* ---------- Tarifas ---------- */
function viewTarifas(){
  return `
  <section class="section wrap" style="padding-top:36px;">
    <span class="eyebrow">Valores</span>
    <h1 style="margin-bottom:22px;">Tarifas</h1>
    <table class="fare-table reveal">
      <caption class="sr-only">Valor da passagem por linha</caption>
      <thead><tr><th scope="col">Trajeto</th><th scope="col" style="text-align:right;">Valor</th></tr></thead>
      <tbody>
        ${DATA.linhas.map(l=>`<tr><td>${l.origem} → ${l.destino} <span style="color:var(--text-faint); font-family:var(--font-mono); font-size:.72rem;">· Linha ${l.numero}</span></td><td class="val">${fmtMoeda(l.valor)}</td></tr>`).join("")}
      </tbody>
    </table>
    <div class="card reveal mt-24">
      <h2 class="card-title">Categorias especiais</h2>
      ${(DATA.tarifaCategorias||[]).length ? `
        <div class="grid" style="gap:10px;">
          ${DATA.tarifaCategorias.map(c=>`
            <div class="fare-cat-row">
              <div class="fare-cat-info"><strong>${c.nome}</strong><p style="margin-top:2px;">${c.desc}</p></div>
              <span class="fare-cat-val">${c.val}</span>
            </div>`).join("")}
        </div>
      ` : `<p>Informação não disponível.</p>`}
    </div>
    <div class="card reveal mt-24">
      <h2 class="card-title">Formas de pagamento</h2>
      ${(DATA.formasPagamento||[]).length ? `
        <div class="time-chips">${DATA.formasPagamento.map(f=>`<span class="time-chip">${f}</span>`).join("")}</div>
      ` : `<p>Informação não disponível.</p>`}
    </div>
    <div class="update-note"><span>Informações atualizadas em ${DATA.cidade.atualizadoEm}.</span></div>
  </section>`;
}

/* ---------- Avisos ---------- */
function viewAvisos(){
  return `
  <section class="section wrap" style="padding-top:36px;">
    <span class="eyebrow">Comunicados</span>
    <h1 style="margin-bottom:22px;">Avisos</h1>
    <div class="grid" style="gap:14px;">
      ${DATA.avisos.map(alertCard).join("")}
    </div>
  </section>`;
}

/* ---------- Propostas ---------- */
function viewPropostas(){
  return `
  <section class="section wrap" style="padding-top:36px;">
    <span class="eyebrow">Em avaliação</span>
    <h1 style="margin-bottom:10px;">Propostas de linhas</h1>
    <p class="lede" style="max-width:60ch; margin-bottom:22px;">Estas rotas ainda não estão em operação — são possibilidades em estudo. Elas não substituem as linhas atuais e podem mudar ou não sair do papel.</p>
    <div class="grid grid-2">
      ${DATA.propostas.map(propostaCard).join("") || `<div class="empty-state">${svgIcon('empty')}<h3>Nenhuma proposta cadastrada no momento.</h3></div>`}
    </div>
  </section>`;
}

/* ---------- Visitante ---------- */
function viewVisitante(){
  return `
  <section class="section wrap" style="padding-top:36px;">
    <span class="eyebrow">Para visitantes</span>
    <h1 style="margin-bottom:14px;">Não conhece a cidade?</h1>
    <p class="lede mt-24" style="margin-bottom:26px;">Encontre facilmente como chegar aos principais locais de Imaruí utilizando o transporte disponível.</p>
    <div class="grid grid-3">
      ${DATA.destinosVisitante.map(d=>`
        <button class="card reveal" style="text-align:left; cursor:pointer;" data-visit="${d.cat}">
          <div style="font-size:1.8rem; margin-bottom:10px;" aria-hidden="true">${d.icon}</div>
          <h3 class="mb-0">${d.cat}</h3>
          <div class="card-cta mt-24">Como chegar? ${svgIcon('arrow')}</div>
        </button>
      `).join("")}
    </div>
    <div id="visitResult" class="mt-32" aria-live="polite"></div>
  </section>`;
}

/* ---------- Favoritos ---------- */
function viewFavoritos(){
  const f = favs();
  const linhas = f.filter(x=>x.startsWith("linha:")).map(x=>linhaById(x.split(":")[1])).filter(Boolean);
  return `
  <section class="section wrap" style="padding-top:36px;">
    <span class="eyebrow">Pessoal</span>
    <h1 style="margin-bottom:22px;">Favoritos</h1>
    ${linhas.length ? `<div class="grid grid-3">${linhas.map(lineCard).join("")}</div>` :
    `<div class="empty-state">${svgIcon('star')}<h3>Você ainda não salvou nada.</h3><p>Toque na estrela em qualquer linha para guardá-la aqui.</p></div>`}
  </section>`;
}

/* ---------- Sobre ---------- */
function viewSobre(){
  return `
  <section class="section wrap" style="padding-top:36px; max-width:760px;">
    <span class="eyebrow">O projeto</span>
    <h1 style="margin-bottom:20px;">Sobre o Vai</h1>
    <p class="lede" style="max-width:none; margin-bottom:16px;">O Vai é uma plataforma criada para facilitar o acesso às informações do transporte local de Imaruí, reunindo horários, rotas, pontos e outras informações em um único lugar.</p>
    <p style="margin-bottom:16px;">Não somos uma empresa de transporte — somos uma solução digital de informação e mobilidade, feita para que qualquer pessoa consiga responder rapidamente à pergunta: como eu chego onde preciso ir?</p>
    <p>Trabalhamos para manter horários, rotas e tarifas sempre atualizados, ajudando moradores e visitantes a se deslocarem com mais praticidade pelo transporte de Imaruí e região.</p>
  </section>`;
}

/* ---------- Mobilidade na cidade (antiga "A cidade", rota /cidade) ---------- */
function viewCidade(){
  return `
  <section class="city-hero wrap">
    <span class="eyebrow">Mobilidade na cidade</span>
    <h1>O transporte que <em>conecta Imaruí.</em></h1>
    <p class="lede mt-24" style="max-width:none;">O Vai reúne, em um só lugar, os horários, linhas, pontos e tarifas do transporte de Imaruí — para que qualquer morador ou visitante saiba, em segundos, como chegar aonde precisa.</p>
  </section>

  <section class="section wrap">
    <div class="sec-head">
      <div><span class="eyebrow">Como pensamos a mobilidade</span><h2 style="font-size:1.7rem;">Nossa atuação é guiada por três pilares</h2></div>
    </div>
    <div class="grid grid-3">
      <div class="card pillar-card reveal">
        <div class="pillar-icon" aria-hidden="true">🧭</div>
        <h3 class="mb-0">Informação que aproxima</h3>
        <p>Centralizar horários e rotas para que ninguém precise perguntar a ninguém para se locomover pela cidade.</p>
      </div>
      <div class="card pillar-card reveal">
        <div class="pillar-icon" aria-hidden="true">🤝</div>
        <h3 class="mb-0">Presença no dia a dia</h3>
        <p>Estar junto de quem depende do transporte coletivo todos os dias — para trabalhar, estudar e cuidar da vida.</p>
      </div>
      <div class="card pillar-card reveal">
        <div class="pillar-icon" aria-hidden="true">🌱</div>
        <h3 class="mb-0">Compromisso com o futuro</h3>
        <p>Uma plataforma pronta para crescer junto com a cidade, à medida que novas linhas e dados forem chegando.</p>
      </div>
    </div>
  </section>

  <section class="section wrap">
    <div class="sec-head">
      <div><span class="eyebrow">No mapa</span><h2 style="font-size:1.7rem;">Onde a cidade se move</h2></div>
      <a href="#/linhas" class="btn-secondary">Ver todas as linhas ${svgIcon('arrow')}</a>
    </div>
    ${cidadeMapSection()}
  </section>

  <section class="section wrap">
    <div class="card reveal" style="padding:32px; display:flex; flex-direction:column; gap:16px; align-items:flex-start;">
      <span class="eyebrow">Compromisso com a cidade</span>
      <h2 style="font-size:1.7rem;">Feito para facilitar sua rotina</h2>
      <p class="lede">Reunimos horários, rotas e tarifas em um só lugar para que você chegue mais rápido aonde precisa, com informações sempre atualizadas sobre o transporte de Imaruí.</p>
      <a href="#/sobre" class="btn-secondary">Saiba mais sobre o projeto ${svgIcon('arrow')}</a>
    </div>
  </section>
  `;
}

/* ---------- Mais (menu completo, usado na barra inferior do celular) ---------- */
function viewMais(){
  const secoes = SECOES.filter(s => s.id !== "inicio");
  return `
  <section class="section wrap" style="padding-top:36px;">
    <h1 style="margin-bottom:22px;">Mais</h1>
    <div style="max-width:420px; display:flex; flex-direction:column; gap:26px;">
      ${secoes.map(s=>`
        <div>
          <h2 class="hub-title" style="margin-top:0;">${s.label}</h2>
          <div class="grid" style="gap:12px;">
            ${PAGINAS.filter(p => p.secao===s.id && p.menu !== false).map(p=>`
              <a href="#${p.rota}" class="card" style="display:flex; align-items:center; justify-content:space-between;">
                <span style="font-weight:700;">${p.titulo}</span>${svgIcon('arrow')}
              </a>`).join("")}
          </div>
        </div>`).join("")}
    </div>
  </section>`;
}

function viewNaoEncontrada(){
  return `<div class="wrap section"><div class="empty-state">${svgIcon('empty')}<h3>Página não encontrada.</h3><a href="#/" class="btn-secondary mt-24">Voltar ao início</a></div></div>`;
}
