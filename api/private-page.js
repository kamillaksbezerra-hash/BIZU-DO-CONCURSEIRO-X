const SUPABASE_PRIVATE_UI='https://xizvzwvvtfavsxtyosso.supabase.co/functions/v1/bizu-x-private-ui';

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
    const body=await upstream.text();

    res.statusCode=upstream.status;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
    res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('X-Bizu-Private-Proxy','v7-clean');
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
    res.setHeader('X-Bizu-Private-Proxy','v7-clean');
    return res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Bizu X</title><body style="font-family:system-ui;background:#050914;color:#fff;padding:32px"><h1>Bizu X</h1><p>Não foi possível abrir a interface agora. Tente novamente.</p></body></html>');
  }
}
