(function(){
  if(window.__bxCronogramaInteligenteV2)return;
  window.__bxCronogramaInteligenteV2=true;

  const API='/api/study-planner';
  const VERSION='cronograma_inteligente_2026_09_v2';
  const DOW=['','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'];
  const S={data:null,tab:'hoje',loading:false,rendering:false,lastRender:0};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const qs=id=>document.getElementById(id);
  const clean=v=>String(v??'').trim();
  const isoToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const addDays=(s,n)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
  const formatDate=s=>{try{return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'})}catch{return s}};
  const activeBoot=()=>window.BX&&BX.boot||{};

  async function api(action,opt={}){
    const u=API+'?action='+encodeURIComponent(action);
    const r=await fetch(u,{credentials:'include',cache:'no-store',...opt,headers:{...(opt.body?{'content-type':'application/json'}:{}),...(opt.headers||{})}});
    const d=await r.json().catch(()=>({}));
    if(r.status===401){location.replace('/');throw new Error('Sua sessão expirou. Entre novamente.');}
    if(!r.ok)throw new Error(d.message||d.error||'Não foi possível atualizar o cronograma.');
    return d;
  }

  function injectStyle(){
    if(qs('bxCronogramaV2Style'))return;
    const st=document.createElement('style');st.id='bxCronogramaV2Style';st.textContent=`
      #cronograma[data-bx-cron-v2="1"]{--cv2bd:rgba(93,143,224,.27);--cv2blue:#4d8dff;--cv2green:#34d399;--cv2yellow:#fbbf24;--cv2red:#fb7185}
      .bx-cv2-hero{padding:22px;border:1px solid rgba(77,141,255,.38);border-radius:20px;background:radial-gradient(circle at 95% 0,rgba(52,211,153,.12),transparent 35%),linear-gradient(140deg,rgba(77,141,255,.14),rgba(7,18,36,.96));margin-bottom:14px}
      .bx-cv2-hero-top{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}.bx-cv2-hero h1{margin:5px 0 7px;font-size:30px}.bx-cv2-hero p{max-width:800px;color:var(--mut)}
      .bx-cv2-ai{margin-top:13px;padding:12px 14px;border:1px solid rgba(52,211,153,.28);border-radius:13px;background:rgba(52,211,153,.055)}
      .bx-cv2-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:14px 0}.bx-cv2-kpi{padding:12px;border:1px solid var(--cv2bd);border-radius:13px;background:#081425}.bx-cv2-kpi small{display:block;color:var(--mut);font-size:10px}.bx-cv2-kpi b{display:block;font-size:22px;margin-top:4px}
      .bx-cv2-config{padding:16px;border:1px solid var(--cv2bd);border-radius:16px;background:#081425;margin-bottom:12px}.bx-cv2-config-grid{display:grid;grid-template-columns:1.3fr 1.3fr .7fr;gap:10px}.bx-cv2-config label{font-size:11px;color:var(--mut)}.bx-cv2-config select{margin-top:6px}.bx-cv2-days{display:flex;gap:6px;flex-wrap:wrap;margin-top:11px}.bx-cv2-day{display:flex;align-items:center;gap:5px;padding:8px 9px;border:1px solid var(--cv2bd);border-radius:10px;background:#0a172a;color:#cbd8ec;font-size:11px}.bx-cv2-day input{width:auto;margin:0}.bx-cv2-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      .bx-cv2-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:13px 0}.bx-cv2-tab{border:1px solid var(--cv2bd);background:#091426;color:#aebdd2;padding:10px 14px;border-radius:11px;cursor:pointer;font-weight:800}.bx-cv2-tab.active{background:#3478f6;border-color:#5d98ff;color:#fff}
      .bx-cv2-daybox{margin:11px 0;border:1px solid var(--cv2bd);border-radius:16px;overflow:hidden;background:#071221}.bx-cv2-dayhead{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px 15px;background:#0a192f}.bx-cv2-dayhead h3{margin:0;text-transform:capitalize}.bx-cv2-dayhead small{color:var(--mut)}
      .bx-cv2-task{position:relative;padding:15px;border-top:1px solid var(--cv2bd);display:grid;grid-template-columns:90px minmax(0,1fr) auto;gap:13px;align-items:start}.bx-cv2-task.completed{opacity:.67}.bx-cv2-task.cancelled{opacity:.5}.bx-cv2-priority{font-size:10px;font-weight:900;text-transform:uppercase;padding:6px 8px;border-radius:999px;display:inline-block;text-align:center}.bx-cv2-priority.muito-alta{background:rgba(251,113,133,.14);color:#fda4af;border:1px solid rgba(251,113,133,.3)}.bx-cv2-priority.alta{background:rgba(251,191,36,.12);color:#fcd34d;border:1px solid rgba(251,191,36,.27)}.bx-cv2-priority.media{background:rgba(77,141,255,.12);color:#93c5fd;border:1px solid rgba(77,141,255,.27)}.bx-cv2-priority.manutencao{background:rgba(52,211,153,.1);color:#86efac;border:1px solid rgba(52,211,153,.25)}
      .bx-cv2-task h4{margin:0 0 5px;font-size:15px;line-height:1.35}.bx-cv2-task-reason{font-size:12px;color:var(--mut);line-height:1.45}.bx-cv2-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.bx-cv2-meta span{font-size:10px;padding:5px 7px;border-radius:8px;border:1px solid var(--cv2bd);color:#adc0da;background:#09172a}
      .bx-cv2-resources{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.bx-cv2-resource{border:1px solid rgba(77,141,255,.3);background:rgba(77,141,255,.08);color:#cde0ff;border-radius:9px;padding:7px 9px;font-size:11px;cursor:pointer}.bx-cv2-resource:hover{border-color:#6ea4ff;background:rgba(77,141,255,.16)}
      .bx-cv2-task-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.bx-cv2-task-actions .btn{white-space:nowrap}.bx-cv2-duration{font-size:18px;font-weight:900;text-align:right;margin-bottom:8px}
      .bx-cv2-empty{padding:25px;text-align:center;border:1px dashed var(--cv2bd);border-radius:14px;color:var(--mut);background:#071221}.bx-cv2-loading{padding:30px;text-align:center;color:var(--mut)}
      .bx-cv2-next{margin:13px 0;padding:17px;border:1px solid rgba(77,141,255,.4);border-radius:16px;background:linear-gradient(135deg,rgba(77,141,255,.13),rgba(52,211,153,.055));display:flex;justify-content:space-between;gap:12px;align-items:center}.bx-cv2-next h3{margin:4px 0}.bx-cv2-status{font-size:10px;font-weight:900;padding:5px 8px;border-radius:99px}.bx-cv2-status.completed{background:rgba(52,211,153,.13);color:#86efac}.bx-cv2-status.cancelled{background:rgba(251,113,133,.12);color:#fda4af}.bx-cv2-status.scheduled{background:rgba(77,141,255,.12);color:#93c5fd}
      #bxCronTodayDashboard{margin:13px 0}.bx-cv2-dashboard{padding:16px;border:1px solid rgba(77,141,255,.35);border-radius:16px;background:linear-gradient(135deg,rgba(77,141,255,.10),rgba(7,18,36,.96))}.bx-cv2-dashboard .bx-cv2-next{margin:8px 0 0}
      @media(max-width:1000px){.bx-cv2-config-grid{grid-template-columns:1fr 1fr}.bx-cv2-kpis{grid-template-columns:repeat(2,1fr)}.bx-cv2-task{grid-template-columns:80px 1fr}.bx-cv2-task>div:last-child{grid-column:2}.bx-cv2-task-actions{justify-content:flex-start}.bx-cv2-duration{text-align:left}}
      @media(max-width:680px){.bx-cv2-hero-top,.bx-cv2-next{flex-direction:column;align-items:stretch}.bx-cv2-config-grid,.bx-cv2-kpis{grid-template-columns:1fr}.bx-cv2-task{grid-template-columns:1fr}.bx-cv2-task>div:last-child{grid-column:1}.bx-cv2-duration{text-align:left}.bx-cv2-tabs{display:grid;grid-template-columns:1fr 1fr}.bx-cv2-tab{width:100%}}
    `;document.head.appendChild(st);
  }

  function allowedCompetitions(){
    return (activeBoot().competitions||[]).filter(c=>['gcm-sp-2026','pmesp-soldado-2026'].includes(String(c.slug||'')));
  }
  function compLabel(c){return String(c.slug||'').startsWith('gcm-')?'GCM Geral':'PM SP — Soldado'}
  function coursesFor(cid){return(activeBoot().courses||[]).filter(c=>c.competition_id===cid)}
  function dayChecks(days){return DOW.slice(1).map((d,i)=>`<label class="bx-cv2-day"><input type="checkbox" name="bxCv2Day" value="${i+1}" ${days.includes(i+1)?'checked':''}>${d.replace('-feira','')}</label>`).join('')}
  function hoursOptions(n){return Array.from({length:10},(_,i)=>i+1).map(v=>`<option value="${v}" ${v===Number(n)?'selected':''}>${v} ${v===1?'hora':'horas'}</option>`).join('')}
  function competitionOptions(selected){return allowedCompetitions().map(c=>`<option value="${esc(c.id)}" ${c.id===selected?'selected':''}>${esc(compLabel(c))}</option>`).join('')}
  function courseOptions(cid,selected){return coursesFor(cid).map(c=>`<option value="${esc(c.id)}" ${c.id===selected?'selected':''}>${esc(c.title)}</option>`).join('')}

  function statusLabel(s,ev){
    if(s==='completed')return'Concluído';
    if(s==='cancelled'&&ev?.metadata?.student_status==='missed')return'Não realizado';
    if(s==='cancelled')return'Reorganizado';
    return'Programado';
  }
  function priorityClass(v){return String(v||'Média').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')}
  function taskType(v){const m={estudo_focado:'Estudo focado',caderno_de_erros:'Caderno de erros',revisao:'Revisão inteligente',revisao_semanal:'Revisão semanal',recuperacao:'Recuperação',questoes:'Questões',simulado:'Simulado',redacao:'Redação'};return m[v]||String(v||'Estudo').replaceAll('_',' ')}

  function implicitLinks(ev){
    const a=[...(ev.resource_links||[])];
    if(ev.study_type==='caderno_de_erros')a.unshift({type:'erros',label:'Abrir Caderno de Erros',page:'erros',subject_id:ev.subject_id,topic_id:ev.topic_id});
    if(['revisao','revisao_semanal','recuperacao'].includes(ev.study_type))a.unshift({type:'revisoes',label:'Abrir Revisões',page:'revisoes',subject_id:ev.subject_id,topic_id:ev.topic_id});
    return a.filter((x,i)=>a.findIndex(y=>y.type===x.type&&y.page===x.page)===i);
  }

  function taskCard(ev){
    const pc=priorityClass(ev.priority_level),status=statusLabel(ev.status,ev),links=implicitLinks(ev);
    return `<article class="bx-cv2-task ${esc(ev.status)}" data-event="${esc(ev.id)}">
      <div><span class="bx-cv2-priority ${pc}">${esc(ev.priority_level||'Média')}</span><div class="bx-cv2-meta"><span>${esc(taskType(ev.study_type))}</span><span class="bx-cv2-status ${esc(ev.status)}">${esc(status)}</span></div></div>
      <div><h4>${esc(ev.title)}</h4><div class="bx-cv2-task-reason"><b>Por que agora:</b> ${esc(ev.reason||'Prioridade calculada pelo seu desempenho e pelo edital.')}</div><div class="bx-cv2-resources">${links.map((r,i)=>`<button class="bx-cv2-resource" data-resource="${esc(ev.id)}|${i}">${esc(r.label||'Abrir conteúdo')}</button>`).join('')||'<span class="mut">Conteúdo em organização editorial.</span>'}</div></div>
      <div><div class="bx-cv2-duration">${Number(ev.duration_minutes||0)} min</div><div class="bx-cv2-task-actions">${ev.status==='scheduled'?`<button class="btn green" data-task-done="${esc(ev.id)}">✓ Concluí</button><button class="btn" data-task-missed="${esc(ev.id)}">Não realizei</button>`:''}</div></div>
    </article>`;
  }

  function grouped(events){const m=new Map();events.forEach(e=>{if(!m.has(e.event_date))m.set(e.event_date,[]);m.get(e.event_date).push(e)});return m}
  function rangeEvents(){
    if(!S.data)return[];const t=isoToday(),days=S.tab==='hoje'?1:S.tab==='semana'?7:S.tab==='quinzena'?15:30,end=addDays(t,days-1);
    return(S.data.events||[]).filter(e=>e.event_date>=t&&e.event_date<=end);
  }
  function scheduleHtml(){
    const ev=rangeEvents(),g=grouped(ev);if(!ev.length)return`<div class="bx-cv2-empty">Nenhuma tarefa programada neste período. Se hoje for um dia livre, use “Recalcular agora” para atualizar sua disponibilidade.</div>`;
    return[...g.entries()].map(([date,rows])=>`<section class="bx-cv2-daybox"><div class="bx-cv2-dayhead"><h3>${esc(formatDate(date))}</h3><small>${rows.filter(x=>x.status==='completed').length}/${rows.length} concluídas • ${rows.reduce((n,x)=>n+Number(x.duration_minutes||0),0)} min</small></div>${rows.map(taskCard).join('')}</section>`).join('');
  }

  function kpis(data){const all=data.events||[],scheduled=all.filter(x=>x.status==='scheduled'),done=all.filter(x=>x.status==='completed'),today=isoToday(),todayCount=all.filter(x=>x.event_date===today&&x.status==='scheduled').length,high=scheduled.filter(x=>['Muito alta','Alta'].includes(x.priority_level)).length;return`<div class="bx-cv2-kpis"><div class="bx-cv2-kpi"><small>PARA HOJE</small><b>${todayCount}</b></div><div class="bx-cv2-kpi"><small>PRIORIDADE ALTA</small><b>${high}</b></div><div class="bx-cv2-kpi"><small>CONCLUÍDAS NO PLANO</small><b>${done.length}</b></div><div class="bx-cv2-kpi"><small>HORIZONTE</small><b>30 dias</b></div></div>`}
  function aiSummary(data){const a=data.ai_analysis||{},summary=clean(a.summary)||'O plano cruza incidência do edital, seus erros, revisões, desempenho e o conteúdo realmente disponível.';return`<div class="bx-cv2-ai"><b>🧠 Leitura da IA</b><p style="margin:5px 0 0">${esc(summary)}</p></div>`}

  function render(){
    const sec=qs('cronograma');if(!sec||!S.data)return;S.rendering=true;injectStyle();sec.dataset.bxCronV2='1';const c=S.data.context||{},plan=S.data.plan||{},days=(plan.plan_data?.settings?.days||c.days||[1,2,3,4,5]).map(Number),cid=c.competition_id||c.competition?.id||'',courseId=c.course_id||c.course?.id||'',daily=Number(plan.daily_hours||c.daily_hours||2);
    sec.innerHTML=`<div id="bxCronV2Root">
      <div class="bx-cv2-hero"><div class="bx-cv2-hero-top"><div><span class="ey">CENTRAL DE ESTUDOS PERSONALIZADA</span><h1>Cronograma Inteligente</h1><p>Abra e saiba exatamente <b>o que estudar hoje</b>, qual assunto é prioritário, quanto tempo dedicar e qual recurso do Bizu X usar.</p></div><span class="pill">${esc(S.data.planner_mode||'IA + desempenho real')}</span></div>${aiSummary(S.data)}${kpis(S.data)}</div>
      <div class="bx-cv2-config"><div class="bx-cv2-config-grid"><label>Concurso<select id="bxCv2Competition">${competitionOptions(cid)}</select></label><label>Turma<select id="bxCv2Course">${courseOptions(cid,courseId)}</select></label><label>Horas por dia<select id="bxCv2Hours">${hoursOptions(daily)}</select></label></div><div><small class="mut">Dias disponíveis para estudo</small><div class="bx-cv2-days" id="bxCv2Days">${dayChecks(days)}</div></div><div class="bx-cv2-actions"><button class="btn primary" id="bxCv2Generate">✦ Gerar com minha disponibilidade</button><button class="btn" id="bxCv2Recalc">↻ Recalcular com meu desempenho</button><span class="mut" id="bxCv2Msg"></span></div></div>
      <div class="bx-cv2-tabs"><button class="bx-cv2-tab ${S.tab==='hoje'?'active':''}" data-cv2-tab="hoje">Hoje</button><button class="bx-cv2-tab ${S.tab==='semana'?'active':''}" data-cv2-tab="semana">Semanal</button><button class="bx-cv2-tab ${S.tab==='quinzena'?'active':''}" data-cv2-tab="quinzena">Quinzenal</button><button class="bx-cv2-tab ${S.tab==='mes'?'active':''}" data-cv2-tab="mes">Mensal</button></div>
      <div id="bxCv2Schedule">${scheduleHtml()}</div>
    </div>`;
    wire();renderDashboardToday();S.lastRender=Date.now();setTimeout(()=>{S.rendering=false},80);
  }

  function wire(){
    const comp=qs('bxCv2Competition'),course=qs('bxCv2Course');
    if(comp)comp.onchange=()=>{const cs=coursesFor(comp.value),cur=cs[0]?.id||'';course.innerHTML=courseOptions(comp.value,cur)};
    document.querySelectorAll('[data-cv2-tab]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.cv2Tab;render()});
    if(qs('bxCv2Generate'))qs('bxCv2Generate').onclick=generate;
    if(qs('bxCv2Recalc'))qs('bxCv2Recalc').onclick=recalculate;
    document.querySelectorAll('[data-task-done]').forEach(b=>b.onclick=()=>setStatus(b.dataset.taskDone,'completed'));
    document.querySelectorAll('[data-task-missed]').forEach(b=>b.onclick=()=>setStatus(b.dataset.taskMissed,'missed'));
    document.querySelectorAll('[data-resource]').forEach(b=>b.onclick=()=>{const[id,idx]=b.dataset.resource.split('|'),ev=(S.data.events||[]).find(x=>x.id===id),r=implicitLinks(ev||{})[Number(idx)];if(ev&&r)openResource(ev,r)});
  }

  async function generate(){
    const days=[...document.querySelectorAll('[name="bxCv2Day"]:checked')].map(x=>Number(x.value));const msg=qs('bxCv2Msg');if(!days.length){msg.textContent='Selecione pelo menos um dia.';return}const btn=qs('bxCv2Generate');btn.disabled=true;msg.textContent='Analisando edital, desempenho, erros e materiais...';
    try{S.data=await api('generate',{method:'POST',body:JSON.stringify({competition_id:qs('bxCv2Competition').value,course_id:qs('bxCv2Course').value,daily_hours:Number(qs('bxCv2Hours').value),days})});S.tab='hoje';render();msg.textContent='Cronograma atualizado.'}catch(e){msg.textContent=e.message}finally{btn.disabled=false}
  }
  async function recalculate(){const btn=qs('bxCv2Recalc'),msg=qs('bxCv2Msg');btn.disabled=true;msg.textContent='Recalculando prioridades com seu desempenho mais recente...';try{S.data=await api('recalculate',{method:'POST',body:'{}'});render();msg.textContent='Prioridades reorganizadas.'}catch(e){msg.textContent=e.message}finally{btn.disabled=false}}
  async function setStatus(id,status){const el=document.querySelector(`[data-event="${CSS.escape(id)}"]`);if(el)el.style.opacity='.55';try{const d=await api('status',{method:'POST',body:JSON.stringify({event_id:id,status})});S.data=d;render()}catch(e){alert(e.message);if(el)el.style.opacity=''}}

  function goPage(page){if(typeof window.jump==='function'){try{window.jump(page);return}catch{}}const b=document.querySelector(`.side .nav [data-p="${CSS.escape(page)}"],nav [data-p="${CSS.escape(page)}"]`);if(b){b.click();return}document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===page));}
  function openResource(ev,r){
    const page=r.page||'turmas';goPage(page);
    setTimeout(()=>{
      if(page==='turmas'){
        const sb=document.querySelector(`[data-sub="${CSS.escape(r.subject_id||ev.subject_id||'')}"]`);if(sb)sb.click();
        setTimeout(()=>{const st=document.querySelector(`[data-study="${CSS.escape(r.topic_id||ev.topic_id||'')}"]`);if(st)st.click()},120);
      }else if(page==='questoes'){
        const s=qs('qSubject');if(s){s.value=r.subject_id||ev.subject_id||'';s.dispatchEvent(new Event('change',{bubbles:true}))}
        setTimeout(()=>{const t=qs('bxQTopic');if(t)t.value=r.topic_id||ev.topic_id||'';const load=qs('qLoad');if(load)load.click()},100);
      }else if(page==='flashcards'){
        const s=qs('bxFlashSubject');if(s){s.value=r.subject_id||ev.subject_id||'';s.dispatchEvent(new Event('change',{bubbles:true}))}
        setTimeout(()=>{const t=qs('bxFlashTopic');if(t)t.value=r.topic_id||ev.topic_id||'';const load=qs('bxFlashLoad');if(load)load.click()},100);
      }else if(page==='simulados'&&r.resource_id){setTimeout(()=>{const b=document.querySelector(`[data-sim-start="${CSS.escape(r.resource_id)}"]`);if(b)b.click()},120)}
      else if(page==='redacao'&&r.resource_id){setTimeout(()=>{const b=document.querySelector(`[data-et="${CSS.escape(r.resource_id)}"]`);if(b)b.click()},120)}
    },70);
  }

  function renderDashboardToday(){
    const dash=qs('dashboard');if(!dash||!S.data)return;let box=qs('bxCronTodayDashboard');if(!box){box=document.createElement('div');box.id='bxCronTodayDashboard';const anchor=qs('bxNextAction')||dash.querySelector('.brand-hero')||dash.querySelector('.head');anchor?.insertAdjacentElement('afterend',box)}
    const t=isoToday(),today=(S.data.events||[]).filter(x=>x.event_date===t&&x.status==='scheduled'),next=today[0]||(S.data.events||[]).find(x=>x.event_date>=t&&x.status==='scheduled');
    if(!next){box.innerHTML='';return}box.innerHTML=`<div class="bx-cv2-dashboard"><span class="ey">O QUE ESTUDAR ${next.event_date===t?'HOJE':'A SEGUIR'}</span><div class="bx-cv2-next"><div><h3>${esc(next.title)}</h3><p class="mut">${Number(next.duration_minutes||0)} min • prioridade ${esc(next.priority_level||'Média')} • ${esc(next.reason||'')}</p></div><button class="btn primary" id="bxCv2DashboardOpen">Abrir meu cronograma</button></div></div>`;qs('bxCv2DashboardOpen').onclick=()=>{goPage('cronograma');setTimeout(render,60)};
  }

  async function load(force=false){if(S.loading)return;S.loading=true;const sec=qs('cronograma');if(sec&&!S.data)sec.innerHTML='<div class="bx-cv2-loading">Montando sua Central de Estudos Personalizada...</div>';try{S.data=await api(force?'recalculate':'dashboard',{method:force?'POST':'GET',...(force?{body:'{}'}:{})});render()}catch(e){if(sec)sec.innerHTML=`<div class="card status-bad"><h3>Não foi possível abrir o Cronograma Inteligente.</h3><p>${esc(e.message)}</p><button class="btn" id="bxCv2Retry">Tentar novamente</button></div>`;setTimeout(()=>{const b=qs('bxCv2Retry');if(b)b.onclick=()=>load()},0)}finally{S.loading=false}}

  function ensure(){const sec=qs('cronograma');if(!sec)return;if(!S.data){load();return}if(!qs('bxCronV2Root')&&!S.rendering)render();else renderDashboardToday()}
  injectStyle();
  let tries=0,t=setInterval(()=>{tries++;if(window.BX&&BX.boot&&qs('cronograma')){clearInterval(t);load()}else if(tries>80)clearInterval(t)},250);
  document.addEventListener('click',ev=>{const b=ev.target&&ev.target.closest&&ev.target.closest('[data-p="cronograma"]');if(b)setTimeout(ensure,40)},true);
  const mo=new MutationObserver(()=>{if(S.rendering)return;const sec=qs('cronograma');if(sec&&S.data&&!qs('bxCronV2Root'))setTimeout(ensure,40)});mo.observe(document.documentElement,{childList:true,subtree:true});
})();
