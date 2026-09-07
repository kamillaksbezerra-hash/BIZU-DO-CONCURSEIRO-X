(function(){
  if(window.__bxAdminV2NoticeStability)return;
  window.__bxAdminV2NoticeStability=true;
  function arm(){
    const nav=document.querySelector('.side .nav')||document.querySelector('nav');
    const hub=nav?.querySelector('[data-p="content-hub"]');
    if(!hub||hub.dataset.bxNoticeStability)return false;
    hub.dataset.bxNoticeStability='1';
    hub.addEventListener('click',()=>{
      setTimeout(()=>{
        const list=document.getElementById('bxNoticeList');
        if(!list||list.querySelector('[data-bx-notice-edit]'))return;
        const reload=document.getElementById('bxHubReload');
        if(reload)reload.click();
      },900);
    });
    return true;
  }
  let tries=0;
  const timer=setInterval(()=>{tries++;if(arm()||tries>=30)clearInterval(timer)},300);
  if(document.readyState!=='loading')arm();
})();
