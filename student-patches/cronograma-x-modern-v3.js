(function(){
'use strict';
if(window.__bxCronogramaXModernV3)return;window.__bxCronogramaXModernV3=true;
let lastData=null,applying=false,timer=0;
const originalFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const res=await originalFetch(input,init);
  try{
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(String(url).includes('/api/study-planner')){
      res.clone().json().then(d=>{if(d&&d.ok){lastData=d;window.__bxCronogramaXLastData=d;scheduleApply(20)}}).catch(()=>{});
    }
  }catch{}
  return res;
};
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isoToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const addDays=(s,n)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
function style(){if($('bxCronXModernV3CSS'))return;const s=document.createElement('style');s.id='bxCronXModernV3CSS';s.textContent=`
#cronograma[data-bx-cron-x-v3="1"]{--x3b:rgba(89,145,244,.28);--x3g:#34d399;--x3y:#fbbf24;--x3r:#fb7185;--x3c:#93c5fd}
#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-hero{border-radius:22px;padding:24px;background:radial-gradient(circle at 95% 0,rgba(52,211,153,.13),transparent 34%),radial-gradient(circle at 0 0,rgba(77,141,255,.18),transparent 40%),#071322}
#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-hero h1{font-size:clamp(28px,4vw,38px);letter-spacing:-.7px}
.bx-x3-mode{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid rgba(52,211,153,.3);border-radius:999px;background:rgba(52,211,153,.07);color:#a7f3d0;font-size:11px;font-weight:900;white-space:nowrap}
.bx-x3-mode.internal{border-color:rgba(77,141,255,.3);background:rgba(77,141,255,.08);color:#bfdbfe}
#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-config{padding:19px;border-radius:18px;background:linear-gradient(145deg,#081527,#071220);box-shadow:0 12px 36px rgba(0,0,0,.14)}
#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-config:before{content:'CONFIGURE SEU CRONOGRAMA X';display:block;font-size:11px;letter-spacing:.9px;font-weight:900;color:#91b9f6;margin-bottom:13px}
#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-config-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-config-grid>label{display:block;padding:12px;border:1px solid var(--x3b);border-radius:13px;background:rgba(5,15,29,.55);font-weight:800;color:#c7d7ed}
#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-config-grid select{width:100%;margin-top:8px}
#cronograma[data-bx-cron-x-v3="1"] #bxCv2Days,#cronograma[data-bx-cron-x-v3="1"] #bxCv2Days+*{display:none!important}
#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-config>div>small.mut{display:none}
.bx-x3-explain{margin-top:12px;padding:11px 13px;border-left:3px solid #4d8dff;background:rgba(77,141,255,.06);border-radius:0 10px 10px 0;color:#aebed4;font-size:11px;line-height:1.5}
#cronograma[data-bx-cron-x-v3="1"] #bxCv2Generate{background:linear-gradient(135deg,#3478f6,#4d8dff);border-color:#5c9aff;font-weight:950;padding:11px 16px}
#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-tab{text-align:center;font-size:11px;letter-spacing:.25px;padding:11px 8px}
.bx-x3-dashboard{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:13px 0}
.bx-x3-card{min-height:92px;padding:12px;border:1px solid var(--x3b);border-radius:14px;background:linear-gradient(145deg,#081528,#07111f)}
.bx-x3-card small{display:block;font-size:9px;font-weight:900;color:#91a7c5;line-height:1.3}.bx-x3-card b{display:block;font-size:20px;margin-top:6px;color:#f4f8ff}.bx-x3-card span{display:block;font-size:9px;color:#8297b5;margin-top:3px}
.bx-x3-progress{height:6px;background:#04101f;border-radius:99px;overflow:hidden;margin-top:8px}.bx-x3-progress i{display:block;height:100%;background:linear-gradient(90deg,#3478f6,#34d399)}
#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-task{border-left:3px solid transparent;transition:border-color .15s,background .15s}
#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-task:has(.muito-alta){border-left-color:#fb7185}#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-task:has(.alta){border-left-color:#fbbf24}
#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-task h4{font-size:16px}#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-resource{padding:8px 10px}
#cronograma[data-bx-cron-x-v3="1"] .bx-tv2-study-now{background:linear-gradient(135deg,#34d399,#10b981)!important;color:#03281c!important;border-color:#51e3b4!important;font-weight:950!important}
.bx-x3-empty-note{font-size:10px;color:#8ca0bd}
@media(max-width:1050px){#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-config-grid{grid-template-columns:1fr 1fr}.bx-x3-dashboard{grid-template-columns:repeat(3,1fr)}}
@media(max-width:680px){#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-config-grid{grid-template-columns:1fr}.bx-x3-dashboard{grid-template-columns:1fr 1fr}#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-tabs{grid-template-columns:1fr 1fr}#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-hero{padding:18px}}
@media(max-width:430px){.bx-x3-dashboard{grid-template-columns:1fr}#cronograma[data-bx-cron-x-v3="1"] .bx-cv2-tabs{grid-template-columns:1fr 1fr}.bx-x3-card{min-height:76px}}
`;document.head.appendChild(s)}
function normalizeText(root){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(/IA indisponível/i.test(n.nodeValue||''))n.nodeValue=(n.nodeValue||'').replace(/IA indisponível/gi,'Modo inteligente interno')}}
function courseLabel(cid){const comp=$('bxCv2Competition');const opt=comp&&comp.options[comp.selectedIndex];const txt=String(opt?.textContent||'').toLowerCase();return txt.includes('gcm')?'GCM Geral':'PMESP Aluno-Soldado 2026'}
function setSelectLabels(){const comp=$('bxCv2Competition'),course=$('bxCv2Course');if(comp){[...comp.options].forEach(o=>{const t=String(o.textContent||'').toLowerCase();o.textContent=t.includes('gcm')?'GCM':'PM SP'})}if(course){[...course.options].forEach(o=>o.textContent=courseLabel(o.value))}}
function checkedDays(){return[...document.querySelectorAll('[name="bxCv2Day"]:checked')].map(x=>Number(x.value))}
function setDays(n){n=Math.max(5,Math.min(7,Number(n)||5));const boxes=[...document.querySelectorAll('[name="bxCv2Day"]')];boxes.forEach((b,i)=>{b.checked=i<n});}
function enhanceConfig(root){const grid=root.querySelector('.bx-cv2-config-grid'),config=root.querySelector('.bx-cv2-config');if(!grid||!config)return;const labels=[...grid.children].filter(x=>x.tagName==='LABEL');if(labels[0]&&!labels[0].dataset.x3)labels[0].childNodes[0].nodeValue='1️⃣ Concurso';if(labels[1]&&!labels[1].dataset.x3)labels[1].childNodes[0].nodeValue='2️⃣ Turma';if(labels[2]&&!labels[2].dataset.x3)labels[2].childNodes[0].nodeValue='3️⃣ Horas disponíveis por dia';labels.forEach(x=>x.dataset.x3='1');let d=$('bxCv3DaysPerWeek');if(!d){const lab=document.createElement('label');lab.dataset.x3='1';lab.innerHTML='4️⃣ Dias disponíveis por semana<select id="bxCv3DaysPerWeek"><option value="5">5 dias</option><option value="6">6 dias</option><option value="7">7 dias</option></select>';grid.appendChild(lab);d=$('bxCv3DaysPerWeek');const cur=Math.max(5,Math.min(7,checkedDays().length||5));d.value=String(cur);d.onchange=()=>setDays(d.value)}
setSelectLabels();const gen=$('bxCv2Generate');if(gen)gen.textContent='⚡ GERAR CRONOGRAMA X';const rec=$('bxCv2Recalc');if(rec)rec.textContent='↻ Recalcular prioridades';if(!config.querySelector('.bx-x3-explain')){const p=document.createElement('div');p.className='bx-x3-explain';p.innerHTML='<b>Como funciona:</b> O Cronograma X cruza o edital, histórico de cobrança, matérias, assuntos, desempenho, questões erradas, revisões, Flashcards e histórico de estudos para definir suas prioridades.';config.appendChild(p)}}
function enhanceHero(root){const hero=root.querySelector('.bx-cv2-hero');if(!hero)return;const h=hero.querySelector('h1');if(h)h.textContent='Cronograma X';const p=hero.querySelector('.bx-cv2-hero-top p');if(p)p.innerHTML='Escolha seu concurso, turma e disponibilidade. O sistema mostra <b>o que estudar hoje</b>, qual assunto é prioridade e qual recurso abrir agora.';const pill=hero.querySelector('.bx-cv2-hero-top .pill');if(pill){const raw=String(lastData?.planner_mode||pill.textContent||'');const internal=/modo inteligente interno/i.test(raw);pill.className='bx-x3-mode'+(internal?' internal':'');pill.textContent=internal?'⚙️ Modo inteligente interno':(/IA ativa/i.test(raw)?'🧠 '+raw:'🧠 IA + algoritmo interno')}
const ai=hero.querySelector('.bx-cv2-ai b');if(ai){const internal=/modo inteligente interno/i.test(String(lastData?.planner_mode||''));ai.textContent=internal?'⚙️ Análise estratégica':'🧠 Personalização por IA'}}
function tabs(root){const m={hoje:'📅 HOJE',semana:'📆 SEMANA',quinzena:'🗓️ QUINZENA',mes:'📅 MÊS'};root.querySelectorAll('[data-cv2-tab]').forEach(b=>{if(m[b.dataset.cv2Tab])b.textContent=m[b.dataset.cv2Tab]})}
function metricData(){const d=lastData||window.__bxCronogramaXLastData||{},ev=Array.isArray(d.events)?d.events:[],today=isoToday(),weekEnd=addDays(today,6),todayEv=ev.filter(x=>x.event_date===today),week=ev.filter(x=>x.event_date>=today&&x.event_date<=weekEnd),todayDone=todayEv.filter(x=>x.status==='completed').length,weekDone=week.filter(x=>x.status==='completed').length,high=todayEv.filter(x=>['Muito alta','Alta'].includes(x.priority_level)).length,reviews=todayEv.filter(x=>String(x.study_type||'').includes('revisao')||String(x.reason||'').toLowerCase().includes('revis')).length;let weak=0;for(const x of ev){const a=Number(x?.metadata?.accuracy);if((Number.isFinite(a)&&a<70)||Number(x?.metadata?.errors||0)>0)weak++}const goal=todayEv.reduce((n,x)=>n+Number(x.duration_minutes||0),0);return{goal,today:todayEv.length,high,reviews,weak,week:week.length,weekDone,todayDone,progress:week.length?Math.round(weekDone*100/week.length):0}}
function dashboard(root){const old=root.querySelector('.bx-x3-dashboard');if(old)old.remove();const conf=root.querySelector('.bx-cv2-config');if(!conf)return;const m=metricData(),d=document.createElement('div');d.className='bx-x3-dashboard';d.innerHTML=`<div class="bx-x3-card"><small>🎯 META DO DIA</small><b>${m.goal||Number($('bxCv2Hours')?.value||0)*60} min</b><span>tempo planejado</span></div><div class="bx-x3-card"><small>📚 O QUE ESTUDAR HOJE</small><b>${m.today}</b><span>tarefas programadas</span></div><div class="bx-x3-card"><small>🔥 PRIORIDADES</small><b>${m.high}</b><span>alta ou muito alta</span></div><div class="bx-x3-card"><small>🔄 REVISÕES</small><b>${m.reviews}</b><span>para consolidar</span></div><div class="bx-x3-card"><small>❌ PONTOS FRACOS</small><b>${m.weak}</b><span>erros ou acerto baixo</span></div><div class="bx-x3-card"><small>📊 SEU PROGRESSO</small><b>${m.progress}%</b><span>${m.weekDone}/${m.week} tarefas na semana</span><div class="bx-x3-progress"><i style="width:${m.progress}%"></i></div></div>`;conf.insertAdjacentElement('afterend',d)}
function taskLabels(root){root.querySelectorAll('.bx-cv2-task').forEach(card=>{const h=card.querySelector('h4');if(h&&!h.dataset.x3){const parts=String(h.textContent||'').split('→');if(parts.length>1){h.innerHTML=`<span style="display:block;font-size:11px;color:#91a7c5;margin-bottom:3px">${esc(parts.shift().trim())}</span>📌 ${esc(parts.join('→').trim())}`}h.dataset.x3='1'}const pri=card.querySelector('.bx-cv2-priority');if(pri&&!/^🔥/.test(pri.textContent||''))pri.textContent='🔥 '+pri.textContent})}
function apply(){const root=$('bxCronV2Root'),sec=$('cronograma');if(!root||!sec||applying)return;applying=true;try{style();sec.dataset.bxCronXV3='1';normalizeText(root);enhanceHero(root);enhanceConfig(root);tabs(root);dashboard(root);taskLabels(root)}finally{setTimeout(()=>applying=false,30)}}
function scheduleApply(ms=80){clearTimeout(timer);timer=setTimeout(apply,ms)}
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-p="cronograma"],[data-cv2-tab],#bxCv2Generate,#bxCv2Recalc'))scheduleApply(100)},true);
function watch(){const sec=$('cronograma');if(!sec)return false;if(!sec.__bxCronXObserver){sec.__bxCronXObserver=true;new MutationObserver(()=>{if(!applying)scheduleApply(80)}).observe(sec,{childList:true,subtree:true})}scheduleApply(20);return true}
let tries=0,iv=setInterval(()=>{tries++;if(watch()||tries>80)clearInterval(iv)},250);
})();