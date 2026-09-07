(function(){
  if(window.__bxQuestionsV2)return;
  window.__bxQuestionsV2=true;

  const state={questions:[],index:0,startedAt:0,loadSeq:0,loadButton:null,courseSignature:''};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const qs=id=>document.getElementById(id);
  const clean=v=>String(v??'').trim();
  const subjects=()=>window.BX?.boot?.learning?.subjects||[];
  const activeCourseId=()=>window.BX?.boot?.profile?.target_course_id||window.BX?.boot?.context?.course?.id||'';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  async function request(url,opt={}){
    const options={credentials:'include',cache:'no-store',...opt};
    if(opt.body&&!options.headers)options.headers={'content-type':'application/json'};
    const r=await fetch(url,options);
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.message||d.error||('HTTP '+r.status));
    return d;
  }

  function shuffle(items){
    const a=items.slice();
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
    return a;
  }

  function optionPairs(options){
    if(Array.isArray(options))return options.map((text,i)=>({label:'ABCDE'[i]||String(i+1),text}));
    if(options&&typeof options==='object'){
      return Object.entries(options).map(([key,text],i)=>({label:/^[A-E]$/i.test(key)?key.toUpperCase():('ABCDE'[i]||key),text}));
    }
    return [];
  }

  function ensureStatus(){
    const page=qs('questoes');
    if(!page)return null;
    let status=qs('bxQuestionsV2Status');
    if(!status){
      status=document.createElement('div');
      status.id='bxQuestionsV2Status';
      status.className='mut';
      status.style.cssText='margin:10px 0;min-height:20px';
      const grid=page.querySelector('.control-grid');
      (grid||page.querySelector('.head')||page).insertAdjacentElement('afterend',status);
    }
    return status;
  }

  function setStatus(text,bad=false){
    const e=ensureStatus();
    if(!e)return;
    e.textContent=text;
    e.style.color=bad?'#fda4af':'';
  }

  function renameUI(){
    const page=qs('questoes');
    if(page){
      const h=page.querySelector('.head h1');
      if(h&&/banco\s+de\s+quest/i.test(h.textContent||''))h.textContent='Questões';
      const p=page.querySelector('.head p');
      if(p)p.textContent='Filtre o acervo completo do curso, responda e receba correção comentada imediatamente.';
    }
    document.querySelectorAll('.nav [data-p="questoes"]').forEach(b=>{if(/banco\s+de\s+quest/i.test(b.textContent||''))b.textContent='❓ Questões'});
  }

  function ensureSourceFilter(){
    const s=qs('bxQSource');
    if(!s)return;
    const labels={original:'Original',shared_course:'Compartilhada entre cursos',official:'Fonte oficial'};
    const current=s.value;
    const wanted=['','original','shared_course','official'];
    s.innerHTML=wanted.map(v=>'<option value="'+v+'">'+(v?labels[v]:'Todos os tipos')+'</option>').join('');
    if(wanted.includes(current))s.value=current;
  }

  function syncTopicOptions(preserve=true){
    const sub=qs('qSubject'),topic=qs('bxQTopic');
    if(!sub||!topic)return;
    const old=preserve?topic.value:'';
    const selected=subjects().find(s=>s.id===sub.value);
    const list=selected?.topics||[];
    topic.innerHTML='<option value="">Todos os assuntos</option>'+list.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name)+'</option>').join('');
    if(old&&list.some(t=>t.id===old))topic.value=old;
  }

  function courseSignature(){
    return activeCourseId()+'|'+subjects().map(s=>s.id+':'+(s.topics||[]).map(t=>t.id).join(',')).join(';');
  }

  function baseFilters(subjectId){
    const p=new URLSearchParams();
    const cid=activeCourseId();
    if(cid)p.set('course_id',cid);
    if(subjectId)p.set('subject_id',subjectId);
    const topic=clean(qs('bxQTopic')?.value);
    if(topic)p.set('topic_id',topic);
    const difficulty=clean(qs('qDifficulty')?.value);
    if(difficulty&&!['todas','todos','all','variada'].includes(difficulty.toLowerCase()))p.set('difficulty',difficulty);
    const banca=clean(qs('bxQBanca')?.value);if(banca)p.set('banca',banca);
    const year=clean(qs('bxQYear')?.value);if(year)p.set('year',year);
    const source=clean(qs('bxQSource')?.value);if(source)p.set('source_type',source);
    const search=clean(qs('bxQSearch')?.value);if(search)p.set('q',search);
    p.set('limit','100');
    return p;
  }

  async function fetchSubject(subjectId){
    const d=await request('/api/integrated/questions?'+baseFilters(subjectId).toString());
    return Array.isArray(d.questions)?d.questions:[];
  }

  async function loadQuestionsV2(){
    const seq=++state.loadSeq;
    const root=qs('questionReal');
    if(!root)return;
    renameUI();ensureSourceFilter();syncTopicOptions(true);
    root.innerHTML='<div class="bx-loading">Selecionando o acervo completo do curso ativo...</div>';
    setStatus('Carregando questões publicadas e revisadas...');
    const selectedSubject=clean(qs('qSubject')?.value);
    try{
      let lists;
      if(selectedSubject){
        lists=[await fetchSubject(selectedSubject)];
      }else{
        const ids=subjects().map(s=>s.id).filter(Boolean);
        lists=ids.length?await Promise.all(ids.map(fetchSubject)):[await fetchSubject('')];
      }
      if(seq!==state.loadSeq)return;
      const byId=new Map();
      lists.flat().forEach(q=>{if(q?.id)byId.set(q.id,q)});
      state.questions=shuffle([...byId.values()]);
      state.index=0;
      state.startedAt=Date.now();
      setStatus(state.questions.length+' questão(ões) encontrada(s) no filtro atual • ordem embaralhada.');
      drawQuestionV2();
    }catch(e){
      if(seq!==state.loadSeq)return;
      root.innerHTML='<p class="status-bad">'+esc(e.message)+'</p>';
      setStatus('Não foi possível carregar as questões.',true);
    }
  }

  function sourceLabel(q){
    if(q.source_type==='shared_course')return'Compartilhada entre cursos';
    if(q.source_type==='official')return'Fonte oficial';
    return q.source_type==='original'?'Original':'';
  }

  function feedbackHtml(d,selected){
    const parts=[];
    if(!d.correct&&clean(d.explanation_incorrect))parts.push('<div><b>Por que esta alternativa está errada</b><p>'+esc(d.explanation_incorrect)+'</p></div>');
    const main=clean(d.explanation_correct)||clean(d.commentary);
    if(main)parts.push('<div><b>Comentário da questão</b><p>'+esc(main)+'</p></div>');
    if(clean(d.commentary)&&clean(d.commentary)!==main)parts.push('<div><b>Complemento</b><p>'+esc(d.commentary)+'</p></div>');
    if(clean(d.bizu))parts.push('<div class="bx-bizu"><b>⚡ Bizu:</b> '+esc(d.bizu)+'</div>');
    if(d.official_reference){
      const ref=typeof d.official_reference==='string'?d.official_reference:JSON.stringify(d.official_reference);
      parts.push('<details style="margin-top:10px"><summary>Referência</summary><p>'+esc(ref)+'</p></details>');
    }
    return '<div class="bx-feedback"><h3>'+(d.correct?'✓ Resposta correta':'✕ Resposta incorreta')+' • gabarito '+esc(d.correct_option)+'</h3>'+parts.join('')+'</div>';
  }

  function drawQuestionV2(){
    const root=qs('questionReal'),q=state.questions[state.index];
    if(!root)return;
    if(!q){root.innerHTML='<div class="empty">Nenhuma questão encontrada. Ajuste os filtros ou escolha outra matéria.</div>';return}
    state.startedAt=Date.now();
    const pairs=optionPairs(q.options);
    const meta=[
      'Questão '+(state.index+1)+' de '+state.questions.length,
      q.bizu_subjects?.name,
      q.bizu_topics?.name,
      q.banca,
      q.year,
      q.difficulty,
      sourceLabel(q)
    ].filter(Boolean).map(esc).join(' • ');
    root.innerHTML='<div class="qmeta">'+meta+'</div><h2>'+esc(q.statement)+'</h2>'+pairs.map(o=>'<button class="option" data-bxq-opt="'+esc(o.label)+'"><b>'+esc(o.label)+')</b> '+esc(o.text)+'</button>').join('')+'<div id="bxQuestionsV2Feedback"></div><div class="bx-final-actions" style="margin-top:12px"><button class="btn" id="bxQuestionsV2Prev">← Anterior</button><button class="btn primary" id="bxQuestionsV2Next">Próxima →</button></div>';
    root.querySelectorAll('[data-bxq-opt]').forEach(btn=>btn.onclick=()=>answerQuestion(q,btn));
    qs('bxQuestionsV2Prev').onclick=()=>{if(state.index>0){state.index--;drawQuestionV2()}};
    qs('bxQuestionsV2Next').onclick=()=>{if(state.index<state.questions.length-1){state.index++;drawQuestionV2()}else{state.index=0;state.questions=shuffle(state.questions);drawQuestionV2()}};
  }

  async function answerQuestion(q,button){
    const root=qs('questionReal');
    const buttons=[...root.querySelectorAll('[data-bxq-opt]')];
    buttons.forEach(b=>b.disabled=true);
    const selected=button.dataset.bxqOpt;
    try{
      const d=await request('/api/integrated/questions/attempt',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({question_id:q.id,selected_option:selected,elapsed_seconds:Math.max(1,Math.round((Date.now()-state.startedAt)/1000)),source_context:'bank_filtered_v2'})
      });
      button.classList.add(d.correct?'correct':'wrong');
      if(!d.correct){
        const correct=buttons.find(b=>String(b.dataset.bxqOpt).toUpperCase()===String(d.correct_option).toUpperCase());
        if(correct)correct.classList.add('correct');
      }
      qs('bxQuestionsV2Feedback').innerHTML=feedbackHtml(d,selected);
      setStatus((d.correct?'Acerto registrado. ':'Erro enviado ao Caderno de Erros e às Revisões Inteligentes. ')+(state.index+1)+' de '+state.questions.length+'.');
    }catch(e){
      buttons.forEach(b=>b.disabled=false);
      qs('bxQuestionsV2Feedback').innerHTML='<p class="status-bad">'+esc(e.message)+'</p>';
    }
  }

  function wireBank(){
    const load=qs('qLoad');
    if(!load)return false;
    renameUI();ensureSourceFilter();ensureStatus();
    if(state.loadButton!==load){
      state.loadButton=load;
      load.onclick=ev=>{ev?.preventDefault?.();loadQuestionsV2()};
    }
    const sub=qs('qSubject');
    if(sub&&!sub.dataset.bxQuestionsV2){
      sub.dataset.bxQuestionsV2='1';
      sub.addEventListener('change',()=>syncTopicOptions(false));
    }
    const sig=courseSignature();
    if(sig!==state.courseSignature){state.courseSignature=sig;syncTopicOptions(false)}
    return true;
  }

  document.addEventListener('click',async ev=>{
    const btn=ev.target?.closest?.('#bxTopicPanel [data-tq]');
    if(!btn)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    const topicId=btn.dataset.tq;
    const subject=subjects().find(s=>(s.topics||[]).some(t=>t.id===topicId));
    const nav=document.querySelector('.nav [data-p="questoes"]');
    if(nav)nav.click();
    await sleep(40);
    wireBank();
    const sub=qs('qSubject');
    if(sub&&subject){sub.value=subject.id;syncTopicOptions(false)}
    const topic=qs('bxQTopic');if(topic)topic.value=topicId||'';
    loadQuestionsV2();
  },true);

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    wireBank();
    if(tries>240)clearInterval(timer);
  },500);
})();
