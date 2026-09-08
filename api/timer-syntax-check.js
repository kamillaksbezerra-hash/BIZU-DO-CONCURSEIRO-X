import fs from 'fs';
import path from 'path';

export default function handler(req,res){
  try{
    const code=fs.readFileSync(path.join(process.cwd(),'student-patches','cronometro-inteligente-v2.js'),'utf8');
    new Function(code);
    res.status(200).json({ok:true,bytes:Buffer.byteLength(code),test:'cronometro-v2-syntax'});
  }catch(error){
    res.status(500).json({ok:false,error:String(error?.message||error),test:'cronometro-v2-syntax'});
  }
}
