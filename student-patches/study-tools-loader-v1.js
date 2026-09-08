(function(){
'use strict';
if(window.__bxStudyToolsLoaderV1)return;window.__bxStudyToolsLoaderV1=true;
const loaded=new Map();
const SCRIPT={cronograma:'/student-patches/cronograma-inteligente-v2.js?v=20260908perf1',timer:'/student-patches/cronometro-inteligente-v3.js?v=20260908perf1'};
function loadScript(key){
  if(loaded.has(key))return loaded.get(key);
  const p=new Promise((resolve,reject)=>{
    const existing=document.querySelector(`script[data-bx-study-tool="${key}"]`);
    if(existing){if(existing.dataset.loaded==='1')resolve();else{existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true})}return}
    const s=document.createElement('script');s.src=SCRIPT[key];s.defer=true;s.dataset.bxStudyTool=key;
    s.onload=()=>{s.dataset.loaded='1';resolve()};s.onerror=()=>reject(new Error('Falha ao carregar '+key));document.body.appendChild(s);
  });loaded.set(key,p);return p;
}
function showLoading(id,label){const sec=document.getElementById(id);if(sec&&!sec.dataset.bxLoadingShown&&!sec.querySelector('[data-bx-tool-root]')){sec.dataset.bxLoadingShown='1';sec.innerHTML=`<div class="card" data-bx-tool-loader="1" style="padding:22px;text-align:center"><b>${label}</b><p class="mut">Carregando somente o necessário…</p></div>`}}
async function openTool(key){
  if(key==='cronograma')showLoading('cronograma','Abrindo Cronograma Inteligente');
  if(key==='timer')showLoading('timer','Abrindo Cronômetro Inteligente');
  try{await loadScript(key)}catch(e){const sec=document.getElementById(key==='timer'?'timer':'cronograma');if(sec)sec.innerHTML=`<div class="card status-bad"><h3>Não foi possível abrir agora.</h3><p>${String(e&&e.message||e)}</p></div>`}
}
function emitStudyNow(id){if(!id)return;try{sessionStorage.setItem('bxTimerPendingSchedule',id)}catch{};openTool('timer').then(()=>window.dispatchEvent(new CustomEvent('bx:timer:study-now',{detail:{eventId:id}})))}
function addStudyButtons(){
  const root=document.getElementById('cronograma');if(!root)return;
  root.querySelectorAll('.bx-cv2-task[data-event]').forEach(card=>{
    if(card.querySelector('.bx-tv2-study-now'))return;
    const actions=card.querySelector('.bx-cv2-task-actions');if(!actions)return;
    const b=document.createElement('button');b.type='button';b.className='btn primary bx-tv2-study-now';b.textContent='▶ Estudar agora';b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();emitStudyNow(card.dataset.event)});actions.prepend(b);
  });
}
let cronObs=null;
function watchCronograma(){
  const root=document.getElementById('cronograma');if(!root||cronObs)return;
  cronObs=new MutationObserver(()=>{if(root.classList.contains('active'))requestAnimationFrame(addStudyButtons)});
  cronObs.observe(root,{childList:true,subtree:true});
}
document.addEventListener('click',ev=>{
  const nav=ev.target&&ev.target.closest&&ev.target.closest('[data-p]');
  if(nav){const p=nav.getAttribute('data-p');if(p==='cronograma'){openTool('cronograma').then(()=>{watchCronograma();setTimeout(addStudyButtons,80)})}else if(p==='timer')openTool('timer')}
},true);
function initial(){watchCronograma();const c=document.getElementById('cronograma'),t=document.getElementById('timer');if(c&&c.classList.contains('active'))openTool('cronograma').then(()=>setTimeout(addStudyButtons,80));if(t&&t.classList.contains('active'))openTool('timer')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initial,{once:true});else initial();
})();