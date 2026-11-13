import type {StudyState} from '../endpoints/study-progress_GET.schema';
import {learningPlan} from './learningPlan';
export const mistakeReview={
 due(item:StudyState['mistakes'][number],now=Date.now()){return !item.resolved&&(!item.dueAt||Date.parse(item.dueAt)<=now);},
 grade(item:StudyState['mistakes'][number],correct:boolean,confident:boolean,now=Date.now()){
  const sameDay=item.lastReviewedAt&&learningPlan.dateKey(new Date(item.lastReviewedAt))===learningPlan.dateKey(new Date(now));
  const stage=correct&&confident?Math.min(3,(item.reviewStage||0)+(sameDay?0:1)):0;
  const delay=correct&&confident?[1,1,3,7][stage]:1;
  return {...item,reviewStage:stage,resolved:stage>=3,lastReviewedAt:new Date(now).toISOString(),dueAt:new Date(now+delay*86400000).toISOString(),reviewAttempts:(item.reviewAttempts||0)+1};
 }
};
