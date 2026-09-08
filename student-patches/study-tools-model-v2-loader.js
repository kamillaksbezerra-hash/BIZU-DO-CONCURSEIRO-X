(function(){
'use strict';
if(window.__bxStudyToolsModelV2Loader)return;
window.__bxStudyToolsModelV2Loader=true;
window.__bxStudyToolsModelV2Status={cronograma:'pending',timer:'pending'};

const SOURCES={
  cronograma:'/student-patches/cronograma-inteligente-v2.js?v=20260908approved3',
  timer:'/student-patches/cronometro-inteligente-v2.js?v=20260908approved3'
};

function inject(code,key){
  const s=document.createElement('script');
  s.dataset.bxPatchedStudyTool=key;
  s.textContent=code+'\n//# sourceURL=bizu-'+key+'-approved-ui-optimized.js';
  document.body.appendChild(s);
}

function patchCronograma(code){
  const tail=/  injectStyle\(\);\n  let tries=0,t=setInterval\([\s\S]*?mo\.observe\(document\.documentElement,\{childList:true,subtree:true\}\);\n\}\)\(\);\s*$/;
  if(!tail.test(code))throw new Error('Assinatura do Cronograma v2 mudou; publicação bloqueada com segurança.');
  return code.replace(tail,`  injectStyle();
  document.addEventListener('click',ev=>{const b=ev.target&&ev.target.closest&&ev.target.closest('[data-p="cronograma"]');if(b){const sec=qs('cronograma');if(sec&&!S.data)sec.innerHTML='<div class="bx-cv2-loading">Montando sua Central de Estudos Personalizada...</div>';setTimeout(ensure,20)}},true);
  function watchCronRoot(){const sec=qs('cronograma');if(!sec||sec.__bxCronScopedObserver)return;sec.__bxCronScopedObserver=true;const mo=new MutationObserver(()=>{if(S.rendering)return;if(S.data&&!qs('bxCronV2Root'))setTimeout(ensure,45)});mo.observe(sec,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchCronRoot,{once:true});else watchCronRoot();
})();`);
}

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
function watchScheduleRoot(){const root=$('cronograma');if(!root||root.__bxTimerScheduleObserver)return;root.__bxTimerScheduleObserver=true;const mo=new MutationObserver(()=>{if(S.data&&root.classList.contains('active'))requestAnimationFrame(injectScheduleButtons)});mo.observe(root,{childList:true,subtree:true});if(S.data)injectScheduleButtons()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchScheduleRoot,{once:true});else watchScheduleRoot();
})();`);
}

async function fetchText(url){
  const r=await fetch(url,{credentials:'same-origin',cache:'force-cache'});
  if(!r.ok)throw new Error('Falha ao carregar componente aprovado ('+r.status+').');
  return r.text();
}

function fail(key,err){
  window.__bxStudyToolsModelV2Status[key]='error';
  console.error('[Bizu X] Falha ao preservar interface aprovada:',key,err);
  const target=document.querySelector('.page.active');
  if(target&&!target.querySelector('[data-bx-ui-safe-error]')){
    const box=document.createElement('div');box.dataset.bxUiSafeError='1';box.className='card status-bad';box.innerHTML='<b>Não foi possível carregar este módulo agora.</b><p>Atualize a página e tente novamente.</p>';target.prepend(box);
  }
}

(async()=>{
  try{
    const cron=patchCronograma(await fetchText(SOURCES.cronograma));
    inject(cron,'cronograma-v2');
    window.__bxStudyToolsModelV2Status.cronograma='approved-v2-optimized';
  }catch(err){fail('cronograma',err);return}
  try{
    const timer=patchTimer(await fetchText(SOURCES.timer));
    inject(timer,'cronometro-v2');
    window.__bxStudyToolsModelV2Status.timer='approved-v2-optimized';
  }catch(err){fail('timer',err)}
})();
})();
