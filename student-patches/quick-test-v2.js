(function(){
  if(window.__bxQuickTestV2Current)return;
  window.__bxQuickTestV2Current=true;

  const S={testId:null,questions:[],answers:{},index:0,started:{},course:null,startButton:null};
  const pick=(...ids)=>ids.map(id=>document.getElementById(id)).find(Boolean)||null;
  const ui=()=>({
    start:pick('bxQStart','qtStart'),
    course:pick('bxQCourse','qtCourse'),
    subject:pick('bxQSub','qtSubject'),
    qty:pick('bxQN','qtQty'),
    diff:pick('bxQDiff','qtDiff'),
    mode:pick('bxQMode','qtMode'),
    box:pick('bxQuickRunner','qtBox')
  });
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt=v=>String(v??'').trim();
  const activeCourseId=()=>window.BX?.boot?.profile?.target_course_id||window.BX?.boot?.context?.course?.id||'';

  async function req(url,opt={}){
    const options={credentials:'include',cache:'no-store',...opt};
    if(opt.body&&!options.headers)options.headers={'content-type':'application/json'};
    const r=await fetch(url,options),d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.message||d.error||('HTTP '+r.status));
    return d;
  }
  function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function optionPairs(options){
    if(Array.isArray(options))return options.map((text,i)=>({label:'ABCDE'[i]||String(i+1),text}));
    if(options&&typeof options==='object')return Object.entries(options).map(([k,text],i)=>({label:/^[A-E]$/i.test(k)?k.toUpperCase():('ABCDE'[i]||k),text}));
    return [];
  }
  function ensureStyle(){
    if(document.getElementById('bxQuickTestV2Style'))return;
    const s=document.createElement('style');s.id='bxQuickTestV2Style';
    s.textContent='.bx-qt-selected{outline:2px solid rgba(96,165,250,.75);background:rgba(59,130,246,.12)!important}.bx-qt-progress{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.bx-qt-dot{width:30px;height:30px;border-radius:8px;border:1px solid rgba(106,137,190,.3);display:grid;place-items:center;font-size:11px;cursor:pointer;background:#0b182c;color:#aebdd2}.bx-qt-dot.done{font-weight:900;border-color:rgba(96,165,250,.8);background:rgba(52,120,246,.17);color:#fff}.bx-qt-review{margin:12px 0;padding:14px;border:1px solid rgba(106,137,190,.25);border-radius:14px}.bx-qt-review.ok{border-left:4px solid #22c55e}.bx-qt-review.bad{border-left:4px solid #ef445b}.bx-qt-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.bx-qt-actions .btn{margin-top:0}.bx-qt-answer{margin:7px 0;color:#b8c6dc}.bx-qt-comment{white-space:pre-wrap;color:#b8c6dc}';
    document.head.appendChild(s);
  }
  function ensureStatus(){
    const box=ui().box;if(!box)return null;
    let s=document.getElementById('bxQuickTestV2Status');
    if(!s){s=document.createElement('div');s.id='bxQuickTestV2Status';s.className='mut';s.style.cssText='margin:10px 0;min-height:20px';box.parentElement?.insertBefore(s,box)}
    return s;
  }
  function status(message,bad=false){const s=ensureStatus();if(s){s.textContent=message;s.style.color=bad?'#fda4af':''}}

  function enhanceControls(){
    const U=ui(),mode=U.mode;
    if(mode&&!mode.dataset.bxQtV2){
      mode.dataset.bxQtV2='1';
      const old=mode.value;
      mode.innerHTML='<option value="rapido">Rápido • enunciados mais curtos</option><option value="aleatorio">Aleatório</option><option value="inteligente">Inteligente • prioriza dificuldades</option>';
      mode.value=['rapido','aleatorio','inteligente'].includes(old)?old:(old==='random'?'aleatorio':'rapido');
    }
    if(U.course&&U.course.id==='qtCourse'&&!U.course.dataset.bxQtCompat){
      U.course.dataset.bxQtCompat='1';
      U.course.addEventListener('change',()=>{
        const sub=ui().subject;
        if(sub&&U.course.value!==activeCourseId()){sub.value='';sub.disabled=true;status('Curso diferente do contexto atual: usando todas as matérias desse curso.')}else if(sub){sub.disabled=false}
      });
    }
  }
  function questionMeta(q){return [q.bizu_subjects?.name,q.bizu_topics?.name,q.difficulty,q.banca,q.year].filter(Boolean).map(esc).join(' • ')}

  function draw(){
    const U=ui(),box=U.box,q=S.questions[S.index];if(!box)return;
    if(!q){box.innerHTML='<div class="empty">Nenhuma questão disponível para este filtro.</div>';return}
    if(!S.started[q.id])S.started[q.id]=Date.now();
    const selected=S.answers[q.id]?.selected_option||'';
    box.innerHTML='<div class="qmeta">Questão '+(S.index+1)+' de '+S.questions.length+(questionMeta(q)?' • '+questionMeta(q):'')+'</div><div class="bx-qt-progress">'+S.questions.map((item,i)=>'<button type="button" class="bx-qt-dot '+(S.answers[item.id]?'done':'')+'" data-bx-qt-go="'+i+'">'+(i+1)+'</button>').join('')+'</div><h2>'+esc(q.statement)+'</h2>'+optionPairs(q.options).map(o=>'<button type="button" class="option '+(selected===o.label?'bx-qt-selected':'')+'" data-bx-qt-opt="'+esc(o.label)+'"><b>'+esc(o.label)+')</b> '+esc(o.text)+'</button>').join('')+'<div class="bx-qt-actions"><button type="button" class="btn" id="bxQtPrev">← Anterior</button><button type="button" class="btn" id="bxQtNext">Próxima →</button><button type="button" class="btn primary" id="bxQtFinish">Finalizar teste</button></div>';
    box.querySelectorAll('[data-bx-qt-opt]').forEach(b=>b.onclick=()=>{const elapsed=Math.max(1,Math.round((Date.now()-(S.started[q.id]||Date.now()))/1000));S.answers[q.id]={question_id:q.id,selected_option:b.dataset.bxQtOpt,elapsed_seconds:elapsed};draw()});
    box.querySelectorAll('[data-bx-qt-go]').forEach(b=>b.onclick=()=>{S.index=Number(b.dataset.bxQtGo)||0;draw()});
    document.getElementById('bxQtPrev').onclick=()=>{if(S.index>0){S.index--;draw()}};
    document.getElementById('bxQtNext').onclick=()=>{if(S.index<S.questions.length-1){S.index++;draw()}else status('Última questão. Finalize quando todas estiverem respondidas.')};
    document.getElementById('bxQtFinish').onclick=finish;
    status(Object.keys(S.answers).length+' de '+S.questions.length+' respondida(s). O gabarito permanece oculto até finalizar.');
  }

  async function start(){
    const U=ui(),box=U.box;if(!box)return;
    const course=txt(U.course?.value)||activeCourseId();
    const subject=U.subject&&!U.subject.disabled?txt(U.subject.value):'';
    const quantity=Math.max(5,Math.min(30,Number(U.qty?.value||10)));
    const difficulty=txt(U.diff?.value)||'variada';
    const mode=txt(U.mode?.value)||'rapido';
    box.innerHTML='<div class="bx-loading">Montando um teste novo...</div>';status('Selecionando questões sem revelar o gabarito...');
    try{
      const serverMode=mode==='inteligente'?'inteligente':'aleatorio',poolSize=mode==='rapido'?30:quantity;
      const d=await req('/api/integrated/quick-tests/start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({course_id:course,subject_id:subject||null,difficulty,mode:serverMode,limit:poolSize})});
      let pool=Array.isArray(d.questions)?d.questions:[];
      if(mode==='rapido')pool=pool.map(q=>({q,tie:Math.random()})).sort((a,b)=>String(a.q.statement||'').length-String(b.q.statement||'').length||a.tie-b.tie).map(x=>x.q);
      else if(mode==='aleatorio')pool=shuffle(pool);
      S.testId=d.test_id||null;S.course=course;S.questions=pool.slice(0,quantity);S.answers={};S.index=0;S.started={};
      status(S.questions.length+' questão(ões) selecionada(s). Responda e finalize para ver a correção.');draw();
    }catch(e){box.innerHTML='<p class="status-bad">'+esc(e.message)+'</p>';status('Não foi possível iniciar o teste.',true)}
  }

  function reviewBlock(detail,index){
    const q=S.questions.find(x=>x.id===detail.question_id)||{},commentary=txt(detail.explanation_correct)||txt(detail.commentary);
    return '<div class="bx-qt-review '+(detail.correct?'ok':'bad')+'"><div class="qmeta">Questão '+(index+1)+(questionMeta(q)?' • '+questionMeta(q):'')+'</div><h3>'+esc(q.statement||'Questão')+'</h3><div class="bx-qt-answer"><b>Sua resposta:</b> '+esc(detail.selected_option||'—')+' &nbsp; <b>Gabarito:</b> '+esc(detail.correct_option||'—')+'</div><div><b>'+(detail.correct?'✓ Acertou':'✕ Errou')+'</b></div>'+(commentary?'<p class="bx-qt-comment"><b>Comentário:</b> '+esc(commentary)+'</p>':'')+(txt(detail.bizu)?'<div class="bx-bizu"><b>⚡ Bizu:</b> '+esc(detail.bizu)+'</div>':'')+'</div>';
  }
  function aggregateReview(d){
    const weak=Array.isArray(d.weak_subjects)?d.weak_subjects:[],topics=Array.isArray(d.review_topics)?d.review_topics:[];
    return '<div class="bx-final-cols"><div class="card"><h3>Matérias com maior dificuldade</h3>'+(weak.length?weak.map(z=>'<div class="row"><span>'+esc(z.name)+'</span><b>'+esc(z.percentage)+'%</b></div>').join(''):'<p class="mut">Nenhuma matéria abaixo da faixa de atenção.</p>')+'</div><div class="card"><h3>Assuntos para revisão</h3>'+(topics.length?topics.map(z=>'<div class="row"><span>'+esc(z.name)+'</span><b>'+esc(z.errors)+' erro(s)</b></div>').join(''):'<p class="mut">Nenhum assunto pendente.</p>')+'</div></div>';
  }
  async function finish(){
    const U=ui(),box=U.box;if(!box)return;
    const answers=S.questions.map(q=>S.answers[q.id]).filter(Boolean);
    if(answers.length!==S.questions.length){const first=S.questions.findIndex(q=>!S.answers[q.id]);status('Faltam '+(S.questions.length-answers.length)+' questão(ões). Responda todas antes de finalizar.',true);if(first>=0){S.index=first;draw()}return}
    box.innerHTML='<div class="bx-loading">Corrigindo e registrando o desempenho...</div>';
    try{
      const d=await req('/api/integrated/quick-tests/finish',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({test_id:S.testId,course_id:S.course,answers})});
      const details=Array.isArray(d.details)?d.details:[];
      box.innerHTML='<div class="bx-result"><span class="ey">RESULTADO FINAL</span><strong>'+esc(d.percentage)+'%</strong><h2>'+esc(d.correct)+' acertos • '+esc(d.errors)+' erros • '+esc(d.total)+' questões</h2><p>Os erros foram enviados para suas Revisões Inteligentes.</p></div>'+(details.length?details.map(reviewBlock).join(''):aggregateReview(d))+'<div class="bx-qt-actions"><button type="button" class="btn primary" id="bxQtNew">Fazer outro teste</button></div>';
      status('Teste finalizado e desempenho registrado.');document.getElementById('bxQtNew').onclick=start;
    }catch(e){box.innerHTML='<p class="status-bad">'+esc(e.message)+'</p><button class="btn" id="bxQtBack">Voltar ao teste</button>';status('A correção não foi concluída.',true);document.getElementById('bxQtBack').onclick=draw}
  }

  function wire(){
    const U=ui();if(!U.start||!U.box)return false;
    ensureStyle();enhanceControls();ensureStatus();
    if(S.startButton!==U.start){S.startButton=U.start;U.start.onclick=ev=>{ev?.preventDefault?.();start()}}
    const page=document.getElementById('teste-rapido'),h=page?.querySelector('.head h1'),p=page?.querySelector('.head p');
    if(h)h.textContent='Teste Rápido';if(p)p.textContent='Sessões curtas, aleatórias ou inteligentes, com gabarito protegido e correção ao final.';
    return true;
  }
  let tries=0;const timer=setInterval(()=>{tries++;wire();if(tries>240)clearInterval(timer)},500);
})();
