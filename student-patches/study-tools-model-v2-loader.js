(function(){
'use strict';
if(window.__bxStudyToolsModelV2Loader)return;
window.__bxStudyToolsModelV2Loader=true;

const SOURCES={
  cronograma:'/student-patches/cronograma-inteligente-v2.js?v=20260908approved1',
  timer:'/student-patches/cronometro-inteligente-v2.js?v=20260908approved1'
};

function inject(code,key){
  const s=document.createElement('script');
  s.dataset.bxPatchedStudyTool=key;
  s.textContent=code+'\n//# sourceURL=bizu-'+key+'-approved-ui-optimized.js';
  document.body.appendChild(s);
}

function patchCronograma(code){
  const old=`  injectStyle();\n  let tries=0,t=setInterval(()=>{tries++;if(window.BX&&BX.boot&&qs('cronograma')){clearInterval(t);load()}else if(tries>80)clearInterval(t)},250);\n  document.addEventListener('click',ev=>{const b=ev.target&&ev.target.closest&&ev.target.closest('[data-p=\\"cronograma\\"]');if(b)setTimeout(ensure,40)},true);\n  const mo=new MutationObserver(()=>{if(S.rendering)return;const sec=qs('cronograma');if(sec&&S.data&&!qs('bxCronV2Root'))setTimeout(ensure,40)});mo.observe(document.documentElement,{childList:true,subtree:true});\n})();`;
  const replacement=`  injectStyle();\n  document.addEventListener('click',ev=>{const b=ev.target&&ev.target.closest&&ev.target.closest('[data-p=\\"cronograma\\"]');if(b){const sec=qs('cronograma');if(sec&&!S.data)sec.innerHTML='<div class=\\"bx-cv2-loading\\">Montando sua Central de Estudos Personalizada...</div>';setTimeout(ensure,20)}},true);\n  function watchCronRoot(){const sec=qs('cronograma');if(!sec||sec.__bxCronScopedObserver)return;sec.__bxCronScopedObserver=true;const mo=new MutationObserver(()=>{if(S.rendering)return;if(S.data&&!qs('bxCronV2Root'))setTimeout(ensure,45)});mo.observe(sec,{childList:true,subtree:true})}\n  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchCronRoot,{once:true});else watchCronRoot();\n})();`;
  if(!code.includes(old))throw new Error('Assinatura do Cronograma v2 mudou; otimização cancelada com segurança.');
  return code.replace(old,replacement);
}

function patchTimer(code){
  const oldReload=`async function reloadAll(){try{const d=await api('bootstrap');S.data={...d,recommendation:S.data?.recommendation||null};S.session=d.session;S.remaining=Number(d.session?.remaining_seconds||0);render();if(typeof window.reload==='function')window.reload(false).catch(()=>{})}catch{}}`;
  const newReload=`async function reloadAll(){try{const d=await api('bootstrap');S.data={...d,recommendation:S.data?.recommendation||null};S.session=d.session;S.remaining=Number(d.session?.remaining_seconds||0);if($('timer')?.classList.contains('active'))render()}catch{}}`;
  if(!code.includes(oldReload))throw new Error('Assinatura de sincronização do Cronômetro v2 mudou; otimização cancelada com segurança.');
  code=code.replace(oldReload,newReload);

  const oldBottom=`let tries=0,t=setInterval(()=>{tries++;if(window.BX&&BX.boot&&$('timer')){clearInterval(t);boot()}else if(tries>80)clearInterval(t)},250);\ndocument.addEventListener('click',ev=>{if(ev.target?.closest?.('[data-p=\\"timer\\"]'))setTimeout(()=>S.data?render():boot(),50)},true);\ndocument.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.session&&!S.busy)reloadAll()});\nsetInterval(()=>{if(S.session&&!document.hidden&&!S.busy)reloadAll()},60000);\nconst mo=new MutationObserver(()=>{if(S.data){if($('timer')&&!$('timer').dataset.bxTimerV2)setTimeout(render,30);injectScheduleButtons()}});mo.observe(document.documentElement,{childList:true,subtree:true});\n})();`;
  const newBottom=`injectCSS();\ndocument.addEventListener('click',ev=>{if(ev.target?.closest?.('[data-p=\\"timer\\"]')){const sec=$('timer');if(sec&&!S.data)sec.innerHTML='<div class=\\"card\\" style=\\"padding:22px;text-align:center\\"><b>Abrindo Cronômetro Inteligente…</b><p class=\\"mut\\">Sincronizando somente seus dados de estudo.</p></div>';setTimeout(()=>S.data?render():boot(),20)}},true);\ndocument.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.session&&!S.busy&&$('timer')?.classList.contains('active'))reloadAll()});\nfunction watchScheduleRoot(){const root=$('cronograma');if(!root||root.__bxTimerScheduleObserver)return;root.__bxTimerScheduleObserver=true;const mo=new MutationObserver(()=>{if(S.data&&root.classList.contains('active'))requestAnimationFrame(injectScheduleButtons)});mo.observe(root,{childList:true,subtree:true});if(S.data)injectScheduleButtons()}\nif(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchScheduleRoot,{once:true});else watchScheduleRoot();\n})();`;
  if(!code.includes(oldBottom))throw new Error('Assinatura de inicialização do Cronômetro v2 mudou; otimização cancelada com segurança.');
  return code.replace(oldBottom,newBottom);
}

async function fetchText(url){
  const r=await fetch(url,{credentials:'same-origin',cache:'force-cache'});
  if(!r.ok)throw new Error('Falha ao carregar componente aprovado ('+r.status+').');
  return r.text();
}

function fail(err){
  console.error('[Bizu X] Falha ao preservar interface aprovada:',err);
  const target=document.querySelector('.page.active');
  if(target&&!target.querySelector('[data-bx-ui-safe-error]')){
    const box=document.createElement('div');box.dataset.bxUiSafeError='1';box.className='card status-bad';box.innerHTML='<b>Não foi possível carregar este módulo agora.</b><p>Atualize a página e tente novamente.</p>';target.prepend(box);
  }
}

(async()=>{
  try{
    const cron=patchCronograma(await fetchText(SOURCES.cronograma));
    inject(cron,'cronograma-v2');
    const timer=patchTimer(await fetchText(SOURCES.timer));
    inject(timer,'cronometro-v2');
  }catch(err){fail(err)}
})();
})();
