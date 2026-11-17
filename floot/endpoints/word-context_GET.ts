import {sql} from 'kysely';
import {z} from 'zod';
import {db} from '../helpers/db';
import {getServerUserSession} from '../helpers/getServerUserSession';
import {NotAuthenticatedError} from '../helpers/getSetServerSession';
import {cetReply} from '../helpers/cetReply';
import {practiceModel,type PracticePaper} from '../helpers/practiceModel';
import {wordBank} from '../helpers/wordBank';
const cards=new Map(wordBank.map(w=>[w.word,w]));
export async function handle(request:Request){try{
 await getServerUserSession(request);
 const word=z.string().regex(/^[a-z]{2,30}$/).parse(new URL(request.url).searchParams.get('word'));
 const card=cards.get(word);if(!card)return cetReply({error:'词库中没有这个词。'},{status:404});
 const forms=[...new Set([word,...(card.forms||[])])].filter(f=>/^[a-z]+(?:'[a-z]+)?$/.test(f));
 const pattern=new RegExp('\\b(?:'+forms.join('|')+')\\b','i');
 // Search every published package, not just the newest thirty. Return only
 // published source paragraphs; never search answers, references or commentary.
 const rows=await sql<{payload:PracticePaper}>`SELECT payload FROM cet_review_papers WHERE payload->>'status'='published' ORDER BY id DESC`.execute(db);
 const contexts=[];const seen=new Set<string>();
 for(const {payload:paper} of rows.rows)for(const group of paper.groups){
  if(!['reading','matching','cloze'].includes(group.kind)||!practiceModel.ready(paper,group))continue;
  for(const paragraph of group.paragraphs){
   const text=paragraph.text,match=pattern.exec(text);if(!match)continue;
   const fingerprint=text.toLowerCase().replace(/[^a-z]/g,'');if(seen.has(fingerprint))continue;seen.add(fingerprint);
   const start=Math.max(0,match.index-220),end=Math.min(text.length,match.index+match[0].length+420);
   contexts.push({paper:paper.title,group:group.title,paperId:paper.id,groupId:group.id,paragraph:paragraph.label,matchedForm:match[0],text:(start?'…':'')+text.slice(start,end)+(end<text.length?'…':'')});
   if(contexts.length===3)return cetReply({contexts});
  }
 }
 return cetReply({contexts});
 }catch(e){return cetReply({error:e instanceof NotAuthenticatedError?'请先登录。':'读取语境失败，请重试。'},{status:e instanceof NotAuthenticatedError?401:e instanceof z.ZodError?400:500});}}
