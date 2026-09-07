const SUPABASE_PRIVATE_UI='https://xizvzwvvtfavsxtyosso.supabase.co/functions/v1/bizu-x-private-ui';
const SUPABASE_SESSION='https://xizvzwvvtfavsxtyosso.supabase.co/functions/v1/bizu-x-api/session';

function bizuCookies(headers){
  const getSetCookie=headers.getSetCookie?.bind(headers);
  const all=getSetCookie?getSetCookie():[];
  if(!all.length){const raw=headers.get('set-cookie');if(raw)all.push(raw)}
  return all.filter(v=>/^\s*(bx_at|bx_rt)=/i.test(v));
}

function mergeBizuCookies(...groups){
  const byName=new Map();
  for(const value of groups.flat()){
    const name=String(value).split('=',1)[0].trim().toLowerCase();
    if(name==='bx_at'||name==='bx_rt')byName.set(name,value);
  }
  return [...byName.values()];
}

function commonHeaders(res,mode,role='unknown'){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Vary','Cookie');
  res.setHeader('X-Bizu-Private-Proxy','v8-rbac');
  res.setHeader('X-Bizu-UI-Mode',mode);
  res.setHeader('X-Bizu-Session-Role',role);
}

function redirect(res,mode,location,role='unknown',cookies=[]){
  res.statusCode=302;
  commonHeaders(res,mode,role);
  res.setHeader('Location',location);
  if(cookies.length)res.setHeader('Set-Cookie',cookies);
  return res.end('Redirecting...');
}

export default async function handler(req,res){
  const mode=String(req.query?.mode||'student').toLowerCase()==='admin'?'admin':'student';
  const loginTarget=mode==='admin'?'/admin':'/';
  const cookie=String(req.headers.cookie||'');
  if(!cookie)return redirect(res,mode,loginTarget,'anonymous');

  try{
    const sessionHeaders={accept:'application/json','cache-control':'no-store',cookie};
    if(req.headers['user-agent'])sessionHeaders['user-agent']=req.headers['user-agent'];
    const session=await fetch(SUPABASE_SESSION,{method:'GET',headers:sessionHeaders,redirect:'manual',cache:'no-store'});
    const sessionCookies=bizuCookies(session.headers);

    if(session.status===401)return redirect(res,mode,loginTarget,'anonymous',sessionCookies);
    if(!session.ok)throw new Error(`session_${session.status}`);

    const data=await session.json().catch(()=>null);
    const role=data?.role==='admin'?'admin':'student';

    if(mode==='admin'&&role!=='admin')return redirect(res,mode,'/private/app',role,sessionCookies);
    if(mode==='student'&&role==='admin')return redirect(res,mode,'/private/admin',role,sessionCookies);

    const upstreamUrl=`${SUPABASE_PRIVATE_UI}/${mode==='admin'?'admin':'app'}`;
    const headers={
      accept:'text/html,application/xhtml+xml',
      'cache-control':'no-store',
      'x-original-url':mode==='admin'?'/private/admin':'/private/app',
      'x-forwarded-uri':mode==='admin'?'/private/admin':'/private/app',
      cookie
    };
    if(req.headers['user-agent'])headers['user-agent']=req.headers['user-agent'];
    if(req.headers['accept-language'])headers['accept-language']=req.headers['accept-language'];

    const upstream=await fetch(upstreamUrl,{method:'GET',headers,redirect:'manual',cache:'no-store'});
    const upstreamCookies=bizuCookies(upstream.headers);
    const cookies=mergeBizuCookies(sessionCookies,upstreamCookies);

    if(upstream.status===401)return redirect(res,mode,loginTarget,'anonymous',cookies);
    if(upstream.status===403){
      const target=mode==='admin'?'/private/app':'/private/admin';
      return redirect(res,mode,target,role,cookies);
    }

    const body=await upstream.text();
    res.statusCode=upstream.status;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    commonHeaders(res,mode,role);
    if(cookies.length)res.setHeader('Set-Cookie',cookies);
    return res.end(body);
  }catch(err){
    res.statusCode=503;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    commonHeaders(res,mode,'error');
    return res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Bizu X</title><body style="font-family:system-ui;background:#050914;color:#fff;padding:32px"><h1>Bizu X</h1><p>Não foi possível validar sua sessão agora. Tente novamente.</p></body></html>');
  }
}
