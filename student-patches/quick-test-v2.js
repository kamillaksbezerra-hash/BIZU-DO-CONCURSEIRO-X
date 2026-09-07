(function(){
  if(window.__bxQuickTestV2)return;
  window.__bxQuickTestV2=true;

  const S={testId:null,questions:[],answers:{},index:0,started:{},course:null,startButton:null};
  const el=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt=v=>String(v??'').trim();
  const currentCourse=()=>window.BX?.boot?.profile?.target_course_id||window.BX?.boot?.context?.course?.id||'';

  async function req(url,opt={}){
    const options={credentials:'include',cache:'no-store',...opt};
    if(opt.body&&!options.headers)options.headers={'content-type':'application/json'};
    const r=await fetch(url,options),d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.message||d.error||('HTTP '+r.status));
    return d;
  }

  function shuffle(a){
    a=a.slice();
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
    return a;
  }

  function optionPairs(options){
    if(Array.isArray(options))return options.map((text,i)=>({label:'ABCDE'[i]||String(i+1),text}));
    if(options&&typeof options==='object')return Object.entries(options).map(([k,text],i)=>({label:/^[A-E]$/i.test(k)?k.toUpperCase():('ABCDE'[i]||k),text}));
    return [];
  }

  function ensureStyle(){
    if(document.getElementById('bxQuickTestV2Style'))return;
    const s=document.createElement('style');
    s.id='bxQuickTestV2Style';
    s.textContent='.bx-qt-selected{outline:2px solid rgba(96,165,250,.75);background:rgba(59,130,246,.12)!important}.bx-qt-progress{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.bx-qt-dot{width:28px;height:28px;border-radius:8px;border:1px solid rgba(106,137,190,.3);display:grid;place-items:center;font-size:11px;cursor:pointer}.bx-qt-dot.done{font-weight:900;border-color:rgba(96,165,250,.8)}.bx-qt-review{margin:12px 0;padding:14px;border:1px solid rgba(106,137,190,.25);border-radius:14px}.bx-qt-review.ok{border-left:4px solid #22c55e}.bx-qt-review.bad{border-left:4px solid #ef445b}.bx-qt-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.bx-qt-actions .btn{margin-top:0}.bx-qt-answer{margin:7px 0;color:#b8c6dc}.bx-qt-comment{white-space:pre-wrap;color:#b8c6dc}';
    document.head.appendChild(s);
  }

  function ensureStatus(){
    const box=el('qtBox');
    if(!box)return null;
    let s=el('bxQuickTestV2Status');
    if(!s){s=document.createElement('div');s.id='bxQuickTestV2Status';s.className='mut';s.style.cssText='margin:10px 0;min-height:20px';box.parentElement?.insertBefore(s,box)}
    return s;
  }

  function status(message,bad=false){const s=ensureStatus();if(s){s.textContent=message;s.style.color=bad?'#fda4af':''}}

  function enhanceControls(){
    const mode=el('qtMode'),course=el('qtCourse');
    if(mode){
      const old=mode.value;
      mode.innerHTML='<option value="rapido">Rápido • prioriza enunciados curtos</option><option value="random">Aleatório</option><option value="inteligente">Inteligente • prioriza dificuldades</option>';
      mode.value=['rapido','random','inteligente'].includes(old)?old:'rapido';
    }
    if(course&&!course.dataset.bxQtV2){
      course.dataset.bxQtV2='1';
      course.addEventListener('change',()=>{
        const sub=el('qtSubject');
        if(sub&&course.value!==currentCourse()){
          sub.value='';
          sub.disabled=true;
          status('Curso diferente do contexto atual: o teste usará todas as matérias desse curso.');
        }else if(sub){sub.disabled=false;status('Curso atual selecionado. Você pode filtrar por matéria.')}
      });
    }
  }

  function questionMeta(q){
    return [q.bizu_subjects?.name,q.bizu_topics?.name,q.difficulty,q.banca,q.year].filter(Boolean).map(esc).join(' • ');
  }

  function draw(){
    const box=el('qtBox'),q=S.questions[S.index];
    if(!box)return;
    if(!q){box.innerHTML='<div class="empty">Nenhuma questão disponível para este filtro.</div>';return}
    if(!S.started[q.id])S.started[q.id]=Date.now();
    const selected=S.answers[q.id]?.selected_option||'';
    const dots=S.questions.map((item,i)=>'<button type="button" class="bx-qt-dot '+(S.answers[item.id]?'done':'')+'" data-bx-qt-go="'+i+'">'+(i+1)+'</button>').join('');
    box.innerHTML='<div class="qmeta">Questão '+(S.index+1)+' de '+S.questions.length+(questionMeta(q)?' • '+questionMeta(q):'')+'</div><div class="bx-qt-progress">'+dots+'</div><h2>'+esc(q.statement)+'</h2>'+optionPairs(q.options).map(o=>'<button type="button" class="option '+(selected===o.label?'bx-qt-selected':'')+'" data-bx-qt-opt="'+esc(o.label)+'"><b>'+esc(o.label)+')</b> '+esc(o.text)+'</button>').join('')+'<div class="bx-qt-actions"><button type="button" class="btn" id="bxQtPrev">← Anterior</button><button type="button" class="btn" id="bxQtNext">Próxima →</button><button type="button" class="btn primary" id="bxQtFinish">Finalizar teste</button></div>';
    box.querySelectorAll('[data-bx-qt-opt]').forEach(b=>b.onclick=()=>{
      const elapsed=Math.max(1,Math.round((Date.now()-(S.started[q.id]||Date.now()))/1000));
      S.answers[q.id]={question_id:q.id,selected_option:b.dataset.bxQtOpt,elapsed_seconds:elapsed};
      draw();
    });
    box.querySelectorAll('[data-bx-qt-go]').forEach(b=>b.onclick=()=>{S.index=Number(b.dataset.bxQtGo)||0;draw()});
    el('bxQtPrev').onclick=()=>{if(S.index>0){S.index--;draw()}};
    el('bxQtNext').onclick=()=>{if(S.index<S.questions.length-1){S.index++;draw()}else status('Você chegou à última questão. Finalize quando todas estiverem respondidas.')};
    el('bxQtFinish').onclick=finish;
    const done=Object.keys(S.answers).length;
    status(done+' de '+S.questions.length+' respondida(s). O gabarito permanece oculto até finalizar.');
  }

  async function start(){
    const box=el('qtBox');if(!box)return;
    const course=txt(el('qtCourse')?.value)||currentCourse();
    const subject=el('qtSubject')&&!el('qtSubject').disabled?txt(el('qtSubject').value):'';
    const quantity=Math.max(5,Math.min(30,Number(el('qtQty')?.value||10)));
    const difficulty=txt(el('qtDiff')?.value)||'variada';
    const mode=txt(el('qtMode')?.value)||'rapido';
    box.innerHTML='<div class="bx-loading">Montando um teste novo...</div>';
    status('Selecionando questões sem revelar o gabarito...');
    try{
      const serverMode=mode==='inteligente'?'inteligente':'random';
      const poolSize=mode==='rapido'?30:quantity;
      const d=await req('/api/integrated/quick-tests/start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({course_id:course,subject_id:subject||null,difficulty,mode:serverMode,limit:poolSize})});
      let pool=Array.isArray(d.questions)?d.questions:[];
      if(mode==='rapido'){
        pool=pool.map(q=>({q,tie:Math.random()})).sort((a,b)=>String(a.q.statement||'').length-String(b.q.statement||'').length||a.tie-b.tie).map(x=>x.q);
      }else if(mode==='random')pool=shuffle(pool);
      S.testId=d.test_id||null;S.course=course;S.questions=pool.slice(0,quantity);S.answers={};S.index=0;S.started={};
      status(S.questions.length+' questão(ões) selecionada(s). Responda e finalize para ver a correção comentada.');
      draw();
    }catch(e){box.innerHTML='<p class="status-bad">'+esc(e.message)+'</p>';status('Não foi possível iniciar o teste.',true)}
  }

  function reviewBlock(detail,index){
    const q=S.questions.find(x=>x.id===detail.question_id)||{};
    const commentary=txt(detail.explanation_correct)||txt(detail.commentary);
    return '<div class="bx-qt-review '+(detail.correct?'ok':'bad')+'"><div class="qmeta">Questão '+(index+1)+(questionMeta(q)?' • '+questionMeta(q):'')+'</div><h3>'+esc(q.statement||'Questão')+'</h3><div class="bx-qt-answer"><b>Sua resposta:</b> '+esc(detail.selected_option||'—')+' &nbsp; <b>Gabarito:</b> '+esc(detail.correct_option||'—')+'</div><div><b>'+(detail.correct?'✓ Acertou':'✕ Errou')+'</b></div>'+(commentary?'<p class="bx-qt-comment"><b>Comentário:</b> '+esc(commentary)+'</p>':'')+(txt(detail.bizu)?'<div class="bx-bizu"><b>⚡ Bizu:</b> '+esc(detail.bizu)+'</div>':'')+'</div>';
  }

  async function finish(){
    const box=el('qtBox');if(!box)return;
    const answers=S.questions.map(q=>S.answers[q.id]).filter(Boolean);
    if(answers.length!==S.questions.length){
      const missing=S.questions.length-answers.length;
      status('Faltam '+missing+' questão(ões). Responda todas antes de finalizar.',true);
      const first=S.questions.findIndex(q=>!S.answers[q.id]);if(first>=0){S.index=first;draw()}
      return;
    }
    box.innerHTML='<div class="bx-loading">Corrigindo e registrando o desempenho...</div>';
    try{
      const d=await req('/api/integrated/quick-tests/finish',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({test_id:S.testId,course_id:S.course,answers})});
      const details=Array.isArray(d.details)?d.details:[];
      const wrong=details.filter(x=>!x.correct).map(x=>x.question_id);
      box.innerHTML='<div class="card"><span class="ey">RESULTADO</span><h2>'+esc(d.correct)+' / '+esc(d.total)+' acertos • '+esc(d.percentage)+'%</h2><p class="mut">'+esc(d.errors)+' erro(s). Os erros foram enviados ao Caderno de Erros e às Revisões Inteligentes.</p></div>'+details.map(reviewBlock).join('')+'<div class="bx-qt-actions"><button type="button" class="btn primary" id="bxQtNew">Novo teste</button>'+(wrong.length?'<button type="button" class="btn" id="bxQtRetry">Refazer somente os erros</button>':'')+'</div>';
      status('Teste finalizado e desempenho registrado.');
      el('bxQtNew').onclick=start;
      if(wrong.length)el('bxQtRetry').onclick=()=>retryWrong(wrong);
    }catch(e){box.innerHTML='<p class="status-bad">'+esc(e.message)+'</p><button class="btn" id="bxQtBack">Voltar ao teste</button>';status('A correção não foi concluída.',true);el('bxQtBack').onclick=draw}
  }

  function retryWrong(ids){
    const set=new Set(ids);
    const wrong=S.questions.filter(q=>set.has(q.id));
    if(!wrong.length)return start();
    S.testId='retry-'+Date.now();S.questions=shuffle(wrong);S.answers={};S.index=0;S.started={};
    status('Refazendo '+wrong.length+' questão(ões) errada(s), sem mostrar o gabarito antecipadamente.');
    draw();
  }

  function wire(){
    const startButton=el('qtStart');
    if(!startButton)return false;
    ensureStyle();enhanceControls();ensureStatus();
    if(S.startButton!==startButton){S.startButton=startButton;startButton.onclick=ev=>{ev?.preventDefault?.();start()}}
    const page=el('teste-rapido');
    const h=page?.querySelector('.head h1');if(h)h.textContent='Teste Rápido';
    const p=page?.querySelector('.head p');if(p)p.textContent='Sessões curtas, aleatórias ou inteligentes, com gabarito protegido e correção comentada ao final.';
    return true;
  }

  let tries=0;const timer=setInterval(()=>{tries++;wire();if(tries>240)clearInterval(timer)},500);
})();
