const SUPABASE_PRIVATE_UI='https://xizvzwvvtfavsxtyosso.supabase.co/functions/v1/bizu-x-private-ui';

const STUDENT_RUNTIME_GUARD=`
<style id="bx-runtime-guard-css">
html.bx-runtime-ready,html.bx-runtime-ready body{pointer-events:auto!important}
html.bx-runtime-ready body{overflow:auto!important}
</style>
<script id="bx-runtime-guard-js">
(function(){
  if(window.__bxRuntimeGuardV6)return;
  window.__bxRuntimeGuardV6=true;
  var bootBusy=false;

  function page(id){
    if(!id)return false;
    var target=document.getElementById(id);
    if(!target||!target.classList.contains('page'))return false;
    document.querySelectorAll('.page').forEach(function(p){p.classList.toggle('active',p===target)});
    document.querySelectorAll('.nav button[data-p]').forEach(function(b){b.classList.toggle('active',b.dataset.p===id)});
    var side=document.getElementById('side');if(side)side.classList.remove('open');
    try{window.scrollTo(0,0)}catch(_){}
    return true;
  }

  if(typeof window.jump!=='function')window.jump=page;

  document.addEventListener('click',function(ev){
    var t=ev.target&&ev.target.closest&&ev.target.closest('.nav button[data-p],[data-jump]');
    if(!t)return;
    var id=t.dataset.p||t.dataset.jump;
    if(id&&document.getElementById(id))page(id);
  },true);

  function hasConfiguredCourse(){
    try{
      var b=window.BX&&window.BX.boot||{};
      var p=b.profile||{};
      return !!(p.target_course_id||(b.context&&b.context.course&&b.context.course.id));
    }catch(_){return false}
  }

  function release(){
    try{
      document.documentElement.classList.add('bx-runtime-ready');
      document.documentElement.style.pointerEvents='auto';
      if(document.body){document.body.style.pointerEvents='auto'}

      var onboard=document.getElementById('bxOnboarding');
      if(onboard&&hasConfiguredCourse()){
        onboard.style.pointerEvents='none';
        onboard.style.display='none';
        try{onboard.remove()}catch(_){}
      }

      document.querySelectorAll('[inert]').forEach(function(n){
        if(n.id!=='bxOnboarding')n.removeAttribute('inert');
      });

      var w=Math.max(1,window.innerWidth||1),h=Math.max(1,window.innerHeight||1);
      document.querySelectorAll('body *').forEach(function(n){
        if(!n||n.id==='side'||n.classList&&n.classList.contains('side'))return;
        if(n.closest&&n.closest('.bx-modal.open'))return;
        var cs;try{cs=getComputedStyle(n)}catch(_){return}
        if(!cs||cs.display==='none'||cs.visibility==='hidden'||cs.pointerEvents==='none'||cs.position!=='fixed')return;
        var r;try{r=n.getBoundingClientRect()}catch(_){return}
        if(r.width<w*.88||r.height<h*.82)return;
        var txt=String(n.textContent||'').replace(/\s+/g,' ').trim();
        var z=parseInt(cs.zIndex,10)||0;
        if(z>=20&&/carregando|abrindo|preparando|aguarde/i.test(txt)){
          n.style.pointerEvents='none';
          n.style.display='none';
        }
      });
    }catch(_){}
  }

  function callRenderers(){
    ['renderDashboard','renderMissions','renderNews','renderContent','renderReviewsErrors','renderStats','renderProfile','renderSims'].forEach(function(k){
      try{if(typeof window[k]==='function')window[k]()}catch(e){console.warn('[Bizu runtime]',k,e)}
    });
  }

  async function ensureBoot(){
    if(bootBusy)return;
    var existing=window.BX&&window.BX.boot;
    if(existing&&(existing.context||existing.courses||existing.profile)){
      release();callRenderers();return;
    }
    bootBusy=true;
    var c=new AbortController(),timer=setTimeout(function(){c.abort()},20000);
    try{
      var r=await fetch('/api/integrated/bootstrap',{credentials:'include',cache:'no-store',signal:c.signal});
      if(r.status===401){location.replace('/');return}
      if(!r.ok)throw new Error('bootstrap '+r.status);
      var d=await r.json();
      window.BX=window.BX||{};
      window.BX.boot=Object.assign({},window.BX.boot||{},d||{});
      release();
      callRenderers();
      try{window.dispatchEvent(new CustomEvent('bizu:boot-ready',{detail:{source:'runtime-guard-v6'}}))}catch(_){}
    }catch(e){console.warn('[Bizu runtime] bootstrap rescue',e)}
    finally{clearTimeout(timer);bootBusy=false;release()}
  }

  function start(){
    release();
    setTimeout(release,150);
    setTimeout(release,700);
    setTimeout(ensureBoot,900);
    setTimeout(release,2200);
    setTimeout(ensureBoot,3500);
    try{
      if(!window.__bxRuntimeObserver){
        var root=document.body||document.documentElement;
        window.__bxRuntimeObserver=new MutationObserver(function(){clearTimeout(window.__bxRuntimeDebounce);window.__bxRuntimeDebounce=setTimeout(release,30)});
        window.__bxRuntimeObserver.observe(root,{childList:true,subtree:true});
      }
    }catch(_){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  addEventListener('pageshow',function(){release();setTimeout(ensureBoot,200)});
})();
</script>`;

function injectStudentRuntimeGuard(html){
  if(!html||typeof html!=='string')return html;
  if(html.includes('id="bx-runtime-guard-js"'))return html;
  return html.includes('</body>')?html.replace('</body>',STUDENT_RUNTIME_GUARD+'</body>'):html+STUDENT_RUNTIME_GUARD;
}

export default async function handler(req,res){
  const mode=String(req.query?.mode||'student').toLowerCase()==='admin'?'admin':'student';
  const upstreamUrl=`${SUPABASE_PRIVATE_UI}/${mode==='admin'?'admin':'app'}`;
  try{
    const headers={
      'accept':'text/html,application/xhtml+xml',
      'cache-control':'no-store',
      'x-original-url':mode==='admin'?'/private/admin':'/private/app',
      'x-forwarded-uri':mode==='admin'?'/private/admin':'/private/app'
    };
    if(req.headers.cookie)headers.cookie=req.headers.cookie;
    if(req.headers['user-agent'])headers['user-agent']=req.headers['user-agent'];
    if(req.headers['accept-language'])headers['accept-language']=req.headers['accept-language'];

    const upstream=await fetch(upstreamUrl,{method:'GET',headers,redirect:'manual',cache:'no-store'});
    let body=await upstream.text();
    if(mode==='student'&&upstream.status===200)body=injectStudentRuntimeGuard(body);

    res.statusCode=upstream.status;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
    res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('X-Bizu-Private-Proxy','v6');
    res.setHeader('X-Bizu-UI-Mode',mode);

    const getSetCookie=upstream.headers.getSetCookie?.bind(upstream.headers);
    const setCookies=getSetCookie?getSetCookie():[];
    if(setCookies.length)res.setHeader('Set-Cookie',setCookies);
    else {
      const raw=upstream.headers.get('set-cookie');
      if(raw)res.setHeader('Set-Cookie',raw);
    }

    return res.end(body);
  }catch(err){
    res.statusCode=503;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.setHeader('X-Bizu-Private-Proxy','v6');
    return res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Bizu X</title><body style="font-family:system-ui;background:#050914;color:#fff;padding:32px"><h1>Bizu X</h1><p>Não foi possível abrir a interface agora. Tente novamente.</p></body></html>');
  }
}
