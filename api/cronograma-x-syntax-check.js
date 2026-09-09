import fs from 'node:fs';
import path from 'node:path';

export default function handler(req,res){
  try{
    const file=path.join(process.cwd(),'student-patches','cronograma-x-modern-v3.js');
    const code=fs.readFileSync(file,'utf8');
    new Function(code);
    const checks={
      syntax:true,
      modernFlag:code.includes('__bxCronogramaXModernV3'),
      noIaUnavailable:code.includes('Modo inteligente interno'),
      generateLabel:code.includes('GERAR CRONOGRAMA X'),
      tabs:['HOJE','SEMANA','QUINZENA','MÊS'].every(x=>code.includes(x))
    };
    const ok=Object.values(checks).every(Boolean);
    res.status(ok?200:500).json({ok,bytes:Buffer.byteLength(code),checks});
  }catch(e){res.status(500).json({ok:false,error:String(e?.message||e)})}
}
