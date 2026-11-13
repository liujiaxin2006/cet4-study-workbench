import {sql} from 'kysely';
import {db} from '../helpers/db';
import {getServerUserSession} from '../helpers/getServerUserSession';
import {NotAuthenticatedError} from '../helpers/getSetServerSession';
import {cetReply} from '../helpers/cetReply';
import {practiceModel,examKinds,type PracticePaper,type PracticeState} from '../helpers/practiceModel';
import type {PracticeCatalog} from './practice-catalog_GET.schema';
export async function handle(request:Request){try{
 const {user}=await getServerUserSession(request);
 const [rows,attempts,reviews]=await Promise.all([db.selectFrom('cetReviewPapers').select('payload').orderBy('id','desc').execute(),sql<{paperId:string;groupId:string;state:PracticeState}>`SELECT paper_id,group_id,state FROM cet_practice_attempts WHERE user_id=${user.id}`.execute(db),sql<{paperId:string;groupId:string;dueAt:Date;stage:number}>`SELECT paper_id,group_id,due_at,stage FROM cet_practice_reviews WHERE user_id=${user.id} AND stage<3`.execute(db)]);
 const papers=rows.map(r=>{const p=r.payload as unknown as PracticePaper;return {id:p.id,title:p.title,exam:p.exam,status:p.status,issues:p.quality?.issues||[],groups:p.groups.map(g=>{const a=attempts.rows.find(a=>a.paperId===p.id&&a.groupId===g.id)?.state;const review=reviews.rows.find(r=>r.paperId===p.id&&r.groupId===g.id);return {id:g.id,kind:g.kind,title:g.title,questions:g.questions.length,ready:practiceModel.ready(p,g),issues:practiceModel.issues(g),submitted:a?.attempt.submittedGroups.includes(g.id)||false,lastPracticedAt:a?.history.at(-1)?.at,firstScore:a?.firstScore,reviewDueAt:review?new Date(review.dueAt).toISOString():undefined,reviewStage:review?.stage};})};});
 const ready=papers.flatMap(p=>p.groups.filter(g=>g.ready));
 const types=Object.entries(examKinds).map(([kind,t])=>{const groups=ready.filter(g=>g.kind===kind);return {kind,...t,groups:groups.length,questions:groups.reduce((n,g)=>n+g.questions,0),firstCorrect:groups.reduce((n,g)=>n+(g.firstScore?.correct||0),0),firstAnswered:groups.reduce((n,g)=>n+(g.firstScore?.total||0),0),due:groups.filter(g=>g.reviewDueAt&&Date.parse(g.reviewDueAt)<=Date.now()).length};});
 const data:PracticeCatalog={papers,types,summary:{papers:papers.length,readyPapers:papers.filter(p=>p.groups.some(g=>g.ready)).length,readyGroups:ready.length,readyQuestions:ready.reduce((n,g)=>n+g.questions,0),due:types.reduce((n,t)=>n+t.due,0)},generatedAt:new Date().toISOString()};return cetReply(data,{headers:{'Cache-Control':'no-store'}});
 }catch(e){return cetReply({error:e instanceof NotAuthenticatedError?'请先登录。':'题库尚未就绪，请稍后重试。'},{status:e instanceof NotAuthenticatedError?401:503});}}
