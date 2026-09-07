(function(){
  if(window.__bxAdminManagementV2)return;
  window.__bxAdminManagementV2=true;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text=v=>String(v??'').trim();
  const money=v=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'—'};
  const date=v=>{if(!v)return'—';try{return new Date(v).toLocaleDateString('pt-BR')}catch{return'—'}};
  const state={boot:null,students:[],student:null,notices:[],competitions:[],noticeEdit:null};

  async function request(url,opt={}){
    const options={credentials:'include',cache:'no-store',...opt};
    if(opt.body&&!options.headers)options.headers={'content-type':'application/json'};
    const r=await fetch(url,options);
    const d=await r.json().catch(()=>({}));
    if(r.status===401){location.replace('/admin');throw new Error('Sessão expirada')}
    if(r.status===403){location.replace('/private/app');throw new Error('Acesso administrativo negado')}
    if(!r.ok)throw new Error(d.message||d.error||('HTTP '+r.status));
    return d;
  }

  function ensureStyle(){
    if($('bxAdminManagementV2Style'))return;
    const s=document.createElement('style');s.id='bxAdminManagementV2Style';
    s.textContent=`
      .bx-admin-v2-banner{margin:0 0 14px;padding:15px 17px;border:1px solid rgba(96,165,250,.35);border-radius:16px;background:linear-gradient(135deg,rgba(30,64,175,.18),rgba(5,15,35,.7));display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap}
      .bx-admin-v2-banner strong{font-size:17px}.bx-admin-v2-badge{padding:7px 10px;border-radius:999px;border:1px solid rgba(34,197,94,.45);background:rgba(34,197,94,.1);font-size:12px;font-weight:800}
      .bx-admin-v2-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0 18px}.bx-admin-v2-tile{border:1px solid var(--bd);background:#091426;border-radius:14px;padding:13px;text-align:left;color:inherit;cursor:pointer;min-height:88px}.bx-admin-v2-tile:hover{border-color:#3478f6;transform:translateY(-1px)}.bx-admin-v2-tile b{display:block;margin-bottom:5px}.bx-admin-v2-tile small{color:var(--mut);line-height:1.35}
      .bx-admin-v2-panel{margin-top:14px;padding:16px;border:1px solid var(--bd);border-radius:16px;background:rgba(9,20,38,.8)}.bx-admin-v2-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}.bx-admin-v2-toolbar input,.bx-admin-v2-toolbar select{min-width:180px;flex:1}.bx-admin-v2-list{display:grid;gap:8px}.bx-admin-v2-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px;border:1px solid var(--bd);border-radius:12px;background:#081325}.bx-admin-v2-row small{display:block;color:var(--mut);margin-top:4px}.bx-admin-v2-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
      .bx-admin-v2-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.bx-admin-v2-form label{display:grid;gap:5px;font-size:12px;color:var(--mut)}.bx-admin-v2-form label.wide{grid-column:1/-1}.bx-admin-v2-form input,.bx-admin-v2-form select,.bx-admin-v2-form textarea{width:100%}.bx-admin-v2-preview{padding:14px;border:1px dashed rgba(96,165,250,.5);border-radius:13px;background:#071224;margin:10px 0}.bx-admin-v2-preview h4{margin:0 0 6px}.bx-admin-v2-status{min-height:22px;margin:8px 0;color:var(--mut)}.bx-admin-v2-status.bad{color:#fda4af}.bx-admin-v2-status.ok{color:#86efac}
      .bx-admin-v2-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:10px 0}.bx-admin-v2-kpi{padding:12px;border:1px solid var(--bd);border-radius:12px;background:#091426}.bx-admin-v2-kpi b{display:block;font-size:23px;margin-top:4px}
      @media(max-width:1000px){.bx-admin-v2-grid,.bx-admin-v2-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){.bx-admin-v2-grid,.bx-admin-v2-kpis,.bx-admin-v2-form{grid-template-columns:1fr}.bx-admin-v2-form label.wide{grid-column:auto}.bx-admin-v2-row{grid-template-columns:1fr}.bx-admin-v2-actions{justify-content:flex-start}}
    `;
    document.head.appendChild(s);
  }

  function nav(){return document.querySelector('.side .nav')||document.querySelector('nav')}
  function go(page,resource){
    if(resource){const r=$('resource');if(r){r.value=resource;r.dispatchEvent(new Event('change',{bubbles:true}))}}
    const b=nav()?.querySelector(`[data-p="${page}"]`);
    if(b){b.click();return}
    const p=$(page);if(p){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x===p));document.querySelectorAll('[data-p]').forEach(x=>x.classList.toggle('active',x.dataset.p===page));$('side')?.classList.remove('open')}
  }

  async function guard(){
    const d=await request('/api/session');
    if(d.role!=='admin'){location.replace('/private/app');throw new Error('Conta sem perfil ADMIN')}
    return d;
  }

  async function adminBootstrap(force=false){
    if(state.boot&&!force)return state.boot;
    state.boot=await request('/api/admin/bootstrap');
    state.students=(state.boot.users||[]).filter(u=>u.role==='student');
    return state.boot;
  }

  function dashboard(){
    const page=$('dashboard');if(!page||$('bxAdminV2Banner'))return;
    const head=page.querySelector('.head');
    const banner=document.createElement('div');banner.id='bxAdminV2Banner';banner.className='bx-admin-v2-banner';
    banner.innerHTML='<div><strong>🔐 Área Administrativa do Bizu X</strong><div class="mut">Acesso separado da área do aluno • permissões validadas no servidor</div></div><span class="bx-admin-v2-badge">ADMINISTRADOR</span>';
    head?.insertAdjacentElement('afterend',banner);
    const grid=document.createElement('div');grid.id='bxAdminV2Quick';grid.className='bx-admin-v2-grid';
    const items=[
      ['👥','Alunos e Acessos','Cadastro, edição, bloqueio, planos e pagamentos','users',''],
      ['🏫','Concursos e Turmas','Concursos, editais e turmas/cursos','content','competitions'],
      ['📚','Matérias e Assuntos','Estrutura pedagógica e vínculo com edital','content','subjects'],
      ['❓','Questões','Criar, revisar e publicar questões','content','questions'],
      ['📄','PDFs Bizurados','Gerenciar materiais publicados','content','materials'],
      ['🎬','Vídeo Aulas','Gerenciar aulas e links de vídeo','content','lessons'],
      ['📣','Avisos e Central Bizu','Criar, editar, publicar e visualizar avisos','content-hub',''],
      ['💬','Mensagens dos alunos','Comunicação recebida e identificação','student-messages',''],
      ['🏭','Fábrica de Conteúdo','Fila, rascunhos e publicação controlada','factory',''],
      ['🧠','IA e Configurações','Configuração da IA sem exposição de chaves','ai',''],
      ['✍️','Redações','Redações enviadas pelos alunos','essays',''],
      ['☁️','Arquivos','Uploads administrativos','uploads','']
    ];
    grid.innerHTML=items.map((x,i)=>`<button type="button" class="bx-admin-v2-tile" data-bx-admin-go="${esc(x[3])}" data-bx-admin-resource="${esc(x[4])}"><b>${x[0]} ${esc(x[1])}</b><small>${esc(x[2])}</small></button>`).join('');
    banner.insertAdjacentElement('afterend',grid);
    grid.querySelectorAll('[data-bx-admin-go]').forEach(b=>b.onclick=()=>go(b.dataset.bxAdminGo,b.dataset.bxAdminResource||''));
    const k=document.createElement('div');k.id='bxAdminV2Kpis';k.className='bx-admin-v2-kpis';k.innerHTML='<div class="bx-admin-v2-kpi"><small>Alunos</small><b>…</b></div><div class="bx-admin-v2-kpi"><small>Questões</small><b>…</b></div><div class="bx-admin-v2-kpi"><small>PDFs</small><b>…</b></div><div class="bx-admin-v2-kpi"><small>Avisos</small><b>…</b></div>';
    grid.insertAdjacentElement('afterend',k);
    adminBootstrap().then(d=>{const vals=[state.students.length,d.counts?.questions,d.counts?.materials,d.counts?.notices];k.querySelectorAll('b').forEach((e,i)=>e.textContent=vals[i]??'—')}).catch(()=>{});
  }

  function relabelNav(){
    const n=nav();if(!n)return;
    const users=n.querySelector('[data-p="users"]');if(users)users.textContent='👥 Alunos e Acessos';
    const hub=n.querySelector('[data-p="content-hub"]');if(hub)hub.textContent='📣 Avisos e Central Bizu';
    const content=n.querySelector('[data-p="content"]');if(content)content.textContent='🗂 Gestão Acadêmica';
    const msgs=n.querySelector('[data-p="student-messages"]');if(msgs)msgs.textContent='💬 Mensagens dos alunos';
  }

  function studentShell(){
    const page=$('users');if(!page)return null;
    let root=$('bxAdminStudentsV2');if(root)return root;
    root=document.createElement('div');root.id='bxAdminStudentsV2';root.className='bx-admin-v2-panel';
    root.innerHTML='<span class="ey">GERENCIAMENTO DE ALUNOS</span><h2>Alunos, acessos, plano e pagamento</h2><p class="mut">Bloqueio é reversível e preserva todo o histórico do aluno. O nível de permissão não pode ser alterado por este editor.</p><div class="bx-admin-v2-toolbar"><input id="bxAdminStudentSearch" placeholder="Buscar por nome ou e-mail"><button class="btn" id="bxAdminStudentReload">Atualizar</button></div><div id="bxAdminStudentStatus" class="bx-admin-v2-status"></div><div id="bxAdminStudentList" class="bx-admin-v2-list"></div><div id="bxAdminStudentEditor"></div>';
    page.appendChild(root);
    $('bxAdminStudentSearch').addEventListener('input',renderStudents);
    $('bxAdminStudentReload').onclick=()=>loadStudents(true);
    return root;
  }

  async function loadStudents(force=false){
    studentShell();
    try{await adminBootstrap(force);renderStudents();setStudentStatus(state.students.length+' aluno(s) encontrado(s).','ok')}catch(e){setStudentStatus(e.message,'bad')}
  }
  function setStudentStatus(t,c=''){const e=$('bxAdminStudentStatus');if(e){e.textContent=t;e.className='bx-admin-v2-status '+c}}
  function renderStudents(){
    const root=$('bxAdminStudentList');if(!root)return;
    const q=text($('bxAdminStudentSearch')?.value).toLowerCase();
    const list=state.students.filter(u=>!q||String(u.full_name||'').toLowerCase().includes(q)||String(u.email||'').toLowerCase().includes(q));
    root.innerHTML=list.length?list.map(u=>`<div class="bx-admin-v2-row"><div><b>${esc(u.full_name||'Sem nome')}</b><small>${esc(u.email||'')} • cadastrado em ${esc(date(u.created_at))}</small></div><div class="bx-admin-v2-actions"><button class="btn" data-bx-student="${esc(u.id)}">Abrir cadastro</button></div></div>`).join(''):'<p class="mut">Nenhum aluno neste filtro.</p>';
    root.querySelectorAll('[data-bx-student]').forEach(b=>b.onclick=()=>openStudent(b.dataset.bxStudent));
  }

  async function openStudent(id){
    const ed=$('bxAdminStudentEditor');if(!ed)return;
    ed.innerHTML='<div class="bx-loading">Carregando cadastro...</div>';
    try{const d=await request('/api/actions/admin/users/'+encodeURIComponent(id));state.student=d.data;renderStudentEditor()}catch(e){ed.innerHTML='<p class="status-bad">'+esc(e.message)+'</p>'}
  }
  function renderStudentEditor(){
    const d=state.student,ed=$('bxAdminStudentEditor');if(!d||!ed)return;
    const p=d.profile||{},bp=d.bizu_profile||{},i=d.identity||{},s=d.subscription||{},u=d.user||{};
    ed.innerHTML=`<div class="bx-admin-v2-panel"><div class="head"><div><span class="ey">CADASTRO DO ALUNO</span><h2>${esc(p.full_name||u.email||'Aluno')}</h2><p class="mut">Matrícula ${esc(i.enrollment_number||'—')} • ${u.blocked?'ACESSO BLOQUEADO':'Acesso liberado'}</p></div></div><div class="bx-admin-v2-form"><label>Nome completo<input id="bxStuName" value="${esc(p.full_name||bp.full_name||'')}"></label><label>E-mail<input value="${esc(u.email||p.email||'')}" disabled></label><label>Matrícula<input value="${esc(i.enrollment_number||'—')}" disabled></label><label>Plano interno<input id="bxStuPlan" value="${esc(bp.plan||'x')}"></label><label>Nome do plano adquirido<input id="bxSubPlan" value="${esc(s.plan_name||'')}"></label><label>Valor pago<input id="bxSubAmount" type="number" step="0.01" value="${esc(s.amount_paid??'')}"></label><label>Data da compra<input id="bxSubPurchased" type="datetime-local" value="${esc(toLocalInput(s.purchased_at))}"></label><label>Data de início<input id="bxSubStart" type="datetime-local" value="${esc(toLocalInput(s.starts_at))}"></label><label>Vencimento<input id="bxSubEnd" type="datetime-local" value="${esc(toLocalInput(s.ends_at))}"></label><label>Status<select id="bxSubStatus">${['active','pending','expired','cancelled','trial'].map(v=>`<option value="${v}" ${s.status===v?'selected':''}>${statusPt(v)}</option>`).join('')}</select></label><label class="wide">Referência do pagamento<input id="bxSubRef" value="${esc(s.payment_reference||'')}"></label></div><div class="bx-admin-v2-toolbar"><button class="btn primary" id="bxStuSave">Salvar alterações</button><button class="btn ${u.blocked?'':'danger'}" id="bxStuBlock">${u.blocked?'Desbloquear acesso':'Bloquear acesso'}</button><button class="btn" id="bxStuClose">Fechar</button></div><div id="bxStuEditStatus" class="bx-admin-v2-status"></div></div>`;
    $('bxStuSave').onclick=saveStudent;$('bxStuBlock').onclick=toggleStudentBlock;$('bxStuClose').onclick=()=>ed.innerHTML='';
  }
  function toLocalInput(v){if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return'';const z=n=>String(n).padStart(2,'0');return`${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`}
  function statusPt(v){return({active:'Ativo',pending:'Pendente',expired:'Vencido',cancelled:'Cancelado',trial:'Período de teste'})[v]||v}
  async function saveStudent(){
    const id=state.student?.user?.id;if(!id)return;
    const st=$('bxStuEditStatus');if(st){st.textContent='Salvando...';st.className='bx-admin-v2-status'}
    try{
      const payload={full_name:text($('bxStuName').value),plan:text($('bxStuPlan').value),subscription:{plan_name:text($('bxSubPlan').value),amount_paid:$('bxSubAmount').value===''?null:Number($('bxSubAmount').value),purchased_at:isoOrNull($('bxSubPurchased').value),starts_at:isoOrNull($('bxSubStart').value),ends_at:isoOrNull($('bxSubEnd').value),status:$('bxSubStatus').value,payment_reference:text($('bxSubRef').value)||null}};
      const d=await request('/api/actions/admin/users/'+encodeURIComponent(id),{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});state.student=d.data;if(st){st.textContent='Alterações salvas.';st.className='bx-admin-v2-status ok'}await adminBootstrap(true);renderStudents();renderStudentEditor();
    }catch(e){if(st){st.textContent=e.message;st.className='bx-admin-v2-status bad'}}
  }
  async function toggleStudentBlock(){
    const id=state.student?.user?.id;if(!id)return;
    const blocked=!!state.student?.user?.blocked;
    if(!blocked&&!confirm('Bloquear o acesso deste aluno? Os dados serão preservados.'))return;
    try{const d=await request('/api/actions/admin/users/'+encodeURIComponent(id),{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({blocked:!blocked})});state.student=d.data;renderStudentEditor();setStudentStatus(blocked?'Aluno desbloqueado.':'Aluno bloqueado sem excluir dados.','ok')}catch(e){setStudentStatus(e.message,'bad')}
  }
  function isoOrNull(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString()}

  function noticeShell(){
    const hub=$('content-hub'),title=$('bxNoticeTitle'),body=$('bxNoticeBody'),add=$('bxNoticeAdd'),list=$('bxNoticeList');
    if(!hub||!title||!body||!add||!list)return false;
    relabelNav();
    const card=title.closest('.bx-hub-card')||title.parentElement?.parentElement;
    if(card&&!$('bxNoticeV2Tools')){
      const tools=document.createElement('div');tools.id='bxNoticeV2Tools';tools.innerHTML='<div class="bx-admin-v2-toolbar"><button class="btn" id="bxNoticePreview">Pré-visualizar como aluno</button><button class="btn" id="bxNoticeCancel" style="display:none">Cancelar edição</button></div><div id="bxNoticeEditState" class="bx-admin-v2-status"></div><div id="bxNoticeStudentPreview" class="bx-admin-v2-preview" style="display:none"></div>';
      add.insertAdjacentElement('afterend',tools);
      $('bxNoticePreview').onclick=previewNotice;$('bxNoticeCancel').onclick=cancelNoticeEdit;
    }
    if(!add.dataset.bxNoticeV2){add.dataset.bxNoticeV2='1';add.onclick=saveNotice}
    const reload=$('bxHubReload');if(reload&&!reload.dataset.bxNoticeV2){reload.dataset.bxNoticeV2='1';reload.addEventListener('click',()=>setTimeout(loadNotices,400))}
    return true;
  }
  async function loadNotices(){
    if(!noticeShell())return;
    try{
      const [n,c]=await Promise.all([request('/api/admin/notices'),request('/api/admin/competitions')]);
      state.notices=Array.isArray(n.data)?n.data:[];state.competitions=Array.isArray(c.data)?c.data:[];renderNotices();
    }catch(e){const st=$('bxNoticeEditState');if(st){st.textContent=e.message;st.className='bx-admin-v2-status bad'}}
  }
  function compName(id){return state.competitions.find(c=>c.id===id)?.name||'Todos os concursos'}
  function renderNotices(){
    const list=$('bxNoticeList');if(!list)return;
    list.innerHTML=state.notices.length?state.notices.map(n=>`<div class="bx-hub-row" data-bx-notice-row="${esc(n.id)}"><b>${esc(n.title)}</b><small>${esc(n.body||'')} • ${esc(compName(n.competition_id))} • ${n.published?'Publicado':'Oculto'}</small><div class="bx-hub-actions"><button class="btn" data-bx-notice-preview="${esc(n.id)}">Visualizar</button><button class="btn" data-bx-notice-edit="${esc(n.id)}">Editar</button><button class="btn" data-bx-notice-toggle="${esc(n.id)}">${n.published?'Ocultar':'Publicar'}</button><button class="btn danger" data-bx-notice-delete="${esc(n.id)}">Excluir</button></div></div>`).join(''):'<p class="mut">Sem avisos.</p>';
    list.querySelectorAll('[data-bx-notice-preview]').forEach(b=>b.onclick=()=>previewExisting(b.dataset.bxNoticePreview));
    list.querySelectorAll('[data-bx-notice-edit]').forEach(b=>b.onclick=()=>editNotice(b.dataset.bxNoticeEdit));
    list.querySelectorAll('[data-bx-notice-toggle]').forEach(b=>b.onclick=()=>toggleNotice(b.dataset.bxNoticeToggle));
    list.querySelectorAll('[data-bx-notice-delete]').forEach(b=>b.onclick=()=>deleteNotice(b.dataset.bxNoticeDelete));
  }
  function previewHtml(title,body,competition){return`<span class="ey">PRÉ-VISUALIZAÇÃO DO ALUNO</span><h4>📣 ${esc(title||'Título do aviso')}</h4><p>${esc(body||'Conteúdo do aviso')}</p><small class="mut">${esc(competition||'Todos os concursos')}</small>`}
  function previewNotice(){const p=$('bxNoticeStudentPreview');if(!p)return;p.style.display='block';p.innerHTML=previewHtml($('bxNoticeTitle')?.value,$('bxNoticeBody')?.value,compName($('bxNoticeComp')?.value))}
  function previewExisting(id){const n=state.notices.find(x=>x.id===id),p=$('bxNoticeStudentPreview');if(!n||!p)return;p.style.display='block';p.innerHTML=previewHtml(n.title,n.body,compName(n.competition_id));p.scrollIntoView({behavior:'smooth',block:'nearest'})}
  function editNotice(id){const n=state.notices.find(x=>x.id===id);if(!n)return;state.noticeEdit=n;$('bxNoticeTitle').value=n.title||'';$('bxNoticeBody').value=n.body||'';$('bxNoticeComp').value=n.competition_id||'';$('bxNoticeAdd').textContent='Salvar alterações';$('bxNoticeCancel').style.display='inline-flex';const st=$('bxNoticeEditState');st.textContent='Editando aviso existente.';st.className='bx-admin-v2-status';previewExisting(id);$('bxNoticeTitle').scrollIntoView({behavior:'smooth',block:'center'})}
  function cancelNoticeEdit(){state.noticeEdit=null;$('bxNoticeTitle').value='';$('bxNoticeBody').value='';$('bxNoticeComp').value='';$('bxNoticeAdd').textContent='Publicar aviso';$('bxNoticeCancel').style.display='none';$('bxNoticeStudentPreview').style.display='none';$('bxNoticeEditState').textContent=''}
  async function saveNotice(){
    const title=text($('bxNoticeTitle')?.value),body=text($('bxNoticeBody')?.value),competition_id=$('bxNoticeComp')?.value||null,st=$('bxNoticeEditState');
    if(!title||!body){if(st){st.textContent='Informe título e conteúdo.';st.className='bx-admin-v2-status bad'}return}
    try{
      if(state.noticeEdit){await request('/api/admin/notices/'+state.noticeEdit.id,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({title,body,competition_id})})}
      else await request('/api/admin/notices',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title,body,competition_id,published:true,starts_at:new Date().toISOString()})});
      if(st){st.textContent=state.noticeEdit?'Aviso atualizado.':'Aviso publicado.';st.className='bx-admin-v2-status ok'}cancelNoticeEdit();await loadNotices();
    }catch(e){if(st){st.textContent=e.message;st.className='bx-admin-v2-status bad'}}
  }
  async function toggleNotice(id){const n=state.notices.find(x=>x.id===id);if(!n)return;try{await request('/api/admin/notices/'+id,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({published:!n.published})});await loadNotices()}catch(e){alert(e.message)}}
  async function deleteNotice(id){if(!confirm('Excluir este aviso? Esta ação remove o aviso do banco.'))return;try{await request('/api/admin/notices/'+id,{method:'DELETE'});if(state.noticeEdit?.id===id)cancelNoticeEdit();await loadNotices()}catch(e){alert(e.message)}}

  function academicHint(){
    const page=$('content');if(!page||$('bxAcademicHint'))return;
    const card=document.createElement('div');card.id='bxAcademicHint';card.className='bx-admin-v2-panel';card.innerHTML='<b>Gestão Acadêmica</b><p class="mut">Use o seletor abaixo para administrar Concursos, Editais, Turmas, Matérias, Assuntos, Questões, PDFs, Vídeos, Flashcards, Simulados, Leis e demais conteúdos previstos no sistema atual.</p>';
    page.querySelector('.head')?.insertAdjacentElement('afterend',card);
  }

  async function init(){
    ensureStyle();
    try{await guard()}catch{return}
    dashboard();academicHint();studentShell();relabelNav();loadStudents(false).catch(()=>{});
    let ticks=0;const timer=setInterval(()=>{
      ticks++;relabelNav();dashboard();academicHint();studentShell();noticeShell();
      if($('content-hub')&&$('bxNoticeList'))loadNotices().catch(()=>{});
      if(ticks>=12)clearInterval(timer);
    },600);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
