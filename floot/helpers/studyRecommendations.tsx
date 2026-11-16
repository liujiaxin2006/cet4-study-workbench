import type {StudyState} from '../endpoints/study-progress_GET.schema';
import type {PracticeCatalog} from '../endpoints/practice-catalog_GET.schema';
import {learningPlan} from './learningPlan';
export function studyRecommendations(state:StudyState,catalog:PracticeCatalog|undefined,now=Date.now()){
 const today=learningPlan.dateKey(new Date(now));const all=(catalog?.papers||[]).flatMap(p=>p.groups.filter(g=>g.ready).map(g=>({...g,paperId:p.id})));
 const current=all.filter(g=>g.inProgress).sort((a,b)=>(b.lastSavedAt||'').localeCompare(a.lastSavedAt||''))[0];
 const dueWords=Object.values(state.words).filter(w=>Date.parse(w.dueAt)<=now).length;
 const wordDone=Object.values(state.words).filter(w=>w.lastReviewedAt&&learningPlan.dateKey(new Date(w.lastReviewedAt))===today).length;
 const doneToday=all.filter(g=>g.lastPracticedAt&&learningPlan.dateKey(new Date(g.lastPracticedAt))===today).length;
 const review=all.filter(g=>g.reviewDueAt&&Date.parse(g.reviewDueAt)<=now).sort((a,b)=>(a.reviewDueAt||'').localeCompare(b.reviewDueAt||''))[0];
 const fresh=all.find(g=>!g.submitted&&g.kind==='reading')||all.find(g=>!g.submitted);
 const queued=state.vocabularySession?.date===today&&!!state.vocabularySession.queue.length;
 const tasks:{title:string;label:string;target:'words'|'practice';selection?:{paperId:string;groupId:string}}[]=[];
 if(current)tasks.push({title:current.title,label:'接着上次的进度',target:'practice',selection:{paperId:current.paperId,groupId:current.id}});
 if(queued||dueWords)tasks.push({title:queued?'继续这一组单词':'复习 '+dueWords+' 个到期词',label:'到期词优先',target:'words'});
 if(review)tasks.push({title:review.title,label:'回看上次的错题',target:'practice',selection:{paperId:review.paperId,groupId:review.id}});
 if(fresh)tasks.push({title:fresh.title,label:'做一组真题',target:'practice',selection:{paperId:fresh.paperId,groupId:fresh.id}});
 if(!tasks.some(t=>t.target==='words'))tasks.push({title:'学一组单词',label:'按自己的节奏来',target:'words'});
 return {tasks,wordDone,doneToday,dueWords};
}
