(function(){
'use strict';
if(window.__bxCentralPoliceNewsV1)return;window.__bxCentralPoliceNewsV1=true;

const DEAD=new Set(['tudo','jurisprudencia','lei seca','concursos','mentoria','avisos']);
const TAGS=new Set(['NOVO','EDITAL','AUTORIZADO','BANCA','INSCRIÇÕES','CONVOCAÇÃO','NOMEAÇÃO','RETIFICAÇÃO','CRONOGRAMA','RESULTADO','GABARITO','TAF','COMUNICADO']);
let rendering=false,timer=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const boot=()=>window.BX&&BX.boot||{};
const currentCompetition=()=>boot().context&&boot().context.competition||null;

function validSource(n){
  const raw=n&&String(n.source_url||n.link_url||'').trim();
  if(!raw||n.official_verified!==true)return null;
  try{const u=new URL(raw,location.origin);if(u.protocol!=='https:')return null;return u.href}catch{return null}
}
function when(n){const raw=n.source_published_at||n.published_at||n.created_at;if(!raw)return 0;const t=new Date(raw).getTime();return Number.isFinite(t)?t:0}
function fmtDate(n){const t=when(n);return t?new Date(t).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}):'Data não informada'}
function sourceName(n){return String(n.source_name||'Fonte oficial').replace(/\s*•\s*fonte oficial\s*$/i,'').trim()||'Fonte oficial'}
function orgLabel(n){
  const comp=currentCompetition(),slug=String(comp&&comp.slug||'').toLowerCase();
  if(n.competition_id&&comp&&n.competition_id===comp.id){
    if(slug.includes('pmesp'))return'PM SP — Soldado';
    if(slug.includes('gcm'))return'GCM Geral';
    return comp.name||sourceName(n);
  }
  const s=sourceName(n);
  if(/pm\s*sp|pol[ií]cia militar de s[aã]o paulo/i.test(s))return /soldado/i.test(n.title||'')?'PM SP — Soldado':s;
  if(/gcm|guarda civil/i.test(s))return'GCM Geral';
  return s;
}
function inferTag(n){
  const c=String(n.category||'').toUpperCase().trim();if(TAGS.has(c))return c;
  const t=norm(`${n.title||''} ${n.body||''}`);
  if(/convoc/.test(t))return'CONVOCAÇÃO';
  if(/nomea/.test(t))return'NOMEAÇÃO';
  if(/retifica/.test(t))return'RETIFICAÇÃO';
  if(/inscri/.test(t))return'INSCRIÇÕES';
  if(/autoriza/.test(t))return'AUTORIZADO';
  if(/banca/.test(t))return'BANCA';
  if(/gabarito/.test(t))return'GABARITO';
  if(/taf|teste de aptidao fisica/.test(t))return'TAF';
  if(/resultado/.test(t))return'RESULTADO';
  if(/cronograma|calendario/.test(t))return'CRONOGRAMA';
  if(/edital/.test(t))return'EDITAL';
  return'COMUNICADO';
}
function isNew(n){const t=when(n);return !!t&&Date.now()-t<=7*86400000}
function score(n){
  const comp=currentCompetition();let s=when(n)/1e10;
  if(comp&&n.competition_id===comp.id)s+=10000;
  const text=norm(`${n.title||''} ${n.body||''} ${n.source_name||''}`);
  if(/pm sp|pmesp|aluno soldado/.test(text))s+=comp&&String(comp.slug||'').includes('pmesp')?6000:900;
  if(/gcm|guarda civil/.test(text))s+=comp&&String(comp.slug||'').includes('gcm')?6000:900;
  if(n.relevance==='crítica'||n.relevance==='critica')s+=900;
  else if(n.relevance==='alta')s+=650;else if(n.relevance==='media')s+=300;
  if(isNew(n))s+=450;
  return s;
}
function shortBody(v){const s=String(v||'').replace(/\s+/g,' ').trim();return s.length<=300?s:s.slice(0,297).replace(/\s+\S*$/,'')+'…'}
function relevantToStudent(n){
  const comp=currentCompetition();if(!comp)return false;if(n.competition_id===comp.id)return true;
  const slug=String(comp.slug||''),t=norm(`${n.title||''} ${n.body||''} ${n.source_name||''}`);
  if(slug.includes('pmesp'))return /pm sp|pmesp|aluno soldado/.test(t);
  if(slug.includes('gcm'))return /gcm|guarda civil/.test(t);
  return false;
}
function removeBroken(root){
  const filters=root.querySelector('#newsFilters');if(filters)filters.remove();
  root.querySelectorAll('a,button').forEach(node=>{
    if(!DEAD.has(norm(node.textContent)))return;
    const p=node.parentElement;
    if(p&&p!==root&&p.children.length===1&&(/filter|chip|tabs|atalho|link/i.test(p.className)||p.id==='newsFilters'))p.remove();else node.remove();
  });
  root.querySelectorAll(':scope > div,:scope > section').forEach(el=>{if(!el.textContent.trim()&&!el.children.length)el.remove()});
}
function newsList(){
  const seen=new Set(),all=(boot().news||[]).filter(n=>validSource(n));
  all.sort((a,b)=>score(b)-score(a));
  const out=[];
  for(const n of all){
    const key=norm(n.title).replace(/\b(202[0-9]|19[0-9]{2})\b/g,'').slice(0,180);
    if(!key||seen.has(key))continue;seen.add(key);out.push(n);if(out.length>=12)break;
  }
  return out;
}
function style(){if(document.getElementById('bxPoliceNewsCSS'))return;const s=document.createElement('style');s.id='bxPoliceNewsCSS';s.textContent=`
#central-bizu .bx-pn-shell{margin-top:18px}.bx-pn-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:20px;border:1px solid rgba(77,141,255,.34);border-radius:18px;background:radial-gradient(circle at 95% 0,rgba(52,211,153,.12),transparent 38%),linear-gradient(145deg,rgba(52,120,246,.12),rgba(7,18,36,.96))}.bx-pn-head h2{margin:4px 0 6px;font-size:24px}.bx-pn-head p{margin:0;color:var(--mut);max-width:760px}.bx-pn-live{white-space:nowrap;font-size:10px;font-weight:900;padding:7px 10px;border-radius:99px;border:1px solid rgba(52,211,153,.3);background:rgba(52,211,153,.08);color:#86efac}.bx-pn-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}.bx-pn-card{display:flex;flex-direction:column;min-height:250px;padding:17px;border:1px solid rgba(92,137,202,.25);border-radius:16px;background:linear-gradient(145deg,#09162a,#071221);box-shadow:0 12px 28px rgba(0,0,0,.12)}.bx-pn-card.priority{border-color:rgba(77,141,255,.52);box-shadow:0 15px 36px rgba(41,104,207,.12)}.bx-pn-top{display:flex;justify-content:space-between;gap:8px;align-items:center}.bx-pn-tags{display:flex;gap:5px;flex-wrap:wrap}.bx-pn-tag{font-size:9px;font-weight:1000;letter-spacing:.5px;padding:5px 7px;border-radius:99px;border:1px solid rgba(77,141,255,.28);background:rgba(77,141,255,.09);color:#a9ccff}.bx-pn-tag.new{border-color:rgba(52,211,153,.32);background:rgba(52,211,153,.08);color:#86efac}.bx-pn-date{font-size:10px;color:var(--mut);white-space:nowrap}.bx-pn-org{display:block;margin-top:12px;color:#8dbaff;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.7px}.bx-pn-card h3{font-size:17px;line-height:1.35;margin:6px 0 8px}.bx-pn-card p{color:#c4d1e5;line-height:1.55;margin:0 0 10px}.bx-pn-source{margin-top:auto;padding-top:9px;border-top:1px solid rgba(92,137,202,.18);font-size:10px;color:var(--mut)}.bx-pn-impact{margin:9px 0;padding:9px 10px;border-left:3px solid #4d8dff;background:rgba(77,141,255,.06);font-size:11px;color:#cfe1ff}.bx-pn-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.bx-pn-actions .btn{font-size:11px;padding:9px 11px;text-decoration:none}.bx-pn-empty{padding:30px;text-align:center;border:1px dashed rgba(92,137,202,.3);border-radius:15px;background:#071221;color:var(--mut);margin-top:12px}.bx-pn-note{margin-top:10px;font-size:10px;color:var(--mut);text-align:right}
@media(max-width:820px){.bx-pn-grid{grid-template-columns:1fr}.bx-pn-head{flex-direction:column}.bx-pn-live{white-space:normal}.bx-pn-card{min-height:0}}@media(max-width:480px){.bx-pn-head{padding:15px}.bx-pn-head h2{font-size:20px}.bx-pn-card{padding:14px}.bx-pn-top{align-items:flex-start;flex-direction:column}.bx-pn-actions .btn{width:100%;text-align:center}}
`;document.head.appendChild(s)}
function go(page){if(typeof window.jump==='function'){try{window.jump(page);return}catch{}}const b=document.querySelector(`[data-p="${CSS.escape(page)}"]`);if(b)b.click()}
function card(n){
  const url=validSource(n),tag=inferTag(n),fresh=isNew(n),priority=relevantToStudent(n),source=sourceName(n);
  return `<article class="bx-pn-card ${priority?'priority':''}"><div class="bx-pn-top"><div class="bx-pn-tags">${fresh?'<span class="bx-pn-tag new">NOVO</span>':''}<span class="bx-pn-tag">${esc(tag)}</span>${priority?'<span class="bx-pn-tag">SEU CONCURSO</span>':''}</div><time class="bx-pn-date">${esc(fmtDate(n))}</time></div><span class="bx-pn-org">${esc(orgLabel(n))}</span><h3>${esc(n.title)}</h3><p>${esc(shortBody(n.body))}</p>${priority?'<div class="bx-pn-impact"><b>Impacto no seu planejamento:</b> confira a atualização e, se necessário, ajuste o Cronograma Inteligente e a Central Tática.</div>':''}<div class="bx-pn-source"><b>Fonte:</b> ${esc(source)}${n.ai_generated?' • resumo factual auxiliado por IA':''}</div><div class="bx-pn-actions"><a class="btn primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow">Ler notícia ↗</a>${priority?'<button class="btn" data-bx-pn-go="cronograma">Abrir Cronograma</button><button class="btn" data-bx-pn-go="tatica">Central Tática</button>':''}</div></article>`;
}
function render(){
  const root=document.getElementById('central-bizu');if(!root||rendering)return;rendering=true;try{
    style();removeBroken(root);
    let grid=document.getElementById('newsGrid');if(!grid){grid=document.createElement('div');grid.id='newsGrid';root.appendChild(grid)}
    let shell=root.querySelector('.bx-pn-shell');if(!shell){shell=document.createElement('div');shell.className='bx-pn-shell';grid.insertAdjacentElement('beforebegin',shell)}
    const list=newsList();
    shell.innerHTML=`<div class="bx-pn-head"><div><span class="ey">CENTRAL BIZU • FONTES VERIFICADAS</span><h2>📰 NOTÍCIAS DOS CONCURSOS POLICIAIS</h2><p>Atualizações relevantes de concursos da segurança pública, com prioridade automática para o concurso que você acompanha.</p></div><span class="bx-pn-live">● atualização automática a cada 6 horas</span></div>`;
    grid.className='bx-pn-grid';grid.innerHTML=list.length?list.map(card).join(''):'<div class="bx-pn-empty">Nenhuma novidade relevante encontrada no momento.</div>';
    let note=root.querySelector('.bx-pn-note');if(!note){note=document.createElement('div');note.className='bx-pn-note';grid.insertAdjacentElement('afterend',note)}
    note.textContent='Somente notícias com fonte original em HTTPS e verificação factual são exibidas.';
    root.querySelectorAll('[data-bx-pn-go]').forEach(b=>b.onclick=()=>go(b.dataset.bxPnGo));
    root.dataset.bxPoliceNews='1';
  }finally{rendering=false}
}
function needsRepair(root){return !!root&&(!!root.querySelector('#newsFilters')||!root.querySelector('.bx-pn-shell')||Array.from(root.querySelectorAll('a,button')).some(x=>DEAD.has(norm(x.textContent))))}
function schedule(){clearTimeout(timer);timer=setTimeout(render,60)}
function install(){
  const root=document.getElementById('central-bizu');if(!root)return false;render();
  if(!root.__bxPoliceObserver){root.__bxPoliceObserver=true;const mo=new MutationObserver(()=>{if(!rendering&&needsRepair(root))schedule()});mo.observe(root,{childList:true,subtree:true})}
  return true;
}
document.addEventListener('click',ev=>{if(ev.target&&ev.target.closest&&ev.target.closest('[data-p="central-bizu"]'))setTimeout(()=>{install();render()},50)},true);
const originalReload=window.reload;if(typeof originalReload==='function'&&!originalReload.__bxPoliceWrapped){const wrapped=async function(...args){const result=await originalReload.apply(this,args);setTimeout(()=>{install();render()},30);return result};wrapped.__bxPoliceWrapped=true;window.reload=wrapped}
let tries=0,constTimer=setInterval(()=>{tries++;if(install()||tries>60)clearInterval(constTimer)},250);
})();
