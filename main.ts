import {readFileSync as a,mkdirSync as m,writeFileSync as w,readdirSync as r} from 'node:fs';
const I=process.env.MAKEFUN_INPUT_DIR||'/input',O=process.env.MAKEFUN_OUTPUT_DIR||'/output';
function run(p,b){
 const S=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),o=[];
 let s=0,c=0,q=0,k=0,n=0;
 const B=f=>{if(s<2)throw 2;const v=S[--s];S[s-1]=f(S[s-1],v);q++};
 try{for(;;){
  if(n>=1e6)throw 10;
  if(q<0||q>=p.length)throw 9;
  const x=p[q];n++;
  switch(x){
  case 0:return[o,0];
  case 1:if(q+1>=p.length)throw 9;if(s>=256)throw 3;S[s++]=(p[q+1]<<24)>>24;q+=2;break;
  case 2:if(q+4>=p.length)throw 9;if(s>=256)throw 3;S[s++]=p[q+1]|p[q+2]<<8|p[q+3]<<16|p[q+4]<<24;q+=5;break;
  case 3:if(s<1)throw 2;s--;q++;break;
  case 4:if(s<1)throw 2;if(s>=256)throw 3;S[s]=S[s-1];s++;q++;break;
  case 5:if(s<2)throw 2;{const t=S[s-1];S[s-1]=S[s-2];S[s-2]=t}q++;break;
  case 6:if(s<2)throw 2;if(s>=256)throw 3;S[s]=S[s-2];s++;q++;break;
  case 7:if(s<3)throw 2;{const t=S[s-3];S[s-3]=S[s-2];S[s-2]=S[s-1];S[s-1]=t}q++;break;
  case 16:B((a,v)=>(a+v)|0);break;
  case 17:B((a,v)=>(a-v)|0);break;
  case 18:B((a,v)=>Math.imul(a,v));break;
  case 19:B((a,v)=>{if(!v)throw 4;return(a/v)|0});break;
  case 20:B((a,v)=>{if(!v)throw 4;return(a%v)|0});break;
  case 21:B((a,v)=>{if(!v)throw 4;return((a>>>0)/(v>>>0))|0});break;
  case 22:B((a,v)=>{if(!v)throw 4;return((a>>>0)%(v>>>0))|0});break;
  case 23:if(s<1)throw 2;S[s-1]=(-S[s-1])|0;q++;break;
  case 24:B((a,v)=>a&v);break;
  case 25:B((a,v)=>a|v);break;
  case 26:B((a,v)=>a^v);break;
  case 27:if(s<1)throw 2;S[s-1]=~S[s-1];q++;break;
  case 28:B((a,v)=>a<<(v&31));break;
  case 29:B((a,v)=>a>>(v&31));break;
  case 30:B((a,v)=>(a>>>(v&31))|0);break;
  case 32:B((a,v)=>a===v?1:0);break;
  case 33:B((a,v)=>a<v?1:0);break;
  case 34:B((a,v)=>(a>>>0)<(v>>>0)?1:0);break;
  case 48:if(q+2>=p.length)throw 9;{const f=(p[q+1]|p[q+2]<<8)<<16>>16;q+=3+f}break;
  case 49:if(q+2>=p.length)throw 9;if(s<1)throw 2;{const f=(p[q+1]|p[q+2]<<8)<<16>>16,v=S[--s];q=v===0?q+3+f:q+3}break;
  case 50:if(q+2>=p.length)throw 9;if(s<1)throw 2;{const f=(p[q+1]|p[q+2]<<8)<<16>>16,v=S[--s];q=v!==0?q+3+f:q+3}break;
  case 51:if(q+2>=p.length)throw 9;if(c>=64)throw 7;C[c++]=q+3;q=p[q+1]|p[q+2]<<8;break;
  case 52:if(c<1)throw 8;q=C[--c];break;
  case 64:if(s<1)throw 2;{const a=S[s-1];if(a<0||a>255)throw 6;S[s-1]=M[a]}q++;break;
  case 65:if(s<2)throw 2;{const a=S[--s],v=S[--s];if(a<0||a>255)throw 6;M[a]=v}q++;break;
  case 80:if(s<1)throw 2;{const v=S[--s],t=String(v);if(o.length+t.length>65536)throw 11;for(let i=0;i<t.length;i++)o.push(t.charCodeAt(i))}q++;break;
  case 81:if(s<1)throw 2;{const v=S[--s];if(o.length+1>65536)throw 11;o.push(v&255)}q++;break;
  case 82:if(s>=256)throw 3;S[s++]=k<b.length?b[k++]:-1;q++;break;
  case 83:if(s<1)throw 2;return[o,S[--s]&255];
  default:throw 5;
  }
 }}catch(x){return[o,typeof x==='number'?x:99]}
}
for(const id of r(I).sort()){
 const p=a(I+'/'+id+'/program.bin'),b=a(I+'/'+id+'/input.bin'),[o,e]=run(p,b);
 m(O+'/'+id,{recursive:true});
 w(O+'/'+id+'/stdout.bin',Buffer.from(o));
 w(O+'/'+id+'/exit.txt',e+'\n');
}
