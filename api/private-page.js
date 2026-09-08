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

function refreshedCookieHeader(original,setCookies){
  const jar=new Map();
  for(const part of String(original||'').split(';')){
    const i=part.indexOf('=');
    if(i<=0)continue;
    jar.set(part.slice(0,i).trim(),part.slice(i+1).trim());
  }
  for(const value of setCookies||[]){
    const first=String(value).split(';',1)[0];
    const i=first.indexOf('=');
    if(i<=0)continue;
    const name=first.slice(0,i).trim(),val=first.slice(i+1).trim();
    if(name==='bx_at'||name==='bx_rt'){
      if(val)jar.set(name,val);else jar.delete(name);
    }
  }
  return [...jar.entries()].map(([k,v])=>`${k}=${v}`).join('; ');
}

function transformPrivateHtml(body,mode){
  let html=String(body||'');
  if(mode==='admin'){
    html=html.replace(/<div class="label">ATALHOS<\/div>\s*<a href="\/">← Área do aluno<\/a>/g,'');
    const adminPatches=['/admin-patches/admin-management-v2.js','/admin-patches/admin-management-v2-stability.js','/admin-patches/admin-security-v3.js'];
    for(const src of adminPatches){
      if(html.includes(src))continue;
      const tag=`<script src="${src}" defer></script>`;
      html=html.includes('</body>')?html.replace('</body>',tag+'</body>'):html+tag;
    }
  }else{
    html=html.replace(/<div class="label">ADMIN<\/div>\s*<a class="admin-link" href="\/admin">⚙ Área do Administrador<\/a>/g,'');
    const earlySrc='/student-patches/shared-core-v1.js';
    if(!html.includes(earlySrc)){
      const tag=`<script src="${earlySrc}"></script>`;
      if(/<head[^>]*>/i.test(html))html=html.replace(/<head[^>]*>/i,m=>m+tag);
      else html=tag+html;
    }
    const studentPatches=['/student-patches/questions-v2.js','/student-patches/quick-test-v2.js','/student-patches/cronograma-inteligente-v2.js'];
    for(const src of studentPatches){
      if(html.includes(src))continue;
      const tag=`<script src="${src}" defer></script>`;
      html=html.includes('</body>')?html.replace('</body>',tag+'</body>'):html+tag;
    }
  }
  return html;
}

function commonHeaders(res,mode,role='unknown'){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow,noarchive');
  res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Vary','Cookie');
  res.setHeader('X-Bizu-Private-Proxy','v14-cronograma-inteligente-v2');
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
      cookie:refreshedCookieHeader(cookie,sessionCookies)
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

    const body=transformPrivateHtml(await upstream.text(),mode);
    res.statusCode=upstream.status;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    commonHeaders(res,mode,role);
    res.setHeader('X-Bizu-UI-Patch',mode==='admin'?'admin-management-v2+notices-stability+security-v3':'shared-core-v1+questions-v2+quick-test-v2+cronograma-inteligente-v2');
    if(cookies.length)res.setHeader('Set-Cookie',cookies);
    return res.end(body);
  }catch(err){
    res.statusCode=503;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    commonHeaders(res,mode,'error');
    return res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Bizu X</title><body style="font-family:system-ui;background:#050914;color:#fff;padding:32px"><h1>Bizu X</h1><p>Não foi possível validar sua sessão agora. Tente novamente.</p></body></html>');
  }
}
