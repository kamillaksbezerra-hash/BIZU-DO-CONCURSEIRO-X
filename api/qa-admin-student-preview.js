import fs from 'fs';
import path from 'path';

export default function handler(req,res){
  try{
    const code=fs.readFileSync(path.join(process.cwd(),'api','private-page.js'),'utf8');
    const checks={
      admin_student_redirect_removed:!code.includes("if(mode==='student'&&role==='admin')"),
      transform_receives_role:code.includes('transformPrivateHtml(await upstream.text(),mode,role)'),
      timer_patch_injected:code.includes('/student-patches/cronometro-inteligente-v2.js?v=20260908b'),
      admin_student_link_enabled:code.includes('<a href=\"/private/app\">← Área do aluno</a>')&&code.includes('<a class=\"admin-link\" href=\"/private/admin\">')
    };
    const ok=Object.values(checks).every(Boolean);
    res.status(ok?200:500).json({ok,checks,test:'admin-student-preview'});
  }catch(error){
    res.status(500).json({ok:false,error:String(error?.message||error),test:'admin-student-preview'});
  }
}
