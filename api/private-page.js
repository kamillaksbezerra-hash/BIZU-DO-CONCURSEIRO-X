const SUPABASE_PRIVATE_UI='https://xizvzwvvtfavsxtyosso.supabase.co/functions/v1/bizu-x-private-ui';

const ONBOARDING_BUG="if(prefs.onboarding_completed){var old=qs('bxOnboarding');if(old)old.remove();return}";
const ONBOARDING_FIXED="if(prefs.onboarding_completed||p.target_course_id){var old=qs('bxOnboarding');if(old)old.remove();return}";

function fixStudentRuntime(html){
  if(!html||typeof html!=='string')return {html,applied:false};
  if(!html.includes(ONBOARDING_BUG))return {html,applied:false};
  return {html:html.replace(ONBOARDING_BUG,ONBOARDING_FIXED),applied:true};
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
    let onboardingFix='not-applicable';
    if(mode==='student'&&upstream.status===200){
      const fixed=fixStudentRuntime(body);
      body=fixed.html;
      onboardingFix=fixed.applied?'applied':'source-already-fixed';
    }

    res.statusCode=upstream.status;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
    res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('X-Bizu-Private-Proxy','v5');
    res.setHeader('X-Bizu-UI-Mode',mode);
    res.setHeader('X-Bizu-Onboarding-Fix',onboardingFix);

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
    res.setHeader('X-Bizu-Private-Proxy','v5');
    return res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Bizu X</title><body style="font-family:system-ui;background:#050914;color:#fff;padding:32px"><h1>Bizu X</h1><p>Não foi possível abrir a interface agora. Tente novamente.</p></body></html>');
  }
}
