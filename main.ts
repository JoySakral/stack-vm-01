import{readFileSync,readdirSync,mkdirSync,writeFileSync}from'node:fs';
import{join}from'node:path';
const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
function run(P:Buffer,N:Buffer):[Buffer,number]{
let s:number[]=[],c:number[]=[],M=new Int32Array(256),pc=0,ip=0,o:number[]=[],k=0;
const push=(v:number)=>{if(s.length>255)throw 3;s.push(v|0)},need=(n:number)=>{if(s.length<n)throw 2},bin=(f:(a:number,b:number)=>number)=>{need(2);const b=s.pop()as number,a=s.pop()as number;push(f(a,b))};
try{for(;;){
if(k++>=1e6)throw 10;
if(pc<0||pc>=P.length)throw 9;
const op=P[pc];
if(op>83||op>7&&op<16||op>34&&op<48||op>52&&op<64||op>65&&op<80)throw 5;
const L=op==1?1:op==2?4:op>=48&&op<52?2:0;
if(pc+1+L>P.length)throw 9;
switch(op){
case 0:return[Buffer.from(o),0];
case 1:push(P[pc+1]>127?P[pc+1]-256:P[pc+1]);break;
case 2:push(P.readInt32LE(pc+1));break;
case 3:need(1);s.pop();break;
case 4:need(1);push(s[s.length-1]);break;
case 5:need(2);{const t=s[s.length-1];s[s.length-1]=s[s.length-2];s[s.length-2]=t}break;
case 6:need(2);push(s[s.length-2]);break;
case 7:need(3);{const a=s[s.length-3];s.splice(s.length-3,1);s.push(a)}break;
case 16:bin((a,b)=>a+b);break;
case 17:bin((a,b)=>a-b);break;
case 18:bin((a,b)=>Math.imul(a,b));break;
case 19:bin((a,b)=>{if(!b)throw 4;return Math.trunc(a/b)});break;
case 20:bin((a,b)=>{if(!b)throw 4;return a%b});break;
case 21:bin((a,b)=>{if(!b)throw 4;return(a>>>0)/(b>>>0)});break;
case 22:bin((a,b)=>{if(!b)throw 4;return(a>>>0)%(b>>>0)});break;
case 23:need(1);s[s.length-1]=-s[s.length-1]|0;break;
case 24:bin((a,b)=>a&b);break;
case 25:bin((a,b)=>a|b);break;
case 26:bin((a,b)=>a^b);break;
case 27:need(1);s[s.length-1]=~s[s.length-1];break;
case 28:bin((a,b)=>a<<(b&31));break;
case 29:bin((a,b)=>a>>(b&31));break;
case 30:bin((a,b)=>a>>>(b&31));break;
case 32:bin((a,b)=>a==b?1:0);break;
case 33:bin((a,b)=>a<b?1:0);break;
case 34:bin((a,b)=>(a>>>0)<(b>>>0)?1:0);break;
case 48:pc=pc+3+P.readInt16LE(pc+1);continue;
case 49:need(1);{const v=s.pop()as number;pc=v?pc+3:pc+3+P.readInt16LE(pc+1)}continue;
case 50:need(1);{const v=s.pop()as number;pc=v?pc+3+P.readInt16LE(pc+1):pc+3}continue;
case 51:if(c.length>63)throw 7;c.push(pc+3);pc=P.readUInt16LE(pc+1);continue;
case 52:if(!c.length)throw 8;pc=c.pop()as number;continue;
case 64:need(1);{const a=s.pop()as number;if(a<0||a>255)throw 6;s.push(M[a])}break;
case 65:need(2);{const a=s.pop()as number,v=s.pop()as number;if(a<0||a>255)throw 6;M[a]=v}break;
case 80:need(1);{const v=s.pop()as number,t=String(v);if(o.length+t.length>65536)throw 11;for(let i=0;i<t.length;i++)o.push(t.charCodeAt(i))}break;
case 81:need(1);{const v=s.pop()as number;if(o.length>65535)throw 11;o.push(v&255)}break;
case 82:push(ip<N.length?N[ip++]:-1);break;
case 83:need(1);return[Buffer.from(o),(s.pop()as number)&255];
}
pc+=1+L;
}}catch(e){if(typeof e=='number')return[Buffer.from(o),e];throw e}
}
for(const d of readdirSync(I).sort()){
const[ob,ec]=run(readFileSync(join(I,d,'program.bin')),readFileSync(join(I,d,'input.bin')));
mkdirSync(join(O,d),{recursive:true});
writeFileSync(join(O,d,'stdout.bin'),ob);
writeFileSync(join(O,d,'exit.txt'),ec+'\n');
}
