import {cetReview,type ReviewPaper,type ReviewGroup,type ReviewAttempt} from './cetReview';
import {learningPlan} from './learningPlan';
export const examKinds={news:{name:'短篇新闻',count:7,weight:7},conversation:{name:'长对话',count:8,weight:8},'listening-passage':{name:'听力篇章',count:10,weight:20},cloze:{name:'选词填空',count:10,weight:5},matching:{name:'长篇匹配',count:10,weight:10},reading:{name:'仔细阅读',count:10,weight:20},writing:{name:'短文写作',count:1,weight:15},translation:{name:'段落翻译',count:1,weight:15}} as const;
export type PracticeState={attempt:ReviewAttempt;confidence:Record<string,boolean>;history:{at:string;correct:number;total:number;uncertain:number}[];firstScore?:{correct:number;total:number}};
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
  if(kind==='writing'||kind==='translation'){if(!group.task||!group.reference||!group.rubric?.length)errors.push('缺少任务、参考表达或自查标准');}
  for(const q of group.questions){
   if(!q.prompt||q.prompt.length>500||/\u0000/.test(q.prompt))errors.push('题干需要校对');
   if(!q.answer||!Object.hasOwn(q.choices,q.answer))errors.push('参考答案尚未确认');
   const keys=Object.keys(q.choices);
   if(['news','conversation','listening-passage','reading'].includes(kind)&&keys.sort().join('')!=='ABCD')errors.push('选项不完整');
   if(kind==='cloze'&&keys.sort().join('')!=='ABCDEFGHIJKLMNO')errors.push('选词填空必须保留15个备选词');
   if(kind==='matching'&&keys.some(k=>!group.paragraphs.some(p=>p.label===k)))errors.push('匹配选项没有对应段落');
   if(keys.some(k=>!q.choices[k].trim()||q.choices[k].length>350))errors.push('选项文字需要校对');
   if(!q.analysis?.explanation)errors.push('解析尚未完成');
   if(kind==='reading'&&(!q.analysis?.evidence||!q.analysis?.options||Object.keys(q.analysis.options).sort().join('')!=='ABCD'))errors.push('仔细阅读缺少证据或逐项解析');
  }
  if(kind==='cloze'&&new Set(group.questions.map(q=>q.answer)).size!==10)errors.push('选词填空参考答案重复');
  if(['news','conversation','listening-passage'].includes(kind)&&(!group.audio||group.audioStatus!=='verified'))errors.push('录音尚未核验');
  return [...new Set(errors)];
 },
 ready(paper:PracticePaper,group:PracticeGroup){return paper.status==='published'&&group.publication==='ready'&&this.issues(group).length===0;},
 visible(paper:PracticePaper,group:PracticeGroup,state:PracticeState){const filtered={...paper,sources:[],reviewNotes:[],groups:[group]};return cetReview.publicPaper(filtered,state.attempt).groups[0];},
 submit(paper:PracticePaper,state:PracticeState,command:Parameters<typeof cetReview.apply>[2],confidence:Record<string,boolean>,now=new Date()):PracticeState {
  const attempt=cetReview.apply(paper,state.attempt,command);
  const group=paper.groups.find(g=>g.id===command.groupId)!;
  const next={...state,attempt,confidence:{...state.confidence,...confidence}};
  if(command.action==='restart'){for(const q of group.questions)delete next.confidence[String(q.number)];}
  if(command.action==='submit'){const score=cetReview.score(group,attempt.answers);if(group.questions.length)next.firstScore=state.firstScore||score;next.history=[...state.history,{at:now.toISOString(),...score,uncertain:group.questions.filter(q=>confidence[String(q.number)]!==true).length}].slice(-30);}
  return next;
 },
 review(prior:{stage:number;lastReviewedDate:string|null}|undefined,wrong:number[],uncertain:number[],now=new Date()){
  if(!prior&&!wrong.length&&!uncertain.length)return null;
  const day=learningPlan.dateKey(now);const failed=!!(wrong.length||uncertain.length);
  const stage=failed?0:Math.min(3,(prior?.stage||0)+(prior?.lastReviewedDate===day?0:1));
  return {stage,lastReviewedDate:day,wrongNumbers:[...new Set([...wrong,...uncertain])],reason:wrong.length?'wrong':'uncertain',dueAt:new Date(now.getTime()+[1,1,3,7][stage]*86400000).toISOString()};
 },
};
