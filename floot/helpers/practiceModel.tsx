import {cetReview,type ReviewPaper,type ReviewGroup,type ReviewAttempt} from './cetReview';
import {learningPlan} from './learningPlan';
export const examKinds={news:{name:'短篇新闻',count:7,weight:7},conversation:{name:'长对话',count:8,weight:8},'listening-passage':{name:'听力篇章',count:10,weight:20},cloze:{name:'选词填空',count:10,weight:5},matching:{name:'长篇匹配',count:10,weight:10},reading:{name:'仔细阅读',count:10,weight:20},writing:{name:'短文写作',count:1,weight:15},translation:{name:'段落翻译',count:1,weight:15}} as const;
export type PracticeState={attempt:ReviewAttempt;confidence:Record<string,boolean>;assisted?:boolean;history:{at:string;correct:number;total:number;uncertain:number;assisted?:boolean}[];firstScore?:{correct:number;total:number}};
export type PracticeGroup=ReviewGroup&{publication?:'ready'|'draft';issues?:string[]};
export type PracticePaper=ReviewPaper&{groups:PracticeGroup[];quality?:{issues:string[];sourceVariants?:string[]}};
export const practiceModel={
 empty():PracticeState{return {attempt:cetReview.empty(),confidence:{},history:[]};},
 issues(group:PracticeGroup){
  const errors:string[]=[];const kind=group.kind as keyof typeof examKinds;
  if(!Object.hasOwn(examKinds,kind))return ['题型无法识别'];
  if(['reading','cloze','matching'].includes(kind)&&!group.paragraphs.length)errors.push('缺少完整原文');
  const expected=kind==='reading'?5:examKinds[kind].count;
  if(group.questions.length!==(kind==='writing'||kind==='translation'?0:expected))errors.push('题量与题组结构不符');
  if(kind==='writing'||kind==='translation'){if(!group.task)errors.push('缺少写译题目');}
  for(const q of group.questions){
   if(!q.prompt||q.prompt.length>500||/\u0000/.test(q.prompt))errors.push('题干需要校对');
   if(!q.answer||!Object.hasOwn(q.choices,q.answer))errors.push('参考答案尚未确认');
   const keys=Object.keys(q.choices);
   if(['news','conversation','listening-passage','reading'].includes(kind)&&keys.sort().join('')!=='ABCD')errors.push('选项不完整');
   if(kind==='cloze'&&keys.sort().join('')!=='ABCDEFGHIJKLMNO')errors.push('选词填空必须保留15个备选词');
   if(kind==='cloze'&&Object.values(q.choices).some(v=>!/^([A-Za-z]+)(['’-][A-Za-z]+)*$/.test(v.trim())))errors.push('选词填空的备选词需要校对');
   if(kind==='matching'&&keys.some(k=>!group.paragraphs.some(p=>p.label===k)))errors.push('匹配选项没有对应段落');
   if(keys.some(k=>!q.choices[k].trim()||q.choices[k].length>350))errors.push('选项文字需要校对');


  }
  if(new Set(group.questions.map(q=>q.number)).size!==group.questions.length)errors.push('题号重复');
  if(kind==='cloze'&&new Set(group.questions.map(q=>JSON.stringify(Object.entries(q.choices).sort(([a],[b])=>a.localeCompare(b))))).size>1)errors.push('选词填空的词库不一致');
  if(kind==='cloze'&&new Set(group.questions.map(q=>q.answer)).size!==10)errors.push('选词填空参考答案重复');
  if(['news','conversation','listening-passage'].includes(kind)&&(!group.audio||group.audioStatus!=='verified'))errors.push('录音尚未核验');
  return [...new Set([...errors,...(group.issues||[])])];
 },
 ready(paper:PracticePaper,group:PracticeGroup){return paper.status==='published'&&group.publication==='ready'&&this.issues(group).length===0;},
 visible(paper:PracticePaper,group:PracticeGroup,state:PracticeState){const filtered={...paper,sources:[],reviewNotes:[],groups:[group]};return cetReview.publicPaper(filtered,state.attempt).groups[0];},
 submit(paper:PracticePaper,state:PracticeState,command:Parameters<typeof cetReview.apply>[2]&{assisted?:boolean},confidence:Record<string,boolean>,now=new Date()):PracticeState {
  const attempt=cetReview.apply(paper,state.attempt,command);
  const group=paper.groups.find(g=>g.id===command.groupId)!;
  const certainty=Object.fromEntries(group.questions.map(q=>[String(q.number),confidence[String(q.number)]!==false]));
  const next={...state,attempt,assisted:command.action==='restart'?false:!!(state.assisted||command.assisted),confidence:{...state.confidence,...certainty}};
  if(command.action==='restart'){for(const q of group.questions)delete next.confidence[String(q.number)];}
  if(command.action==='submit'){const score=cetReview.score(group,attempt.answers);if(group.questions.length)next.firstScore=state.firstScore||score;next.history=[...state.history,{at:now.toISOString(),...score,assisted:next.assisted,uncertain:group.questions.filter(q=>certainty[String(q.number)]!==true).length} ].slice(-30);}
  return next;
 },
 review(prior:{stage:number;lastReviewedDate:string|null}|undefined,wrong:number[],uncertain:number[],now=new Date()){
  if(!prior&&!wrong.length&&!uncertain.length)return null;
  const day=learningPlan.dateKey(now);const failed=!!(wrong.length||uncertain.length);
  const stage=failed?0:Math.min(3,(prior?.stage||0)+(prior?.lastReviewedDate===day?0:1));
  return {stage,lastReviewedDate:day,wrongNumbers:[...new Set([...wrong,...uncertain])],reason:wrong.length?'wrong':'uncertain',dueAt:new Date(now.getTime()+[1,1,3,7][stage]*86400000).toISOString()};
 },
};
