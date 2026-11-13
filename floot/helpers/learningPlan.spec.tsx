import {learningPlan} from './learningPlan';
import {mistakeReview} from './mistakeReview';
describe('calendar planning and delayed review',()=>{
 it('changes the countdown at Shanghai midnight rather than UTC midnight',()=>{expect(learningPlan.daysUntil('2026-12-12',new Date('2026-11-13T15:59:00Z'))).toBe(29);expect(learningPlan.daysUntil('2026-12-12',new Date('2026-11-13T16:01:00Z'))).toBe(28);});
 it('keeps every budget bounded while changing the focus',()=>{for(const n of [30,60,90])for(const focus of ['auto','reading','listening','writing'])expect(learningPlan.tasks(n,focus).reduce((s,t)=>s+t.time,0)).toBe(n);});
 it('requires delayed retrieval, and does not advance twice on the same day',()=>{const now=Date.parse('2026-11-13T02:00:00Z');const item={id:'x',area:'reading' as const,prompt:'p',note:'n',createdAt:new Date(now).toISOString(),resolved:false};const first=mistakeReview.grade(item,true,true,now);const repeated=mistakeReview.grade(first,true,true,now+1000);expect(repeated.reviewStage).toBe(1);expect(repeated.resolved).toBeFalse();expect(mistakeReview.grade(first,true,false,now+86400000).reviewStage).toBe(0);});
});
