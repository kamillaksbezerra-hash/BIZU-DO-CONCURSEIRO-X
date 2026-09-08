(function(){
  if(window.__bxSharedCoreV1)return;
  window.__bxSharedCoreV1=true;

  const nativeFetch=window.fetch.bind(window);
  const clean=v=>String(v??'').trim();
  const activeCompetition=()=>clean(window.BX?.boot?.profile?.target_competition_id||window.BX?.boot?.context?.competition?.id);
  const activeCourse=()=>clean(window.BX?.boot?.profile?.target_course_id||window.BX?.boot?.context?.course?.id);
  const competitionForCourse=courseId=>{
    const id=clean(courseId);
    if(!id)return activeCompetition();
    const row=(window.BX?.boot?.courses||[]).find(c=>c.id===id);
    return clean(row?.competition_id)||activeCompetition();
  };
  const sameActiveCourse=courseId=>!clean(courseId)||clean(courseId)===activeCourse();

  async function jsonFetch(url,opt={}){
    const r=await nativeFetch(url,{credentials:'include',cache:'no-store',...opt});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.message||d.error||('HTTP '+r.status));
    return d;
  }

  function jsonBody(init){
    try{return typeof init?.body==='string'?JSON.parse(init.body):{}}
    catch{return {}}
  }
  function responseLike(original,data){
    const h=new Headers(original.headers);
    h.set('content-type','application/json;charset=utf-8');
    h.set('cache-control','no-store');
    h.delete('content-length');h.delete('content-encoding');
    return new Response(JSON.stringify(data),{status:original.status,statusText:original.statusText,headers:h});
  }
  function addCompetitionToUrl(url,cid){
    const u=new URL(url,location.origin);
    if(cid)u.searchParams.set('competition_id',cid);
    return u.pathname+(u.search||'');
  }
  function actionUrl(path,search,cid){
    const u=new URL('/api/actions/shared/'+path,location.origin);
    const src=new URLSearchParams(search||'');
    src.forEach((v,k)=>u.searchParams.set(k,v));
    if(cid)u.searchParams.set('competition_id',cid);
    return u.pathname+(u.search||'');
  }
  function withCompetitionBody(init,cid){
    const body=jsonBody(init);
    if(cid)body.competition_id=cid;
    return {...init,headers:{...(init?.headers||{}),'content-type':'application/json'},body:JSON.stringify(body)};
  }

  async function augmentBootstrap(input,init){
    const res=await nativeFetch(input,init);
    if(!res.ok)return res;
    const data=await res.clone().json().catch(()=>null);
    if(!data)return res;
    const cid=clean(data?.profile?.target_competition_id||data?.context?.competition?.id);
    if(!cid)return res;
    try{
      const [coverage,maps]=await Promise.all([
        jsonFetch('/api/actions/shared/coverage?competition_id='+encodeURIComponent(cid)),
        jsonFetch('/api/actions/shared/mindmaps?competition_id='+encodeURIComponent(cid))
      ]);
      const byTopic=new Map((coverage.coverage||[]).map(r=>[r.topic_id,r]));
      for(const subject of data?.learning?.subjects||[]){
        for(const topic of subject.topics||[]){
          const row=byTopic.get(topic.id);if(!row)continue;
          const c={questions:Number(row.questions_published||0),flashcards:Number(row.flashcards_published||0),guides:Number(row.guides_published||0),mindmaps:Number(row.mindmaps_published||0),materials:Number(row.materials_published||0)};
          c.status=(c.questions>=10&&c.flashcards>=10&&c.guides>=1&&c.mindmaps>=1)?'complete':Object.values(c).some(v=>Number(v)>0)?'partial':'missing';
          topic.coverage=c;
          topic.shared_core=!!row.shared_core;
          topic.content_coverage_percent=Number(row.coverage_percent||0);
        }
      }
      data.mindmaps=Array.isArray(maps.mindmaps)?maps.mindmaps:(data.mindmaps||[]);
      data.shared_core={enabled:true,competition_id:cid};
      return responseLike(res,data);
    }catch{return res}
  }

  async function augmentTopic(input,init,url){
    const res=await nativeFetch(input,init);
    if(!res.ok)return res;
    const base=await res.clone().json().catch(()=>null);if(!base)return res;
    const cid=activeCompetition();if(!cid)return res;
    const m=url.pathname.match(/^\/api\/integrated\/topics\/([0-9a-f-]{36})\/content$/i);if(!m)return res;
    try{
      const shared=await jsonFetch('/api/actions/shared/topics/'+m[1]+'/content?competition_id='+encodeURIComponent(cid));
      base.guides=shared.guides||[];
      base.materials=shared.materials||[];
      base.mindmaps=shared.mindmaps||[];
      base.counts=shared.counts||base.counts||{};
      base.shared_core=true;
      return responseLike(res,base);
    }catch{return res}
  }

  window.fetch=async function(input,init={}){
    let raw='';
    try{raw=typeof input==='string'?input:input instanceof URL?input.href:input?.url||''}catch{}
    let url;try{url=new URL(raw,location.origin)}catch{return nativeFetch(input,init)}
    if(url.origin!==location.origin)return nativeFetch(input,init);
    const path=url.pathname;

    if(path==='/api/integrated/bootstrap'&&(init?.method||'GET').toUpperCase()==='GET')return augmentBootstrap(input,init);
    if(/^\/api\/integrated\/topics\/[0-9a-f-]{36}\/content$/i.test(path))return augmentTopic(input,init,url);

    if(path==='/api/integrated/questions'&&(init?.method||'GET').toUpperCase()==='GET'){
      const course=url.searchParams.get('course_id');
      if(!sameActiveCourse(course))return nativeFetch(input,init);
      const cid=competitionForCourse(course);
      return nativeFetch(actionUrl('questions',url.search,cid),init);
    }
    if(path==='/api/integrated/questions/attempt'){
      const cid=activeCompetition();
      return nativeFetch('/api/actions/shared/questions/attempt',withCompetitionBody(init,cid));
    }
    if(path==='/api/integrated/quick-tests/start'){
      const body=jsonBody(init);if(!sameActiveCourse(body.course_id))return nativeFetch(input,init);
      return nativeFetch('/api/actions/shared/quick-tests/start',withCompetitionBody(init,competitionForCourse(body.course_id)));
    }
    if(path==='/api/integrated/quick-tests/finish'){
      const body=jsonBody(init);if(!sameActiveCourse(body.course_id))return nativeFetch(input,init);
      return nativeFetch('/api/actions/shared/quick-tests/finish',withCompetitionBody(init,competitionForCourse(body.course_id)));
    }
    if(path==='/api/integrated/flashcards/session'){
      const course=url.searchParams.get('course_id');if(!sameActiveCourse(course))return nativeFetch(input,init);
      return nativeFetch(actionUrl('flashcards/session',url.search,competitionForCourse(course)),init);
    }
    if(path==='/api/integrated/flashcards/review'){
      return nativeFetch('/api/actions/shared/flashcards/review',withCompetitionBody(init,activeCompetition()));
    }
    return nativeFetch(input,init);
  };
})();
