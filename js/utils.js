/* ============================================================================================
   TUDO O QUE É EDITÁVEL (preços, horários, linhas, pontos, empresas, avisos, mapa, etc.)
   FICA NO ARQUIVO data.json — NÃO fica nos arquivos de código.

   ➜ Para atualizar tarifas, horários, avisos, pontos ou o link do mapa: abra "data.json"
     e edite os valores lá.
   ➜ O mapa geral fica em data.json → cidade → "mapaEmbedUrl". Para trocar o mapa:
     Google My Maps > Compartilhar > Incorporar no meu site > copie só a URL do src="..."
     e cole substituindo o valor de "mapaEmbedUrl" (deixe "" para usar o mapa ilustrativo).
   ============================================================================================ */

/* ============================================================
   1. DADOS — carregados a partir de data.json
   ============================================================ */
let DATA = null;
const DIA_LABEL = { seg_sex:"Segunda a sexta", sabado:"Sábado", domingo:"Domingo", seg_qui:"Segunda e quinta" };
const DIA_CURTO = { seg_sex:"Seg a sex", seg_qui:"Seg e qui", sabado:"Sábado", domingo:"Domingo" };

function diasResumoLabel(l){
  const chaves = Object.keys(l.dias).filter(k => (l.dias[k]||[]).length);
  if(!chaves.length) return "Consulte horários";
  if(chaves.length === 1) return DIA_LABEL[chaves[0]] || "Consulte horários";
  if(chaves.includes("seg_sex") && chaves.includes("sabado") && chaves.includes("domingo")) return "Todos os dias";
  return chaves.map(k => DIA_LABEL[k] || k).join(" e ");
}

async function loadData(){
  const res = await fetch("./data.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Falha ao carregar data.json");
  DATA = await res.json();
}

function empresaById(id){ return (DATA.empresas||[]).find(e=>e.id===id) || null; }

/* ============================================================
   2. UTILITÁRIOS
   ============================================================ */
const $ = (sel,ctx=document)=>ctx.querySelector(sel);
const $$ = (sel,ctx=document)=>[...ctx.querySelectorAll(sel)];
const app = $("#app");

function linhaById(id){ return DATA.linhas.find(l=>l.id===id); }
function pontoById(id){ return DATA.pontos.find(p=>p.id===id); }
function fmtMoeda(v){ return v==null ? "Informação não disponível" : "R$ " + v.toFixed(2).replace(".",","); }

// Escapa texto vindo do usuário (ex.: campos de busca na URL) antes de inserir em HTML.
function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
// Minúsculas e sem acento, para buscas ("Imarui" encontra "Imaruí").
function normalizar(s){
  return String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
}

// Quais chaves de "dias" (data.json) valem para cada dia da semana (0=domingo ... 6=sábado)
const DIA_CHAVES = {
  0:["domingo"],
  1:["seg_sex","seg_qui"],
  2:["seg_sex"],
  3:["seg_sex"],
  4:["seg_sex","seg_qui"],
  5:["seg_sex"],
  6:["sabado"]
};
function todosHorariosHoje(){
  const chaves = DIA_CHAVES[new Date().getDay()] || [];
  return DATA.linhas.flatMap(l =>
    chaves.flatMap(k => (l.dias[k] || []).map(h => ({hora:h, linha:l})))
  );
}
function minutosAte(hora){
  const now = new Date();
  const [h,m] = hora.split(":").map(Number);
  const target = new Date(now); target.setHours(h,m,0,0);
  return Math.round((target - now)/60000);
}
function etaLabel(hora){
  const diff = minutosAte(hora);
  if(diff < 0) return "Horário do dia";
  if(diff === 0) return "Saindo agora";
  if(diff < 60) return `Sai em ${diff} min`;
  return "Hoje";
}

/* --- horários de uma linha (considera todos os grupos de dias: seg_sex, seg_qui, sabado, domingo) --- */
function diasComHorario(l){ return Object.keys(l.dias).filter(k => (l.dias[k]||[]).length); }
function diasResumoCurto(l){
  const ch = diasComHorario(l);
  if(!ch.length) return "Sem horários cadastrados";
  return ch.map(k => DIA_CURTO[k] || k).join(" e ");
}
function horariosDeHoje(l){
  const ch = DIA_CHAVES[new Date().getDay()] || [];
  return ch.flatMap(k => l.dias[k] || []).sort();
}
function proximaSaidaHoje(l){ return horariosDeHoje(l).find(h => minutosAte(h) >= 0) || null; }
// Horários a exibir no cartão: os de hoje, se houver; senão os do primeiro grupo de dias com operação.
function horariosParaCartao(l){
  const hoje = horariosDeHoje(l);
  if(hoje.length) return hoje;
  const k = diasComHorario(l)[0];
  return k ? l.dias[k] : [];
}
function statusHojeLabel(l){
  const hoje = horariosDeHoje(l);
  if(!hoje.length) return diasComHorario(l).length ? "Não opera hoje" : "";
  const prox = proximaSaidaHoje(l);
  return prox ? etaLabel(prox) : "Sem mais saídas hoje";
}

function svgIcon(name){
  const icons = {
    pinFrom:'<svg class="ico from" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/></svg>',
    pinTo:'<svg class="ico to" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.3"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    tag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 12l-8 8-9-9V3h8l9 9z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
    star:'<svg viewBox="0 0 24 24" stroke-width="2" aria-hidden="true"><path d="M12 2l3.1 6.6 7.2.9-5.3 5 1.4 7.2L12 18l-6.4 3.7L7 14.5l-5.3-5 7.2-.9L12 2z"/></svg>',
    empty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 15s1.5-2 3-2 3 2 3 2M9 9h.01M15 9h.01"/></svg>',
    loc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.3"/></svg>',
    bus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M3 12h18M7 17v2M17 17v2"/><circle cx="7.5" cy="19" r="1.2" fill="currentColor" stroke="none"/><circle cx="16.5" cy="19" r="1.2" fill="currentColor" stroke="none"/></svg>'
  };
  return icons[name] || "";
}

function favs(){ try{ return JSON.parse(localStorage.getItem("vai_favoritos")||"[]"); }catch(e){ return []; } }
function setFavs(arr){ try{ localStorage.setItem("vai_favoritos", JSON.stringify(arr)); }catch(e){} }
function toggleFav(id){
  let f = favs();
  if(f.includes(id)) f = f.filter(x=>x!==id); else f.push(id);
  setFavs(f);
}
function isFav(id){ return favs().includes(id); }

function initReveal(){
  const els = $$(".reveal");
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  },{threshold:.12});
  els.forEach(el=>io.observe(el));
}
