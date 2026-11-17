import type {StudyState} from '../endpoints/study-progress_GET.schema';
import {learningPlan} from './learningPlan';
type Card={word:string;meaning:string};type Session=NonNullable<StudyState['vocabularySession']>;
export type Recall='forgotten'|'hesitant'|'independent';
const DAY=86400000,intervals=[1,3,7,14,30,60];
function daily(state:StudyState,date:string){return state.vocabularyDaily?.[date]||{newWords:[],reviewedWords:[],independent:0,hesitant:0,forgotten:0,delayedAttempts:0,delayedIndependent:0};}
function start(state:StudyState,cards:Card[],date:string,limit:number,now=Date.now(),reviewOnly=false,extraReview=false):Session{
 const stats=daily(state,date),budget=Math.max(0,20-stats.reviewedWords.length);
 const due=cards.filter(c=>{const w=state.words[c.word];return w&&Date.parse(w.dueAt)<=now&&!(w.failuresDate===date&&(w.failuresToday||0)>=3);}).sort((a,b)=>Date.parse(state.words[a.word].dueAt)-Date.parse(state.words[b.word].dueAt)).slice(0,extraReview?10:budget);
 const remaining=Math.max(0,(state.preferences?.dailyNewWords||20)-stats.newWords.length);
 const fresh=reviewOnly?[]:cards.filter(c=>!state.words[c.word]).slice(0,Math.min(5,remaining));
 const queue:string[]=[];const max=Math.min(10,limit);while(queue.length<max&&(due.length||fresh.length)){if(due.length)queue.push(due.shift()!.word);if(queue.length<max&&fresh.length)queue.push(fresh.shift()!.word);}
 return {date,startedAt:new Date(now).toISOString(),queue,total:queue.length,missed:[],deferred:[],attempts:{}};
}
function grade(state:StudyState,card:Card,result:Recall|boolean,now=Date.now()):StudyState{
 const session=state.vocabularySession;if(!session||session.queue[0]!==card.word)throw Error('词卡已变化，请重新查看。');
 const rating:Recall=typeof result==='boolean'?(result?'independent':'forgotten'):result,remembered=rating==='independent';
 const date=learningPlan.dateKey(new Date(now)),at=new Date(now).toISOString(),prior=state.words[card.word];
 const priorDay=prior?.lastReviewedAt?learningPlan.dateKey(new Date(prior.lastReviewedAt)):null;
 // Delayed means a due recall on a later day, at least 24h after the last rating.
 const delayed=!!prior&&Date.parse(prior.dueAt)<=now&&priorDay!==date&&(!prior.lastReviewedAt||now-Date.parse(prior.lastReviewedAt)>=DAY);
 const failures=Math.min(3,(prior?.failuresDate===date?prior.failuresToday||0:0)+(remembered?0:1));
 const attempts=Math.min(3,(session.attempts[card.word]||0)+1),queue=session.queue.slice(1),deferred=[...session.deferred];
 if(!remembered){if(failures>=3)deferred.push(card.word);else queue.splice(Math.min(3,queue.length),0,card.word);}
 const previousStage=prior?.reviewStage??Math.max(0,intervals.reduce((n,i,index)=>i<=(prior?.intervalDays||1)?index:n,0));
 const stage=rating==='forgotten'?0:rating==='hesitant'?Math.max(0,previousStage-1):delayed?Math.min(5,previousStage+1):previousStage;
 const intervalDays=remembered?intervals[stage]:1;
 const delayedSuccesses=rating==='forgotten'?0:Math.min(100,(prior?.delayedSuccesses||0)+(delayed&&remembered?1:0));
 const dueAt=new Date(now+intervalDays*DAY).toISOString();
 const mistakes=state.mistakes.map(m=>m.area==='vocabulary'&&m.prompt===card.word?{...m,resolved:remembered&&delayedSuccesses>=2,lastReviewedAt:at,dueAt}:m);
 if(!remembered&&!mistakes.some(m=>m.area==='vocabulary'&&m.prompt===card.word)){
  if(mistakes.length>=500){const index=mistakes.findIndex(m=>m.resolved);if(index>=0)mistakes.splice(index,1);}
  if(mistakes.length<500)mistakes.push({id:'word-'+card.word+'-'+now,area:'vocabulary',prompt:card.word,note:'复习词义：'+card.meaning,createdAt:at,resolved:false,dueAt});
 }
 const stats=daily(state,date);
 const oldWord=!!prior&&learningPlan.dateKey(new Date(prior.introducedAt||prior.lastReviewedAt||0))!==date;
 const nextStats={...stats,newWords:[...new Set([...stats.newWords,...(!prior?[card.word]:[])])],reviewedWords:[...new Set([...stats.reviewedWords,...(oldWord?[card.word]:[])])],[rating]:stats[rating]+1,delayedAttempts:stats.delayedAttempts+(delayed?1:0),delayedIndependent:stats.delayedIndependent+(delayed&&remembered?1:0)};
 const vocabularyDaily=Object.fromEntries(Object.entries({...state.vocabularyDaily,[date]:nextStats}).sort(([a],[b])=>b.localeCompare(a)).slice(0,35));
 return {...state,vocabularyDaily,words:{...state.words,[card.word]:{...prior,introducedAt:prior?.introducedAt||(prior?.lastReviewedAt)||at,failuresDate:date,failuresToday:failures,lastRecall:rating,reviewStage:stage,repetitions:remembered?Math.min(100,(prior?.repetitions||0)+(delayed||!prior?1:0)):0,intervalDays,dueAt,lastResult:remembered?'remembered':'again',lastReviewedAt:at,delayedSuccesses,history:[...(prior?.history||[]),{at,remembered,delayed,intervalDays}].slice(-20)}},vocabularySession:{...session,queue,missed:[...new Set([...session.missed,...(!remembered?[card.word]:[])])],deferred:[...new Set(deferred)],attempts:{...session.attempts,[card.word]:attempts}},mistakes};
}
export const vocabularyPractice={start,grade,daily};
