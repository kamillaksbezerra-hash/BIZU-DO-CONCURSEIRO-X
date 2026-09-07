const SUPABASE_PRIVATE_UI='https://xizvzwvvtfavsxtyosso.supabase.co/functions/v1/bizu-x-private-ui';

const STUDENT_UNLOCK=`
<style id="bx-private-unlock-css">
html.bx-ui-ready,html.bx-ui-ready body{pointer-events:auto!important}
html.bx-ui-ready body{overflow:auto!important}
html.bx-ui-ready #bxOnboarding.bx-stale-onboarding{display:none!important;pointer-events:none!important;visibility:hidden!important}
</style>
<script id="bx-private-unlock-js">
(function(){
  function unlock(){
    try{
      var boot=window.BX&&window.BX.boot;
      var profile=boot&&boot.profile||{};
      var prefs=profile.preferences||{};
      var hasCourse=!!(profile.target_course_id||(boot&&boot.context&&boot.context.course&&boot.context.course.id));
      var onboard=document.getElementById('bxOnboarding');
      if(hasCourse&&onboard&&!prefs.onboarding_completed){
        onboard.classList.add('bx-stale-onboarding');
        setTimeout(function(){try{onboard.remove()}catch(_){}},0);
      }
      document.documentElement.classList.add('bx-ui-ready');
      if(document.body){
        document.body.style.pointerEvents='auto';
        if(!document.querySelector('.bx-modal.open'))document.body.style.overflow='';
      }
      document.querySelectorAll('[inert]').forEach(function(n){
        if(n.id!=='bxOnboarding')n.removeAttribute('inert');
      });
    }catch(_){}
  }
  function watch(){
    try{
      var root=document.body||document.documentElement;
      if(!root||window.__bxUnlockObserver)return;
      window.__bxUnlockObserver=new MutationObserver(function(ms){
        for(var i=0;i<ms.length;i++){
          var added=ms[i].addedNodes||[];
          for(var j=0;j<added.length;j++){
            var n=added[j];
            if(n&&n.nodeType===1&&(n.id==='bxOnboarding'||(n.querySelector&&n.querySelector('#bxOnboarding')))){
              setTimeout(unlock,0);
              return;
            }
          }
        }
      });
      window.__bxUnlockObserver.observe(root,{childList:true,subtree:true});
    }catch(_){}
  }
  function start(){watch();unlock();setTimeout(unlock,300);setTimeout(unlock,1800);setTimeout(unlock,5000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
  addEventListener('pageshow',function(){watch();unlock()});
})();
</script>`;

function injectStudentUnlock(html){
  if(!html||typeof html!=='string')return html;
  if(html.includes('id="bx-private-unlock-js"'))return html;
  return html.includes('</body>')?html.replace('</body>',STUDENT_UNLOCK+'</body>'):html+STUDENT_UNLOCK;
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
    if(mode==='student'&&upstream.status===200)body=injectStudentUnlock(body);

    res.statusCode=upstream.status;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
    res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('X-Bizu-Private-Proxy','v4');
    res.setHeader('X-Bizu-UI-Mode',mode);

    // Preserve refreshed auth cookies without forwarding the upstream CSP.
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
    res.setHeader('X-Bizu-Private-Proxy','v4');
    return res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Bizu X</title><body style="font-family:system-ui;background:#050914;color:#fff;padding:32px"><h1>Bizu X</h1><p>Não foi possível abrir a interface agora. Tente novamente.</p></body></html>');
  }
}
