(function(){
  if(window.__bxAdminSecurityV3)return;
  window.__bxAdminSecurityV3=true;
  const ADMIN_EMAIL='bizudoconcurseirox@gmail.com';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function req(url,opt={}){
    const r=await fetch(url,{credentials:'include',cache:'no-store',...opt});
    const d=await r.json().catch(()=>({}));
    if(r.status===401){location.replace('/admin');throw new Error('Sessão expirada')}
    if(r.status===403){location.replace('/private/app');throw new Error('Acesso administrativo negado')}
    if(!r.ok)throw new Error(d.message||d.error||('HTTP '+r.status));
    return d;
  }

  async function strictGuard(){
    const s=await req('/api/session');
    const email=String(s?.user?.email||'').toLowerCase();
    if(s?.role!=='admin'||email!==ADMIN_EMAIL){
      location.replace('/private/app');
      throw new Error('Conta não autorizada para a Área Administrativa');
    }
    document.documentElement.dataset.bizuAdminVerified='true';
    return s;
  }

  function style(){
    if($('bxAdminSecurityV3Style'))return;
    const st=document.createElement('style');st.id='bxAdminSecurityV3Style';st.textContent=`
      .bx-sec-v3{margin:12px 0;padding:15px;border:1px solid rgba(34,197,94,.42);border-radius:15px;background:linear-gradient(135deg,rgba(34,197,94,.08),rgba(52,120,246,.07))}
      .bx-sec-v3-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.bx-sec-v3-ok{padding:6px 9px;border-radius:999px;background:rgba(34,197,94,.12);color:#86efac;border:1px solid rgba(34,197,94,.35);font-size:11px;font-weight:900}
      .bx-sec-v3-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0}.bx-sec-v3-grid button{min-height:72px;text-align:left;padding:10px;border:1px solid var(--bd);border-radius:12px;background:#091426;color:inherit;cursor:pointer}.bx-sec-v3-grid button:hover{border-color:#4d8dff}.bx-sec-v3-grid b{display:block}.bx-sec-v3-grid small{display:block;color:var(--mut);margin-top:4px}
      .bx-sec-v3-stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}.bx-sec-v3-stat{padding:11px;border:1px solid var(--bd);border-radius:11px;background:#081325}.bx-sec-v3-stat small{display:block;color:var(--mut);font-size:10px}.bx-sec-v3-stat b{font-size:21px}
      @media(max-width:1050px){.bx-sec-v3-grid{grid-template-columns:repeat(3,1fr)}.bx-sec-v3-stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:650px){.bx-sec-v3-grid,.bx-sec-v3-stats{grid-template-columns:1fr 1fr}}
    `;document.head.appendChild(st);
  }

  function nav(){return document.querySelector('.side .nav')||document.querySelector('nav')}
  function go(page,resource){
    if(resource){const r=$('resource');if(r){r.value=resource;r.dispatchEvent(new Event('change',{bubbles:true}))}}
    const b=nav()?.querySelector(`[data-p="${page}"]`);if(b){b.click();return}
    const p=$(page);if(p){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x===p));document.querySelectorAll('[data-p]').forEach(x=>x.classList.toggle('active',x.dataset.p===page))}
  }

  function removeStudentLinks(){
    document.querySelectorAll('a[href="/"],a[href="/private/app"],a.admin-link').forEach(a=>{
      if(/aluno/i.test(a.textContent||'')||a.getAttribute('href')==='/private/app')a.remove();
    });
  }

  async function enhance(){
    style();removeStudentLinks();
    const page=$('dashboard');if(!page||$('bxAdminSecurityV3'))return;
    const box=document.createElement('section');box.id='bxAdminSecurityV3';box.className='bx-sec-v3';
    box.innerHTML=`<div class="bx-sec-v3-head"><div><span class="ey">SEGURANÇA E CONTROLE</span><h2 style="margin:4px 0">Administrador exclusivo</h2><p class="mut" style="margin:0">${esc(ADMIN_EMAIL)} • permissões validadas em rota, API e banco de dados.</p></div><span class="bx-sec-v3-ok">✓ ADMIN VERIFICADO</span></div>
    <div class="bx-sec-v3-grid" id="bxAdminAllTools"></div>
    <div class="bx-sec-v3-stats" id="bxAdminSystemStats"><div class="bx-sec-v3-stat"><small>CARREGANDO</small><b>…</b></div></div>`;
    const anchor=$('bxAdminV2Banner')||page.querySelector('.head');anchor?.insertAdjacentElement('afterend',box);
    const tools=[
      ['🏆','Concursos','competitions'],['📑','Editais','edicts'],['🎓','Cursos/Turmas','courses'],['📚','Matérias','subjects'],['🧩','Assuntos','topics'],
      ['❓','Questões','questions'],['🧠','Flashcards','flashcards'],['📄','PDFs/Materiais','materials'],['🎬','Videoaulas','lessons'],['📝','Simulados','simulations'],
      ['🗺️','Mapas mentais','mindmaps'],['📘','Guias','topic_guides'],['⚖️','Leis','laws'],['🏛️','Jurisprudência','jurisprudence'],['✍️','Temas de redação','essay_topics'],
      ['🎯','Mentoria','mentoring'],['📣','Avisos','notices'],['📰','Notícias','news'],['📂','Simulados PDF','sim_pdf_folders'],['👥','Alunos/Permissões','']
    ];
    $('bxAdminAllTools').innerHTML=tools.map((t,i)=>`<button data-res="${esc(t[2])}" data-users="${i===19?'1':'0'}"><b>${t[0]} ${esc(t[1])}</b><small>${i===19?'Cadastro, bloqueio e acesso; promoção a admin é bloqueada':'Gerenciar conteúdo e publicação'}</small></button>`).join('');
    $('bxAdminAllTools').querySelectorAll('button').forEach(b=>b.onclick=()=>b.dataset.users==='1'?go('users',''):go('content',b.dataset.res));

    try{
      const d=await req('/api/admin/bootstrap'),c=d.counts||{};
      const stats=[['ALUNOS',(d.users||[]).filter(u=>u.role==='student').length],['ADMINS',(d.users||[]).filter(u=>u.role==='admin').length],['CURSOS',c.courses],['QUESTÕES',c.questions],['PDFs',c.materials],['VIDEOAULAS',c.lessons],['SIMULADOS',c.simulations],['FLASHCARDS',c.flashcards],['MAPAS',c.mindmaps],['GUIAS',c.topic_guides],['AVISOS',c.notices],['REDAÇÕES',c.essay_topics]];
      $('bxAdminSystemStats').innerHTML=stats.map(x=>`<div class="bx-sec-v3-stat"><small>${esc(x[0])}</small><b>${x[1]??'—'}</b></div>`).join('');
    }catch(e){$('bxAdminSystemStats').innerHTML=`<div class="bx-sec-v3-stat"><small>STATUS</small><b>Indisponível</b></div>`}
  }

  strictGuard().then(()=>{
    let tries=0,t=setInterval(()=>{tries++;if(document.querySelector('.side .nav')&&$('dashboard')){clearInterval(t);enhance()}else if(tries>60)clearInterval(t)},200);
    const mo=new MutationObserver(removeStudentLinks);mo.observe(document.documentElement,{childList:true,subtree:true});
  }).catch(()=>{});
})();
