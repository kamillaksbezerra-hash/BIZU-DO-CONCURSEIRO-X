(function(){
'use strict';
if(window.__bxStudyToolsModelV2Loader)return;
window.__bxStudyToolsModelV2Loader=true;
window.__bxStudyToolsModelV2Status={cronograma:'standalone-v4',timer:'pending'};
const TIMER='/student-patches/cronometro-inteligente-v2.js?v=20260908approved3';
function inject(code,key){const s=document.createElement('script');s.dataset.bxPatchedStudyTool=key;s.textContent=code+'\n//# sourceURL=bizu-'+key+'-approved-ui-optimized.js';document.body.appendChild(s)}
function patchTimer(code){
  const oldReload=`async function reloadAll(){try{const d=await api('bootstrap');S.data={...d,recommendation:S.data?.recommendation||null};S.session=d.session;S.remaining=Number(d.session?.remaining_seconds||0);render();if(typeof window.reload==='function')window.reload(false).catch(()=>{})}catch{}}`;
  const newReload=`async function reloadAll(){try{const d=await api('bootstrap');S.data={...d,recommendation:S.data?.recommendation||null};S.session=d.session;S.remaining=Number(d.session?.remaining_seconds||0);if($('timer')?.classList.contains('active'))render()}catch{}}`;
  if(!code.includes(oldReload))throw new Error('Assinatura de sincronização do Cronômetro v2 mudou; publicação bloqueada com segurança.');
  code=code.replace(oldReload,newReload);
  const tail=/let tries=0,t=setInterval\([\s\S]*?mo\.observe\(document\.documentElement,\{childList:true,subtree:true\}\);\n\}\)\(\);\s*$/;
  if(!tail.test(code))throw new Error('Assinatura de inicialização do Cronômetro v2 mudou; publicação bloqueada com segurança.');
  return code.replace(tail,`injectCSS();
document.addEventListener('click',ev=>{if(ev.target?.closest?.('[data-p="timer"]')){const sec=$('timer');if(sec&&!S.data)sec.innerHTML='<div class="card" style="padding:22px;text-align:center"><b>Abrindo Cronômetro Inteligente…</b><p class="mut">Sincronizando somente seus dados de estudo.</p></div>';setTimeout(()=>S.data?render():boot(),20)}},true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.session&&!S.busy&&$('timer')?.classList.contains('active'))reloadAll()});
window.BXTimerStudyNow=async function(eventId){if(!eventId)return;S.pendingSchedule=eventId;S.technique='ia_recomenda';nav('timer');setTimeout(async()=>{try{if(!S.data)await boot();S.pendingSchedule=eventId;S.technique='ia_recomenda';if(S.data){render();await recommend();const m=$('bxTv2Msg');if(m)m.textContent='Tarefa do Cronograma X carregada. Clique em Iniciar.'}}catch(e){const m=$('bxTv2Msg');if(m)m.textContent=e.message}},80)};
window.addEventListener('bx:timer:study-now',ev=>{const id=ev.detail&&ev.detail.schedule_event_id;if(id)window.BXTimerStudyNow(id)});
})();`);
}
async function fetchText(url){const r=await fetch(url,{credentials:'same-origin',cache:'force-cache'});if(!r.ok)throw new Error('Falha ao carregar componente aprovado ('+r.status+').');return r.text()}
function fail(err){window.__bxStudyToolsModelV2Status.timer='error';console.error('[Bizu X] Falha ao preservar Cronômetro aprovado:',err);const target=document.querySelector('.page.active');if(target&&!target.querySelector('[data-bx-ui-safe-error]')){const box=document.createElement('div');box.dataset.bxUiSafeError='1';box.className='card status-bad';box.innerHTML='<b>Não foi possível carregar o Cronômetro agora.</b><p>Atualize a página e tente novamente.</p>';target.prepend(box)}}
(async()=>{try{const timer=patchTimer(await fetchText(TIMER));inject(timer,'cronometro-v2');window.__bxStudyToolsModelV2Status.timer='approved-v2-optimized'}catch(err){fail(err)}})();
})();