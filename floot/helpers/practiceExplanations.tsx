import type {Analysis,ReviewGroup,ReviewQuestion} from './cetReview';
import {wordBank} from './wordBank';
const meanings=new Map(wordBank.map(w=>[w.word,w.meaning]));
const plain=(s:string)=>s.toLowerCase().replace(/[^a-z]+/g,' ').trim();
/** Source-grounded reading aids. This does not invent an answer or certify mastery. */
export function practiceExplanations(group:ReviewGroup,q:ReviewQuestion):Analysis|undefined{
 if(!q.answer)return undefined;
 const previous=q.analysis;let next=previous?{...previous}:undefined;
 if(group.kind==='matching'){
  const paragraph=group.paragraphs.find(p=>p.label===q.answer);if(!paragraph)return previous;
  const shared=[...new Set(plain(q.prompt).split(' ').filter(w=>w.length>4&&plain(paragraph.text).split(' ').includes(w)))].slice(0,5);
  next={kind:'段落匹配原文对照',action:'对照陈述与整段原文，检查人物、范围和否定词；不要只凭重复单词判断。',explanation:`本题陈述：${q.prompt}\n对应原文 ${paragraph.label} 段。${shared.length?'可先检查共同出现的表达：'+shared.join('、')+'。':''}再核对陈述是否保留原文的对象、条件和范围。`,...previous,evidence:paragraph.text,paragraph:paragraph.label};
 }
 if(group.kind==='cloze'){
  const marker='['+q.number+']',paragraph=group.paragraphs.find(p=>p.text.includes(marker));if(!paragraph)return previous;
  const at=paragraph.text.indexOf(marker),left=paragraph.text.slice(0,at),right=paragraph.text.slice(at+marker.length);
  const start=Math.max(left.lastIndexOf('. '),left.lastIndexOf('? '),left.lastIndexOf('! '));
  const end=right.search(/[.!?](?:\s|$)/);const evidence=(start>=0?left.slice(start+2):left)+marker+(end>=0?right.slice(0,end+1):right);
  const word=q.choices[q.answer],meaning=meanings.get(word?.toLowerCase());
  next={kind:'选词填空原文对照',action:'把词填回完整句子，再同时检查词性、搭配和上下文；仅凭中文释义不能排除其他选项。',explanation:`参考选项 ${q.answer}：${word}${meaning?'（'+meaning+'）':''}。\n填回后的句子：${evidence.replace(marker,word)}\n复盘时先判断空格承担的句子成分，再对照前后搭配和整篇含义。`,...previous,evidence,paragraph:paragraph.label};
 }
 if(group.kind==='reading'&&previous){
  if(!previous.evidence){
   const locator=previous.explanation.split('定位').slice(1).join('定位').split(/详解|点睛/)[0]||'';
   const anchor=plain(locator);const candidates:{text:string;label:string}[]=[];
   if(anchor.split(' ').length>=7)for(const p of group.paragraphs)for(const sentence of p.text.match(/[^.!?]+[.!?]?/g)||[]){
    const words=plain(sentence).split(' ');let found=false;
    for(let i=0;i<=words.length-7;i++){const phrase=words.slice(i,i+7).join(' ');if((' '+anchor+' ').includes(' '+phrase+' ')){found=true;break;}}
    if(found&&sentence.trim().length>=35)candidates.push({text:sentence.trim(),label:p.label});
   }
   if(candidates.length===1)next={...previous,evidence:candidates[0].text,paragraph:candidates[0].label};
  }
  if(!Object.keys(previous.options||{}).length){
   const detail=previous.explanation.split('点睛').slice(1).join('点睛').split(/高频词汇|Part\s+[IVX]+/)[0];
   const markers=[...detail.matchAll(/(?:^|[\s，。；;])([A-D])\s*[)）]/g)];const options:Record<string,string>={};
   for(let i=0;i<markers.length;i++){const m=markers[i],k=m[1],text=detail.slice(m.index!+m[0].length,markers[i+1]?.index??detail.length).trim();if(options[k]||text.length>2000||[...text.matchAll(/[\u4e00-\u9fff]/g)].length<8)continue;options[k]=text;}
   if(Object.keys(options).length>=2)next={...next!,options};
  }
 }
 return next;
}
